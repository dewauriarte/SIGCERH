/**
 * Controller de Certificados
 * Maneja todas las operaciones sobre certificados (autenticadas)
 */

import { Request, Response } from 'express';
import { logger } from '@config/logger';
import { certificadoService } from './certificado.service';
import { pdfService } from './pdf.service';
import { firmaService } from './firma.service';
import type {
  GenerarPDFDTOType,
  AnularCertificadoDTOType,
  RectificarCertificadoDTOType,
  FiltrosCertificadoDTOType,
  MarcarFirmaManuscritaDTOType,
} from './dtos';

class CertificadoController {
  /**
   * POST /api/certificados/generar
   * Generar certificado completo desde actas de un estudiante
   * Incluye: certificado + detalles + notas + PDF
   */
  async generar(req: Request, res: Response): Promise<void> {
    try {
      const { estudianteId, observaciones, lugarEmision, generarPDF } = req.body;
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      if (!estudianteId) {
        res.status(400).json({
          success: false,
          message: 'El campo estudianteId es requerido',
        });
        return;
      }

      logger.info(`[API] Generando certificado para estudiante ${estudianteId}`);

      const resultado = await certificadoService.generarCertificadoCompleto(
        estudianteId,
        usuarioId,
        {
          observaciones,
          lugarEmision,
          generarPDF,
        }
      );

      res.status(201).json({
        success: true,
        message: 'Certificado generado exitosamente',
        data: resultado,
      });
    } catch (error: any) {
      logger.error(`Error al generar certificado: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al generar certificado',
      });
    }
  }

  /**
   * GET /api/certificados
   * Listar certificados con filtros y paginación
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const filtros = req.query as FiltrosCertificadoDTOType;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const resultado = await certificadoService.findAll(filtros, { page, limit });

      res.json({
        success: true,
        ...resultado,
      });
    } catch (error: any) {
      logger.error(`Error al listar certificados: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al listar certificados',
      });
    }
  }

  /**
   * GET /api/certificados/:id
   * Obtener un certificado por ID
   */
  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const certificado = await certificadoService.findById(id!);

      res.json({
        success: true,
        data: certificado,
      });
    } catch (error: any) {
      logger.error(`Error al obtener certificado: ${error.message}`);
      res.status(error.message.includes('no encontrado') ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al obtener certificado',
      });
    }
  }

  /**
   * POST /api/certificados/:id/generar-pdf
   * Generar PDF de un certificado existente
   */
  async generarPDF(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: GenerarPDFDTOType = req.body;

      const resultado = await pdfService.generarPDF(id!, data.regenerar);

      res.json({
        success: true,
        message: 'PDF generado exitosamente',
        data: resultado,
      });
    } catch (error: any) {
      logger.error(`Error al generar PDF: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al generar PDF',
      });
    }
  }

  /**
   * GET /api/certificados/:id/descargar
   * Descargar PDF del certificado
   */
  async descargar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const certificado = await certificadoService.findById(id!);

      if (!certificado.urlpdf) {
        res.status(404).json({
          success: false,
          message: 'El certificado no tiene PDF generado',
        });
        return;
      }

      // Construir ruta completa
      const filePath = certificado.urlpdf.replace('/storage/', '');
      const fullPath = require('path').join(process.cwd(), 'storage', filePath);

      // Verificar que el archivo existe
      if (!require('fs').existsSync(fullPath)) {
        res.status(404).json({
          success: false,
          message: 'Archivo no encontrado',
        });
        return;
      }

      // Enviar archivo
      res.download(fullPath, `Certificado_${certificado.codigovirtual}.pdf`, (err) => {
        if (err) {
          logger.error(`Error al descargar certificado: ${err.message}`);
          res.status(500).json({
            success: false,
            message: 'Error al descargar certificado',
          });
        }
      });
    } catch (error: any) {
      logger.error(`Error al descargar certificado: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al descargar certificado',
      });
    }
  }

  /**
   * POST /api/certificados/:id/firmar-digitalmente
   * Firmar digitalmente un certificado (preparado, no implementado)
   */
  async firmarDigitalmente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const resultado = await firmaService.firmarDigitalmente(
        id!,
        req.body.certificadoDigital,
        usuarioId
      );

      res.json({
        success: true,
        ...resultado,
      });
    } catch (error: any) {
      logger.error(`Error al firmar digitalmente: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al firmar digitalmente',
      });
    }
  }

  /**
   * POST /api/certificados/:id/marcar-firma-manuscrita
   * Marcar certificado para firma manuscrita
   */
  async marcarFirmaManuscrita(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;
      const data: MarcarFirmaManuscritaDTOType = req.body;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const resultado = await firmaService.marcarFirmaManuscrita(
        id!,
        usuarioId,
        data.observaciones
      );

      res.json({
        success: true,
        ...resultado,
      });
    } catch (error: any) {
      logger.error(`Error al marcar firma manuscrita: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al marcar firma manuscrita',
      });
    }
  }

  /**
   * POST /api/certificados/:id/subir-firmado
   * Subir certificado con firma manuscrita escaneada
   */
  async subirFirmado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;
      const file = req.file;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo',
        });
        return;
      }

      const resultado = await firmaService.subirCertificadoFirmado(id!, file, usuarioId);

      res.json({
        success: true,
        ...resultado,
      });
    } catch (error: any) {
      logger.error(`Error al subir certificado firmado: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al subir certificado firmado',
      });
    }
  }

  /**
   * GET /api/certificados/:id/estado-firma
   * Verificar estado de firma de un certificado
   */
  async estadoFirma(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const estado = await firmaService.verificarEstadoFirma(id!);

      res.json({
        success: true,
        data: estado,
      });
    } catch (error: any) {
      logger.error(`Error al verificar estado de firma: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al verificar estado de firma',
      });
    }
  }

  /**
   * POST /api/certificados/:id/anular
   * Anular un certificado
   */
  async anular(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;
      const data: AnularCertificadoDTOType = req.body;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const certificado = await certificadoService.anular(id!, data, usuarioId);

      res.json({
        success: true,
        message: 'Certificado anulado exitosamente',
        data: certificado,
      });
    } catch (error: any) {
      logger.error(`Error al anular certificado: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al anular certificado',
      });
    }
  }

  /**
   * POST /api/certificados/:id/rectificar
   * Rectificar un certificado (crear nueva versión y anular anterior)
   */
  async rectificar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id;
      const data: RectificarCertificadoDTOType = req.body;

      if (!usuarioId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const certificadoNuevo = await certificadoService.rectificar(id!, data, usuarioId);

      res.json({
        success: true,
        message: 'Certificado rectificado exitosamente',
        data: certificadoNuevo,
      });
    } catch (error: any) {
      logger.error(`Error al rectificar certificado: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al rectificar certificado',
      });
    }
  }
}

export const certificadoController = new CertificadoController();

