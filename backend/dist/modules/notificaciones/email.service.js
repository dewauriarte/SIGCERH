import nodemailer from 'nodemailer';
import { logger } from '@config/logger';
export class EmailService {
    transporter;
    MAX_REINTENTOS = 3;
    DELAY_BASE = 1000;
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    async validarConexion() {
        try {
            await this.transporter.verify();
            logger.info('✓ Conexión SMTP verificada exitosamente');
            return true;
        }
        catch (error) {
            logger.error(`✗ Error al verificar conexión SMTP: ${error.message}`);
            return false;
        }
    }
    async enviarEmail(destinatario, asunto, html, intento = 1) {
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
        }
        catch (error) {
            logger.error(`Error al enviar email a ${destinatario} (intento ${intento}): ${error.message}`);
            if (intento < this.MAX_REINTENTOS) {
                const delay = this.DELAY_BASE * Math.pow(2, intento - 1);
                logger.info(`Reintentando en ${delay}ms...`);
                await this.sleep(delay);
                return this.enviarEmail(destinatario, asunto, html, intento + 1);
            }
            return {
                exito: false,
                error: error.message,
            };
        }
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async cerrar() {
        this.transporter.close();
        logger.info('Conexión SMTP cerrada');
    }
}
export const emailService = new EmailService();
//# sourceMappingURL=email.service.js.map