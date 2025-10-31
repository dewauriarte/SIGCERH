import { Request, Response } from 'express';
export declare class MetodoPagoController {
    listar(_req: Request, res: Response): Promise<void>;
    listarActivos(_req: Request, res: Response): Promise<void>;
    obtenerPorId(req: Request, res: Response): Promise<void>;
    crear(req: Request, res: Response): Promise<void>;
    actualizar(req: Request, res: Response): Promise<void>;
    toggle(req: Request, res: Response): Promise<void>;
    eliminar(req: Request, res: Response): Promise<void>;
    seed(_req: Request, res: Response): Promise<void>;
}
export declare const metodoPagoController: MetodoPagoController;
//# sourceMappingURL=metodo-pago.controller.d.ts.map