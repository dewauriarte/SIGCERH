/**
 * Rutas del módulo de configuración
 */

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

// Configurar multer para subida de archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// ============================================
// CONFIGURACIÓN INSTITUCIONAL
// ============================================

/**
 * GET /api/configuracion/institucion
 * Obtener configuración institucional
 */
router.get(
  '/institucion',
  configuracionController.getInstitucion.bind(configuracionController)
);

/**
 * PUT /api/configuracion/institucion
 * Actualizar configuración institucional
 */
router.put(
  '/institucion',
  validate(UpdateConfiguracionDTO),
  auditarAccion('configuracion'),
  configuracionController.updateInstitucion.bind(configuracionController)
);

/**
 * POST /api/configuracion/institucion/logo
 * Subir logo institucional
 */
router.post(
  '/institucion/logo',
  upload.single('logo'),
  auditarAccion('configuracion'),
  configuracionController.uploadLogo.bind(configuracionController)
);

// ============================================
// NIVELES EDUCATIVOS
// ============================================

/**
 * GET /api/configuracion/niveles
 * Listar niveles educativos
 */
router.get(
  '/niveles',
  nivelesController.list.bind(nivelesController)
);

/**
 * POST /api/configuracion/niveles
 * Crear nivel educativo
 */
router.post(
  '/niveles',
  validate(CreateNivelDTO),
  auditarAccion('nivel'),
  nivelesController.create.bind(nivelesController)
);

/**
 * GET /api/configuracion/niveles/:id
 * Obtener nivel por ID
 */
router.get(
  '/niveles/:id',
  nivelesController.getById.bind(nivelesController)
);

/**
 * PUT /api/configuracion/niveles/:id
 * Actualizar nivel educativo
 */
router.put(
  '/niveles/:id',
  validate(UpdateNivelDTO),
  auditarAccion('nivel', (req) => req.params.id!),
  nivelesController.update.bind(nivelesController)
);

/**
 * DELETE /api/configuracion/niveles/:id
 * Eliminar nivel educativo
 */
router.delete(
  '/niveles/:id',
  auditarAccion('nivel', (req) => req.params.id!),
  nivelesController.delete.bind(nivelesController)
);

// ============================================
// USUARIOS DE LA INSTITUCIÓN
// ============================================

/**
 * GET /api/institucion/usuarios
 * Listar usuarios asignados
 */
router.get(
  '/institucion/usuarios',
  institucionUsuarioController.list.bind(institucionUsuarioController)
);

/**
 * POST /api/institucion/usuarios/:usuarioId
 * Asignar usuario a institución
 */
router.post(
  '/institucion/usuarios/:usuarioId',
  auditarAccion('institucion_usuario', (req) => req.params.usuarioId!),
  institucionUsuarioController.asignar.bind(institucionUsuarioController)
);

/**
 * DELETE /api/institucion/usuarios/:usuarioId
 * Remover usuario de institución
 */
router.delete(
  '/institucion/usuarios/:usuarioId',
  auditarAccion('institucion_usuario', (req) => req.params.usuarioId!),
  institucionUsuarioController.remover.bind(institucionUsuarioController)
);

export default router;

