import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import config from '../config/config';
import { ErrorResponse } from '../types';

/**
 * Создание папки для загрузки, если она не существует
 * @param directory - путь к папке для загрузки изображений
 */
const ensureDirectoryExists = (directory: string): void => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Создаем временную директорию, если она не существует
ensureDirectoryExists(config.optimizer.largeImageHandling.tempDir);

/**
 * Конфигурация хранилища для multer
 */
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Получаем путь для загрузки из запроса или используем путь по умолчанию
    const uploadPath = req.body.path 
      ? path.join(config.uploadsDir, req.body.path) 
      : config.uploadsDir;
    
    // Проверяем, что путь находится внутри основной директории загрузки
    if (!uploadPath.startsWith(config.uploadsDir)) {
      return cb(new Error(config.messages.invalidPath), '');
    }
    
    // Создаем директорию, если она не существует
    ensureDirectoryExists(uploadPath);
    
    console.log(`Загрузка в директорию: ${uploadPath}`);
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Генерация уникального имени файла с оригинальным расширением
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

/**
 * Фильтр файлов для проверки типа загружаемых файлов
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
    const error: ErrorResponse = {
      success: false,
      message: `Недопустимый тип файла. Разрешены только: ${config.allowedMimeTypes.join(', ')}`
    };
    cb(new Error(JSON.stringify(error)));
  }
};

/**
 * Настройка middleware multer для загрузки изображений
 * Поддерживает как одиночные, так и множественные загрузки
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Infinity, // Убираем ограничение размера, будем обрабатывать большие файлы отдельно
    files: config.maxFileCount
  }
});

export default upload;
