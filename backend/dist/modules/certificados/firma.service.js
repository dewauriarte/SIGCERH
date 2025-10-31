import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { EstadoCertificado } from './types';
const prisma = new PrismaClient();
export class FirmaService {
    async firmarDigitalmente(certificadoId, _certificadoDigital, usuarioId) {
        const certificado = await prisma.certificado.findUnique({
            where: { id: certificadoId },
        });
        if (!certificado) {
            throw new Error('Certificado no encontrado');
        }
        if (certificado.estado !== EstadoCertificado.BORRADOR) {
            throw new Error('Solo se pueden firmar certificados en estado BORRADOR');
        }
        if (!certificado.urlpdf) {
            throw new Error('El certificado debe tener un PDF generado antes de firmarlo');
        }
        const certificadoActualizado = await prisma.certificado.update({
            where: { id: certificadoId },
            data: {
                estado: EstadoCertificado.EMITIDO,
                usuarioemision_id: usuarioId,
                fechaemision: new Date(),
                horaemision: new Date(),
            },
        });
        logger.info(`Certificado ${certificadoId} marcado como firmado digitalmente (pendiente de implementación PKI)`);
        return {
            success: true,
            message: 'Certificado marcado como firmado digitalmente. Nota: La firma digital PKI está pendiente de implementación.',
            certificado: certificadoActualizado,
        };
    }
    async marcarFirmaManuscrita(certificadoId, usuarioId, observaciones) {
        const certificado = await prisma.certificado.findUnique({
            where: { id: certificadoId },
        });
        if (!certificado) {
            throw new Error('Certificado no encontrado');
        }
        if (certificado.estado !== EstadoCertificado.BORRADOR) {
            throw new Error('Solo se pueden marcar certificados en estado BORRADOR');
        }
        if (!certificado.urlpdf) {
            throw new Error('El certificado debe tener un PDF generado antes de marcarlo para firma');
        }
        const certificadoActualizado = await prisma.certificado.update({
            where: { id: certificadoId },
            data: {
                observacionotros: 'REQUIERE_FIRMA_MANUSCRITA' + (observaciones ? `: ${observaciones}` : ''),
                usuarioemision_id: usuarioId,
            },
        });
        logger.info(`Certificado ${certificadoId} marcado para firma manuscrita`);
        return {
            success: true,
            message: 'Certificado marcado para firma manuscrita. Puede imprimirlo, firmarlo y luego subir la versión escaneada.',
            certificado: certificadoActualizado,
            instrucciones: {
                paso1: 'Imprimir el certificado',
                paso2: 'Firmar manualmente en el espacio designado',
                paso3: 'Escanear el certificado firmado',
                paso4: 'Subir la versión escaneada usando el endpoint /api/certificados/:id/subir-firmado',
            },
        };
    }
    async subirCertificadoFirmado(certificadoId, file, usuarioId) {
        const certificado = await prisma.certificado.findUnique({
            where: { id: certificadoId },
        });
        if (!certificado) {
            throw new Error('Certificado no encontrado');
        }
        if (!certificado.observacionotros?.includes('REQUIERE_FIRMA_MANUSCRITA')) {
            throw new Error('Este certificado no está marcado para firma manuscrita');
        }
        const urlFirmado = `/storage/certificados/firmados/${file.filename}`;
        const certificadoActualizado = await prisma.certificado.update({
            where: { id: certificadoId },
            data: {
                urlpdf: urlFirmado,
                estado: EstadoCertificado.EMITIDO,
                fechaemision: new Date(),
                horaemision: new Date(),
                usuarioemision_id: usuarioId,
                observacionotros: certificado.observacionotros.replace('REQUIERE_FIRMA_MANUSCRITA', 'FIRMADO_MANUSCRITAMENTE'),
            },
        });
        logger.info(`Certificado firmado manuscritamente subido: ${certificadoId}`);
        return {
            success: true,
            message: 'Certificado con firma manuscrita subido exitosamente y marcado como EMITIDO',
            certificado: certificadoActualizado,
        };
    }
    async verificarEstadoFirma(certificadoId) {
        const certificado = await prisma.certificado.findUnique({
            where: { id: certificadoId },
            select: {
                estado: true,
                observacionotros: true,
                urlpdf: true,
                fechaemision: true,
                usuario_certificado_usuarioemision_idTousuario: {
                    select: {
                        nombres: true,
                        apellidos: true,
                        cargo: true,
                    },
                },
            },
        });
        if (!certificado) {
            throw new Error('Certificado no encontrado');
        }
        const requiereFirmaManuscrita = certificado.observacionotros?.includes('REQUIERE_FIRMA_MANUSCRITA');
        const firmadoManuscritamente = certificado.observacionotros?.includes('FIRMADO_MANUSCRITAMENTE');
        return {
            estado: certificado.estado,
            requiereFirma: certificado.estado === EstadoCertificado.BORRADOR,
            requiereFirmaManuscrita,
            firmadoManuscritamente,
            tienePDF: !!certificado.urlpdf,
            fechaEmision: certificado.fechaemision,
            usuarioEmision: certificado.usuario_certificado_usuarioemision_idTousuario,
        };
    }
}
export const firmaService = new FirmaService();
//# sourceMappingURL=firma.service.js.map