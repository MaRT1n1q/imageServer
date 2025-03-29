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
  
  // Максимальное количество файлов для загрузки за раз
  maxFileCount: number;
  
  // Пути для маршрутов
  routes: {
    // Базовый URL для UI загрузки изображений
    uploadUI: string;
    
    // URL для API загрузки изображений
    uploadAPI: string;
    
    // URL для получения информации о сервере
    info: string;
    
    // Проверка состояния сервера
    health: string;
    
    // Корневой маршрут
    root: string;
    
    // URL для запуска оптимизации изображений
    optimize: string;
  };
  
  // Пути к файлам UI
  ui: {
    // Путь к файлу HTML для загрузки изображений
    uploadPage: string;
  };
  
  // Настройки оптимизатора изображений
  optimizer: {
    // Качество JPEG изображений (1-100)
    jpegQuality: number;
    
    // Качество PNG изображений (1-100)
    pngQuality: number;
    
    // Качество WebP изображений (1-100)
    webpQuality: number;
    
    // Автоматическая оптимизация после загрузки
    optimizeOnUpload: boolean;
    
    // Планировщик оптимизации (cron)
    scheduledOptimization: boolean;
    
    // Расписание запуска оптимизации (в формате cron)
    optimizationSchedule: string;
    
    // Настройки для больших изображений
    largeImageHandling: {
      // Размер в байтах, с которого изображение считается большим
      largeImageThreshold: number;
      
      // Использовать потоковую обработку для больших файлов
      useStreaming: boolean;
      
      // Максимальный размер изображения для обработки в одной итерации (в пикселях)
      maxPixelsInMemory: number;
      
      // Временная директория для промежуточных файлов
      tempDir: string;
      
      // Добавляем настройку для принудительного использования потокового копирования
      // вместо fs.rename для взаимодействия между директориями
      forceStreamCopy: boolean;
      
      // Более агрессивное качество для больших изображений
      aggressiveCompression: {
        // Включить более агрессивное сжатие для больших файлов
        enabled: boolean;
        
        // Качество JPEG для больших изображений (1-100)
        jpegQuality: number;
        
        // Качество PNG для больших изображений (1-100)
        pngQuality: number;
        
        // Качество WebP для больших изображений (1-100)
        webpQuality: number;
        
        // Изменять размер очень больших изображений
        resizeOversizedImages: boolean;
        
        // Максимальная ширина/высота после изменения размера (в пикселях)
        maxDimension: number;
      };
    };
  };
  
  // Кастомные пути для API и соответствующих директорий
  customPaths: {
    // Массив объектов, описывающих кастомные пути
    paths: Array<{
      // API путь (например, /image/user/citizen)
      route: string;
      
      // Соответствующая директория для сохранения (относительно uploadsDir)
      directory: string;
      
      // Описание назначения этого пути (опционально)
      description?: string;
    }>;
    
    // Включена ли поддержка кастомных путей
    enabled: boolean;
  };

  // Сообщения для UI и API
  messages: {
    // Сообщение об успешной загрузке одного файла
    uploadSuccess: string;
    
    // Шаблон сообщения об успешной загрузке нескольких файлов
    multipleUploadSuccess: string;
    
    // Сообщение об отсутствии файлов для загрузки
    noFilesUploaded: string;
    
    // Сообщение о необходимости выбрать хотя бы один файл
    pleaseSelectFile: string;
    
    // Сообщение о превышении максимального количества файлов
    tooManyFiles: string;
    
    // Сообщение о превышении размера файла
    fileTooLarge: string;
    
    // Сообщение об ошибке при загрузке
    uploadError: string;
    
    // Сообщение о недопустимом пути загрузки
    invalidPath: string;
    
    // Сообщение о запрете доступа
    accessDenied: string;
    
    // Сообщение о том, что изображение не найдено
    imageNotFound: string;
    
    // Сообщение о серверной ошибке
    serverError: string;
    
    // Сообщение об успешной оптимизации
    optimizationSuccess: string;
    
    // Сообщение об ошибке при оптимизации
    optimizationError: string;
  };
}

// Корневой путь проекта
const rootDir = path.resolve(__dirname, '../..');

// Основная конфигурация
const config: Config = {
  port: Number(process.env.PORT) || 3001, // Изменяем порт по умолчанию на 3001, но при этом
                                         // используем переменную окружения PORT, если она задана
  uploadsDir: path.join(rootDir, 'uploads'),
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxFileCount: 10,
  
  routes: {
    uploadUI: '/upload-ui',
    uploadAPI: '/upload',
    info: '/info',
    health: '/health',
    root: '/',
    optimize: '/optimize'
  },
  
  ui: {
    uploadPage: path.join(rootDir, 'public/index.html')
  },
  
  optimizer: {
    // Повышаем качество оптимизации для обычных изображений
    jpegQuality: 20, // Было 10, повышаем до 85
    pngQuality: 20,  // Было 10, повышаем до 80
    webpQuality: 20, // Было 10, повышаем до 85
    optimizeOnUpload: true,
    scheduledOptimization: false,
    optimizationSchedule: '0 3 * * *', // Каждый день в 3:00
    
    // Настройки для обработки больших изображений
    largeImageHandling: {
      largeImageThreshold: 10 * 1024 * 1024, // 10MB
      useStreaming: true,
      maxPixelsInMemory: 100000000, // 100 мегапикселей
      tempDir: path.join(rootDir, 'temp'),
      
      // Устанавливаем принудительное использование потокового копирования для Docker
      forceStreamCopy: true,
      
      // Настройки агрессивного сжатия для больших изображений - повышаем качество
      aggressiveCompression: {
        enabled: true,
        jpegQuality: 20, // Было 60, повышаем до 75
        pngQuality: 20,  // Было 65, повышаем до 70
        webpQuality: 20, // Было 55, повышаем до 75
        resizeOversizedImages: true,
        maxDimension: 4000 // Максимальный размер 4000px
      }
    }
  },
  
  // Настройки кастомных путей
  customPaths: {
    enabled: true,
    paths: [
      {
        route: '/image/user/citizen',
        directory: 'users/citizens',
        description: 'Изображения граждан'
      },
      {
        route: '/image/user/avatar',
        directory: 'users/avatars',
        description: 'Аватары пользователей'
      },
      {
        route: '/image/product',
        directory: 'products',
        description: 'Изображения товаров'
      },
      {
        route: '/image/banner',
        directory: 'marketing/banners',
        description: 'Баннеры для маркетинговых кампаний'
      }
    ]
  },
  
  messages: {
    uploadSuccess: 'Файл успешно загружен',
    multipleUploadSuccess: 'Успешно загружено %d файлов',
    noFilesUploaded: 'Файл(ы) не был(и) загружен(ы)',
    pleaseSelectFile: 'Пожалуйста, выберите файл для загрузки',
    tooManyFiles: 'Максимально можно загрузить %d файлов за раз',
    fileTooLarge: 'Размер файла превышает максимально допустимый (%d МБ)',
    uploadError: 'Произошла ошибка при загрузке файлов',
    invalidPath: 'Недопустимый путь загрузки',
    accessDenied: 'Доступ запрещен',
    imageNotFound: 'Изображение не найдено',
    serverError: 'Произошла ошибка при получении изображения',
    optimizationSuccess: 'Оптимизация завершена успешно. Обработано: %d, оптимизировано: %d, ошибок: %d',
    optimizationError: 'Ошибка при оптимизации изображений'
  }
};

export default config;
