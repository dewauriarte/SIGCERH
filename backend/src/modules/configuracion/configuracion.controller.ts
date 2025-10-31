/**
 * Controlador de configuración institucional
 */

import { Request, Response } from 'express';
import { configuracionService } from './configuracion.service';
import { fileUploadService } from '@shared/services/file-upload.service';
import { logger } from '@config/logger';
import { UpdateConfiguracionDTO } from './dtos';

export class ConfiguracionController {
  /**
   * GET /api/configuracion/institucion
   * Obtener la configuración institucional
   */
  async getInstitucion(_req: Request, res: Response): Promise<void> {
    try {
      const config = await configuracionService.getConfiguracion();

      res.status(200).json({
        success: true,
        message: 'Configuración institucional',
        data: config,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener configuración';
      logger.error('Error en getInstitucion:', error);
      res.status(404).json({
        success: false,
        message,
      });
    }
  }

  /**
   * PUT /api/configuracion/institucion
   * Actualizar la configuración institucional
   */
  async updateInstitucion(req: Request, res: Response): Promise<void> {
    try {
      // Body ya está validado por middleware
      const data = UpdateConfiguracionDTO.parse(req.body);

      const config = await configuracionService.updateConfiguracion(data);

      res.status(200).json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        data: config,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar configuración';
      logger.error('Error en updateInstitucion:', error);
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  /**
   * POST /api/configuracion/institucion/logo
   * Subir logo institucional
   */
  async uploadLogo(req: Request, res: Response): Promise<void> {
    try {
      // Verificar que se haya subido un archivo
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo',
        });
        return;
      }

      // Guardar logo
      const logoUrl = await fileUploadService.saveLogo(req.file);

      // Actualizar configuración con la nueva URL del logo
      const config = await configuracionService.updateLogo(logoUrl);

      res.status(200).json({
        success: true,
        message: 'Logo subido exitosamente',
        data: config,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al subir logo';
      logger.error('Error en uploadLogo:', error);
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
}

export const configuracionController = new ConfiguracionController();

