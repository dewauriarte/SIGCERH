import { Request, Response } from 'express';
export declare class ActasFisicasController {
    create(req: Request, res: Response): Promise<void>;
    list(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    updateMetadata(req: Request, res: Response): Promise<void>;
    asignarSolicitud(req: Request, res: Response): Promise<void>;
    marcarEncontrada(req: Request, res: Response): Promise<void>;
    marcarNoEncontrada(req: Request, res: Response): Promise<void>;
    procesarOCR(req: Request, res: Response): Promise<void>;
    validarManual(req: Request, res: Response): Promise<void>;
    exportarExcel(req: Request, res: Response): Promise<void>;
    compararOCRconFisica(req: Request, res: Response): Promise<void>;
    validarConCorrecciones(req: Request, res: Response): Promise<void>;
}
export declare const actasFisicasController: ActasFisicasController;
//# sourceMappingURL=actas-fisicas.controller.d.ts.map