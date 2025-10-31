/**
 * Servicio de generación de códigos QR
 * Para verificación pública de certificados
 */

import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';

const prisma = new PrismaClient();

export class QRService {
  private BASE_URL = process.env.VERIFICACION_URL || 'https://verificar.ugelpuno.gob.pe';
  private STORAGE_DIR = path.join(process.cwd(), 'storage', 'qr');

  /**
   * Generar código QR para un certificado
   * URL: /verificar/{codigoVirtual}
   */
  async generarQR(certificadoId: string): Promise<Buffer> {
    // Obtener código virtual del certificado
    const certificado = await prisma.certificado.findUnique({
      where: { id: certificadoId },
      select: { codigovirtual: true },
    });

    if (!certificado) {
      throw new Error('Certificado no encontrado');
    }

    // URL de verificación pública
    const url = `${this.BASE_URL}/verificar/${certificado.codigovirtual}`;

    // Generar QR como buffer PNG
    const qrBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'H', // Alta corrección de errores
      type: 'png',
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Crear directorio si no existe
    if (!fs.existsSync(this.STORAGE_DIR)) {
      fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
    }

    // Guardar imagen QR en disco
    const qrFilePath = path.join(this.STORAGE_DIR, `${certificado.codigovirtual}.png`);
    fs.writeFileSync(qrFilePath, qrBuffer);

    logger.info(`QR generado para certificado ${certificadoId}: ${certificado.codigovirtual}.png`);

    return qrBuffer;
  }

  /**
   * Generar QR como Data URL (base64)
   * Para incrustar directamente en HTML o correos
   */
  async generarQRDataURL(certificadoId: string): Promise<string> {
    const certificado = await prisma.certificado.findUnique({
      where: { id: certificadoId },
      select: { codigovirtual: true },
    });

    if (!certificado) {
      throw new Error('Certificado no encontrado');
    }

    const url = `${this.BASE_URL}/verificar/${certificado.codigovirtual}`;

    // Generar QR como Data URL
    const dataURL = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return dataURL;
  }

  /**
   * Obtener ruta del archivo QR
   */
  getRutaQR(codigoVirtual: string): string {
    return `/storage/qr/${codigoVirtual}.png`;
  }
}

export const qrService = new QRService();

