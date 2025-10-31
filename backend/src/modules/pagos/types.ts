/**
 * Enums y tipos para el módulo de Pagos
 * Ajustados al schema de Prisma existente
 */

/**
 * Estados del Pago (según tabla pago)
 */
export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  PAGADO = 'PAGADO',
  VALIDADO = 'VALIDADO',
  RECHAZADO = 'RECHAZADO',
  EXPIRADO = 'EXPIRADO',
}

/**
 * Tipos de Método de Pago
 */
export enum TipoMetodoPago {
  DIGITAL = 'DIGITAL',
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
  TRANSFERENCIA = 'TRANSFERENCIA',
}

/**
 * Métodos de Pago específicos (códigos)
 */
export enum MetodoPago {
  YAPE = 'YAPE',
  PLIN = 'PLIN',
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
}

/**
 * Tipos de Comprobante
 */
export enum TipoComprobante {
  CAPTURA_APP = 'CAPTURA_APP',
  CONSTANCIA = 'CONSTANCIA',
  RECIBO_EFECTIVO = 'RECIBO_EFECTIVO',
  VOUCHER_TARJETA = 'VOUCHER_TARJETA',
}

/**
 * Monto fijo por certificado (S/ 15.00)
 */
export const MONTO_CERTIFICADO = 15.0;

/**
 * Filtros para búsqueda de pagos
 */
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

/**
 * DTO para crear Método de Pago
 */
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

/**
 * DTO para actualizar Método de Pago
 */
export interface UpdateMetodoPagoDTOType {
  nombre?: string;
  descripcion?: string;
  requierevalidacion?: boolean;
  comisionporcentaje?: number;
  comisionfija?: number;
  activo?: boolean;
  configuracion?: any;
}

/**
 * DTO para generar orden de pago
 */
export interface CrearPagoDTOType {
  solicitudId: string;
  metodopago: string; // Código del método (YAPE, PLIN, etc.)
  monto?: number; // Opcional, por defecto MONTO_CERTIFICADO
}

/**
 * DTO para registrar pago en efectivo
 */
export interface RegistrarPagoEfectivoDTOType {
  numeroRecibo: string;
  montoPagado: number;
  fechaPago?: Date;
  horapago?: Date;
  observaciones?: string;
}

/**
 * DTO para subir comprobante
 */
export interface SubirComprobanteDTOType {
  observaciones?: string;
  numerooperacion?: string;
}

/**
 * DTO para validar pago manualmente
 */
export interface ValidarPagoManualDTOType {
  numerooperacion: string;
  montoPagado: number;
  entidadbancaria?: string;
  fechaPago?: Date;
  horapago?: Date;
  observaciones?: string;
}

/**
 * DTO para rechazar comprobante
 */
export interface RechazarComprobanteDTOType {
  motivo: string;
  sugerencias?: string;
}

/**
 * DTO para confirmar pago automático (webhook)
 */
export interface ConfirmarPagoAutomaticoDTOType {
  pagoId: string;
  transactionId: string;
  montoPagado: number;
  numerooperacion?: string;
}

/**
 * Payload de Webhook de pasarela
 */
export interface WebhookPayload {
  evento: string;
  transactionId: string;
  numeroOrden: string;
  monto: number;
  estado: string;
  timestamp: string;
  [key: string]: any;
}
