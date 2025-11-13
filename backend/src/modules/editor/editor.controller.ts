/**
 * Controlador del módulo Editor
 * Gestiona los endpoints HTTP para el rol Editor
 */

import { Request, Response } from 'express';
import { editorService } from './editor.service';
import { logger } from '@config/logger';
import {
  MarcarActaEncontradaDTO,
  MarcarActaNoEncontradaDTO,
  FiltrosExpedientesDTO,
} from './dtos';

export class EditorController {
  /**
   * GET /api/editor/expedientes
   * Obtener expedientes asignados al editor actual
   */
  async getExpedientesAsignados(req: Request, res: Response): Promise<void> {
    try {
      const editorId = (req as any).user?.id;

      if (!editorId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      // Validar y parsear filtros
      const filtros = FiltrosExpedientesDTO.parse(req.query);

      const resultado = await editorService.getExpedientesAsignados(editorId, filtros);

      logger.info(`Editor ${editorId} - Expedientes encontrados: ${resultado.data.length}`);
      logger.info(`Total: ${resultado.meta.total}, Página: ${resultado.meta.page}`);

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json({
        success: true,
        message: 'Expedientes obtenidos correctamente',
        data: resultado.data,
        meta: resultado.meta,
      });
    } catch (error: any) {
      logger.error('Error en getExpedientesAsignados:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener expedientes asignados',
      });
    }
  }

  /**
   * GET /api/editor/expedientes/pendientes-busqueda
   * Obtener expedientes pendientes de búsqueda (solo DERIVADO_A_EDITOR)
   */
  async getExpedientesPendientes(req: Request, res: Response): Promise<void> {
    try {
      const editorId = (req as any).user?.id;

      if (!editorId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const filtros = FiltrosExpedientesDTO.parse({
        ...req.query,
        estadoBusqueda: 'DERIVADO_A_EDITOR',
      });

      const resultado = await editorService.getExpedientesAsignados(editorId, filtros);

      res.json({
        success: true,
        message: 'Expedientes pendientes obtenidos correctamente',
        data: resultado.data,
        meta: resultado.meta,
      });
    } catch (error: any) {
      logger.error('Error en getExpedientesPendientes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener expedientes pendientes',
      });
    }
  }

  /**
   * GET /api/editor/estadisticas
   * Obtener estadísticas del editor
   */
  async getEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const editorId = (req as any).user?.id;

      if (!editorId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const estadisticas = await editorService.getEstadisticas(editorId);

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json({
        success: true,
        message: 'Estadísticas obtenidas correctamente',
        data: estadisticas,
      });
    } catch (error: any) {
      logger.error('Error en getEstadisticas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas',
      });
    }
  }

  /**
   * POST /api/editor/expedientes/:id/iniciar-busqueda
   * Iniciar búsqueda de acta física
   * Transición: DERIVADO_A_EDITOR → EN_BUSQUEDA
   */
  async iniciarBusqueda(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const editorId = (req as any).user?.id;

      if (!editorId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID de solicitud no proporcionado',
        });
        return;
      }

      const solicitud = await editorService.iniciarBusqueda(id, editorId);

      res.json({
        success: true,
        message: 'Búsqueda iniciada correctamente',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en iniciarBusqueda:', error);
      const status = error.message.includes('no está asignada') ? 403 : 400;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al iniciar búsqueda',
      });
    }
  }

  /**
   * POST /api/editor/expedientes/:id/acta-encontrada
   * Marcar acta como encontrada
   */
  async marcarActaEncontrada(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const editorId = (req as any).user?.id;

      if (!editorId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID de solicitud no proporcionado',
        });
        return;
      }

      // Validar datos de entrada
      const data = MarcarActaEncontradaDTO.parse(req.body);

      const solicitud = await editorService.marcarActaEncontrada(id, editorId, data);

      res.json({
        success: true,
        message: 'Acta marcada como encontrada. Se ha notificado al usuario para que realice el pago.',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en marcarActaEncontrada:', error);
      const status = error.message.includes('no está asignada') ? 403 : 400;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al marcar acta como encontrada',
      });
    }
  }

  /**
   * POST /api/editor/expedientes/:id/acta-no-encontrada
   * Marcar acta como NO encontrada
   */
  async marcarActaNoEncontrada(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const editorId = (req as any).user?.id;

      if (!editorId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID de solicitud no proporcionado',
        });
        return;
      }

      // Validar datos de entrada
      const data = MarcarActaNoEncontradaDTO.parse(req.body);

      const solicitud = await editorService.marcarActaNoEncontrada(id, editorId, data);

      res.json({
        success: true,
        message: 'Acta marcada como no encontrada. Se ha notificado al usuario (sin cobro).',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en marcarActaNoEncontrada:', error);
      const status = error.message.includes('no está asignada') ? 403 : 400;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al marcar acta como no encontrada',
      });
    }
  }

  /**
   * POST /api/editor/expedientes/:id/subir-acta
   * Subir acta física escaneada con metadatos
   */
  async subirActa(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const editorId = (req as any).user?.id;

      if (!editorId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      // TODO: Parsear datos de FormData cuando se implemente multer
      // Por ahora recibir JSON simple
      const data = req.body;

      const solicitud = await editorService.subirActa(id, editorId, data);

      res.json({
        success: true,
        message: 'Acta subida correctamente. Será procesada con OCR automáticamente.',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en subirActa:', error);
      const status = error.message.includes('no está asignada') ? 403 : 400;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al subir el acta',
      });
    }
  }
}

export const editorController = new EditorController();

