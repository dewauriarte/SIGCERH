import { TipoNotificacion, CanalNotificacion, DatosNotificacion } from './types';
export declare class NotificacionService {
    crear(tipo: TipoNotificacion, destinatario: string, solicitudId: string, datos: DatosNotificacion, canal?: CanalNotificacion): Promise<{
        error: string | null;
        id: string;
        fechacreacion: Date | null;
        estado: string | null;
        tipo: string;
        solicitud_id: string | null;
        certificado_id: string | null;
        destinatario: string;
        asunto: string | null;
        mensaje: string;
        canal: string;
        intentos: number | null;
        fechaenvio: Date | null;
        fechaleido: Date | null;
    }>;
    enviarPorEmail(notificacionId: string): Promise<import("./types").ResultadoEnvio>;
    marcarComoEnviada(id: string, fechaEnvio?: Date): Promise<{
        error: string | null;
        id: string;
        fechacreacion: Date | null;
        estado: string | null;
        tipo: string;
        solicitud_id: string | null;
        certificado_id: string | null;
        destinatario: string;
        asunto: string | null;
        mensaje: string;
        canal: string;
        intentos: number | null;
        fechaenvio: Date | null;
        fechaleido: Date | null;
    }>;
    marcarComoFallida(id: string, error: string): Promise<{
        error: string | null;
        id: string;
        fechacreacion: Date | null;
        estado: string | null;
        tipo: string;
        solicitud_id: string | null;
        certificado_id: string | null;
        destinatario: string;
        asunto: string | null;
        mensaje: string;
        canal: string;
        intentos: number | null;
        fechaenvio: Date | null;
        fechaleido: Date | null;
    }>;
    reintentar(id: string): Promise<import("./types").ResultadoEnvio>;
    findPendientes(canal?: CanalNotificacion): Promise<({
        solicitud: {
            estudiante: {
                nombres: string;
                telefono: string | null;
                apellidopaterno: string;
                apellidomaterno: string;
            };
            numeroexpediente: string | null;
        } | null;
    } & {
        error: string | null;
        id: string;
        fechacreacion: Date | null;
        estado: string | null;
        tipo: string;
        solicitud_id: string | null;
        certificado_id: string | null;
        destinatario: string;
        asunto: string | null;
        mensaje: string;
        canal: string;
        intentos: number | null;
        fechaenvio: Date | null;
        fechaleido: Date | null;
    })[]>;
    generarListadoManual(canal: CanalNotificacion): Promise<{
        id: string;
        tipo: string;
        destinatario: string;
        telefono: string | null;
        nombreEstudiante: string;
        numeroExpediente: string | null;
        mensaje: string;
        fechaCreacion: Date | null;
    }[]>;
    marcarComoEnviadaManual(id: string, usuarioId: string): Promise<{
        error: string | null;
        id: string;
        fechacreacion: Date | null;
        estado: string | null;
        tipo: string;
        solicitud_id: string | null;
        certificado_id: string | null;
        destinatario: string;
        asunto: string | null;
        mensaje: string;
        canal: string;
        intentos: number | null;
        fechaenvio: Date | null;
        fechaleido: Date | null;
    }>;
    findById(id: string): Promise<{
        certificado: {
            estudiante: {
                dni: string;
                nombres: string;
            };
            codigovirtual: string;
        } | null;
        solicitud: {
            estudiante: {
                dni: string;
                nombres: string;
                apellidopaterno: string;
                apellidomaterno: string;
            };
            numeroexpediente: string | null;
        } | null;
    } & {
        error: string | null;
        id: string;
        fechacreacion: Date | null;
        estado: string | null;
        tipo: string;
        solicitud_id: string | null;
        certificado_id: string | null;
        destinatario: string;
        asunto: string | null;
        mensaje: string;
        canal: string;
        intentos: number | null;
        fechaenvio: Date | null;
        fechaleido: Date | null;
    }>;
    findAll(filtros: {
        canal?: CanalNotificacion;
        estado?: string;
        tipo?: TipoNotificacion;
        fechaDesde?: Date;
        fechaHasta?: Date;
    }, pagination: {
        page: number;
        limit: number;
    }): Promise<{
        data: {
            error: string | null;
            id: string;
            fechacreacion: Date | null;
            estado: string | null;
            tipo: string;
            solicitud_id: string | null;
            certificado_id: string | null;
            destinatario: string;
            asunto: string | null;
            mensaje: string;
            canal: string;
            intentos: number | null;
            fechaenvio: Date | null;
            fechaleido: Date | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
export declare const notificacionService: NotificacionService;
//# sourceMappingURL=notificacion.service.d.ts.map