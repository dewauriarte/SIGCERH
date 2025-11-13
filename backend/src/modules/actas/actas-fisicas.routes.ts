/**
 * Rutas del módulo de actas físicas
 * Endpoints protegidos con autenticación y permisos
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';
import { auditarAccion } from '@middleware/audit.middleware';
import { uploadActa, handleMulterError } from '@middleware/upload.middleware';
import { uploadRateLimiter, ocrRateLimiter } from '@middleware/rate-limit.middleware';
import { validate } from './dtos';
import {
  UpdateActaFisicaDTO,
  AsignarSolicitudDTO,
  CambiarEstadoActaDTO,
  ProcesarOCRDTO,
  ValidacionManualDTO,
  ValidacionConCorreccionesDTO,
} from './dtos';
import { actasFisicasController } from './actas-fisicas.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/actas/estadisticas
 * Obtener estadísticas generales (debe ir antes de rutas con :id)
 * Permiso: ACTAS_VER (EDITOR, ADMIN)
 */
router.get(
  '/estadisticas',
  requirePermission(['ACTAS_VER']),
  actasFisicasController.getEstadisticas.bind(actasFisicasController)
);

/**
 * POST /api/actas
 * Subir acta con archivo y metadata
 * Permiso: ACTAS_EDITAR (EDITOR)
 * Rate limit: 20 uploads/hora (protección contra abuso)
 */
router.post(
  '/',
  requirePermission(['ACTAS_EDITAR']),
  uploadRateLimiter, // Protección moderada
  uploadActa,
  handleMulterError,
  // Nota: La validación de CreateActaFisicaDTO se hace en el controller
  // porque req.body viene de multipart/form-data
  auditarAccion('actafisica'),
  actasFisicasController.create.bind(actasFisicasController)
);

/**
 * GET /api/actas
 * Listar actas con filtros
 * Permiso: ACTAS_VER (EDITOR, ADMIN)
 */
router.get(
  '/',
  requirePermission(['ACTAS_VER']),
  actasFisicasController.list.bind(actasFisicasController)
);

/**
 * GET /api/actas/:id
 * Obtener acta por ID
 * Permiso: ACTAS_VER (EDITOR, ADMIN)
 */
router.get(
  '/:id',
  requirePermission(['ACTAS_VER']),
  actasFisicasController.getById.bind(actasFisicasController)
);

/**
 * PUT /api/actas/:id
 * Actualizar acta (ruta genérica)
 * Permiso: ACTAS_EDITAR (EDITOR)
 */
router.put(
  '/:id',
  requirePermission(['ACTAS_EDITAR']),
  validate(UpdateActaFisicaDTO),
  auditarAccion('actafisica', (req) => req.params.id!),
  actasFisicasController.update.bind(actasFisicasController)
);

/**
 * PUT /api/actas/:id/metadata
 * Actualizar metadata de acta (alias)
 * Permiso: ACTAS_EDITAR (EDITOR)
 */
router.put(
  '/:id/metadata',
  requirePermission(['ACTAS_EDITAR']),
  validate(UpdateActaFisicaDTO),
  auditarAccion('actafisica', (req) => req.params.id!),
  actasFisicasController.updateMetadata.bind(actasFisicasController)
);

/**
 * POST /api/actas/:id/asignar-solicitud
 * Asignar acta a una solicitud (estado: ASIGNADA_BUSQUEDA)
 * Permiso: ACTAS_EDITAR (EDITOR)
 */
router.post(
  '/:id/asignar-solicitud',
  requirePermission(['ACTAS_EDITAR']),
  validate(AsignarSolicitudDTO),
  auditarAccion('actafisica', (req) => req.params.id!),
  actasFisicasController.asignarSolicitud.bind(actasFisicasController)
);

/**
 * POST /api/actas/:id/marcar-encontrada
 * Marcar acta como encontrada físicamente
 * Permiso: ACTAS_EDITAR (EDITOR)
 */
router.post(
  '/:id/marcar-encontrada',
  requirePermission(['ACTAS_EDITAR']),
  validate(CambiarEstadoActaDTO),
  auditarAccion('actafisica', (req) => req.params.id!),
  actasFisicasController.marcarEncontrada.bind(actasFisicasController)
);

/**
 * POST /api/actas/:id/marcar-no-encontrada
 * Marcar acta como no encontrada
 * Permiso: ACTAS_EDITAR (EDITOR)
 */
router.post(
  '/:id/marcar-no-encontrada',
  requirePermission(['ACTAS_EDITAR']),
  validate(CambiarEstadoActaDTO),
  auditarAccion('actafisica', (req) => req.params.id!),
  actasFisicasController.marcarNoEncontrada.bind(actasFisicasController)
);

/**
 * ⭐ POST /api/actas/:id/procesar-ocr ⭐
 * CRÍTICO: Recibir datos de OCR y crear certificados automáticamente
 * Permiso: ACTAS_PROCESAR (EDITOR, SISTEMA)
 * Rate limit: 50 procesamientos/hora por usuario
 */
router.post(
  '/:id/procesar-ocr',
  requirePermission(['ACTAS_PROCESAR']),
  ocrRateLimiter, // Protección para procesamiento intensivo
  validate(ProcesarOCRDTO),
  auditarAccion('actafisica', (req) => req.params.id!),
  actasFisicasController.procesarOCR.bind(actasFisicasController)
);

/**
 * POST /api/actas/:id/validar-manual
 * Validar manualmente acta procesada con OCR
 * Permiso: ACTAS_EDITAR (EDITOR)
 */
router.post(
  '/:id/validar-manual',
  requirePermission(['ACTAS_EDITAR']),
  validate(ValidacionManualDTO),
  auditarAccion('actafisica', (req) => req.params.id!),
  actasFisicasController.validarManual.bind(actasFisicasController)
);

/**
 * GET /api/actas/:id/exportar-excel
 * Exportar acta a Excel
 * Permiso: ACTAS_VER (EDITOR, ADMIN)
 */
router.get(
  '/:id/exportar-excel',
  requirePermission(['ACTAS_VER']),
  actasFisicasController.exportarExcel.bind(actasFisicasController)
);

/**
 * GET /api/actas/:id/comparar-ocr
 * Comparar datos OCR con acta física para validación visual
 * Permiso: ACTAS_VER (EDITOR)
 */
router.get(
  '/:id/comparar-ocr',
  requirePermission(['ACTAS_VER']),
  actasFisicasController.compararOCRconFisica.bind(actasFisicasController)
);

/**
 * POST /api/actas/:id/validar-con-correcciones
 * Validar acta aplicando correcciones a datos incorrectos
 * Permiso: ACTAS_EDITAR (EDITOR)
 */
router.post(
  '/:id/validar-con-correcciones',
  requirePermission(['ACTAS_EDITAR']),
  validate(ValidacionConCorreccionesDTO),
  auditarAccion('actafisica', (req) => req.params.id!),
  actasFisicasController.validarConCorrecciones.bind(actasFisicasController)
);

export default router;

