/**
 * Rutas del módulo de Áreas Curriculares
 */

import { Router } from 'express';
import { areasCurricularesController } from './areas-curriculares.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';

const router = Router();

router.use(authenticate);

router.get('/activas', areasCurricularesController.getActivas.bind(areasCurricularesController));

router.get(
  '/',
  requirePermission(['AREAS_VER']),
  areasCurricularesController.list.bind(areasCurricularesController)
);

router.get(
  '/:id',
  requirePermission(['AREAS_VER']),
  areasCurricularesController.getById.bind(areasCurricularesController)
);

router.post(
  '/',
  requirePermission(['AREAS_CREAR']),
  areasCurricularesController.create.bind(areasCurricularesController)
);

router.put(
  '/:id',
  requirePermission(['AREAS_EDITAR']),
  areasCurricularesController.update.bind(areasCurricularesController)
);

router.delete(
  '/:id',
  requirePermission(['AREAS_ELIMINAR']),
  areasCurricularesController.delete.bind(areasCurricularesController)
);

export default router;

