/**
 * Controlador de Libros de Actas Físicas
 * Maneja todas las peticiones HTTP relacionadas con libros
 */

import { Request, Response } from 'express';
import { librosService } from './libros.service';
import { logger } from '@config/logger';
import {
  CreateLibroDTO,
  UpdateLibroDTO,
  FiltrosLibroDTO,
} from './dtos';

export class LibrosController {
  /**
   * POST /api/libros
   * Crear nuevo libro
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = CreateLibroDTO.parse(req.body);
      const institucionId = (req as any).user.institucionId;

      const libro = await librosService.create(data, institucionId);

      res.status(201).json({
        success: true,
        message: 'Libro creado exitosamente',
        data: libro,
      });
    } catch (error: any) {
      logger.error('Error en create libro:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear libro',
      });
    }
  }

  /**
   * GET /api/libros
   * Listar libros con filtros
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const filtros = FiltrosLibroDTO.parse({
        search: req.query.search,
        estado: req.query.estado,
        activo: req.query.activo,
      });

      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const result = await librosService.findAll(filtros, pagination);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      logger.error('Error en list libros:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al listar libros',
      });
    }
  }

  /**
   * GET /api/libros/activos
   * Obtener libros activos para dropdowns
   */
  async getActivos(req: Request, res: Response): Promise<void> {
    try {
      const institucionId = (req as any).user.institucionId;
      const libros = await librosService.getLibrosActivos(institucionId);

      res.json({
        success: true,
        data: libros,
      });
    } catch (error: any) {
      logger.error('Error en getActivos libros:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener libros activos',
      });
    }
  }

  /**
   * GET /api/libros/:id
   * Obtener un libro por ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const libro = await librosService.findById(id);

      res.json({
        success: true,
        data: libro,
      });
    } catch (error: any) {
      logger.error('Error en getById libro:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Libro no encontrado',
      });
    }
  }

  /**
   * PUT /api/libros/:id
   * Actualizar un libro
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = UpdateLibroDTO.parse(req.body);

      const libro = await librosService.update(id, data);

      res.json({
        success: true,
        message: 'Libro actualizado exitosamente',
        data: libro,
      });
    } catch (error: any) {
      logger.error('Error en update libro:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar libro',
      });
    }
  }

  /**
   * DELETE /api/libros/:id
   * Eliminar un libro (soft delete)
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await librosService.delete(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Error en delete libro:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al eliminar libro',
      });
    }
  }
}

export const librosController = new LibrosController();

