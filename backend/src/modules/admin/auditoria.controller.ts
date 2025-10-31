/**
 * Controlador de auditoría
 * Maneja la consulta de logs de auditoría
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';

const prisma = new PrismaClient();

export class AuditoriaController {
  /**
   * GET /api/auditoria
   * Listar logs de auditoría con paginación y filtros
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 50,
        entidad,
        accion,
        usuarioId,
        fechaDesde,
        fechaHasta,
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Construir filtros
      const where: any = {};

      if (entidad) {
        where.entidad = entidad as string;
      }

      if (accion) {
        where.accion = accion as string;
      }

      if (usuarioId) {
        where.usuario_id = usuarioId as string;
      }

      if (fechaDesde || fechaHasta) {
        where.fecha = {};
        if (fechaDesde) {
          where.fecha.gte = new Date(fechaDesde as string);
        }
        if (fechaHasta) {
          where.fecha.lte = new Date(fechaHasta as string);
        }
      }

      // Contar total
      const total = await prisma.auditoria.count({ where });

      // Obtener logs
      const logs = await prisma.auditoria.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              email: true,
              nombres: true,
              apellidos: true,
            },
          },
        },
        orderBy: {
          fecha: 'desc',
        },
      });

      const data = logs.map(log => ({
        id: log.id,
        entidad: log.entidad,
        entidadId: log.entidadid,
        accion: log.accion,
        datosAnteriores: log.datosanteriores,
        datosNuevos: log.datosnuevos,
        usuario: log.usuario ? {
          id: log.usuario.id,
          username: log.usuario.username,
          email: log.usuario.email,
          nombreCompleto: `${log.usuario.nombres || ''} ${log.usuario.apellidos || ''}`.trim() || 'N/A',
        } : null,
        ip: log.ip,
        userAgent: log.useragent,
        fecha: log.fecha,
      }));

      res.status(200).json({
        success: true,
        message: 'Logs de auditoría',
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: unknown) {
      logger.error('Error en list auditoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener logs de auditoría',
      });
    }
  }

  /**
   * GET /api/auditoria/usuario/:id
   * Obtener logs de un usuario específico
   */
  async getByUsuario(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Verificar que el usuario existe
      const usuario = await prisma.usuario.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          nombres: true,
          apellidos: true,
        },
      });

      if (!usuario) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
        return;
      }

      // Contar total
      const total = await prisma.auditoria.count({
        where: { usuario_id: id },
      });

      // Obtener logs
      const logs = await prisma.auditoria.findMany({
        where: { usuario_id: id },
        skip,
        take: Number(limit),
        orderBy: {
          fecha: 'desc',
        },
      });

      const data = logs.map(log => ({
        id: log.id,
        entidad: log.entidad,
        entidadId: log.entidadid,
        accion: log.accion,
        datosAnteriores: log.datosanteriores,
        datosNuevos: log.datosnuevos,
        ip: log.ip,
        userAgent: log.useragent,
        fecha: log.fecha,
      }));

      res.status(200).json({
        success: true,
        message: `Logs del usuario ${usuario.username}`,
        data: {
          usuario: {
            id: usuario.id,
            username: usuario.username,
            email: usuario.email,
            nombreCompleto: `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim() || 'N/A',
          },
          logs: data,
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: unknown) {
      logger.error('Error en getByUsuario auditoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener logs del usuario',
      });
    }
  }

  /**
   * GET /api/auditoria/entidad/:entidad/:id
   * Obtener logs de una entidad específica
   */
  async getByEntidad(req: Request, res: Response): Promise<void> {
    try {
      const { entidad, id } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Contar total
      const total = await prisma.auditoria.count({
        where: {
          entidad: entidad,
          entidadid: id,
        },
      });

      // Obtener logs
      const logs = await prisma.auditoria.findMany({
        where: {
          entidad: entidad,
          entidadid: id,
        },
        skip,
        take: Number(limit),
        include: {
          usuario: {
            select: {
              id: true,
              username: true,
              email: true,
              nombres: true,
              apellidos: true,
            },
          },
        },
        orderBy: {
          fecha: 'desc',
        },
      });

      const data = logs.map(log => ({
        id: log.id,
        accion: log.accion,
        datosAnteriores: log.datosanteriores,
        datosNuevos: log.datosnuevos,
        usuario: log.usuario ? {
          id: log.usuario.id,
          username: log.usuario.username,
          nombreCompleto: `${log.usuario.nombres || ''} ${log.usuario.apellidos || ''}`.trim() || 'N/A',
        } : null,
        ip: log.ip,
        userAgent: log.useragent,
        fecha: log.fecha,
      }));

      res.status(200).json({
        success: true,
        message: `Logs de ${entidad} con ID ${id}`,
        data: {
          entidad,
          entidadId: id,
          logs: data,
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: unknown) {
      logger.error('Error en getByEntidad auditoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener logs de la entidad',
      });
    }
  }

  /**
   * GET /api/auditoria/estadisticas
   * Obtener estadísticas de auditoría
   */
  async getEstadisticas(_req: Request, res: Response): Promise<void> {
    try {
      const [
        totalLogs,
        logsPorEntidad,
        logsPorAccion,
        logsRecientes,
      ] = await Promise.all([
        // Total de logs
        prisma.auditoria.count(),

        // Logs por entidad
        prisma.auditoria.groupBy({
          by: ['entidad'],
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 10,
        }),

        // Logs por acción
        prisma.auditoria.groupBy({
          by: ['accion'],
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
        }),

        // Últimos 10 logs
        prisma.auditoria.findMany({
          take: 10,
          include: {
            usuario: {
              select: {
                username: true,
              },
            },
          },
          orderBy: {
            fecha: 'desc',
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        message: 'Estadísticas de auditoría',
        data: {
          totalLogs,
          logsPorEntidad: logsPorEntidad.map(item => ({
            entidad: item.entidad,
            cantidad: item._count.id,
          })),
          logsPorAccion: logsPorAccion.map(item => ({
            accion: item.accion,
            cantidad: item._count.id,
          })),
          logsRecientes: logsRecientes.map(log => ({
            id: log.id,
            entidad: log.entidad,
            accion: log.accion,
            usuario: log.usuario?.username || 'Sistema',
            fecha: log.fecha,
          })),
        },
      });
    } catch (error: unknown) {
      logger.error('Error en getEstadisticas auditoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
      });
    }
  }
}

export const auditoriaController = new AuditoriaController();

