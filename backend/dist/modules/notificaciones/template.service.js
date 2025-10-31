import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '@config/logger';
import { TipoNotificacion } from './types';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class TemplateService {
    templatesDir;
    baseTemplate = null;
    templates = new Map();
    constructor() {
        this.templatesDir = path.join(__dirname, 'templates');
        this.cargarPlantillas();
    }
    cargarPlantillas() {
        try {
            const basePath = path.join(this.templatesDir, 'base.hbs');
            const baseContent = fs.readFileSync(basePath, 'utf-8');
            this.baseTemplate = Handlebars.compile(baseContent);
            const templates = [
                { tipo: TipoNotificacion.ACTA_ENCONTRADA, archivo: 'acta-encontrada.hbs' },
                { tipo: TipoNotificacion.CERTIFICADO_EMITIDO, archivo: 'certificado-emitido.hbs' },
            ];
            for (const { tipo, archivo } of templates) {
                const templatePath = path.join(this.templatesDir, archivo);
                const templateContent = fs.readFileSync(templatePath, 'utf-8');
                this.templates.set(tipo, Handlebars.compile(templateContent));
            }
            logger.info(`✓ ${this.templates.size} plantillas de email cargadas`);
        }
        catch (error) {
            logger.error(`Error al cargar plantillas: ${error.message}`);
            throw error;
        }
    }
    renderizarPlantilla(tipo, datos) {
        const template = this.templates.get(tipo);
        if (!template) {
            throw new Error(`Plantilla no encontrada para tipo: ${tipo}`);
        }
        if (!this.baseTemplate) {
            throw new Error('Plantilla base no cargada');
        }
        const body = template(datos);
        const html = this.baseTemplate({
            asunto: this.obtenerAsunto(tipo),
            body,
        });
        return html;
    }
    obtenerAsunto(tipo) {
        const asuntos = {
            [TipoNotificacion.ACTA_ENCONTRADA]: 'Acta encontrada - Proceda con el pago',
            [TipoNotificacion.CERTIFICADO_EMITIDO]: 'Su certificado está listo para descarga',
        };
        return asuntos[tipo] || 'Notificación SIGCERH';
    }
    getAsunto(tipo) {
        return this.obtenerAsunto(tipo);
    }
}
export const templateService = new TemplateService();
//# sourceMappingURL=template.service.js.map