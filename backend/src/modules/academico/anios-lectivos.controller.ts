/**
 * Controlador de años lectivos
 */

import { Request, Response } from 'express';
import { aniosLectivosService } from './anios-lectivos.service';
import { logger } from '@config/logger';
import { CreateAnioLectivoDTO, UpdateAnioLectivoDTO } from './dtos';

export class AniosLectivosController {
  /**
   * GET /api/academico/anios-lectivos
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const activoOnly = req.query.activo === 'true';
      const anios = await aniosLectivosService.list(activoOnly);

      res.status(200).json({
        success: true,
        message: 'Lista de años lectivos',
        data: anios,
      });
    } catch (error: unknown) {
      logger.error('Error en list años lectivos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener lista de años lectivos',
      });
    }
  }

  /**
   * GET /api/academico/anios-lectivos/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;
      const anio = await aniosLectivosService.getById(id);

      res.status(200).json({
        success: true,
        message: 'Año lectivo encontrado',
        data: anio,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener año lectivo';
      logger.error('Error en getById año lectivo:', error);

      if (message === 'Año lectivo no encontrado') {
        res.status(404).json({ success: false, message });
        return;
      }

      res.status(500).json({ success: false, message });
    }
  }

  /**
   * POST /api/academico/anios-lectivos
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = CreateAnioLectivoDTO.parse(req.body);
      const anio = await aniosLectivosService.create(data);

      res.status(201).json({
        success: true,
        message: 'Año lectivo creado exitosamente',
        data: anio,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al crear año lectivo';
      logger.error('Error en create año lectivo:', error);
      res.status(400).json({ success: false, message });
    }
  }

  /**
   * PUT /api/academico/anios-lectivos/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;
      const data = UpdateAnioLectivoDTO.parse(req.body);
      const anio = await aniosLectivosService.update(id, data);

      res.status(200).json({
        success: true,
        message: 'Año lectivo actualizado exitosamente',
        data: anio,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar año lectivo';
      logger.error('Error en update año lectivo:', error);

      if (message === 'Año lectivo no encontrado') {
        res.status(404).json({ success: false, message });
        return;
      }

      res.status(400).json({ success: false, message });
    }
  }

  /**
   * DELETE /api/academico/anios-lectivos/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;
      await aniosLectivosService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Año lectivo eliminado exitosamente',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar año lectivo';
      logger.error('Error en delete año lectivo:', error);

      if (message === 'Año lectivo no encontrado') {
        res.status(404).json({ success: false, message });
        return;
      }

      res.status(500).json({ success: false, message });
    }
  }
}

export const aniosLectivosController = new AniosLectivosController();

