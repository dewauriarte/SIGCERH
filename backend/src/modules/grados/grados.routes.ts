/**
 * Rutas del módulo de Grados
 */

import { Router } from 'express';
import { gradosController } from './grados.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';

const router = Router();

router.use(authenticate);

router.get('/activos', gradosController.getActivos.bind(gradosController));

router.get(
  '/',
  requirePermission(['GRADOS_VER']),
  gradosController.list.bind(gradosController)
);

router.get(
  '/:id',
  requirePermission(['GRADOS_VER']),
  gradosController.getById.bind(gradosController)
);

router.post(
  '/',
  requirePermission(['GRADOS_CREAR']),
  gradosController.create.bind(gradosController)
);

router.put(
  '/:id',
  requirePermission(['GRADOS_EDITAR']),
  gradosController.update.bind(gradosController)
);

router.delete(
  '/:id',
  requirePermission(['GRADOS_ELIMINAR']),
  gradosController.delete.bind(gradosController)
);

export default router;

