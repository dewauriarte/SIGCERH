/**
 * Rutas del módulo de estudiantes
 */

import { Router } from 'express';
import multer from 'multer';
import { estudiantesController } from './estudiantes.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';
import { auditarAccion } from '@middleware/audit.middleware';
import { validate, validateQuery } from './dtos';
import { CreateEstudianteDTO, UpdateEstudianteDTO, SearchEstudianteQueryDTO } from './dtos';

const router = Router();

// Configurar multer para archivos CSV
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'));
    }
  },
});

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * POST /api/estudiantes/importar
 * Importar estudiantes desde CSV
 * Requiere permiso SOL_CREAR
 */
router.post(
  '/importar',
  requirePermission(['SOL_CREAR']),
  upload.single('archivo'),
  auditarAccion('estudiante'),
  estudiantesController.importCSV.bind(estudiantesController)
);

/**
 * GET /api/estudiantes/buscar
 * Buscar estudiantes
 * Requiere permiso SOL_VER
 */
router.get(
  '/buscar',
  requirePermission(['SOL_VER']),
  validateQuery(SearchEstudianteQueryDTO),
  estudiantesController.search.bind(estudiantesController)
);

/**
 * GET /api/estudiantes
 * Listar estudiantes
 * Requiere permiso SOL_VER
 */
router.get(
  '/',
  requirePermission(['SOL_VER']),
  estudiantesController.list.bind(estudiantesController)
);

/**
 * POST /api/estudiantes
 * Crear estudiante
 * Requiere permiso SOL_CREAR
 */
router.post(
  '/',
  requirePermission(['SOL_CREAR']),
  validate(CreateEstudianteDTO),
  auditarAccion('estudiante'),
  estudiantesController.create.bind(estudiantesController)
);

/**
 * GET /api/estudiantes/:id
 * Ver estudiante por ID
 * Requiere permiso SOL_VER
 */
router.get(
  '/:id',
  requirePermission(['SOL_VER']),
  estudiantesController.getById.bind(estudiantesController)
);

/**
 * PUT /api/estudiantes/:id
 * Actualizar estudiante
 * Requiere permiso SOL_EDITAR
 */
router.put(
  '/:id',
  requirePermission(['SOL_EDITAR']),
  validate(UpdateEstudianteDTO),
  auditarAccion('estudiante', (req) => req.params.id!),
  estudiantesController.update.bind(estudiantesController)
);

/**
 * DELETE /api/estudiantes/:id
 * Eliminar estudiante
 * Requiere permiso SOL_EDITAR
 */
router.delete(
  '/:id',
  requirePermission(['SOL_EDITAR']),
  auditarAccion('estudiante', (req) => req.params.id!),
  estudiantesController.delete.bind(estudiantesController)
);

export default router;

