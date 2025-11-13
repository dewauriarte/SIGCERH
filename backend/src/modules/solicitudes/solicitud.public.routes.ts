/**
 * Rutas públicas de Solicitudes
 * Sin autenticación - para portal público
 */

import { Router } from 'express';
import { solicitudController } from './solicitud.controller';
import { validate } from './dtos';
import { CreateSolicitudDTO } from './dtos';

const router = Router();

/**
 * POST /api/solicitudes-publicas/crear
 * Crear nueva solicitud (Usuario Público)
 */
router.post(
  '/crear',
  validate(CreateSolicitudDTO),
  solicitudController.crear.bind(solicitudController)
);

/**
 * GET /api/solicitudes-publicas/seguimiento/:codigo
 * Consultar estado de solicitud (Público)
 */
router.get(
  '/seguimiento/:codigo',
  solicitudController.seguimiento.bind(solicitudController)
);

export default router;
