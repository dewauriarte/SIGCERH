import { Request, Response } from 'express';
declare class CertificadoController {
    listar(req: Request, res: Response): Promise<void>;
    obtenerPorId(req: Request, res: Response): Promise<void>;
    generarPDF(req: Request, res: Response): Promise<void>;
    descargar(req: Request, res: Response): Promise<void>;
    firmarDigitalmente(req: Request, res: Response): Promise<void>;
    marcarFirmaManuscrita(req: Request, res: Response): Promise<void>;
    subirFirmado(req: Request, res: Response): Promise<void>;
    estadoFirma(req: Request, res: Response): Promise<void>;
    anular(req: Request, res: Response): Promise<void>;
    rectificar(req: Request, res: Response): Promise<void>;
}
export declare const certificadoController: CertificadoController;
export {};
//# sourceMappingURL=certificado.controller.d.ts.map