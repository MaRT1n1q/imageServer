import { Request, Response } from 'express';
/**
 * Контроллер для работы с изображениями
 */
declare class ImageController {
    /**
     * Обработчик загрузки изображения
     * @param req - объект запроса Express
     * @param res - объект ответа Express
     * @returns JSON-ответ с результатами загрузки
     */
    uploadImage: (req: Request, res: Response) => Response;
    /**
     * Получение изображения по пути
     * @param req - объект запроса Express
     * @param res - объект ответа Express
     * @returns Response объект Express или void
     */
    getImage: (req: Request, res: Response) => Response | void;
}
declare const _default: ImageController;
export default _default;
