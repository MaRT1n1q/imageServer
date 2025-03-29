import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import config from '../config/config';
import PathUtils from '../utils/pathUtils';

/**
 * Сервис для работы с изображениями
 */
class ImageService {
  /**
   * Проверка существования файла
   * @param filePath - путь к файлу для проверки
   * @returns Promise<boolean> - существует ли файл
   */
  public async fileExists(filePath: string): Promise<boolean> {
    try {
      await fsPromises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Удаление изображения
   * @param relativePath - относительный путь к изображению
   * @returns Promise<boolean> - успешность удаления
   */
  public async deleteImage(relativePath: string): Promise<boolean> {
    try {
      const safePath = PathUtils.getSafePath(relativePath);
      
      if (!safePath) {
        return false;
      }
      
      const exists = await this.fileExists(safePath);
      
      if (!exists) {
        return false;
      }
      
      await fsPromises.unlink(safePath);
      return true;
    } catch (error) {
      console.error('Ошибка при удалении изображения:', error);
      return false;
    }
  }

  /**
   * Получение информации о изображении
   * @param relativePath - относительный путь к изображению
   * @returns Promise<object | null> - информация о файле или null, если файл не найден
   */
  public async getImageInfo(relativePath: string): Promise<object | null> {
    try {
      const safePath = PathUtils.getSafePath(relativePath);
      
      if (!safePath) {
        return null;
      }
      
      const exists = await this.fileExists(safePath);
      
      if (!exists) {
        return null;
      }
      
      const stats = await fsPromises.stat(safePath);
      
      return {
        name: path.basename(safePath),
        path: PathUtils.toUrlPath(relativePath),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      console.error('Ошибка при получении информации о изображении:', error);
      return null;
    }
  }

  /**
   * Получение списка изображений в указанной директории
   * @param directoryPath - относительный путь к директории
   * @returns Promise<Array<object> | null> - список файлов или null в случае ошибки
   */
  public async listImages(directoryPath: string = ''): Promise<Array<object> | null> {
    try {
      const safePath = PathUtils.getSafePath(directoryPath);
      
      if (!safePath) {
        return null;
      }
      
      const exists = await this.fileExists(safePath);
      
      if (!exists) {
        return null;
      }
      
      const files = await fsPromises.readdir(safePath, { withFileTypes: true });
      const result = [];
      
      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(directoryPath, file.name);
          const fileInfo = await this.getImageInfo(filePath);
          
          if (fileInfo) {
            result.push(fileInfo);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Ошибка при получении списка изображений:', error);
      return null;
    }
  }
}

export default new ImageService();
