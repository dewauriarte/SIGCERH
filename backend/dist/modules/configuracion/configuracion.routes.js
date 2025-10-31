import { Router } from 'express';
import multer from 'multer';
import { configuracionController } from './configuracion.controller';
import { nivelesController } from './niveles.controller';
import { institucionUsuarioController } from './institucion-usuario.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requireRole } from '@middleware/authorization.middleware';
import { auditarAccion } from '@middleware/audit.middleware';
import { validate } from './dtos';
import { UpdateConfiguracionDTO, CreateNivelDTO, UpdateNivelDTO } from './dtos';
const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
});
router.use(authenticate);
router.use(requireRole(['ADMIN']));
router.get('/institucion', configuracionController.getInstitucion.bind(configuracionController));
router.put('/institucion', validate(UpdateConfiguracionDTO), auditarAccion('configuracion'), configuracionController.updateInstitucion.bind(configuracionController));
router.post('/institucion/logo', upload.single('logo'), auditarAccion('configuracion'), configuracionController.uploadLogo.bind(configuracionController));
router.get('/niveles', nivelesController.list.bind(nivelesController));
router.post('/niveles', validate(CreateNivelDTO), auditarAccion('nivel'), nivelesController.create.bind(nivelesController));
router.get('/niveles/:id', nivelesController.getById.bind(nivelesController));
router.put('/niveles/:id', validate(UpdateNivelDTO), auditarAccion('nivel', (req) => req.params.id), nivelesController.update.bind(nivelesController));
router.delete('/niveles/:id', auditarAccion('nivel', (req) => req.params.id), nivelesController.delete.bind(nivelesController));
router.get('/institucion/usuarios', institucionUsuarioController.list.bind(institucionUsuarioController));
router.post('/institucion/usuarios/:usuarioId', auditarAccion('institucion_usuario', (req) => req.params.usuarioId), institucionUsuarioController.asignar.bind(institucionUsuarioController));
router.delete('/institucion/usuarios/:usuarioId', auditarAccion('institucion_usuario', (req) => req.params.usuarioId), institucionUsuarioController.remover.bind(institucionUsuarioController));
export default router;
//# sourceMappingURL=configuracion.routes.js.map