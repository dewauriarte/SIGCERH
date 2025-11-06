import { z } from 'zod';

// ==================== LOGIN ====================
export const loginSchema = z.object({
  usernameOrEmail: z
    .string()
    .min(1, 'Usuario o correo es requerido')
    .max(100, 'Usuario o correo demasiado largo'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ==================== REGISTRO ====================
export const registerSchema = z.object({
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
  
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña'),
  
  dni: z.string().optional(),
  
  nombres: z.string().optional(),
  
  apellidos: z.string().optional(),
  
  telefono: z.string().optional(),
  
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Debes aceptar los términos y condiciones',
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// ==================== FORGOT PASSWORD ====================
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Debe ser un correo electrónico válido')
    .min(1, 'El correo es requerido'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ==================== RESET PASSWORD ====================
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token inválido'),
  
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede tener más de 100 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ==================== CHANGE PASSWORD ====================
export const changePasswordSchema = z.object({
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
  
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu nueva contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'La nueva contraseña debe ser diferente a la actual',
  path: ['newPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
