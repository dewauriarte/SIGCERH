/**
 * Servicio de Webhooks
 * Gestiona recepción de webhooks de pasarelas de pago
 * Adaptado al schema de Prisma existente
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import type { WebhookPagoDTOType } from './dtos';

const prisma = new PrismaClient();

export class WebhookService {
  /**
   * Recibir y registrar webhook de pasarela de pago
   */
  async recibirWebhook(payload: WebhookPagoDTOType, headers: any) {
    try {
      // Extraer IP del request (si está disponible)
      const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || null;

      // Buscar pago por número de orden si viene en el payload
      let pagoId: string | null = null;
      if (payload.numeroOrden) {
        const pago = await prisma.pago.findUnique({
          where: { numeroorden: payload.numeroOrden },
        });
        pagoId = pago?.id || null;
      }

      // Registrar webhook en base de datos
      const webhook = await prisma.webhookpago.create({
        data: {
          pago_id: pagoId,
          pasarela_id: null, // Se puede relacionar con pasarela cuando esté configurada
          evento: payload.evento || 'DESCONOCIDO',
          payload: payload as any,
          headers: headers as any,
          ip: ip?.substring(0, 45),
          procesado: false,
          fecharecepcion: new Date(),
        },
      });

      logger.info(`Webhook ${webhook.id} recibido: ${payload.evento}`);

      // Procesar webhook según el evento
      // Nota: Esta es una implementación básica. Debe adaptarse según la pasarela específica
      if (payload.estado === 'APROBADO' || payload.estado === 'PAGADO') {
        await this.procesarPagoAprobado(webhook.id, payload);
      } else if (payload.estado === 'RECHAZADO') {
        await this.procesarPagoRechazado(webhook.id, payload);
      }

      return {
        success: true,
        message: 'Webhook recibido correctamente',
        webhookId: webhook.id,
      };
    } catch (error: any) {
      logger.error('Error al recibir webhook:', error);
      throw error;
    }
  }

  /**
   * Procesar pago aprobado (webhook de éxito)
   */
  private async procesarPagoAprobado(webhookId: string, payload: WebhookPagoDTOType) {
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

      // Actualizar pago como validado automáticamente
      await prisma.pago.update({
        where: { id: pago.id },
        data: {
          numerooperacion: payload.transactionId || 'AUTO',
          estado: 'VALIDADO',
          conciliado: true,
          fechaconciliacion: new Date(),
        },
      });

      // Actualizar solicitud asociada
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

      // Marcar webhook como procesado
      await prisma.webhookpago.update({
        where: { id: webhookId },
        data: {
          procesado: true,
          fechaprocesamiento: new Date(),
        },
      });

      logger.info(`Webhook ${webhookId} procesado: Pago ${pago.id} aprobado`);
    } catch (error: any) {
      logger.error(`Error al procesar webhook ${webhookId}:`, error);

      // Registrar error en el webhook
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

  /**
   * Procesar pago rechazado (webhook de fallo)
   */
  private async procesarPagoRechazado(webhookId: string, payload: WebhookPagoDTOType) {
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

      // Actualizar pago como rechazado
      await prisma.pago.update({
        where: { id: pago.id },
        data: {
          estado: 'RECHAZADO',
        },
      });

      // Marcar webhook como procesado
      await prisma.webhookpago.update({
        where: { id: webhookId },
        data: {
          procesado: true,
          fechaprocesamiento: new Date(),
        },
      });

      logger.info(`Webhook ${webhookId} procesado: Pago ${pago.id} rechazado`);
    } catch (error: any) {
      logger.error(`Error al procesar webhook rechazado ${webhookId}:`, error);

      // Registrar error en el webhook
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

  /**
   * Listar webhooks recibidos
   */
  async listar(pagination: { page: number; limit: number }) {
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

  /**
   * Reprocesar webhook fallido
   */
  async reprocesar(webhookId: string) {
    const webhook = await prisma.webhookpago.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new Error('Webhook no encontrado');
    }

    const payload = webhook.payload as WebhookPagoDTOType;
    const headers = webhook.headers as any;

    // Resetear estado
    await prisma.webhookpago.update({
      where: { id: webhookId },
      data: {
        procesado: false,
        error: null,
        fechaprocesamiento: null,
      },
    });

    // Intentar procesar nuevamente
    return this.recibirWebhook(payload, headers);
  }
}

export const webhookService = new WebhookService();
