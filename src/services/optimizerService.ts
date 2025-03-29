import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import config from '../config/config';
import sharp from 'sharp';
import crypto from 'crypto';

/**
 * Сервис для оптимизации изображений
 */
class OptimizerService {
  // Маркер, который добавляется в метаданные для обозначения оптимизированных изображений
  private readonly optimizedMarker = 'imageServerOptimized';

  /**
   * Генерирует временное имя файла для оптимизированной копии
   * @param originalPath Путь к оригинальному файлу
   * @returns Путь к временному файлу
   */
  private generateTempPath(originalPath: string): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const baseName = path.basename(originalPath, ext);
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    return path.join(dir, `${baseName}_optimized_${randomSuffix}${ext}`);
  }

  /**
   * Проверяет, оптимизировано ли изображение
   * @param filePath Путь к файлу
   * @returns Promise<boolean> - было ли изображение оптимизировано ранее
   */
  private async isOptimized(filePath: string): Promise<boolean> {
    try {
      const metadata = await sharp(filePath).metadata();
      if (metadata.exif) {
        // Проверка наличия маркера в EXIF-данных
        const exifString = metadata.exif.toString();
        return exifString.includes(this.optimizedMarker);
      }
      return false;
    } catch (error) {
      console.error(`Ошибка при проверке оптимизации ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Оптимизирует изображение
   * @param filePath Путь к файлу для оптимизации
   * @returns Promise<boolean> - успешность оптимизации
   */
  public async optimizeImage(filePath: string): Promise<boolean> {
    try {
      // Проверяем, существует ли файл
      const exists = await fsPromises.access(filePath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        console.error(`Файл не существует: ${filePath}`);
        return false;
      }

      // Определяем формат файла
      const ext = path.extname(filePath).toLowerCase();
      
      // Проверяем, оптимизировано ли уже изображение
      const optimized = await this.isOptimized(filePath);
      if (optimized) {
        console.log(`Изображение уже оптимизировано: ${filePath}`);
        return true;
      }
      
      // Создаём временный путь для оптимизированной копии
      const tempPath = this.generateTempPath(filePath);

      console.log(`Оптимизация ${filePath}...`);
      let sharpInstance = sharp(filePath);
      
      // Добавляем маркер оптимизации в метаданные
      const metadata = {
        'Comment': this.optimizedMarker,
        'Software': 'Image Server Optimizer'
      };

      // Применяем разные настройки оптимизации в зависимости от формата
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          sharpInstance = sharpInstance
            .jpeg({
              quality: config.optimizer.jpegQuality,
              progressive: true,
              force: false
            })
            .withMetadata({ exif: { IFD0: metadata } });
          break;
        case '.png':
          sharpInstance = sharpInstance
            .png({
              quality: config.optimizer.pngQuality,
              progressive: true,
              compressionLevel: 9,
              force: false
            })
            .withMetadata({ exif: { IFD0: metadata } });
          break;
        case '.webp':
          sharpInstance = sharpInstance
            .webp({
              quality: config.optimizer.webpQuality,
              force: false
            })
            .withMetadata({ exif: { IFD0: metadata } });
          break;
        case '.gif':
          // Sharp не поддерживает оптимизацию GIF, просто копируем с метаданными
          sharpInstance = sharpInstance
            .withMetadata({ exif: { IFD0: metadata } });
          break;
        default:
          console.log(`Неподдерживаемый формат для оптимизации: ${ext}`);
          return false;
      }

      // Записываем оптимизированное изображение во временный файл
      await sharpInstance.toFile(tempPath);

      // Получаем размеры до и после оптимизации
      const originalStats = await fsPromises.stat(filePath);
      const optimizedStats = await fsPromises.stat(tempPath);
      
      // Удаляем оригинальный файл
      await fsPromises.unlink(filePath);
      
      // Переименовываем временный файл в оригинальный
      await fsPromises.rename(tempPath, filePath);
      
      // Выводим статистику оптимизации
      const savedBytes = originalStats.size - optimizedStats.size;
      const savedPercent = originalStats.size > 0 ? (savedBytes / originalStats.size) * 100 : 0;
      
      console.log(`Оптимизация успешна: ${filePath}`);
      if (savedBytes > 0) {
        console.log(`Сжатие: ${formatBytes(savedBytes)} (${savedPercent.toFixed(2)}%)`);
      } else {
        console.log(`Изображение не требует дополнительной оптимизации (экономия: ${formatBytes(savedBytes)})`);
      }
      
      return true;
    } catch (error) {
      console.error(`Ошибка при оптимизации ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Рекурсивно оптимизирует все изображения в директории
   * @param directory Директория для обработки
   * @returns Promise<{processed: number, optimized: number, errors: number}> - статистика обработки
   */
  public async optimizeDirectory(directory: string = config.uploadsDir): Promise<{processed: number, optimized: number, errors: number}> {
    const stats = {
      processed: 0,
      optimized: 0,
      errors: 0
    };
    
    try {
      // Проверяем, существует ли директория
      const exists = await fsPromises.access(directory)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        console.error(`Директория не существует: ${directory}`);
        return stats;
      }
      
      // Получаем содержимое директории
      const items = await fsPromises.readdir(directory, { withFileTypes: true });
      
      // Обрабатываем каждый элемент
      for (const item of items) {
        const itemPath = path.join(directory, item.name);
        
        if (item.isDirectory()) {
          // Рекурсивно обрабатываем поддиректорию
          const subStats = await this.optimizeDirectory(itemPath);
          stats.processed += subStats.processed;
          stats.optimized += subStats.optimized;
          stats.errors += subStats.errors;
        } else if (item.isFile()) {
          // Проверяем, является ли файл изображением
          const ext = path.extname(item.name).toLowerCase();
          const acceptedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          
          if (acceptedExts.includes(ext)) {
            stats.processed++;
            // Оптимизируем изображение
            const success = await this.optimizeImage(itemPath);
            if (success) {
              stats.optimized++;
            } else {
              stats.errors++;
            }
          }
        }
      }
      
      return stats;
    } catch (error) {
      console.error(`Ошибка при оптимизации директории ${directory}:`, error);
      return stats;
    }
  }
}

/**
 * Форматирование размера файла в человекочитаемый вид
 * @param bytes Размер в байтах
 * @param decimals Количество знаков после запятой
 * @returns Отформатированный размер с единицами измерения
 */
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default new OptimizerService();
