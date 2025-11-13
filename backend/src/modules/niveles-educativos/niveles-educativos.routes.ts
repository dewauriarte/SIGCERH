/**
 * Rutas del módulo de Niveles Educativos
 */

import { Router } from 'express';
import { nivelesEducativosController } from './niveles-educativos.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';

const router = Router();

router.use(authenticate);

router.get('/activos', nivelesEducativosController.getActivos.bind(nivelesEducativosController));

router.get(
  '/',
  requirePermission(['NIVELES_VER']),
  nivelesEducativosController.list.bind(nivelesEducativosController)
);

router.get(
  '/:id',
  requirePermission(['NIVELES_VER']),
  nivelesEducativosController.getById.bind(nivelesEducativosController)
);

router.post(
  '/',
  requirePermission(['NIVELES_CREAR']),
  nivelesEducativosController.create.bind(nivelesEducativosController)
);

router.put(
  '/:id',
  requirePermission(['NIVELES_EDITAR']),
  nivelesEducativosController.update.bind(nivelesEducativosController)
);

router.delete(
  '/:id',
  requirePermission(['NIVELES_ELIMINAR']),
  nivelesEducativosController.delete.bind(nivelesEducativosController)
);

export default router;

