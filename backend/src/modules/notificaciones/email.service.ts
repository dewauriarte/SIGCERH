/**
 * Servicio de envío de emails
 * Utiliza Nodemailer con Gmail SMTP
 */

import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '@config/logger';
import { ResultadoEnvio } from './types';

export class EmailService {
  private transporter: Transporter;
  private readonly MAX_REINTENTOS = 3;
  private readonly DELAY_BASE = 1000; // 1 segundo

  constructor() {
    // Configurar transporter con Gmail SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Validar conexión SMTP en startup
   */
  async validarConexion(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('✓ Conexión SMTP verificada exitosamente');
      return true;
    } catch (error: any) {
      logger.error(`✗ Error al verificar conexión SMTP: ${error.message}`);
      return false;
    }
  }

  /**
   * Enviar email con retry logic
   */
  async enviarEmail(
    destinatario: string,
    asunto: string,
    html: string,
    intento: number = 1
  ): Promise<ResultadoEnvio> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || `SIGCERH <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: asunto,
        html,
      });

      logger.info(`Email enviado exitosamente a ${destinatario} (Message ID: ${info.messageId})`);

      return {
        exito: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      logger.error(`Error al enviar email a ${destinatario} (intento ${intento}): ${error.message}`);

      // Reintentar si no se alcanzó el máximo
      if (intento < this.MAX_REINTENTOS) {
        const delay = this.DELAY_BASE * Math.pow(2, intento - 1); // Delay exponencial
        logger.info(`Reintentando en ${delay}ms...`);

        await this.sleep(delay);
        return this.enviarEmail(destinatario, asunto, html, intento + 1);
      }

      // Máximo de reintentos alcanzado
      return {
        exito: false,
        error: error.message,
      };
    }
  }

  /**
   * Helper para delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cerrar conexión
   */
  async cerrar(): Promise<void> {
    this.transporter.close();
    logger.info('Conexión SMTP cerrada');
  }
}

export const emailService = new EmailService();

