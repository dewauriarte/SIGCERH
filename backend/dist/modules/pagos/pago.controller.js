import { pagoService } from './pago.service';
import { webhookService } from './webhook.service';
import { logger } from '@config/logger';
import { GenerarOrdenDTO, SubirComprobanteDTO, ValidarPagoManualDTO, RechazarComprobanteDTO, RegistrarPagoEfectivoDTO, WebhookPagoDTO, FiltrosPagoDTO, } from './dtos';
export class PagoController {
    async generarOrden(req, res) {
        try {
            const data = GenerarOrdenDTO.parse(req.body);
            const usuarioId = req.usuario?.id;
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
        }
        catch (error) {
            logger.error('Error en generarOrden:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al generar orden de pago',
            });
        }
    }
    async subirComprobante(req, res) {
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
            const pago = await pagoService.subirComprobante(id, req.file, data);
            res.status(200).json({
                success: true,
                message: 'Comprobante subido exitosamente. Será validado por Mesa de Partes.',
                data: pago,
            });
        }
        catch (error) {
            logger.error('Error en subirComprobante:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al subir comprobante',
            });
        }
    }
    async registrarEfectivo(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const data = RegistrarPagoEfectivoDTO.parse(req.body);
            const pago = await pagoService.registrarPagoEfectivo(id, data, usuarioId);
            res.status(200).json({
                success: true,
                message: 'Pago en efectivo registrado y validado exitosamente',
                data: pago,
            });
        }
        catch (error) {
            logger.error('Error en registrarEfectivo:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al registrar pago en efectivo',
            });
        }
    }
    async validarManual(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const data = ValidarPagoManualDTO.parse(req.body);
            const pago = await pagoService.validarManualmente(id, data, usuarioId);
            res.status(200).json({
                success: true,
                message: 'Pago validado exitosamente. Solicitud actualizada.',
                data: pago,
            });
        }
        catch (error) {
            logger.error('Error en validarManual:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al validar pago',
            });
        }
    }
    async rechazarComprobante(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const data = RechazarComprobanteDTO.parse(req.body);
            const pago = await pagoService.rechazarComprobante(id, data, usuarioId);
            res.status(200).json({
                success: true,
                message: 'Comprobante rechazado. Usuario será notificado.',
                data: pago,
            });
        }
        catch (error) {
            logger.error('Error en rechazarComprobante:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al rechazar comprobante',
            });
        }
    }
    async getPendientesValidacion(req, res) {
        try {
            const page = parseInt(req.query.page || '1');
            const limit = parseInt(req.query.limit || '20');
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
        }
        catch (error) {
            logger.error('Error en getPendientesValidacion:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async listar(req, res) {
        try {
            const filtros = FiltrosPagoDTO.parse(req.query);
            const page = parseInt(req.query.page || '1');
            const limit = parseInt(req.query.limit || '20');
            const resultado = await pagoService.findAll(filtros, { page, limit });
            res.status(200).json({
                success: true,
                message: 'Lista de pagos',
                data: resultado.data,
                meta: resultado.meta,
            });
        }
        catch (error) {
            logger.error('Error en listar pagos:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const pago = await pagoService.findById(id);
            res.status(200).json({
                success: true,
                message: 'Detalle de pago',
                data: pago,
            });
        }
        catch (error) {
            logger.error('Error en obtenerPorId:', error);
            res.status(404).json({
                success: false,
                message: error.message || 'Pago no encontrado',
            });
        }
    }
    async recibirWebhook(req, res) {
        try {
            const data = WebhookPagoDTO.parse(req.body);
            const headers = req.headers;
            const resultado = await webhookService.recibirWebhook(data, headers);
            res.status(200).json(resultado);
        }
        catch (error) {
            logger.error('Error en recibirWebhook:', error);
            res.status(200).json({
                success: false,
                message: 'Webhook recibido con errores',
                error: error.message,
            });
        }
    }
    async marcarExpiradas(_req, res) {
        try {
            const cantidad = await pagoService.marcarExpiradas();
            res.status(200).json({
                success: true,
                message: `${cantidad} órdenes marcadas como expiradas`,
                data: { cantidad },
            });
        }
        catch (error) {
            logger.error('Error en marcarExpiradas:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
}
export const pagoController = new PagoController();
//# sourceMappingURL=pago.controller.js.map