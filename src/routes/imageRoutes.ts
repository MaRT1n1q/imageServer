import { Router } from 'express';
import imageController from '../controllers/imageController';
import optimizerController from '../controllers/optimizerController';
import upload from '../middleware/upload';
import path from 'path';
import config from '../config/config';

// Создание экземпляра маршрутизатора
const router = Router();

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

/**
 * Маршрут для получения изображения по пути
 * GET /*
 */
router.get('/*', imageController.getImage);

export default router;
