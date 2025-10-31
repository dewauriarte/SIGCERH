/**
 * Middleware de auditoría
 * Registra acciones importantes en la tabla auditoria
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';

const prisma = new PrismaClient();

/**
 * Tipos de acciones que se pueden auditar
 */
export enum AccionAuditoria {
  CREAR = 'CREAR',
  ACTUALIZAR = 'ACTUALIZAR',
  ELIMINAR = 'ELIMINAR',
  VER = 'VER',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORTAR = 'EXPORTAR',
  FIRMAR = 'FIRMAR',
  APROBAR = 'APROBAR',
  RECHAZAR = 'RECHAZAR',
  VALIDAR = 'VALIDAR',
}

/**
 * Registra una acción en la tabla de auditoría
 */
export const registrarAuditoria = async (
  entidad: string,
  entidadId: string,
  accion: AccionAuditoria,
  usuarioId: string | null,
  datosAnteriores: any = null,
  datosNuevos: any = null,
  ip?: string,
  userAgent?: string
): Promise<void> => {
  try {
    await prisma.auditoria.create({
      data: {
        entidad,
        entidadid: entidadId,
        accion,
        usuario_id: usuarioId,
        datosanteriores: datosAnteriores ? JSON.parse(JSON.stringify(datosAnteriores)) : null,
        datosnuevos: datosNuevos ? JSON.parse(JSON.stringify(datosNuevos)) : null,
        ip: ip || null,
        useragent: userAgent || null,
      },
    });
  } catch (error) {
    logger.error('Error al registrar auditoría:', error);
  }
};

/**
 * Middleware para auditar automáticamente según el método HTTP
 */
export const auditarAccion = (entidad: string, obtenerEntidadId?: (req: Request) => string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const metodoOriginal = res.json.bind(res);

      // Interceptar la respuesta
      res.json = function (body: any) {
        // Solo auditar si la respuesta fue exitosa
        if (body.success !== false && res.statusCode < 400) {
          const userId = req.user?.id || null;
          const ip = req.ip || req.socket.remoteAddress;
          const userAgent = req.headers['user-agent'];

          let accion: AccionAuditoria;
          let entidadId: string;

          // Determinar la acción según el método HTTP
          switch (req.method) {
            case 'POST':
              accion = AccionAuditoria.CREAR;
              entidadId = body.data?.id || body.id || 'nuevo';
              break;
            case 'PUT':
            case 'PATCH':
              accion = AccionAuditoria.ACTUALIZAR;
              entidadId = obtenerEntidadId ? obtenerEntidadId(req) : req.params.id || 'desconocido';
              break;
            case 'DELETE':
              accion = AccionAuditoria.ELIMINAR;
              entidadId = obtenerEntidadId ? obtenerEntidadId(req) : req.params.id || 'desconocido';
              break;
            case 'GET':
              accion = AccionAuditoria.VER;
              entidadId = obtenerEntidadId ? obtenerEntidadId(req) : req.params.id || 'listado';
              break;
            default:
              return metodoOriginal(body);
          }

          // Registrar auditoría de forma asíncrona (no bloqueante)
          registrarAuditoria(
            entidad,
            entidadId,
            accion,
            userId,
            req.method === 'PUT' || req.method === 'DELETE' ? req.body : null,
            req.method === 'POST' || req.method === 'PUT' ? body.data : null,
            ip,
            userAgent
          ).catch(err => {
            logger.error('Error al registrar auditoría:', err);
          });
        }

        return metodoOriginal(body);
      };

      next();
    } catch (error) {
      logger.error('Error en middleware de auditoría:', error);
      next();
    }
  };
};

/**
 * Middleware específico para auditar login/logout
 */
export const auditarAutenticacion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const metodoOriginal = res.json.bind(res);

    res.json = function (body: any) {
      if (body.success !== false && res.statusCode < 400) {
        const userId = body.user?.id || req.user?.id || null;
        const ip = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const esLogin = req.path.includes('login') || req.path.includes('register');
        const accion = esLogin ? AccionAuditoria.LOGIN : AccionAuditoria.LOGOUT;

        registrarAuditoria(
          'sesion',
          userId || 'anonimo',
          accion,
          userId,
          null,
          { username: body.user?.username || 'desconocido' },
          ip,
          userAgent
        ).catch(err => {
          logger.error('Error al registrar auditoría de autenticación:', err);
        });
      }

      return metodoOriginal(body);
    };

    next();
  } catch (error) {
    logger.error('Error en middleware de auditoría de autenticación:', error);
    next();
  }
};

