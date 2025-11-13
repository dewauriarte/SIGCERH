/**
 * Rutas para Libros de Actas Físicas
 */

import { Router } from 'express';
import { librosController } from './libros.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/libros/activos
 * Obtener libros activos para dropdowns
 * Requiere: Cualquier usuario autenticado
 */
router.get('/activos', librosController.getActivos.bind(librosController));

/**
 * GET /api/libros
 * Listar libros con filtros
 * Requiere: Permisos de gestión de actas
 */
router.get(
  '/',
  requirePermission(['ACTAS_VER', 'ACTAS_EDITAR']),
  librosController.list.bind(librosController)
);

/**
 * GET /api/libros/:id
 * Obtener un libro por ID
 * Requiere: Permisos de gestión de actas
 */
router.get(
  '/:id',
  requirePermission(['ACTAS_VER', 'ACTAS_EDITAR']),
  librosController.getById.bind(librosController)
);

/**
 * POST /api/libros
 * Crear nuevo libro
 * Requiere: Permisos de gestión de actas
 */
router.post(
  '/',
  requirePermission(['ACTAS_EDITAR', 'CONFIG_EDITAR']),
  librosController.create.bind(librosController)
);

/**
 * PUT /api/libros/:id
 * Actualizar un libro
 * Requiere: Permisos de gestión de actas
 */
router.put(
  '/:id',
  requirePermission(['ACTAS_EDITAR', 'CONFIG_EDITAR']),
  librosController.update.bind(librosController)
);

/**
 * DELETE /api/libros/:id
 * Eliminar un libro (soft delete)
 * Requiere: Permisos de gestión de actas
 */
router.delete(
  '/:id',
  requirePermission(['ACTAS_ELIMINAR', 'CONFIG_EDITAR']),
  librosController.delete.bind(librosController)
);

export default router;

