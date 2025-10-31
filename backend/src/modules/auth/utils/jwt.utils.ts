/**
 * Utilidades para JWT (JSON Web Tokens)
 */

import jwt from 'jsonwebtoken';
import { config } from '@config/env';
import { JwtPayload } from '../types';

/**
 * Genera un Access Token (JWT de corta duración)
 */
export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(
    payload,
    config.security.jwt.secret,
    {
      expiresIn: config.security.jwt.expiresIn,
      issuer: 'sigcerh-backend',
      audience: 'sigcerh-frontend',
    } as jwt.SignOptions
  );
};

/**
 * Genera un Refresh Token (JWT de larga duración)
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    config.security.jwt.secret,
    {
      expiresIn: config.security.jwt.refreshExpiresIn,
      issuer: 'sigcerh-backend',
      audience: 'sigcerh-frontend',
    } as jwt.SignOptions
  );
};

/**
 * Verifica y decodifica un token JWT
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, config.security.jwt.secret, {
      issuer: 'sigcerh-backend',
      audience: 'sigcerh-frontend',
    }) as JwtPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido');
    }
    throw new Error('Error al verificar token');
  }
};

/**
 * Decodifica un token sin verificar (útil para obtener info sin validar)
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Obtiene el tiempo de expiración de un token
 */
export const getTokenExpiration = (token: string): Date | null => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  return new Date(decoded.exp * 1000);
};

/**
 * Verifica si un token está expirado
 */
export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  return expiration < new Date();
};

