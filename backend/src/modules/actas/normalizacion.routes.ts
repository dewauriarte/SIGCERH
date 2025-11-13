/**
 * Rutas del módulo de normalización de actas físicas
 * Endpoints para convertir JSON OCR → Datos estructurados en BD
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';
import { auditarAccion } from '@middleware/audit.middleware';
import { normalizacionController } from './normalizacion.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * POST /api/actas/:id/validar
 * Validar datos OCR antes de normalizar
 * Permiso: ACTAS_VER (EDITOR, ADMIN, MESA_PARTES)
 */
router.post(
  '/:id/validar',
  requirePermission(['ACTAS_VER']),
  normalizacionController.validarDatosOCR.bind(normalizacionController)
);

/**
 * POST /api/actas/:id/normalizar
 * Normalizar acta (JSON → BD)
 * Permiso: ACTAS_EDITAR (EDITOR, ADMIN)
 * Acción auditada
 */
router.post(
  '/:id/normalizar',
  requirePermission(['ACTAS_EDITAR']),
  auditarAccion('NORMALIZAR_ACTA'),
  normalizacionController.normalizarActa.bind(normalizacionController)
);

/**
 * GET /api/actas/estudiantes/:id/actas
 * Obtener todas las actas de un estudiante
 * Permiso: ACTAS_VER (EDITOR, ADMIN, MESA_PARTES)
 */
router.get(
  '/estudiantes/:id/actas',
  requirePermission(['ACTAS_VER']),
  normalizacionController.getActasDeEstudiante.bind(normalizacionController)
);

/**
 * GET /api/actas/estudiantes/:id/notas-consolidadas
 * Consolidar notas para certificado
 * Permiso: CERTIFICADOS_VER (ADMIN, MESA_PARTES)
 */
router.get(
  '/estudiantes/:id/notas-consolidadas',
  requirePermission(['CERTIFICADOS_VER']),
  normalizacionController.consolidarNotasParaCertificado.bind(normalizacionController)
);

export default router;
