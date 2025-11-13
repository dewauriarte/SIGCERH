/**
 * Rate Limiting Middleware
 * Protección moderada para sistema público escalable
 */

import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Rate limiter para endpoints de upload de actas
 * Límite: 20 uploads por hora por IP (suficiente para uso normal, previene abuso)
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 uploads por hora
  message: {
    success: false,
    message: 'Demasiadas subidas de archivos. Por favor intente más tarde.',
    retryAfter: '1 hora'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Excluir usuarios autenticados con rol ADMIN o SISTEMA
  skip: (req: Request) => {
    const user = (req as any).user;
    return user && (user.rol === 'ADMIN' || user.rol === 'SISTEMA');
  },
  keyGenerator: (req: Request) => {
    // Usar IP + usuario si está autenticado
    const user = (req as any).user;
    return user ? `${req.ip}-${user.id}` : req.ip || 'unknown';
  }
});

/**
 * Rate limiter para procesamiento OCR
 * Límite: 50 procesamientos por hora por usuario (4 editores × 12-13 actas/hora)
 */
export const ocrRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 procesamientos por hora
  message: {
    success: false,
    message: 'Límite de procesamiento OCR alcanzado. Por favor intente más tarde.',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    const user = (req as any).user;
    return user && user.rol === 'ADMIN';
  },
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user ? user.id : req.ip || 'unknown';
  }
});

/**
 * Rate limiter general para API pública
 * Límite: 100 requests por 15 minutos (suficiente para uso normal)
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por 15 minutos
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Por favor intente más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // No limitar rutas de autenticación
    return req.path.includes('/auth/');
  }
});

/**
 * Rate limiter para solicitudes públicas de certificados
 * Límite: 10 solicitudes por día por IP (previene spam pero permite uso legítimo)
 */
export const solicitudPublicaLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 10, // 10 solicitudes por día
  message: {
    success: false,
    message: 'Ha alcanzado el límite de solicitudes diarias. Por favor intente mañana.',
    retryAfter: '24 horas'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Por IP para usuarios no autenticados
    return req.ip || 'unknown';
  }
});
