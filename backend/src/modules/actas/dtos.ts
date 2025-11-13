/**
 * DTOs y validaciones para el módulo de actas físicas
 */

import { z } from 'zod';
import { EstadoActa, TipoActa, Turno } from './types';

/**
 * DTO para crear acta física
 */
export const CreateActaFisicaDTO = z.object({
  numero: z
    .string()
    .min(1, 'El número de acta es requerido')
    .max(50, 'El número de acta no puede tener más de 50 caracteres'),

  tipo: z.nativeEnum(TipoActa, {
    errorMap: () => ({
      message: `Tipo debe ser uno de: ${Object.values(TipoActa).join(', ')}`,
    }),
  }),

  anioLectivoId: z
    .string()
    .uuid('El ID del año lectivo debe ser un UUID válido'),

  gradoId: z.string().uuid('El ID del grado debe ser un UUID válido'),

  seccion: z
    .string()
    .max(10, 'La sección no puede tener más de 10 caracteres')
    .optional(),

  turno: z
    .nativeEnum(Turno, {
      errorMap: () => ({
        message: `Turno debe ser uno de: ${Object.values(Turno).join(', ')}`,
      }),
    })
    .optional(),

  fechaEmision: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),

  libroId: z
    .string()
    .uuid('El ID del libro debe ser un UUID válido')
    .optional(),

  folio: z
    .string()
    .max(50, 'El folio no puede tener más de 50 caracteres')
    .optional(),

  tipoEvaluacion: z
    .string()
    .max(50, 'El tipo de evaluación no puede tener más de 50 caracteres')
    .optional(),

  colegioOrigen: z
    .string()
    .max(255, 'El colegio de origen no puede tener más de 255 caracteres')
    .optional(),

  ubicacionFisica: z
    .string()
    .max(255, 'La ubicación física no puede tener más de 255 caracteres')
    .optional(),

  observaciones: z.string().optional(),
});

export type CreateActaFisicaDTOType = z.infer<typeof CreateActaFisicaDTO>;

/**
 * DTO para actualizar metadata de acta
 */
export const UpdateActaFisicaDTO = z.object({
  numero: z
    .string()
    .min(1, 'El número de acta es requerido')
    .max(50, 'El número de acta no puede tener más de 50 caracteres')
    .optional(),

  tipo: z
    .nativeEnum(TipoActa, {
      errorMap: () => ({
        message: `Tipo debe ser uno de: ${Object.values(TipoActa).join(', ')}`,
      }),
    })
    .optional(),

  seccion: z
    .string()
    .max(10, 'La sección no puede tener más de 10 caracteres')
    .optional(),

  turno: z
    .nativeEnum(Turno, {
      errorMap: () => ({
        message: `Turno debe ser uno de: ${Object.values(Turno).join(', ')}`,
      }),
    })
    .optional(),

  fechaEmision: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),

  libroId: z
    .string()
    .uuid('El ID del libro debe ser un UUID válido')
    .optional(),

  folio: z
    .string()
    .max(50, 'El folio no puede tener más de 50 caracteres')
    .optional(),

  tipoEvaluacion: z
    .string()
    .max(50, 'El tipo de evaluación no puede tener más de 50 caracteres')
    .optional(),

  colegioOrigen: z
    .string()
    .max(255, 'El colegio de origen no puede tener más de 255 caracteres')
    .optional(),

  ubicacionFisica: z
    .string()
    .max(255, 'La ubicación física no puede tener más de 255 caracteres')
    .optional(),

  observaciones: z.string().optional(),

  // NOTA: No existe campo 'estadoFisico' en la BD
  // El campo 'estado' es para el flujo de trabajo (DISPONIBLE, ASIGNADA, etc.)
});

export type UpdateActaFisicaDTOType = z.infer<typeof UpdateActaFisicaDTO>;

/**
 * DTO para filtrar actas
 */
export const FiltrosActaDTO = z.object({
  estado: z.nativeEnum(EstadoActa).optional(),
  anioLectivoId: z.string().uuid().optional(),
  gradoId: z.string().uuid().optional(),
  procesado: z.boolean().optional(),
  fechaDesde: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  fechaHasta: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  solicitudId: z.string().uuid().optional(),
});

export type FiltrosActaDTOType = z.infer<typeof FiltrosActaDTO>;

/**
 * DTO para asignar acta a solicitud
 */
export const AsignarSolicitudDTO = z.object({
  solicitudId: z.string().uuid('El ID de solicitud debe ser un UUID válido'),
});

export type AsignarSolicitudDTOType = z.infer<typeof AsignarSolicitudDTO>;

/**
 * DTO para marcar acta como encontrada/no encontrada
 */
export const CambiarEstadoActaDTO = z.object({
  observaciones: z
    .string()
    .min(5, 'Las observaciones deben tener al menos 5 caracteres')
    .optional(),
});

export type CambiarEstadoActaDTOType = z.infer<typeof CambiarEstadoActaDTO>;

/**
 * DTO para procesar OCR
 */
export const ProcesarOCRDTO = z.object({
  estudiantes: z.array(
    z.object({
      numero: z.number().int().positive(),
      dni: z.string().length(8).optional(),
      apellidoPaterno: z.string().min(1),
      apellidoMaterno: z.string().min(1),
      nombres: z.string().min(1),
      sexo: z.enum(['M', 'F']),
      fechaNacimiento: z.string().optional(),
      notas: z.record(z.number().int().min(0).max(20)),
      situacionFinal: z.string().optional(),
    })
  ),
  metadata: z
    .object({
      fechaProcesamiento: z.string().optional(),
      algoritmo: z.string().optional(),
      confianza: z.number().min(0).max(100).optional(),
    })
    .optional(),
});

export type ProcesarOCRDTOType = z.infer<typeof ProcesarOCRDTO>;

/**
 * DTO para validación manual
 */
export const ValidacionManualDTO = z.object({
  observaciones: z
    .string()
    .min(10, 'Las observaciones de validación deben tener al menos 10 caracteres'),
  validado: z.boolean(),
});

export type ValidacionManualDTOType = z.infer<typeof ValidacionManualDTO>;

/**
 * DTO para validación con correcciones
 */
export const ValidacionConCorreccionesDTO = z.object({
  validado: z.boolean(),
  observaciones: z
    .string()
    .min(10, 'Las observaciones son requeridas'),
  correcciones: z
    .array(
      z.object({
        estudianteId: z.string().uuid(),
        campo: z.string(),
        valorAnterior: z.string(),
        valorNuevo: z.string(),
      })
    )
    .optional(),
});

export type ValidacionConCorreccionesDTOType = z.infer<
  typeof ValidacionConCorreccionesDTO
>;

/**
 * Middleware de validación Zod
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

