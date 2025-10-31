/**
 * Controlador de grados
 */

import { Request, Response } from 'express';
import { gradosService } from './grados.service';
import { logger } from '@config/logger';
import { CreateGradoDTO, UpdateGradoDTO } from './dtos';

export class GradosController {
  /**
   * GET /api/academico/grados
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const nivelEducativoId = req.query.nivelEducativoId as string | undefined;
      const activoOnly = req.query.activo === 'true';

      const grados = await gradosService.list(nivelEducativoId, activoOnly);

      res.status(200).json({
        success: true,
        message: 'Lista de grados',
        data: grados,
      });
    } catch (error: unknown) {
      logger.error('Error en list grados:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener lista de grados',
      });
    }
  }

  /**
   * GET /api/academico/grados/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;
      const grado = await gradosService.getById(id);

      res.status(200).json({
        success: true,
        message: 'Grado encontrado',
        data: grado,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener grado';
      logger.error('Error en getById grado:', error);

      if (message === 'Grado no encontrado') {
        res.status(404).json({ success: false, message });
        return;
      }

      res.status(500).json({ success: false, message });
    }
  }

  /**
   * POST /api/academico/grados
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = CreateGradoDTO.parse(req.body);
      const grado = await gradosService.create(data);

      res.status(201).json({
        success: true,
        message: 'Grado creado exitosamente',
        data: grado,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al crear grado';
      logger.error('Error en create grado:', error);
      res.status(400).json({ success: false, message });
    }
  }

  /**
   * PUT /api/academico/grados/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;
      const data = UpdateGradoDTO.parse(req.body);
      const grado = await gradosService.update(id, data);

      res.status(200).json({
        success: true,
        message: 'Grado actualizado exitosamente',
        data: grado,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar grado';
      logger.error('Error en update grado:', error);

      if (message === 'Grado no encontrado') {
        res.status(404).json({ success: false, message });
        return;
      }

      res.status(400).json({ success: false, message });
    }
  }

  /**
   * DELETE /api/academico/grados/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;
      await gradosService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Grado eliminado exitosamente',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar grado';
      logger.error('Error en delete grado:', error);

      if (message === 'Grado no encontrado') {
        res.status(404).json({ success: false, message });
        return;
      }

      res.status(500).json({ success: false, message });
    }
  }
}

export const gradosController = new GradosController();

