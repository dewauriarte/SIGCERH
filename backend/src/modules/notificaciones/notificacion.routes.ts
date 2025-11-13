/**
 * Rutas de Notificaciones
 * Gestión de notificaciones para usuarios autenticados
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';
import { notificacionController } from './notificacion.controller';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

/**
 * GET /api/notificaciones/usuario
 * Obtener notificaciones del usuario actual (por rol)
 * Permiso: NOTIFICACIONES_VER
 */
router.get(
  '/usuario',
  requirePermission(['NOTIFICACIONES_VER']),
  notificacionController.obtenerPorUsuario.bind(notificacionController)
);

/**
 * POST /api/notificaciones/:id/marcar-leida
 * Marcar una notificación como leída
 * Permiso: NOTIFICACIONES_VER
 */
router.post(
  '/:id/marcar-leida',
  requirePermission(['NOTIFICACIONES_VER']),
  notificacionController.marcarComoLeida.bind(notificacionController)
);

/**
 * POST /api/notificaciones/marcar-todas-leidas
 * Marcar todas las notificaciones del usuario como leídas
 * Permiso: NOTIFICACIONES_VER
 */
router.post(
  '/marcar-todas-leidas',
  requirePermission(['NOTIFICACIONES_VER']),
  notificacionController.marcarTodasLeidas.bind(notificacionController)
);

/**
 * GET /api/notificaciones/contador-no-leidas
 * Obtener contador de notificaciones no leídas
 * Permiso: NOTIFICACIONES_VER
 */
router.get(
  '/contador-no-leidas',
  requirePermission(['NOTIFICACIONES_VER']),
  notificacionController.contadorNoLeidas.bind(notificacionController)
);

export default router;

