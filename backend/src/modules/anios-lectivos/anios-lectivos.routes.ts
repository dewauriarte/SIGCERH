/**
 * Rutas del módulo de Años Lectivos
 */

import { Router } from 'express';
import { aniosLectivosController } from './anios-lectivos.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';

const router = Router();

router.use(authenticate);

router.get('/activos', aniosLectivosController.getActivos.bind(aniosLectivosController));
router.get('/actual', aniosLectivosController.getActual.bind(aniosLectivosController));

router.get(
  '/',
  requirePermission(['ANIOS_VER']),
  aniosLectivosController.list.bind(aniosLectivosController)
);

router.get(
  '/:id',
  requirePermission(['ANIOS_VER']),
  aniosLectivosController.getById.bind(aniosLectivosController)
);

router.post(
  '/',
  requirePermission(['ANIOS_CREAR']),
  aniosLectivosController.create.bind(aniosLectivosController)
);

router.put(
  '/:id',
  requirePermission(['ANIOS_EDITAR']),
  aniosLectivosController.update.bind(aniosLectivosController)
);

router.delete(
  '/:id',
  requirePermission(['ANIOS_ELIMINAR']),
  aniosLectivosController.delete.bind(aniosLectivosController)
);

export default router;

