import { logger } from '@config/logger';
import { certificadoService } from './certificado.service';
import { PrismaClient } from '@prisma/client';
import { EstadoCertificado } from './types';
const prisma = new PrismaClient();
class VerificacionController {
    async verificarPorCodigo(req, res) {
        try {
            const { codigoVirtual } = req.params;
            const certificado = await certificadoService.findByCodigoVirtual(codigoVirtual);
            await prisma.verificacion.create({
                data: {
                    certificado_id: certificado?.id || null,
                    codigovirtual: codigoVirtual,
                    fecha: new Date(),
                    ip: req.ip || 'unknown',
                    useragent: req.get('user-agent') || null,
                    resultado: certificado ? 'ENCONTRADO' : 'NO_ENCONTRADO',
                    tipoconsulta: 'CODIGO_VIRTUAL',
                },
            });
            if (!certificado) {
                res.status(404).json({
                    success: false,
                    valido: false,
                    message: 'Certificado no encontrado',
                    codigoVirtual,
                });
                return;
            }
            const anulado = certificado.estado === EstadoCertificado.ANULADO;
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
                grados: certificado.certificadodetalle?.map((detalle) => ({
                    anio: detalle.aniolectivo.anio,
                    grado: detalle.grado.nombre,
                })) || [],
            });
        }
        catch (error) {
            logger.error(`Error al verificar certificado: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al verificar certificado',
            });
        }
    }
    async verificarPorQR(req, res) {
        try {
            const { hash } = req.params;
            const certificado = await prisma.certificado.findFirst({
                where: { hashpdf: hash },
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
            if (!certificado) {
                res.status(404).json({
                    success: false,
                    valido: false,
                    message: 'Certificado no encontrado',
                });
                return;
            }
            const anulado = certificado.estado === EstadoCertificado.ANULADO;
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
                grados: certificado.certificadodetalle.map((detalle) => ({
                    anio: detalle.aniolectivo.anio,
                    grado: detalle.grado.nombre,
                })),
            });
        }
        catch (error) {
            logger.error(`Error al verificar certificado por QR: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al verificar certificado',
            });
        }
    }
    async estadisticas(_req, res) {
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
        }
        catch (error) {
            logger.error(`Error al obtener estadísticas: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
            });
        }
    }
}
export const verificacionController = new VerificacionController();
//# sourceMappingURL=verificacion.controller.js.map