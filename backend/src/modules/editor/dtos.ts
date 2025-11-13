/**
 * DTOs para el módulo Editor
 * Validación de datos de entrada con Zod
 */

import { z } from 'zod';

/**
 * DTO para marcar acta como encontrada
 */
export const MarcarActaEncontradaDTO = z.object({
  ubicacionFisica: z.string().min(1, 'La ubicación física es requerida'),
  observaciones: z.string().optional(),
});

export type MarcarActaEncontradaInput = z.infer<typeof MarcarActaEncontradaDTO>;

/**
 * DTO para marcar acta como NO encontrada
 */
export const MarcarActaNoEncontradaDTO = z.object({
  motivoNoEncontrada: z.string().min(10, 'El motivo debe tener al menos 10 caracteres'),
  observaciones: z.string().optional(),
});

export type MarcarActaNoEncontradaInput = z.infer<typeof MarcarActaNoEncontradaDTO>;

/**
 * DTO para paginación
 */
export const PaginationDTO = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof PaginationDTO>;

/**
 * DTO para filtros de expedientes
 */
export const FiltrosExpedientesDTO = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  estadoBusqueda: z.enum([
    'PENDIENTE_BUSQUEDA',
    'DERIVADO_A_EDITOR',
    'EN_BUSQUEDA',
    'ACTA_ENCONTRADA',
    'ACTA_ENCONTRADA_PENDIENTE_PAGO',
    'ACTA_NO_ENCONTRADA',
    'ESPERANDO_PAGO',
    'LISTO_PARA_OCR',
    'EN_PROCESAMIENTO_OCR',
  ]).optional(),
  search: z.string().optional(), // Buscar por nombre de estudiante o número de expediente
});

export type FiltrosExpedientesInput = z.infer<typeof FiltrosExpedientesDTO>;

