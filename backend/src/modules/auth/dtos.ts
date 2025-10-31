/**
 * DTOs y validaciones con Zod para autenticación
 */

import { z } from 'zod';

/**
 * DTO para registro de usuario
 */
export const RegisterDTO = z.object({
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(50, 'El usuario no puede tener más de 50 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'El usuario solo puede contener letras, números, guiones y puntos'),
  
  email: z
    .string()
    .email('Debe ser un correo electrónico válido')
    .max(100, 'El correo no puede tener más de 100 caracteres'),
  
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede tener más de 100 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  
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
  
  apellidos: z
    .string()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(150, 'Los apellidos no pueden tener más de 150 caracteres')
    .optional(),
  
  telefono: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, 'El teléfono solo puede contener números y símbolos válidos')
    .max(20, 'El teléfono no puede tener más de 20 caracteres')
    .optional(),
  
  cargo: z
    .string()
    .max(100, 'El cargo no puede tener más de 100 caracteres')
    .optional(),
  
  rolesIds: z
    .array(z.string().uuid('Cada rol debe ser un UUID válido'))
    .optional()
    .default([]),
});

export type RegisterDTOType = z.infer<typeof RegisterDTO>;

/**
 * DTO para login
 */
export const LoginDTO = z.object({
  usernameOrEmail: z
    .string()
    .min(1, 'El usuario o correo es requerido')
    .max(100, 'El usuario o correo es demasiado largo'),
  
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

export type LoginDTOType = z.infer<typeof LoginDTO>;

/**
 * DTO para refresh token
 */
export const RefreshTokenDTO = z.object({
  refreshToken: z
    .string()
    .min(1, 'El refresh token es requerido'),
});

export type RefreshTokenDTOType = z.infer<typeof RefreshTokenDTO>;

/**
 * DTO para forgot password
 */
export const ForgotPasswordDTO = z.object({
  email: z
    .string()
    .email('Debe ser un correo electrónico válido'),
});

export type ForgotPasswordDTOType = z.infer<typeof ForgotPasswordDTO>;

/**
 * DTO para reset password
 */
export const ResetPasswordDTO = z.object({
  token: z
    .string()
    .min(1, 'El token es requerido'),
  
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede tener más de 100 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
});

export type ResetPasswordDTOType = z.infer<typeof ResetPasswordDTO>;

/**
 * DTO para cambiar contraseña
 */
export const ChangePasswordDTO = z.object({
  currentPassword: z
    .string()
    .min(1, 'La contraseña actual es requerida'),
  
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(100, 'La nueva contraseña no puede tener más de 100 caracteres')
    .regex(/[A-Z]/, 'La nueva contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La nueva contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La nueva contraseña debe contener al menos un número'),
});

export type ChangePasswordDTOType = z.infer<typeof ChangePasswordDTO>;

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

