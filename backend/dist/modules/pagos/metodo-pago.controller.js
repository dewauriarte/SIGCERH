import { metodoPagoService } from './metodo-pago.service';
import { logger } from '@config/logger';
import { CreateMetodoPagoDTO, UpdateMetodoPagoDTO, } from './dtos';
export class MetodoPagoController {
    async listar(_req, res) {
        try {
            const metodos = await metodoPagoService.findAll();
            res.status(200).json({
                success: true,
                message: 'Lista de métodos de pago',
                data: metodos,
            });
        }
        catch (error) {
            logger.error('Error en listar métodos de pago:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async listarActivos(_req, res) {
        try {
            const metodos = await metodoPagoService.findActivos();
            res.status(200).json({
                success: true,
                message: 'Métodos de pago disponibles',
                data: metodos,
            });
        }
        catch (error) {
            logger.error('Error en listar métodos activos:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const metodo = await metodoPagoService.findById(id);
            res.status(200).json({
                success: true,
                message: 'Método de pago encontrado',
                data: metodo,
            });
        }
        catch (error) {
            logger.error('Error en obtenerPorId método de pago:', error);
            res.status(404).json({
                success: false,
                message: error.message,
            });
        }
    }
    async crear(req, res) {
        try {
            const data = CreateMetodoPagoDTO.parse(req.body);
            const metodo = await metodoPagoService.create(data);
            res.status(201).json({
                success: true,
                message: 'Método de pago creado exitosamente',
                data: metodo,
            });
        }
        catch (error) {
            logger.error('Error en crear método de pago:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const data = UpdateMetodoPagoDTO.parse(req.body);
            const metodo = await metodoPagoService.update(id, data);
            res.status(200).json({
                success: true,
                message: 'Método de pago actualizado exitosamente',
                data: metodo,
            });
        }
        catch (error) {
            logger.error('Error en actualizar método de pago:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async toggle(req, res) {
        try {
            const { id } = req.params;
            const metodo = await metodoPagoService.toggleActivo(id);
            res.status(200).json({
                success: true,
                message: `Método de pago ${metodo.activo ? 'activado' : 'desactivado'}`,
                data: metodo,
            });
        }
        catch (error) {
            logger.error('Error en toggle método de pago:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async eliminar(req, res) {
        try {
            const { id } = req.params;
            await metodoPagoService.delete(id);
            res.status(200).json({
                success: true,
                message: 'Método de pago desactivado exitosamente',
            });
        }
        catch (error) {
            logger.error('Error en eliminar método de pago:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async seed(_req, res) {
        try {
            await metodoPagoService.seed();
            res.status(200).json({
                success: true,
                message: 'Seed de métodos de pago ejecutado exitosamente',
            });
        }
        catch (error) {
            logger.error('Error en seed métodos de pago:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
}
export const metodoPagoController = new MetodoPagoController();
//# sourceMappingURL=metodo-pago.controller.js.map