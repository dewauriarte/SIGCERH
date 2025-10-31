/**
 * Servicio de generación de PDF para certificados
 * Utiliza PDFKit para crear certificados con diseño oficial
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '@config/logger';
import { certificadoService } from './certificado.service';
import { qrService } from './qr.service';
import type { DatosCertificado, ResultadoPDF } from './types';

export class PDFService {
  private STORAGE_DIR = path.join(process.cwd(), 'storage', 'certificados');

  /**
   * Generar PDF del certificado
   */
  async generarPDF(certificadoId: string, regenerar: boolean = false): Promise<ResultadoPDF> {
    // 1. Obtener datos consolidados
    const datos = await certificadoService.consolidarNotas(certificadoId);

    // 2. Verificar si ya existe PDF y no se quiere regenerar
    const certificado = await certificadoService.findById(certificadoId);
    if (certificado.urlpdf && !regenerar) {
      return {
        urlPdf: certificado.urlpdf,
        hashPdf: certificado.hashpdf || '',
        urlQr: certificado.urlqr || '',
      };
    }

    // 3. Crear directorio por año
    const anio = new Date().getFullYear();
    const dir = path.join(this.STORAGE_DIR, String(anio));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 4. Generar QR primero
    const qrBuffer = await qrService.generarQR(certificadoId);

    // 5. Configurar documento PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });

    const filename = `CERT_${certificadoId.substring(0, 8)}_${Date.now()}.pdf`;
    const filepath = path.join(dir, filename);

    // 6. Stream a archivo
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // 7. Generar contenido del PDF
    await this.generarHeader(doc, datos, qrBuffer);
    this.generarDatosEstudiante(doc, datos);
    await this.generarTablaNotas(doc, datos);
    this.generarFooter(doc, datos);

    // 8. Finalizar documento
    doc.end();

    // 9. Esperar a que se complete la escritura
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // 10. Generar hash SHA-256 del PDF
    const fileBuffer = fs.readFileSync(filepath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 11. URL relativa para BD
    const urlPdf = `/storage/certificados/${anio}/${filename}`;
    const urlQr = `/storage/qr/${datos.codigoVirtual}.png`;

    // 12. Actualizar BD con URLs y hash
    await this.actualizarCertificadoConPDF(certificadoId, urlPdf, hash, urlQr);

    logger.info(`PDF generado para certificado ${certificadoId}: ${filename}`);

    return {
      urlPdf,
      hashPdf: hash,
      urlQr,
    };
  }

  /**
   * Actualizar certificado con datos del PDF
   */
  private async actualizarCertificadoConPDF(
    certificadoId: string,
    urlPdf: string,
    hashPdf: string,
    urlQr: string
  ) {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.certificado.update({
      where: { id: certificadoId },
      data: {
        urlpdf: urlPdf,
        hashpdf: hashPdf,
        urlqr: urlQr,
      },
    });

    await prisma.$disconnect();
  }

  /**
   * Generar header del PDF (logo, título, QR)
   */
  private async generarHeader(
    doc: typeof PDFDocument.prototype,
    datos: DatosCertificado,
    qrBuffer: Buffer
  ): Promise<void> {
    const pageWidth = doc.page.width;
    const margin = doc.page.margins.left;

    // Logo (si existe)
    if (datos.institucion.logo && fs.existsSync(datos.institucion.logo)) {
      try {
        doc.image(datos.institucion.logo, margin, 50, { width: 80, height: 80 });
      } catch (error) {
        logger.warn('No se pudo cargar el logo de la institución');
      }
    }

    // QR derecha
    doc.image(qrBuffer, pageWidth - margin - 100, 50, { width: 100, height: 100 });

    // Título centro
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(datos.institucion.ugel || 'UGEL PUNO', margin, 60, {
        width: pageWidth - 2 * margin,
        align: 'center',
      });

    doc
      .fontSize(14)
      .text('CERTIFICADO DE ESTUDIOS', margin, 85, {
        width: pageWidth - 2 * margin,
        align: 'center',
      });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('(Acorde a la Ley General de Educación N° 28044)', margin, 105, {
        width: pageWidth - 2 * margin,
        align: 'center',
      });

    // Línea separadora
    doc
      .moveTo(margin, 160)
      .lineTo(pageWidth - margin, 160)
      .stroke();

    doc.moveDown(3);
  }

  /**
   * Generar datos del estudiante
   */
  private generarDatosEstudiante(doc: typeof PDFDocument.prototype, datos: DatosCertificado): void {
    const margin = doc.page.margins.left;
    let y = 180;

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('DATOS DEL ESTUDIANTE', margin, y);

    y += 20;
    doc.fontSize(10).font('Helvetica');

    // DNI
    doc.text(`DNI:`, margin, y);
    doc.text(datos.estudiante.dni, margin + 150, y);
    y += 15;

    // Apellidos y nombres
    doc.text(`Apellidos y Nombres:`, margin, y);
    doc.text(datos.estudiante.nombreCompleto.toUpperCase(), margin + 150, y);
    y += 15;

    // Fecha de nacimiento
    doc.text(`Fecha de Nacimiento:`, margin, y);
    doc.text(datos.estudiante.fechaNacimiento.toLocaleDateString('es-PE'), margin + 150, y);
    y += 15;

    // Lugar de nacimiento (si existe)
    if (datos.estudiante.lugarNacimiento) {
      doc.text(`Lugar de Nacimiento:`, margin, y);
      doc.text(datos.estudiante.lugarNacimiento, margin + 150, y);
      y += 15;
    }

    y += 10;
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('INSTITUCIÓN EDUCATIVA', margin, y);

    y += 20;
    doc.fontSize(10).font('Helvetica');

    doc.text(`Nombre:`, margin, y);
    doc.text(datos.institucion.nombre, margin + 150, y, {
      width: doc.page.width - margin - 150 - margin,
    });
    y += 15;

    if (datos.institucion.codigo) {
      doc.text(`Código Modular:`, margin, y);
      doc.text(datos.institucion.codigo, margin + 150, y);
      y += 15;
    }

    // Línea separadora
    y += 10;
    doc
      .moveTo(margin, y)
      .lineTo(doc.page.width - margin, y)
      .stroke();

    doc.y = y + 20;
  }

  /**
   * Generar tabla de notas por año/grado
   */
  private async generarTablaNotas(doc: typeof PDFDocument.prototype, datos: DatosCertificado): Promise<void> {
    const margin = doc.page.margins.left;
    const pageWidth = doc.page.width;

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('NOTAS POR AÑO ESCOLAR', margin, doc.y);
    doc.moveDown();

    // Por cada grado
    for (const grado of datos.grados) {
      // Verificar si hay espacio suficiente, sino crear nueva página
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
      }

      // Título del grado
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(
        `${grado.grado} - ${grado.nivel} (${grado.anio})`,
        margin,
        doc.y,
        { underline: true }
      );
      doc.moveDown(0.5);

      // Tabla de notas
      const tableTop = doc.y;
      const colWidths = {
        area: pageWidth - 2 * margin - 80,
        nota: 80,
      };

      // Encabezado de tabla
      doc.fontSize(9).font('Helvetica-Bold');
      doc.rect(margin, tableTop, colWidths.area + colWidths.nota, 20).stroke();

      doc.text('ÁREA CURRICULAR', margin + 5, tableTop + 5, { width: colWidths.area - 10 });
      doc.text('NOTA', margin + colWidths.area + 5, tableTop + 5, {
        width: colWidths.nota - 10,
        align: 'center',
      });

      let rowY = tableTop + 20;

      // Filas de notas
      doc.font('Helvetica');
      for (const nota of grado.notas) {
        // Verificar espacio
        if (rowY > doc.page.height - 100) {
          doc.addPage();
          rowY = margin;
        }

        const rowHeight = 15;

        // Borde de fila
        doc.rect(margin, rowY, colWidths.area, rowHeight).stroke();
        doc.rect(margin + colWidths.area, rowY, colWidths.nota, rowHeight).stroke();

        // Contenido
        doc.text(nota.area, margin + 5, rowY + 3, { width: colWidths.area - 10 });

        const notaTexto = nota.esExonerado
          ? 'EXO'
          : nota.nota !== null
          ? nota.nota.toString()
          : '-';

        doc.text(notaTexto, margin + colWidths.area + 5, rowY + 3, {
          width: colWidths.nota - 10,
          align: 'center',
        });

        rowY += rowHeight;
      }

      // Promedio del grado (si existe)
      if (grado.promedio) {
        const promedioRowHeight = 18;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.rect(margin, rowY, colWidths.area, promedioRowHeight).stroke();
        doc.rect(margin + colWidths.area, rowY, colWidths.nota, promedioRowHeight).stroke();

        doc.text('PROMEDIO', margin + 5, rowY + 4, { width: colWidths.area - 10 });
        doc.text(grado.promedio.toFixed(2), margin + colWidths.area + 5, rowY + 4, {
          width: colWidths.nota - 10,
          align: 'center',
        });

        rowY += promedioRowHeight;
      }

      // Situación final (si existe)
      if (grado.situacionFinal) {
        rowY += 5;
        doc.fontSize(9).font('Helvetica');
        doc.text(`Situación Final: ${grado.situacionFinal}`, margin, rowY);
      }

      doc.y = rowY + 15;
    }
  }

  /**
   * Generar footer con promedio general, código y firma
   */
  private generarFooter(doc: typeof PDFDocument.prototype, datos: DatosCertificado): void {
    const margin = doc.page.margins.left;
    const pageWidth = doc.page.width;

    // Verificar espacio para footer
    if (doc.y > doc.page.height - 150) {
      doc.addPage();
    }

    doc.y += 10;

    // Línea separadora
    doc
      .moveTo(margin, doc.y)
      .lineTo(pageWidth - margin, doc.y)
      .stroke();

    doc.moveDown();

    // Promedio general
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(
      `PROMEDIO GENERAL: ${datos.promedio.toFixed(2)}`,
      margin,
      doc.y,
      { align: 'center' }
    );

    doc.moveDown();

    // Situación final
    doc.fontSize(10).font('Helvetica');
    doc.text(`SITUACIÓN FINAL: ${datos.situacionFinal}`, margin, doc.y, { align: 'center' });

    doc.moveDown(2);

    // Código de verificación
    doc.fontSize(9);
    doc.text(`Código de Verificación: ${datos.codigoVirtual}`, margin, doc.y, {
      align: 'center',
    });

    doc.moveDown(3);

    // Espacio para firma
    const firmaY = doc.y;
    const firmaWidth = 200;
    const firmaX = (pageWidth - firmaWidth) / 2;

    doc
      .moveTo(firmaX, firmaY)
      .lineTo(firmaX + firmaWidth, firmaY)
      .stroke();

    doc.fontSize(9);
    doc.text('Firma del Director', firmaX, firmaY + 5, {
      width: firmaWidth,
      align: 'center',
    });

    doc.moveDown(2);

    // Fecha de emisión
    doc.fontSize(8);
    doc.text(
      `Emitido el ${datos.fechaEmision.toLocaleDateString('es-PE')} en ${datos.lugarEmision}`,
      margin,
      doc.y,
      { align: 'center' }
    );

    // Nota al pie
    doc.moveDown();
    doc.fontSize(7);
    doc.text(
      'Este certificado puede ser verificado en https://verificar.ugelpuno.gob.pe',
      margin,
      doc.y,
      { align: 'center' }
    );
  }
}

export const pdfService = new PDFService();

