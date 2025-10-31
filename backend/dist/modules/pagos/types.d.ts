export declare enum EstadoPago {
    PENDIENTE = "PENDIENTE",
    PAGADO = "PAGADO",
    VALIDADO = "VALIDADO",
    RECHAZADO = "RECHAZADO",
    EXPIRADO = "EXPIRADO"
}
export declare enum TipoMetodoPago {
    DIGITAL = "DIGITAL",
    EFECTIVO = "EFECTIVO",
    TARJETA = "TARJETA",
    TRANSFERENCIA = "TRANSFERENCIA"
}
export declare enum MetodoPago {
    YAPE = "YAPE",
    PLIN = "PLIN",
    EFECTIVO = "EFECTIVO",
    TARJETA = "TARJETA"
}
export declare enum TipoComprobante {
    CAPTURA_APP = "CAPTURA_APP",
    CONSTANCIA = "CONSTANCIA",
    RECIBO_EFECTIVO = "RECIBO_EFECTIVO",
    VOUCHER_TARJETA = "VOUCHER_TARJETA"
}
export declare const MONTO_CERTIFICADO = 15;
export interface FiltrosPago {
    estado?: EstadoPago;
    metodopago?: string;
    solicitudId?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
    numeroOrden?: string;
    numeroOperacion?: string;
    pendienteValidacion?: boolean;
    conciliado?: boolean;
}
export interface CrearMetodoPagoDTOType {
    nombre: string;
    codigo: string;
    tipo: TipoMetodoPago;
    descripcion?: string;
    requierevalidacion?: boolean;
    comisionporcentaje?: number;
    comisionfija?: number;
    activo?: boolean;
    configuracion?: any;
}
export interface UpdateMetodoPagoDTOType {
    nombre?: string;
    descripcion?: string;
    requierevalidacion?: boolean;
    comisionporcentaje?: number;
    comisionfija?: number;
    activo?: boolean;
    configuracion?: any;
}
export interface CrearPagoDTOType {
    solicitudId: string;
    metodopago: string;
    monto?: number;
}
export interface RegistrarPagoEfectivoDTOType {
    numeroRecibo: string;
    montoPagado: number;
    fechaPago?: Date;
    horapago?: Date;
    observaciones?: string;
}
export interface SubirComprobanteDTOType {
    observaciones?: string;
    numerooperacion?: string;
}
export interface ValidarPagoManualDTOType {
    numerooperacion: string;
    montoPagado: number;
    entidadbancaria?: string;
    fechaPago?: Date;
    horapago?: Date;
    observaciones?: string;
}
export interface RechazarComprobanteDTOType {
    motivo: string;
    sugerencias?: string;
}
export interface ConfirmarPagoAutomaticoDTOType {
    pagoId: string;
    transactionId: string;
    montoPagado: number;
    numerooperacion?: string;
}
export interface WebhookPayload {
    evento: string;
    transactionId: string;
    numeroOrden: string;
    monto: number;
    estado: string;
    timestamp: string;
    [key: string]: any;
}
//# sourceMappingURL=types.d.ts.map