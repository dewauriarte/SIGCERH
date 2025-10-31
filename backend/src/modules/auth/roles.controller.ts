/**
 * Controlador de roles
 * Maneja la consulta de roles y permisos
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';

const prisma = new PrismaClient();

export class RolesController {
  /**
   * GET /api/roles
   * Listar todos los roles
   */
  async list(_req: Request, res: Response): Promise<void> {
    try {
      const roles = await prisma.rol.findMany({
        where: { activo: true },
        include: {
          rolpermiso: {
            include: {
              permiso: {
                select: {
                  id: true,
                  codigo: true,
                  nombre: true,
                  modulo: true,
                },
              },
            },
          },
        },
        orderBy: {
          nivel: 'desc',
        },
      });

      const data = roles.map(rol => ({
        id: rol.id,
        codigo: rol.codigo,
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        nivel: rol.nivel,
        cantidadPermisos: rol.rolpermiso.length,
        permisos: rol.rolpermiso.map(rp => rp.permiso),
      }));

      res.status(200).json({
        success: true,
        message: 'Lista de roles',
        data,
      });
    } catch (error: unknown) {
      logger.error('Error en list roles:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener lista de roles',
      });
    }
  }

  /**
   * GET /api/roles/:id
   * Obtener un rol por ID con sus permisos
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const rol = await prisma.rol.findUnique({
        where: { id },
        include: {
          rolpermiso: {
            include: {
              permiso: {
                select: {
                  id: true,
                  codigo: true,
                  nombre: true,
                  modulo: true,
                  activo: true,
                },
              },
            },
          },
        },
      });

      if (!rol) {
        res.status(404).json({
          success: false,
          message: 'Rol no encontrado',
        });
        return;
      }

      const data = {
        id: rol.id,
        codigo: rol.codigo,
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        nivel: rol.nivel,
        activo: rol.activo,
        permisos: rol.rolpermiso.map(rp => rp.permiso),
      };

      res.status(200).json({
        success: true,
        message: 'Rol encontrado',
        data,
      });
    } catch (error: unknown) {
      logger.error('Error en getById rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener rol',
      });
    }
  }

  /**
   * GET /api/roles/:id/permisos
   * Obtener permisos de un rol
   */
  async getPermisos(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const rol = await prisma.rol.findUnique({
        where: { id },
        include: {
          rolpermiso: {
            include: {
              permiso: true,
            },
          },
        },
      });

      if (!rol) {
        res.status(404).json({
          success: false,
          message: 'Rol no encontrado',
        });
        return;
      }

      // Agrupar permisos por módulo
      const permisosPorModulo: Record<string, any[]> = {};

      rol.rolpermiso.forEach(rp => {
        const modulo = rp.permiso.modulo;
        if (!permisosPorModulo[modulo]) {
          permisosPorModulo[modulo] = [];
        }
        permisosPorModulo[modulo].push({
          id: rp.permiso.id,
          codigo: rp.permiso.codigo,
          nombre: rp.permiso.nombre,
          activo: rp.permiso.activo,
        });
      });

      res.status(200).json({
        success: true,
        message: `Permisos del rol ${rol.nombre}`,
        data: {
          rol: {
            id: rol.id,
            codigo: rol.codigo,
            nombre: rol.nombre,
          },
          permisosPorModulo,
          totalPermisos: rol.rolpermiso.length,
        },
      });
    } catch (error: unknown) {
      logger.error('Error en getPermisos rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener permisos del rol',
      });
    }
  }

  /**
   * GET /api/permisos
   * Listar todos los permisos disponibles
   */
  async listPermisos(_req: Request, res: Response): Promise<void> {
    try {
      const permisos = await prisma.permiso.findMany({
        where: { activo: true },
        orderBy: [
          { modulo: 'asc' },
          { codigo: 'asc' },
        ],
      });

      // Agrupar por módulo
      const permisosPorModulo: Record<string, any[]> = {};

      permisos.forEach(permiso => {
        const modulo = permiso.modulo;
        if (!permisosPorModulo[modulo]) {
          permisosPorModulo[modulo] = [];
        }
        permisosPorModulo[modulo].push({
          id: permiso.id,
          codigo: permiso.codigo,
          nombre: permiso.nombre,
        });
      });

      res.status(200).json({
        success: true,
        message: 'Lista de permisos',
        data: {
          permisosPorModulo,
          totalPermisos: permisos.length,
          modulos: Object.keys(permisosPorModulo),
        },
      });
    } catch (error: unknown) {
      logger.error('Error en listPermisos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener lista de permisos',
      });
    }
  }
}

export const rolesController = new RolesController();

