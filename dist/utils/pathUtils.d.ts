/**
 * Утилиты для работы с путями файлов
 */
declare class PathUtils {
    /**
     * Проверка безопасности пути для предотвращения path traversal атак
     * @param requestedPath - запрашиваемый путь для проверки
     * @param basePath - базовый путь, в котором должен находиться запрашиваемый путь
     * @returns true, если путь безопасен, false в противном случае
     */
    static isPathSafe(requestedPath: string, basePath?: string): boolean;
    /**
     * Создает безопасный абсолютный путь из относительного
     * @param relativePath - относительный путь
     * @param basePath - базовый путь
     * @returns полный безопасный путь или null, если путь небезопасен
     */
    static getSafePath(relativePath: string, basePath?: string): string | null;
    /**
     * Преобразует Windows-пути в формат URL (заменяет обратные слэши на прямые)
     * @param filePath - путь к файлу
     * @returns путь для использования в URL
     */
    static toUrlPath(filePath: string): string;
}
export default PathUtils;
