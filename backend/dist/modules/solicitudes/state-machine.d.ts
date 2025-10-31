import { EstadoSolicitud, RolSolicitud } from './types';
export declare class SolicitudStateMachine {
    transicion(solicitudId: string, estadoDestino: EstadoSolicitud, usuarioId: string, rol: RolSolicitud, observaciones?: string, metadata?: Record<string, any>): Promise<any>;
    validateTransicion(estadoActual: EstadoSolicitud, estadoDestino: EstadoSolicitud, rol: RolSolicitud): void;
    private updateTrazabilidadFields;
    private registrarHistorial;
    private onBeforeTransicion;
    private onAfterTransicion;
    private enviarNotificacion;
    private actualizarEntidadesRelacionadas;
    getHistorial(solicitudId: string): Promise<any[]>;
    canTransition(solicitudId: string, estadoDestino: EstadoSolicitud, rol: RolSolicitud): Promise<{
        can: boolean;
        reason?: string;
    }>;
}
export declare const solicitudStateMachine: SolicitudStateMachine;
//# sourceMappingURL=state-machine.d.ts.map