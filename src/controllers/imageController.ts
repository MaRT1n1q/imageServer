import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import config from '../config/config';
import { UploadResponse, ErrorResponse } from '../types';
import optimizerController from './optimizerController';

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
      // Проверяем наличие загруженных файлов
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: config.messages.noFilesUploaded
        };
        return res.status(400).json(errorResponse);
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const files = Array.isArray(req.files) ? req.files : [req.files.image];
      const results = [];

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
