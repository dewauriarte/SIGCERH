import { Router } from 'express';
import multer from 'multer';
import { estudiantesController } from './estudiantes.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';
import { auditarAccion } from '@middleware/audit.middleware';
import { validate, validateQuery } from './dtos';
import { CreateEstudianteDTO, UpdateEstudianteDTO, SearchEstudianteQueryDTO } from './dtos';
const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (file.originalname.toLowerCase().endsWith('.csv')) {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten archivos CSV'));
        }
    },
});
router.use(authenticate);
router.post('/importar', requirePermission(['SOL_CREAR']), upload.single('archivo'), auditarAccion('estudiante'), estudiantesController.importCSV.bind(estudiantesController));
router.get('/buscar', requirePermission(['SOL_VER']), validateQuery(SearchEstudianteQueryDTO), estudiantesController.search.bind(estudiantesController));
router.get('/', requirePermission(['SOL_VER']), estudiantesController.list.bind(estudiantesController));
router.post('/', requirePermission(['SOL_CREAR']), validate(CreateEstudianteDTO), auditarAccion('estudiante'), estudiantesController.create.bind(estudiantesController));
router.get('/:id', requirePermission(['SOL_VER']), estudiantesController.getById.bind(estudiantesController));
router.put('/:id', requirePermission(['SOL_EDITAR']), validate(UpdateEstudianteDTO), auditarAccion('estudiante', (req) => req.params.id), estudiantesController.update.bind(estudiantesController));
router.delete('/:id', requirePermission(['SOL_EDITAR']), auditarAccion('estudiante', (req) => req.params.id), estudiantesController.delete.bind(estudiantesController));
export default router;
//# sourceMappingURL=estudiantes.routes.js.map