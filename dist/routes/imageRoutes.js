"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const imageController_1 = __importDefault(require("../controllers/imageController"));
const upload_1 = __importDefault(require("../middleware/upload"));
// Создание экземпляра маршрутизатора
const router = (0, express_1.Router)();
/**
 * Маршрут для загрузки изображения
 * POST /api/images/upload
 * multipart/form-data:
 *   - image: файл изображения
 *   - path: опциональный относительный путь для сохранения (например, "user/avatar")
 */
router.post('/upload', upload_1.default.single('image'), imageController_1.default.uploadImage);
/**
 * Маршрут для получения изображения по пути
 * GET /api/images/*
 * Путь после /api/images/ соответствует относительному пути к файлу
 */
router.get('/*', imageController_1.default.getImage);
exports.default = router;
//# sourceMappingURL=imageRoutes.js.map