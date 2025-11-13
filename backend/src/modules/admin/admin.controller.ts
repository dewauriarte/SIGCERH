/**
 * Controlador de Administración
 * Gestión de usuarios, roles y estadísticas
 */

import { Request, Response } from 'express';
import { adminService } from './admin.service';
import { logger } from '@config/logger';
import { z } from 'zod';

// Validaciones con Zod
const createUsuarioSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  dni: z.string().optional(),
  nombres: z.string().min(2),
  apellidos: z.string().min(2),
  telefono: z.string().optional(),
  cargo: z.string().optional(),
  roles: z.array(z.string()).min(1),
});

const updateUsuarioSchema = z.object({
  email: z.string().email().optional(),
  dni: z.string().optional(),
  nombres: z.string().min(2).optional(),
  apellidos: z.string().min(2).optional(),
  telefono: z.string().optional(),
  cargo: z.string().optional(),
  activo: z.boolean().optional(),
  roles: z.array(z.string()).optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  rol: z.string().optional(),
  activo: z.coerce.boolean().optional(),
});

export class AdminController {
  /**
   * GET /api/admin/estadisticas
   * Obtener estadísticas generales del sistema
   */
  async getEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const estadisticas = await adminService.getEstadisticas();

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      logger.error('Error en getEstadisticas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas',
      });
    }
  }

  /**
   * GET /api/admin/solicitudes-por-mes
   * Obtener solicitudes agrupadas por mes (últimos 12 meses)
   */
  async getSolicitudesPorMes(req: Request, res: Response): Promise<void> {
    try {
      const datos = await adminService.getSolicitudesPorMes();

      res.json({
        success: true,
        data: datos,
      });
    } catch (error: any) {
      logger.error('Error en getSolicitudesPorMes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener datos',
      });
    }
  }

  /**
   * GET /api/admin/certificados-por-colegio
   * Obtener certificados agrupados por colegio (Top 10)
   */
  async getCertificadosPorColegio(req: Request, res: Response): Promise<void> {
    try {
      const datos = await adminService.getCertificadosPorColegio();

      res.json({
        success: true,
        data: datos,
      });
    } catch (error: any) {
      logger.error('Error en getCertificadosPorColegio:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener datos',
      });
    }
  }

  /**
   * GET /api/admin/usuarios
   * Obtener lista paginada de usuarios
   */
  async getUsuarios(req: Request, res: Response): Promise<void> {
    try {
      const params = paginationSchema.parse(req.query);

      const result = await adminService.getUsuarios(params);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: error.errors,
        });
        return;
      }

      logger.error('Error en getUsuarios:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener usuarios',
      });
    }
  }

  /**
   * GET /api/admin/usuarios/:id
   * Obtener detalles de un usuario específico
   */
  async getUsuario(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const usuario = await adminService.getUsuarioById(id);

      if (!usuario) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: usuario,
      });
    } catch (error: any) {
      logger.error('Error en getUsuario:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener usuario',
      });
    }
  }

  /**
   * POST /api/admin/usuarios
   * Crear un nuevo usuario
   */
  async crearUsuario(req: Request, res: Response): Promise<void> {
    try {
      const data = createUsuarioSchema.parse(req.body);
      const adminId = (req as any).user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
        return;
      }

      const usuario = await adminService.crearUsuario(data, adminId);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: usuario,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: error.errors,
        });
        return;
      }

      logger.error('Error en crearUsuario:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear usuario',
      });
    }
  }

  /**
   * PATCH /api/admin/usuarios/:id
   * Actualizar un usuario
   */
  async actualizarUsuario(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateUsuarioSchema.parse(req.body);

      const usuario = await adminService.actualizarUsuario(id, data);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuario,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: error.errors,
        });
        return;
      }

      logger.error('Error en actualizarUsuario:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar usuario',
      });
    }
  }

  /**
   * POST /api/admin/usuarios/:id/desactivar
   * Desactivar un usuario
   */
  async desactivarUsuario(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await adminService.desactivarUsuario(id);

      res.json({
        success: true,
        message: 'Usuario desactivado exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en desactivarUsuario:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al desactivar usuario',
      });
    }
  }

  /**
   * POST /api/admin/usuarios/:id/activar
   * Activar un usuario
   */
  async activarUsuario(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await adminService.activarUsuario(id);

      res.json({
        success: true,
        message: 'Usuario activado exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en activarUsuario:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al activar usuario',
      });
    }
  }

  /**
   * POST /api/admin/usuarios/:id/bloquear
   * Bloquear un usuario
   */
  async bloquearUsuario(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await adminService.bloquearUsuario(id);

      res.json({
        success: true,
        message: 'Usuario bloqueado exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en bloquearUsuario:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al bloquear usuario',
      });
    }
  }

  /**
   * POST /api/admin/usuarios/:id/desbloquear
   * Desbloquear un usuario
   */
  async desbloquearUsuario(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await adminService.desbloquearUsuario(id);

      res.json({
        success: true,
        message: 'Usuario desbloqueado exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en desbloquearUsuario:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al desbloquear usuario',
      });
    }
  }

  /**
   * DELETE /api/admin/usuarios/:id
   * Eliminar un usuario permanentemente
   */
  async eliminarUsuario(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await adminService.eliminarUsuario(id);

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en eliminarUsuario:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar usuario',
      });
    }
  }

  /**
   * POST /api/admin/usuarios/:id/resetear-password
   * Resetear contraseña de un usuario
   */
  async resetearPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.length < 8) {
        res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres',
        });
        return;
      }

      await adminService.resetearPassword(id, password);

      res.json({
        success: true,
        message: 'Contraseña reseteada exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en resetearPassword:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al resetear contraseña',
      });
    }
  }

  /**
   * GET /api/admin/roles
   * Obtener todos los roles disponibles
   */
  async getRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await adminService.getRoles();

      res.json({
        success: true,
        data: roles,
      });
    } catch (error: any) {
      logger.error('Error en getRoles:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener roles',
      });
    }
  }
}

export const adminController = new AdminController();

