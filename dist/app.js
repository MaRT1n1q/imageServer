"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("./config/config"));
const imageRoutes_1 = __importDefault(require("./routes/imageRoutes"));
// Создаем экземпляр приложения Express
const app = (0, express_1.default)();
// Middleware для разбора JSON и URL-encoded данных
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Создание директорий, если они не существуют
if (!fs_1.default.existsSync(config_1.default.uploadsDir)) {
    fs_1.default.mkdirSync(config_1.default.uploadsDir, { recursive: true });
}
// Создание директории public, если она не существует
const publicDir = path_1.default.join(__dirname, '../public');
if (!fs_1.default.existsSync(publicDir)) {
    fs_1.default.mkdirSync(publicDir, { recursive: true });
}
// Статические файлы
app.use(express_1.default.static(publicDir));
// Обработка ошибок Multer
app.use((err, req, res, next) => {
    if (err) {
        console.error('Ошибка Multer:', err);
        // Проверяем, является ли ошибка результатом нашей валидации
        try {
            const parsedError = JSON.parse(err.message);
            if (parsedError.success === false) {
                return res.status(400).json(parsedError);
            }
        }
        catch (e) {
            // Если не удалось распарсить ошибку, используем стандартное сообщение
        }
        // Обработка ограничения размера файла
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `Размер файла превышает максимально допустимый (${config_1.default.maxFileSize / (1024 * 1024)} МБ)`
            });
        }
        // Другие ошибки
        return res.status(500).json({
            success: false,
            message: 'Произошла ошибка при загрузке файла'
        });
    }
    next();
});
// Регистрация маршрутов для работы с изображениями
app.use('/', imageRoutes_1.default);
// Редирект с корня сайта на UI загрузки
app.get('/', (req, res) => {
    res.redirect('/upload-ui');
});
// Простой маршрут для проверки доступности сервера
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});
// Запуск сервера
app.listen(config_1.default.port, () => {
    console.log(`Сервер запущен на порту ${config_1.default.port}`);
    console.log(`Путь для загрузки изображений: ${config_1.default.uploadsDir}`);
    console.log(`UI доступен по адресу: http://localhost:${config_1.default.port}/upload-ui`);
});
exports.default = app;
//# sourceMappingURL=app.js.map