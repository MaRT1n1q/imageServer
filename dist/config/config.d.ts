/**
 * Конфигурация для сервера изображений
 */
interface Config {
    port: number;
    uploadsDir: string;
    maxFileSize: number;
    allowedMimeTypes: string[];
}
declare const config: Config;
export default config;
