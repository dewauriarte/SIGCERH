/**
 * Controlador de Pagos
 * Adaptado al schema de Prisma existente
 */

import { Request, Response } from 'express';
import { pagoService } from './pago.service';
import { webhookService } from './webhook.service';
import { logger } from '@config/logger';
import {
  GenerarOrdenDTO,
  SubirComprobanteDTO,
  ValidarPagoManualDTO,
  RechazarComprobanteDTO,
  RegistrarPagoEfectivoDTO,
  WebhookPagoDTO,
  FiltrosPagoDTO,
} from './dtos';

export class PagoController {
  /**
   * POST /api/pagos/orden
   * Generar orden de pago (Usuario Público)
   */
  async generarOrden(req: Request, res: Response): Promise<void> {
    try {
      const data = GenerarOrdenDTO.parse(req.body);
      const usuarioId = (req as any).usuario?.id;

      const pago = await pagoService.generarOrden(data, usuarioId);

      res.status(201).json({
        success: true,
        message: 'Orden de pago generada exitosamente',
        data: {
          pagoId: pago.id,
          numeroOrden: pago.numeroorden,
          monto: pago.monto,
          metodoPago: pago.metodopago,
          estado: pago.estado,
        },
      });
    } catch (error: any) {
      logger.error('Error en generarOrden:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al generar orden de pago',
      });
    }
  }

  /**
   * POST /api/pagos/:id/comprobante
   * Subir comprobante de pago (Usuario)
   */
  async subirComprobante(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No se ha subido ningún archivo de comprobante',
        });
        return;
      }

      const { id } = req.params;
      const data = SubirComprobanteDTO.parse(req.body);

      const pago = await pagoService.subirComprobante(id!, req.file, data);

      res.status(200).json({
        success: true,
        message: 'Comprobante subido exitosamente. Será validado por Mesa de Partes.',
        data: pago,
      });
    } catch (error: any) {
      logger.error('Error en subirComprobante:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al subir comprobante',
      });
    }
  }

  /**
   * POST /api/pagos/:id/registrar-efectivo
   * Registrar pago en efectivo (Mesa de Partes)
   * Versión que requiere pagoId existente
   */
  async registrarEfectivo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const data = RegistrarPagoEfectivoDTO.parse(req.body);

      const pago = await pagoService.registrarPagoEfectivo(id!, data, usuarioId);

      res.status(200).json({
        success: true,
        message: 'Pago en efectivo registrado y validado exitosamente',
        data: pago,
      });
    } catch (error: any) {
      logger.error('Error en registrarEfectivo:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al registrar pago en efectivo',
      });
    }
  }

  /**
   * POST /api/pagos/registrar-efectivo
   * Crear y registrar pago en efectivo desde solicitud (Mesa de Partes)
   * No requiere pagoId previo
   */
  async crearRegistrarEfectivo(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = (req as any).user.id; // CORREGIDO: user.id no usuario.id
      const data = req.body; // CrearPagoEfectivoDTO will be validated in route

      const pago = await pagoService.crearYRegistrarPagoEfectivo(data, usuarioId);

      res.status(201).json({
        success: true,
        message: 'Pago en efectivo creado y validado exitosamente',
        data: pago,
      });
    } catch (error: any) {
      logger.error('Error en crearRegistrarEfectivo:', error.message);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear pago en efectivo',
      });
    }
  }

  /**
   * POST /api/pagos/:id/validar-manual
   * Validar pago manualmente (Mesa de Partes)
   */
  async validarManual(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const data = ValidarPagoManualDTO.parse(req.body);

      const pago = await pagoService.validarManualmente(id!, data, usuarioId);

      res.status(200).json({
        success: true,
        message: 'Pago validado exitosamente. Solicitud actualizada.',
        data: pago,
      });
    } catch (error: any) {
      logger.error('Error en validarManual:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al validar pago',
      });
    }
  }

  /**
   * POST /api/pagos/:id/rechazar-comprobante
   * Rechazar comprobante (Mesa de Partes)
   */
  async rechazarComprobante(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const data = RechazarComprobanteDTO.parse(req.body);

      const pago = await pagoService.rechazarComprobante(id!, data, usuarioId);

      res.status(200).json({
        success: true,
        message: 'Comprobante rechazado. Usuario será notificado.',
        data: pago,
      });
    } catch (error: any) {
      logger.error('Error en rechazarComprobante:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al rechazar comprobante',
      });
    }
  }

  /**
   * GET /api/pagos/pendientes-validacion
   * Listar pagos pendientes de validación (Mesa de Partes)
   */
  async getPendientesValidacion(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '20');

      const resultado = await pagoService.getPendientesValidacion({
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        message: 'Pagos pendientes de validación',
        data: resultado.data,
        meta: resultado.meta,
      });
    } catch (error: any) {
      logger.error('Error en getPendientesValidacion:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/pagos
   * Listar pagos con filtros (Admin)
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const filtros = FiltrosPagoDTO.parse(req.query);
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '20');

      const resultado = await pagoService.findAll(filtros, { page, limit });

      res.status(200).json({
        success: true,
        message: 'Lista de pagos',
        data: resultado.data,
        meta: resultado.meta,
      });
    } catch (error: any) {
      logger.error('Error en listar pagos:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/pagos/:id
   * Obtener detalle de pago
   */
  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const pago = await pagoService.findById(id!);

      res.status(200).json({
        success: true,
        message: 'Detalle de pago',
        data: pago,
      });
    } catch (error: any) {
      logger.error('Error en obtenerPorId:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Pago no encontrado',
      });
    }
  }

  /**
   * GET /api/pagos/estadisticas
   * Obtener estadísticas de pagos (Mesa de Partes)
   */
  async getEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const estadisticas = await pagoService.getEstadisticas();

      res.status(200).json({
        success: true,
        message: 'Estadísticas de pagos',
        data: estadisticas,
      });
    } catch (error: any) {
      logger.error('Error en getEstadisticas:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas',
      });
    }
  }

  /**
   * POST /api/pagos/webhook
   * Recibir webhook de pasarela (Sistema - sin auth)
   */
  async recibirWebhook(req: Request, res: Response): Promise<void> {
    try {
      const data = WebhookPagoDTO.parse(req.body);
      const headers = req.headers;

      const resultado = await webhookService.recibirWebhook(data, headers);

      // Retornar 200 siempre para confirmar recepción
      res.status(200).json(resultado);
    } catch (error: any) {
      logger.error('Error en recibirWebhook:', error);
      // Aún así retornar 200 para no romper el webhook
      res.status(200).json({
        success: false,
        message: 'Webhook recibido con errores',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/pagos/marcar-expiradas
   * Marcar órdenes expiradas (Tarea programada/Admin)
   */
  async marcarExpiradas(_req: Request, res: Response): Promise<void> {
    try {
      const cantidad = await pagoService.marcarExpiradas();

      res.status(200).json({
        success: true,
        message: `${cantidad} órdenes marcadas como expiradas`,
        data: { cantidad },
      });
    } catch (error: any) {
      logger.error('Error en marcarExpiradas:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export const pagoController = new PagoController();
