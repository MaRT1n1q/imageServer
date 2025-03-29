import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import config from '../config/config';
import optimizerService from '../services/optimizerService';
import { OptimizationStats } from '../types';

/**
 * Контроллер для оптимизации изображений
 */
class OptimizerController {
  /**
   * Запускает оптимизацию всех изображений в указанной директории
   * @param req - объект запроса Express
   * @param res - объект ответа Express
   * @returns JSON-ответ с результатами оптимизации
   */
  public optimizeAllImages = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Получаем относительный путь из запроса или используем корневую папку загрузок
      const relativePath = req.query.path as string || '';
      const directory = relativePath ? path.join(config.uploadsDir, relativePath) : config.uploadsDir;

      // Проверяем, находится ли путь внутри директории загрузок
      if (!directory.startsWith(config.uploadsDir)) {
        return res.status(400).json({
          success: false,
          message: config.messages.invalidPath
        });
      }

      // Показываем информацию об агрессивном сжатии и качестве
      const compressionMode = config.optimizer.largeImageHandling.aggressiveCompression.enabled
        ? `интеллектуальное сжатие для больших изображений (качество ${config.optimizer.largeImageHandling.aggressiveCompression.jpegQuality}%)`
        : `стандартное сжатие (качество ${config.optimizer.jpegQuality}%)`;
      
      // Запускаем оптимизацию
      console.log(`Запуск оптимизации в директории: ${directory} (режим: ${compressionMode})`);
      const stats = await optimizerService.optimizeDirectory(directory);

      // Формируем сообщение с результатами
      const message = config.messages.optimizationSuccess
        .replace('%d', stats.processed.toString())
        .replace('%d', stats.optimized.toString())
        .replace('%d', stats.errors.toString());

      return res.status(200).json({
        success: true,
        message,
        stats: {
          ...stats,
          largeImages: stats.largeImages || 0,
          compressionMode,
          qualitySettings: {
            standardJpegQuality: config.optimizer.jpegQuality,
            standardPngQuality: config.optimizer.pngQuality,
            standardWebpQuality: config.optimizer.webpQuality,
            largeJpegQuality: config.optimizer.largeImageHandling.aggressiveCompression.jpegQuality,
            largePngQuality: config.optimizer.largeImageHandling.aggressiveCompression.pngQuality,
            largeWebpQuality: config.optimizer.largeImageHandling.aggressiveCompression.webpQuality,
          }
        }
      });
    } catch (error) {
      console.error('Ошибка при оптимизации изображений:', error);
      return res.status(500).json({
        success: false,
        message: config.messages.optimizationError
      });
    }
  };

  /**
   * Оптимизирует одно изображение по указанному пути
   * @param req - объект запроса Express
   * @param res - объект ответа Express
   * @returns JSON-ответ с результатом оптимизации
   */
  public optimizeSingleImage = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Получаем путь к изображению
      const imagePath = req.params.path;
      
      if (!imagePath) {
        return res.status(400).json({
          success: false,
          message: 'Путь к изображению не указан'
        });
      }

      // Формируем полный путь к файлу
      const fullPath = path.join(config.uploadsDir, imagePath);
      
      // Проверяем, находится ли запрашиваемый файл внутри директории uploads
      if (!fullPath.startsWith(config.uploadsDir)) {
        return res.status(403).json({
          success: false,
          message: config.messages.accessDenied
        });
      }
      
      // Проверяем размер файла до оптимизации
      let originalSize = 0;
      try {
        const stats = await fsPromises.stat(fullPath);
        originalSize = stats.size;
      } catch (error) {
        console.error('Ошибка при получении размера файла:', error);
      }
      
      // Определяем, является ли файл большим изображением
      const isLarge = await optimizerService.isLargeImage(fullPath);
      
      // Оптимизируем изображение
      console.log(`Запуск оптимизации одиночного изображения: ${fullPath}${isLarge ? ' (большой файл)' : ''}`);
      const result = await optimizerService.optimizeImage(fullPath);
      
      // Если оптимизация прошла успешно, получаем новый размер файла
      let newSize = 0;
      let compressionInfo = {};
      
      if (result) {
        try {
          const stats = await fsPromises.stat(fullPath);
          newSize = stats.size;
          
          // Рассчитываем экономию места
          const savedBytes = originalSize - newSize;
          const savedPercent = originalSize > 0 ? (savedBytes / originalSize) * 100 : 0;
          
          compressionInfo = {
            originalSize,
            newSize,
            savedBytes,
            savedPercent: `${savedPercent.toFixed(2)}%`,
            isLargeFile: isLarge,
            compressionMode: isLarge && config.optimizer.largeImageHandling.aggressiveCompression.enabled ? 
              'агрессивное сжатие' : 'стандартное сжатие'
          };
          
          return res.status(200).json({
            success: true,
            message: 'Изображение успешно оптимизировано',
            path: imagePath,
            compressionInfo
          });
        } catch (error) {
          console.error('Ошибка при получении размера оптимизированного файла:', error);
        }
        
        return res.status(200).json({
          success: true,
          message: 'Изображение успешно оптимизировано',
          path: imagePath
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Не удалось оптимизировать изображение',
          path: imagePath
        });
      }
    } catch (error) {
      console.error('Ошибка при оптимизации изображения:', error);
      return res.status(500).json({
        success: false,
        message: config.messages.optimizationError
      });
    }
  };
  
  /**
   * Обработчик для автоматической оптимизации изображения после загрузки
   * @param filePath - путь к файлу для оптимизации
   */
  public async optimizeAfterUpload(filePath: string): Promise<void> {
    if (config.optimizer.optimizeOnUpload) {
      try {
        // Проверяем, является ли файл большим изображением
        const isLarge = await optimizerService.isLargeImage(filePath);
        if (isLarge) {
          console.log(`Автоматическая оптимизация большого изображения после загрузки: ${filePath} (с сохранением высокого качества)`);
        } else {
          console.log(`Автоматическая оптимизация после загрузки: ${filePath} (с сохранением высокого качества)`);
        }
        await optimizerService.optimizeImage(filePath);
      } catch (error) {
        console.error('Ошибка при автоматической оптимизации:', error);
      }
    }
  }
}

export default new OptimizerController();
