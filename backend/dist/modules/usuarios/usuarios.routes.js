import { Router } from 'express';
import { usuariosController } from './usuarios.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requireRole, requireOwnerOrAdmin } from '@middleware/authorization.middleware';
import { auditarAccion } from '@middleware/audit.middleware';
import { validate, validateQuery } from './dtos';
import { CreateUsuarioDTO, UpdateUsuarioDTO, AsignarRolesDTO, ListUsuariosQueryDTO, } from './dtos';
const router = Router();
router.use(authenticate);
router.get('/', requireRole(['ADMIN']), validateQuery(ListUsuariosQueryDTO), usuariosController.list.bind(usuariosController));
router.post('/', requireRole(['ADMIN']), validate(CreateUsuarioDTO), auditarAccion('usuario'), usuariosController.create.bind(usuariosController));
router.get('/:id', requireOwnerOrAdmin((req) => req.params.id), usuariosController.getById.bind(usuariosController));
router.put('/:id', requireOwnerOrAdmin((req) => req.params.id), validate(UpdateUsuarioDTO), auditarAccion('usuario', (req) => req.params.id), usuariosController.update.bind(usuariosController));
router.delete('/:id', requireRole(['ADMIN']), auditarAccion('usuario', (req) => req.params.id), usuariosController.delete.bind(usuariosController));
router.post('/:id/roles', requireRole(['ADMIN']), validate(AsignarRolesDTO), auditarAccion('usuario', (req) => req.params.id), usuariosController.asignarRoles.bind(usuariosController));
export default router;
//# sourceMappingURL=usuarios.routes.js.map