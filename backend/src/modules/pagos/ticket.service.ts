/**
 * Servicio de Generación de Tickets de Pago
 * Genera documentos PDF para comprobantes de pago
 */

import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { logger } from '@config/logger';

const prisma = new PrismaClient();

export class TicketService {
  /**
   * Generar ticket de pago en PDF
   */
  async generarTicketPago(pagoId: string): Promise<Buffer> {
    // Obtener datos del pago
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        solicitud: {
          include: {
            estudiante: true,
            tiposolicitud: true,
          },
        },
        configuracioninstitucion: true,
      },
    });

    if (!pago) {
      throw new Error('Pago no encontrado');
    }

    const solicitud = pago.solicitud[0]; // Tomar la primera solicitud

    // Crear documento PDF
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: [226.77, 650], // 80mm ancho x altura ajustada
          margins: { top: 15, bottom: 15, left: 12, right: 12 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        const width = 226.77;
        const leftMargin = 12;
        const rightMargin = width - 12;

        // ============================================================================
        // ENCABEZADO ELEGANTE
        // ============================================================================
        doc.fontSize(14).font('Helvetica-Bold').text('SIGCERH', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').text('Sistema de Gestión de Certificados', { align: 'center' });
        doc.fontSize(8).text('de Estudios de Recursos Humanos', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(7).font('Helvetica-Oblique').text('UGEL Ferreñafe - Lambayeque', { align: 'center' });
        doc.moveDown(0.8);

        // Línea doble decorativa
        doc.moveTo(leftMargin, doc.y).lineTo(rightMargin, doc.y).stroke();
        doc.moveDown(0.1);
        doc.moveTo(leftMargin, doc.y).lineTo(rightMargin, doc.y).stroke();
        doc.moveDown(0.8);

        // ============================================================================
        // TÍTULO DEL DOCUMENTO
        // ============================================================================
        const estadoLabels: Record<string, string> = {
          PENDIENTE: 'ORDEN DE PAGO',
          PAGADO: 'COMPROBANTE DE PAGO',
          VALIDADO: 'COMPROBANTE VALIDADO',
          RECHAZADO: 'COMPROBANTE RECHAZADO',
        };
        
        const titulo = pago.estado ? (estadoLabels[pago.estado] || 'COMPROBANTE DE PAGO') : 'COMPROBANTE DE PAGO';
        doc.fontSize(11).font('Helvetica-Bold').text(titulo, { align: 'center' });
        doc.moveDown(0.5);
        
        // Número de orden destacado
        doc.fontSize(10).font('Helvetica-Bold').text(`N° ${pago.numeroorden}`, { align: 'center' });
        doc.moveDown(0.8);

        // ============================================================================
        // INFORMACIÓN DEL PAGO - DESTACADA
        // ============================================================================
        doc.rect(leftMargin, doc.y, rightMargin - leftMargin, 55).fillAndStroke('#f0f0f0', '#000000');
        
        const boxTop = doc.y + 5;
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000').text('MONTO A PAGAR:', leftMargin + 5, boxTop);
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#d32f2f').text(
          `S/ ${Number(pago.monto).toFixed(2)}`,
          leftMargin + 5,
          boxTop + 12
        );
        
        doc.fontSize(7).font('Helvetica').fillColor('#000000').text(
          `Método: ${this.formatMetodoPago(pago.metodopago || 'N/A')}`,
          leftMargin + 5,
          boxTop + 32
        );
        doc.text(
          `Estado: ${this.formatEstadoPago(pago.estado || 'PENDIENTE')}`,
          leftMargin + 5,
          boxTop + 42
        );

        doc.y = boxTop + 60;
        
        // ============================================================================
        // DATOS DEL EXPEDIENTE
        // ============================================================================
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000').text('━━━ DATOS DEL EXPEDIENTE ━━━');
        doc.moveDown(0.3);
        doc.fontSize(7).font('Helvetica');
        
        if (solicitud) {
          doc.font('Helvetica-Bold').text('Expediente: ', { continued: true });
          doc.font('Helvetica').text(solicitud.numeroexpediente || 'N/A');
          
          if (solicitud.numeroseguimiento) {
            doc.font('Helvetica-Bold').text('Seguimiento: ', { continued: true });
            doc.font('Helvetica').text(solicitud.numeroseguimiento);
          }
          
          if (solicitud.tiposolicitud) {
            doc.font('Helvetica-Bold').text('Servicio: ', { continued: true });
            doc.font('Helvetica').text(solicitud.tiposolicitud.nombre);
          }
        }
        
        doc.moveDown(0.8);

        // ============================================================================
        // DATOS DEL SOLICITANTE
        // ============================================================================
        if (solicitud?.estudiante) {
          doc.fontSize(8).font('Helvetica-Bold').text('━━━ DATOS DEL SOLICITANTE ━━━');
          doc.moveDown(0.3);
          doc.fontSize(7).font('Helvetica');
          
          const nombreCompleto = `${solicitud.estudiante.apellidopaterno} ${solicitud.estudiante.apellidomaterno}, ${solicitud.estudiante.nombres}`;
          doc.font('Helvetica-Bold').text('Nombres: ', { continued: true });
          doc.font('Helvetica').text(nombreCompleto, { width: rightMargin - leftMargin - 5 });
          
          doc.font('Helvetica-Bold').text('DNI: ', { continued: true });
          doc.font('Helvetica').text(solicitud.estudiante.dni);
          
          if (solicitud.estudiante.telefono) {
            doc.font('Helvetica-Bold').text('Teléfono: ', { continued: true });
            doc.font('Helvetica').text(solicitud.estudiante.telefono);
          }
          
          doc.moveDown(0.8);
        }

        // ============================================================================
        // DETALLES ADICIONALES DEL PAGO
        // ============================================================================
        doc.fontSize(8).font('Helvetica-Bold').text('━━━ INFORMACIÓN DEL PAGO ━━━');
        doc.moveDown(0.3);
        doc.fontSize(7).font('Helvetica');
        
        const fechaFormateada = new Date(pago.fechapago || pago.fecharegistro).toLocaleString('es-PE', {
          dateStyle: 'full',
          timeStyle: 'short'
        });
        doc.font('Helvetica-Bold').text('Fecha Generación: ', { continued: true });
        doc.font('Helvetica').text(fechaFormateada, { width: rightMargin - leftMargin - 5 });
        
        if (pago.numerooperacion) {
          doc.font('Helvetica-Bold').text('N° Operación: ', { continued: true });
          doc.font('Helvetica').text(pago.numerooperacion);
        }
        
        if (pago.numerorecibo) {
          doc.font('Helvetica-Bold').text('N° Recibo: ', { continued: true });
          doc.font('Helvetica').text(pago.numerorecibo);
        }

        doc.moveDown(0.8);

        // ============================================================================
        // ESTADO Y MENSAJE IMPORTANTE
        // ============================================================================
        doc.moveTo(leftMargin, doc.y).lineTo(rightMargin, doc.y).stroke();
        doc.moveDown(0.5);
        
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000');
        
        if (pago.estado === 'PENDIENTE') {
          doc.fillColor('#d32f2f').text('⚠ PENDIENTE DE PAGO', { align: 'center' });
          doc.moveDown(0.3);
          doc.fontSize(6).font('Helvetica').fillColor('#000000')
            .text('Realice el pago mediante el método seleccionado.', { align: 'center' })
            .text('Suba el comprobante al sistema para validación.', { align: 'center' });
        } else if (pago.estado === 'PAGADO') {
          doc.fillColor('#ff9800').text('⏳ PAGO REGISTRADO', { align: 'center' });
          doc.moveDown(0.3);
          doc.fontSize(6).font('Helvetica').fillColor('#000000')
            .text('Su pago está en proceso de validación.', { align: 'center' })
            .text('Mesa de Partes lo revisará pronto.', { align: 'center' });
        } else if (pago.estado === 'VALIDADO') {
          doc.fillColor('#4caf50').text('✓ PAGO VALIDADO', { align: 'center' });
          doc.moveDown(0.3);
          doc.fontSize(6).font('Helvetica').fillColor('#000000')
            .text('Su trámite está siendo procesado.', { align: 'center' })
            .text('Recibirá notificaciones sobre el avance.', { align: 'center' });
        } else if (pago.estado === 'RECHAZADO') {
          doc.fillColor('#f44336').text('✗ PAGO RECHAZADO', { align: 'center' });
          doc.moveDown(0.3);
          doc.fontSize(6).font('Helvetica').fillColor('#000000')
            .text('Contacte con Mesa de Partes.', { align: 'center' });
        }
        
        doc.moveDown(0.5);
        doc.moveTo(leftMargin, doc.y).lineTo(rightMargin, doc.y).stroke();
        doc.moveDown(0.8);

        // ============================================================================
        // PIE DE PÁGINA
        // ============================================================================
        doc.fontSize(6).font('Helvetica-Oblique').fillColor('#666666')
          .text('Conserve este comprobante para cualquier consulta.', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(6).font('Helvetica-Bold').fillColor('#000000')
          .text('SIGCERH - Sistema de Certificados', { align: 'center' });
        doc.moveDown(0.2);
        doc.fontSize(5).font('Helvetica').fillColor('#666666')
          .text(`ID: ${pago.id.substring(0, 8)}...`, { align: 'center' })
          .text(`Impreso: ${new Date().toLocaleString('es-PE')}`, { align: 'center' });

        // Finalizar documento
        doc.end();

        logger.info(`Ticket generado para pago ${pago.numeroorden}`);
      } catch (error) {
        logger.error('Error generando ticket:', error);
        reject(error);
      }
    });
  }

  /**
   * Formatear método de pago para mostrar
   */
  private formatMetodoPago(metodo: string): string {
    const formatos: Record<string, string> = {
      EFECTIVO: 'Efectivo (Caja)',
      YAPE: 'Yape',
      PLIN: 'Plin',
      TARJETA: 'Tarjeta',
      AGENTE_BANCARIO: 'Agente Bancario',
    };
    return formatos[metodo] || metodo;
  }

  /**
   * Formatear estado de pago para mostrar
   */
  private formatEstadoPago(estado: string): string {
    const formatos: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      PAGADO: 'En Validación',
      VALIDADO: 'Validado',
      RECHAZADO: 'Rechazado',
      EXPIRADO: 'Expirado',
    };
    return formatos[estado] || estado;
  }

  /**
   * Generar recibo de pago en efectivo (formato A4)
   */
  async generarReciboPagoEfectivo(pagoId: string): Promise<Buffer> {
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        solicitud: {
          include: {
            estudiante: true,
            tiposolicitud: true,
          },
        },
        configuracioninstitucion: true,
        usuario: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
      },
    });

    if (!pago) {
      throw new Error('Pago no encontrado');
    }

    const solicitud = pago.solicitud[0];

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margins: { top: 60, bottom: 60, left: 60, right: 60 } 
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        const pageWidth = doc.page.width;
        const leftMargin = 60;
        const rightMargin = pageWidth - 60;
        const contentWidth = rightMargin - leftMargin;

        // ============================================================================
        // ENCABEZADO INSTITUCIONAL
        // ============================================================================
        
        // Línea superior decorativa
        doc.rect(leftMargin, 50, contentWidth, 3).fill('#1976d2');
        doc.moveDown(1);

        // Logo y título (podrías agregar un logo aquí si lo tienes)
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#1976d2')
          .text('SIGCERH', { align: 'center' });
        doc.moveDown(0.3);
        
        doc.fontSize(13).font('Helvetica').fillColor('#000000')
          .text('Sistema de Gestión de Certificados de Estudios', { align: 'center' });
        doc.fontSize(11).text('de Recursos Humanos', { align: 'center' });
        doc.moveDown(0.3);
        
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('#555555')
          .text('UGEL Ferreñafe - Unidad de Gestión Educativa Local', { align: 'center' });
        doc.fontSize(9).text('Lambayeque, Perú', { align: 'center' });
        
        doc.moveDown(2);

        // ============================================================================
        // TÍTULO DEL DOCUMENTO CON DISEÑO
        // ============================================================================
        
        // Caja para el título
        const titleY = doc.y;
        doc.rect(leftMargin, titleY, contentWidth, 50).fillAndStroke('#f5f5f5', '#1976d2');
        
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#1976d2')
          .text('RECIBO OFICIAL DE PAGO', leftMargin, titleY + 10, { 
            width: contentWidth, 
            align: 'center' 
          });
        doc.fontSize(12).font('Helvetica').fillColor('#000000')
          .text(`N° ${pago.numerorecibo || pago.numeroorden}`, leftMargin, titleY + 32, { 
            width: contentWidth, 
            align: 'center' 
          });

        doc.y = titleY + 60;
        doc.moveDown(1.5);

        // ============================================================================
        // INFORMACIÓN DEL PAGO - DESTACADA
        // ============================================================================
        
        const infoBoxY = doc.y;
        doc.roundedRect(leftMargin, infoBoxY, contentWidth, 100, 5).fillAndStroke('#e3f2fd', '#1976d2');

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1976d2')
          .text('INFORMACIÓN DEL PAGO', leftMargin + 15, infoBoxY + 12);

        const col1X = leftMargin + 15;
        const col2X = leftMargin + 180;
        const dataY = infoBoxY + 35;

        // Columna 1
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
          .text('Orden de Pago:', col1X, dataY);
        doc.font('Helvetica').text(pago.numeroorden, col1X, dataY + 15);

        doc.font('Helvetica-Bold').text('Método de Pago:', col1X, dataY + 35);
        doc.font('Helvetica').text('Efectivo (Caja)', col1X, dataY + 50);

        // Columna 2
        doc.font('Helvetica-Bold').text('Fecha y Hora:', col2X, dataY);
        const fechaPago = new Date(pago.fechapago || pago.fecharegistro);
        doc.font('Helvetica').text(
          fechaPago.toLocaleDateString('es-PE', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          }),
          col2X, 
          dataY + 15
        );
        doc.text(
          fechaPago.toLocaleTimeString('es-PE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          col2X,
          dataY + 30
        );

        // Monto destacado
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#d32f2f')
          .text('MONTO PAGADO:', col2X, dataY + 50);
        doc.fontSize(16).text(`S/ ${Number(pago.monto).toFixed(2)}`, col2X, dataY + 67);

        doc.y = infoBoxY + 110;
        doc.moveDown(2);

        // ============================================================================
        // DATOS DEL SOLICITANTE
        // ============================================================================
        
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1976d2')
          .text('━━━━━ DATOS DEL SOLICITANTE ━━━━━');
        doc.moveDown(0.5);

        if (solicitud?.estudiante) {
          const est = solicitud.estudiante;
          const nombreCompleto = `${est.apellidopaterno} ${est.apellidomaterno}, ${est.nombres}`;
          
          // Tabla de datos
          const tableY = doc.y;
          const rowHeight = 25;
          
          // Fila 1
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
            .text('Nombres Completos:', leftMargin, tableY);
          doc.font('Helvetica').text(nombreCompleto, leftMargin + 150, tableY, { width: 300 });
          
          // Fila 2
          doc.font('Helvetica-Bold').text('DNI:', leftMargin, tableY + rowHeight);
          doc.font('Helvetica').text(est.dni, leftMargin + 150, tableY + rowHeight);
          
          // Fila 3
          if (est.telefono) {
            doc.font('Helvetica-Bold').text('Teléfono:', leftMargin, tableY + rowHeight * 2);
            doc.font('Helvetica').text(est.telefono, leftMargin + 150, tableY + rowHeight * 2);
          }
          
          // Fila 4
          if (est.email) {
            doc.font('Helvetica-Bold').text('Correo:', leftMargin, tableY + rowHeight * 3);
            doc.font('Helvetica').text(est.email, leftMargin + 150, tableY + rowHeight * 3, { width: 300 });
            doc.y = tableY + rowHeight * 4;
          } else {
            doc.y = tableY + rowHeight * 3;
          }
        }

        doc.moveDown(2);

        // ============================================================================
        // DATOS DEL TRÁMITE
        // ============================================================================
        
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1976d2')
          .text('━━━━━ DATOS DEL TRÁMITE ━━━━━');
        doc.moveDown(0.5);

        if (solicitud) {
          const tramiteY = doc.y;
          const rowHeight = 25;
          
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
            .text('N° Expediente:', leftMargin, tramiteY);
          doc.font('Helvetica').text(solicitud.numeroexpediente || 'N/A', leftMargin + 150, tramiteY);
          
          if (solicitud.numeroseguimiento) {
            doc.font('Helvetica-Bold').text('N° Seguimiento:', leftMargin, tramiteY + rowHeight);
            doc.font('Helvetica').text(solicitud.numeroseguimiento, leftMargin + 150, tramiteY + rowHeight);
            doc.y = tramiteY + rowHeight * 2;
          } else {
            doc.y = tramiteY + rowHeight;
          }
          
          if (solicitud.tiposolicitud) {
            doc.font('Helvetica-Bold').text('Tipo de Servicio:', leftMargin, doc.y);
            doc.font('Helvetica').text(solicitud.tiposolicitud.nombre, leftMargin + 150, doc.y, { width: 300 });
            doc.moveDown(1);
          }
        }

        doc.moveDown(2);

        // ============================================================================
        // OBSERVACIONES (si existen)
        // ============================================================================
        
        if (pago.observaciones) {
          doc.fontSize(12).font('Helvetica-Bold').fillColor('#1976d2')
            .text('━━━━━ OBSERVACIONES ━━━━━');
          doc.moveDown(0.5);
          
          doc.fontSize(10).font('Helvetica').fillColor('#000000')
            .text(pago.observaciones, { align: 'justify', width: contentWidth });
          
          doc.moveDown(2);
        }

        // ============================================================================
        // SECCIÓN DE FIRMAS
        // ============================================================================
        
        doc.moveDown(3);
        
        const firmaY = doc.y;
        
        // Firma del funcionario
        doc.moveTo(leftMargin + 50, firmaY).lineTo(leftMargin + 220, firmaY).stroke();
        doc.moveDown(0.5);
        
        const usuario = pago.usuario;
        if (usuario) {
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
            .text(`${usuario.nombres} ${usuario.apellidos}`, leftMargin + 50, doc.y, { 
              width: 170, 
              align: 'center' 
            });
          doc.fontSize(9).font('Helvetica').fillColor('#555555')
            .text('Funcionario de Mesa de Partes', leftMargin + 50, doc.y + 3, { 
              width: 170, 
              align: 'center' 
            });
          doc.text('UGEL Ferreñafe', leftMargin + 50, doc.y + 3, { 
            width: 170, 
            align: 'center' 
          });
        }

        // Sello institucional (simulado)
        const selloY = firmaY - 20;
        doc.circle(rightMargin - 80, selloY + 20, 40).stroke();
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#1976d2')
          .text('SELLO', rightMargin - 100, selloY + 15, { width: 40, align: 'center' });
        doc.fontSize(7).font('Helvetica').fillColor('#000000')
          .text('MESA DE', rightMargin - 100, selloY + 28, { width: 40, align: 'center' });
        doc.text('PARTES', rightMargin - 100, selloY + 38, { width: 40, align: 'center' });

        // ============================================================================
        // PIE DE PÁGINA
        // ============================================================================
        
        const footerY = doc.page.height - 100;
        doc.fontSize(9).font('Helvetica-Oblique').fillColor('#555555')
          .text(
            'Este documento certifica que se ha recibido el pago en efectivo por el servicio solicitado.',
            leftMargin,
            footerY,
            { width: contentWidth, align: 'center' }
          );
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000')
          .text('Conserve este recibo como comprobante de pago.', leftMargin, footerY + 15, { 
            width: contentWidth, 
            align: 'center' 
          });

        // Información de auditoría
        doc.moveDown(1);
        doc.fontSize(7).font('Helvetica').fillColor('#999999')
          .text(`ID Transacción: ${pago.id}`, { align: 'center' })
          .text(`Documento generado el ${new Date().toLocaleString('es-PE')}`, { align: 'center' })
          .text('SIGCERH - Sistema de Gestión de Certificados | UGEL Ferreñafe', { align: 'center' });

        // Línea inferior decorativa
        doc.rect(leftMargin, doc.page.height - 53, contentWidth, 3).fill('#1976d2');

        doc.end();

        logger.info(`Recibo generado para pago ${pago.numeroorden}`);
      } catch (error) {
        logger.error('Error generando recibo:', error);
        reject(error);
      }
    });
  }
}

export const ticketService = new TicketService();

