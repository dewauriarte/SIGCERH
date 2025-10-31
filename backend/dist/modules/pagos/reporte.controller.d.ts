import { Request, Response } from 'express';
export declare class ReporteController {
    reportePorPeriodo(req: Request, res: Response): Promise<void>;
    reportePorMetodo(req: Request, res: Response): Promise<void>;
    reportePendientes(_req: Request, res: Response): Promise<void>;
    reporteNoConciliados(req: Request, res: Response): Promise<void>;
    exportarExcel(req: Request, res: Response): Promise<void>;
}
export declare const reporteController: ReporteController;
//# sourceMappingURL=reporte.controller.d.ts.map