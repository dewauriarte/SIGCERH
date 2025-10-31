import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
const prisma = new PrismaClient();
export class AuditoriaController {
    async list(req, res) {
        try {
            const { page = 1, limit = 50, entidad, accion, usuarioId, fechaDesde, fechaHasta, } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = {};
            if (entidad) {
                where.entidad = entidad;
            }
            if (accion) {
                where.accion = accion;
            }
            if (usuarioId) {
                where.usuario_id = usuarioId;
            }
            if (fechaDesde || fechaHasta) {
                where.fecha = {};
                if (fechaDesde) {
                    where.fecha.gte = new Date(fechaDesde);
                }
                if (fechaHasta) {
                    where.fecha.lte = new Date(fechaHasta);
                }
            }
            const total = await prisma.auditoria.count({ where });
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
        }
        catch (error) {
            logger.error('Error en list auditoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener logs de auditoría',
            });
        }
    }
    async getByUsuario(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
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
            const total = await prisma.auditoria.count({
                where: { usuario_id: id },
            });
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
        }
        catch (error) {
            logger.error('Error en getByUsuario auditoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener logs del usuario',
            });
        }
    }
    async getByEntidad(req, res) {
        try {
            const { entidad, id } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const total = await prisma.auditoria.count({
                where: {
                    entidad: entidad,
                    entidadid: id,
                },
            });
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
        }
        catch (error) {
            logger.error('Error en getByEntidad auditoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener logs de la entidad',
            });
        }
    }
    async getEstadisticas(_req, res) {
        try {
            const [totalLogs, logsPorEntidad, logsPorAccion, logsRecientes,] = await Promise.all([
                prisma.auditoria.count(),
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
        }
        catch (error) {
            logger.error('Error en getEstadisticas auditoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
            });
        }
    }
}
export const auditoriaController = new AuditoriaController();
//# sourceMappingURL=auditoria.controller.js.map