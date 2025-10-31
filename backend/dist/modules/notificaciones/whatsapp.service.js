import ExcelJS from 'exceljs';
import { logger } from '@config/logger';
import { notificacionService } from './notificacion.service';
import { CanalNotificacion } from './types';
export class WhatsAppService {
    BASE_URL = 'https://wa.me';
    CODIGO_PAIS = '51';
    generarEnlaceWhatsApp(telefono, mensaje) {
        const telefonoLimpio = telefono.replace(/\D/g, '');
        const telefonoCompleto = telefonoLimpio.startsWith(this.CODIGO_PAIS)
            ? telefonoLimpio
            : `${this.CODIGO_PAIS}${telefonoLimpio}`;
        const mensajeEncoded = encodeURIComponent(mensaje);
        const url = `${this.BASE_URL}/${telefonoCompleto}?text=${mensajeEncoded}`;
        return url;
    }
    async generarListadoPendientes() {
        const listado = await notificacionService.generarListadoManual(CanalNotificacion.WHATSAPP);
        const enlaces = listado
            .filter((item) => item.telefono)
            .map((item) => {
            let datos = {};
            try {
                datos = JSON.parse(item.mensaje);
            }
            catch {
                datos = {};
            }
            const mensaje = this.generarMensaje(item.tipo, datos);
            const url = this.generarEnlaceWhatsApp(item.telefono, mensaje);
            return {
                telefono: item.telefono,
                nombre: item.nombreEstudiante,
                mensaje,
                url,
            };
        });
        logger.info(`Generados ${enlaces.length} enlaces de WhatsApp`);
        return enlaces;
    }
    generarMensaje(tipo, datos) {
        const mensajes = {
            ACTA_ENCONTRADA: `Hola ${datos.nombreEstudiante || ''}! 📄\n\n¡Buenas noticias! Encontramos su acta en nuestro archivo.\n\nCódigo: ${datos.codigoSeguimiento || ''}\n\nPara continuar, realice el pago de S/ ${datos.monto || '15.00'}:\n• Yape/Plin\n• Efectivo en ventanilla\n\nIngrese a la plataforma para más detalles.`,
            CERTIFICADO_EMITIDO: `Hola ${datos.nombreEstudiante || ''}! 🎓\n\n¡Su certificado está listo!\n\nCódigo de verificación: ${datos.codigoVirtual || ''}\n\nDescárguelo desde la plataforma: ${datos.urlDescarga || ''}\n\nConserve el código para verificaciones futuras.`,
        };
        return mensajes[tipo] || `Notificación de SIGCERH para ${datos.nombreEstudiante || 'usted'}`;
    }
    async exportarCSV(notificaciones) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'SIGCERH';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet('Notificaciones WhatsApp');
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 36 },
            { header: 'Tipo', key: 'tipo', width: 20 },
            { header: 'Estudiante', key: 'estudiante', width: 40 },
            { header: 'Teléfono', key: 'telefono', width: 15 },
            { header: 'Expediente', key: 'expediente', width: 20 },
            { header: 'Mensaje', key: 'mensaje', width: 60 },
            { header: 'Enlace WhatsApp', key: 'enlace', width: 80 },
            { header: 'Fecha Creación', key: 'fecha', width: 20 },
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF667EEA' },
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        for (const notif of notificaciones) {
            let datos = {};
            try {
                datos = JSON.parse(notif.mensaje);
            }
            catch {
                datos = {};
            }
            const mensaje = this.generarMensaje(notif.tipo, datos);
            const url = notif.telefono ? this.generarEnlaceWhatsApp(notif.telefono, mensaje) : 'N/A';
            worksheet.addRow({
                id: notif.id,
                tipo: notif.tipo,
                estudiante: notif.nombreEstudiante,
                telefono: notif.telefono || 'N/A',
                expediente: notif.numeroExpediente || 'N/A',
                mensaje,
                enlace: url,
                fecha: notif.fechaCreacion ? new Date(notif.fechaCreacion).toLocaleString('es-PE') : '',
            });
        }
        worksheet.autoFilter = {
            from: 'A1',
            to: 'H1',
        };
        logger.info(`CSV de WhatsApp generado con ${notificaciones.length} registros`);
        return workbook;
    }
    async marcarComoEnviada(notificacionId, usuarioId) {
        return await notificacionService.marcarComoEnviadaManual(notificacionId, usuarioId);
    }
}
export const whatsappService = new WhatsAppService();
//# sourceMappingURL=whatsapp.service.js.map