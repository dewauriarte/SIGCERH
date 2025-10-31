import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '@config/logger';
import { EstadoPago, MONTO_CERTIFICADO } from './types';
const prisma = new PrismaClient();
export class PagoService {
    async getInstitucionId() {
        const config = await prisma.configuracioninstitucion.findFirst();
        if (!config) {
            throw new Error('No hay configuración de institución disponible');
        }
        return config.id;
    }
    async generarNumeroOrden() {
        const anio = new Date().getFullYear();
        const ultimoPago = await prisma.pago.findFirst({
            where: {
                numeroorden: {
                    startsWith: `ORD-${anio}-`,
                },
            },
            orderBy: {
                fecharegistro: 'desc',
            },
        });
        let numero = 1;
        if (ultimoPago) {
            const match = ultimoPago.numeroorden.match(/ORD-\d{4}-(\d{6})/);
            if (match && match[1]) {
                numero = parseInt(match[1]) + 1;
            }
        }
        return `ORD-${anio}-${numero.toString().padStart(6, '0')}`;
    }
    async generarOrden(data, _usuarioId) {
        const institucionId = await this.getInstitucionId();
        const solicitud = await prisma.solicitud.findUnique({
            where: { id: data.solicitudId },
        });
        if (!solicitud) {
            throw new Error('Solicitud no encontrada');
        }
        if (solicitud.estado !== 'ACTA_ENCONTRADA_PENDIENTE_PAGO') {
            throw new Error('La solicitud no está en estado pendiente de pago');
        }
        if (solicitud.pago_id) {
            const pagoExistente = await prisma.pago.findUnique({
                where: { id: solicitud.pago_id },
            });
            if (pagoExistente &&
                pagoExistente.estado !== EstadoPago.EXPIRADO &&
                pagoExistente.estado !== EstadoPago.RECHAZADO) {
                throw new Error('Ya existe un pago activo para esta solicitud');
            }
        }
        const metodoExiste = await prisma.metodopago.findFirst({
            where: { codigo: data.metodopago, activo: true },
        });
        if (!metodoExiste) {
            throw new Error(`Método de pago ${data.metodopago} no está disponible`);
        }
        const montoBase = data.monto ?? MONTO_CERTIFICADO;
        let comision = 0;
        if (metodoExiste.comisionporcentaje) {
            comision = (montoBase * Number(metodoExiste.comisionporcentaje)) / 100;
        }
        if (metodoExiste.comisionfija) {
            comision += Number(metodoExiste.comisionfija);
        }
        const montoneto = montoBase;
        const montoTotal = montoBase + comision;
        const numeroorden = await this.generarNumeroOrden();
        const pago = await prisma.pago.create({
            data: {
                institucion_id: institucionId,
                numeroorden,
                monto: new Prisma.Decimal(montoTotal),
                montoneto: new Prisma.Decimal(montoneto),
                comision: new Prisma.Decimal(comision),
                moneda: 'PEN',
                metodopago: data.metodopago,
                estado: EstadoPago.PENDIENTE,
                conciliado: false,
                fechapago: new Date(),
            },
        });
        await prisma.solicitud.update({
            where: { id: data.solicitudId },
            data: { pago_id: pago.id },
        });
        logger.info(`Orden de pago ${numeroorden} generada para solicitud ${data.solicitudId}`);
        return pago;
    }
    async subirComprobante(pagoId, file, data) {
        const pago = await this.findById(pagoId);
        if (pago.estado !== EstadoPago.PENDIENTE) {
            throw new Error('El pago no está en estado pendiente');
        }
        const urlComprobante = file.path.replace(/\\/g, '/');
        return prisma.pago.update({
            where: { id: pagoId },
            data: {
                urlcomprobante: urlComprobante,
                numerooperacion: data.numerooperacion,
                estado: EstadoPago.PAGADO,
                observaciones: data.observaciones,
            },
        });
    }
    async registrarPagoEfectivo(pagoId, data, usuarioId) {
        const pago = await this.findById(pagoId);
        if (pago.estado !== EstadoPago.PENDIENTE) {
            throw new Error('El pago no está en estado pendiente');
        }
        const diferencia = Math.abs(data.montoPagado - Number(pago.monto));
        if (diferencia > 0.01) {
            throw new Error(`El monto pagado (S/ ${data.montoPagado}) no coincide con el monto de la orden (S/ ${pago.monto})`);
        }
        const pagoActualizado = await prisma.pago.update({
            where: { id: pagoId },
            data: {
                numerorecibo: data.numeroRecibo,
                numerooperacion: data.numerooperacion,
                entidadbancaria: data.entidadbancaria,
                fechapago: data.fechaPago ?? new Date(),
                horapago: data.fechaPago ?? new Date(),
                estado: EstadoPago.VALIDADO,
                conciliado: true,
                fechaconciliacion: new Date(),
                usuarioconciliacion_id: usuarioId,
                observaciones: data.observaciones,
            },
        });
        const solicitud = await prisma.solicitud.findFirst({
            where: { pago_id: pagoId },
        });
        if (solicitud) {
            await prisma.solicitud.update({
                where: { id: solicitud.id },
                data: {
                    estado: 'PAGO_VALIDADO',
                    fechavalidacionpago: new Date(),
                    usuariovalidacionpago_id: usuarioId,
                },
            });
        }
        logger.info(`Pago en efectivo ${pagoId} registrado y validado`);
        return pagoActualizado;
    }
    async validarManualmente(pagoId, data, usuarioId) {
        const pago = await this.findById(pagoId);
        if (pago.estado !== EstadoPago.PAGADO) {
            throw new Error('Solo se pueden validar pagos en estado PAGADO');
        }
        const diferencia = Math.abs(data.montoPagado - Number(pago.monto));
        if (diferencia > 0.5) {
            throw new Error(`El monto validado (S/ ${data.montoPagado}) difiere más de S/ 0.50 del monto esperado (S/ ${pago.monto})`);
        }
        const pagoActualizado = await prisma.pago.update({
            where: { id: pagoId },
            data: {
                numerooperacion: data.numerooperacion,
                entidadbancaria: data.entidadbancaria,
                fechapago: data.fechaPago ?? pago.fechapago,
                horapago: data.fechaPago ?? pago.horapago,
                estado: EstadoPago.VALIDADO,
                conciliado: true,
                fechaconciliacion: new Date(),
                usuarioconciliacion_id: usuarioId,
                observaciones: data.observaciones
                    ? `${pago.observaciones || ''}\n${data.observaciones}`
                    : pago.observaciones,
            },
        });
        const solicitud = await prisma.solicitud.findFirst({
            where: { pago_id: pagoId },
        });
        if (solicitud) {
            await prisma.solicitud.update({
                where: { id: solicitud.id },
                data: {
                    estado: 'PAGO_VALIDADO',
                    fechavalidacionpago: new Date(),
                    usuariovalidacionpago_id: usuarioId,
                },
            });
        }
        logger.info(`Pago ${pagoId} validado manualmente por usuario ${usuarioId}`);
        return pagoActualizado;
    }
    async rechazarComprobante(pagoId, data, _usuarioId) {
        const pago = await this.findById(pagoId);
        if (pago.estado !== EstadoPago.PAGADO) {
            throw new Error('Solo se pueden rechazar pagos en estado PAGADO');
        }
        const observaciones = `RECHAZADO: ${data.motivo}${data.sugerencias ? `\nSugerencias: ${data.sugerencias}` : ''}`;
        return prisma.pago.update({
            where: { id: pagoId },
            data: {
                estado: EstadoPago.RECHAZADO,
                observaciones: `${pago.observaciones || ''}\n${observaciones}`,
            },
        });
    }
    async confirmarPagoAutomatico(_pagoId, _webhookData) {
        throw new Error('Pago automático no implementado aún');
    }
    async getPendientesValidacion(pagination) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const [total, data] = await Promise.all([
            prisma.pago.count({
                where: { estado: EstadoPago.PAGADO },
            }),
            prisma.pago.findMany({
                where: { estado: EstadoPago.PAGADO },
                orderBy: { fecharegistro: 'desc' },
                skip,
                take: limit,
                include: {
                    solicitud: {
                        select: {
                            id: true,
                            numeroexpediente: true,
                            numeroseguimiento: true,
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
    async findAll(filtros, pagination) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const where = {};
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        if (filtros.metodopago) {
            where.metodopago = filtros.metodopago;
        }
        if (filtros.numeroorden) {
            where.numeroorden = { contains: filtros.numeroorden };
        }
        if (filtros.numerooperacion) {
            where.numerooperacion = { contains: filtros.numerooperacion };
        }
        if (filtros.fechaDesde || filtros.fechaHasta) {
            where.fechapago = {};
            if (filtros.fechaDesde) {
                where.fechapago.gte = filtros.fechaDesde;
            }
            if (filtros.fechaHasta) {
                where.fechapago.lte = filtros.fechaHasta;
            }
        }
        if (filtros.conciliado !== undefined) {
            where.conciliado = filtros.conciliado;
        }
        const [total, data] = await Promise.all([
            prisma.pago.count({ where }),
            prisma.pago.findMany({
                where,
                orderBy: { fecharegistro: 'desc' },
                skip,
                take: limit,
                include: {
                    solicitud: {
                        select: {
                            id: true,
                            numeroexpediente: true,
                            numeroseguimiento: true,
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
    async findById(id) {
        const pago = await prisma.pago.findUnique({
            where: { id },
            include: {
                solicitud: {
                    select: {
                        id: true,
                        numeroexpediente: true,
                        numeroseguimiento: true,
                        estudiante: true,
                    },
                },
            },
        });
        if (!pago) {
            throw new Error('Pago no encontrado');
        }
        return pago;
    }
    async marcarExpiradas() {
        const hace24Horas = new Date();
        hace24Horas.setHours(hace24Horas.getHours() - 24);
        const resultado = await prisma.pago.updateMany({
            where: {
                estado: EstadoPago.PENDIENTE,
                fecharegistro: {
                    lt: hace24Horas,
                },
            },
            data: {
                estado: EstadoPago.EXPIRADO,
            },
        });
        logger.info(`${resultado.count} órdenes marcadas como expiradas`);
        return resultado.count;
    }
}
export const pagoService = new PagoService();
//# sourceMappingURL=pago.service.js.map