/**
 * Интерфейс для ответа успешной загрузки изображения
 */
export interface UploadResponse {
  // Успешность операции
  success: boolean;
  
  // Имя загруженного файла
  filename?: string;
  
  // Путь к загруженному файлу (относительный)
  path?: string;
  
  // Абсолютный URL к загруженному файлу
  url?: string;
  
  // Сообщение (может использоваться для ошибок или успешных операций)
  message?: string;
  
  // Информация о кастомном пути (если используется)
  customRoute?: string;
  
  // Директория кастомного пути
  customDirectory?: string;
  
  // Описание кастомного пути
  customDescription?: string;
}

/**
 * Интерфейс для ошибки
 */
export interface ErrorResponse {
  // Успешность операции (для ошибки - false)
  success: false;
  
  // Сообщение об ошибке
  message: string;
  
  // Код ошибки (опционально)
  errorCode?: number;
}

/**
 * Интерфейс для статистики оптимизации
 */
export interface OptimizationStats {
  // Количество обработанных файлов
  processed: number;
  
  // Количество успешно оптимизированных файлов
  optimized: number;
  
  // Количество ошибок при оптимизации
  errors: number;
  
  // Количество обработанных больших изображений
  largeImages: number;
  
  // Общий сэкономленный размер (в байтах, опционально)
  savedBytes?: number;
  
  // Средний процент сжатия (опционально)
  averageCompressionPercent?: number;
}
