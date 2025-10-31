import { FiltrosSolicitud, PaginacionOptions, ResultadoPaginado } from './types';
import type { CreateSolicitudDTOType, ActaEncontradaDTOType, ActaNoEncontradaDTOType, ValidarPagoDTOType, AprobarUGELDTOType, ObservarUGELDTOType, CorregirObservacionDTOType, RegistrarSIAGECDTOType, FirmarCertificadoDTOType, MarcarEntregadoDTOType } from './dtos';
export declare class SolicitudService {
    create(data: CreateSolicitudDTOType, usuarioId?: string): Promise<any>;
    findAll(filtros?: FiltrosSolicitud, options?: PaginacionOptions): Promise<ResultadoPaginado<any>>;
    findById(id: string): Promise<any>;
    findByCodigo(codigo: string): Promise<any>;
    findByNumeroExpediente(numeroExpediente: string): Promise<any>;
    getHistorial(solicitudId: string): Promise<any[]>;
    derivarAEditor(solicitudId: string, usuarioId: string, editorId?: string, observaciones?: string): Promise<any>;
    iniciarBusqueda(solicitudId: string, usuarioId: string, observaciones?: string): Promise<any>;
    marcarActaEncontrada(solicitudId: string, usuarioId: string, data: ActaEncontradaDTOType): Promise<any>;
    private enviarNotificacionActaEncontrada;
    marcarActaNoEncontrada(solicitudId: string, usuarioId: string, data: ActaNoEncontradaDTOType): Promise<any>;
    validarPago(solicitudId: string, data: ValidarPagoDTOType, usuarioId?: string): Promise<any>;
    iniciarProcesamiento(solicitudId: string, usuarioId: string, actaId?: string, observaciones?: string): Promise<any>;
    enviarAValidacionUGEL(solicitudId: string, usuarioId: string, observaciones?: string): Promise<any>;
    aprobarUGEL(solicitudId: string, usuarioId: string, data: AprobarUGELDTOType): Promise<any>;
    observarUGEL(solicitudId: string, usuarioId: string, data: ObservarUGELDTOType): Promise<any>;
    corregirObservacionUGEL(solicitudId: string, usuarioId: string, data: CorregirObservacionDTOType): Promise<any>;
    registrarSIAGEC(solicitudId: string, usuarioId: string, data: RegistrarSIAGECDTOType): Promise<any>;
    firmarCertificado(solicitudId: string, usuarioId: string, data: FirmarCertificadoDTOType): Promise<any>;
    private enviarNotificacionCertificadoEmitido;
    marcarEntregado(solicitudId: string, usuarioId: string, data: MarcarEntregadoDTOType): Promise<any>;
    getPendientesDerivacion(options?: PaginacionOptions): Promise<any>;
    getAsignadasBusqueda(editorId: string, options?: PaginacionOptions): Promise<any>;
    getPendientesValidacionUGEL(options?: PaginacionOptions): Promise<any>;
    getPendientesRegistroSIAGEC(options?: PaginacionOptions): Promise<any>;
    getPendientesFirma(options?: PaginacionOptions): Promise<any>;
    getListasEntrega(options?: PaginacionOptions): Promise<any>;
}
export declare const solicitudService: SolicitudService;
//# sourceMappingURL=solicitud.service.d.ts.map