export declare enum EstadoSolicitud {
    REGISTRADA = "REGISTRADA",
    DERIVADO_A_EDITOR = "DERIVADO_A_EDITOR",
    EN_BUSQUEDA = "EN_BUSQUEDA",
    ACTA_ENCONTRADA_PENDIENTE_PAGO = "ACTA_ENCONTRADA_PENDIENTE_PAGO",
    ACTA_NO_ENCONTRADA = "ACTA_NO_ENCONTRADA",
    PAGO_VALIDADO = "PAGO_VALIDADO",
    EN_PROCESAMIENTO_OCR = "EN_PROCESAMIENTO_OCR",
    EN_VALIDACION_UGEL = "EN_VALIDACION_UGEL",
    OBSERVADO_POR_UGEL = "OBSERVADO_POR_UGEL",
    EN_REGISTRO_SIAGEC = "EN_REGISTRO_SIAGEC",
    EN_FIRMA_DIRECCION = "EN_FIRMA_DIRECCION",
    CERTIFICADO_EMITIDO = "CERTIFICADO_EMITIDO",
    ENTREGADO = "ENTREGADO"
}
export declare enum ModalidadEntrega {
    DIGITAL = "DIGITAL",
    FISICA = "FISICA"
}
export declare enum Prioridad {
    NORMAL = "NORMAL",
    ALTA = "ALTA",
    URGENTE = "URGENTE"
}
export declare enum RolSolicitud {
    SISTEMA = "SISTEMA",
    PUBLICO = "PUBLICO",
    MESA_DE_PARTES = "MESA_DE_PARTES",
    EDITOR = "EDITOR",
    UGEL = "UGEL",
    SIAGEC = "SIAGEC",
    DIRECCION = "DIRECCION",
    ADMIN = "ADMIN"
}
export interface TransicionConfig {
    nextStates: EstadoSolicitud[];
    roles: RolSolicitud[];
    requiresData?: string[];
    description?: string;
}
export declare const TRANSICIONES_VALIDAS: Record<EstadoSolicitud, TransicionConfig>;
export interface TransicionData {
    solicitudId: string;
    estadoAnterior: EstadoSolicitud;
    estadoNuevo: EstadoSolicitud;
    usuarioId: string;
    rol: RolSolicitud;
    observaciones?: string;
    metadata?: Record<string, any>;
}
export interface HistorialEntry {
    id: string;
    solicitudId: string;
    estadoAnterior: string | null;
    estadoNuevo: string;
    observaciones?: string;
    usuarioId?: string;
    fecha: Date;
}
export interface FiltrosSolicitud {
    estado?: EstadoSolicitud;
    estados?: EstadoSolicitud[];
    estudianteId?: string;
    tipoSolicitudId?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
    prioridad?: Prioridad;
    numeroExpediente?: string;
    numeroseguimiento?: string;
    asignadoAEditor?: string;
    pendientePago?: boolean;
    conCertificado?: boolean;
}
export interface PaginacionOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface ResultadoPaginado<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare function esTransicionValida(estadoActual: EstadoSolicitud, estadoDestino: EstadoSolicitud, rol: RolSolicitud): boolean;
export declare function getEstadosSiguientes(estadoActual: EstadoSolicitud): EstadoSolicitud[];
export declare function getRolesPermitidos(estadoActual: EstadoSolicitud): RolSolicitud[];
export declare function esEstadoFinal(estado: EstadoSolicitud): boolean;
//# sourceMappingURL=types.d.ts.map