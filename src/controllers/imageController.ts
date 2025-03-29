import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import config from '../config/config';
import { UploadResponse, ErrorResponse } from '../types';
import optimizerController from './optimizerController';
import { promises as fsPromises } from 'fs';
import crypto from 'crypto';

/**
 * Контроллер для работы с изображениями
 */
class ImageController {
  /**
   * Обработчик загрузки изображений (как одиночных, так и множественных)
   * @param req - объект запроса Express
   * @param res - объект ответа Express
   * @returns JSON-ответ с результатами загрузки
   */
  public uploadImages = async (req: Request, res: Response): Promise<Response> => {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const results = [];

      // Проверка на загрузку base64-изображения
      if (req.body && (req.body.base64image || req.body.base64)) {
        // Обработка base64 изображения
        const base64Data = req.body.base64image || req.body.base64;

        if (!base64Data) {
          return res.status(400).json({
            success: false,
            message: 'Данные base64 отсутствуют'
          });
        }

        let uploadPath = config.uploadsDir;
        
        // Получаем путь для сохранения, если он указан
        if (req.body.path) {
          const uploadRelativePath = req.body.path;
          uploadPath = path.join(config.uploadsDir, uploadRelativePath);
          
          // Проверяем, что путь находится внутри основной директории загрузки
          if (!uploadPath.startsWith(config.uploadsDir)) {
            return res.status(400).json({
              success: false,
              message: config.messages.invalidPath
            });
          }
          
          // Создаем директорию, если она не существует
          await fsPromises.mkdir(uploadPath, { recursive: true });
        }

        // Извлекаем MIME тип из строки base64
        let mimeType = '';
        let base64Image = base64Data;
        
        // Проверяем, содержит ли строка префикс data:image/...
        if (base64Data.includes(';base64,')) {
          const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            mimeType = matches[1];
            base64Image = matches[2];
          }
        }
        
        // Проверяем, поддерживается ли данный тип изображения
        if (mimeType && !config.allowedMimeTypes.includes(mimeType)) {
          return res.status(400).json({
            success: false,
            message: `Недопустимый тип файла. Разрешены только: ${config.allowedMimeTypes.join(', ')}`
          });
        }
        
        // Определяем расширение файла на основе MIME типа
        const extension = mimeType ? '.' + mimeType.split('/')[1] : '.jpg';
        
        // Генерируем уникальное имя файла
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileName = `${uniqueSuffix}${extension}`;
        const filePath = path.join(uploadPath, fileName);
        
        // Декодируем и сохраняем изображение
        const imageBuffer = Buffer.from(base64Image, 'base64');
        
        // Проверяем размер файла
        if (imageBuffer.length > config.maxFileSize) {
          return res.status(400).json({
            success: false,
            message: config.messages.fileTooLarge.replace('%d', (config.maxFileSize / (1024 * 1024)).toString())
          });
        }
        
        await fsPromises.writeFile(filePath, imageBuffer);
        
        // Автоматическая оптимизация изображения, если включена соответствующая опция
        if (config.optimizer.optimizeOnUpload) {
          await optimizerController.optimizeAfterUpload(filePath);
        }
        
        // Относительный путь для URL
        const relativePath = path.relative(config.uploadsDir, filePath).replace(/\\/g, '/');
        
        results.push({
          filename: fileName,
          originalname: fileName,
          path: relativePath,
          url: `${baseUrl}/${relativePath}`,
          size: imageBuffer.length,
          mimetype: mimeType || 'image/jpeg'
        });
      } else if (req.files && (Array.isArray(req.files) || req.files.image)) {
        // Стандартная обработка загрузки файлов через multer
        // Проверяем наличие загруженных файлов
        if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
          const errorResponse: ErrorResponse = {
            success: false,
            message: config.messages.noFilesUploaded
          };
          return res.status(400).json(errorResponse);
        }

        const files = Array.isArray(req.files) ? req.files : [req.files.image];

        // Обрабатываем каждый загруженный файл
        for (const file of files as Express.Multer.File[]) {
          const relativePath = path.relative(config.uploadsDir, file.path).replace(/\\/g, '/');
          
          // Автоматическая оптимизация изображения, если включена соответствующая опция
          if (config.optimizer.optimizeOnUpload) {
            await optimizerController.optimizeAfterUpload(file.path);
          }
          
          results.push({
            filename: file.filename,
            originalname: file.originalname,
            path: relativePath,
            url: `${baseUrl}/${relativePath}`,
            size: file.size,
            mimetype: file.mimetype
          });
        }
      } else {
        // Если нет ни файлов, ни base64-данных
        const errorResponse: ErrorResponse = {
          success: false,
          message: config.messages.noFilesUploaded
        };
        return res.status(400).json(errorResponse);
      }

      // Если загружен только один файл, возвращаем информацию о нем
      if (results.length === 1) {
        const fileInfo = results[0];
        const response: UploadResponse = {
          success: true,
          filename: fileInfo.filename,
          path: fileInfo.path,
          url: fileInfo.url,
          message: config.messages.uploadSuccess
        };
        return res.status(201).json(response);
      }

      // Если загружено несколько файлов, возвращаем информацию о всех
      const response = {
        success: true,
        message: config.messages.multipleUploadSuccess.replace('%d', results.length.toString()),
        files: results,
        totalCount: results.length
      };
      
      return res.status(201).json(response);
    } catch (error) {
      console.error('Ошибка при загрузке файлов:', error);
      const errorResponse: ErrorResponse = {
        success: false,
        message: config.messages.uploadError
      };
      return res.status(500).json(errorResponse);
    }
  };

  /**
   * Получение изображения по пути
   * @param req - объект запроса Express
   * @param res - объект ответа Express
   * @returns Response объект Express или void
   */
  public getImage = (req: Request, res: Response): Response | void => {
    try {
      // Получаем путь из параметров запроса (* - означает все сегменты пути)
      const imagePath = req.params[0];
      
      // Формируем полный путь к файлу
      const fullPath = path.join(config.uploadsDir, imagePath);
      
      // Проверяем, находится ли запрашиваемый файл внутри директории uploads
      if (!fullPath.startsWith(config.uploadsDir)) {
        return res.status(403).send(config.messages.accessDenied);
      }
      
      // Проверяем существование файла
      if (!fs.existsSync(fullPath)) {
        return res.status(404).send(config.messages.imageNotFound);
      }
      
      // Отправляем файл (sendFile не возвращает Response объект)
      res.sendFile(fullPath);
    } catch (error) {
      console.error('Ошибка при получении изображения:', error);
      return res.status(500).send(config.messages.serverError);
    }
  };
}

export default new ImageController();
