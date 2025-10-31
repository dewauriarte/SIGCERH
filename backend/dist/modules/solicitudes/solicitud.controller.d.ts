import { Request, Response } from 'express';
export declare class SolicitudController {
    crear(req: Request, res: Response): Promise<void>;
    seguimiento(req: Request, res: Response): Promise<void>;
    pendientesDerivacion(req: Request, res: Response): Promise<void>;
    derivarEditor(req: Request, res: Response): Promise<void>;
    validarPagoEfectivo(req: Request, res: Response): Promise<void>;
    listasEntrega(req: Request, res: Response): Promise<void>;
    marcarEntregado(req: Request, res: Response): Promise<void>;
    asignadasBusqueda(req: Request, res: Response): Promise<void>;
    iniciarBusqueda(req: Request, res: Response): Promise<void>;
    actaEncontrada(req: Request, res: Response): Promise<void>;
    actaNoEncontrada(req: Request, res: Response): Promise<void>;
    iniciarProcesamiento(req: Request, res: Response): Promise<void>;
    enviarValidacionUGEL(req: Request, res: Response): Promise<void>;
    corregirObservacion(req: Request, res: Response): Promise<void>;
    pendientesValidacionUGEL(req: Request, res: Response): Promise<void>;
    aprobarUGEL(req: Request, res: Response): Promise<void>;
    observarUGEL(req: Request, res: Response): Promise<void>;
    pendientesRegistroSIAGEC(req: Request, res: Response): Promise<void>;
    registrarSIAGEC(req: Request, res: Response): Promise<void>;
    pendientesFirma(req: Request, res: Response): Promise<void>;
    firmarCertificado(req: Request, res: Response): Promise<void>;
    listar(req: Request, res: Response): Promise<void>;
    obtenerPorId(req: Request, res: Response): Promise<void>;
    obtenerHistorial(req: Request, res: Response): Promise<void>;
    dashboard(_req: Request, res: Response): Promise<void>;
}
export declare const solicitudController: SolicitudController;
//# sourceMappingURL=solicitud.controller.d.ts.map