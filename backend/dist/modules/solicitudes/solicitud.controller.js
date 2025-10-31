import { solicitudService } from './solicitud.service';
import { logger } from '@config/logger';
import { CreateSolicitudDTO, DerivarEditorDTO, ActaEncontradaDTO, ActaNoEncontradaDTO, ValidarPagoDTO, IniciarProcesamientoDTO, AprobarUGELDTO, ObservarUGELDTO, CorregirObservacionDTO, RegistrarSIAGECDTO, FirmarCertificadoDTO, MarcarEntregadoDTO, FiltrosSolicitudDTO, } from './dtos';
export class SolicitudController {
    async crear(req, res) {
        try {
            const data = CreateSolicitudDTO.parse(req.body);
            const usuarioId = req.usuario?.id;
            const solicitud = await solicitudService.create(data, usuarioId);
            res.status(201).json({
                success: true,
                message: `Solicitud creada exitosamente. Código de seguimiento: ${solicitud.numeroseguimiento}`,
                data: {
                    id: solicitud.id,
                    numeroExpediente: solicitud.numeroexpediente,
                    numeroseguimiento: solicitud.numeroseguimiento,
                    estado: solicitud.estado,
                    fechasolicitud: solicitud.fechasolicitud,
                },
            });
        }
        catch (error) {
            logger.error('Error en crear solicitud:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al crear solicitud',
            });
        }
    }
    async seguimiento(req, res) {
        try {
            const { codigo } = req.params;
            const solicitud = await solicitudService.findByCodigo(codigo);
            res.status(200).json({
                success: true,
                message: 'Estado de solicitud consultado',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en seguimiento:', error);
            res.status(404).json({
                success: false,
                message: error.message || 'Código de seguimiento no encontrado',
            });
        }
    }
    async pendientesDerivacion(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const resultado = await solicitudService.getPendientesDerivacion({
                page,
                limit,
            });
            res.status(200).json({
                success: true,
                message: 'Solicitudes pendientes de derivación',
                data: resultado.data,
                meta: resultado.meta,
            });
        }
        catch (error) {
            logger.error('Error en pendientes derivación:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async derivarEditor(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const { editorId, observaciones } = DerivarEditorDTO.parse(req.body);
            const solicitud = await solicitudService.derivarAEditor(id, usuarioId, editorId, observaciones);
            res.status(200).json({
                success: true,
                message: 'Solicitud derivada a Editor exitosamente',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en derivar editor:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async validarPagoEfectivo(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const data = ValidarPagoDTO.parse(req.body);
            const solicitud = await solicitudService.validarPago(id, data, usuarioId);
            res.status(200).json({
                success: true,
                message: 'Pago validado exitosamente',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en validar pago efectivo:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async listasEntrega(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const resultado = await solicitudService.getListasEntrega({
                page,
                limit,
            });
            res.status(200).json({
                success: true,
                message: 'Certificados listos para entrega',
                data: resultado.data,
                meta: resultado.meta,
            });
        }
        catch (error) {
            logger.error('Error en listas entrega:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async marcarEntregado(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const data = MarcarEntregadoDTO.parse(req.body);
            const solicitud = await solicitudService.marcarEntregado(id, usuarioId, data);
            res.status(200).json({
                success: true,
                message: 'Certificado marcado como entregado',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en marcar entregado:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async asignadasBusqueda(req, res) {
        try {
            const editorId = req.usuario.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const resultado = await solicitudService.getAsignadasBusqueda(editorId, {
                page,
                limit,
            });
            res.status(200).json({
                success: true,
                message: 'Solicitudes asignadas para búsqueda',
                data: resultado.data,
                meta: resultado.meta,
            });
        }
        catch (error) {
            logger.error('Error en asignadas búsqueda:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async iniciarBusqueda(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const { observaciones } = req.body;
            const solicitud = await solicitudService.iniciarBusqueda(id, usuarioId, observaciones);
            res.status(200).json({
                success: true,
                message: 'Búsqueda de acta iniciada',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en iniciar búsqueda:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async actaEncontrada(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const data = ActaEncontradaDTO.parse(req.body);
            const solicitud = await solicitudService.marcarActaEncontrada(id, usuarioId, data);
            res.status(200).json({
                success: true,
                message: 'Acta marcada como encontrada. Usuario será notificado para pagar.',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en acta encontrada:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async actaNoEncontrada(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const data = ActaNoEncontradaDTO.parse(req.body);
            const solicitud = await solicitudService.marcarActaNoEncontrada(id, usuarioId, data);
            res.status(200).json({
                success: true,
                message: 'Acta marcada como no encontrada. Usuario será notificado (sin cobro).',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en acta no encontrada:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async iniciarProcesamiento(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const { actaId, observaciones } = IniciarProcesamientoDTO.parse(req.body);
            const solicitud = await solicitudService.iniciarProcesamiento(id, usuarioId, actaId, observaciones);
            res.status(200).json({
                success: true,
                message: 'Procesamiento OCR iniciado',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en iniciar procesamiento:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async enviarValidacionUGEL(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const { observaciones } = req.body;
            const solicitud = await solicitudService.enviarAValidacionUGEL(id, usuarioId, observaciones);
            res.status(200).json({
                success: true,
                message: 'Certificado enviado a validación de UGEL',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en enviar validación UGEL:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async corregirObservacion(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const data = CorregirObservacionDTO.parse(req.body);
            const solicitud = await solicitudService.corregirObservacionUGEL(id, usuarioId, data);
            res.status(200).json({
                success: true,
                message: 'Observaciones corregidas. Reenviado a UGEL.',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en corregir observación:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async pendientesValidacionUGEL(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const resultado = await solicitudService.getPendientesValidacionUGEL({
                page,
                limit,
            });
            res.status(200).json({
                success: true,
                message: 'Certificados pendientes de validación UGEL',
                data: resultado.data,
                meta: resultado.meta,
            });
        }
        catch (error) {
            logger.error('Error en pendientes validación UGEL:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async aprobarUGEL(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const data = AprobarUGELDTO.parse(req.body);
            const solicitud = await solicitudService.aprobarUGEL(id, usuarioId, data);
            res.status(200).json({
                success: true,
                message: 'Certificado aprobado por UGEL',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en aprobar UGEL:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async observarUGEL(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const data = ObservarUGELDTO.parse(req.body);
            const solicitud = await solicitudService.observarUGEL(id, usuarioId, data);
            res.status(200).json({
                success: true,
                message: 'Certificado observado. Devuelto a Editor para correcciones.',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en observar UGEL:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async pendientesRegistroSIAGEC(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const resultado = await solicitudService.getPendientesRegistroSIAGEC({
                page,
                limit,
            });
            res.status(200).json({
                success: true,
                message: 'Certificados pendientes de registro SIAGEC',
                data: resultado.data,
                meta: resultado.meta,
            });
        }
        catch (error) {
            logger.error('Error en pendientes registro SIAGEC:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async registrarSIAGEC(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const data = RegistrarSIAGECDTO.parse(req.body);
            const solicitud = await solicitudService.registrarSIAGEC(id, usuarioId, data);
            res.status(200).json({
                success: true,
                message: 'Certificado registrado en SIAGEC exitosamente',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en registrar SIAGEC:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async pendientesFirma(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const resultado = await solicitudService.getPendientesFirma({
                page,
                limit,
            });
            res.status(200).json({
                success: true,
                message: 'Certificados pendientes de firma',
                data: resultado.data,
                meta: resultado.meta,
            });
        }
        catch (error) {
            logger.error('Error en pendientes firma:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async firmarCertificado(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario.id;
            const data = FirmarCertificadoDTO.parse(req.body);
            const solicitud = await solicitudService.firmarCertificado(id, usuarioId, data);
            res.status(200).json({
                success: true,
                message: 'Certificado firmado exitosamente. Usuario será notificado.',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en firmar certificado:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async listar(req, res) {
        try {
            const filtros = FiltrosSolicitudDTO.parse(req.query);
            const page = parseInt(req.query.page || '1');
            const limit = parseInt(req.query.limit || '20');
            const resultado = await solicitudService.findAll(filtros, {
                page,
                limit,
            });
            res.status(200).json({
                success: true,
                message: 'Lista de solicitudes',
                data: resultado.data,
                meta: resultado.meta,
            });
        }
        catch (error) {
            logger.error('Error en listar solicitudes:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const solicitud = await solicitudService.findById(id);
            res.status(200).json({
                success: true,
                message: 'Detalle de solicitud',
                data: solicitud,
            });
        }
        catch (error) {
            logger.error('Error en obtener solicitud:', error);
            res.status(404).json({
                success: false,
                message: error.message,
            });
        }
    }
    async obtenerHistorial(req, res) {
        try {
            const { id } = req.params;
            const historial = await solicitudService.getHistorial(id);
            res.status(200).json({
                success: true,
                message: 'Historial de solicitud',
                data: historial,
            });
        }
        catch (error) {
            logger.error('Error en obtener historial:', error);
            res.status(404).json({
                success: false,
                message: error.message,
            });
        }
    }
    async dashboard(_req, res) {
        try {
            res.status(200).json({
                success: true,
                message: 'Dashboard de solicitudes',
                data: {
                    totales: {},
                    porEstado: {},
                    ultimoMes: {},
                },
            });
        }
        catch (error) {
            logger.error('Error en dashboard:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
}
export const solicitudController = new SolicitudController();
//# sourceMappingURL=solicitud.controller.js.map