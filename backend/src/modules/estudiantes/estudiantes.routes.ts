/**
 * Rutas del módulo de Estudiantes
 * Endpoints protegidos con autenticación y permisos
 */

import { Router } from 'express';
import { estudiantesController } from './estudiantes.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/estudiantes/activos
 * Obtener estudiantes activos
 * Permisos: Cualquier usuario autenticado puede ver estudiantes activos
 */
router.get('/activos', estudiantesController.getActivos.bind(estudiantesController));

/**
 * GET /api/estudiantes/buscar-nombre
 * Buscar estudiantes por nombre completo
 * Permisos: ESTUDIANTES_VER
 */
router.get(
  '/buscar-nombre',
  requirePermission(['ESTUDIANTES_VER']),
  estudiantesController.buscarPorNombre.bind(estudiantesController)
);

/**
 * GET /api/estudiantes
 * Listar estudiantes con filtros
 * Permisos: ESTUDIANTES_VER
 */
router.get(
  '/',
  requirePermission(['ESTUDIANTES_VER']),
  estudiantesController.list.bind(estudiantesController)
);

/**
 * GET /api/estudiantes/:id
 * Obtener estudiante por ID
 * Permisos: ESTUDIANTES_VER
 */
router.get(
  '/:id',
  requirePermission(['ESTUDIANTES_VER']),
  estudiantesController.getById.bind(estudiantesController)
);

/**
 * POST /api/estudiantes
 * Crear nuevo estudiante
 * Permisos: ESTUDIANTES_CREAR
 */
router.post(
  '/',
  requirePermission(['ESTUDIANTES_CREAR']),
  estudiantesController.create.bind(estudiantesController)
);

/**
 * PUT /api/estudiantes/:id
 * Actualizar estudiante
 * Permisos: ESTUDIANTES_EDITAR
 */
router.put(
  '/:id',
  requirePermission(['ESTUDIANTES_EDITAR']),
  estudiantesController.update.bind(estudiantesController)
);

/**
 * PUT /api/estudiantes/:id/actualizar-dni
 * Actualizar DNI de estudiante (de temporal a real)
 * Permisos: ESTUDIANTES_EDITAR
 */
router.put(
  '/:id/actualizar-dni',
  requirePermission(['ESTUDIANTES_EDITAR']),
  estudiantesController.actualizarDNI.bind(estudiantesController)
);

/**
 * GET /api/estudiantes/:id/actas-certificado
 * Obtener actas consolidadas para generar certificado
 * Permisos: ESTUDIANTES_VER
 */
router.get(
  '/:id/actas-certificado',
  requirePermission(['ESTUDIANTES_VER']),
  estudiantesController.getActasParaCertificado.bind(estudiantesController)
);

/**
 * DELETE /api/estudiantes/:id
 * Eliminar estudiante
 * Permisos: ESTUDIANTES_ELIMINAR
 */
router.delete(
  '/:id',
  requirePermission(['ESTUDIANTES_ELIMINAR']),
  estudiantesController.delete.bind(estudiantesController)
);

export default router;
