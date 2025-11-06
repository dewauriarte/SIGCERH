/**
 * Tipos para el módulo OTP
 */

export interface OTPData {
  id: string;
  usuario_id: string;
  codigo: string; // Hash del código
  tipo: OTPTipo;
  proposito: OTPProposito;
  intentos: number;
  usado: boolean;
  expira: Date;
  createdAt: Date;
}

export enum OTPTipo {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum OTPProposito {
  REGISTRO = 'REGISTRO',
  LOGIN = 'LOGIN',
  RECUPERACION_PASSWORD = 'RECUPERACION_PASSWORD',
  CAMBIO_EMAIL = 'CAMBIO_EMAIL',
  CAMBIO_TELEFONO = 'CAMBIO_TELEFONO',
  VERIFICACION_2FA = 'VERIFICACION_2FA',
}

export interface GenerarOTPRequest {
  usuarioId: string;
  tipo: OTPTipo;
  proposito: OTPProposito;
  destinatario: string; // Email o teléfono
}

export interface VerificarOTPRequest {
  usuarioId: string;
  codigo: string;
  proposito: OTPProposito;
}

export interface OTPConfig {
  longitudCodigo: number;
  expiracionMinutos: number;
  maxIntentos: number;
  cooldownSegundos: number;
}
