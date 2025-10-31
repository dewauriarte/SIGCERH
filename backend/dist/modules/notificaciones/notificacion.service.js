import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { emailService } from './email.service';
import { templateService } from './template.service';
import { CanalNotificacion, EstadoNotificacion, } from './types';
const prisma = new PrismaClient();
export class NotificacionService {
    async crear(tipo, destinatario, solicitudId, datos, canal = CanalNotificacion.EMAIL) {
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
        if (canal === CanalNotificacion.EMAIL) {
            this.enviarPorEmail(notificacion.id).catch((error) => {
                logger.error(`Error al enviar notificación ${notificacion.id}: ${error.message}`);
            });
        }
        return notificacion;
    }
    async enviarPorEmail(notificacionId) {
        const notificacion = await prisma.notificacion.findUnique({
            where: { id: notificacionId },
        });
        if (!notificacion) {
            throw new Error('Notificación no encontrada');
        }
        if (notificacion.canal !== CanalNotificacion.EMAIL) {
            throw new Error('La notificación no es de tipo EMAIL');
        }
        const datos = JSON.parse(notificacion.mensaje);
        const html = templateService.renderizarPlantilla(notificacion.tipo, datos);
        const resultado = await emailService.enviarEmail(notificacion.destinatario, notificacion.asunto || 'Notificación SIGCERH', html);
        if (resultado.exito) {
            await this.marcarComoEnviada(notificacionId);
        }
        else {
            await this.marcarComoFallida(notificacionId, resultado.error || 'Error desconocido');
        }
        return resultado;
    }
    async marcarComoEnviada(id, fechaEnvio = new Date()) {
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
    async marcarComoFallida(id, error) {
        const notificacion = await prisma.notificacion.findUnique({
            where: { id },
        });
        if (!notificacion) {
            throw new Error('Notificación no encontrada');
        }
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
    async reintentar(id) {
        const notificacion = await prisma.notificacion.findUnique({
            where: { id },
        });
        if (!notificacion) {
            throw new Error('Notificación no encontrada');
        }
        if (notificacion.estado !== EstadoNotificacion.FALLIDA) {
            throw new Error('Solo se pueden reintentar notificaciones fallidas');
        }
        await prisma.notificacion.update({
            where: { id },
            data: {
                estado: EstadoNotificacion.REENVIADA,
            },
        });
        logger.info(`Reintentando envío de notificación ${id}`);
        if (notificacion.canal === CanalNotificacion.EMAIL) {
            return await this.enviarPorEmail(id);
        }
        throw new Error(`Canal ${notificacion.canal} no soporta reenvío automático`);
    }
    async findPendientes(canal) {
        const where = {
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
    async generarListadoManual(canal) {
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
    async marcarComoEnviadaManual(id, usuarioId) {
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
    async findById(id) {
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
    async findAll(filtros, pagination) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const where = {};
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
}
export const notificacionService = new NotificacionService();
//# sourceMappingURL=notificacion.service.js.map