import { Request } from 'express';
import config from '../config/config';

/**
 * Утилиты для работы с URL
 */
class UrlUtils {
  /**
   * Формирует базовый URL с учетом настроек протокола
   * @param req - Express запрос
   * @returns Базовый URL в формате protocol://host
   */
  public static getBaseUrl(req: Request): string {
    // Определяем протокол
    let protocol: string | string[];
    
    if (config.https.forceHttps) {
      // Принудительно используем HTTPS, если указано в настройках
      protocol = 'https';
    } else {
      // Иначе пытаемся определить протокол из запроса
      protocol = req.headers['x-forwarded-proto'] || 
                req.headers['x-forwarded-protocol'] ||
                (req.secure ? 'https' : 'http');
      
      // Если протокол - массив (например, в некоторых прокси-серверах)
      if (Array.isArray(protocol)) {
        protocol = protocol[0];
      }
    }
    
    const host = req.get('host') || req.headers.host as string || 'localhost';
    return `${protocol}://${host}`;
  }
  
  /**
   * Формирует полный URL для указанного пути
   * @param req - Express запрос
   * @param relPath - Относительный путь
   * @returns Полный URL
   */
  public static getFullUrl(req: Request, relPath: string): string {
    const baseUrl = this.getBaseUrl(req);
    const cleanPath = relPath.startsWith('/') ? relPath.substring(1) : relPath;
    return `${baseUrl}/${cleanPath}`;
  }
}

export default UrlUtils;
