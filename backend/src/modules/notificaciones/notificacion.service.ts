/**
 * Servicio de Notificaciones
 * Gestiona el ciclo de vida completo de notificaciones
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { emailService } from './email.service';
import { templateService } from './template.service';
import {
  TipoNotificacion,
  CanalNotificacion,
  EstadoNotificacion,
  DatosNotificacion,
} from './types';

const prisma = new PrismaClient();

export class NotificacionService {
  /**
   * Crear notificación en BD
   */
  async crear(
    tipo: TipoNotificacion,
    destinatario: string,
    solicitudId: string,
    datos: DatosNotificacion,
    canal: CanalNotificacion = CanalNotificacion.EMAIL
  ) {
    const asunto = templateService.getAsunto(tipo);

    const notificacion = await prisma.notificacion.create({
      data: {
        tipo,
        destinatario,
        canal,
        solicitud_id: solicitudId,
        asunto,
        mensaje: JSON.stringify(datos),
        estado: EstadoNotificacion.PENDIENTE,
        intentos: 0,
      },
    });

    logger.info(`Notificación creada: ${tipo} para ${destinatario} (ID: ${notificacion.id})`);

    // Si es email, intentar enviar inmediatamente
    if (canal === CanalNotificacion.EMAIL) {
      // Enviar de forma asíncrona sin bloquear
      this.enviarPorEmail(notificacion.id).catch((error) => {
        logger.error(`Error al enviar notificación ${notificacion.id}: ${error.message}`);
      });
    }

    return notificacion;
  }

  /**
   * Enviar notificación por email
   */
  async enviarPorEmail(notificacionId: string) {
    const notificacion = await prisma.notificacion.findUnique({
      where: { id: notificacionId },
    });

    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }

    if (notificacion.canal !== CanalNotificacion.EMAIL) {
      throw new Error('La notificación no es de tipo EMAIL');
    }

    // Parsear datos
    const datos: DatosNotificacion = JSON.parse(notificacion.mensaje);

    // Renderizar plantilla
    const html = templateService.renderizarPlantilla(notificacion.tipo as TipoNotificacion, datos);

    // Enviar email
    const resultado = await emailService.enviarEmail(
      notificacion.destinatario,
      notificacion.asunto || 'Notificación SIGCERH',
      html
    );

    // Actualizar estado según resultado
    if (resultado.exito) {
      await this.marcarComoEnviada(notificacionId);
    } else {
      await this.marcarComoFallida(notificacionId, resultado.error || 'Error desconocido');
    }

    return resultado;
  }

  /**
   * Marcar notificación como enviada
   */
  async marcarComoEnviada(id: string, fechaEnvio: Date = new Date()) {
    const notificacion = await prisma.notificacion.update({
      where: { id },
      data: {
        estado: EstadoNotificacion.ENVIADA,
        fechaenvio: fechaEnvio,
      },
    });

    logger.info(`Notificación ${id} marcada como ENVIADA`);

    return notificacion;
  }

  /**
   * Marcar notificación como fallida
   */
  async marcarComoFallida(id: string, error: string) {
    const notificacion = await prisma.notificacion.findUnique({
      where: { id },
    });

    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }

    // Incrementar contador de intentos
    const intentos = (notificacion.intentos || 0) + 1;

    const notificacionActualizada = await prisma.notificacion.update({
      where: { id },
      data: {
        estado: EstadoNotificacion.FALLIDA,
        intentos,
        error,
      },
    });

    logger.warn(`Notificación ${id} marcada como FALLIDA (intentos: ${intentos})`);

    return notificacionActualizada;
  }

  /**
   * Reintentar envío de notificación fallida
   */
  async reintentar(id: string) {
    const notificacion = await prisma.notificacion.findUnique({
      where: { id },
    });

    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }

    if (notificacion.estado !== EstadoNotificacion.FALLIDA) {
      throw new Error('Solo se pueden reintentar notificaciones fallidas');
    }

    // Cambiar estado a REENVIADA
    await prisma.notificacion.update({
      where: { id },
      data: {
        estado: EstadoNotificacion.REENVIADA,
      },
    });

    logger.info(`Reintentando envío de notificación ${id}`);

    // Intentar enviar según canal
    if (notificacion.canal === CanalNotificacion.EMAIL) {
      return await this.enviarPorEmail(id);
    }

    throw new Error(`Canal ${notificacion.canal} no soporta reenvío automático`);
  }

  /**
   * Obtener notificaciones pendientes por canal
   */
  async findPendientes(canal?: CanalNotificacion) {
    const where: any = {
      estado: EstadoNotificacion.PENDIENTE,
    };

    if (canal) {
      where.canal = canal;
    }

    const notificaciones = await prisma.notificacion.findMany({
      where,
      orderBy: {
        fechacreacion: 'asc',
      },
      include: {
        solicitud: {
          select: {
            numeroexpediente: true,
            estudiante: {
              select: {
                nombres: true,
                apellidopaterno: true,
                apellidomaterno: true,
                telefono: true,
              },
            },
          },
        },
      },
    });

    return notificaciones;
  }

  /**
   * Generar listado para envío manual (WhatsApp/SMS)
   */
  async generarListadoManual(canal: CanalNotificacion) {
    if (canal === CanalNotificacion.EMAIL) {
      throw new Error('El canal EMAIL no requiere envío manual');
    }

    const notificaciones = await this.findPendientes(canal);

    const listado = notificaciones.map((notif) => ({
      id: notif.id,
      tipo: notif.tipo,
      destinatario: notif.destinatario,
      telefono: notif.solicitud?.estudiante?.telefono || null,
      nombreEstudiante: notif.solicitud?.estudiante
        ? `${notif.solicitud.estudiante.apellidopaterno} ${notif.solicitud.estudiante.apellidomaterno} ${notif.solicitud.estudiante.nombres}`
        : 'N/A',
      numeroExpediente: notif.solicitud?.numeroexpediente || null,
      mensaje: notif.mensaje,
      fechaCreacion: notif.fechacreacion,
    }));

    logger.info(`Listado manual generado: ${listado.length} notificaciones de ${canal}`);

    return listado;
  }

  /**
   * Marcar como enviada manualmente
   */
  async marcarComoEnviadaManual(id: string, usuarioId: string) {
    const notificacion = await prisma.notificacion.update({
      where: { id },
      data: {
        estado: EstadoNotificacion.ENVIADA,
        fechaenvio: new Date(),
        error: `Enviado manualmente por usuario ${usuarioId}`,
      },
    });

    logger.info(`Notificación ${id} marcada como enviada manualmente por usuario ${usuarioId}`);

    return notificacion;
  }

  /**
   * Obtener notificación por ID
   */
  async findById(id: string) {
    const notificacion = await prisma.notificacion.findUnique({
      where: { id },
      include: {
        solicitud: {
          select: {
            numeroexpediente: true,
            estudiante: {
              select: {
                dni: true,
                nombres: true,
                apellidopaterno: true,
                apellidomaterno: true,
              },
            },
          },
        },
        certificado: {
          select: {
            codigovirtual: true,
            estudiante: {
              select: {
                dni: true,
                nombres: true,
              },
            },
          },
        },
      },
    });

    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }

    return notificacion;
  }

  /**
   * Listar notificaciones con filtros
   */
  async findAll(
    filtros: {
      canal?: CanalNotificacion;
      estado?: string;
      tipo?: TipoNotificacion;
      fechaDesde?: Date;
      fechaHasta?: Date;
    },
    pagination: { page: number; limit: number }
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filtros.canal) {
      where.canal = filtros.canal;
    }

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.fechacreacion = {};
      if (filtros.fechaDesde) {
        where.fechacreacion.gte = filtros.fechaDesde;
      }
      if (filtros.fechaHasta) {
        where.fechacreacion.lte = filtros.fechaHasta;
      }
    }

    const [total, data] = await Promise.all([
      prisma.notificacion.count({ where }),
      prisma.notificacion.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          fechacreacion: 'desc',
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener notificaciones por usuario y rol
   * Las notificaciones se filtran según el rol del usuario en Mesa de Partes
   */
  async findByUsuarioRol(
    usuarioId: string,
    roles: string[],
    pagination: { page: number; limit: number },
    soloNoLeidas: boolean = false
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Determinar tipos de notificaciones según rol
    const tiposNotificacion: string[] = [];
    
    if (roles.includes('MESA_DE_PARTES')) {
      tiposNotificacion.push(
        'SOLICITUD_RECIBIDA',
        'PAGO_RECIBIDO',
        'CERTIFICADO_LISTO'
      );
    }

    if (roles.includes('EDITOR')) {
      tiposNotificacion.push(
        'SOLICITUD_DERIVADA',
        'ACTA_ENCONTRADA',
        'ACTA_NO_ENCONTRADA'
      );
    }

    if (roles.includes('UGEL')) {
      tiposNotificacion.push(
        'CERTIFICADO_PENDIENTE_VALIDACION',
        'CERTIFICADO_OBSERVADO'
      );
    }

    // Si no hay roles definidos, retornar vacío
    if (tiposNotificacion.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    const where: any = {
      tipo: { in: tiposNotificacion },
    };

    if (soloNoLeidas) {
      where.fechaleido = null;
    }

    const [total, data] = await Promise.all([
      prisma.notificacion.count({ where }),
      prisma.notificacion.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          fechacreacion: 'desc',
        },
        include: {
          solicitud: {
            select: {
              numeroexpediente: true,
              estudiante: {
                select: {
                  nombres: true,
                  apellidopaterno: true,
                  apellidomaterno: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Marcar notificación como leída
   */
  async marcarLeida(id: string, usuarioId: string) {
    const notificacion = await prisma.notificacion.update({
      where: { id },
      data: {
        fechaleido: new Date(),
      },
    });

    logger.info(`Notificación ${id} marcada como leída por usuario ${usuarioId}`);

    return notificacion;
  }

  /**
   * Marcar todas las notificaciones de un rol como leídas
   */
  async marcarTodasLeidasPorRol(usuarioId: string, roles: string[]): Promise<number> {
    const tiposNotificacion: string[] = [];
    
    if (roles.includes('MESA_DE_PARTES')) {
      tiposNotificacion.push(
        'SOLICITUD_RECIBIDA',
        'PAGO_RECIBIDO',
        'CERTIFICADO_LISTO'
      );
    }

    if (roles.includes('EDITOR')) {
      tiposNotificacion.push(
        'SOLICITUD_DERIVADA',
        'ACTA_ENCONTRADA',
        'ACTA_NO_ENCONTRADA'
      );
    }

    if (roles.includes('UGEL')) {
      tiposNotificacion.push(
        'CERTIFICADO_PENDIENTE_VALIDACION',
        'CERTIFICADO_OBSERVADO'
      );
    }

    if (tiposNotificacion.length === 0) {
      return 0;
    }

    const result = await prisma.notificacion.updateMany({
      where: {
        tipo: { in: tiposNotificacion },
        fechaleido: null,
      },
      data: {
        fechaleido: new Date(),
      },
    });

    logger.info(`${result.count} notificaciones marcadas como leídas para usuario ${usuarioId}`);

    return result.count;
  }

  /**
   * Contar notificaciones no leídas por rol
   */
  async contarNoLeidasPorRol(usuarioId: string, roles: string[]): Promise<number> {
    const tiposNotificacion: string[] = [];
    
    if (roles.includes('MESA_DE_PARTES')) {
      tiposNotificacion.push(
        'SOLICITUD_RECIBIDA',
        'PAGO_RECIBIDO',
        'CERTIFICADO_LISTO'
      );
    }

    if (roles.includes('EDITOR')) {
      tiposNotificacion.push(
        'SOLICITUD_DERIVADA',
        'ACTA_ENCONTRADA',
        'ACTA_NO_ENCONTRADA'
      );
    }

    if (roles.includes('UGEL')) {
      tiposNotificacion.push(
        'CERTIFICADO_PENDIENTE_VALIDACION',
        'CERTIFICADO_OBSERVADO'
      );
    }

    if (tiposNotificacion.length === 0) {
      return 0;
    }

    const count = await prisma.notificacion.count({
      where: {
        tipo: { in: tiposNotificacion },
        fechaleido: null,
      },
    });

    return count;
  }
}

export const notificacionService = new NotificacionService();

