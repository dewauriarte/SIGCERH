/**
 * DTOs y validaciones para el módulo de Niveles Educativos
 */

import { z } from 'zod';

export const CreateNivelEducativoDTO = z.object({
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .max(20, 'El código no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'El código debe contener solo letras mayúsculas, números y guiones bajos'),
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: z
    .string()
    .max(255, 'La descripción no puede exceder 255 caracteres')
    .optional(),
  orden: z
    .number()
    .int('El orden debe ser un entero')
    .min(1, 'El orden debe ser mayor a 0'),
  activo: z.boolean().default(true).optional(),
});

export type CreateNivelEducativoDTOType = z.infer<typeof CreateNivelEducativoDTO>;

export const UpdateNivelEducativoDTO = CreateNivelEducativoDTO.partial();
export type UpdateNivelEducativoDTOType = z.infer<typeof UpdateNivelEducativoDTO>;

export const FiltrosNivelEducativoDTO = z.object({
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
export type FiltrosNivelEducativoDTOType = z.infer<typeof FiltrosNivelEducativoDTO>;

