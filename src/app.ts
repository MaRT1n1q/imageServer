import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import config from './config/config';
import imageRoutes from './routes/imageRoutes';
import schedulerService from './services/schedulerService';

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
    
    // Обработка ограничения размера файла (не должно происходить, т.к. мы установили Infinity)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: config.messages.fileTooLarge.replace('%d', (config.maxFileSize / (1024 * 1024)).toString())
      });
    }
    
    // Обработка ограничения по количеству файлов
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: config.messages.tooManyFiles.replace('%d', config.maxFileCount.toString())
      });
    }
    
    // Другие ошибки
    return res.status(500).json({
      success: false,
      message: config.messages.uploadError
    });
  }
  next();
});

// Регистрация маршрутов для работы с изображениями
app.use('/', imageRoutes);

// Редирект с корня сайта на UI загрузки
app.get(config.routes.root, (req: Request, res: Response) => {
  res.redirect(config.routes.uploadUI);
});

// Простой маршрут для проверки доступности сервера
// Добавляем дополнительную проверку для гарантии быстрого ответа
app.get(config.routes.health, (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Запуск планировщика оптимизации изображений, если он включен в конфигурации
if (config.optimizer.scheduledOptimization) {
  schedulerService.startOptimizationScheduler();
}

// Переменная для отслеживания запущенного сервера
let server: any;

// Запуск сервера
const startServer = () => {
  server = app.listen(config.port, () => {
    console.log(`Сервер запущен на порту ${config.port}`);
    console.log(`Путь для загрузки изображений: ${config.uploadsDir}`);
    console.log(`UI доступен по адресу: http://localhost:${config.port}${config.routes.uploadUI}`);
    
    if (config.optimizer.optimizeOnUpload) {
      console.log('Автоматическая оптимизация изображений при загрузке: ВКЛЮЧЕНА');
    }
    
    if (config.optimizer.scheduledOptimization) {
      console.log(`Плановая оптимизация изображений: ВКЛЮЧЕНА (расписание: ${config.optimizer.optimizationSchedule})`);
    }
  });

  // Обработка ошибок сервера
  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`Порт ${config.port} занят. Попытка повторного запуска через 5 секунд...`);
      setTimeout(() => {
        server.close();
        startServer();
      }, 5000);
    } else {
      console.error('Ошибка сервера:', e);
    }
  });
};

// Запускаем сервер
startServer();

// Корректное завершение работы приложения
process.on('SIGINT', () => {
  console.log('Завершение работы сервера...');
  
  // Останавливаем планировщик
  if (config.optimizer.scheduledOptimization) {
    schedulerService.stopOptimizationScheduler();
  }
  
  // Корректно завершаем работу сервера
  if (server) {
    server.close(() => {
      console.log('Сервер остановлен');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Аналогичная обработка для SIGTERM (используется Docker при остановке контейнера)
process.on('SIGTERM', () => {
  console.log('Получен сигнал SIGTERM. Завершение работы сервера...');
  
  // Останавливаем планировщик
  if (config.optimizer.scheduledOptimization) {
    schedulerService.stopOptimizationScheduler();
  }
  
  // Корректно завершаем работу сервера
  if (server) {
    server.close(() => {
      console.log('Сервер остановлен');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

export default app;
