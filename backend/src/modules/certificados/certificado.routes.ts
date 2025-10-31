/**
 * Rutas de Certificados (Autenticadas)
 * Requieren autenticación y permisos específicos
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';
import { auditarAccion } from '@middleware/audit.middleware';
import { certificadoController } from './certificado.controller';
import {
  uploadCertificadoFirmado,
  handleMulterError,
} from './upload-certificado.middleware';
import { validate, validateQuery } from './dtos';
import {
  GenerarPDFDTO,
  AnularCertificadoDTO,
  RectificarCertificadoDTO,
  MarcarFirmaManuscritaDTO,
  FiltrosCertificadoDTO,
} from './dtos';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

/**
 * ========================================
 * CONSULTAS
 * ========================================
 */

/**
 * GET /api/certificados
 * Listar certificados con filtros
 * Permisos: CERTIFICADOS_VER
 */
router.get(
  '/',
  requirePermission(['CERTIFICADOS_VER']),
  validateQuery(FiltrosCertificadoDTO),
  certificadoController.listar.bind(certificadoController)
);

/**
 * GET /api/certificados/:id
 * Obtener un certificado por ID
 * Permisos: CERTIFICADOS_VER
 */
router.get(
  '/:id',
  requirePermission(['CERTIFICADOS_VER']),
  auditarAccion('certificado', (req) => req.params.id!),
  certificadoController.obtenerPorId.bind(certificadoController)
);

/**
 * GET /api/certificados/:id/descargar
 * Descargar PDF del certificado
 * Permisos: CERTIFICADOS_VER
 */
router.get(
  '/:id/descargar',
  requirePermission(['CERTIFICADOS_VER']),
  auditarAccion('certificado', (req) => req.params.id!),
  certificadoController.descargar.bind(certificadoController)
);

/**
 * GET /api/certificados/:id/estado-firma
 * Ver estado de firma de un certificado
 * Permisos: CERTIFICADOS_VER
 */
router.get(
  '/:id/estado-firma',
  requirePermission(['CERTIFICADOS_VER']),
  certificadoController.estadoFirma.bind(certificadoController)
);

/**
 * ========================================
 * GENERACIÓN DE PDF
 * ========================================
 */

/**
 * POST /api/certificados/:id/generar-pdf
 * Generar PDF de un certificado existente
 * Permisos: CERTIFICADOS_GENERAR
 */
router.post(
  '/:id/generar-pdf',
  requirePermission(['CERTIFICADOS_GENERAR']),
  validate(GenerarPDFDTO),
  auditarAccion('certificado', (req) => req.params.id!),
  certificadoController.generarPDF.bind(certificadoController)
);

/**
 * ========================================
 * FIRMAS (DIRECCIÓN)
 * ========================================
 */

/**
 * POST /api/certificados/:id/firmar-digitalmente
 * Firmar digitalmente un certificado (preparado, no implementado)
 * Permisos: CERTIFICADOS_FIRMAR
 */
router.post(
  '/:id/firmar-digitalmente',
  requirePermission(['CERTIFICADOS_FIRMAR', 'DIRECCION']),
  auditarAccion('certificado', (req) => req.params.id!),
  certificadoController.firmarDigitalmente.bind(certificadoController)
);

/**
 * POST /api/certificados/:id/marcar-firma-manuscrita
 * Marcar certificado para firma manuscrita
 * Permisos: CERTIFICADOS_FIRMAR
 */
router.post(
  '/:id/marcar-firma-manuscrita',
  requirePermission(['CERTIFICADOS_FIRMAR', 'DIRECCION']),
  validate(MarcarFirmaManuscritaDTO),
  auditarAccion('certificado', (req) => req.params.id!),
  certificadoController.marcarFirmaManuscrita.bind(certificadoController)
);

/**
 * POST /api/certificados/:id/subir-firmado
 * Subir certificado con firma manuscrita escaneada
 * Permisos: CERTIFICADOS_FIRMAR
 */
router.post(
  '/:id/subir-firmado',
  requirePermission(['CERTIFICADOS_FIRMAR', 'DIRECCION']),
  uploadCertificadoFirmado,
  handleMulterError,
  auditarAccion('certificado', (req) => req.params.id!),
  certificadoController.subirFirmado.bind(certificadoController)
);

/**
 * ========================================
 * ANULACIÓN Y RECTIFICACIÓN (ADMIN)
 * ========================================
 */

/**
 * POST /api/certificados/:id/anular
 * Anular un certificado
 * Permisos: CERTIFICADOS_ANULAR, ADMIN
 */
router.post(
  '/:id/anular',
  requirePermission(['CERTIFICADOS_ANULAR', 'ADMIN']),
  validate(AnularCertificadoDTO),
  auditarAccion('certificado', (req) => req.params.id!),
  certificadoController.anular.bind(certificadoController)
);

/**
 * POST /api/certificados/:id/rectificar
 * Rectificar un certificado (nueva versión)
 * Permisos: CERTIFICADOS_RECTIFICAR, ADMIN
 */
router.post(
  '/:id/rectificar',
  requirePermission(['CERTIFICADOS_RECTIFICAR', 'ADMIN']),
  validate(RectificarCertificadoDTO),
  auditarAccion('certificado', (req) => req.params.id!),
  certificadoController.rectificar.bind(certificadoController)
);

export default router;

