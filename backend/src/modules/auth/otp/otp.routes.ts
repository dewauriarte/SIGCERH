/**
 * Rutas de OTP
 */

import { Router } from 'express';
import { otpController } from './otp.controller';
import { authenticate } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validation.middleware';
import {
  GenerarOTPDTO,
  VerificarOTPDTO,
  SolicitarOTPRegistroDTO,
  VerificarOTPRegistroDTO,
} from './otp.dto';

const router = Router();

/**
 * @route   POST /api/auth/otp/generar
 * @desc    Genera y envía un código OTP
 * @access  Privado (requiere autenticación)
 */
router.post(
  '/generar',
  authenticate,
  validateRequest(GenerarOTPDTO),
  otpController.generarOTP.bind(otpController)
);

/**
 * @route   POST /api/auth/otp/verificar
 * @desc    Verifica un código OTP
 * @access  Privado (requiere autenticación)
 */
router.post(
  '/verificar',
  authenticate,
  validateRequest(VerificarOTPDTO),
  otpController.verificarOTP.bind(otpController)
);

/**
 * @route   POST /api/auth/otp/solicitar-registro
 * @desc    Solicita un OTP para registro (público)
 * @access  Público
 */
router.post(
  '/solicitar-registro',
  validateRequest(SolicitarOTPRegistroDTO),
  otpController.solicitarOTPRegistro.bind(otpController)
);

/**
 * @route   POST /api/auth/otp/verificar-registro
 * @desc    Verifica un OTP para registro (público)
 * @access  Público
 */
router.post(
  '/verificar-registro',
  validateRequest(VerificarOTPRegistroDTO),
  otpController.verificarOTPRegistro.bind(otpController)
);

export default router;
