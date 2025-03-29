import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import config from './config/config';
import imageRoutes from './routes/imageRoutes';

// Создаем экземпляр приложения Express
const app = express();

// Middleware для разбора JSON и URL-encoded данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Создание директорий, если они не существуют
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}

// Создание директории public, если она не существует
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Статические файлы
app.use(express.static(publicDir));

// Обработка ошибок Multer
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    console.error('Ошибка Multer:', err);
    
    // Проверяем, является ли ошибка результатом нашей валидации
    try {
      const parsedError = JSON.parse(err.message);
      if (parsedError.success === false) {
        return res.status(400).json(parsedError);
      }
    } catch (e) {
      // Если не удалось распарсить ошибку, используем стандартное сообщение
    }
    
    // Обработка ограничения размера файла
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `Размер файла превышает максимально допустимый (${config.maxFileSize / (1024 * 1024)} МБ)`
      });
    }
    
    // Другие ошибки
    return res.status(500).json({
      success: false,
      message: 'Произошла ошибка при загрузке файла'
    });
  }
  next();
});

// Регистрация маршрутов для работы с изображениями
app.use('/', imageRoutes);

// Редирект с корня сайта на UI загрузки
app.get('/', (req: Request, res: Response) => {
  res.redirect('/upload-ui');
});

// Простой маршрут для проверки доступности сервера
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

// Запуск сервера
app.listen(config.port, () => {
  console.log(`Сервер запущен на порту ${config.port}`);
  console.log(`Путь для загрузки изображений: ${config.uploadsDir}`);
  console.log(`UI доступен по адресу: http://localhost:${config.port}/upload-ui`);
});

export default app;
