/**
 * Servicio de Firmas para Certificados
 * - Firma digital: preparada para futuro (requiere certificado digital)
 * - Firma manuscrita: funcional (marcar, imprimir, escanear, subir)
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { EstadoCertificado } from './types';

const prisma = new PrismaClient();

export class FirmaService {
  /**
   * FIRMA DIGITAL (Preparado para futuro)
   * Requiere integración con certificado digital PKI
   */
  async firmarDigitalmente(
    certificadoId: string,
    _certificadoDigital: any,
    usuarioId: string
  ): Promise<any> {
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

    // TODO: Implementar firma digital con PKI
    // 1. Validar certificado digital del firmante
    // 2. Firmar PDF con certificado digital
    // 3. Generar hash de la firma
    // 4. Guardar metadatos de la firma

    // Por ahora, solo actualizar estado y registrar usuario
    const certificadoActualizado = await prisma.certificado.update({
      where: { id: certificadoId },
      data: {
        estado: EstadoCertificado.EMITIDO,
        usuarioemision_id: usuarioId,
        fechaemision: new Date(),
        horaemision: new Date(),
      },
    });

    logger.info(
      `Certificado ${certificadoId} marcado como firmado digitalmente (pendiente de implementación PKI)`
    );

    return {
      success: true,
      message:
        'Certificado marcado como firmado digitalmente. Nota: La firma digital PKI está pendiente de implementación.',
      certificado: certificadoActualizado,
    };
  }

  /**
   * FIRMA MANUSCRITA (Funcional)
   * Marca el certificado para que sea impreso y firmado manualmente
   */
  async marcarFirmaManuscrita(
    certificadoId: string,
    usuarioId: string,
    observaciones?: string
  ): Promise<any> {
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

    // Marcar certificado como "requiere firma manuscrita"
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
      message:
        'Certificado marcado para firma manuscrita. Puede imprimirlo, firmarlo y luego subir la versión escaneada.',
      certificado: certificadoActualizado,
      instrucciones: {
        paso1: 'Imprimir el certificado',
        paso2: 'Firmar manualmente en el espacio designado',
        paso3: 'Escanear el certificado firmado',
        paso4: 'Subir la versión escaneada usando el endpoint /api/certificados/:id/subir-firmado',
      },
    };
  }

  /**
   * Subir certificado con firma manuscrita escaneada
   * El archivo escaneado reemplaza al PDF original
   */
  async subirCertificadoFirmado(
    certificadoId: string,
    file: Express.Multer.File,
    usuarioId: string
  ): Promise<any> {
    const certificado = await prisma.certificado.findUnique({
      where: { id: certificadoId },
    });

    if (!certificado) {
      throw new Error('Certificado no encontrado');
    }

    // Verificar que esté marcado para firma manuscrita
    if (!certificado.observacionotros?.includes('REQUIERE_FIRMA_MANUSCRITA')) {
      throw new Error('Este certificado no está marcado para firma manuscrita');
    }

    // La URL del archivo viene del middleware de Multer
    const urlFirmado = `/storage/certificados/firmados/${file.filename}`;

    // Actualizar certificado con versión firmada
    const certificadoActualizado = await prisma.certificado.update({
      where: { id: certificadoId },
      data: {
        urlpdf: urlFirmado,
        estado: EstadoCertificado.EMITIDO,
        fechaemision: new Date(),
        horaemision: new Date(),
        usuarioemision_id: usuarioId,
        observacionotros: certificado.observacionotros.replace(
          'REQUIERE_FIRMA_MANUSCRITA',
          'FIRMADO_MANUSCRITAMENTE'
        ),
      },
    });

    logger.info(`Certificado firmado manuscritamente subido: ${certificadoId}`);

    return {
      success: true,
      message: 'Certificado con firma manuscrita subido exitosamente y marcado como EMITIDO',
      certificado: certificadoActualizado,
    };
  }

  /**
   * Verificar si un certificado requiere firma
   */
  async verificarEstadoFirma(certificadoId: string): Promise<any> {
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

    const requiereFirmaManuscrita = certificado.observacionotros?.includes(
      'REQUIERE_FIRMA_MANUSCRITA'
    );
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

