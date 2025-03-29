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
 * Маршрут для загрузки изображения
 * POST /upload
 * multipart/form-data:
 *   - image: файл изображения
 *   - path: опциональный относительный путь для сохранения (например, "user/avatar")
 */
router.post('/upload', upload_1.default.single('image'), imageController_1.default.uploadImage);
/**
 * Маршрут для получения изображения по пути
 * GET /*
 * Путь соответствует относительному пути к файлу
 */
router.get('/*', imageController_1.default.getImage);
exports.default = router;
//# sourceMappingURL=imageRoutes.js.map