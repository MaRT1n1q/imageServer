"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config/config"));
/**
 * Создание папки для загрузки, если она не существует
 * @param directory - путь к папке для загрузки изображений
 */
const ensureDirectoryExists = (directory) => {
    if (!fs_1.default.existsSync(directory)) {
        fs_1.default.mkdirSync(directory, { recursive: true });
    }
};
/**
 * Конфигурация хранилища для multer
 */
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Получаем путь для загрузки из запроса или используем путь по умолчанию
        const uploadPath = req.body.path
            ? path_1.default.join(config_1.default.uploadsDir, req.body.path)
            : config_1.default.uploadsDir;
        // Проверяем, что путь находится внутри основной директории загрузки
        if (!uploadPath.startsWith(config_1.default.uploadsDir)) {
            return cb(new Error('Недопустимый путь загрузки'), '');
        }
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Генерация уникального имени файла с оригинальным расширением
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});
/**
 * Фильтр файлов для проверки типа загружаемых файлов
 */
const fileFilter = (req, file, cb) => {
    if (config_1.default.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(null, false);
        const error = {
            success: false,
            message: `Недопустимый тип файла. Разрешены только: ${config_1.default.allowedMimeTypes.join(', ')}`
        };
        cb(new Error(JSON.stringify(error)));
    }
};
/**
 * Настройка middleware multer для загрузки изображений
 */
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: config_1.default.maxFileSize
    }
});
exports.default = upload;
//# sourceMappingURL=upload.js.map