import { Router } from 'express';
import { auditoriaController } from './auditoria.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requireRole } from '@middleware/authorization.middleware';
const router = Router();
router.use(authenticate);
router.use(requireRole(['ADMIN']));
router.get('/', auditoriaController.list.bind(auditoriaController));
router.get('/estadisticas', auditoriaController.getEstadisticas.bind(auditoriaController));
router.get('/usuario/:id', auditoriaController.getByUsuario.bind(auditoriaController));
router.get('/entidad/:entidad/:id', auditoriaController.getByEntidad.bind(auditoriaController));
export default router;
//# sourceMappingURL=auditoria.routes.js.map