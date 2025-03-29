import { Router } from 'express';
import imageController from '../controllers/imageController';
import upload from '../middleware/upload';
import path from 'path';

// Создание экземпляра маршрутизатора
const router = Router();

/**
 * Маршрут для отображения UI загрузки изображений
 * GET /upload-ui
 */
router.get('/upload-ui', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

/**
 * Маршрут для отображения UI пакетной загрузки изображений
 * GET /batch-upload-ui
 */
router.get('/batch-upload-ui', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/batch-upload.html'));
});

/**
 * Маршрут для загрузки одного изображения
 * POST /upload
 * multipart/form-data: 
 *   - image: файл изображения
 *   - path: опциональный относительный путь для сохранения
 */
router.post('/upload', upload.single('image'), imageController.uploadImage);

/**
 * Маршрут для пакетной загрузки изображений (до 10 файлов)
 * POST /batch-upload
 * multipart/form-data: 
 *   - images: файлы изображений (несколько)
 *   - path: опциональный относительный путь для сохранения
 */
router.post('/batch-upload', upload.array('images', 10), imageController.uploadMultipleImages);

/**
 * Маршрут для получения изображения по пути
 * GET /*
 */
router.get('/*', imageController.getImage);

export default router;
