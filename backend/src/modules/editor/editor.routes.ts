/**
 * Rutas del módulo Editor
 * Endpoints para gestión de expedientes y búsqueda de actas
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';
import { auditarAccion } from '@middleware/audit.middleware';
import { editorController } from './editor.controller';
import { ocrController } from './ocr.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/editor/expedientes
 * Obtener expedientes asignados al editor actual
 */
router.get(
  '/expedientes',
  requirePermission(['SOLICITUDES_VER', 'SOLICITUDES_BUSCAR']),
  editorController.getExpedientesAsignados.bind(editorController)
);

/**
 * GET /api/editor/expedientes/pendientes-busqueda
 * Obtener expedientes pendientes de búsqueda
 */
router.get(
  '/expedientes/pendientes-busqueda',
  requirePermission(['SOLICITUDES_VER', 'SOLICITUDES_BUSCAR']),
  editorController.getExpedientesPendientes.bind(editorController)
);

/**
 * GET /api/editor/estadisticas
 * Obtener estadísticas del editor
 */
router.get(
  '/estadisticas',
  requirePermission(['SOLICITUDES_VER']),
  editorController.getEstadisticas.bind(editorController)
);

/**
 * POST /api/editor/expedientes/:id/iniciar-busqueda
 * Iniciar búsqueda de acta física
 */
router.post(
  '/expedientes/:id/iniciar-busqueda',
  requirePermission(['SOLICITUDES_BUSCAR']),
  auditarAccion('solicitud', (req) => req.params.id!),
  editorController.iniciarBusqueda.bind(editorController)
);

/**
 * POST /api/editor/expedientes/:id/acta-encontrada
 * Marcar acta como encontrada
 */
router.post(
  '/expedientes/:id/acta-encontrada',
  requirePermission(['SOLICITUDES_BUSCAR', 'SOLICITUDES_GESTIONAR']),
  auditarAccion('solicitud', (req) => req.params.id!),
  editorController.marcarActaEncontrada.bind(editorController)
);

/**
 * POST /api/editor/expedientes/:id/acta-no-encontrada
 * Marcar acta como NO encontrada
 */
router.post(
  '/expedientes/:id/acta-no-encontrada',
  requirePermission(['SOLICITUDES_BUSCAR', 'SOLICITUDES_GESTIONAR']),
  auditarAccion('solicitud', (req) => req.params.id!),
  editorController.marcarActaNoEncontrada.bind(editorController)
);

/**
 * POST /api/editor/ocr/procesar-libre
 * Procesar acta con OCR sin necesidad de expediente (modo libre)
 */
router.post(
  '/ocr/procesar-libre',
  requirePermission(['SOLICITUDES_BUSCAR', 'SOLICITUDES_GESTIONAR']),
  ocrController.procesarOCRLibre.bind(ocrController)
);

/**
 * POST /api/editor/ocr/guardar-libre
 * Guardar resultado OCR en modo libre (sin expediente asociado)
 */
router.post(
  '/ocr/guardar-libre',
  requirePermission(['SOLICITUDES_BUSCAR', 'SOLICITUDES_GESTIONAR']),
  ocrController.guardarOCRLibre.bind(ocrController)
);

/**
 * POST /api/editor/expedientes/:id/subir-acta
 * Subir acta física escaneada con metadatos
 * TODO: Configurar multer para upload de archivos
 */
router.post(
  '/expedientes/:id/subir-acta',
  requirePermission(['SOLICITUDES_BUSCAR', 'SOLICITUDES_GESTIONAR']),
  auditarAccion('solicitud', (req) => req.params.id!),
  editorController.subirActa.bind(editorController)
);

/**
 * POST /api/editor/expedientes/:id/procesar-ocr
 * Procesar acta con OCR/IA
 */
router.post(
  '/expedientes/:id/procesar-ocr',
  requirePermission(['SOLICITUDES_BUSCAR', 'SOLICITUDES_GESTIONAR']),
  auditarAccion('solicitud', (req) => req.params.id!),
  ocrController.procesarOCR.bind(ocrController)
);

/**
 * GET /api/editor/expedientes/:id/resultado-ocr
 * Obtener resultado del procesamiento OCR
 */
router.get(
  '/expedientes/:id/resultado-ocr',
  requirePermission(['SOLICITUDES_BUSCAR', 'SOLICITUDES_GESTIONAR']),
  ocrController.obtenerResultadoOCR.bind(ocrController)
);

/**
 * POST /api/editor/expedientes/:id/guardar-ocr
 * Guardar resultado OCR en base de datos (crear estudiantes, certificados, notas)
 */
router.post(
  '/expedientes/:id/guardar-ocr',
  requirePermission(['SOLICITUDES_BUSCAR', 'SOLICITUDES_GESTIONAR']),
  auditarAccion('solicitud', (req) => req.params.id!),
  ocrController.guardarOCR.bind(ocrController)
);

export default router;

