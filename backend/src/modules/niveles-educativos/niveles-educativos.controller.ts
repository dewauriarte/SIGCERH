/**
 * Controlador de Niveles Educativos
 */

import { Request, Response } from 'express';
import { nivelesEducativosService } from './niveles-educativos.service';
import { logger } from '@config/logger';
import { CreateNivelEducativoDTO, UpdateNivelEducativoDTO, FiltrosNivelEducativoDTO } from './dtos';

export class NivelesEducativosController {
  async create(req: Request, res: Response) {
    try {
      const data = CreateNivelEducativoDTO.parse(req.body);
      const nivel = await nivelesEducativosService.create(data);

      res.status(201).json({
        success: true,
        message: 'Nivel educativo creado exitosamente',
        data: nivel,
      });
    } catch (error: any) {
      logger.error('Error en create nivel educativo:', error);

      if (error.message?.includes('Ya existe')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear nivel educativo',
      });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const filtros = FiltrosNivelEducativoDTO.parse({
        search: req.query.search,
        activo: req.query.activo,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      });

      const result = await nivelesEducativosService.findAll(filtros, {
        page: filtros.page || 1,
        limit: filtros.limit || 20,
      });

      res.status(200).json({
        success: true,
        message: 'Niveles educativos obtenidos correctamente',
        data: result.niveles,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Error en list niveles educativos:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener niveles educativos',
      });
    }
  }

  async getActivos(req: Request, res: Response) {
    try {
      const niveles = await nivelesEducativosService.getActivos();

      res.status(200).json({
        success: true,
        message: 'Niveles educativos activos obtenidos',
        data: niveles,
      });
    } catch (error: any) {
      logger.error('Error en getActivos niveles educativos:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener niveles educativos activos',
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const nivel = await nivelesEducativosService.findById(id);

      res.status(200).json({
        success: true,
        message: 'Nivel educativo obtenido correctamente',
        data: nivel,
      });
    } catch (error: any) {
      logger.error('Error en getById nivel educativo:', error);

      if (error.message === 'Nivel educativo no encontrado') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener nivel educativo',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = UpdateNivelEducativoDTO.parse(req.body);

      const nivel = await nivelesEducativosService.update(id, data);

      res.status(200).json({
        success: true,
        message: 'Nivel educativo actualizado exitosamente',
        data: nivel,
      });
    } catch (error: any) {
      logger.error('Error en update nivel educativo:', error);

      if (error.message === 'Nivel educativo no encontrado') {
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
        message: error.message || 'Error al actualizar nivel educativo',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await nivelesEducativosService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Nivel educativo eliminado exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en delete nivel educativo:', error);

      if (error.message === 'Nivel educativo no encontrado') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al eliminar nivel educativo',
      });
    }
  }
}

export const nivelesEducativosController = new NivelesEducativosController();

