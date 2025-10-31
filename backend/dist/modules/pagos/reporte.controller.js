import { reporteService } from './reporte.service';
import { logger } from '@config/logger';
export class ReporteController {
    async reportePorPeriodo(req, res) {
        try {
            const fechaDesde = req.query.fechaDesde
                ? new Date(req.query.fechaDesde)
                : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const fechaHasta = req.query.fechaHasta
                ? new Date(req.query.fechaHasta)
                : new Date();
            const reporte = await reporteService.reportePorPeriodo(fechaDesde, fechaHasta);
            res.status(200).json({
                success: true,
                message: 'Reporte generado exitosamente',
                data: reporte,
            });
        }
        catch (error) {
            logger.error('Error en reportePorPeriodo:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al generar reporte',
            });
        }
    }
    async reportePorMetodo(req, res) {
        try {
            const filtros = {};
            if (req.query.fechaDesde) {
                filtros.fechaDesde = new Date(req.query.fechaDesde);
            }
            if (req.query.fechaHasta) {
                filtros.fechaHasta = new Date(req.query.fechaHasta);
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
        }
        catch (error) {
            logger.error('Error en reportePorMetodo:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al generar reporte',
            });
        }
    }
    async reportePendientes(_req, res) {
        try {
            const reporte = await reporteService.reportePendientesValidacion();
            res.status(200).json({
                success: true,
                message: 'Reporte generado exitosamente',
                data: reporte,
            });
        }
        catch (error) {
            logger.error('Error en reportePendientes:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al generar reporte',
            });
        }
    }
    async reporteNoConciliados(req, res) {
        try {
            const filtros = {};
            if (req.query.fechaDesde) {
                filtros.fechaDesde = new Date(req.query.fechaDesde);
            }
            if (req.query.fechaHasta) {
                filtros.fechaHasta = new Date(req.query.fechaHasta);
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
        }
        catch (error) {
            logger.error('Error en reporteNoConciliados:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al generar reporte',
            });
        }
    }
    async exportarExcel(req, res) {
        try {
            const tipo = req.query.tipo || 'periodo';
            if (!['periodo', 'metodo', 'pendientes', 'noconciliados'].includes(tipo)) {
                res.status(400).json({
                    success: false,
                    message: 'Tipo de reporte no válido',
                });
                return;
            }
            const filtros = {};
            if (req.query.fechaDesde) {
                filtros.fechaDesde = new Date(req.query.fechaDesde);
            }
            else {
                filtros.fechaDesde = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            }
            if (req.query.fechaHasta) {
                filtros.fechaHasta = new Date(req.query.fechaHasta);
            }
            else {
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
            const workbook = await reporteService.exportarExcel(tipo, filtros);
            const fecha = new Date().toISOString().split('T')[0];
            const filename = `Reporte_Pagos_${tipo}_${fecha}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            await workbook.xlsx.write(res);
            res.end();
            logger.info(`Reporte Excel ${tipo} generado y descargado: ${filename}`);
        }
        catch (error) {
            logger.error('Error en exportarExcel:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al exportar reporte',
            });
        }
    }
}
export const reporteController = new ReporteController();
//# sourceMappingURL=reporte.controller.js.map