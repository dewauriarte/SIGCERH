/**
 * Controlador de Estudiantes
 * Maneja las peticiones HTTP
 */

import { Request, Response } from 'express';
import { estudiantesService } from './estudiantes.service';
import { actasEstudianteService } from './actas.service';
import { logger } from '@config/logger';
import { CreateEstudianteDTO, UpdateEstudianteDTO, FiltrosEstudianteDTO } from './dtos';

export class EstudiantesController {
  /**
   * POST /api/estudiantes
   * Crear un nuevo estudiante
   */
  async create(req: Request, res: Response) {
    try {
      const data = CreateEstudianteDTO.parse(req.body);
      const estudiante = await estudiantesService.create(data);

      res.status(201).json({
        success: true,
        message: 'Estudiante creado exitosamente',
        data: estudiante,
      });
    } catch (error: any) {
      logger.error('Error en create estudiante:', error);

      if (error.message?.includes('Ya existe')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear estudiante',
      });
    }
  }

  /**
   * GET /api/estudiantes
   * Obtener lista de estudiantes con filtros
   */
  async list(req: Request, res: Response) {
    try {
      const filtros = FiltrosEstudianteDTO.parse({
        search: req.query.search,
        estado: req.query.estado,
        sexo: req.query.sexo,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      });

      const result = await estudiantesService.findAll(filtros, {
        page: filtros.page || 1,
        limit: filtros.limit || 20,
      });

      res.status(200).json({
        success: true,
        message: 'Estudiantes obtenidos correctamente',
        data: result.estudiantes,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Error en list estudiantes:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener estudiantes',
      });
    }
  }

  /**
   * GET /api/estudiantes/activos
   * Obtener estudiantes activos
   */
  async getActivos(req: Request, res: Response) {
    try {
      const estudiantes = await estudiantesService.getActivos();

      res.status(200).json({
        success: true,
        message: 'Estudiantes activos obtenidos',
        data: estudiantes,
      });
    } catch (error: any) {
      logger.error('Error en getActivos estudiantes:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener estudiantes activos',
      });
    }
  }

  /**
   * GET /api/estudiantes/:id
   * Obtener estudiante por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const estudiante = await estudiantesService.findById(id);

      res.status(200).json({
        success: true,
        message: 'Estudiante obtenido correctamente',
        data: estudiante,
      });
    } catch (error: any) {
      logger.error('Error en getById estudiante:', error);

      if (error.message === 'Estudiante no encontrado') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener estudiante',
      });
    }
  }

  /**
   * PUT /api/estudiantes/:id
   * Actualizar estudiante
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = UpdateEstudianteDTO.parse(req.body);

      const estudiante = await estudiantesService.update(id, data);

      res.status(200).json({
        success: true,
        message: 'Estudiante actualizado exitosamente',
        data: estudiante,
      });
    } catch (error: any) {
      logger.error('Error en update estudiante:', error);

      if (error.message === 'Estudiante no encontrado') {
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
        message: error.message || 'Error al actualizar estudiante',
      });
    }
  }

  /**
   * DELETE /api/estudiantes/:id
   * Eliminar estudiante
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await estudiantesService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Estudiante eliminado exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en delete estudiante:', error);

      if (error.message === 'Estudiante no encontrado') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al eliminar estudiante',
      });
    }
  }

  /**
   * PUT /api/estudiantes/:id/actualizar-dni
   * Actualizar DNI de estudiante (de temporal a real)
   */
  async actualizarDNI(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { dni, fusionarDuplicados = false } = req.body;

      if (!dni) {
        return res.status(400).json({
          success: false,
          message: 'DNI es requerido',
        });
      }

      await actasEstudianteService.actualizarDNI(id, dni, fusionarDuplicados);

      res.status(200).json({
        success: true,
        message: fusionarDuplicados 
          ? 'DNI actualizado y estudiantes fusionados exitosamente'
          : 'DNI actualizado exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en actualizarDNI:', error);

      if (error.message?.includes('ya está registrado')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar DNI',
      });
    }
  }

  /**
   * GET /api/estudiantes/:id/actas-certificado
   * Obtener todas las actas preparadas para generar certificado
   */
  async getActasParaCertificado(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const datos = await actasEstudianteService.obtenerActasParaCertificado(id);

      res.status(200).json({
        success: true,
        message: 'Actas obtenidas correctamente',
        data: datos,
      });
    } catch (error: any) {
      logger.error('Error en getActasParaCertificado:', error);

      if (error.message === 'Estudiante no encontrado') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener actas para certificado',
      });
    }
  }

  /**
   * GET /api/estudiantes/buscar-nombre
   * Buscar estudiantes por nombre completo
   */
  async buscarPorNombre(req: Request, res: Response) {
    try {
      const { apellidoPaterno, apellidoMaterno, nombres } = req.query;

      if (!apellidoPaterno || !apellidoMaterno || !nombres) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren apellidoPaterno, apellidoMaterno y nombres',
        });
      }

      const estudiantes = await actasEstudianteService.buscarPorNombre(
        apellidoPaterno as string,
        apellidoMaterno as string,
        nombres as string
      );

      res.status(200).json({
        success: true,
        message: `${estudiantes.length} estudiante(s) encontrado(s)`,
        data: estudiantes,
      });
    } catch (error: any) {
      logger.error('Error en buscarPorNombre:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al buscar estudiantes',
      });
    }
  }
}

export const estudiantesController = new EstudiantesController();
