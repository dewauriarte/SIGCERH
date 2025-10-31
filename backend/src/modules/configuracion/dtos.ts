/**
 * DTOs y validaciones para el módulo de configuración
 */

import { z } from 'zod';

/**
 * DTO para actualizar configuración institucional
 */
export const UpdateConfiguracionDTO = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'El nombre no puede tener más de 200 caracteres')
    .optional(),
  
  codigoModular: z
    .string()
    .regex(/^\d{7}$/, 'El código modular debe tener exactamente 7 dígitos')
    .optional(),
  
  direccion: z
    .string()
    .max(300, 'La dirección no puede tener más de 300 caracteres')
    .optional(),
  
  telefono: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, 'El teléfono solo puede contener números y símbolos válidos')
    .max(20, 'El teléfono no puede tener más de 20 caracteres')
    .optional(),
  
  email: z
    .string()
    .email('Debe ser un correo electrónico válido')
    .max(100, 'El correo no puede tener más de 100 caracteres')
    .optional(),
});

export type UpdateConfiguracionDTOType = z.infer<typeof UpdateConfiguracionDTO>;

/**
 * DTO para crear nivel educativo
 */
export const CreateNivelDTO = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  
  codigo: z
    .string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(20, 'El código no puede tener más de 20 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'El código solo puede contener letras mayúsculas, números y guiones bajos'),
  
  descripcion: z
    .string()
    .max(500, 'La descripción no puede tener más de 500 caracteres')
    .optional(),
  
  orden: z
    .number()
    .int('El orden debe ser un número entero')
    .min(0, 'El orden no puede ser negativo')
    .optional()
    .default(0),
});

export type CreateNivelDTOType = z.infer<typeof CreateNivelDTO>;

/**
 * DTO para actualizar nivel educativo
 */
export const UpdateNivelDTO = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede tener más de 100 caracteres')
    .optional(),
  
  codigo: z
    .string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(20, 'El código no puede tener más de 20 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'El código solo puede contener letras mayúsculas, números y guiones bajos')
    .optional(),
  
  descripcion: z
    .string()
    .max(500, 'La descripción no puede tener más de 500 caracteres')
    .optional(),
  
  orden: z
    .number()
    .int('El orden debe ser un número entero')
    .min(0, 'El orden no puede ser negativo')
    .optional(),
  
  activo: z
    .boolean()
    .optional(),
});

export type UpdateNivelDTOType = z.infer<typeof UpdateNivelDTO>;

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

