import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import config from '../config/config';
import { UploadResponse, ErrorResponse } from '../types';

/**
 * Контроллер для работы с изображениями
 */
class ImageController {
  /**
   * Обработчик загрузки изображения
   * @param req - объект запроса Express
   * @param res - объект ответа Express
   * @returns JSON-ответ с результатами загрузки
   */
  public uploadImage = (req: Request, res: Response): Response => {
    try {
      // Проверяем наличие загруженного файла
      if (!req.file) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Файл не был загружен'
        };
        return res.status(400).json(errorResponse);
      }

      // Получаем относительный путь для URL
      const relativePath = path.relative(config.uploadsDir, req.file.path).replace(/\\/g, '/');
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // Формируем ответ (убираем префикс /images/ из URL)
      const response: UploadResponse = {
        success: true,
        filename: req.file.filename,
        path: relativePath,
        url: `${baseUrl}/${relativePath}`,
        message: 'Файл успешно загружен'
      };
      
      return res.status(201).json(response);
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Произошла ошибка при загрузке файла'
      };
      return res.status(500).json(errorResponse);
    }
  };

  /**
   * Обработчик пакетной загрузки изображений
   * @param req - объект запроса Express
   * @param res - объект ответа Express
   * @returns JSON-ответ с результатами пакетной загрузки
   */
  public uploadMultipleImages = (req: Request, res: Response): Response => {
    try {
      // Проверяем наличие загруженных файлов
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: 'Файлы не были загружены'
        };
        return res.status(400).json(errorResponse);
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const results = [];

      // Обрабатываем каждый загруженный файл
      for (const file of req.files as Express.Multer.File[]) {
        const relativePath = path.relative(config.uploadsDir, file.path).replace(/\\/g, '/');
        
        results.push({
          filename: file.filename,
          originalname: file.originalname,
          path: relativePath,
          url: `${baseUrl}/${relativePath}`,
          size: file.size,
          mimetype: file.mimetype
        });
      }

      // Формируем ответ
      const response = {
        success: true,
        message: `Успешно загружено ${req.files.length} файлов`,
        files: results,
        totalCount: req.files.length
      };
      
      return res.status(201).json(response);
    } catch (error) {
      console.error('Ошибка при пакетной загрузке файлов:', error);
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Произошла ошибка при загрузке файлов'
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
        return res.status(403).send('Доступ запрещен');
      }
      
      // Проверяем существование файла
      if (!fs.existsSync(fullPath)) {
        return res.status(404).send('Изображение не найдено');
      }
      
      // Отправляем файл (sendFile не возвращает Response объект)
      res.sendFile(fullPath);
    } catch (error) {
      console.error('Ошибка при получении изображения:', error);
      return res.status(500).send('Произошла ошибка при получении изображения');
    }
  };
}

export default new ImageController();
