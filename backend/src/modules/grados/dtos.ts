/**
 * DTOs y validaciones para el módulo de Grados
 */

import { z } from 'zod';

export const CreateGradoDTO = z.object({
  numero: z
    .number()
    .int('El número debe ser un entero')
    .min(1, 'El número debe ser mayor a 0')
    .max(12, 'El número no puede exceder 12'),
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  nombrecorto: z
    .string()
    .max(20, 'El nombre corto no puede exceder 20 caracteres')
    .optional(),
  nivelId: z
    .string()
    .uuid('El ID del nivel debe ser un UUID válido')
    .optional(),
  orden: z
    .number()
    .int('El orden debe ser un entero')
    .min(1, 'El orden debe ser mayor a 0')
    .optional(), // Ahora es opcional, por defecto = numero
  activo: z.boolean().default(true).optional(),
});

export type CreateGradoDTOType = z.infer<typeof CreateGradoDTO>;

export const UpdateGradoDTO = CreateGradoDTO.partial();
export type UpdateGradoDTOType = z.infer<typeof UpdateGradoDTO>;

export const FiltrosGradoDTO = z.object({
  search: z.string().optional(),
  nivelId: z.string().uuid().optional(),
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
export type FiltrosGradoDTOType = z.infer<typeof FiltrosGradoDTO>;

