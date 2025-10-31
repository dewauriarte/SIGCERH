/**
 * Controller de Verificación Pública
 * Endpoints sin autenticación para verificar certificados
 */

import { Request, Response } from 'express';
import { logger } from '@config/logger';
import { certificadoService } from './certificado.service';
import { PrismaClient } from '@prisma/client';
import { EstadoCertificado } from './types';

const prisma = new PrismaClient();

class VerificacionController {
  /**
   * GET /api/verificar/:codigoVirtual
   * Verificar un certificado por su código virtual (PÚBLICO)
   */
  async verificarPorCodigo(req: Request, res: Response): Promise<void> {
    try {
      const { codigoVirtual } = req.params;

      // Buscar certificado
      const certificado = await certificadoService.findByCodigoVirtual(codigoVirtual!);

      // Registrar verificación en BD
      await prisma.verificacion.create({
        data: {
          certificado_id: certificado?.id || null,
          codigovirtual: codigoVirtual!,
          fecha: new Date(),
          ip: req.ip || 'unknown',
          useragent: req.get('user-agent') || null,
          resultado: certificado ? 'ENCONTRADO' : 'NO_ENCONTRADO',
          tipoconsulta: 'CODIGO_VIRTUAL',
        },
      });

      // Si no se encontró
      if (!certificado) {
        res.status(404).json({
          success: false,
          valido: false,
          message: 'Certificado no encontrado',
          codigoVirtual,
        });
        return;
      }

      // Verificar si está anulado
      const anulado = certificado.estado === EstadoCertificado.ANULADO;

      // Respuesta con datos básicos
      res.json({
        success: true,
        valido: certificado.estado === EstadoCertificado.EMITIDO,
        estado: certificado.estado,
        anulado,
        motivoAnulacion: anulado ? certificado.motivoanulacion : null,
        codigoVirtual: certificado.codigovirtual,
        estudiante: {
          dni: certificado.estudiante.dni,
          nombreCompleto: `${certificado.estudiante.apellidopaterno} ${certificado.estudiante.apellidomaterno} ${certificado.estudiante.nombres}`,
          fechaNacimiento: certificado.estudiante.fechanacimiento,
        },
        institucion: {
          nombre: certificado.configuracioninstitucion?.nombre,
          ugel: certificado.configuracioninstitucion?.ugel,
        },
        promedio: certificado.promediogeneral,
        situacionFinal: certificado.situacionfinal,
        fechaEmision: certificado.fechaemision,
        grados:
          certificado.certificadodetalle?.map((detalle: any) => ({
            anio: detalle.aniolectivo.anio,
            grado: detalle.grado.nombre,
          })) || [],
      });
    } catch (error: any) {
      logger.error(`Error al verificar certificado: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al verificar certificado',
      });
    }
  }

  /**
   * GET /api/verificar/qr/:hash
   * Verificar certificado por hash del QR (PÚBLICO)
   */
  async verificarPorQR(req: Request, res: Response): Promise<void> {
    try {
      const { hash } = req.params;

      // Buscar certificado por hash
      const certificado = await prisma.certificado.findFirst({
        where: { hashpdf: hash! },
        include: {
          estudiante: {
            select: {
              dni: true,
              nombres: true,
              apellidopaterno: true,
              apellidomaterno: true,
              fechanacimiento: true,
            },
          },
          configuracioninstitucion: {
            select: {
              nombre: true,
              ugel: true,
            },
          },
          certificadodetalle: {
            include: {
              aniolectivo: true,
              grado: true,
            },
          },
        },
      });

      // Registrar verificación
      await prisma.verificacion.create({
        data: {
          certificado_id: certificado?.id || null,
          codigovirtual: certificado?.codigovirtual || '',
          fecha: new Date(),
          ip: req.ip || 'unknown',
          useragent: req.get('user-agent') || null,
          resultado: certificado ? 'ENCONTRADO' : 'NO_ENCONTRADO',
          tipoconsulta: 'QR_HASH',
        },
      });

      // Si no se encontró
      if (!certificado) {
        res.status(404).json({
          success: false,
          valido: false,
          message: 'Certificado no encontrado',
        });
        return;
      }

      // Verificar si está anulado
      const anulado = certificado.estado === EstadoCertificado.ANULADO;

      // Respuesta
      res.json({
        success: true,
        valido: certificado.estado === EstadoCertificado.EMITIDO,
        estado: certificado.estado,
        anulado,
        motivoAnulacion: anulado ? certificado.motivoanulacion : null,
        codigoVirtual: certificado.codigovirtual,
        estudiante: {
          dni: certificado.estudiante.dni,
          nombreCompleto: `${certificado.estudiante.apellidopaterno} ${certificado.estudiante.apellidomaterno} ${certificado.estudiante.nombres}`,
          fechaNacimiento: certificado.estudiante.fechanacimiento,
        },
        institucion: {
          nombre: certificado.configuracioninstitucion?.nombre,
          ugel: certificado.configuracioninstitucion?.ugel,
        },
        promedio: certificado.promediogeneral,
        situacionFinal: certificado.situacionfinal,
        fechaEmision: certificado.fechaemision,
        grados: certificado.certificadodetalle.map((detalle: any) => ({
          anio: detalle.aniolectivo.anio,
          grado: detalle.grado.nombre,
        })),
      });
    } catch (error: any) {
      logger.error(`Error al verificar certificado por QR: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al verificar certificado',
      });
    }
  }

  /**
   * GET /api/verificar/estadisticas
   * Estadísticas de verificaciones (PÚBLICO - solo números agregados)
   */
  async estadisticas(_req: Request, res: Response): Promise<void> {
    try {
      const [totalVerificaciones, verificacionesHoy, certificadosEmitidos] = await Promise.all([
        prisma.verificacion.count(),
        prisma.verificacion.count({
          where: {
            fecha: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.certificado.count({
          where: {
            estado: EstadoCertificado.EMITIDO,
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalVerificaciones,
          verificacionesHoy,
          certificadosEmitidos,
        },
      });
    } catch (error: any) {
      logger.error(`Error al obtener estadísticas: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
      });
    }
  }
}

export const verificacionController = new VerificacionController();
