"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config/config"));
/**
 * Утилиты для работы с путями файлов
 */
class PathUtils {
    /**
     * Проверка безопасности пути для предотвращения path traversal атак
     * @param requestedPath - запрашиваемый путь для проверки
     * @param basePath - базовый путь, в котором должен находиться запрашиваемый путь
     * @returns true, если путь безопасен, false в противном случае
     */
    static isPathSafe(requestedPath, basePath = config_1.default.uploadsDir) {
        const fullPath = path_1.default.resolve(basePath, requestedPath);
        return fullPath.startsWith(path_1.default.resolve(basePath));
    }
    /**
     * Создает безопасный абсолютный путь из относительного
     * @param relativePath - относительный путь
     * @param basePath - базовый путь
     * @returns полный безопасный путь или null, если путь небезопасен
     */
    static getSafePath(relativePath, basePath = config_1.default.uploadsDir) {
        const normalizedRelativePath = path_1.default.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
        const fullPath = path_1.default.join(basePath, normalizedRelativePath);
        if (!this.isPathSafe(normalizedRelativePath, basePath)) {
            return null;
        }
        return fullPath;
    }
    /**
     * Преобразует Windows-пути в формат URL (заменяет обратные слэши на прямые)
     * @param filePath - путь к файлу
     * @returns путь для использования в URL
     */
    static toUrlPath(filePath) {
        return filePath.replace(/\\/g, '/');
    }
}
exports.default = PathUtils;
//# sourceMappingURL=pathUtils.js.map