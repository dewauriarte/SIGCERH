/**
 * Controlador de Grados
 * Maneja las peticiones HTTP
 */

import { Request, Response } from 'express';
import { gradosService } from './grados.service';
import { logger } from '@config/logger';
import { CreateGradoDTO, UpdateGradoDTO, FiltrosGradoDTO } from './dtos';

export class GradosController {
  async create(req: Request, res: Response) {
    try {
      const data = CreateGradoDTO.parse(req.body);
      const grado = await gradosService.create(data);

      res.status(201).json({
        success: true,
        message: 'Grado creado exitosamente',
        data: grado,
      });
    } catch (error: any) {
      logger.error('Error en create grado:', error);

      if (error.message?.includes('Ya existe')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear grado',
      });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const filtros = FiltrosGradoDTO.parse({
        search: req.query.search,
        nivelId: req.query.nivelId,
        activo: req.query.activo,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      });

      const result = await gradosService.findAll(filtros, {
        page: filtros.page || 1,
        limit: filtros.limit || 20,
      });

      res.status(200).json({
        success: true,
        message: 'Grados obtenidos correctamente',
        data: result.grados,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Error en list grados:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener grados',
      });
    }
  }

  async getActivos(req: Request, res: Response) {
    try {
      const grados = await gradosService.getActivos();

      res.status(200).json({
        success: true,
        message: 'Grados activos obtenidos',
        data: grados,
      });
    } catch (error: any) {
      logger.error('Error en getActivos grados:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener grados activos',
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const grado = await gradosService.findById(id);

      res.status(200).json({
        success: true,
        message: 'Grado obtenido correctamente',
        data: grado,
      });
    } catch (error: any) {
      logger.error('Error en getById grado:', error);

      if (error.message === 'Grado no encontrado') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener grado',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = UpdateGradoDTO.parse(req.body);

      const grado = await gradosService.update(id, data);

      res.status(200).json({
        success: true,
        message: 'Grado actualizado exitosamente',
        data: grado,
      });
    } catch (error: any) {
      logger.error('Error en update grado:', error);

      if (error.message === 'Grado no encontrado') {
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
        message: error.message || 'Error al actualizar grado',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await gradosService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Grado eliminado exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en delete grado:', error);

      if (error.message === 'Grado no encontrado') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al eliminar grado',
      });
    }
  }
}

export const gradosController = new GradosController();

