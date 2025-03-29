import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import config from '../config/config';

/**
 * Контроллер для проверки состояния сервера
 */
class HealthController {
  /**
   * Обработчик запроса о состоянии сервера
   * @param req - объект запроса Express
   * @param res - объект ответа Express
   */
  public checkHealth = (req: Request, res: Response): void => {
    try {
      // Проверяем доступность директорий
      const uploadsExists = fs.existsSync(config.uploadsDir);
      const tempExists = fs.existsSync(config.optimizer.largeImageHandling.tempDir);
      
      // Проверяем возможность записи в эти директории
      let uploadsWritable = false;
      let tempWritable = false;
      
      try {
        const testFilePath = path.join(config.uploadsDir, '.health-check');
        fs.writeFileSync(testFilePath, 'test');
        fs.unlinkSync(testFilePath);
        uploadsWritable = true;
      } catch (e) {
        console.error('Ошибка при проверке доступности директории uploads:', e);
      }
      
      try {
        const testFilePath = path.join(config.optimizer.largeImageHandling.tempDir, '.health-check');
        fs.writeFileSync(testFilePath, 'test');
        fs.unlinkSync(testFilePath);
        tempWritable = true;
      } catch (e) {
        console.error('Ошибка при проверке доступности директории temp:', e);
      }
      
      const status = uploadsExists && tempExists && uploadsWritable && tempWritable ? 'UP' : 'DEGRADED';
      
      // Отправляем подробный ответ о состоянии сервера
      res.status(status === 'UP' ? 200 : 503).json({
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        filesystemStatus: {
          uploads: {
            exists: uploadsExists,
            writable: uploadsWritable,
            path: config.uploadsDir
          },
          temp: {
            exists: tempExists,
            writable: tempWritable,
            path: config.optimizer.largeImageHandling.tempDir
          }
        }
      });
    } catch (error) {
      // В случае ошибки отправляем ответ о недоступности сервера
      console.error('Ошибка при проверке здоровья сервера:', error);
      res.status(500).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
}

export default new HealthController();
