/**
 * Servicio de WhatsApp
 * Generación de enlaces wa.me y listados para envío manual
 */

import ExcelJS from 'exceljs';
import { logger } from '@config/logger';
import { notificacionService } from './notificacion.service';
import { CanalNotificacion } from './types';
import type { EnlaceWhatsApp } from './types';

export class WhatsAppService {
  private readonly BASE_URL = 'https://wa.me';
  private readonly CODIGO_PAIS = '51'; // Perú

  /**
   * Generar enlace de WhatsApp con mensaje pre-llenado
   */
  generarEnlaceWhatsApp(telefono: string, mensaje: string): string {
    // Limpiar teléfono (solo números)
    const telefonoLimpio = telefono.replace(/\D/g, '');

    // Agregar código de país si no lo tiene
    const telefonoCompleto = telefonoLimpio.startsWith(this.CODIGO_PAIS)
      ? telefonoLimpio
      : `${this.CODIGO_PAIS}${telefonoLimpio}`;

    // Encode mensaje para URL
    const mensajeEncoded = encodeURIComponent(mensaje);

    // Generar URL
    const url = `${this.BASE_URL}/${telefonoCompleto}?text=${mensajeEncoded}`;

    return url;
  }

  /**
   * Generar listado de notificaciones pendientes para WhatsApp
   */
  async generarListadoPendientes(): Promise<EnlaceWhatsApp[]> {
    const listado = await notificacionService.generarListadoManual(CanalNotificacion.WHATSAPP);

    const enlaces: EnlaceWhatsApp[] = listado
      .filter((item) => item.telefono) // Solo los que tienen teléfono
      .map((item) => {
        // Parsear datos del mensaje
        let datos: any = {};
        try {
          datos = JSON.parse(item.mensaje);
        } catch {
          datos = {};
        }

        // Generar mensaje personalizado
        const mensaje = this.generarMensaje(item.tipo, datos);

        // Generar URL de WhatsApp
        const url = this.generarEnlaceWhatsApp(item.telefono!, mensaje);

        return {
          telefono: item.telefono!,
          nombre: item.nombreEstudiante,
          mensaje,
          url,
        };
      });

    logger.info(`Generados ${enlaces.length} enlaces de WhatsApp`);

    return enlaces;
  }

  /**
   * Generar mensaje según tipo de notificación
   */
  private generarMensaje(tipo: string, datos: any): string {
    const mensajes: Record<string, string> = {
      ACTA_ENCONTRADA: `Hola ${datos.nombreEstudiante || ''}! 📄\n\n¡Buenas noticias! Encontramos su acta en nuestro archivo.\n\nCódigo: ${datos.codigoSeguimiento || ''}\n\nPara continuar, realice el pago de S/ ${datos.monto || '15.00'}:\n• Yape/Plin\n• Efectivo en ventanilla\n\nIngrese a la plataforma para más detalles.`,
      CERTIFICADO_EMITIDO: `Hola ${datos.nombreEstudiante || ''}! 🎓\n\n¡Su certificado está listo!\n\nCódigo de verificación: ${datos.codigoVirtual || ''}\n\nDescárguelo desde la plataforma: ${datos.urlDescarga || ''}\n\nConserve el código para verificaciones futuras.`,
    };

    return mensajes[tipo] || `Notificación de SIGCERH para ${datos.nombreEstudiante || 'usted'}`;
  }

  /**
   * Exportar listado a CSV
   */
  async exportarCSV(notificaciones: any[]): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SIGCERH';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Notificaciones WhatsApp');

    // Definir columnas
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

    // Estilo del header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF667EEA' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Agregar datos
    for (const notif of notificaciones) {
      // Parsear datos
      let datos: any = {};
      try {
        datos = JSON.parse(notif.mensaje);
      } catch {
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

    // Auto-filtro
    worksheet.autoFilter = {
      from: 'A1',
      to: 'H1',
    };

    logger.info(`CSV de WhatsApp generado con ${notificaciones.length} registros`);

    return workbook;
  }

  /**
   * Marcar notificación como enviada manualmente
   */
  async marcarComoEnviada(notificacionId: string, usuarioId: string) {
    return await notificacionService.marcarComoEnviadaManual(notificacionId, usuarioId);
  }
}

export const whatsappService = new WhatsAppService();

