/**
 * DTOs y validaciones para el módulo de libros
 */

import { z } from 'zod';
import { EstadoLibro } from './types';

/**
 * DTO para crear libro
 */
export const CreateLibroDTO = z.object({
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .max(50, 'El código no puede tener más de 50 caracteres'),

  nivel_id: z
    .string()
    .uuid('El ID del nivel debe ser un UUID válido')
    .optional(),

  nombre: z
    .string()
    .max(255, 'El nombre no puede tener más de 255 caracteres')
    .optional(),

  descripcion: z.string().optional(),

  tipo_acta: z
    .enum(['EVALUACION', 'RECUPERACION', 'SUBSANACION', 'TRASLADO', 'CONVALIDACION'], {
      errorMap: () => ({
        message: 'El tipo de acta debe ser EVALUACION, RECUPERACION, SUBSANACION, TRASLADO o CONVALIDACION',
      }),
    })
    .optional(),

  anio_inicio: z
    .number()
    .int('El año de inicio debe ser un número entero')
    .min(1985, 'El año de inicio debe ser mayor o igual a 1985')
    .max(2025, 'El año de inicio debe ser menor o igual a 2025'),

  anio_fin: z
    .number()
    .int('El año de fin debe ser un número entero')
    .min(1985, 'El año de fin debe ser mayor o igual a 1985')
    .max(2030, 'El año de fin debe ser menor o igual a 2030')
    .optional(),

  folio_inicio: z
    .number()
    .int('El folio de inicio debe ser un número entero')
    .positive('El folio de inicio debe ser positivo')
    .optional()
    .default(1),

  folio_fin: z
    .number()
    .int('El folio de fin debe ser un número entero')
    .positive('El folio de fin debe ser positivo')
    .optional(),

  total_folios: z
    .number()
    .int('El total de folios debe ser un número entero')
    .positive('El total de folios debe ser positivo')
    .optional(),

  ubicacion_fisica: z
    .string()
    .max(255, 'La ubicación física no puede tener más de 255 caracteres')
    .optional(),

  estante: z
    .string()
    .max(50, 'El estante no puede tener más de 50 caracteres')
    .optional(),

  seccion_archivo: z
    .enum(['HISTORICOS', 'ACTIVOS', 'ARCHIVO_CENTRAL', 'DIRECCION'], {
      errorMap: () => ({
        message: 'La sección debe ser HISTORICOS, ACTIVOS, ARCHIVO_CENTRAL o DIRECCION',
      }),
    })
    .optional(),

  estado: z
    .nativeEnum(EstadoLibro, {
      errorMap: () => ({
        message: `Estado debe ser uno de: ${Object.values(EstadoLibro).join(', ')}`,
      }),
    })
    .optional(),

  observaciones: z.string().optional(),
}).refine(
  (data) => {
    if (data.anio_fin && data.anio_inicio && data.anio_fin < data.anio_inicio) {
      return false;
    }
    return true;
  },
  {
    message: 'El año de fin debe ser mayor o igual al año de inicio',
    path: ['anio_fin'],
  }
).refine(
  (data) => {
    if (data.folio_fin && data.folio_inicio && data.folio_fin < data.folio_inicio) {
      return false;
    }
    return true;
  },
  {
    message: 'El folio de fin debe ser mayor o igual al folio de inicio',
    path: ['folio_fin'],
  }
);

export type CreateLibroDTOType = z.infer<typeof CreateLibroDTO>;

/**
 * DTO para actualizar libro
 * Todos los campos son opcionales en la actualización
 */
export const UpdateLibroDTO = z.object({
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .max(50, 'El código no puede tener más de 50 caracteres')
    .optional(),

  nivel_id: z
    .string()
    .uuid('El ID del nivel debe ser un UUID válido')
    .optional(),

  nombre: z
    .string()
    .max(255, 'El nombre no puede tener más de 255 caracteres')
    .optional(),

  descripcion: z.string().optional(),

  tipo_acta: z
    .enum(['EVALUACION', 'RECUPERACION', 'SUBSANACION', 'TRASLADO', 'CONVALIDACION'], {
      errorMap: () => ({
        message: 'El tipo de acta debe ser EVALUACION, RECUPERACION, SUBSANACION, TRASLADO o CONVALIDACION',
      }),
    })
    .optional(),

  anio_inicio: z
    .number()
    .int('El año de inicio debe ser un número entero')
    .min(1985, 'El año de inicio debe ser mayor o igual a 1985')
    .max(2025, 'El año de inicio debe ser menor o igual a 2025')
    .optional(),

  anio_fin: z
    .number()
    .int('El año de fin debe ser un número entero')
    .min(1985, 'El año de fin debe ser mayor o igual a 1985')
    .max(2030, 'El año de fin debe ser menor o igual a 2030')
    .optional(),

  folio_inicio: z
    .number()
    .int('El folio de inicio debe ser un número entero')
    .positive('El folio de inicio debe ser positivo')
    .optional(),

  folio_fin: z
    .number()
    .int('El folio de fin debe ser un número entero')
    .positive('El folio de fin debe ser positivo')
    .optional(),

  total_folios: z
    .number()
    .int('El total de folios debe ser un número entero')
    .positive('El total de folios debe ser positivo')
    .optional(),

  ubicacion_fisica: z
    .string()
    .max(255, 'La ubicación física no puede tener más de 255 caracteres')
    .optional(),

  estante: z
    .string()
    .max(50, 'El estante no puede tener más de 50 caracteres')
    .optional(),

  seccion_archivo: z
    .enum(['HISTORICOS', 'ACTIVOS', 'ARCHIVO_CENTRAL', 'DIRECCION'], {
      errorMap: () => ({
        message: 'La sección debe ser HISTORICOS, ACTIVOS, ARCHIVO_CENTRAL o DIRECCION',
      }),
    })
    .optional(),

  estado: z
    .nativeEnum(EstadoLibro, {
      errorMap: () => ({
        message: `Estado debe ser uno de: ${Object.values(EstadoLibro).join(', ')}`,
      }),
    })
    .optional(),

  observaciones: z.string().optional(),
});

export type UpdateLibroDTOType = z.infer<typeof UpdateLibroDTO>;

/**
 * DTO para filtros de búsqueda
 */
export const FiltrosLibroDTO = z.object({
  search: z.string().optional(),
  estado: z.nativeEnum(EstadoLibro).optional(),
  activo: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'boolean') return val;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    })
    .optional(),
});

export type FiltrosLibroDTOType = z.infer<typeof FiltrosLibroDTO>;

