/**
 * Controlador de currículo por grado
 */

import { Request, Response } from 'express';
import { curriculoGradoService } from './curriculo-grado.service';
import { logger } from '@config/logger';
import { z } from 'zod';

// Schema de validación para asignar áreas
const AssignAreasSchema = z.object({
  gradoId: z.string().uuid(),
  anioLectivoId: z.string().uuid(),
  areas: z.array(
    z.object({
      areaCurricularId: z.string().uuid(),
      orden: z.number().int().min(1),
    })
  ),
});

export class CurriculoController {
  /**
   * POST /api/academico/curriculo/asignar
   * Asignar áreas a un grado y año
   */
  async assignAreasToGrado(req: Request, res: Response): Promise<void> {
    try {
      const data = AssignAreasSchema.parse(req.body);
      const result = await curriculoGradoService.assignAreasToGrado(data);

      res.status(200).json({
        success: true,
        message: 'Áreas asignadas al grado exitosamente',
        data: result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al asignar áreas';
      logger.error('Error en assignAreasToGrado:', error);
      res.status(400).json({ success: false, message });
    }
  }

  /**
   * ⭐ ENDPOINT CRÍTICO PARA OCR ⭐
   * GET /api/academico/curriculo/plantilla?anio=1990&grado=5
   * Obtener plantilla de áreas para un grado y año específico
   */
  async getPlantilla(req: Request, res: Response): Promise<void> {
    try {
      const anio = req.query.anio ? parseInt(req.query.anio as string) : undefined;
      const numeroGrado = req.query.grado ? parseInt(req.query.grado as string) : undefined;

      if (!anio || !numeroGrado) {
        res.status(400).json({
          success: false,
          message: 'Se requieren los parámetros "anio" y "grado"',
        });
        return;
      }

      // Validar rango de año
      if (anio < 1985 || anio > 2012) {
        res.status(400).json({
          success: false,
          message: 'El año debe estar en el rango 1985-2012',
        });
        return;
      }

      // Validar rango de grado
      if (numeroGrado < 1 || numeroGrado > 7) {
        res.status(400).json({
          success: false,
          message: 'El grado debe estar en el rango 1-7',
        });
        return;
      }

      const plantilla = await curriculoGradoService.getPlantillaByAnioGrado(anio, numeroGrado);

      res.status(200).json({
        success: true,
        message: 'Plantilla de currículo',
        data: {
          anio,
          grado: numeroGrado,
          areas: plantilla,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener plantilla';
      logger.error('Error en getPlantilla:', error);

      if (message.includes('no encontrado')) {
        res.status(404).json({ success: false, message });
        return;
      }

      res.status(500).json({ success: false, message });
    }
  }

  /**
   * GET /api/academico/curriculo/grado/:gradoId
   * Obtener todas las asignaciones de un grado
   */
  async getByGrado(req: Request, res: Response): Promise<void> {
    try {
      const gradoId = req.params.gradoId!;
      const anioLectivoId = req.query.anioLectivoId as string | undefined;

      const asignaciones = await curriculoGradoService.getByGrado(gradoId, anioLectivoId);

      res.status(200).json({
        success: true,
        message: 'Asignaciones de currículo',
        data: asignaciones,
      });
    } catch (error: unknown) {
      logger.error('Error en getByGrado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener asignaciones',
      });
    }
  }

  /**
   * PATCH /api/academico/curriculo/:id/orden
   * Actualizar el orden de un área
   */
  async updateOrden(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;
      const { orden } = req.body;

      if (typeof orden !== 'number' || orden < 1) {
        res.status(400).json({
          success: false,
          message: 'El orden debe ser un número mayor a 0',
        });
        return;
      }

      await curriculoGradoService.updateOrden(id, orden);

      res.status(200).json({
        success: true,
        message: 'Orden actualizado exitosamente',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar orden';
      logger.error('Error en updateOrden:', error);

      if (message.includes('no encontrada')) {
        res.status(404).json({ success: false, message });
        return;
      }

      res.status(500).json({ success: false, message });
    }
  }

  /**
   * DELETE /api/academico/curriculo/:id
   * Remover un área del currículo
   */
  async removeArea(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!;
      await curriculoGradoService.removeArea(id);

      res.status(200).json({
        success: true,
        message: 'Área removida del currículo exitosamente',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al remover área';
      logger.error('Error en removeArea:', error);

      if (message.includes('no encontrada')) {
        res.status(404).json({ success: false, message });
        return;
      }

      res.status(500).json({ success: false, message });
    }
  }
}

export const curriculoController = new CurriculoController();

