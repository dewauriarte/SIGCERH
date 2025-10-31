import { Request, Response } from 'express';
export declare class PagoController {
    generarOrden(req: Request, res: Response): Promise<void>;
    subirComprobante(req: Request, res: Response): Promise<void>;
    registrarEfectivo(req: Request, res: Response): Promise<void>;
    validarManual(req: Request, res: Response): Promise<void>;
    rechazarComprobante(req: Request, res: Response): Promise<void>;
    getPendientesValidacion(req: Request, res: Response): Promise<void>;
    listar(req: Request, res: Response): Promise<void>;
    obtenerPorId(req: Request, res: Response): Promise<void>;
    recibirWebhook(req: Request, res: Response): Promise<void>;
    marcarExpiradas(_req: Request, res: Response): Promise<void>;
}
export declare const pagoController: PagoController;
//# sourceMappingURL=pago.controller.d.ts.map