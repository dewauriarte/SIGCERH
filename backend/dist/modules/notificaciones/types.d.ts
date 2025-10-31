export declare enum TipoNotificacion {
    ACTA_ENCONTRADA = "ACTA_ENCONTRADA",
    CERTIFICADO_EMITIDO = "CERTIFICADO_EMITIDO"
}
export declare enum CanalNotificacion {
    EMAIL = "EMAIL",
    WHATSAPP = "WHATSAPP",
    SMS = "SMS"
}
export declare enum EstadoNotificacion {
    PENDIENTE = "PENDIENTE",
    ENVIADA = "ENVIADA",
    FALLIDA = "FALLIDA",
    REENVIADA = "REENVIADA"
}
export interface DatosNotificacion {
    nombreEstudiante: string;
    codigoSeguimiento?: string;
    codigoVirtual?: string;
    monto?: number;
    urlDescarga?: string;
    enlacePlataforma?: string;
}
export interface ResultadoEnvio {
    exito: boolean;
    messageId?: string;
    error?: string;
}
export interface ItemCola {
    notificacionId: string;
    prioridad: number;
    fechaAgregado: Date;
}
export interface EnlaceWhatsApp {
    telefono: string;
    nombre: string;
    mensaje: string;
    url: string;
}
//# sourceMappingURL=types.d.ts.map