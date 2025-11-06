/**
 * DTOs (Data Transfer Objects) para OTP
 */

import { z } from 'zod';
import { OTPTipo, OTPProposito } from './otp.types';

// DTO para generar OTP
export const GenerarOTPDTO = z.object({
  usuarioId: z.string().uuid('ID de usuario inválido'),
  tipo: z.nativeEnum(OTPTipo, {
    errorMap: () => ({ message: 'Tipo de OTP inválido' }),
  }),
  proposito: z.nativeEnum(OTPProposito, {
    errorMap: () => ({ message: 'Propósito de OTP inválido' }),
  }),
  destinatario: z.string().min(1, 'Destinatario requerido'),
});

// DTO para verificar OTP
export const VerificarOTPDTO = z.object({
  usuarioId: z.string().uuid('ID de usuario inválido'),
  codigo: z
    .string()
    .regex(/^\d{6}$/, 'El código debe tener 6 dígitos')
    .length(6, 'El código debe tener 6 dígitos'),
  proposito: z.nativeEnum(OTPProposito, {
    errorMap: () => ({ message: 'Propósito de OTP inválido' }),
  }),
});

// DTO para solicitar OTP en registro
export const SolicitarOTPRegistroDTO = z.object({
  email: z.string().email('Email inválido'),
});

// DTO para verificar OTP en registro
export const VerificarOTPRegistroDTO = z.object({
  email: z.string().email('Email inválido'),
  codigo: z
    .string()
    .regex(/^\d{6}$/, 'El código debe tener 6 dígitos')
    .length(6, 'El código debe tener 6 dígitos'),
});

export type GenerarOTPInput = z.infer<typeof GenerarOTPDTO>;
export type VerificarOTPInput = z.infer<typeof VerificarOTPDTO>;
export type SolicitarOTPRegistroInput = z.infer<typeof SolicitarOTPRegistroDTO>;
export type VerificarOTPRegistroInput = z.infer<typeof VerificarOTPRegistroDTO>;
