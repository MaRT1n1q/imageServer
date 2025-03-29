/**
 * Интерфейс для ответа успешной загрузки изображения
 */
export interface UploadResponse {
    success: boolean;
    filename?: string;
    path?: string;
    url?: string;
    message?: string;
}
/**
 * Интерфейс для ошибки
 */
export interface ErrorResponse {
    success: false;
    message: string;
    errorCode?: number;
}
