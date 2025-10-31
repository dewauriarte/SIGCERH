import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
const prisma = new PrismaClient();
export class WebhookService {
    async recibirWebhook(payload, headers) {
        try {
            const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || null;
            let pagoId = null;
            if (payload.numeroOrden) {
                const pago = await prisma.pago.findUnique({
                    where: { numeroorden: payload.numeroOrden },
                });
                pagoId = pago?.id || null;
            }
            const webhook = await prisma.webhookpago.create({
                data: {
                    pago_id: pagoId,
                    pasarela_id: null,
                    evento: payload.evento || 'DESCONOCIDO',
                    payload: payload,
                    headers: headers,
                    ip: ip?.substring(0, 45),
                    procesado: false,
                    fecharecepcion: new Date(),
                },
            });
            logger.info(`Webhook ${webhook.id} recibido: ${payload.evento}`);
            if (payload.estado === 'APROBADO' || payload.estado === 'PAGADO') {
                await this.procesarPagoAprobado(webhook.id, payload);
            }
            else if (payload.estado === 'RECHAZADO') {
                await this.procesarPagoRechazado(webhook.id, payload);
            }
            return {
                success: true,
                message: 'Webhook recibido correctamente',
                webhookId: webhook.id,
            };
        }
        catch (error) {
            logger.error('Error al recibir webhook:', error);
            throw error;
        }
    }
    async procesarPagoAprobado(webhookId, payload) {
        try {
            if (!payload.numeroOrden) {
                throw new Error('No se puede procesar webhook sin número de orden');
            }
            const pago = await prisma.pago.findUnique({
                where: { numeroorden: payload.numeroOrden },
            });
            if (!pago) {
                throw new Error(`Pago con orden ${payload.numeroOrden} no encontrado`);
            }
            await prisma.pago.update({
                where: { id: pago.id },
                data: {
                    numerooperacion: payload.transactionId || 'AUTO',
                    estado: 'VALIDADO',
                    conciliado: true,
                    fechaconciliacion: new Date(),
                },
            });
            const solicitud = await prisma.solicitud.findFirst({
                where: { pago_id: pago.id },
            });
            if (solicitud) {
                await prisma.solicitud.update({
                    where: { id: solicitud.id },
                    data: {
                        estado: 'PAGO_VALIDADO',
                        fechavalidacionpago: new Date(),
                    },
                });
            }
            await prisma.webhookpago.update({
                where: { id: webhookId },
                data: {
                    procesado: true,
                    fechaprocesamiento: new Date(),
                },
            });
            logger.info(`Webhook ${webhookId} procesado: Pago ${pago.id} aprobado`);
        }
        catch (error) {
            logger.error(`Error al procesar webhook ${webhookId}:`, error);
            await prisma.webhookpago.update({
                where: { id: webhookId },
                data: {
                    procesado: false,
                    error: error.message,
                    fechaprocesamiento: new Date(),
                },
            });
            throw error;
        }
    }
    async procesarPagoRechazado(webhookId, payload) {
        try {
            if (!payload.numeroOrden) {
                throw new Error('No se puede procesar webhook sin número de orden');
            }
            const pago = await prisma.pago.findUnique({
                where: { numeroorden: payload.numeroOrden },
            });
            if (!pago) {
                throw new Error(`Pago con orden ${payload.numeroOrden} no encontrado`);
            }
            await prisma.pago.update({
                where: { id: pago.id },
                data: {
                    estado: 'RECHAZADO',
                },
            });
            await prisma.webhookpago.update({
                where: { id: webhookId },
                data: {
                    procesado: true,
                    fechaprocesamiento: new Date(),
                },
            });
            logger.info(`Webhook ${webhookId} procesado: Pago ${pago.id} rechazado`);
        }
        catch (error) {
            logger.error(`Error al procesar webhook rechazado ${webhookId}:`, error);
            await prisma.webhookpago.update({
                where: { id: webhookId },
                data: {
                    procesado: false,
                    error: error.message,
                    fechaprocesamiento: new Date(),
                },
            });
            throw error;
        }
    }
    async listar(pagination) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const [total, data] = await Promise.all([
            prisma.webhookpago.count(),
            prisma.webhookpago.findMany({
                orderBy: { fecharecepcion: 'desc' },
                skip,
                take: limit,
                include: {
                    pago: {
                        select: {
                            numeroorden: true,
                            estado: true,
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
    async reprocesar(webhookId) {
        const webhook = await prisma.webhookpago.findUnique({
            where: { id: webhookId },
        });
        if (!webhook) {
            throw new Error('Webhook no encontrado');
        }
        const payload = webhook.payload;
        const headers = webhook.headers;
        await prisma.webhookpago.update({
            where: { id: webhookId },
            data: {
                procesado: false,
                error: null,
                fechaprocesamiento: null,
            },
        });
        return this.recibirWebhook(payload, headers);
    }
}
export const webhookService = new WebhookService();
//# sourceMappingURL=webhook.service.js.map