# Image Server - Сервер изображений

Комплексное серверное решение на Node.js для загрузки, хранения, получения и оптимизации изображений. Сервер обеспечивает эффективную обработку как небольших, так и крупноформатных изображений с сохранением высокого качества.

## Содержание

1. [Обзор и возможности](#обзор-и-возможности)
2. [Системные требования](#системные-требования)
3. [Установка и запуск](#установка-и-запуск)
   - [Стандартная установка](#стандартная-установка)
   - [Docker-развертывание](#docker-развертывание)
4. [API](#api)
   - [Загрузка изображений](#загрузка-изображений)
   - [Получение изображений](#получение-изображений)
   - [Кастомные пути загрузки](#кастомные-пути-загрузки)
   - [Оптимизация изображений](#оптимизация-изображений)
   - [Информационные конечные точки](#информационные-конечные-точки)
5. [Веб-интерфейс](#веб-интерфейс)
6. [Конфигурация](#конфигурация)
   - [Основные настройки](#основные-настройки)
   - [Настройки оптимизации](#настройки-оптимизации)
   - [Обработка больших изображений](#обработка-больших-изображений)
   - [Настройка кастомных путей](#настройка-кастомных-путей)
7. [Планирование задач](#планирование-задач)
8. [Безопасность](#безопасность)
9. [Рекомендации по производительности](#рекомендации-по-производительности)
10. [Обработка ошибок](#обработка-ошибок)
11. [Разработка и расширение](#разработка-и-расширение)
12. [Лицензия](#лицензия)

## Обзор и возможности

Image Server предоставляет полный набор функций для работы с изображениями:

- **Загрузка изображений**:
  - Одиночная и множественная загрузка через API
  - Поддержка загрузки через удобный веб-интерфейс
  - Возможность указания вложенных директорий для хранения
  - Валидация типов файлов (JPEG, PNG, GIF, WebP)
  - **Кастомные API пути** для организации упорядоченной структуры хранения

- **Оптимизация**:
  - Интеллектуальная оптимизация с сохранением качества
  - Особый подход к большим изображениям со стриминговой обработкой
  - Настраиваемые уровни качества для разных форматов
  - Автоматическая оптимизация после загрузки
  - Плановая оптимизация по расписанию

- **Хранение и доступ**:
  - Прямой доступ к изображениям по URL
  - Защита от path traversal атак
  - Структура директорий, соответствующая URL-путям
  - Автоматическое создание директорий при загрузке

- **Надежность**:
  - Обработка больших файлов с ограниченным потреблением памяти
  - Проверки целостности и обработка ошибок
  - Временные файлы для безопасной обработки
  - Развертывание в Docker с поддержкой томов

## Системные требования

- **Node.js:** версия 14.x или выше
- **NPM:** версия 6.x или выше
- **Пространство на диске:** зависит от объема изображений, рекомендуется минимум 1GB
- **Оперативная память:** рекомендуется минимум 2GB для обработки больших изображений
- **Поддерживаемые ОС:** Linux, Windows, macOS

### Дополнительные требования для Docker:
- Docker 19.03.0+
- Docker Compose 1.27.0+

## Установка и запуск

### Стандартная установка

1. **Клонирование репозитория:**
   ```bash
   git clone <url-репозитория>
   cd imageServer
   ```

2. **Установка зависимостей:**
   ```bash
   npm install
   ```

   Для систем Linux может потребоваться установка дополнительных зависимостей для Sharp:
   ```bash
   apt-get install -y libvips-dev
   ```

3. **Конфигурация:**
   При необходимости отредактируйте файл `src/config/config.ts`.

4. **Сборка проекта:**
   ```bash
   npm run build
   ```

5. **Создание необходимых директорий:**
   ```bash
   mkdir -p uploads temp
   ```

6. **Запуск сервера:**
   ```bash
   npm start
   ```

   Для запуска в режиме разработки:
   ```bash
   npm run dev
   ```

### Docker-развертывание

После запуска сервер будет доступен по адресу: `http://localhost:3001`

#### Использование Docker Compose (рекомендуется)

1. **Запуск с помощью Docker Compose:**
   ```bash
   docker-compose up -d
   ```
   
   Для автоматического создания директорий и запуска:
   ```bash
   chmod +x docker-start.sh
   ./docker-start.sh
   ```

2. **Проверка статуса:**
   ```bash
   docker-compose ps
   ```

3. **Просмотр логов:**
   ```bash
   docker-compose logs -f
   ```

4. **Остановка сервера:**
   ```bash
   docker-compose down
   ```

#### Ручное развертывание с помощью Docker

1. **Сборка образа:**
   ```bash
   docker build -t image-server .
   ```

2. **Запуск контейнера:**
   ```bash
   docker run -d --name image-server \
     -p 3000:3000 \
     -v $(pwd)/uploads:/app/uploads \
     -v $(pwd)/temp:/app/temp \
     image-server
   ```

3. **Проверка статуса:**
   ```bash
   docker ps
   ```

4. **Просмотр логов:**
   ```bash
   docker logs -f image-server
   ```

## API

### Загрузка изображений

#### `POST /upload` - Загрузка изображений

**Form-data параметры для загрузки файлов:**
- `images` или `image`: Файл(ы) изображений (обязательно, если не используется base64)
- `path`: Относительный путь для сохранения, например "users/avatars" (опционально)

**JSON параметры для загрузки base64:**
- `base64image` или `base64`: Строка с данными изображения в формате base64 (обязательно, если не загружается файл)
- `path`: Относительный путь для сохранения (опционально)

**Заголовки:**
- Для загрузки файлов: `Content-Type: multipart/form-data`
- Для загрузки base64: `Content-Type: application/json`

**Коды ответов:**
- `201 Created`: Изображения успешно загружены
- `400 Bad Request`: Ошибка в запросе (неверный тип файла, превышен лимит файлов и т.д.)
- `500 Internal Server Error`: Серверная ошибка при обработке загрузки

**Пример успешного ответа (одно изображение):**
```json
{
  "success": true,
  "filename": "1630506895123-123456789.jpg",
  "path": "users/avatars/1630506895123-123456789.jpg",
  "url": "http://localhost:3000/users/avatars/1630506895123-123456789.jpg",
  "message": "Файл успешно загружен"
}
```

**Пример успешного ответа (несколько изображений):**
```json
{
  "success": true,
  "message": "Успешно загружено 3 файлов",
  "files": [
    {
      "filename": "1630506895123-123456789.jpg",
      "originalname": "photo1.jpg",
      "path": "users/avatars/1630506895123-123456789.jpg",
      "url": "http://localhost:3000/users/avatars/1630506895123-123456789.jpg",
      "size": 45678,
      "mimetype": "image/jpeg"
    },
    {
      "filename": "1630506895124-987654321.png",
      "originalname": "logo.png",
      "path": "users/avatars/1630506895124-987654321.png",
      "url": "http://localhost:3000/users/avatars/1630506895124-987654321.png",
      "size": 32145,
      "mimetype": "image/png"
    },
    {
      "filename": "1630506895125-456789123.webp",
      "originalname": "banner.webp",
      "path": "users/avatars/1630506895125-456789123.webp",
      "url": "http://localhost:3000/users/avatars/1630506895125-456789123.webp",
      "size": 67890,
      "mimetype": "image/webp"
    }
  ],
  "totalCount": 3
}
```

**cURL примеры:**

Загрузка файла:
```bash
curl -X POST http://localhost:3000/upload \
  -F "image=@/path/to/image.jpg" \
  -F "path=users/avatars"
```

Загрузка base64:
```bash
curl -X POST http://localhost:3000/upload \
  -H "Content-Type: application/json" \
  -d '{
    "base64image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
    "path": "users/avatars"
  }'
```

Также возможна загрузка чистого base64 без MIME-типа:
```bash
curl -X POST http://localhost:3000/upload \
  -H "Content-Type: application/json" \
  -d '{
    "base64": "/9j/4AAQSkZJRgABAQEAYABgAAD...",
    "path": "users/avatars"
  }'
```

### Кастомные пути загрузки

Image Server поддерживает настраиваемые пути API для организации структуры загружаемых файлов.

#### `POST /image/user/citizen` - Пример кастомного пути

**Описание:**
Загрузка изображений с автоматическим сохранением в определенную директорию (например, `uploads/users/citizens`). Путь указывать не требуется, он предопределен в конфигурации.

**Form-data параметры:**
- `images` или `image`: Файл(ы) изображений

**Заголовки:**
- `Content-Type: multipart/form-data`

**Коды ответов:**
- `201 Created`: Изображения успешно загружены
- `400 Bad Request`: Ошибка в запросе
- `500 Internal Server Error`: Серверная ошибка при обработке загрузки

**Пример успешного ответа:**
```json
{
  "success": true,
  "filename": "1630506895123-123456789.jpg",
  "path": "users/citizens/1630506895123-123456789.jpg",
  "url": "http://localhost:3001/users/citizens/1630506895123-123456789.jpg",
  "message": "Файл успешно загружен",
  "customRoute": "/image/user/citizen",
  "customDirectory": "users/citizens"
}
```

**cURL пример:**
```bash
curl -X POST http://localhost:3001/image/user/citizen \
  -F "image=@/path/to/image.jpg"
```

#### `GET /image/user/citizen/info` - Информация о кастомном пути

**Описание:**
Получение информации о кастомном пути API.

**Пример ответа:**
```json
{
  "route": "/image/user/citizen",
  "directory": "users/citizens",
  "description": "Изображения граждан",
  "uploadsLocation": "/app/uploads/users/citizens"
}
```

#### Доступные кастомные пути

По умолчанию настроены следующие кастомные пути:

| API путь | Директория | Описание |
|----------|------------|----------|
| `/image/user/citizen` | `users/citizens` | Изображения граждан |
| `/image/user/avatar` | `users/avatars` | Аватары пользователей |
| `/image/product` | `products` | Изображения товаров |
| `/image/banner` | `marketing/banners` | Баннеры для маркетинговых кампаний |

### Получение изображений

#### `GET /{path}` - Получение изображения по пути

**Параметры URL:**
- `path`: Относительный путь к изображению (например, `users/avatars/1630506895123-123456789.jpg`)

**Коды ответов:**
- `200 OK`: Изображение успешно возвращено
- `403 Forbidden`: Запрошенный путь находится вне директории для загрузок
- `404 Not Found`: Изображение не найдено
- `500 Internal Server Error`: Серверная ошибка при получении изображения

**Пример использования:**
```
http://localhost:3000/users/avatars/1630506895123-123456789.jpg
```

**cURL пример:**
```bash
curl -X GET http://localhost:3000/users/avatars/1630506895123-123456789.jpg -o downloaded_image.jpg
```

### Оптимизация изображений

#### `GET /optimize` - Оптимизация всех изображений

**Query параметры:**
- `path`: Относительный путь к директории для оптимизации (опционально)

**Коды ответов:**
- `200 OK`: Процесс оптимизации запущен успешно
- `400 Bad Request`: Неверный путь
- `500 Internal Server Error`: Серверная ошибка при оптимизации

**Пример успешного ответа:**
```json
{
  "success": true,
  "message": "Оптимизация завершена успешно. Обработано: 10, оптимизировано: 8, ошибок: 0",
  "stats": {
    "processed": 10,
    "optimized": 8,
    "errors": 0,
    "largeImages": 2,
    "compressionMode": "интеллектуальное сжатие для больших изображений (качество 75%)",
    "qualitySettings": {
      "standardJpegQuality": 85,
      "standardPngQuality": 80,
      "standardWebpQuality": 85,
      "largeJpegQuality": 75,
      "largePngQuality": 70,
      "largeWebpQuality": 75
    }
  }
}
```

**cURL пример:**
```bash
curl -X GET "http://localhost:3000/optimize?path=users/avatars"
```

#### `POST /optimize/{path}` - Оптимизация отдельного изображения

**Параметры URL:**
- `path`: Относительный путь к изображению для оптимизации

**Коды ответов:**
- `200 OK`: Изображение успешно оптимизировано
- `400 Bad Request`: Ошибка при оптимизации изображения
- `403 Forbidden`: Запрошенный путь находится вне директории для загрузок
- `500 Internal Server Error`: Серверная ошибка при оптимизации

**Пример успешного ответа:**
```json
{
  "success": true,
  "message": "Изображение успешно оптимизировано",
  "path": "users/avatars/1630506895123-123456789.jpg",
  "compressionInfo": {
    "originalSize": 1024000,
    "newSize": 512000,
    "savedBytes": 512000,
    "savedPercent": "50.00%",
    "isLargeFile": false,
    "compressionMode": "стандартное сжатие"
  }
}
```

**cURL пример:**
```bash
curl -X POST http://localhost:3000/optimize/users/avatars/1630506895123-123456789.jpg
```

### Информационные конечные точки

#### `GET /info` - Информация о сервере

**Пример ответа:**
```json
{
  "version": "1.0.0",
  "uptime": "2d 3h 45m",
  "uploadedFilesCount": 120,
  "uploadsDirSize": "156.5 MB",
  "lastOptimization": "2023-06-15T14:30:00Z"
}
```

#### `GET /health` - Проверка состояния сервера

**Пример ответа:**
```json
{
  "status": "UP"
}
```

## Веб-интерфейс

Image Server включает в себя удобный веб-интерфейс для загрузки и управления изображениями.

### Доступ к веб-интерфейсу

Веб-интерфейс доступен по URL: `http://localhost:3000/upload-ui`

### Основные возможности веб-интерфейса:

1. **Загрузка файлов:**
   - Одиночная загрузка
   - Множественная загрузка
   - Drag & drop интерфейс

2. **Управление директориями:**
   - Указание пути для загрузки

3. **Предпросмотр:**
   - Предварительный просмотр загружаемых изображений
   - Индикатор прогресса загрузки
   - Отображение успешно загруженных изображений

## Конфигурация

### Основные настройки

Основная конфигурация сервера находится в файле `src/config/config.ts`.

#### Параметры сервера

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|-----------|
| `port` | number | `3000` | Порт для запуска сервера |
| `uploadsDir` | string | `'/app/uploads'` | Директория для хранения загруженных изображений |
| `maxFileSize` | number | `5 * 1024 * 1024` | Максимальный размер файла в байтах (5MB) |
| `allowedMimeTypes` | string[] | `['image/jpeg', 'image/png', 'image/gif', 'image/webp']` | Допустимые типы MIME для загрузки |
| `maxFileCount` | number | `10` | Максимальное количество файлов для одновременной загрузки |

### Настройки оптимизации

#### Параметры оптимизации

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|-----------|
| `jpegQuality` | number | `85` | Качество JPEG изображений после оптимизации (1-100) |
| `pngQuality` | number | `80` | Качество PNG изображений после оптимизации (1-100) |
| `webpQuality` | number | `85` | Качество WebP изображений после оптимизации (1-100) |
| `optimizeOnUpload` | boolean | `true` | Автоматическая оптимизация при загрузке |
| `scheduledOptimization` | boolean | `false` | Включение плановой оптимизации |
| `optimizationSchedule` | string | `'0 3 * * *'` | Расписание для плановой оптимизации в формате cron |

### Обработка больших изображений

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|-----------|
| `largeImageThreshold` | number | `10 * 1024 * 1024` | Порог для определения больших изображений в байтах (10MB) |
| `useStreaming` | boolean | `true` | Использование потоковой обработки для больших файлов |
| `maxPixelsInMemory` | number | `100000000` | Максимальное количество пикселей в памяти (100 мегапикселей) |
| `aggressiveCompression.enabled` | boolean | `true` | Включение агрессивного сжатия для больших изображений |
| `aggressiveCompression.jpegQuality` | number | `75` | Качество JPEG для больших изображений (1-100) |
| `aggressiveCompression.pngQuality` | number | `70` | Качество PNG для больших изображений (1-100) |
| `aggressiveCompression.webpQuality` | number | `75` | Качество WebP для больших изображений (1-100) |
| `aggressiveCompression.resizeOversizedImages` | boolean | `true` | Изменять размер очень больших изображений |
| `aggressiveCompression.maxDimension` | number | `4000` | Максимальная ширина/высота после изменения размера (в пикселях) |

### Настройка кастомных путей

Кастомные пути позволяют создать удобную структуру API для загрузки файлов в соответствующие директории.

#### Параметры кастомных путей

| Параметр | Тип | Описание |
|----------|-----|----------|
| `enabled` | boolean | Включить/отключить поддержку кастомных путей |
| `paths` | array | Массив объектов, описывающих кастомные пути |

#### Структура объекта кастомного пути

| Параметр | Тип | Описание |
|----------|-----|----------|
| `route` | string | API путь для загрузки (например, `/image/user/citizen`) |
| `directory` | string | Относительный путь к директории для сохранения (например, `users/citizens`) |
| `description` | string | Описание назначения пути (опционально) |

#### Пример настройки кастомных путей

Настройка производится в файле `src/config/config.ts`:

```typescript
customPaths: {
  enabled: true,
  paths: [
    {
      route: '/image/user/citizen',
      directory: 'users/citizens',
      description: 'Изображения граждан'
    },
    {
      route: '/image/product',
      directory: 'products',
      description: 'Изображения товаров'
    },
    // Дополнительные пути...
  ]
}
```

## Планирование задач

Image Server поддерживает плановую оптимизацию изображений по расписанию с использованием формата cron.

### Настройка расписания

Для включения плановой оптимизации необходимо установить следующие параметры в `src/config/config.ts`:

```typescript
optimizer: {
  // ...другие настройки...
  scheduledOptimization: true,
  optimizationSchedule: '0 3 * * *', // Запуск ежедневно в 3:00
}
```

### Формат cron-выражения

Cron-выражение состоит из 5 полей:

```
┌───────────── минута (0-59)
│ ┌─────────── час (0-23)
│ │ ┌───────── день месяца (1-31)
│ │ │ ┌─────── месяц (1-12)
│ │ │ │ ┌───── день недели (0-6, где 0=воскресенье)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

Примеры:
- `0 3 * * *` - Ежедневно в 3:00
- `0 */6 * * *` - Каждые 6 часов
- `0 0 * * 0` - Каждое воскресенье в полночь

## Безопасность

### Защита от path traversal

Image Server обеспечивает защиту от path traversal атак:
- Все пути нормализуются и проверяются на нахождение в допустимой директории
- Запросы, пытающиеся выйти за пределы директории загрузок, отклоняются

### Проверка типов файлов

- Обязательная проверка MIME-типов загружаемых файлов
- Поддерживаются только изображения форматов JPEG, PNG, GIF и WebP

### Обработка метаданных

- В оптимизированные изображения добавляется маркер для предотвращения повторной обработки

## Рекомендации по производительности

### Оптимизация больших изображений

- Для улучшения производительности при работе с большими изображениями рекомендуется использовать потоковую обработку
- Можно настроить параметры агрессивного сжатия для больших изображений для баланса между качеством и размером

### Конфигурация для сервера

- Рекомендуется увеличить значение `maxFileSize` при необходимости загрузки изображений большого объема
- Для высоконагруженных систем рекомендуется настроить Node.js с увеличенным лимитом памяти:
  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" npm start
  ```

### Docker конфигурация

При использовании Docker можно ограничить ресурсы контейнера:

```yaml
services:
  image-server:
    # ...другие настройки...
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

## Обработка ошибок

Image Server включает в себя надежную систему обработки ошибок:

- Подробное логирование ошибок в консоль
- Структурированные JSON-ответы с информацией об ошибках
- Корректные HTTP-коды состояния в зависимости от типа ошибки
- Очистка временных файлов при сбоях операций

### Общие коды ошибок

| HTTP код | Описание |
|----------|----------|
| 400 | Неверный запрос (проблема с входными данными) |
| 403 | Запрещено (попытка доступа к файлам вне директории) |
| 404 | Не найдено (изображение не существует) |
| 415 | Неподдерживаемый тип медиа (неверный формат изображения) |
| 500 | Внутренняя ошибка сервера |

## Разработка и расширение

### Структура проекта

```
imageServer/
├── dist/              # Скомпилированные JavaScript файлы
├── public/            # Статические файлы для веб-интерфейса
├── src/
│   ├── config/        # Конфигурационные файлы
│   ├── controllers/   # Контроллеры для обработки запросов
│   │   ├── imageController.ts      # Контроллер для изображений
│   │   ├── optimizerController.ts  # Контроллер для оптимизации
│   │   └── healthController.ts     # Контроллер проверки здоровья
│   ├── middleware/    # Промежуточные обработчики
│   ├── routes/        # Определение маршрутов
│   ├── services/      # Сервисы для бизнес-логики
│   ├── types/         # TypeScript типы и интерфейсы
│   ├── utils/         # Утилиты и вспомогательные функции
│   └── app.ts         # Точка входа в приложение
├── temp/              # Временные файлы при обработке 
├── uploads/           # Директория для загруженных изображений
│   ├── users/         # Автоматически создаваемые поддиректории
│   ├── products/      # по кастомным путям
│   └── marketing/
├── Dockerfile         # Docker сборка
├── docker-compose.yml # Docker Compose конфигурация
├── docker-entrypoint.sh # Скрипт входной точки для Docker
└── package.json       # NPM зависимости и скрипты
```

### Добавление новых кастомных путей

Для добавления нового кастомного пути:

1. Откройте файл `src/config/config.ts`
2. Найдите раздел `customPaths`
3. Добавьте новый объект в массив `paths`:
   ```typescript
   {
     route: '/image/new-path',
     directory: 'new/directory',
     description: 'Описание нового пути'
   }
   ```
4. Перезапустите сервер

### Добавление новых форматов изображений

1. Добавьте MIME-тип в `allowedMimeTypes` в `src/config/config.ts`
2. Обновите логику оптимизации в `src/services/optimizerService.ts`

### Расширение API

Для добавления новых конечных точек:

1. Добавьте маршрут в `src/routes/imageRoutes.ts`
2. Создайте контроллер и сервис для обработки нового функционала

## Лицензия

ISC

---

© 2025 Avalon Development Team. Все права защищены.
