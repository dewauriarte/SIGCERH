/**
 * Rutas de Verificación Pública
 * Sin autenticación - Acceso público
 */

import { Router } from 'express';
import { verificacionController } from './verificacion.controller';

const router = Router();

/**
 * GET /api/verificar/:codigoVirtual
 * Verificar certificado por código virtual
 * PÚBLICO - Sin autenticación
 */
router.get(
  '/:codigoVirtual',
  verificacionController.verificarPorCodigo.bind(verificacionController)
);

/**
 * GET /api/verificar/qr/:hash
 * Verificar certificado por hash del QR
 * PÚBLICO - Sin autenticación
 */
router.get('/qr/:hash', verificacionController.verificarPorQR.bind(verificacionController));

/**
 * GET /api/verificar/estadisticas
 * Estadísticas de verificaciones
 * PÚBLICO - Solo números agregados
 */
router.get(
  '/estadisticas',
  verificacionController.estadisticas.bind(verificacionController)
);

export default router;

