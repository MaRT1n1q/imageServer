"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config/config"));
/**
 * Контроллер для работы с изображениями
 */
class ImageController {
    constructor() {
        /**
         * Обработчик загрузки изображения
         * @param req - объект запроса Express
         * @param res - объект ответа Express
         * @returns JSON-ответ с результатами загрузки
         */
        this.uploadImage = (req, res) => {
            try {
                // Проверяем наличие загруженного файла
                if (!req.file) {
                    const errorResponse = {
                        success: false,
                        message: 'Файл не был загружен'
                    };
                    return res.status(400).json(errorResponse);
                }
                // Получаем относительный путь для URL
                const relativePath = path_1.default.relative(config_1.default.uploadsDir, req.file.path).replace(/\\/g, '/');
                const baseUrl = `${req.protocol}://${req.get('host')}`;
                // Формируем ответ
                const response = {
                    success: true,
                    filename: req.file.filename,
                    path: relativePath,
                    url: `${baseUrl}/images/${relativePath}`,
                    message: 'Файл успешно загружен'
                };
                return res.status(201).json(response);
            }
            catch (error) {
                console.error('Ошибка при загрузке файла:', error);
                const errorResponse = {
                    success: false,
                    message: 'Произошла ошибка при загрузке файла'
                };
                return res.status(500).json(errorResponse);
            }
        };
        /**
         * Получение изображения по пути
         * @param req - объект запроса Express
         * @param res - объект ответа Express
         * @returns Response объект Express или void
         */
        this.getImage = (req, res) => {
            try {
                // Получаем путь из параметров запроса (* - означает все сегменты пути)
                const imagePath = req.params[0];
                // Формируем полный путь к файлу
                const fullPath = path_1.default.join(config_1.default.uploadsDir, imagePath);
                // Проверяем, находится ли запрашиваемый файл внутри директории uploads
                if (!fullPath.startsWith(config_1.default.uploadsDir)) {
                    return res.status(403).send('Доступ запрещен');
                }
                // Проверяем существование файла
                if (!fs_1.default.existsSync(fullPath)) {
                    return res.status(404).send('Изображение не найдено');
                }
                // Отправляем файл (sendFile не возвращает Response объект)
                res.sendFile(fullPath);
            }
            catch (error) {
                console.error('Ошибка при получении изображения:', error);
                return res.status(500).send('Произошла ошибка при получении изображения');
            }
        };
    }
}
exports.default = new ImageController();
//# sourceMappingURL=imageController.js.map