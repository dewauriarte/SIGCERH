/**
 * Rutas del módulo de usuarios
 */

import { Router } from 'express';
import { usuariosController } from './usuarios.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requireRole, requirePermission, requireOwnerOrAdmin } from '@middleware/authorization.middleware';
import { auditarAccion } from '@middleware/audit.middleware';
import { validate, validateQuery } from './dtos';
import {
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  AsignarRolesDTO,
  ListUsuariosQueryDTO,
} from './dtos';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/usuarios/editores
 * Listar editores disponibles (para derivación)
 * MESA_DE_PARTES, ADMIN
 */
router.get(
  '/editores',
  requirePermission(['USUARIOS_VER']),
  usuariosController.listEditores.bind(usuariosController)
);

/**
 * GET /api/usuarios
 * Listar usuarios
 * Solo ADMIN
 */
router.get(
  '/',
  requireRole(['ADMIN']),
  validateQuery(ListUsuariosQueryDTO),
  usuariosController.list.bind(usuariosController)
);

/**
 * POST /api/usuarios
 * Crear usuario
 * Solo ADMIN
 */
router.post(
  '/',
  requireRole(['ADMIN']),
  validate(CreateUsuarioDTO),
  auditarAccion('usuario'),
  usuariosController.create.bind(usuariosController)
);

/**
 * GET /api/usuarios/:id
 * Ver usuario por ID
 * ADMIN o el propio usuario
 */
router.get(
  '/:id',
  requireOwnerOrAdmin((req) => req.params.id!),
  usuariosController.getById.bind(usuariosController)
);

/**
 * PUT /api/usuarios/:id
 * Actualizar usuario
 * ADMIN o el propio usuario
 */
router.put(
  '/:id',
  requireOwnerOrAdmin((req) => req.params.id!),
  validate(UpdateUsuarioDTO),
  auditarAccion('usuario', (req) => req.params.id!),
  usuariosController.update.bind(usuariosController)
);

/**
 * DELETE /api/usuarios/:id
 * Eliminar usuario
 * Solo ADMIN
 */
router.delete(
  '/:id',
  requireRole(['ADMIN']),
  auditarAccion('usuario', (req) => req.params.id!),
  usuariosController.delete.bind(usuariosController)
);

/**
 * POST /api/usuarios/:id/roles
 * Asignar roles a un usuario
 * Solo ADMIN
 */
router.post(
  '/:id/roles',
  requireRole(['ADMIN']),
  validate(AsignarRolesDTO),
  auditarAccion('usuario', (req) => req.params.id!),
  usuariosController.asignarRoles.bind(usuariosController)
);

export default router;

