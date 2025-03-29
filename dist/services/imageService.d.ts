/**
 * Сервис для работы с изображениями
 */
declare class ImageService {
    /**
     * Проверка существования файла
     * @param filePath - путь к файлу для проверки
     * @returns Promise<boolean> - существует ли файл
     */
    fileExists(filePath: string): Promise<boolean>;
    /**
     * Удаление изображения
     * @param relativePath - относительный путь к изображению
     * @returns Promise<boolean> - успешность удаления
     */
    deleteImage(relativePath: string): Promise<boolean>;
    /**
     * Получение информации о изображении
     * @param relativePath - относительный путь к изображению
     * @returns Promise<object | null> - информация о файле или null, если файл не найден
     */
    getImageInfo(relativePath: string): Promise<object | null>;
    /**
     * Получение списка изображений в указанной директории
     * @param directoryPath - относительный путь к директории
     * @returns Promise<Array<object> | null> - список файлов или null в случае ошибки
     */
    listImages(directoryPath?: string): Promise<Array<object> | null>;
}
declare const _default: ImageService;
export default _default;
