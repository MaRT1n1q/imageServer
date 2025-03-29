import { Router } from 'express';
import imageController from '../controllers/imageController';
import optimizerController from '../controllers/optimizerController';
import healthController from '../controllers/healthController';
import upload from '../middleware/upload';
import config from '../config/config';

// Создание экземпляра маршрутизатора
const router = Router();

// === Служебные маршруты ===

/**
 * Простой маршрут для базовой проверки без логики
 * GET /ping
 */
router.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

/**
 * Маршрут для проверки работоспособности сервера
 * GET /health
 */
router.get('/health', healthController.checkHealth);

// === Маршруты загрузки и управления изображениями ===

/**
 * Маршрут для отображения UI загрузки изображений
 * GET /upload-ui
 */
router.get(config.routes.uploadUI, (req, res) => {
  res.sendFile(config.ui.uploadPage);
});

/**
 * Маршрут для загрузки одного или нескольких изображений
 * POST /upload
 * multipart/form-data: 
 *   - image или images: файл(ы) изображения
 *   - path: опциональный относительный путь для сохранения
 */
router.post(config.routes.uploadAPI, upload.any(), imageController.uploadImages);

// === Маршруты оптимизации ===

/**
 * Маршрут для запуска оптимизации всех изображений
 * GET /optimize?path=optional/subdirectory
 */
router.get(config.routes.optimize, optimizerController.optimizeAllImages);

/**
 * Маршрут для оптимизации отдельного изображения
 * POST /optimize/:path*
 */
router.post(`${config.routes.optimize}/:path*`, optimizerController.optimizeSingleImage);

// === Общий маршрут для получения изображений ===

/**
 * Маршрут для получения изображения по пути
 * GET /*
 * Должен быть последним, так как перехватывает все GET запросы
 */
router.get('/*', imageController.getImage);

export default router;
