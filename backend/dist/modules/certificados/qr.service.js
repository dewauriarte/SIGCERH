import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
const prisma = new PrismaClient();
export class QRService {
    BASE_URL = process.env.VERIFICACION_URL || 'https://verificar.ugelpuno.gob.pe';
    STORAGE_DIR = path.join(process.cwd(), 'storage', 'qr');
    async generarQR(certificadoId) {
        const certificado = await prisma.certificado.findUnique({
            where: { id: certificadoId },
            select: { codigovirtual: true },
        });
        if (!certificado) {
            throw new Error('Certificado no encontrado');
        }
        const url = `${this.BASE_URL}/verificar/${certificado.codigovirtual}`;
        const qrBuffer = await QRCode.toBuffer(url, {
            errorCorrectionLevel: 'H',
            type: 'png',
            width: 200,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });
        if (!fs.existsSync(this.STORAGE_DIR)) {
            fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
        }
        const qrFilePath = path.join(this.STORAGE_DIR, `${certificado.codigovirtual}.png`);
        fs.writeFileSync(qrFilePath, qrBuffer);
        logger.info(`QR generado para certificado ${certificadoId}: ${certificado.codigovirtual}.png`);
        return qrBuffer;
    }
    async generarQRDataURL(certificadoId) {
        const certificado = await prisma.certificado.findUnique({
            where: { id: certificadoId },
            select: { codigovirtual: true },
        });
        if (!certificado) {
            throw new Error('Certificado no encontrado');
        }
        const url = `${this.BASE_URL}/verificar/${certificado.codigovirtual}`;
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
    getRutaQR(codigoVirtual) {
        return `/storage/qr/${codigoVirtual}.png`;
    }
}
export const qrService = new QRService();
//# sourceMappingURL=qr.service.js.map