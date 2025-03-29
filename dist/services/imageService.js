"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fs_2 = require("fs");
const pathUtils_1 = __importDefault(require("../utils/pathUtils"));
/**
 * Сервис для работы с изображениями
 */
class ImageService {
    /**
     * Проверка существования файла
     * @param filePath - путь к файлу для проверки
     * @returns Promise<boolean> - существует ли файл
     */
    async fileExists(filePath) {
        try {
            await fs_2.promises.access(filePath, fs_1.default.constants.F_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Удаление изображения
     * @param relativePath - относительный путь к изображению
     * @returns Promise<boolean> - успешность удаления
     */
    async deleteImage(relativePath) {
        try {
            const safePath = pathUtils_1.default.getSafePath(relativePath);
            if (!safePath) {
                return false;
            }
            const exists = await this.fileExists(safePath);
            if (!exists) {
                return false;
            }
            await fs_2.promises.unlink(safePath);
            return true;
        }
        catch (error) {
            console.error('Ошибка при удалении изображения:', error);
            return false;
        }
    }
    /**
     * Получение информации о изображении
     * @param relativePath - относительный путь к изображению
     * @returns Promise<object | null> - информация о файле или null, если файл не найден
     */
    async getImageInfo(relativePath) {
        try {
            const safePath = pathUtils_1.default.getSafePath(relativePath);
            if (!safePath) {
                return null;
            }
            const exists = await this.fileExists(safePath);
            if (!exists) {
                return null;
            }
            const stats = await fs_2.promises.stat(safePath);
            return {
                name: path_1.default.basename(safePath),
                path: pathUtils_1.default.toUrlPath(relativePath),
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
        }
        catch (error) {
            console.error('Ошибка при получении информации о изображении:', error);
            return null;
        }
    }
    /**
     * Получение списка изображений в указанной директории
     * @param directoryPath - относительный путь к директории
     * @returns Promise<Array<object> | null> - список файлов или null в случае ошибки
     */
    async listImages(directoryPath = '') {
        try {
            const safePath = pathUtils_1.default.getSafePath(directoryPath);
            if (!safePath) {
                return null;
            }
            const exists = await this.fileExists(safePath);
            if (!exists) {
                return null;
            }
            const files = await fs_2.promises.readdir(safePath, { withFileTypes: true });
            const result = [];
            for (const file of files) {
                if (file.isFile()) {
                    const filePath = path_1.default.join(directoryPath, file.name);
                    const fileInfo = await this.getImageInfo(filePath);
                    if (fileInfo) {
                        result.push(fileInfo);
                    }
                }
            }
            return result;
        }
        catch (error) {
            console.error('Ошибка при получении списка изображений:', error);
            return null;
        }
    }
}
exports.default = new ImageService();
//# sourceMappingURL=imageService.js.map