/**
 * Controlador de OTP
 * Maneja las peticiones HTTP relacionadas con códigos OTP
 */

import { Request, Response } from 'express';
import { otpService } from './otp.service';
import { logger } from '@config/logger';
import {
  GenerarOTPDTO,
  VerificarOTPDTO,
  SolicitarOTPRegistroDTO,
  VerificarOTPRegistroDTO,
} from './otp.dto';

export class OTPController {
  /**
   * POST /api/auth/otp/generar
   * Genera y envía un código OTP
   */
  async generarOTP(req: Request, res: Response): Promise<void> {
    try {
      const data = GenerarOTPDTO.parse(req.body);

      const resultado = await otpService.generarYEnviarOTP({
        usuarioId: data.usuarioId,
        tipo: data.tipo,
        proposito: data.proposito,
        destinatario: data.destinatario,
      });

      if (!resultado.success) {
        res.status(400).json({
          success: false,
          message: resultado.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: resultado.message,
      });
    } catch (error: any) {
      logger.error('Error en generarOTP:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al generar código OTP',
      });
    }
  }

  /**
   * POST /api/auth/otp/verificar
   * Verifica un código OTP
   */
  async verificarOTP(req: Request, res: Response): Promise<void> {
    try {
      const data = VerificarOTPDTO.parse(req.body);

      const resultado = await otpService.verificarOTP({
        usuarioId: data.usuarioId,
        codigo: data.codigo,
        proposito: data.proposito,
      });

      if (!resultado.success) {
        res.status(400).json({
          success: false,
          message: resultado.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: resultado.message,
      });
    } catch (error: any) {
      logger.error('Error en verificarOTP:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al verificar código OTP',
      });
    }
  }

  /**
   * POST /api/auth/otp/solicitar-registro
   * Solicita un OTP para registro (sin usuario creado aún)
   */
  async solicitarOTPRegistro(req: Request, res: Response): Promise<void> {
    try {
      SolicitarOTPRegistroDTO.parse(req.body);

      // Crear un "usuario temporal" o usar el email como identificador
      // Por ahora, retornamos un mensaje indicando que se debe implementar
      // la lógica según el flujo de registro deseado

      res.status(200).json({
        success: true,
        message: 'Funcionalidad en desarrollo. Usar flujo de registro estándar por ahora.',
      });
    } catch (error: any) {
      logger.error('Error en solicitarOTPRegistro:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al solicitar código OTP',
      });
    }
  }

  /**
   * POST /api/auth/otp/verificar-registro
   * Verifica un OTP para registro
   */
  async verificarOTPRegistro(req: Request, res: Response): Promise<void> {
    try {
      VerificarOTPRegistroDTO.parse(req.body);

      // Implementar lógica según flujo de registro
      res.status(200).json({
        success: true,
        message: 'Funcionalidad en desarrollo. Usar flujo de registro estándar por ahora.',
      });
    } catch (error: any) {
      logger.error('Error en verificarOTPRegistro:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al verificar código OTP',
      });
    }
  }
}

export const otpController = new OTPController();
