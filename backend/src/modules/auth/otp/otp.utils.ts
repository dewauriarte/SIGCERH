/**
 * Utilidades para OTP
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';

/**
 * Genera un código OTP numérico aleatorio
 */
export function generarCodigoOTP(longitud: number = 6): string {
  const min = Math.pow(10, longitud - 1);
  const max = Math.pow(10, longitud) - 1;
  
  // Usar crypto para generar números aleatorios seguros
  const randomBuffer = crypto.randomBytes(4);
  const randomNumber = randomBuffer.readUInt32BE(0);
  
  // Mapear a nuestro rango
  const codigo = (randomNumber % (max - min + 1)) + min;
  
  return codigo.toString().padStart(longitud, '0');
}

/**
 * Hashea un código OTP
 */
export async function hashearOTP(codigo: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(codigo, salt);
}

/**
 * Compara un código OTP con su hash
 */
export async function compararOTP(codigo: string, hash: string): Promise<boolean> {
  return bcrypt.compare(codigo, hash);
}

/**
 * Calcula la fecha de expiración
 */
export function calcularExpiracion(minutos: number): Date {
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() + minutos);
  return ahora;
}

/**
 * Verifica si un OTP ha expirado
 */
export function haExpirado(fechaExpiracion: Date): boolean {
  return new Date() > fechaExpiracion;
}

/**
 * Formatea el código para visualización (ej: 123456 -> 123-456)
 */
export function formatearCodigo(codigo: string): string {
  if (codigo.length === 6) {
    return `${codigo.substring(0, 3)}-${codigo.substring(3)}`;
  }
  return codigo;
}
