/**
 * Controlador de Reportes de Pagos
 * Maneja endpoints de reportes y exportación
 */

import { Request, Response } from 'express';
import { reporteService } from './reporte.service';
import { logger } from '@config/logger';

export class ReporteController {
  /**
   * GET /api/pagos/reportes/periodo
   * Reporte de pagos por período
   */
  async reportePorPeriodo(req: Request, res: Response): Promise<void> {
    try {
      const fechaDesde = req.query.fechaDesde
        ? new Date(req.query.fechaDesde as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const fechaHasta = req.query.fechaHasta
        ? new Date(req.query.fechaHasta as string)
        : new Date();

      const reporte = await reporteService.reportePorPeriodo(fechaDesde, fechaHasta);

      res.status(200).json({
        success: true,
        message: 'Reporte generado exitosamente',
        data: reporte,
      });
    } catch (error: any) {
      logger.error('Error en reportePorPeriodo:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al generar reporte',
      });
    }
  }

  /**
   * GET /api/pagos/reportes/metodo
   * Reporte de pagos por método de pago
   */
  async reportePorMetodo(req: Request, res: Response): Promise<void> {
    try {
      const filtros: any = {};

      if (req.query.fechaDesde) {
        filtros.fechaDesde = new Date(req.query.fechaDesde as string);
      }
      if (req.query.fechaHasta) {
        filtros.fechaHasta = new Date(req.query.fechaHasta as string);
      }
      if (req.query.estado) {
        filtros.estado = req.query.estado;
      }
      if (req.query.conciliado !== undefined) {
        filtros.conciliado = req.query.conciliado === 'true';
      }

      const reporte = await reporteService.reportePorMetodoPago(filtros);

      res.status(200).json({
        success: true,
        message: 'Reporte generado exitosamente',
        data: reporte,
      });
    } catch (error: any) {
      logger.error('Error en reportePorMetodo:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al generar reporte',
      });
    }
  }

  /**
   * GET /api/pagos/reportes/pendientes
   * Reporte de pagos pendientes de validación
   */
  async reportePendientes(_req: Request, res: Response): Promise<void> {
    try {
      const reporte = await reporteService.reportePendientesValidacion();

      res.status(200).json({
        success: true,
        message: 'Reporte generado exitosamente',
        data: reporte,
      });
    } catch (error: any) {
      logger.error('Error en reportePendientes:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al generar reporte',
      });
    }
  }

  /**
   * GET /api/pagos/reportes/noconciliados
   * Reporte de pagos no conciliados
   */
  async reporteNoConciliados(req: Request, res: Response): Promise<void> {
    try {
      const filtros: any = {};

      if (req.query.fechaDesde) {
        filtros.fechaDesde = new Date(req.query.fechaDesde as string);
      }
      if (req.query.fechaHasta) {
        filtros.fechaHasta = new Date(req.query.fechaHasta as string);
      }
      if (req.query.metodopago) {
        filtros.metodopago = req.query.metodopago;
      }

      const reporte = await reporteService.reporteNoConciliados(filtros);

      res.status(200).json({
        success: true,
        message: 'Reporte generado exitosamente',
        data: reporte,
      });
    } catch (error: any) {
      logger.error('Error en reporteNoConciliados:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al generar reporte',
      });
    }
  }

  /**
   * GET /api/pagos/reportes/exportar
   * Exportar reporte a Excel
   */
  async exportarExcel(req: Request, res: Response): Promise<void> {
    try {
      const tipo = (req.query.tipo as string) || 'periodo';

      if (!['periodo', 'metodo', 'pendientes', 'noconciliados'].includes(tipo)) {
        res.status(400).json({
          success: false,
          message: 'Tipo de reporte no válido',
        });
        return;
      }

      const filtros: any = {};

      if (req.query.fechaDesde) {
        filtros.fechaDesde = new Date(req.query.fechaDesde as string);
      } else {
        // Por defecto: primer día del mes actual
        filtros.fechaDesde = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      }

      if (req.query.fechaHasta) {
        filtros.fechaHasta = new Date(req.query.fechaHasta as string);
      } else {
        // Por defecto: día actual
        filtros.fechaHasta = new Date();
      }

      if (req.query.estado) {
        filtros.estado = req.query.estado;
      }
      if (req.query.metodopago) {
        filtros.metodopago = req.query.metodopago;
      }
      if (req.query.conciliado !== undefined) {
        filtros.conciliado = req.query.conciliado === 'true';
      }

      const workbook = await reporteService.exportarExcel(
        tipo as 'periodo' | 'metodo' | 'pendientes' | 'noconciliados',
        filtros
      );

      // Generar nombre de archivo
      const fecha = new Date().toISOString().split('T')[0];
      const filename = `Reporte_Pagos_${tipo}_${fecha}.xlsx`;

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Escribir workbook al response
      await workbook.xlsx.write(res);

      res.end();

      logger.info(`Reporte Excel ${tipo} generado y descargado: ${filename}`);
    } catch (error: any) {
      logger.error('Error en exportarExcel:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al exportar reporte',
      });
    }
  }
}

export const reporteController = new ReporteController();

