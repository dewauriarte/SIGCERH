/**
 * Utilidades para hash de contraseñas con bcrypt
 */

import bcrypt from 'bcrypt';
import { config } from '@config/env';

/**
 * Genera un hash de una contraseña
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(config.security.bcrypt.rounds);
  return bcrypt.hash(password, salt);
};

/**
 * Compara una contraseña en texto plano con un hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Genera una contraseña aleatoria segura
 */
export const generateRandomPassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const all = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

