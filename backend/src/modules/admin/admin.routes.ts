/**
 * Rutas del módulo Administrador
 * Endpoints para gestión de usuarios, roles y estadísticas
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';
import { adminController } from './admin.controller';

const router = Router();

// Todas las rutas requieren autenticación y permisos de administrador
router.use(authenticate);

/**
 * GET /api/admin/estadisticas
 * Obtener estadísticas generales del sistema
 */
router.get(
  '/estadisticas',
  requirePermission(['AUDITORIA_VER', 'USUARIOS_VER']),
  adminController.getEstadisticas.bind(adminController)
);

/**
 * GET /api/admin/solicitudes-por-mes
 * Obtener solicitudes agrupadas por mes
 */
router.get(
  '/solicitudes-por-mes',
  requirePermission(['AUDITORIA_VER', 'SOLICITUDES_VER']),
  adminController.getSolicitudesPorMes.bind(adminController)
);

/**
 * GET /api/admin/certificados-por-colegio
 * Obtener certificados agrupados por colegio
 */
router.get(
  '/certificados-por-colegio',
  requirePermission(['AUDITORIA_VER', 'CERTIFICADOS_VER']),
  adminController.getCertificadosPorColegio.bind(adminController)
);

/**
 * GET /api/admin/usuarios
 * Obtener lista paginada de usuarios
 */
router.get(
  '/usuarios',
  requirePermission(['USUARIOS_VER']),
  adminController.getUsuarios.bind(adminController)
);

/**
 * GET /api/admin/usuarios/:id
 * Obtener detalles de un usuario específico
 */
router.get(
  '/usuarios/:id',
  requirePermission(['USUARIOS_VER']),
  adminController.getUsuario.bind(adminController)
);

/**
 * POST /api/admin/usuarios
 * Crear un nuevo usuario
 */
router.post(
  '/usuarios',
  requirePermission(['USUARIOS_CREAR']),
  adminController.crearUsuario.bind(adminController)
);

/**
 * PATCH /api/admin/usuarios/:id
 * Actualizar un usuario
 */
router.patch(
  '/usuarios/:id',
  requirePermission(['USUARIOS_EDITAR']),
  adminController.actualizarUsuario.bind(adminController)
);

/**
 * POST /api/admin/usuarios/:id/desactivar
 * Desactivar un usuario
 */
router.post(
  '/usuarios/:id/desactivar',
  requirePermission(['USUARIOS_EDITAR']),
  adminController.desactivarUsuario.bind(adminController)
);

/**
 * POST /api/admin/usuarios/:id/activar
 * Activar un usuario
 */
router.post(
  '/usuarios/:id/activar',
  requirePermission(['USUARIOS_EDITAR']),
  adminController.activarUsuario.bind(adminController)
);

/**
 * POST /api/admin/usuarios/:id/bloquear
 * Bloquear un usuario
 */
router.post(
  '/usuarios/:id/bloquear',
  requirePermission(['USUARIOS_EDITAR']),
  adminController.bloquearUsuario.bind(adminController)
);

/**
 * POST /api/admin/usuarios/:id/desbloquear
 * Desbloquear un usuario
 */
router.post(
  '/usuarios/:id/desbloquear',
  requirePermission(['USUARIOS_EDITAR']),
  adminController.desbloquearUsuario.bind(adminController)
);

/**
 * DELETE /api/admin/usuarios/:id
 * Eliminar un usuario permanentemente
 */
router.delete(
  '/usuarios/:id',
  requirePermission(['USUARIOS_ELIMINAR']),
  adminController.eliminarUsuario.bind(adminController)
);

/**
 * POST /api/admin/usuarios/:id/resetear-password
 * Resetear contraseña de un usuario
 */
router.post(
  '/usuarios/:id/resetear-password',
  requirePermission(['USUARIOS_EDITAR']),
  adminController.resetearPassword.bind(adminController)
);

/**
 * GET /api/admin/roles
 * Obtener todos los roles disponibles
 */
router.get(
  '/roles',
  requirePermission(['USUARIOS_VER']),
  adminController.getRoles.bind(adminController)
);

export default router;

