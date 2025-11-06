/**
 * Servicio de envío de emails
 * Soporta Mailgun y SMTP tradicional (Gmail)
 */

import nodemailer, { Transporter } from 'nodemailer';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { logger } from '@config/logger';
import { ResultadoEnvio } from './types';

export class EmailService {
  private transporter?: Transporter;
  private mailgunClient?: any;
  private useMailgun: boolean = false;
  private readonly MAX_REINTENTOS = 3;
  private readonly DELAY_BASE = 1000; // 1 segundo

  constructor() {
    // Verificar si usar Mailgun o SMTP tradicional
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      this.initMailgun();
    } else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.initSMTP();
    } else {
      logger.warn('⚠ No se configuró ningún servicio de email (ni Mailgun ni SMTP)');
    }
  }

  /**
   * Inicializar Mailgun
   */
  private initMailgun(): void {
    try {
      const mailgun = new Mailgun(formData);
      this.mailgunClient = mailgun.client({
        username: 'api',
        key: process.env.MAILGUN_API_KEY!,
      });
      this.useMailgun = true;
      logger.info('✓ Servicio de email configurado: Mailgun');
    } catch (error: any) {
      logger.error(`Error al inicializar Mailgun: ${error.message}`);
      logger.warn('Cambiando a SMTP tradicional...');
      this.initSMTP();
    }
  }

  /**
   * Inicializar SMTP tradicional
   */
  private initSMTP(): void {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    this.useMailgun = false;
    logger.info('✓ Servicio de email configurado: SMTP');
  }

  /**
   * Validar conexión en startup
   */
  async validarConexion(): Promise<boolean> {
    try {
      if (this.useMailgun) {
        // Mailgun no requiere validación de conexión previa
        // Solo verificar que las credenciales existan
        if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
          throw new Error('Credenciales de Mailgun no configuradas');
        }
        logger.info('✓ Conexión Mailgun verificada exitosamente');
        return true;
      } else if (this.transporter) {
        await this.transporter.verify();
        logger.info('✓ Conexión SMTP verificada exitosamente');
        return true;
      } else {
        logger.warn('⚠ No hay servicio de email configurado');
        return false;
      }
    } catch (error: any) {
      logger.error(`✗ Error al verificar conexión de email: ${error.message}`);
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
      if (this.useMailgun) {
        return await this.enviarConMailgun(destinatario, asunto, html, intento);
      } else if (this.transporter) {
        return await this.enviarConSMTP(destinatario, asunto, html, intento);
      } else {
        throw new Error('No hay servicio de email configurado');
      }
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
   * Enviar con Mailgun
   */
  private async enviarConMailgun(
    destinatario: string,
    asunto: string,
    html: string,
    intento: number
  ): Promise<ResultadoEnvio> {
    try {
      const messageData = {
        from: process.env.MAILGUN_FROM || `SIGCERH <noreply@${process.env.MAILGUN_DOMAIN}>`,
        to: destinatario,
        subject: asunto,
        html: html,
      };

      const response = await this.mailgunClient.messages.create(
        process.env.MAILGUN_DOMAIN!,
        messageData
      );

      logger.info(`Email enviado exitosamente a ${destinatario} vía Mailgun (ID: ${response.id})`);

      return {
        exito: true,
        messageId: response.id,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Enviar con SMTP tradicional
   */
  private async enviarConSMTP(
    destinatario: string,
    asunto: string,
    html: string,
    intento: number
  ): Promise<ResultadoEnvio> {
    try {
      const info = await this.transporter!.sendMail({
        from: process.env.SMTP_FROM || `SIGCERH <${process.env.SMTP_USER}>`,
        to: destinatario,
        subject: asunto,
        html,
      });

      logger.info(`Email enviado exitosamente a ${destinatario} vía SMTP (Message ID: ${info.messageId})`);

      return {
        exito: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      throw error;
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
    if (this.transporter) {
      this.transporter.close();
      logger.info('Conexión SMTP cerrada');
    }
  }
}

export const emailService = new EmailService();
