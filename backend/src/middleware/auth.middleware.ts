/**
 * Middleware de autenticación
 * Verifica que el usuario tenga un token JWT válido
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@modules/auth/utils/jwt.utils';
import { authService } from '@modules/auth/auth.service';
import { logger } from '@config/logger';

/**
 * Extiende el tipo Request para incluir el usuario autenticado
 */
declare global {
  namespace Express {
    interface Request {
      user?: any;
      sessionId?: string;
    }
  }
}

/**
 * Middleware que verifica el token JWT y carga el usuario
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Token de autenticación no proporcionado',
      });
      return;
    }

    // Formato: "Bearer TOKEN"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer TOKEN',
      });
      return;
    }

    const token = parts[1]!; // Ya verificamos que parts.length === 2

    // Verificar token
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Token inválido';
      res.status(401).json({
        success: false,
        message,
      });
      return;
    }

    // Obtener usuario completo de la base de datos
    if (!payload.sub) {
      res.status(401).json({
        success: false,
        message: 'Token inválido: falta identificador de usuario',
      });
      return;
    }

    // TypeScript ya sabe que payload.sub existe aquí
    const userId: string = payload.sub;
    const user = await authService.getUserById(userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    if (!user.activo) {
      res.status(403).json({
        success: false,
        message: 'Usuario inactivo',
      });
      return;
    }

    // Agregar usuario al request
    req.user = user;

    next();
  } catch (error: unknown) {
    logger.error('Error en middleware de autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar autenticación',
    });
  }
};

/**
 * Middleware opcional: si hay token lo verifica, si no hay continúa
 */
export const authenticateOptional = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      next();
      return;
    }

    const token = parts[1]!; // Ya verificamos que parts.length === 2

    try {
      const payload = verifyToken(token);
      if (payload.sub) {
        const userId: string = payload.sub;
        const user = await authService.getUserById(userId);
        
        if (user && user.activo) {
          req.user = user;
        }
      }
    } catch {
      // Si hay error, simplemente no agregamos el usuario
    }

    next();
  } catch (error) {
    logger.error('Error en middleware de autenticación opcional:', error);
    next();
  }
};

