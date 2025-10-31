/**
 * DTOs para el módulo de notificaciones
 * Validación con Zod
 */

import { z } from 'zod';
import { TipoNotificacion, CanalNotificacion } from './types';

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
// DTOs para Notificaciones
// ==========================================

/**
 * DTO para crear notificación
 */
export const CrearNotificacionDTO = z.object({
  tipo: z.nativeEnum(TipoNotificacion),
  destinatario: z.string().email('Email inválido'),
  canal: z.nativeEnum(CanalNotificacion),
  solicitudId: z.string().uuid().optional(),
  certificadoId: z.string().uuid().optional(),
  datos: z.object({
    nombreEstudiante: z.string(),
    codigoSeguimiento: z.string().optional(),
    codigoVirtual: z.string().optional(),
    monto: z.number().optional(),
    urlDescarga: z.string().optional(),
    enlacePlataforma: z.string().optional(),
  }),
});

/**
 * DTO para marcar como enviada manualmente
 */
export const MarcarEnviadaDTO = z.object({
  observaciones: z.string().optional(),
});

/**
 * DTO para filtros de búsqueda
 */
export const FiltrosNotificacionDTO = z.object({
  canal: z.nativeEnum(CanalNotificacion).optional(),
  estado: z.string().optional(),
  tipo: z.nativeEnum(TipoNotificacion).optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
});

export type CrearNotificacionDTOType = z.infer<typeof CrearNotificacionDTO>;
export type MarcarEnviadaDTOType = z.infer<typeof MarcarEnviadaDTO>;
export type FiltrosNotificacionDTOType = z.infer<typeof FiltrosNotificacionDTO>;

