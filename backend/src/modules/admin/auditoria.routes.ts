/**
 * Rutas del módulo de auditoría
 */

import { Router } from 'express';
import { auditoriaController } from './auditoria.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requireRole } from '@middleware/authorization.middleware';

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate);
router.use(requireRole(['ADMIN']));

/**
 * GET /api/auditoria
 * Listar logs de auditoría con filtros
 * Query params: page, limit, entidad, accion, usuarioId, fechaDesde, fechaHasta
 */
router.get(
  '/',
  auditoriaController.list.bind(auditoriaController)
);

/**
 * GET /api/auditoria/estadisticas
 * Obtener estadísticas de auditoría
 */
router.get(
  '/estadisticas',
  auditoriaController.getEstadisticas.bind(auditoriaController)
);

/**
 * GET /api/auditoria/usuario/:id
 * Logs de un usuario específico
 */
router.get(
  '/usuario/:id',
  auditoriaController.getByUsuario.bind(auditoriaController)
);

/**
 * GET /api/auditoria/entidad/:entidad/:id
 * Logs de una entidad específica
 */
router.get(
  '/entidad/:entidad/:id',
  auditoriaController.getByEntidad.bind(auditoriaController)
);

export default router;

