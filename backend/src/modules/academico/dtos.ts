/**
 * DTOs y validaciones para el módulo académico
 */

import { z } from 'zod';

/**
 * DTO para crear año lectivo
 */
export const CreateAnioLectivoDTO = z.object({
  anio: z
    .number()
    .int('El año debe ser un número entero')
    .min(1985, 'El año debe ser mayor o igual a 1985')
    .max(2012, 'El año debe ser menor o igual a 2012'),
  
  fechaInicio: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  
  fechaFin: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
});

export type CreateAnioLectivoDTOType = z.infer<typeof CreateAnioLectivoDTO>;

/**
 * DTO para actualizar año lectivo
 */
export const UpdateAnioLectivoDTO = z.object({
  anio: z
    .number()
    .int('El año debe ser un número entero')
    .min(1985, 'El año debe ser mayor o igual a 1985')
    .max(2012, 'El año debe ser menor o igual a 2012')
    .optional(),
  
  fechaInicio: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  
  fechaFin: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  
  activo: z.boolean().optional(),
});

export type UpdateAnioLectivoDTOType = z.infer<typeof UpdateAnioLectivoDTO>;

/**
 * DTO para crear grado
 */
export const CreateGradoDTO = z.object({
  nivelEducativoId: z.string().uuid('El ID del nivel educativo debe ser un UUID válido').optional(),
  
  numero: z
    .number()
    .int('El número debe ser un número entero')
    .min(1, 'El número debe ser mayor a 0')
    .max(7, 'El número no puede ser mayor a 7'),
  
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres'),
  
  nombreCorto: z
    .string()
    .max(20, 'El nombre corto no puede tener más de 20 caracteres')
    .optional(),
  
  orden: z
    .number()
    .int('El orden debe ser un número entero')
    .min(0, 'El orden no puede ser negativo')
    .optional()
    .default(0),
});

export type CreateGradoDTOType = z.infer<typeof CreateGradoDTO>;

/**
 * DTO para actualizar grado
 */
export const UpdateGradoDTO = z.object({
  nivelEducativoId: z.string().uuid('El ID del nivel educativo debe ser un UUID válido').optional(),
  
  numero: z
    .number()
    .int('El número debe ser un número entero')
    .min(1, 'El número debe ser mayor a 0')
    .max(7, 'El número no puede ser mayor a 7')
    .optional(),
  
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres')
    .optional(),
  
  nombreCorto: z
    .string()
    .max(20, 'El nombre corto no puede tener más de 20 caracteres')
    .optional(),
  
  orden: z
    .number()
    .int('El orden debe ser un número entero')
    .min(0, 'El orden no puede ser negativo')
    .optional(),
  
  activo: z.boolean().optional(),
});

export type UpdateGradoDTOType = z.infer<typeof UpdateGradoDTO>;

/**
 * DTO para crear área curricular
 */
export const CreateAreaCurricularDTO = z.object({
  codigo: z
    .string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(20, 'El código no puede tener más de 20 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'El código solo puede contener letras mayúsculas, números y guiones bajos'),
  
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede tener más de 150 caracteres'),
  
  orden: z
    .number()
    .int('El orden debe ser un número entero')
    .min(0, 'El orden no puede ser negativo')
    .optional()
    .default(0),
  
  esCompetenciaTransversal: z.boolean().optional().default(false),
});

export type CreateAreaCurricularDTOType = z.infer<typeof CreateAreaCurricularDTO>;

/**
 * DTO para actualizar área curricular
 */
export const UpdateAreaCurricularDTO = z.object({
  codigo: z
    .string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(20, 'El código no puede tener más de 20 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'El código solo puede contener letras mayúsculas, números y guiones bajos')
    .optional(),
  
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede tener más de 150 caracteres')
    .optional(),
  
  orden: z
    .number()
    .int('El orden debe ser un número entero')
    .min(0, 'El orden no puede ser negativo')
    .optional(),
  
  esCompetenciaTransversal: z.boolean().optional(),
  
  activo: z.boolean().optional(),
});

export type UpdateAreaCurricularDTOType = z.infer<typeof UpdateAreaCurricularDTO>;

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
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

