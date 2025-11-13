/**
 * Rutas de ubicación geográfica
 * PÚBLICAS - No requieren autenticación
 */

import { Router } from 'express';
import { ubicacionController } from './ubicacion.controller';

const router = Router();

/**
 * @route   GET /api/ubicacion/departamentos
 * @desc    Obtiene todos los departamentos
 * @access  Público
 */
router.get('/departamentos', ubicacionController.getDepartamentos.bind(ubicacionController));

/**
 * @route   GET /api/ubicacion/provincias/:departamentoId
 * @desc    Obtiene provincias de un departamento
 * @access  Público
 */
router.get('/provincias/:departamentoId', ubicacionController.getProvincias.bind(ubicacionController));

/**
 * @route   GET /api/ubicacion/distritos/:provinciaId
 * @desc    Obtiene distritos de una provincia
 * @access  Público
 */
router.get('/distritos/:provinciaId', ubicacionController.getDistritos.bind(ubicacionController));

export default router;
