import { Request, Response } from 'express';
import config from '../config/config';
import optimizerService from '../services/optimizerService';

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

      // Запускаем оптимизацию
      console.log(`Запуск оптимизации в директории: ${directory}`);
      const stats = await optimizerService.optimizeDirectory(directory);

      // Формируем сообщение с результатами
      const message = config.messages.optimizationSuccess
        .replace('%d', stats.processed.toString())
        .replace('%d', stats.optimized.toString())
        .replace('%d', stats.errors.toString());

      return res.status(200).json({
        success: true,
        message,
        stats
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
      
      // Оптимизируем изображение
      console.log(`Запуск оптимизации одиночного изображения: ${fullPath}`);
      const result = await optimizerService.optimizeImage(fullPath);
      
      if (result) {
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
        console.log(`Автоматическая оптимизация после загрузки: ${filePath}`);
        await optimizerService.optimizeImage(filePath);
      } catch (error) {
        console.error('Ошибка при автоматической оптимизации:', error);
      }
    }
  }
}

// Импорт path внутри файла
import path from 'path';

export default new OptimizerController();
