"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const imageController_1 = __importDefault(require("../controllers/imageController"));
const upload_1 = __importDefault(require("../middleware/upload"));
const path_1 = __importDefault(require("path"));
// Создание экземпляра маршрутизатора
const router = (0, express_1.Router)();
/**
 * Маршрут для отображения UI загрузки изображений
 * GET /upload-ui
 */
router.get('/upload-ui', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/index.html'));
});
/**
 * Маршрут для отображения UI пакетной загрузки изображений
 * GET /batch-upload-ui
 */
router.get('/batch-upload-ui', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/batch-upload.html'));
});
/**
 * Маршрут для загрузки одного изображения
 * POST /upload
 * multipart/form-data:
 *   - image: файл изображения
 *   - path: опциональный относительный путь для сохранения
 */
router.post('/upload', upload_1.default.single('image'), imageController_1.default.uploadImage);
/**
 * Маршрут для пакетной загрузки изображений (до 10 файлов)
 * POST /batch-upload
 * multipart/form-data:
 *   - images: файлы изображений (несколько)
 *   - path: опциональный относительный путь для сохранения
 */
router.post('/batch-upload', upload_1.default.array('images', 10), imageController_1.default.uploadMultipleImages);
/**
 * Маршрут для получения изображения по пути
 * GET /*
 */
router.get('/*', imageController_1.default.getImage);
exports.default = router;
//# sourceMappingURL=imageRoutes.js.map