/**
 * Controlador de Normalización de Actas Físicas
 * Endpoints para convertir JSON OCR → Datos estructurados en BD
 */

import { Request, Response } from 'express';
import { normalizacionService } from './normalizacion.service';
import { logger } from '@config/logger';

export class NormalizacionController {
  /**
   * POST /api/actas/:id/validar
   * Valida datos OCR antes de normalizar
   */
  async validarDatosOCR(req: Request, res: Response) {
    try {
      const { id } = req.params;

      logger.info(`[VALIDACIÓN] Iniciando validación de acta: ${id}`);

      const validacion = await normalizacionService.validarDatosOCR(id);

      return res.status(200).json({
        success: true,
        data: validacion,
      });
    } catch (error: any) {
      logger.error('[VALIDACIÓN] Error al validar datos OCR', {
        actaId: req.params.id,
        error: error.message,
        stack: error.stack,
      });

      return res.status(400).json({
        success: false,
        message: error.message || 'Error al validar datos OCR',
      });
    }
  }

  /**
   * POST /api/actas/:id/normalizar
   * Normaliza acta (JSON → BD)
   */
  async normalizarActa(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).user?.id;

      logger.info(`[NORMALIZACIÓN] Iniciando normalización de acta: ${id}`, {
        actaId: id,
        usuarioId,
      });

      const resultado = await normalizacionService.normalizarActa(id, usuarioId);

      if (resultado.success) {
        logger.info(`[NORMALIZACIÓN] Acta normalizada exitosamente: ${id}`, {
          actaId: id,
          estadisticas: resultado.estadisticas,
        });
      } else {
        logger.warn(`[NORMALIZACIÓN] Normalización parcial con errores: ${id}`, {
          actaId: id,
          errores: resultado.errores?.length || 0,
        });
      }

      return res.status(200).json({
        success: resultado.success,
        data: resultado,
      });
    } catch (error: any) {
      logger.error('[NORMALIZACIÓN] Error al normalizar acta', {
        actaId: req.params.id,
        usuarioId: (req as any).user?.id,
        error: error.message,
        stack: error.stack,
      });

      return res.status(400).json({
        success: false,
        message: error.message || 'Error al normalizar acta',
      });
    }
  }

  /**
   * GET /api/actas/estudiantes/:id/actas
   * Obtiene todas las actas de un estudiante
   */
  async getActasDeEstudiante(req: Request, res: Response) {
    try {
      const { id } = req.params;

      logger.info(`[CONSULTA] Obteniendo actas del estudiante: ${id}`);

      const actas = await normalizacionService.getActasDeEstudiante(id);

      return res.status(200).json({
        success: true,
        data: actas,
        count: actas.length,
      });
    } catch (error: any) {
      logger.error('[CONSULTA] Error al obtener actas del estudiante', {
        estudianteId: req.params.id,
        error: error.message,
        stack: error.stack,
      });

      return res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener actas del estudiante',
      });
    }
  }

  /**
   * GET /api/actas/estudiantes/:id/notas-consolidadas
   * Consolida notas para certificado
   */
  async consolidarNotasParaCertificado(req: Request, res: Response) {
    try {
      const { id } = req.params;

      logger.info(`[CONSOLIDACIÓN] Consolidando notas del estudiante: ${id}`);

      const consolidado = await normalizacionService.consolidarNotasParaCertificado(id);

      return res.status(200).json({
        success: true,
        data: consolidado,
      });
    } catch (error: any) {
      logger.error('[CONSOLIDACIÓN] Error al consolidar notas', {
        estudianteId: req.params.id,
        error: error.message,
        stack: error.stack,
      });

      return res.status(400).json({
        success: false,
        message: error.message || 'Error al consolidar notas para certificado',
      });
    }
  }
}

export const normalizacionController = new NormalizacionController();
