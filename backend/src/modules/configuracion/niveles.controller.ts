/**
 * Controlador de niveles educativos
 */

import { Request, Response } from 'express';
import { nivelesService } from './niveles.service';
import { logger } from '@config/logger';
import { CreateNivelDTO, UpdateNivelDTO } from './dtos';

export class NivelesController {
  /**
   * GET /api/configuracion/niveles
   * Listar todos los niveles educativos
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const activoOnly = req.query.activo === 'true';
      const niveles = await nivelesService.list(activoOnly);

      res.status(200).json({
        success: true,
        message: 'Lista de niveles educativos',
        data: niveles,
      });
    } catch (error: unknown) {
      logger.error('Error en list niveles:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener lista de niveles',
      });
    }
  }

  /**
   * GET /api/configuracion/niveles/:id
   * Obtener un nivel educativo por ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;
      const nivel = await nivelesService.getById(id);

      res.status(200).json({
        success: true,
        message: 'Nivel educativo encontrado',
        data: nivel,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener nivel';
      logger.error('Error en getById nivel:', error);

      if (message === 'Nivel educativo no encontrado') {
        res.status(404).json({
          success: false,
          message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * POST /api/configuracion/niveles
   * Crear un nuevo nivel educativo
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      // Body ya está validado por middleware
      const data = CreateNivelDTO.parse(req.body);

      const nivel = await nivelesService.create(data);

      res.status(201).json({
        success: true,
        message: 'Nivel educativo creado exitosamente',
        data: nivel,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al crear nivel';
      logger.error('Error en create nivel:', error);
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  /**
   * PUT /api/configuracion/niveles/:id
   * Actualizar un nivel educativo
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;

      // Body ya está validado por middleware
      const data = UpdateNivelDTO.parse(req.body);

      const nivel = await nivelesService.update(id, data);

      res.status(200).json({
        success: true,
        message: 'Nivel educativo actualizado exitosamente',
        data: nivel,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar nivel';
      logger.error('Error en update nivel:', error);

      if (message === 'Nivel educativo no encontrado') {
        res.status(404).json({
          success: false,
          message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  /**
   * DELETE /api/configuracion/niveles/:id
   * Eliminar un nivel educativo (soft delete)
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;

      await nivelesService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Nivel educativo eliminado exitosamente',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar nivel';
      logger.error('Error en delete nivel:', error);

      if (message === 'Nivel educativo no encontrado') {
        res.status(404).json({
          success: false,
          message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message,
      });
    }
  }
}

export const nivelesController = new NivelesController();

