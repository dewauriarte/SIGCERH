/**
 * Controlador de Actas Físicas
 * Maneja todas las peticiones HTTP relacionadas con actas
 */

import { Request, Response } from 'express';
import { actaFisicaService } from './actas-fisicas.service';
import { logger } from '@config/logger';
import {
  CreateActaFisicaDTO,
  UpdateActaFisicaDTO,
  FiltrosActaDTO,
  AsignarSolicitudDTO,
  CambiarEstadoActaDTO,
  ProcesarOCRDTO,
  ValidacionManualDTO,
  ValidacionConCorreccionesDTO,
} from './dtos';

export class ActasFisicasController {
  /**
   * POST /api/actas
   * Crear acta con archivo adjunto
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      // Validar que se subió un archivo
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'El archivo es requerido',
        });
        return;
      }

      // Validar datos del formulario
      const data = CreateActaFisicaDTO.parse(req.body);

      // Obtener usuario autenticado
      const usuarioId = (req as any).user.id;

      // Crear acta
      const acta = await actaFisicaService.create(data, req.file, usuarioId);

      res.status(201).json({
        success: true,
        message: 'Acta creada exitosamente',
        data: acta,
      });
    } catch (error: any) {
      logger.error('Error en create acta:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear acta',
      });
    }
  }

  /**
   * GET /api/actas
   * Listar actas con filtros y paginación
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      // Parsear filtros
      const filtros = FiltrosActaDTO.parse({
        estado: req.query.estado,
        anioLectivoId: req.query.anioLectivoId,
        gradoId: req.query.gradoId,
        procesado: req.query.procesado === 'true' ? true : undefined,
        fechaDesde: req.query.fechaDesde,
        fechaHasta: req.query.fechaHasta,
        solicitudId: req.query.solicitudId,
      });

      // Paginación
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '20');

      const resultado = await actaFisicaService.findAll(filtros, {
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        message: 'Lista de actas',
        data: resultado.actas,
        pagination: resultado.pagination,
      });
    } catch (error: any) {
      logger.error('Error en list actas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al listar actas',
      });
    }
  }

  /**
   * GET /api/actas/:id
   * Obtener acta por ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;
      const acta = await actaFisicaService.findById(id);

      res.status(200).json({
        success: true,
        message: 'Acta encontrada',
        data: acta,
      });
    } catch (error: any) {
      logger.error('Error en getById acta:', error);

      if (error.message === 'Acta no encontrada') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error al obtener acta',
      });
    }
  }

  /**
   * PUT /api/actas/:id/metadata
   * Actualizar metadata de acta
   */
  /**
   * PUT /api/actas/:id
   * Actualizar acta (método genérico)
   */
  async update(req: Request, res: Response): Promise<void> {
    return this.updateMetadata(req, res);
  }

  async updateMetadata(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;
      const data = UpdateActaFisicaDTO.parse(req.body);

      const acta = await actaFisicaService.update(id, data);

      res.status(200).json({
        success: true,
        message: 'Metadata de acta actualizada',
        data: acta,
      });
    } catch (error: any) {
      logger.error('Error en updateMetadata acta:', error);

      if (error.message === 'Acta no encontrada') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar acta',
      });
    }
  }

  /**
   * POST /api/actas/:id/asignar-solicitud
   * Asignar acta a una solicitud
   */
  async asignarSolicitud(req: Request, res: Response): Promise<void> {
    try {
      const actaId = req.params.id!;
      const { solicitudId } = AsignarSolicitudDTO.parse(req.body);

      const acta = await actaFisicaService.asignarSolicitud(
        actaId,
        solicitudId
      );

      res.status(200).json({
        success: true,
        message: 'Acta asignada a solicitud',
        data: acta,
      });
    } catch (error: any) {
      logger.error('Error en asignarSolicitud acta:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al asignar solicitud',
      });
    }
  }

  /**
   * POST /api/actas/:id/marcar-encontrada
   * Marcar acta como encontrada
   */
  async marcarEncontrada(req: Request, res: Response): Promise<void> {
    try {
      const actaId = req.params.id!;
      const { observaciones } = CambiarEstadoActaDTO.parse(req.body);

      const acta = await actaFisicaService.marcarEncontrada(
        actaId,
        observaciones
      );

      res.status(200).json({
        success: true,
        message: 'Acta marcada como encontrada',
        data: acta,
      });
    } catch (error: any) {
      logger.error('Error en marcarEncontrada acta:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al cambiar estado',
      });
    }
  }

  /**
   * POST /api/actas/:id/marcar-no-encontrada
   * Marcar acta como no encontrada
   */
  async marcarNoEncontrada(req: Request, res: Response): Promise<void> {
    try {
      const actaId = req.params.id!;
      const { observaciones } = CambiarEstadoActaDTO.parse(req.body);

      const acta = await actaFisicaService.marcarNoEncontrada(
        actaId,
        observaciones
      );

      res.status(200).json({
        success: true,
        message: 'Acta marcada como no encontrada',
        data: acta,
      });
    } catch (error: any) {
      logger.error('Error en marcarNoEncontrada acta:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al cambiar estado',
      });
    }
  }

  /**
   * ⭐ POST /api/actas/:id/procesar-ocr
   * CRÍTICO: Procesar datos de OCR y crear certificados
   */
  async procesarOCR(req: Request, res: Response): Promise<void> {
    try {
      const actaId = req.params.id!;
      const datos = ProcesarOCRDTO.parse(req.body);

      const resultado = await actaFisicaService.recibirDatosOCR(
        actaId,
        datos
      );

      res.status(200).json(resultado);
    } catch (error: any) {
      logger.error('Error en procesarOCR acta:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al procesar OCR',
      });
    }
  }

  /**
   * POST /api/actas/:id/validar-manual
   * Validar manualmente acta procesada
   */
  async validarManual(req: Request, res: Response): Promise<void> {
    try {
      const actaId = req.params.id!;
      const { observaciones, validado } = ValidacionManualDTO.parse(req.body);

      const acta = await actaFisicaService.validarManualmente(
        actaId,
        observaciones,
        validado
      );

      res.status(200).json({
        success: true,
        message: `Acta ${validado ? 'aprobada' : 'rechazada'} manualmente`,
        data: acta,
      });
    } catch (error: any) {
      logger.error('Error en validarManual acta:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al validar acta',
      });
    }
  }

  /**
   * GET /api/actas/:id/exportar-excel
   * Exportar acta a Excel
   */
  async exportarExcel(req: Request, res: Response): Promise<void> {
    try {
      const actaId = req.params.id!;
      const buffer = await actaFisicaService.exportarExcel(actaId);

      // Obtener acta para el nombre del archivo
      const acta = await actaFisicaService.findById(actaId);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ACTA_${acta.numero}_${Date.now()}.xlsx"`
      );

      res.send(buffer);
    } catch (error: any) {
      logger.error('Error en exportarExcel acta:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al exportar a Excel',
      });
    }
  }

  /**
   * GET /api/actas/:id/comparar-ocr
   * Comparar datos OCR con acta física (para validación visual)
   */
  async compararOCRconFisica(req: Request, res: Response): Promise<void> {
    try {
      const actaId = req.params.id!;
      const comparacion = await actaFisicaService.compararOCRconFisica(actaId);

      res.status(200).json({
        success: true,
        message: 'Comparación de datos OCR vs acta física',
        data: comparacion,
      });
    } catch (error: any) {
      logger.error('Error en compararOCRconFisica:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al comparar datos',
      });
    }
  }

  /**
   * POST /api/actas/:id/validar-con-correcciones
   * Validar acta aplicando correcciones a los datos
   */
  async validarConCorrecciones(req: Request, res: Response): Promise<void> {
    try {
      const actaId = req.params.id!;
      const { validado, observaciones, correcciones } =
        ValidacionConCorreccionesDTO.parse(req.body);

      const acta = await actaFisicaService.validarConCorrecciones(
        actaId,
        validado,
        observaciones,
        correcciones
      );

      res.status(200).json({
        success: true,
        message: `Acta ${validado ? 'aprobada' : 'rechazada'} con ${correcciones?.length || 0} correcciones aplicadas`,
        data: acta,
      });
    } catch (error: any) {
      logger.error('Error en validarConCorrecciones:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al validar con correcciones',
      });
    }
  }

  /**
   * GET /api/actas/estadisticas
   * Obtener estadísticas generales de actas
   * Útil para monitoreo y dashboards
   */
  async getEstadisticas(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await actaFisicaService.getEstadisticas();

      res.status(200).json({
        success: true,
        message: 'Estadísticas de actas',
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error en getEstadisticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
      });
    }
  }
}

export const actasFisicasController = new ActasFisicasController();

