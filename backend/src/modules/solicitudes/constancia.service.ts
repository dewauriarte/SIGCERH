/**
 * Servicio de Constancias de Entrega
 * Genera PDFs profesionales de constancias de entrega de certificados
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';

const prisma = new PrismaClient();

interface ConstanciaData {
  solicitud: any;
  estudiante: any;
  certificado: any;
  institucion: any;
  fechaEntrega: Date;
  dniReceptor: string;
  observaciones?: string;
}

export class ConstanciaService {
  private readonly STORAGE_PATH = path.join(process.cwd(), 'storage', 'constancias');

  constructor() {
    // Asegurar que existe el directorio
    if (!fs.existsSync(this.STORAGE_PATH)) {
      fs.mkdirSync(this.STORAGE_PATH, { recursive: true });
    }
  }

  /**
   * Generar constancia de entrega en PDF
   */
  async generarConstanciaEntrega(solicitudId: string): Promise<string> {
    try {
      // Obtener datos completos
      const solicitud = await prisma.solicitud.findUnique({
        where: { id: solicitudId },
        include: {
          estudiante: true,
          certificado: true,
          usuario_solicitud_usuarioentrega_idTousuario: {
            select: {
              nombres: true,
              apellidos: true,
            },
          },
        },
      });

      if (!solicitud) {
        throw new Error('Solicitud no encontrada');
      }

      if (solicitud.estado !== 'ENTREGADO') {
        throw new Error('La solicitud no ha sido entregada aún');
      }

      // Obtener datos de la institución
      const institucion = await prisma.configuracioninstitucion.findFirst({
        where: { activo: true },
      });

      if (!institucion) {
        throw new Error('No se encontró configuración de institución');
      }

      // Extraer DNI receptor de observaciones (se guarda al entregar)
      let dniReceptor = 'N/A';
      try {
        const obsData = JSON.parse(solicitud.observaciones || '{}');
        dniReceptor = obsData.dniReceptor || 'N/A';
      } catch (e) {
        // Si no es JSON o no tiene el campo, usar N/A
      }

      const data: ConstanciaData = {
        solicitud,
        estudiante: solicitud.estudiante,
        certificado: solicitud.certificado,
        institucion,
        fechaEntrega: solicitud.fechaentrega || new Date(),
        dniReceptor,
        observaciones: solicitud.observaciones || undefined,
      };

      // Generar PDF
      const fileName = `constancia_${solicitud.numeroexpediente}_${Date.now()}.pdf`;
      const filePath = path.join(this.STORAGE_PATH, fileName);

      await this.crearPDF(data, filePath);

      logger.info(`Constancia generada: ${fileName} para solicitud ${solicitudId}`);

      return `/storage/constancias/${fileName}`;
    } catch (error: any) {
      logger.error(`Error al generar constancia: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear el PDF físico
   */
  private async crearPDF(data: ConstanciaData, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // ============================================================================
        // ENCABEZADO
        // ============================================================================

        // Logo (si existe)
        if (data.institucion.logo_url && fs.existsSync(data.institucion.logo_url)) {
          try {
            doc.image(data.institucion.logo_url, 50, 40, { width: 80 });
          } catch (e) {
            logger.warn('No se pudo cargar el logo de la institución');
          }
        }

        // Información de la institución
        doc.fontSize(10)
          .font('Helvetica-Bold')
          .text(data.institucion.nombre.toUpperCase(), 150, 50, {
            width: 400,
            align: 'center',
          });

        doc.fontSize(8)
          .font('Helvetica')
          .text(`UGEL: ${data.institucion.ugel}`, 150, 70, {
            width: 400,
            align: 'center',
          });

        doc.text(`${data.institucion.distrito}, ${data.institucion.provincia}, ${data.institucion.departamento}`, {
          width: 400,
          align: 'center',
        });

        // Línea divisoria
        doc.moveTo(50, 110).lineTo(545, 110).stroke();

        // ============================================================================
        // TÍTULO
        // ============================================================================

        doc.moveDown(2);
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('CONSTANCIA DE ENTREGA', {
            align: 'center',
          });

        doc.fontSize(12)
          .font('Helvetica')
          .text('DE CERTIFICADO DE ESTUDIOS', {
            align: 'center',
          });

        doc.moveDown(2);

        // ============================================================================
        // CUERPO
        // ============================================================================

        const currentY = doc.y;

        doc.fontSize(10).font('Helvetica');

        // Número de constancia
        doc.text(`N° ${data.solicitud.numeroexpediente}`, 50, currentY, {
          align: 'right',
        });

        doc.moveDown(1);

        // Texto principal
        doc.fontSize(11).text(
          'Por medio de la presente, se deja constancia de que se ha realizado la entrega del Certificado de Estudios con los siguientes datos:',
          {
            align: 'justify',
          }
        );

        doc.moveDown(1.5);

        // Datos del estudiante
        doc.fontSize(10).font('Helvetica-Bold').text('DATOS DEL ESTUDIANTE:', { underline: true });
        doc.moveDown(0.5);
        doc.font('Helvetica');

        const leftCol = 100;
        let y = doc.y;

        doc.text('Apellidos y Nombres:', 50, y);
        doc.text(
          `${data.estudiante.apellidopaterno} ${data.estudiante.apellidomaterno}, ${data.estudiante.nombres}`,
          leftCol,
          y
        );
        y += 20;

        doc.text('Documento de Identidad:', 50, y);
        doc.text(`DNI: ${data.estudiante.numeroDocumento || data.estudiante.dni || 'N/A'}`, leftCol, y);
        y += 30;

        // Datos del certificado
        doc.font('Helvetica-Bold').text('DATOS DEL CERTIFICADO:', 50, y, { underline: true });
        y += 15;
        doc.font('Helvetica');

        if (data.certificado) {
          doc.text('Código de Certificado:', 50, y);
          doc.text(data.certificado.codigovirtual, leftCol, y);
          y += 20;

          if (data.certificado.numero) {
            doc.text('Número:', 50, y);
            doc.text(data.certificado.numero, leftCol, y);
            y += 20;
          }

          doc.text('Fecha de Emisión:', 50, y);
          doc.text(
            new Date(data.certificado.fechaemision).toLocaleDateString('es-PE', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }),
            leftCol,
            y
          );
          y += 30;
        }

        // Datos de la entrega
        doc.font('Helvetica-Bold').text('DATOS DE LA ENTREGA:', 50, y, { underline: true });
        y += 15;
        doc.font('Helvetica');

        doc.text('Fecha de Entrega:', 50, y);
        doc.text(
          new Date(data.fechaEntrega).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }),
          leftCol,
          y
        );
        y += 20;

        doc.text('Hora de Entrega:', 50, y);
        doc.text(
          new Date(data.fechaEntrega).toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          leftCol,
          y
        );
        y += 20;

        doc.text('DNI del Receptor:', 50, y);
        doc.text(data.dniReceptor, leftCol, y);
        y += 20;

        doc.text('N° de Expediente:', 50, y);
        doc.text(data.solicitud.numeroexpediente, leftCol, y);
        y += 30;

        // ============================================================================
        // PIE DE PÁGINA
        // ============================================================================

        doc.moveDown(2);
        y = doc.y;

        // Texto de validez
        doc.fontSize(9).font('Helvetica-Oblique').text(
          'El presente documento certifica la entrega física del certificado de estudios mencionado y tiene validez oficial.',
          {
            align: 'justify',
          }
        );

        // Firma digital / sello
        doc.moveDown(3);
        y = doc.y;

        doc.fontSize(10).font('Helvetica');
        doc.text('_____________________________', 350, y, { align: 'center' });
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').text('MESA DE PARTES', 350, doc.y, { align: 'center' });
        doc.font('Helvetica').text(data.institucion.nombre, 350, doc.y + 15, { align: 'center', width: 200 });

        // Código QR o texto de verificación
        doc.moveDown(2);
        doc.fontSize(8)
          .font('Helvetica')
          .text(
            `Código de verificación: ${data.certificado?.codigovirtual || data.solicitud.numeroexpediente}`,
            {
              align: 'center',
            }
          );

        doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, {
          align: 'center',
        });

        // ============================================================================
        // FINALIZAR
        // ============================================================================

        doc.end();

        stream.on('finish', () => {
          resolve();
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Verificar si existe constancia para una solicitud
   */
  async existeConstancia(solicitudId: string): Promise<boolean> {
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
      select: { numeroexpediente: true },
    });

    if (!solicitud) return false;

    const files = fs.readdirSync(this.STORAGE_PATH);
    return files.some((file) => file.includes(solicitud.numeroexpediente));
  }
}

export const constanciaService = new ConstanciaService();

