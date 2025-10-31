/**
 * Controlador de Métodos de Pago
 * Gestiona la configuración de métodos de pago
 */

import { Request, Response } from 'express';
import { metodoPagoService } from './metodo-pago.service';
import { logger } from '@config/logger';
import {
  CreateMetodoPagoDTO,
  UpdateMetodoPagoDTO,
} from './dtos';

export class MetodoPagoController {
  /**
   * GET /api/pagos/metodos
   * Listar todos los métodos de pago (Admin)
   */
  async listar(_req: Request, res: Response): Promise<void> {
    try {
      const metodos = await metodoPagoService.findAll();

      res.status(200).json({
        success: true,
        message: 'Lista de métodos de pago',
        data: metodos,
      });
    } catch (error: any) {
      logger.error('Error en listar métodos de pago:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/pagos/metodos/activos
   * Listar solo métodos de pago activos (Usuario Público)
   */
  async listarActivos(_req: Request, res: Response): Promise<void> {
    try {
      const metodos = await metodoPagoService.findActivos();

      res.status(200).json({
        success: true,
        message: 'Métodos de pago disponibles',
        data: metodos,
      });
    } catch (error: any) {
      logger.error('Error en listar métodos activos:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/pagos/metodos/:id
   * Obtener método de pago por ID
   */
  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const metodo = await metodoPagoService.findById(id!);

      res.status(200).json({
        success: true,
        message: 'Método de pago encontrado',
        data: metodo,
      });
    } catch (error: any) {
      logger.error('Error en obtenerPorId método de pago:', error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/pagos/metodos
   * Crear método de pago (Admin)
   */
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const data = CreateMetodoPagoDTO.parse(req.body);
      const metodo = await metodoPagoService.create(data);

      res.status(201).json({
        success: true,
        message: 'Método de pago creado exitosamente',
        data: metodo,
      });
    } catch (error: any) {
      logger.error('Error en crear método de pago:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/pagos/metodos/:id
   * Actualizar método de pago (Admin)
   */
  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = UpdateMetodoPagoDTO.parse(req.body);

      const metodo = await metodoPagoService.update(id!, data);

      res.status(200).json({
        success: true,
        message: 'Método de pago actualizado exitosamente',
        data: metodo,
      });
    } catch (error: any) {
      logger.error('Error en actualizar método de pago:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PATCH /api/pagos/metodos/:id/toggle
   * Activar/Desactivar método de pago (Admin)
   */
  async toggle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const metodo = await metodoPagoService.toggleActivo(id!);

      res.status(200).json({
        success: true,
        message: `Método de pago ${metodo.activo ? 'activado' : 'desactivado'}`,
        data: metodo,
      });
    } catch (error: any) {
      logger.error('Error en toggle método de pago:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/pagos/metodos/:id
   * Eliminar método de pago (Admin - soft delete)
   */
  async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await metodoPagoService.delete(id!);

      res.status(200).json({
        success: true,
        message: 'Método de pago desactivado exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en eliminar método de pago:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/pagos/metodos/seed
   * Ejecutar seed de métodos de pago (Admin)
   */
  async seed(_req: Request, res: Response): Promise<void> {
    try {
      await metodoPagoService.seed();

      res.status(200).json({
        success: true,
        message: 'Seed de métodos de pago ejecutado exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en seed métodos de pago:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export const metodoPagoController = new MetodoPagoController();

