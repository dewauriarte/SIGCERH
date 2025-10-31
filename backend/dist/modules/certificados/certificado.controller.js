import { logger } from '@config/logger';
import { certificadoService } from './certificado.service';
import { pdfService } from './pdf.service';
import { firmaService } from './firma.service';
class CertificadoController {
    async listar(req, res) {
        try {
            const filtros = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const resultado = await certificadoService.findAll(filtros, { page, limit });
            res.json({
                success: true,
                ...resultado,
            });
        }
        catch (error) {
            logger.error(`Error al listar certificados: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al listar certificados',
            });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const certificado = await certificadoService.findById(id);
            res.json({
                success: true,
                data: certificado,
            });
        }
        catch (error) {
            logger.error(`Error al obtener certificado: ${error.message}`);
            res.status(error.message.includes('no encontrado') ? 404 : 500).json({
                success: false,
                message: error.message || 'Error al obtener certificado',
            });
        }
    }
    async generarPDF(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const resultado = await pdfService.generarPDF(id, data.regenerar);
            res.json({
                success: true,
                message: 'PDF generado exitosamente',
                data: resultado,
            });
        }
        catch (error) {
            logger.error(`Error al generar PDF: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al generar PDF',
            });
        }
    }
    async descargar(req, res) {
        try {
            const { id } = req.params;
            const certificado = await certificadoService.findById(id);
            if (!certificado.urlpdf) {
                res.status(404).json({
                    success: false,
                    message: 'El certificado no tiene PDF generado',
                });
                return;
            }
            const filePath = certificado.urlpdf.replace('/storage/', '');
            const fullPath = require('path').join(process.cwd(), 'storage', filePath);
            if (!require('fs').existsSync(fullPath)) {
                res.status(404).json({
                    success: false,
                    message: 'Archivo no encontrado',
                });
                return;
            }
            res.download(fullPath, `Certificado_${certificado.codigovirtual}.pdf`, (err) => {
                if (err) {
                    logger.error(`Error al descargar certificado: ${err.message}`);
                    res.status(500).json({
                        success: false,
                        message: 'Error al descargar certificado',
                    });
                }
            });
        }
        catch (error) {
            logger.error(`Error al descargar certificado: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al descargar certificado',
            });
        }
    }
    async firmarDigitalmente(req, res) {
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
            const resultado = await firmaService.firmarDigitalmente(id, req.body.certificadoDigital, usuarioId);
            res.json({
                success: true,
                ...resultado,
            });
        }
        catch (error) {
            logger.error(`Error al firmar digitalmente: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al firmar digitalmente',
            });
        }
    }
    async marcarFirmaManuscrita(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.user?.id;
            const data = req.body;
            if (!usuarioId) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const resultado = await firmaService.marcarFirmaManuscrita(id, usuarioId, data.observaciones);
            res.json({
                success: true,
                ...resultado,
            });
        }
        catch (error) {
            logger.error(`Error al marcar firma manuscrita: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al marcar firma manuscrita',
            });
        }
    }
    async subirFirmado(req, res) {
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
            const resultado = await firmaService.subirCertificadoFirmado(id, file, usuarioId);
            res.json({
                success: true,
                ...resultado,
            });
        }
        catch (error) {
            logger.error(`Error al subir certificado firmado: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al subir certificado firmado',
            });
        }
    }
    async estadoFirma(req, res) {
        try {
            const { id } = req.params;
            const estado = await firmaService.verificarEstadoFirma(id);
            res.json({
                success: true,
                data: estado,
            });
        }
        catch (error) {
            logger.error(`Error al verificar estado de firma: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al verificar estado de firma',
            });
        }
    }
    async anular(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.user?.id;
            const data = req.body;
            if (!usuarioId) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const certificado = await certificadoService.anular(id, data, usuarioId);
            res.json({
                success: true,
                message: 'Certificado anulado exitosamente',
                data: certificado,
            });
        }
        catch (error) {
            logger.error(`Error al anular certificado: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al anular certificado',
            });
        }
    }
    async rectificar(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.user?.id;
            const data = req.body;
            if (!usuarioId) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const certificadoNuevo = await certificadoService.rectificar(id, data, usuarioId);
            res.json({
                success: true,
                message: 'Certificado rectificado exitosamente',
                data: certificadoNuevo,
            });
        }
        catch (error) {
            logger.error(`Error al rectificar certificado: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al rectificar certificado',
            });
        }
    }
}
export const certificadoController = new CertificadoController();
//# sourceMappingURL=certificado.controller.js.map