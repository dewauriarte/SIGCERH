import { Request, Response } from 'express';
export declare class AuditoriaController {
    list(req: Request, res: Response): Promise<void>;
    getByUsuario(req: Request, res: Response): Promise<void>;
    getByEntidad(req: Request, res: Response): Promise<void>;
    getEstadisticas(_req: Request, res: Response): Promise<void>;
}
export declare const auditoriaController: AuditoriaController;
//# sourceMappingURL=auditoria.controller.d.ts.map