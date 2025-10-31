import { actaFisicaService } from './actas-fisicas.service';
import { logger } from '@config/logger';
import { CreateActaFisicaDTO, UpdateActaFisicaDTO, FiltrosActaDTO, AsignarSolicitudDTO, CambiarEstadoActaDTO, ProcesarOCRDTO, ValidacionManualDTO, ValidacionConCorreccionesDTO, } from './dtos';
export class ActasFisicasController {
    async create(req, res) {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'El archivo es requerido',
                });
                return;
            }
            const data = CreateActaFisicaDTO.parse(req.body);
            const usuarioId = req.user.id;
            const acta = await actaFisicaService.create(data, req.file, usuarioId);
            res.status(201).json({
                success: true,
                message: 'Acta creada exitosamente',
                data: acta,
            });
        }
        catch (error) {
            logger.error('Error en create acta:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear acta',
            });
        }
    }
    async list(req, res) {
        try {
            const filtros = FiltrosActaDTO.parse({
                estado: req.query.estado,
                anioLectivoId: req.query.anioLectivoId,
                gradoId: req.query.gradoId,
                procesado: req.query.procesado === 'true' ? true : undefined,
                fechaDesde: req.query.fechaDesde,
                fechaHasta: req.query.fechaHasta,
                solicitudId: req.query.solicitudId,
            });
            const page = parseInt(req.query.page || '1');
            const limit = parseInt(req.query.limit || '20');
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
        }
        catch (error) {
            logger.error('Error en list actas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al listar actas',
            });
        }
    }
    async getById(req, res) {
        try {
            const id = req.params.id;
            const acta = await actaFisicaService.findById(id);
            res.status(200).json({
                success: true,
                message: 'Acta encontrada',
                data: acta,
            });
        }
        catch (error) {
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
    async updateMetadata(req, res) {
        try {
            const id = req.params.id;
            const data = UpdateActaFisicaDTO.parse(req.body);
            const acta = await actaFisicaService.update(id, data);
            res.status(200).json({
                success: true,
                message: 'Metadata de acta actualizada',
                data: acta,
            });
        }
        catch (error) {
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
    async asignarSolicitud(req, res) {
        try {
            const actaId = req.params.id;
            const { solicitudId } = AsignarSolicitudDTO.parse(req.body);
            const acta = await actaFisicaService.asignarSolicitud(actaId, solicitudId);
            res.status(200).json({
                success: true,
                message: 'Acta asignada a solicitud',
                data: acta,
            });
        }
        catch (error) {
            logger.error('Error en asignarSolicitud acta:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al asignar solicitud',
            });
        }
    }
    async marcarEncontrada(req, res) {
        try {
            const actaId = req.params.id;
            const { observaciones } = CambiarEstadoActaDTO.parse(req.body);
            const acta = await actaFisicaService.marcarEncontrada(actaId, observaciones);
            res.status(200).json({
                success: true,
                message: 'Acta marcada como encontrada',
                data: acta,
            });
        }
        catch (error) {
            logger.error('Error en marcarEncontrada acta:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al cambiar estado',
            });
        }
    }
    async marcarNoEncontrada(req, res) {
        try {
            const actaId = req.params.id;
            const { observaciones } = CambiarEstadoActaDTO.parse(req.body);
            const acta = await actaFisicaService.marcarNoEncontrada(actaId, observaciones);
            res.status(200).json({
                success: true,
                message: 'Acta marcada como no encontrada',
                data: acta,
            });
        }
        catch (error) {
            logger.error('Error en marcarNoEncontrada acta:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al cambiar estado',
            });
        }
    }
    async procesarOCR(req, res) {
        try {
            const actaId = req.params.id;
            const datos = ProcesarOCRDTO.parse(req.body);
            const resultado = await actaFisicaService.recibirDatosOCR(actaId, datos);
            res.status(200).json(resultado);
        }
        catch (error) {
            logger.error('Error en procesarOCR acta:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al procesar OCR',
            });
        }
    }
    async validarManual(req, res) {
        try {
            const actaId = req.params.id;
            const { observaciones, validado } = ValidacionManualDTO.parse(req.body);
            const acta = await actaFisicaService.validarManualmente(actaId, observaciones, validado);
            res.status(200).json({
                success: true,
                message: `Acta ${validado ? 'aprobada' : 'rechazada'} manualmente`,
                data: acta,
            });
        }
        catch (error) {
            logger.error('Error en validarManual acta:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al validar acta',
            });
        }
    }
    async exportarExcel(req, res) {
        try {
            const actaId = req.params.id;
            const buffer = await actaFisicaService.exportarExcel(actaId);
            const acta = await actaFisicaService.findById(actaId);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="ACTA_${acta.numero}_${Date.now()}.xlsx"`);
            res.send(buffer);
        }
        catch (error) {
            logger.error('Error en exportarExcel acta:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al exportar a Excel',
            });
        }
    }
    async compararOCRconFisica(req, res) {
        try {
            const actaId = req.params.id;
            const comparacion = await actaFisicaService.compararOCRconFisica(actaId);
            res.status(200).json({
                success: true,
                message: 'Comparación de datos OCR vs acta física',
                data: comparacion,
            });
        }
        catch (error) {
            logger.error('Error en compararOCRconFisica:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al comparar datos',
            });
        }
    }
    async validarConCorrecciones(req, res) {
        try {
            const actaId = req.params.id;
            const { validado, observaciones, correcciones } = ValidacionConCorreccionesDTO.parse(req.body);
            const acta = await actaFisicaService.validarConCorrecciones(actaId, validado, observaciones, correcciones);
            res.status(200).json({
                success: true,
                message: `Acta ${validado ? 'aprobada' : 'rechazada'} con ${correcciones?.length || 0} correcciones aplicadas`,
                data: acta,
            });
        }
        catch (error) {
            logger.error('Error en validarConCorrecciones:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al validar con correcciones',
            });
        }
    }
}
export const actasFisicasController = new ActasFisicasController();
//# sourceMappingURL=actas-fisicas.controller.js.map