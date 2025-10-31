/**
 * DTOs para el módulo de certificados
 * Validación con Zod
 */

import { z } from 'zod';
import { EstadoCertificado } from './types';

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
// DTOs para Certificados
// ==========================================

/**
 * DTO para generar certificado
 * Las notas se obtienen de la BD (certificadodetalle + certificadonota)
 */
export const GenerarCertificadoDTO = z.object({
  estudianteId: z.string().uuid('ID de estudiante inválido'),
  lugarEmision: z.string().optional().default('PUNO'),
  observaciones: z
    .object({
      retiros: z.string().optional(),
      traslados: z.string().optional(),
      siagie: z.string().optional(),
      pruebasUbicacion: z.string().optional(),
      convalidacion: z.string().optional(),
      otros: z.string().optional(),
    })
    .optional(),
});

/**
 * DTO para generar PDF de un certificado existente
 */
export const GenerarPDFDTO = z.object({
  certificadoId: z.string().uuid('ID de certificado inválido'),
  regenerar: z.boolean().optional().default(false), // Regenerar si ya existe
});

/**
 * DTO para anular certificado
 */
export const AnularCertificadoDTO = z.object({
  motivoAnulacion: z
    .string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(500, 'El motivo no puede exceder 500 caracteres'),
});

/**
 * DTO para rectificar certificado
 */
export const RectificarCertificadoDTO = z.object({
  motivoRectificacion: z
    .string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(500, 'El motivo no puede exceder 500 caracteres'),
  observaciones: z
    .object({
      retiros: z.string().optional(),
      traslados: z.string().optional(),
      siagie: z.string().optional(),
      pruebasUbicacion: z.string().optional(),
      convalidacion: z.string().optional(),
      otros: z.string().optional(),
    })
    .optional(),
});

/**
 * DTO para marcar firma manuscrita
 */
export const MarcarFirmaManuscritaDTO = z.object({
  observaciones: z.string().optional(),
});

/**
 * DTO para filtros de búsqueda
 */
export const FiltrosCertificadoDTO = z.object({
  estudianteId: z.string().uuid().optional(),
  estado: z.nativeEnum(EstadoCertificado).optional(),
  codigoVirtual: z.string().optional(),
  numero: z.string().optional(),
  fechaEmisionDesde: z.coerce.date().optional(),
  fechaEmisionHasta: z.coerce.date().optional(),
});

export type GenerarCertificadoDTOType = z.infer<typeof GenerarCertificadoDTO>;
export type GenerarPDFDTOType = z.infer<typeof GenerarPDFDTO>;
export type AnularCertificadoDTOType = z.infer<typeof AnularCertificadoDTO>;
export type RectificarCertificadoDTOType = z.infer<typeof RectificarCertificadoDTO>;
export type MarcarFirmaManuscritaDTOType = z.infer<typeof MarcarFirmaManuscritaDTO>;
export type FiltrosCertificadoDTOType = z.infer<typeof FiltrosCertificadoDTO>;

