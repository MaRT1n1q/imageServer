"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
// Корневой путь проекта
const rootDir = path_1.default.resolve(__dirname, '../..');
// Основная конфигурация
const config = {
    port: Number(process.env.PORT) || 3000,
    uploadsDir: path_1.default.join(rootDir, 'uploads'),
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};
exports.default = config;
//# sourceMappingURL=config.js.map