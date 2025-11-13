/**
 * Controlador de Notificaciones
 * Maneja las notificaciones de usuarios
 */

import { Request, Response } from 'express';
import { logger } from '@config/logger';
import { notificacionService } from './notificacion.service';

class NotificacionController {
  /**
   * GET /api/notificaciones/usuario
   * Obtener notificaciones del usuario actual filtradas por su rol
   */
  async obtenerPorUsuario(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = (req as any).user.id;
      const rolesUsuario = (req as any).user.roles || [];
      const roles = rolesUsuario.map((r: any) => r.codigo);
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const soloNoLeidas = req.query.soloNoLeidas === 'true';

      // Determinar qué notificaciones mostrar según el rol
      const notificaciones = await notificacionService.findByUsuarioRol(
        usuarioId,
        roles,
        { page, limit },
        soloNoLeidas
      );

      res.json({
        success: true,
        message: 'Notificaciones del usuario',
        ...notificaciones,
      });
    } catch (error: any) {
      logger.error(`Error al obtener notificaciones: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener notificaciones',
      });
    }
  }

  /**
   * POST /api/notificaciones/:id/marcar-leida
   * Marcar notificación como leída
   */
  async marcarComoLeida(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).user.id;

      const notificacion = await notificacionService.marcarLeida(id!, usuarioId);

      res.json({
        success: true,
        message: 'Notificación marcada como leída',
        data: notificacion,
      });
    } catch (error: any) {
      logger.error(`Error al marcar notificación como leída: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al marcar notificación como leída',
      });
    }
  }

  /**
   * POST /api/notificaciones/marcar-todas-leidas
   * Marcar todas las notificaciones del usuario como leídas
   */
  async marcarTodasLeidas(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = (req as any).user.id;
      const rolesUsuario = (req as any).user.roles || [];
      const roles = rolesUsuario.map((r: any) => r.codigo);

      const count = await notificacionService.marcarTodasLeidasPorRol(usuarioId, roles);

      res.json({
        success: true,
        message: `${count} notificaciones marcadas como leídas`,
        data: { count },
      });
    } catch (error: any) {
      logger.error(`Error al marcar todas las notificaciones como leídas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al marcar notificaciones como leídas',
      });
    }
  }

  /**
   * GET /api/notificaciones/contador-no-leidas
   * Obtener contador de notificaciones no leídas
   */
  async contadorNoLeidas(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = (req as any).user.id;
      const rolesUsuario = (req as any).user.roles || [];
      const roles = rolesUsuario.map((r: any) => r.codigo);

      const count = await notificacionService.contarNoLeidasPorRol(usuarioId, roles);

      res.json({
        success: true,
        message: 'Contador de notificaciones no leídas',
        data: { count },
      });
    } catch (error: any) {
      logger.error(`Error al obtener contador: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener contador',
      });
    }
  }
}

export const notificacionController = new NotificacionController();

