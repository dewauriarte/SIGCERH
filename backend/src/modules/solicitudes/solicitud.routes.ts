/**
 * Rutas de Solicitudes
 * Organizadas por rol con middlewares de autenticación y autorización
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';
import { auditarAccion } from '@middleware/audit.middleware';
import { solicitudController } from './solicitud.controller';
import { validate, validateQuery } from './dtos';
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

const router = Router();

/**
 * ========================================
 * RUTAS PÚBLICAS (sin autenticación)
 * ========================================
 */

/**
 * POST /api/solicitudes/crear
 * Crear nueva solicitud (Usuario Público)
 */
router.post(
  '/crear',
  validate(CreateSolicitudDTO),
  solicitudController.crear.bind(solicitudController)
);

/**
 * GET /api/solicitudes/seguimiento/:codigo
 * Consultar estado de solicitud (Público)
 */
router.get(
  '/seguimiento/:codigo',
  solicitudController.seguimiento.bind(solicitudController)
);

/**
 * ========================================
 * RUTAS AUTENTICADAS
 * Todas las rutas a partir de aquí requieren autenticación
 * ========================================
 */
router.use(authenticate);

/**
 * ========================================
 * MESA DE PARTES
 * ========================================
 */

/**
 * GET /api/solicitudes/mesa-partes/pendientes-derivacion
 * Solicitudes pendientes de derivar a Editor
 * Permiso: MESA_DE_PARTES
 */
router.get(
  '/mesa-partes/pendientes-derivacion',
  requirePermission(['SOLICITUDES_VER', 'MESA_DE_PARTES']),
  solicitudController.pendientesDerivacion.bind(solicitudController)
);

/**
 * POST /api/solicitudes/:id/mesa-partes/derivar-editor
 * Derivar solicitud a Editor
 * Permiso: MESA_DE_PARTES
 */
router.post(
  '/:id/mesa-partes/derivar-editor',
  requirePermission(['SOLICITUDES_DERIVAR', 'MESA_DE_PARTES']),
  validate(DerivarEditorDTO),
  auditarAccion('solicitud', (req) => req.params.id!),
  solicitudController.derivarEditor.bind(solicitudController)
);

/**
 * POST /api/solicitudes/:id/mesa-partes/validar-pago-efectivo
 * Validar pago en efectivo manualmente
 * Permiso: MESA_DE_PARTES
 */
router.post(
  '/:id/mesa-partes/validar-pago-efectivo',
  requirePermission(['SOLICITUDES_VALIDAR_PAGO', 'MESA_DE_PARTES']),
  validate(ValidarPagoDTO),
  auditarAccion('solicitud', (req) => req.params.id!),
  solicitudController.validarPagoEfectivo.bind(solicitudController)
);

/**
 * GET /api/solicitudes/mesa-partes/listas-entrega
 * Certificados listos para entrega
 * Permiso: MESA_DE_PARTES
 */
router.get(
  '/mesa-partes/listas-entrega',
  requirePermission(['SOLICITUDES_VER', 'MESA_DE_PARTES']),
  solicitudController.listasEntrega.bind(solicitudController)
);

/**
 * POST /api/solicitudes/:id/mesa-partes/marcar-entregado
 * Marcar certificado como entregado
 * Permiso: MESA_DE_PARTES
 */
router.post(
  '/:id/mesa-partes/marcar-entregado',
  requirePermission(['SOLICITUDES_ENTREGAR', 'MESA_DE_PARTES']),
  validate(MarcarEntregadoDTO),
  auditarAccion('solicitud', (req) => req.params.id!),
  solicitudController.marcarEntregado.bind(solicitudController)
);

/**
 * ========================================
 * EDITOR
 * ========================================
 */

/**
 * GET /api/solicitudes/editor/asignadas-busqueda
 * Solicitudes asignadas al editor para búsqueda
 * Permiso: EDITOR
 */
router.get(
  '/editor/asignadas-busqueda',
  requirePermission(['SOLICITUDES_VER', 'EDITOR']),
  solicitudController.asignadasBusqueda.bind(solicitudController)
);

/**
 * POST /api/solicitudes/:id/editor/iniciar-busqueda
 * Iniciar búsqueda de acta física
 * Permiso: EDITOR
 */
router.post(
  '/:id/editor/iniciar-busqueda',
  requirePermission(['SOLICITUDES_BUSCAR', 'EDITOR']),
  auditarAccion('solicitud', (req) => req.params.id!),
  solicitudController.iniciarBusqueda.bind(solicitudController)
);

/**
 * POST /api/solicitudes/:id/editor/acta-encontrada
 * Marcar acta como encontrada
 * Permiso: EDITOR
 */
router.post(
  '/:id/editor/acta-encontrada',
  requirePermission(['SOLICITUDES_GESTIONAR', 'EDITOR']),
  validate(ActaEncontradaDTO),
  auditarAccion('solicitud', (req) => req.params.id!),
  solicitudController.actaEncontrada.bind(solicitudController)
);

/**
 * POST /api/solicitudes/:id/editor/acta-no-encontrada
 * Marcar acta como no encontrada
 * Permiso: EDITOR
 */
router.post(
  '/:id/editor/acta-no-encontrada',
  requirePermission(['SOLICITUDES_GESTIONAR', 'EDITOR']),
  validate(ActaNoEncontradaDTO),
  auditarAccion('solicitud', (req) => req.params.id!),
  solicitudController.actaNoEncontrada.bind(solicitudController)
);

/**
 * POST /api/solicitudes/:id/editor/iniciar-procesamiento
 * Iniciar procesamiento con OCR
 * Permiso: EDITOR
 */
router.post(
  '/:id/editor/iniciar-procesamiento',
  requirePermission(['SOLICITUDES_PROCESAR', 'EDITOR']),
  validate(IniciarProcesamientoDTO),
  auditarAccion('solicitud', (req) => req.params.id!),
  solicitudController.iniciarProcesamiento.bind(solicitudController)
);

/**
 * POST /api/solicitudes/:id/editor/enviar-validacion-ugel
 * Enviar a validación de UGEL
 * Permiso: EDITOR
 */
router.post(
  '/:id/editor/enviar-validacion-ugel',
  requirePermission(['SOLICITUDES_GESTIONAR', 'EDITOR']),
  auditarAccion('solicitud', (req) => req.params.id!),
  solicitudController.enviarValidacionUGEL.bind(solicitudController)
);

/**
 * POST /api/solicitudes/:id/editor/corregir-observacion
 * Corregir observaciones de UGEL
 * Permiso: EDITOR
 */
router.post(
  '/:id/editor/corregir-observacion',
  requirePermission(['SOLICITUDES_GESTIONAR', 'EDITOR']),
  validate(CorregirObservacionDTO),
  auditarAccion('solicitud', (req) => req.params.id!),
  solicitudController.corregirObservacion.bind(solicitudController)
);

/**
 * ========================================
 * UGEL
 * ========================================
 */

/**
 * GET /api/solicitudes/ugel/pendientes-validacion
 * Certificados pendientes de validación por UGEL
 * Permiso: UGEL
 */
router.get(
  '/ugel/pendientes-validacion',
  requirePermission(['SOLICITUDES_VER', 'UGEL']),
  solicitudController.pendientesValidacionUGEL.bind(solicitudController)
);

/**
 * POST /api/solicitudes/:id/ugel/aprobar
 * Aprobar certificado
 * Permiso: UGEL
 */
router.post(
  '/:id/ugel/aprobar',
  requirePermission(['SOLICITUDES_VALIDAR', 'UGEL']),
  validate(AprobarUGELDTO),
  auditarAccion('solicitud', (req) => req.params.id!),
  solicitudController.aprobarUGEL.bind(solicitudController)
);

/**
 * POST /api/solicitudes/:id/ugel/observar
 * Observar certificado (requiere correcciones)
 * Permiso: UGEL
 */
router.post(
  '/:id/ugel/observar',
  requirePermission(['SOLICITUDES_VALIDAR', 'UGEL']),
  validate(ObservarUGELDTO),
  auditarAccion('solicitud', (req) => req.params.id!),
  solicitudController.observarUGEL.bind(solicitudController)
);

/**
 * ========================================
 * SIAGEC
 * ========================================
 */

/**
 * GET /api/solicitudes/siagec/pendientes-registro
 * Certificados pendientes de registro en SIAGEC
 * Permiso: SIAGEC
 */
router.get(
  '/siagec/pendientes-registro',
  requirePermission(['SOLICITUDES_VER', 'SIAGEC']),
  solicitudController.pendientesRegistroSIAGEC.bind(solicitudController)
);

/**
 * POST /api/solicitudes/:id/siagec/registrar
 * Registrar certificado en SIAGEC y generar códigos
 * Permiso: SIAGEC
 */
router.post(
  '/:id/siagec/registrar',
  requirePermission(['SOLICITUDES_REGISTRAR', 'SIAGEC']),
  validate(RegistrarSIAGECDTO),
  auditarAccion('solicitud', (req) => req.params.id!),
  solicitudController.registrarSIAGEC.bind(solicitudController)
);

/**
 * ========================================
 * DIRECCIÓN
 * ========================================
 */

/**
 * GET /api/solicitudes/direccion/pendientes-firma
 * Certificados pendientes de firma
 * Permiso: DIRECCION
 */
router.get(
  '/direccion/pendientes-firma',
  requirePermission(['SOLICITUDES_VER', 'DIRECCION']),
  solicitudController.pendientesFirma.bind(solicitudController)
);

/**
 * POST /api/solicitudes/:id/direccion/firmar
 * Firmar certificado (digital o física)
 * Permiso: DIRECCION
 */
router.post(
  '/:id/direccion/firmar',
  requirePermission(['SOLICITUDES_FIRMAR', 'DIRECCION']),
  validate(FirmarCertificadoDTO),
  auditarAccion('solicitud', (req) => req.params.id!),
  solicitudController.firmarCertificado.bind(solicitudController)
);

/**
 * ========================================
 * RUTAS GENERALES (todos los roles autenticados)
 * ========================================
 */

/**
 * GET /api/solicitudes
 * Listar solicitudes con filtros
 * Permiso: Cualquier rol autenticado con SOLICITUDES_VER
 */
router.get(
  '/',
  requirePermission(['SOLICITUDES_VER']),
  validateQuery(FiltrosSolicitudDTO),
  solicitudController.listar.bind(solicitudController)
);

/**
 * GET /api/solicitudes/:id
 * Obtener detalle completo de solicitud
 * Permiso: SOLICITUDES_VER
 */
router.get(
  '/:id',
  requirePermission(['SOLICITUDES_VER']),
  solicitudController.obtenerPorId.bind(solicitudController)
);

/**
 * GET /api/solicitudes/:id/historial
 * Obtener historial completo de transiciones
 * Permiso: SOLICITUDES_VER
 */
router.get(
  '/:id/historial',
  requirePermission(['SOLICITUDES_VER']),
  solicitudController.obtenerHistorial.bind(solicitudController)
);

/**
 * GET /api/solicitudes/dashboard
 * Dashboard con estadísticas generales
 * Permiso: ADMIN
 */
router.get(
  '/dashboard',
  requirePermission(['SOLICITUDES_VER', 'ADMIN']),
  solicitudController.dashboard.bind(solicitudController)
);

export default router;

