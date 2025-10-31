/**
 * Controlador de áreas curriculares
 */

import { Request, Response } from 'express';
import { areasCurricularesService } from './areas-curriculares.service';
import { logger } from '@config/logger';
import { CreateAreaCurricularDTO, UpdateAreaCurricularDTO } from './dtos';

export class AreasCurricularesController {
  /**
   * GET /api/academico/areas-curriculares
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const activoOnly = req.query.activo === 'true';

      const areas = await areasCurricularesService.list(activoOnly);

      res.status(200).json({
        success: true,
        message: 'Lista de áreas curriculares',
        data: areas,
      });
    } catch (error: unknown) {
      logger.error('Error en list áreas curriculares:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener lista de áreas curriculares',
      });
    }
  }

  /**
   * GET /api/academico/areas-curriculares/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;
      const area = await areasCurricularesService.getById(id);

      res.status(200).json({
        success: true,
        message: 'Área curricular encontrada',
        data: area,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener área curricular';
      logger.error('Error en getById área curricular:', error);

      if (message === 'Área curricular no encontrada') {
        res.status(404).json({ success: false, message });
        return;
      }

      res.status(500).json({ success: false, message });
    }
  }

  /**
   * POST /api/academico/areas-curriculares
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = CreateAreaCurricularDTO.parse(req.body);
      const area = await areasCurricularesService.create(data);

      res.status(201).json({
        success: true,
        message: 'Área curricular creada exitosamente',
        data: area,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al crear área curricular';
      logger.error('Error en create área curricular:', error);
      res.status(400).json({ success: false, message });
    }
  }

  /**
   * PUT /api/academico/areas-curriculares/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;
      const data = UpdateAreaCurricularDTO.parse(req.body);
      const area = await areasCurricularesService.update(id, data);

      res.status(200).json({
        success: true,
        message: 'Área curricular actualizada exitosamente',
        data: area,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar área curricular';
      logger.error('Error en update área curricular:', error);

      if (message === 'Área curricular no encontrada') {
        res.status(404).json({ success: false, message });
        return;
      }

      res.status(400).json({ success: false, message });
    }
  }

  /**
   * DELETE /api/academico/areas-curriculares/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;
      await areasCurricularesService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Área curricular eliminada exitosamente',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar área curricular';
      logger.error('Error en delete área curricular:', error);

      if (message === 'Área curricular no encontrada') {
        res.status(404).json({ success: false, message });
        return;
      }

      res.status(500).json({ success: false, message });
    }
  }
}

export const areasCurricularesController = new AreasCurricularesController();

