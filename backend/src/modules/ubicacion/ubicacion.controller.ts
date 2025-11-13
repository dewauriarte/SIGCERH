/**
 * Controlador de ubicación geográfica
 * Endpoints públicos para obtener departamentos, provincias y distritos
 */

import { Request, Response } from 'express';
import { ubicacionService } from './ubicacion.service';
import { logger } from '@config/logger';

export class UbicacionController {
  /**
   * GET /api/ubicacion/departamentos
   * Obtiene todos los departamentos
   */
  async getDepartamentos(_req: Request, res: Response): Promise<void> {
    try {
      const departamentos = await ubicacionService.getDepartamentos();
      
      res.status(200).json({
        success: true,
        data: departamentos,
      });
    } catch (error: any) {
      logger.error('Error en getDepartamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener departamentos',
      });
    }
  }

  /**
   * GET /api/ubicacion/provincias/:departamentoId
   * Obtiene provincias de un departamento
   */
  async getProvincias(req: Request, res: Response): Promise<void> {
    try {
      const { departamentoId } = req.params;
      
      if (!departamentoId || departamentoId.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'ID de departamento requerido',
        });
        return;
      }

      const provincias = await ubicacionService.getProvincias(departamentoId);
      
      res.status(200).json({
        success: true,
        data: provincias,
      });
    } catch (error: any) {
      logger.error('Error en getProvincias:', error);
      const statusCode = error.message.includes('inválido') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al obtener provincias',
      });
    }
  }

  /**
   * GET /api/ubicacion/distritos/:provinciaId
   * Obtiene distritos de una provincia
   */
  async getDistritos(req: Request, res: Response): Promise<void> {
    try {
      const { provinciaId } = req.params;
      
      if (!provinciaId || provinciaId.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'ID de provincia requerido',
        });
        return;
      }

      const distritos = await ubicacionService.getDistritos(provinciaId);
      
      res.status(200).json({
        success: true,
        data: distritos,
      });
    } catch (error: any) {
      logger.error('Error en getDistritos:', error);
      const statusCode = error.message.includes('inválido') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al obtener distritos',
      });
    }
  }
}

export const ubicacionController = new UbicacionController();
