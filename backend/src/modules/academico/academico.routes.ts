/**
 * Rutas del módulo académico
 * Consolida todos los endpoints de años lectivos, grados, áreas y currículo
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';
import { auditarAccion } from '@middleware/audit.middleware';
import { validate } from './dtos';
import {
  CreateAnioLectivoDTO,
  UpdateAnioLectivoDTO,
  CreateGradoDTO,
  UpdateGradoDTO,
  CreateAreaCurricularDTO,
  UpdateAreaCurricularDTO,
} from './dtos';
import { aniosLectivosController } from './anios-lectivos.controller';
import { gradosController } from './grados.controller';
import { areasCurricularesController } from './areas-curriculares.controller';
import { curriculoController } from './curriculo.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ============================================
// RUTAS DE AÑOS LECTIVOS
// ============================================

/**
 * GET /api/academico/anios-lectivos
 * Listar años lectivos (1985-2012)
 */
router.get(
  '/anios-lectivos',
  requirePermission(['CONFIG_VER']),
  aniosLectivosController.list.bind(aniosLectivosController)
);

/**
 * POST /api/academico/anios-lectivos
 * Crear año lectivo
 */
router.post(
  '/anios-lectivos',
  requirePermission(['CONFIG_EDITAR']),
  validate(CreateAnioLectivoDTO),
  auditarAccion('aniolectivo'),
  aniosLectivosController.create.bind(aniosLectivosController)
);

/**
 * GET /api/academico/anios-lectivos/:id
 * Obtener año lectivo por ID
 */
router.get(
  '/anios-lectivos/:id',
  requirePermission(['CONFIG_VER']),
  aniosLectivosController.getById.bind(aniosLectivosController)
);

/**
 * PUT /api/academico/anios-lectivos/:id
 * Actualizar año lectivo
 */
router.put(
  '/anios-lectivos/:id',
  requirePermission(['CONFIG_EDITAR']),
  validate(UpdateAnioLectivoDTO),
  auditarAccion('aniolectivo', (req) => req.params.id!),
  aniosLectivosController.update.bind(aniosLectivosController)
);

/**
 * DELETE /api/academico/anios-lectivos/:id
 * Eliminar año lectivo
 */
router.delete(
  '/anios-lectivos/:id',
  requirePermission(['CONFIG_EDITAR']),
  auditarAccion('aniolectivo', (req) => req.params.id!),
  aniosLectivosController.delete.bind(aniosLectivosController)
);

// ============================================
// RUTAS DE GRADOS
// ============================================

/**
 * GET /api/academico/grados
 * Listar grados
 */
router.get(
  '/grados',
  requirePermission(['CONFIG_VER']),
  gradosController.list.bind(gradosController)
);

/**
 * POST /api/academico/grados
 * Crear grado
 */
router.post(
  '/grados',
  requirePermission(['CONFIG_EDITAR']),
  validate(CreateGradoDTO),
  auditarAccion('grado'),
  gradosController.create.bind(gradosController)
);

/**
 * GET /api/academico/grados/:id
 * Obtener grado por ID
 */
router.get(
  '/grados/:id',
  requirePermission(['CONFIG_VER']),
  gradosController.getById.bind(gradosController)
);

/**
 * PUT /api/academico/grados/:id
 * Actualizar grado
 */
router.put(
  '/grados/:id',
  requirePermission(['CONFIG_EDITAR']),
  validate(UpdateGradoDTO),
  auditarAccion('grado', (req) => req.params.id!),
  gradosController.update.bind(gradosController)
);

/**
 * DELETE /api/academico/grados/:id
 * Eliminar grado
 */
router.delete(
  '/grados/:id',
  requirePermission(['CONFIG_EDITAR']),
  auditarAccion('grado', (req) => req.params.id!),
  gradosController.delete.bind(gradosController)
);

// ============================================
// RUTAS DE ÁREAS CURRICULARES
// ============================================

/**
 * GET /api/academico/areas-curriculares
 * Listar áreas curriculares
 */
router.get(
  '/areas-curriculares',
  requirePermission(['CONFIG_VER']),
  areasCurricularesController.list.bind(areasCurricularesController)
);

/**
 * POST /api/academico/areas-curriculares
 * Crear área curricular
 */
router.post(
  '/areas-curriculares',
  requirePermission(['CONFIG_EDITAR']),
  validate(CreateAreaCurricularDTO),
  auditarAccion('areacurricular'),
  areasCurricularesController.create.bind(areasCurricularesController)
);

/**
 * GET /api/academico/areas-curriculares/:id
 * Obtener área curricular por ID
 */
router.get(
  '/areas-curriculares/:id',
  requirePermission(['CONFIG_VER']),
  areasCurricularesController.getById.bind(areasCurricularesController)
);

/**
 * PUT /api/academico/areas-curriculares/:id
 * Actualizar área curricular
 */
router.put(
  '/areas-curriculares/:id',
  requirePermission(['CONFIG_EDITAR']),
  validate(UpdateAreaCurricularDTO),
  auditarAccion('areacurricular', (req) => req.params.id!),
  areasCurricularesController.update.bind(areasCurricularesController)
);

/**
 * DELETE /api/academico/areas-curriculares/:id
 * Eliminar área curricular
 */
router.delete(
  '/areas-curriculares/:id',
  requirePermission(['CONFIG_EDITAR']),
  auditarAccion('areacurricular', (req) => req.params.id!),
  areasCurricularesController.delete.bind(areasCurricularesController)
);

// ============================================
// RUTAS DE CURRÍCULO
// ============================================

/**
 * ⭐ ENDPOINT CRÍTICO PARA OCR ⭐
 * GET /api/academico/curriculo/plantilla?anio=1990&grado=5
 * Obtener plantilla de áreas para un grado y año específico
 */
router.get(
  '/curriculo/plantilla',
  requirePermission(['CONFIG_VER']),
  curriculoController.getPlantilla.bind(curriculoController)
);

/**
 * POST /api/academico/curriculo/asignar
 * Asignar áreas a un grado y año
 */
router.post(
  '/curriculo/asignar',
  requirePermission(['CONFIG_EDITAR']),
  auditarAccion('curriculogrado'),
  curriculoController.assignAreasToGrado.bind(curriculoController)
);

/**
 * GET /api/academico/curriculo/grado/:gradoId
 * Obtener asignaciones de un grado
 */
router.get(
  '/curriculo/grado/:gradoId',
  requirePermission(['CONFIG_VER']),
  curriculoController.getByGrado.bind(curriculoController)
);

/**
 * PATCH /api/academico/curriculo/:id/orden
 * Actualizar orden de un área
 */
router.patch(
  '/curriculo/:id/orden',
  requirePermission(['CONFIG_EDITAR']),
  auditarAccion('curriculogrado', (req) => req.params.id!),
  curriculoController.updateOrden.bind(curriculoController)
);

/**
 * DELETE /api/academico/curriculo/:id
 * Remover área del currículo
 */
router.delete(
  '/curriculo/:id',
  requirePermission(['CONFIG_EDITAR']),
  auditarAccion('curriculogrado', (req) => req.params.id!),
  curriculoController.removeArea.bind(curriculoController)
);

export default router;

