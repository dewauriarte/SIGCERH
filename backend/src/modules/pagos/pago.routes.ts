/**
 * Rutas de Pagos
 * Organizadas por rol con middlewares de seguridad
 */

import { Router } from 'express';
import { authenticate } from '@middleware/auth.middleware';
import { requirePermission } from '@middleware/authorization.middleware';
import { auditarAccion } from '@middleware/audit.middleware';
import { pagoController } from './pago.controller';
import { metodoPagoController } from './metodo-pago.controller';
import { reporteController } from './reporte.controller';
import {
  uploadComprobante,
  handleMulterError,
} from './upload-comprobante.middleware';
import { validate, validateQuery } from './dtos';
import {
  GenerarOrdenDTO,
  SubirComprobanteDTO,
  ValidarPagoManualDTO,
  RechazarComprobanteDTO,
  RegistrarPagoEfectivoDTO,
  WebhookPagoDTO,
  FiltrosPagoDTO,
  CreateMetodoPagoDTO,
  UpdateMetodoPagoDTO,
} from './dtos';

const router = Router();

/**
 * ========================================
 * RUTAS PÚBLICAS (sin autenticación)
 * ========================================
 */

/**
 * POST /api/pagos/webhook
 * Recibir webhook de pasarela de pago (Sistema)
 */
router.post(
  '/webhook',
  validate(WebhookPagoDTO),
  pagoController.recibirWebhook.bind(pagoController)
);

/**
 * ========================================
 * RUTAS AUTENTICADAS
 * Todas las rutas a partir de aquí requieren autenticación
 * ========================================
 */
router.use(authenticate);

/**
 * ========================================
 * USUARIO PÚBLICO / GENERAL
 * ========================================
 */

/**
 * POST /api/pagos/orden
 * Generar orden de pago
 */
router.post(
  '/orden',
  requirePermission(['PAGOS_CREAR']),
  validate(GenerarOrdenDTO),
  auditarAccion('pago'),
  pagoController.generarOrden.bind(pagoController)
);

/**
 * POST /api/pagos/:id/comprobante
 * Subir comprobante de pago (Yape/Plin)
 */
router.post(
  '/:id/comprobante',
  requirePermission(['PAGOS_CREAR']),
  uploadComprobante,
  handleMulterError,
  validate(SubirComprobanteDTO),
  auditarAccion('pago', (req) => req.params.id!),
  pagoController.subirComprobante.bind(pagoController)
);

/**
 * GET /api/pagos/metodos/activos
 * Listar métodos de pago activos (público autenticado)
 */
router.get(
  '/metodos/activos',
  metodoPagoController.listarActivos.bind(metodoPagoController)
);

/**
 * ========================================
 * MESA DE PARTES
 * ========================================
 */

/**
 * GET /api/pagos/pendientes-validacion
 * Listar pagos pendientes de validación
 */
router.get(
  '/pendientes-validacion',
  requirePermission(['PAGOS_VALIDAR', 'MESA_DE_PARTES']),
  pagoController.getPendientesValidacion.bind(pagoController)
);

/**
 * POST /api/pagos/:id/registrar-efectivo
 * Registrar pago en efectivo
 */
router.post(
  '/:id/registrar-efectivo',
  requirePermission(['PAGOS_VALIDAR', 'MESA_DE_PARTES']),
  validate(RegistrarPagoEfectivoDTO),
  auditarAccion('pago', (req) => req.params.id!),
  pagoController.registrarEfectivo.bind(pagoController)
);

/**
 * POST /api/pagos/:id/validar-manual
 * Validar pago manualmente
 */
router.post(
  '/:id/validar-manual',
  requirePermission(['PAGOS_VALIDAR', 'MESA_DE_PARTES']),
  validate(ValidarPagoManualDTO),
  auditarAccion('pago', (req) => req.params.id!),
  pagoController.validarManual.bind(pagoController)
);

/**
 * POST /api/pagos/:id/rechazar-comprobante
 * Rechazar comprobante de pago
 */
router.post(
  '/:id/rechazar-comprobante',
  requirePermission(['PAGOS_VALIDAR', 'MESA_DE_PARTES']),
  validate(RechazarComprobanteDTO),
  auditarAccion('pago', (req) => req.params.id!),
  pagoController.rechazarComprobante.bind(pagoController)
);

/**
 * ========================================
 * ADMIN
 * ========================================
 */

/**
 * GET /api/pagos
 * Listar todos los pagos con filtros
 */
router.get(
  '/',
  requirePermission(['PAGOS_VER', 'ADMIN']),
  validateQuery(FiltrosPagoDTO),
  pagoController.listar.bind(pagoController)
);

/**
 * GET /api/pagos/:id
 * Obtener detalle de pago
 */
router.get(
  '/:id',
  requirePermission(['PAGOS_VER']),
  pagoController.obtenerPorId.bind(pagoController)
);

/**
 * POST /api/pagos/marcar-expiradas
 * Marcar órdenes expiradas (tarea programada)
 */
router.post(
  '/marcar-expiradas',
  requirePermission(['ADMIN']),
  pagoController.marcarExpiradas.bind(pagoController)
);

/**
 * ========================================
 * MÉTODOS DE PAGO (ADMIN)
 * ========================================
 */

/**
 * POST /api/pagos/metodos/seed
 * Ejecutar seed de métodos de pago
 */
router.post(
  '/metodos/seed',
  requirePermission(['ADMIN']),
  metodoPagoController.seed.bind(metodoPagoController)
);

/**
 * GET /api/pagos/metodos
 * Listar todos los métodos de pago
 */
router.get(
  '/metodos',
  requirePermission(['PAGOS_VER', 'ADMIN']),
  metodoPagoController.listar.bind(metodoPagoController)
);

/**
 * GET /api/pagos/metodos/:id
 * Obtener método de pago por ID
 */
router.get(
  '/metodos/:id',
  requirePermission(['PAGOS_VER', 'ADMIN']),
  metodoPagoController.obtenerPorId.bind(metodoPagoController)
);

/**
 * POST /api/pagos/metodos
 * Crear método de pago
 */
router.post(
  '/metodos',
  requirePermission(['PAGOS_EDITAR', 'ADMIN']),
  validate(CreateMetodoPagoDTO),
  auditarAccion('metodopago'),
  metodoPagoController.crear.bind(metodoPagoController)
);

/**
 * PUT /api/pagos/metodos/:id
 * Actualizar método de pago
 */
router.put(
  '/metodos/:id',
  requirePermission(['PAGOS_EDITAR', 'ADMIN']),
  validate(UpdateMetodoPagoDTO),
  auditarAccion('metodopago', (req) => req.params.id!),
  metodoPagoController.actualizar.bind(metodoPagoController)
);

/**
 * PATCH /api/pagos/metodos/:id/toggle
 * Activar/Desactivar método de pago
 */
router.patch(
  '/metodos/:id/toggle',
  requirePermission(['PAGOS_EDITAR', 'ADMIN']),
  auditarAccion('metodopago', (req) => req.params.id!),
  metodoPagoController.toggle.bind(metodoPagoController)
);

/**
 * DELETE /api/pagos/metodos/:id
 * Eliminar método de pago (soft delete)
 */
router.delete(
  '/metodos/:id',
  requirePermission(['PAGOS_EDITAR', 'ADMIN']),
  auditarAccion('metodopago', (req) => req.params.id!),
  metodoPagoController.eliminar.bind(metodoPagoController)
);

/**
 * ========================================
 * REPORTES (ADMIN)
 * ========================================
 */

/**
 * GET /api/pagos/reportes/periodo
 * Reporte de pagos por período
 */
router.get(
  '/reportes/periodo',
  requirePermission(['PAGOS_VER', 'ADMIN']),
  reporteController.reportePorPeriodo.bind(reporteController)
);

/**
 * GET /api/pagos/reportes/metodo
 * Reporte de pagos por método de pago
 */
router.get(
  '/reportes/metodo',
  requirePermission(['PAGOS_VER', 'ADMIN']),
  reporteController.reportePorMetodo.bind(reporteController)
);

/**
 * GET /api/pagos/reportes/pendientes
 * Reporte de pagos pendientes de validación
 */
router.get(
  '/reportes/pendientes',
  requirePermission(['PAGOS_VER', 'MESA_DE_PARTES', 'ADMIN']),
  reporteController.reportePendientes.bind(reporteController)
);

/**
 * GET /api/pagos/reportes/noconciliados
 * Reporte de pagos no conciliados
 */
router.get(
  '/reportes/noconciliados',
  requirePermission(['PAGOS_VER', 'ADMIN']),
  reporteController.reporteNoConciliados.bind(reporteController)
);

/**
 * GET /api/pagos/reportes/exportar
 * Exportar reporte a Excel
 */
router.get(
  '/reportes/exportar',
  requirePermission(['PAGOS_VER', 'ADMIN']),
  reporteController.exportarExcel.bind(reporteController)
);

export default router;

