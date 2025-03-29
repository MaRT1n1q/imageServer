import path from 'path';
import config from '../config/config';

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
  public static isPathSafe(requestedPath: string, basePath: string = config.uploadsDir): boolean {
    const fullPath = path.resolve(basePath, requestedPath);
    return fullPath.startsWith(path.resolve(basePath));
  }

  /**
   * Создает безопасный абсолютный путь из относительного
   * @param relativePath - относительный путь
   * @param basePath - базовый путь
   * @returns полный безопасный путь или null, если путь небезопасен
   */
  public static getSafePath(relativePath: string, basePath: string = config.uploadsDir): string | null {
    const normalizedRelativePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(basePath, normalizedRelativePath);
    
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
  public static toUrlPath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }
}

export default PathUtils;
