/**
 * DTOs para el módulo de Pagos
 * Adaptados al schema de Prisma existente
 */

import { z } from 'zod';
import { EstadoPago, TipoMetodoPago } from './types';

/**
 * Función helper para validación con Zod
 */
export function validate(schema: z.ZodSchema) {
  return (req: any, _res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      throw new Error(`Validación fallida: ${error.message}`);
    }
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: any, _res: any, next: any) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error: any) {
      throw new Error(`Validación fallida: ${error.message}`);
    }
  };
}

// ==========================================
// DTOs para Métodos de Pago
// ==========================================

export const CreateMetodoPagoDTO = z.object({
  codigo: z.string().min(2).max(30),
  nombre: z.string().min(3).max(100),
  tipo: z.nativeEnum(TipoMetodoPago),
  descripcion: z.string().optional(),
  requierevalidacion: z.boolean().optional().default(true),
  comisionporcentaje: z.number().min(0).max(100).optional(),
  comisionfija: z.number().min(0).optional(),
  activo: z.boolean().optional().default(true),
  configuracion: z.any().optional(),
});

export const UpdateMetodoPagoDTO = z.object({
  nombre: z.string().min(3).max(100).optional(),
  descripcion: z.string().optional(),
  requierevalidacion: z.boolean().optional(),
  comisionporcentaje: z.number().min(0).max(100).optional(),
  comisionfija: z.number().min(0).optional(),
  activo: z.boolean().optional(),
  configuracion: z.any().optional(),
});

// ==========================================
// DTOs para Pagos
// ==========================================

export const GenerarOrdenDTO = z.object({
  solicitudId: z.string().uuid(),
  metodopago: z.string().min(2).max(30), // Código del método (YAPE, PLIN, etc.)
  monto: z.number().min(0).optional(),
});

export const RegistrarPagoEfectivoDTO = z.object({
  numeroRecibo: z.string().min(3).max(50),
  montoPagado: z.number().min(0),
  numerooperacion: z.string().min(3).max(50).optional(),
  entidadbancaria: z.string().max(100).optional(),
  fechaPago: z.coerce.date().optional(),
  observaciones: z.string().optional(),
});

// DTO para registrar pago efectivo desde solicitud (Mesa de Partes)
export const CrearPagoEfectivoDTO = z.object({
  solicitudId: z.string().uuid(),
  numeroRecibo: z.string().min(3).max(50),
  monto: z.number().min(0),
  fechaPago: z.string().optional(), // ISO date string
  observaciones: z.string().optional(),
});

export const SubirComprobanteDTO = z.object({
  numerooperacion: z.string().min(3).max(50).optional(),
  observaciones: z.string().optional(),
});

export const ValidarPagoManualDTO = z.object({
  numerooperacion: z.string().min(3).max(50),
  montoPagado: z.number().min(0),
  entidadbancaria: z.string().max(100).optional(),
  fechaPago: z.coerce.date().optional(),
  observaciones: z.string().optional(),
});

export const RechazarComprobanteDTO = z.object({
  motivo: z.string().min(10),
  sugerencias: z.string().optional(),
});

export const ConfirmarPagoAutomaticoDTO = z.object({
  pagoId: z.string().uuid(),
  transactionId: z.string(),
  montoPagado: z.number().min(0),
  numerooperacion: z.string().optional(),
});

export const FiltrosPagoDTO = z.object({
  estado: z.nativeEnum(EstadoPago).optional(),
  metodopago: z.string().optional(),
  numeroorden: z.string().optional(),
  numerooperacion: z.string().optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  conciliado: z.coerce.boolean().optional(),
});

// ==========================================
// DTOs para Webhooks
// ==========================================

export const WebhookPagoDTO = z.object({
  evento: z.string(),
  transactionId: z.string().optional(),
  numeroOrden: z.string().optional(),
  monto: z.number().optional(),
  estado: z.string().optional(),
  timestamp: z.string().optional(),
}).passthrough(); // Permite campos adicionales

export type CreateMetodoPagoDTOType = z.infer<typeof CreateMetodoPagoDTO>;
export type UpdateMetodoPagoDTOType = z.infer<typeof UpdateMetodoPagoDTO>;
export type GenerarOrdenDTOType = z.infer<typeof GenerarOrdenDTO>;
export type RegistrarPagoEfectivoDTOType = z.infer<typeof RegistrarPagoEfectivoDTO>;
export type CrearPagoEfectivoDTOType = z.infer<typeof CrearPagoEfectivoDTO>;
export type SubirComprobanteDTOType = z.infer<typeof SubirComprobanteDTO>;
export type ValidarPagoManualDTOType = z.infer<typeof ValidarPagoManualDTO>;
export type RechazarComprobanteDTOType = z.infer<typeof RechazarComprobanteDTO>;
export type FiltrosPagoDTOType = z.infer<typeof FiltrosPagoDTO>;
export type WebhookPagoDTOType = z.infer<typeof WebhookPagoDTO>;
