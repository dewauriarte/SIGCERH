/**
 * Controlador de Solicitudes
 * Endpoints organizados por rol según el flujo del sistema
 */

import { Request, Response } from 'express';
import { solicitudService } from './solicitud.service';
import { logger } from '@config/logger';
import {
  CreateSolicitudDTO,
  DerivarEditorDTO,
  ActaEncontradaDTO,
  ActaNoEncontradaDTO,
  ValidarPagoDTO,
  IniciarProcesamientoDTO,
  AprobarUGELDTO,
  ObservarUGELDTO,
  CorregirObservacionDTO,
  RegistrarSIAGECDTO,
  FirmarCertificadoDTO,
  MarcarEntregadoDTO,
  FiltrosSolicitudDTO,
} from './dtos';

export class SolicitudController {
  /**
   * ========================================
   * ENDPOINTS PÚBLICOS (sin autenticación)
   * ========================================
   */

  /**
   * POST /api/solicitudes/crear
   * Crear nueva solicitud (Usuario Público)
   */
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const data = CreateSolicitudDTO.parse(req.body);
      const usuarioId = (req as any).usuario?.id; // Opcional si está auth

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
    } catch (error: any) {
      logger.error('Error en crear solicitud:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear solicitud',
      });
    }
  }

  /**
   * GET /api/solicitudes/seguimiento/:codigo
   * Consultar estado de solicitud (Público)
   */
  async seguimiento(req: Request, res: Response): Promise<void> {
    try {
      const { codigo } = req.params;
      const solicitud = await solicitudService.findByCodigo(codigo!);

      res.status(200).json({
        success: true,
        message: 'Estado de solicitud consultado',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en seguimiento:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Código de seguimiento no encontrado',
      });
    }
  }

  /**
   * ========================================
   * MESA DE PARTES
   * ========================================
   */

  /**
   * GET /api/solicitudes/mesa-partes/pendientes-derivacion
   * Solicitudes pendientes de derivar a Editor
   */
  async pendientesDerivacion(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

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
    } catch (error: any) {
      logger.error('Error en pendientes derivación:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/solicitudes/:id/mesa-partes/derivar-editor
   * Derivar solicitud a Editor
   */
  async derivarEditor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const { editorId, observaciones } = DerivarEditorDTO.parse(req.body);

      const solicitud = await solicitudService.derivarAEditor(
        id!,
        usuarioId,
        editorId,
        observaciones
      );

      res.status(200).json({
        success: true,
        message: 'Solicitud derivada a Editor exitosamente',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en derivar editor:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/solicitudes/:id/mesa-partes/validar-pago-efectivo
   * Validar pago en efectivo manualmente
   */
  async validarPagoEfectivo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const data = ValidarPagoDTO.parse(req.body);

      const solicitud = await solicitudService.validarPago(id!, data, usuarioId);

      res.status(200).json({
        success: true,
        message: 'Pago validado exitosamente',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en validar pago efectivo:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/solicitudes/mesa-partes/listas-entrega
   * Certificados listos para entrega
   */
  async listasEntrega(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

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
    } catch (error: any) {
      logger.error('Error en listas entrega:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/solicitudes/:id/mesa-partes/marcar-entregado
   * Marcar certificado como entregado
   */
  async marcarEntregado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const data = MarcarEntregadoDTO.parse(req.body);

      const solicitud = await solicitudService.marcarEntregado(
        id!,
        usuarioId,
        data
      );

      res.status(200).json({
        success: true,
        message: 'Certificado marcado como entregado',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en marcar entregado:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * ========================================
   * EDITOR
   * ========================================
   */

  /**
   * GET /api/solicitudes/editor/asignadas-busqueda
   * Solicitudes asignadas al editor para búsqueda
   */
  async asignadasBusqueda(req: Request, res: Response): Promise<void> {
    try {
      const editorId = (req as any).usuario.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

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
    } catch (error: any) {
      logger.error('Error en asignadas búsqueda:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/solicitudes/:id/editor/iniciar-busqueda
   * Iniciar búsqueda de acta física
   */
  async iniciarBusqueda(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const { observaciones } = req.body;

      const solicitud = await solicitudService.iniciarBusqueda(
        id!,
        usuarioId,
        observaciones
      );

      res.status(200).json({
        success: true,
        message: 'Búsqueda de acta iniciada',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en iniciar búsqueda:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/solicitudes/:id/editor/acta-encontrada
   * Marcar acta como encontrada
   */
  async actaEncontrada(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const data = ActaEncontradaDTO.parse(req.body);

      const solicitud = await solicitudService.marcarActaEncontrada(
        id!,
        usuarioId,
        data
      );

      res.status(200).json({
        success: true,
        message: 'Acta marcada como encontrada. Usuario será notificado para pagar.',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en acta encontrada:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/solicitudes/:id/editor/acta-no-encontrada
   * Marcar acta como no encontrada
   */
  async actaNoEncontrada(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const data = ActaNoEncontradaDTO.parse(req.body);

      const solicitud = await solicitudService.marcarActaNoEncontrada(
        id!,
        usuarioId,
        data
      );

      res.status(200).json({
        success: true,
        message: 'Acta marcada como no encontrada. Usuario será notificado (sin cobro).',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en acta no encontrada:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/solicitudes/:id/editor/iniciar-procesamiento
   * Iniciar procesamiento con OCR
   */
  async iniciarProcesamiento(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const { actaId, observaciones } = IniciarProcesamientoDTO.parse(req.body);

      const solicitud = await solicitudService.iniciarProcesamiento(
        id!,
        usuarioId,
        actaId,
        observaciones
      );

      res.status(200).json({
        success: true,
        message: 'Procesamiento OCR iniciado',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en iniciar procesamiento:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/solicitudes/:id/editor/enviar-validacion-ugel
   * Enviar a validación de UGEL
   */
  async enviarValidacionUGEL(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const { observaciones } = req.body;

      const solicitud = await solicitudService.enviarAValidacionUGEL(
        id!,
        usuarioId,
        observaciones
      );

      res.status(200).json({
        success: true,
        message: 'Certificado enviado a validación de UGEL',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en enviar validación UGEL:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/solicitudes/:id/editor/corregir-observacion
   * Corregir observaciones de UGEL
   */
  async corregirObservacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const data = CorregirObservacionDTO.parse(req.body);

      const solicitud = await solicitudService.corregirObservacionUGEL(
        id!,
        usuarioId,
        data
      );

      res.status(200).json({
        success: true,
        message: 'Observaciones corregidas. Reenviado a UGEL.',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en corregir observación:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * ========================================
   * UGEL
   * ========================================
   */

  /**
   * GET /api/solicitudes/ugel/pendientes-validacion
   * Certificados pendientes de validación por UGEL
   */
  async pendientesValidacionUGEL(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

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
    } catch (error: any) {
      logger.error('Error en pendientes validación UGEL:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/solicitudes/:id/ugel/aprobar
   * Aprobar certificado
   */
  async aprobarUGEL(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const data = AprobarUGELDTO.parse(req.body);

      const solicitud = await solicitudService.aprobarUGEL(id!, usuarioId, data);

      res.status(200).json({
        success: true,
        message: 'Certificado aprobado por UGEL',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en aprobar UGEL:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/solicitudes/:id/ugel/observar
   * Observar certificado (requiere correcciones)
   */
  async observarUGEL(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const data = ObservarUGELDTO.parse(req.body);

      const solicitud = await solicitudService.observarUGEL(id!, usuarioId, data);

      res.status(200).json({
        success: true,
        message: 'Certificado observado. Devuelto a Editor para correcciones.',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en observar UGEL:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * ========================================
   * SIAGEC
   * ========================================
   */

  /**
   * GET /api/solicitudes/siagec/pendientes-registro
   * Certificados pendientes de registro en SIAGEC
   */
  async pendientesRegistroSIAGEC(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

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
    } catch (error: any) {
      logger.error('Error en pendientes registro SIAGEC:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/solicitudes/:id/siagec/registrar
   * Registrar certificado en SIAGEC y generar códigos
   */
  async registrarSIAGEC(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const data = RegistrarSIAGECDTO.parse(req.body);

      const solicitud = await solicitudService.registrarSIAGEC(
        id!,
        usuarioId,
        data
      );

      res.status(200).json({
        success: true,
        message: 'Certificado registrado en SIAGEC exitosamente',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en registrar SIAGEC:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * ========================================
   * DIRECCIÓN
   * ========================================
   */

  /**
   * GET /api/solicitudes/direccion/pendientes-firma
   * Certificados pendientes de firma
   */
  async pendientesFirma(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

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
    } catch (error: any) {
      logger.error('Error en pendientes firma:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/solicitudes/:id/direccion/firmar
   * Firmar certificado (digital o física)
   */
  async firmarCertificado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).usuario.id;
      const data = FirmarCertificadoDTO.parse(req.body);

      const solicitud = await solicitudService.firmarCertificado(
        id!,
        usuarioId,
        data
      );

      res.status(200).json({
        success: true,
        message: 'Certificado firmado exitosamente. Usuario será notificado.',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en firmar certificado:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * ========================================
   * ADMIN/REPORTES/GENERAL
   * ========================================
   */

  /**
   * GET /api/solicitudes
   * Listar solicitudes con filtros (todos los roles autenticados)
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const filtros = FiltrosSolicitudDTO.parse(req.query);
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '20');

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
    } catch (error: any) {
      logger.error('Error en listar solicitudes:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/solicitudes/:id
   * Obtener detalle completo de solicitud
   */
  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const solicitud = await solicitudService.findById(id!);

      res.status(200).json({
        success: true,
        message: 'Detalle de solicitud',
        data: solicitud,
      });
    } catch (error: any) {
      logger.error('Error en obtener solicitud:', error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/solicitudes/:id/historial
   * Obtener historial completo de transiciones
   */
  async obtenerHistorial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const historial = await solicitudService.getHistorial(id!);

      res.status(200).json({
        success: true,
        message: 'Historial de solicitud',
        data: historial,
      });
    } catch (error: any) {
      logger.error('Error en obtener historial:', error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/solicitudes/dashboard
   * Dashboard con estadísticas generales
   */
  async dashboard(_req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implementar estadísticas completas
      res.status(200).json({
        success: true,
        message: 'Dashboard de solicitudes',
        data: {
          totales: {},
          porEstado: {},
          ultimoMes: {},
        },
      });
    } catch (error: any) {
      logger.error('Error en dashboard:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export const solicitudController = new SolicitudController();

