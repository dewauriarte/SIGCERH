/**
 * Servicio de plantillas de email
 * Utiliza Handlebars para renderizar HTML
 */

import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '@config/logger';
import { TipoNotificacion, DatosNotificacion } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TemplateService {
  private templatesDir: string;
  private baseTemplate: HandlebarsTemplateDelegate | null = null;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.templatesDir = path.join(__dirname, 'templates');
    this.cargarPlantillas();
  }

  /**
   * Cargar y compilar todas las plantillas
   */
  private cargarPlantillas(): void {
    try {
      // Cargar plantilla base
      const basePath = path.join(this.templatesDir, 'base.hbs');
      const baseContent = fs.readFileSync(basePath, 'utf-8');
      this.baseTemplate = Handlebars.compile(baseContent);

      // Cargar plantillas específicas
      const templates = [
        { tipo: TipoNotificacion.SOLICITUD_RECIBIDA, archivo: 'solicitud-recibida.hbs' },
        { tipo: TipoNotificacion.PAGO_RECIBIDO, archivo: 'pago-recibido.hbs' },
        { tipo: TipoNotificacion.CERTIFICADO_LISTO, archivo: 'certificado-listo.hbs' },
        { tipo: TipoNotificacion.SOLICITUD_DERIVADA, archivo: 'solicitud-derivada.hbs' },
        { tipo: TipoNotificacion.ACTA_ENCONTRADA, archivo: 'acta-encontrada.hbs' },
        { tipo: TipoNotificacion.ACTA_NO_ENCONTRADA, archivo: 'acta-no-encontrada.hbs' },
        { tipo: TipoNotificacion.CERTIFICADO_EMITIDO, archivo: 'certificado-emitido.hbs' },
      ];

      for (const { tipo, archivo } of templates) {
        const templatePath = path.join(this.templatesDir, archivo);
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        this.templates.set(tipo, Handlebars.compile(templateContent));
      }

      logger.info(`✓ ${this.templates.size} plantillas de email cargadas`);
    } catch (error: any) {
      logger.error(`Error al cargar plantillas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Renderizar plantilla de email
   */
  renderizarPlantilla(tipo: TipoNotificacion, datos: DatosNotificacion): string {
    const template = this.templates.get(tipo);

    if (!template) {
      throw new Error(`Plantilla no encontrada para tipo: ${tipo}`);
    }

    if (!this.baseTemplate) {
      throw new Error('Plantilla base no cargada');
    }

    // Renderizar contenido específico
    const body = template(datos);

    // Renderizar en plantilla base
    const html = this.baseTemplate({
      asunto: this.obtenerAsunto(tipo),
      body,
    });

    return html;
  }

  /**
   * Obtener asunto según tipo de notificación
   */
  private obtenerAsunto(tipo: TipoNotificacion): string {
    const asuntos: Record<TipoNotificacion, string> = {
      [TipoNotificacion.SOLICITUD_RECIBIDA]: 'Nueva solicitud recibida',
      [TipoNotificacion.PAGO_RECIBIDO]: 'Pago recibido para validación',
      [TipoNotificacion.CERTIFICADO_LISTO]: 'Certificado listo para entrega',
      [TipoNotificacion.SOLICITUD_DERIVADA]: 'Solicitud asignada a usted',
      [TipoNotificacion.ACTA_ENCONTRADA]: 'Acta encontrada - Proceda con el pago',
      [TipoNotificacion.ACTA_NO_ENCONTRADA]: 'Acta no encontrada',
      [TipoNotificacion.CERTIFICADO_PENDIENTE_VALIDACION]: 'Certificado pendiente de validación',
      [TipoNotificacion.CERTIFICADO_OBSERVADO]: 'Certificado observado por UGEL',
      [TipoNotificacion.CERTIFICADO_EMITIDO]: 'Su certificado está listo para descarga',
    };

    return asuntos[tipo] || 'Notificación SIGCERH';
  }

  /**
   * Obtener asunto público (para usar en envío de email)
   */
  getAsunto(tipo: TipoNotificacion): string {
    return this.obtenerAsunto(tipo);
  }
}

export const templateService = new TemplateService();

