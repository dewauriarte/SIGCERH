/**
 * Rutas de autenticación
 */

import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '@middleware/auth.middleware';
import { auditarAutenticacion } from '@middleware/audit.middleware';
import { validate } from './dtos';
import {
  RegisterDTO,
  LoginDTO,
  RefreshTokenDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
} from './dtos';

const router = Router();

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 * Público
 */
router.post(
  '/register',
  validate(RegisterDTO),
  auditarAutenticacion,
  authController.register.bind(authController)
);

/**
 * POST /api/auth/login
 * Inicia sesión
 * Público
 */
router.post(
  '/login',
  validate(LoginDTO),
  auditarAutenticacion,
  authController.login.bind(authController)
);

/**
 * POST /api/auth/refresh
 * Renueva el access token
 * Público (pero requiere refresh token válido)
 */
router.post(
  '/refresh',
  validate(RefreshTokenDTO),
  authController.refresh.bind(authController)
);

/**
 * POST /api/auth/logout
 * Cierra sesión
 * Protegido
 */
router.post(
  '/logout',
  authenticate,
  auditarAutenticacion,
  authController.logout.bind(authController)
);

/**
 * GET /api/auth/me
 * Obtiene información del usuario autenticado
 * Protegido
 */
router.get(
  '/me',
  authenticate,
  authController.me.bind(authController)
);

/**
 * POST /api/auth/forgot-password
 * Solicita recuperación de contraseña
 * Público
 */
router.post(
  '/forgot-password',
  validate(ForgotPasswordDTO),
  authController.forgotPassword.bind(authController)
);

/**
 * POST /api/auth/reset-password
 * Resetea la contraseña
 * Público (pero requiere token válido)
 */
router.post(
  '/reset-password',
  validate(ResetPasswordDTO),
  authController.resetPassword.bind(authController)
);

/**
 * POST /api/auth/change-password
 * Cambia la contraseña del usuario autenticado
 * Protegido
 */
router.post(
  '/change-password',
  authenticate,
  validate(ChangePasswordDTO),
  authController.changePassword.bind(authController)
);

export default router;

