import path from 'path';

/**
 * Конфигурация для сервера изображений
 */
interface Config {
  // Порт, на котором будет запущен сервер
  port: number;
  
  // Базовый путь для сохранения изображений
  uploadsDir: string;
  
  // Максимальный размер файла для загрузки (в байтах)
  maxFileSize: number;
  
  // Допустимые типы файлов
  allowedMimeTypes: string[];
}

// Корневой путь проекта
const rootDir = path.resolve(__dirname, '../..');

// Основная конфигурация
const config: Config = {
  port: Number(process.env.PORT) || 3000,
  uploadsDir: path.join(rootDir, 'uploads'),
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

export default config;
