import { Request, Response } from 'express';
declare class VerificacionController {
    verificarPorCodigo(req: Request, res: Response): Promise<void>;
    verificarPorQR(req: Request, res: Response): Promise<void>;
    estadisticas(_req: Request, res: Response): Promise<void>;
}
export declare const verificacionController: VerificacionController;
export {};
//# sourceMappingURL=verificacion.controller.d.ts.map