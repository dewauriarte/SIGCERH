/**
 * Controlador de Áreas Curriculares
 */

import { Request, Response } from 'express';
import { areasCurricularesService } from './areas-curriculares.service';
import { logger } from '@config/logger';
import { CreateAreaCurricularDTO, UpdateAreaCurricularDTO, FiltrosAreaCurricularDTO } from './dtos';

export class AreasCurricularesController {
  async create(req: Request, res: Response) {
    try {
      const data = CreateAreaCurricularDTO.parse(req.body);
      const area = await areasCurricularesService.create(data);

      res.status(201).json({
        success: true,
        message: 'Área curricular creada exitosamente',
        data: area,
      });
    } catch (error: any) {
      logger.error('Error en create área curricular:', error);

      if (error.message?.includes('Ya existe')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear área curricular',
      });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const filtros = FiltrosAreaCurricularDTO.parse({
        search: req.query.search,
        escompetenciatransversal: req.query.escompetenciatransversal,
        activo: req.query.activo,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      });

      const result = await areasCurricularesService.findAll(filtros, {
        page: filtros.page || 1,
        limit: filtros.limit || 20,
      });

      res.status(200).json({
        success: true,
        message: 'Áreas curriculares obtenidas correctamente',
        data: result.areas,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Error en list áreas curriculares:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener áreas curriculares',
      });
    }
  }

  async getActivas(req: Request, res: Response) {
    try {
      const areas = await areasCurricularesService.getActivas();

      res.status(200).json({
        success: true,
        message: 'Áreas curriculares activas obtenidas',
        data: areas,
      });
    } catch (error: any) {
      logger.error('Error en getActivas áreas curriculares:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener áreas curriculares activas',
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const area = await areasCurricularesService.findById(id);

      res.status(200).json({
        success: true,
        message: 'Área curricular obtenida correctamente',
        data: area,
      });
    } catch (error: any) {
      logger.error('Error en getById área curricular:', error);

      if (error.message === 'Área curricular no encontrada') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener área curricular',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = UpdateAreaCurricularDTO.parse(req.body);

      const area = await areasCurricularesService.update(id, data);

      res.status(200).json({
        success: true,
        message: 'Área curricular actualizada exitosamente',
        data: area,
      });
    } catch (error: any) {
      logger.error('Error en update área curricular:', error);

      if (error.message === 'Área curricular no encontrada') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message?.includes('Ya existe')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar área curricular',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await areasCurricularesService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Área curricular eliminada exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en delete área curricular:', error);

      if (error.message === 'Área curricular no encontrada') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al eliminar área curricular',
      });
    }
  }
}

export const areasCurricularesController = new AreasCurricularesController();

