/**
 * DTOs y validaciones para el módulo de Años Lectivos
 */

import { z } from 'zod';

const AnioLectivoBaseSchema = z.object({
  anio: z
    .number()
    .int('El año debe ser un entero')
    .min(1985, 'El año debe ser 1985 o posterior')
    .max(2100, 'El año no puede exceder 2100'),
  fechainicio: z
    .union([
      z.string().datetime(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      z.date(),
    ])
    .transform((val) => new Date(val)),
  fechafin: z
    .union([
      z.string().datetime(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      z.date(),
    ])
    .transform((val) => new Date(val)),
  activo: z.boolean().default(false).optional(),
  observaciones: z.string().optional(),
});

export const CreateAnioLectivoDTO = AnioLectivoBaseSchema.refine(
  (data) => data.fechainicio < data.fechafin,
  {
    message: 'La fecha de inicio debe ser anterior a la fecha de fin',
    path: ['fechafin'],
  }
);

export type CreateAnioLectivoDTOType = z.infer<typeof CreateAnioLectivoDTO>;

export const UpdateAnioLectivoDTO = z.object({
  anio: z
    .number()
    .int('El año debe ser un entero')
    .min(1985, 'El año debe ser 1985 o posterior')
    .max(2100, 'El año no puede exceder 2100')
    .optional(),
  fechainicio: z
    .union([
      z.string().datetime(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      z.date(),
    ])
    .transform((val) => new Date(val))
    .optional(),
  fechafin: z
    .union([
      z.string().datetime(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      z.date(),
    ])
    .transform((val) => new Date(val))
    .optional(),
  activo: z.boolean().optional(),
  observaciones: z.string().optional(),
});
export type UpdateAnioLectivoDTOType = z.infer<typeof UpdateAnioLectivoDTO>;

export const FiltrosAnioLectivoDTO = z.object({
  search: z.string().optional(),
  activo: z
    .union([z.boolean(), z.string(), z.undefined()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'boolean') return val;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
});
export type FiltrosAnioLectivoDTOType = z.infer<typeof FiltrosAnioLectivoDTO>;

