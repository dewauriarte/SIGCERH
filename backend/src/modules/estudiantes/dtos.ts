/**
 * DTOs y validaciones para el módulo de estudiantes
 */

import { z } from 'zod';

/**
 * DTO para crear estudiante
 */
export const CreateEstudianteDTO = z.object({
  dni: z
    .string()
    .length(8, 'El DNI debe tener exactamente 8 dígitos')
    .regex(/^\d{8}$/, 'El DNI solo debe contener números'),
  
  nombres: z
    .string()
    .min(2, 'Los nombres deben tener al menos 2 caracteres')
    .max(150, 'Los nombres no pueden tener más de 150 caracteres'),
  
  apellidoPaterno: z
    .string()
    .min(2, 'El apellido paterno debe tener al menos 2 caracteres')
    .max(100, 'El apellido paterno no puede tener más de 100 caracteres'),
  
  apellidoMaterno: z
    .string()
    .min(2, 'El apellido materno debe tener al menos 2 caracteres')
    .max(100, 'El apellido materno no puede tener más de 100 caracteres'),
  
  fechaNacimiento: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  
  lugarNacimiento: z
    .string()
    .max(200, 'El lugar de nacimiento no puede tener más de 200 caracteres')
    .optional(),
  
  sexo: z
    .enum(['M', 'F'], { errorMap: () => ({ message: 'El sexo debe ser M o F' }) })
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
  
  nombrePadre: z
    .string()
    .max(200, 'El nombre del padre no puede tener más de 200 caracteres')
    .optional(),
  
  nombreMadre: z
    .string()
    .max(200, 'El nombre de la madre no puede tener más de 200 caracteres')
    .optional(),
});

export type CreateEstudianteDTOType = z.infer<typeof CreateEstudianteDTO>;

/**
 * DTO para actualizar estudiante
 */
export const UpdateEstudianteDTO = z.object({
  dni: z
    .string()
    .length(8, 'El DNI debe tener exactamente 8 dígitos')
    .regex(/^\d{8}$/, 'El DNI solo debe contener números')
    .optional(),
  
  nombres: z
    .string()
    .min(2, 'Los nombres deben tener al menos 2 caracteres')
    .max(150, 'Los nombres no pueden tener más de 150 caracteres')
    .optional(),
  
  apellidoPaterno: z
    .string()
    .min(2, 'El apellido paterno debe tener al menos 2 caracteres')
    .max(100, 'El apellido paterno no puede tener más de 100 caracteres')
    .optional(),
  
  apellidoMaterno: z
    .string()
    .min(2, 'El apellido materno debe tener al menos 2 caracteres')
    .max(100, 'El apellido materno no puede tener más de 100 caracteres')
    .optional(),
  
  fechaNacimiento: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  
  lugarNacimiento: z
    .string()
    .max(200, 'El lugar de nacimiento no puede tener más de 200 caracteres')
    .optional(),
  
  sexo: z
    .enum(['M', 'F'], { errorMap: () => ({ message: 'El sexo debe ser M o F' }) })
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
  
  nombrePadre: z
    .string()
    .max(200, 'El nombre del padre no puede tener más de 200 caracteres')
    .optional(),
  
  nombreMadre: z
    .string()
    .max(200, 'El nombre de la madre no puede tener más de 200 caracteres')
    .optional(),
  
  activo: z.boolean().optional(),
});

export type UpdateEstudianteDTOType = z.infer<typeof UpdateEstudianteDTO>;

/**
 * DTO para búsqueda de estudiantes
 */
export const SearchEstudianteQueryDTO = z.object({
  dni: z.string().optional(),
  nombre: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
});

export type SearchEstudianteQueryDTOType = z.infer<typeof SearchEstudianteQueryDTO>;

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

/**
 * Middleware de validación para query params
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación en parámetros',
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

