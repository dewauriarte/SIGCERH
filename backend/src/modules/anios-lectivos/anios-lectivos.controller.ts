/**
 * Controlador de Años Lectivos
 */

import { Request, Response } from 'express';
import { aniosLectivosService } from './anios-lectivos.service';
import { logger } from '@config/logger';
import { CreateAnioLectivoDTO, UpdateAnioLectivoDTO, FiltrosAnioLectivoDTO } from './dtos';

export class AniosLectivosController {
  async create(req: Request, res: Response) {
    try {
      const data = CreateAnioLectivoDTO.parse(req.body);
      const anioLectivo = await aniosLectivosService.create(data);

      res.status(201).json({
        success: true,
        message: 'Año lectivo creado exitosamente',
        data: anioLectivo,
      });
    } catch (error: any) {
      logger.error('Error en create año lectivo:', error);

      if (error.message?.includes('Ya existe')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear año lectivo',
      });
    }
  }

  async list(req: Request, res: Response) {
    try {
      logger.info('Filtros recibidos:', req.query);
      
      const filtros = FiltrosAnioLectivoDTO.parse({
        search: req.query.search,
        activo: req.query.activo,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      });

      logger.info('Filtros parseados:', filtros);

      const result = await aniosLectivosService.findAll(filtros, {
        page: filtros.page || 1,
        limit: filtros.limit || 20,
      });

      res.status(200).json({
        success: true,
        message: 'Años lectivos obtenidos correctamente',
        data: result.aniosLectivos,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Error en list años lectivos:', error);
      logger.error('Error details:', error.message);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener años lectivos',
      });
    }
  }

  async getActivos(req: Request, res: Response) {
    try {
      const aniosLectivos = await aniosLectivosService.getActivos();

      res.status(200).json({
        success: true,
        message: 'Años lectivos activos obtenidos',
        data: aniosLectivos,
      });
    } catch (error: any) {
      logger.error('Error en getActivos años lectivos:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener años lectivos activos',
      });
    }
  }

  async getActual(req: Request, res: Response) {
    try {
      const anioLectivo = await aniosLectivosService.getActual();

      res.status(200).json({
        success: true,
        message: 'Año lectivo actual obtenido',
        data: anioLectivo,
      });
    } catch (error: any) {
      logger.error('Error en getActual año lectivo:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener año lectivo actual',
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const anioLectivo = await aniosLectivosService.findById(id);

      res.status(200).json({
        success: true,
        message: 'Año lectivo obtenido correctamente',
        data: anioLectivo,
      });
    } catch (error: any) {
      logger.error('Error en getById año lectivo:', error);

      if (error.message === 'Año lectivo no encontrado') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener año lectivo',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = UpdateAnioLectivoDTO.parse(req.body);

      const anioLectivo = await aniosLectivosService.update(id, data);

      res.status(200).json({
        success: true,
        message: 'Año lectivo actualizado exitosamente',
        data: anioLectivo,
      });
    } catch (error: any) {
      logger.error('Error en update año lectivo:', error);

      if (error.message === 'Año lectivo no encontrado') {
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
        message: error.message || 'Error al actualizar año lectivo',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await aniosLectivosService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Año lectivo eliminado exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en delete año lectivo:', error);

      if (error.message === 'Año lectivo no encontrado') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al eliminar año lectivo',
      });
    }
  }
}

export const aniosLectivosController = new AniosLectivosController();

