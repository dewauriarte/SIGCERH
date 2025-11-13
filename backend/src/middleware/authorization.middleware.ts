/**
 * Middleware de autorización
 * Verifica que el usuario tenga los roles o permisos necesarios
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@config/logger';
import { AuthRole } from '@modules/auth/types';

/**
 * Middleware que verifica si el usuario tiene al menos uno de los roles especificados
 */
export const requireRole = (rolesPermitidos: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const rolesUsuario = req.user.roles.map((r: AuthRole) => r.codigo);
      const tieneRol = rolesPermitidos.some(rol => rolesUsuario.includes(rol));

      if (!tieneRol) {
        logger.warn(`Usuario ${req.user.username} intentó acceder sin rol requerido. Roles necesarios: ${rolesPermitidos.join(', ')}`);
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este recurso',
          rolesRequeridos: rolesPermitidos,
        });
        return;
      }

      next();
    } catch (error: unknown) {
      logger.error('Error en middleware de autorización (rol):', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
      });
    }
  };
};

/**
 * Middleware que verifica si el usuario tiene al menos uno de los permisos especificados
 */
export const requirePermission = (permisosRequeridos: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const permisosUsuario = req.user.permisos || [];
      
      const tienePermiso = permisosRequeridos.some(permiso => permisosUsuario.includes(permiso));

      if (!tienePermiso) {
        logger.warn(`Usuario ${req.user.username} intentó acceder sin permiso requerido. Permisos necesarios: ${permisosRequeridos.join(', ')}, Permisos del usuario: ${permisosUsuario.join(', ')}`);
        res.status(403).json({
          success: false,
          message: 'No tienes los permisos necesarios para esta acción',
          permisosRequeridos: permisosRequeridos,
        });
        return;
      }

      next();
    } catch (error: unknown) {
      logger.error('Error en middleware de autorización (permiso):', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
      });
    }
  };
};

/**
 * Middleware que verifica si el usuario es administrador
 */
export const requireAdmin = requireRole(['ADMIN']);

/**
 * Middleware que verifica si el usuario es dueño del recurso o admin
 */
export const requireOwnerOrAdmin = (getUserIdFromRequest: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const userId = getUserIdFromRequest(req);
      const isOwner = req.user.id === userId;
      const isAdmin = req.user.roles.some((r: AuthRole) => r.codigo === 'ADMIN');

      if (!isOwner && !isAdmin) {
        logger.warn(`Usuario ${req.user.username} intentó acceder a recurso ajeno sin ser admin`);
        res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este recurso',
        });
        return;
      }

      next();
    } catch (error: unknown) {
      logger.error('Error en middleware requireOwnerOrAdmin:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
      });
    }
  };
};

