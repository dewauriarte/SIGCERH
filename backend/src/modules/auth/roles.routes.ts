/**
 * Rutas del módulo de roles
 */

import { Router } from 'express';
import { rolesController } from './roles.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requireRole } from '@middleware/authorization.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/roles
 * Listar todos los roles
 * Solo ADMIN
 */
router.get(
  '/',
  requireRole(['ADMIN']),
  rolesController.list.bind(rolesController)
);

/**
 * GET /api/roles/:id
 * Ver rol por ID con permisos
 * Solo ADMIN
 */
router.get(
  '/:id',
  requireRole(['ADMIN']),
  rolesController.getById.bind(rolesController)
);

/**
 * GET /api/roles/:id/permisos
 * Ver permisos de un rol
 * Solo ADMIN
 */
router.get(
  '/:id/permisos',
  requireRole(['ADMIN']),
  rolesController.getPermisos.bind(rolesController)
);

/**
 * GET /api/permisos
 * Listar todos los permisos disponibles
 * Solo ADMIN
 */
router.get(
  '/permisos/all',
  requireRole(['ADMIN']),
  rolesController.listPermisos.bind(rolesController)
);

export default router;

