import { Router } from 'express';
import { rolesController } from './roles.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requireRole } from '@middleware/authorization.middleware';
const router = Router();
router.use(authenticate);
router.get('/', requireRole(['ADMIN']), rolesController.list.bind(rolesController));
router.get('/:id', requireRole(['ADMIN']), rolesController.getById.bind(rolesController));
router.get('/:id/permisos', requireRole(['ADMIN']), rolesController.getPermisos.bind(rolesController));
router.get('/permisos/all', requireRole(['ADMIN']), rolesController.listPermisos.bind(rolesController));
export default router;
//# sourceMappingURL=roles.routes.js.map