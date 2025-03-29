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
