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

  constructor() {
    // Создаем директорию для временных файлов при инициализации сервиса
    this.ensureTempDirExists();
  }

  /**
   * Создает временную директорию, если она не существует
   */
  private async ensureTempDirExists(): Promise<void> {
    try {
      await fsPromises.access(config.optimizer.largeImageHandling.tempDir)
        .catch(() => fsPromises.mkdir(config.optimizer.largeImageHandling.tempDir, { recursive: true }));
    } catch (error) {
      console.error('Ошибка при создании временной директории:', error);
    }
  }

  /**
   * Генерирует временное имя файла для оптимизированной копии
   * @param originalPath Путь к оригинальному файлу
   * @returns Путь к временному файлу
   */
  private generateTempPath(originalPath: string): string {
    const ext = path.extname(originalPath);
    const baseName = path.basename(originalPath, ext);
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    return path.join(config.optimizer.largeImageHandling.tempDir, `${baseName}_optimized_${randomSuffix}${ext}`);
  }

  /**
   * Проверяет, оптимизировано ли изображение
   * @param filePath Путь к файлу
   * @returns Promise<boolean> - было ли изображение оптимизировано ранее
   */
  private async isOptimized(filePath: string): Promise<boolean> {
    try {
      // Используем метаданные из потока, чтобы не загружать весь файл в память
      const metadata = await sharp(filePath, { limitInputPixels: false }).metadata();
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
   * Проверяет, является ли файл большим изображением
   * @param filePath Путь к файлу
   * @returns Promise<boolean> - является ли файл большим изображением
   */
  public async isLargeImage(filePath: string): Promise<boolean> {
    try {
      const stats = await fsPromises.stat(filePath);
      return stats.size > config.optimizer.largeImageHandling.largeImageThreshold;
    } catch (error) {
      console.error(`Ошибка при проверке размера файла ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Оптимизирует большое изображение с использованием потоковой обработки
   * @param filePath Путь к файлу для оптимизации
   * @param tempPath Путь для временного файла
   * @returns Promise<boolean> - успешность оптимизации
   */
  private async optimizeLargeImage(filePath: string, tempPath: string): Promise<boolean> {
    try {
      console.log(`Оптимизация большого изображения: ${filePath}`);
      
      // Получаем базовую информацию о изображении без загрузки всего файла в память
      const metadata = await sharp(filePath, { limitInputPixels: false }).metadata();
      
      if (!metadata.width || !metadata.height || !metadata.format) {
        console.error(`Не удалось получить метаданные изображения: ${filePath}`);
        return false;
      }
      
      // Добавляем маркер оптимизации в метаданные
      const exifMetadata = {
        'Comment': this.optimizedMarker,
        'Software': 'Image Server Optimizer'
      };
      
      // Настройки для оптимизации в зависимости от формата
      const format = metadata.format.toLowerCase();
      const outputOptions: any = {};
      
      // Определяем, нужно ли использовать агрессивное сжатие
      const useAggressiveCompression = config.optimizer.largeImageHandling.aggressiveCompression.enabled;
      
      // Настройки качества в зависимости от режима сжатия
      switch (format) {
        case 'jpeg':
        case 'jpg':
          outputOptions.quality = useAggressiveCompression 
            ? config.optimizer.largeImageHandling.aggressiveCompression.jpegQuality
            : config.optimizer.jpegQuality;
          outputOptions.progressive = true;
          break;
        case 'png':
          outputOptions.quality = useAggressiveCompression
            ? config.optimizer.largeImageHandling.aggressiveCompression.pngQuality
            : config.optimizer.pngQuality;
          outputOptions.progressive = true;
          outputOptions.compressionLevel = 9;
          break;
        case 'webp':
          outputOptions.quality = useAggressiveCompression
            ? config.optimizer.largeImageHandling.aggressiveCompression.webpQuality
            : config.optimizer.webpQuality;
          break;
        case 'gif':
          // Sharp не оптимизирует GIF, просто копируем
          break;
        default:
          console.warn(`Неподдерживаемый формат для оптимизации: ${format}`);
          return false;
      }
      
      // Проверяем, нужно ли изменить размер изображения
      const shouldResize = useAggressiveCompression && 
        config.optimizer.largeImageHandling.aggressiveCompression.resizeOversizedImages &&
        (metadata.width > config.optimizer.largeImageHandling.aggressiveCompression.maxDimension || 
         metadata.height > config.optimizer.largeImageHandling.aggressiveCompression.maxDimension);
      
      // Создаем поток для чтения и записи
      const inputStream = fs.createReadStream(filePath);
      let transformer;
      
      // Создаем Sharp трансформер с ограниченным потреблением памяти
      transformer = sharp({
        limitInputPixels: config.optimizer.largeImageHandling.maxPixelsInMemory,
        failOnError: false
      });
      
      // Изменение размера, если требуется
      if (shouldResize) {
        const maxDimension = config.optimizer.largeImageHandling.aggressiveCompression.maxDimension;
        console.log(`Изменение размера большого изображения: ${metadata.width}x${metadata.height} -> max ${maxDimension}px`);
        
        transformer = transformer.resize({
          width: metadata.width > metadata.height ? maxDimension : undefined,
          height: metadata.height > metadata.width ? maxDimension : undefined,
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Добавляем форматирование и метаданные
      transformer = transformer
        .toFormat(format as keyof sharp.FormatEnum, outputOptions)
        .withMetadata({ exif: { IFD0: exifMetadata } });
      
      // Применяем дополнительные оптимизации для больших JPEG изображений
      if ((format === 'jpeg' || format === 'jpg') && useAggressiveCompression) {
        transformer = transformer.jpeg({
          trellisQuantisation: true,
          overshootDeringing: true,
          optimizeScans: true,
          ...outputOptions
        });
      }
      
      const outputStream = fs.createWriteStream(tempPath);
      
      // Подключаем потоки
      return new Promise((resolve, reject) => {
        inputStream.pipe(transformer).pipe(outputStream);
        
        outputStream.on('finish', () => {
          console.log(`Успешно оптимизировано большое изображение: ${filePath}`);
          resolve(true);
        });
        
        outputStream.on('error', (err) => {
          console.error(`Ошибка при записи оптимизированного изображения ${filePath}:`, err);
          reject(false);
        });
        
        transformer.on('error', (err) => {
          console.error(`Ошибка при оптимизации большого изображения ${filePath}:`, err);
          reject(false);
        });
      });
      
    } catch (error) {
      console.error(`Ошибка при оптимизации большого изображения ${filePath}:`, error);
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
      
      // Получаем размеры до оптимизации
      const originalStats = await fsPromises.stat(filePath);
      
      // Проверяем, является ли файл большим
      const isLarge = await this.isLargeImage(filePath);
      
      let success = false;
      
      if (isLarge && config.optimizer.largeImageHandling.useStreaming) {
        // Используем потоковую оптимизацию для больших файлов
        success = await this.optimizeLargeImage(filePath, tempPath);
      } else {
        // Стандартная оптимизация для обычных файлов
        console.log(`Оптимизация ${filePath}...`);
        let sharpInstance = sharp(filePath, { 
          limitInputPixels: config.optimizer.largeImageHandling.maxPixelsInMemory 
        });
        
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

        try {
          // Записываем оптимизированное изображение во временный файл
          await sharpInstance.toFile(tempPath);
          success = true;
        } catch (error: unknown) {
          console.error(`Ошибка Sharp при оптимизации ${filePath}:`, error);
          
          // Проверяем, имеет ли ошибка свойство message и содержит ли оно определенный текст
          if (error instanceof Error && error.message && error.message.includes('Input image exceeds pixel limit')) {
            console.log(`Пробуем потоковую оптимизацию для ${filePath}...`);
            success = await this.optimizeLargeImage(filePath, tempPath);
          }
        }
      }
      
      if (!success) {
        console.error(`Не удалось оптимизировать изображение: ${filePath}`);
        return false;
      }

      // Получаем размеры после оптимизации
      const optimizedStats = await fsPromises.stat(tempPath);
      
      try {
        // Удаляем оригинальный файл
        await fsPromises.unlink(filePath);
        
        // Переименовываем временный файл в оригинальный
        await fsPromises.rename(tempPath, filePath);
      } catch (error) {
        console.error(`Ошибка при замене файла ${filePath}:`, error);
        // Пробуем альтернативный метод копирования если rename не работает
        try {
          const readStream = fs.createReadStream(tempPath);
          const writeStream = fs.createWriteStream(filePath);
          
          await new Promise((resolve, reject) => {
            readStream.pipe(writeStream);
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
          });
          
          await fsPromises.unlink(tempPath);
        } catch (copyError) {
          console.error(`Ошибка при копировании файла ${tempPath} в ${filePath}:`, copyError);
          return false;
        }
      }
      
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
  public async optimizeDirectory(directory: string = config.uploadsDir): Promise<{processed: number, optimized: number, errors: number, largeImages: number}> {
    const stats = {
      processed: 0,
      optimized: 0,
      errors: 0,
      largeImages: 0
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
          stats.largeImages += subStats.largeImages;
        } else if (item.isFile()) {
          // Проверяем, является ли файл изображением
          const ext = path.extname(item.name).toLowerCase();
          const acceptedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          
          if (acceptedExts.includes(ext)) {
            stats.processed++;
            // Проверяем, является ли файл большим изображением
            const isLarge = await this.isLargeImage(itemPath);
            if (isLarge) {
              stats.largeImages++;
            }
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
