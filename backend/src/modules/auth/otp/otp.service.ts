/**
 * Servicio de OTP (One-Time Password)
 * Genera y verifica códigos OTP para autenticación
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { emailService } from '@modules/notificaciones/email.service';
import {
  GenerarOTPRequest,
  VerificarOTPRequest,
  OTPConfig,
  OTPTipo,
  OTPProposito,
} from './otp.types';
import {
  generarCodigoOTP,
  hashearOTP,
  compararOTP,
  calcularExpiracion,
  haExpirado,
  formatearCodigo,
} from './otp.utils';

const prisma = new PrismaClient();

// Configuración por defecto
const DEFAULT_CONFIG: OTPConfig = {
  longitudCodigo: 6,
  expiracionMinutos: 10,
  maxIntentos: 5,
  cooldownSegundos: 60,
};

export class OTPService {
  private config: OTPConfig;

  constructor(config?: Partial<OTPConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Genera y envía un código OTP
   */
  async generarYEnviarOTP(request: GenerarOTPRequest): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar cooldown - No permitir generar otro OTP muy rápido
      const otpReciente = await prisma.$queryRaw<any[]>`
        SELECT * FROM otp 
        WHERE usuario_id = ${request.usuarioId}
        AND proposito = ${request.proposito}
        AND creado_en > NOW() - INTERVAL '${this.config.cooldownSegundos} seconds'
        ORDER BY creado_en DESC
        LIMIT 1
      `;

      if (otpReciente && otpReciente.length > 0) {
        const segundosRestantes = Math.ceil(
          this.config.cooldownSegundos - 
          (Date.now() - new Date(otpReciente[0].creado_en).getTime()) / 1000
        );
        
        return {
          success: false,
          message: `Debes esperar ${segundosRestantes} segundos antes de solicitar otro código`,
        };
      }

      // Invalidar OTPs anteriores del mismo propósito
      await prisma.$executeRaw`
        UPDATE otp 
        SET usado = true 
        WHERE usuario_id = ${request.usuarioId}
        AND proposito = ${request.proposito}
        AND usado = false
      `;

      // Generar código OTP
      const codigo = generarCodigoOTP(this.config.longitudCodigo);
      const codigoHash = await hashearOTP(codigo);
      const fechaExpiracion = calcularExpiracion(this.config.expiracionMinutos);

      // Guardar en base de datos
      await prisma.$executeRaw`
        INSERT INTO otp (usuario_id, codigo_hash, tipo, proposito, intentos, usado, expira_en, creado_en)
        VALUES (
          ${request.usuarioId},
          ${codigoHash},
          ${request.tipo},
          ${request.proposito},
          0,
          false,
          ${fechaExpiracion},
          NOW()
        )
      `;

      // Enviar código según el tipo
      if (request.tipo === OTPTipo.EMAIL) {
        await this.enviarOTPPorEmail(request.destinatario, codigo, request.proposito);
      } else if (request.tipo === OTPTipo.SMS) {
        // TODO: Implementar envío por SMS con Phone.Email o Twilio
        throw new Error('Envío de OTP por SMS no implementado aún');
      }

      logger.info(`OTP generado para usuario ${request.usuarioId} (${request.proposito})`);

      return {
        success: true,
        message: 'Código de verificación enviado exitosamente',
      };
    } catch (error: any) {
      logger.error('Error al generar OTP:', error);
      throw new Error('Error al generar código de verificación');
    }
  }

  /**
   * Verifica un código OTP
   */
  async verificarOTP(request: VerificarOTPRequest): Promise<{ success: boolean; message: string }> {
    try {
      // Buscar OTP válido
      const otps = await prisma.$queryRaw<any[]>`
        SELECT * FROM otp 
        WHERE usuario_id = ${request.usuarioId}
        AND proposito = ${request.proposito}
        AND usado = false
        ORDER BY creado_en DESC
        LIMIT 1
      `;

      if (!otps || otps.length === 0) {
        return {
          success: false,
          message: 'Código de verificación no encontrado o ya fue usado',
        };
      }

      const otp = otps[0];

      // Verificar expiración
      if (haExpirado(new Date(otp.expira_en))) {
        await prisma.$executeRaw`
          UPDATE otp SET usado = true WHERE id = ${otp.id}
        `;
        
        return {
          success: false,
          message: 'El código de verificación ha expirado',
        };
      }

      // Verificar intentos máximos
      if (otp.intentos >= this.config.maxIntentos) {
        await prisma.$executeRaw`
          UPDATE otp SET usado = true WHERE id = ${otp.id}
        `;
        
        return {
          success: false,
          message: 'Máximo de intentos excedido. Solicita un nuevo código',
        };
      }

      // Incrementar intentos
      await prisma.$executeRaw`
        UPDATE otp SET intentos = intentos + 1 WHERE id = ${otp.id}
      `;

      // Verificar código
      const codigoValido = await compararOTP(request.codigo, otp.codigo_hash);

      if (!codigoValido) {
        const intentosRestantes = this.config.maxIntentos - (otp.intentos + 1);
        
        return {
          success: false,
          message: `Código incorrecto. Te quedan ${intentosRestantes} intentos`,
        };
      }

      // Marcar como usado
      await prisma.$executeRaw`
        UPDATE otp SET usado = true WHERE id = ${otp.id}
      `;

      logger.info(`OTP verificado exitosamente para usuario ${request.usuarioId} (${request.proposito})`);

      return {
        success: true,
        message: 'Código verificado exitosamente',
      };
    } catch (error: any) {
      logger.error('Error al verificar OTP:', error);
      throw new Error('Error al verificar código');
    }
  }

  /**
   * Envía OTP por email usando el servicio de email existente
   */
  private async enviarOTPPorEmail(
    email: string,
    codigo: string,
    proposito: OTPProposito
  ): Promise<void> {
    const codigoFormateado = formatearCodigo(codigo);
    const asunto = this.obtenerAsuntoEmail(proposito);
    const html = this.generarHTMLEmail(codigo, codigoFormateado, proposito);

    const resultado = await emailService.enviarEmail(email, asunto, html);

    if (!resultado.exito) {
      throw new Error(`Error al enviar email: ${resultado.error}`);
    }
  }

  /**
   * Obtiene el asunto del email según el propósito
   */
  private obtenerAsuntoEmail(proposito: OTPProposito): string {
    const asuntos: Record<OTPProposito, string> = {
      [OTPProposito.REGISTRO]: 'Código de verificación - Registro',
      [OTPProposito.LOGIN]: 'Código de verificación - Inicio de sesión',
      [OTPProposito.RECUPERACION_PASSWORD]: 'Código de verificación - Recuperación de contraseña',
      [OTPProposito.CAMBIO_EMAIL]: 'Código de verificación - Cambio de email',
      [OTPProposito.CAMBIO_TELEFONO]: 'Código de verificación - Cambio de teléfono',
      [OTPProposito.VERIFICACION_2FA]: 'Código de verificación - Autenticación 2FA',
    };

    return asuntos[proposito] || 'Código de verificación - SIGCERH';
  }

  /**
   * Genera el HTML del email con el código OTP
   */
  private generarHTMLEmail(
    _codigo: string,
    codigoFormateado: string,
    proposito: OTPProposito
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Verificación</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">SIGCERH</h1>
          <p style="color: #f0f0f0; margin: 5px 0 0 0;">Sistema de Gestión de Certificados</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h2 style="color: #667eea; margin-top: 0;">Código de Verificación</h2>
          
          <p>Has solicitado un código de verificación para: <strong>${this.obtenerDescripcionProposito(proposito)}</strong></p>
          
          <div style="background-color: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Tu código es:</p>
            <p style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 0;">
              ${codigoFormateado}
            </p>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Importante:</strong><br>
              • Este código expira en ${this.config.expiracionMinutos} minutos<br>
              • No compartas este código con nadie<br>
              • Si no solicitaste este código, ignora este mensaje
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Si tienes problemas, contacta al soporte técnico.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Este es un email automático, por favor no respondas a este mensaje.<br>
            © ${new Date().getFullYear()} SIGCERH - Todos los derechos reservados
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Obtiene la descripción del propósito
   */
  private obtenerDescripcionProposito(proposito: OTPProposito): string {
    const descripciones: Record<OTPProposito, string> = {
      [OTPProposito.REGISTRO]: 'completar tu registro',
      [OTPProposito.LOGIN]: 'iniciar sesión',
      [OTPProposito.RECUPERACION_PASSWORD]: 'recuperar tu contraseña',
      [OTPProposito.CAMBIO_EMAIL]: 'cambiar tu email',
      [OTPProposito.CAMBIO_TELEFONO]: 'cambiar tu teléfono',
      [OTPProposito.VERIFICACION_2FA]: 'autenticación de dos factores',
    };

    return descripciones[proposito] || 'verificar tu identidad';
  }

  /**
   * Limpia OTPs expirados (ejecutar periódicamente)
   */
  async limpiarOTPsExpirados(): Promise<number> {
    try {
      const resultado = await prisma.$executeRaw`
        DELETE FROM otp 
        WHERE expira_en < NOW() 
        OR (usado = true AND creado_en < NOW() - INTERVAL '7 days')
      `;

      logger.info(`Limpiados ${resultado} OTPs expirados`);
      return resultado as number;
    } catch (error: any) {
      logger.error('Error al limpiar OTPs expirados:', error);
      return 0;
    }
  }
}

export const otpService = new OTPService();
