import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { EstadoCertificado } from './types';
const prisma = new PrismaClient();
export class CertificadoService {
    async generarCodigoVirtual() {
        const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numeros = '0123456789';
        let codigo;
        let existe = true;
        while (existe) {
            let codigoLetras = '';
            for (let i = 0; i < 3; i++) {
                codigoLetras += letras.charAt(Math.floor(Math.random() * letras.length));
            }
            let codigoNumeros = '';
            for (let i = 0; i < 4; i++) {
                codigoNumeros += numeros.charAt(Math.floor(Math.random() * numeros.length));
            }
            codigo = codigoLetras + codigoNumeros;
            const existente = await prisma.certificado.findUnique({
                where: { codigovirtual: codigo },
            });
            existe = !!existente;
        }
        return codigo;
    }
    async consolidarNotas(certificadoId) {
        const certificado = await prisma.certificado.findUnique({
            where: { id: certificadoId },
            include: {
                estudiante: true,
                configuracioninstitucion: true,
                certificadodetalle: {
                    include: {
                        aniolectivo: true,
                        grado: {
                            include: {
                                niveleducativo: true,
                            },
                        },
                        certificadonota: {
                            include: {
                                areacurricular: true,
                            },
                            orderBy: {
                                orden: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        orden: 'asc',
                    },
                },
            },
        });
        if (!certificado) {
            throw new Error('Certificado no encontrado');
        }
        const grados = certificado.certificadodetalle.map((detalle) => {
            const notas = detalle.certificadonota.map((nota) => ({
                area: nota.areacurricular.nombre,
                codigo: nota.areacurricular.codigo,
                nota: nota.nota,
                notaLiteral: nota.notaliteral || undefined,
                esExonerado: nota.esexonerado || false,
                orden: nota.orden,
            }));
            const notasNumericas = notas
                .filter((n) => n.nota !== null && !n.esExonerado)
                .map((n) => n.nota);
            const promedio = notasNumericas.length > 0
                ? notasNumericas.reduce((sum, n) => sum + n, 0) / notasNumericas.length
                : 0;
            return {
                anio: detalle.aniolectivo.anio,
                grado: detalle.grado.nombre,
                gradoNumero: detalle.grado.numero,
                nivel: detalle.grado.niveleducativo?.nombre || '',
                situacionFinal: detalle.situacionfinal || undefined,
                notas,
                promedio: Math.round(promedio * 100) / 100,
            };
        });
        const estudiante = {
            dni: certificado.estudiante.dni,
            nombres: certificado.estudiante.nombres,
            apellidoPaterno: certificado.estudiante.apellidopaterno,
            apellidoMaterno: certificado.estudiante.apellidomaterno,
            nombreCompleto: `${certificado.estudiante.apellidopaterno} ${certificado.estudiante.apellidomaterno} ${certificado.estudiante.nombres}`,
            fechaNacimiento: certificado.estudiante.fechanacimiento,
            lugarNacimiento: certificado.estudiante.lugarnacimiento || undefined,
            sexo: certificado.estudiante.sexo || undefined,
        };
        const institucion = {
            nombre: certificado.configuracioninstitucion.nombre || 'UGEL PUNO',
            codigo: certificado.configuracioninstitucion.codigomodular || undefined,
            direccion: certificado.configuracioninstitucion.direccion || undefined,
            ugel: certificado.configuracioninstitucion.ugel || 'UGEL PUNO',
            region: certificado.configuracioninstitucion.provincia || 'PUNO',
            logo: certificado.configuracioninstitucion.logo_url || undefined,
        };
        const observaciones = {
            retiros: certificado.observacionretiros || undefined,
            traslados: certificado.observaciontraslados || undefined,
            siagie: certificado.observacionsiagie || undefined,
            pruebasUbicacion: certificado.observacionpruebasubicacion || undefined,
            convalidacion: certificado.observacionconvalidacion || undefined,
            otros: certificado.observacionotros || undefined,
        };
        return {
            certificadoId: certificado.id,
            codigoVirtual: certificado.codigovirtual,
            numero: certificado.numero || undefined,
            estudiante,
            institucion,
            grados,
            promedio: Number(certificado.promediogeneral) || 0,
            situacionFinal: certificado.situacionfinal || 'APROBADO',
            fechaEmision: certificado.fechaemision,
            lugarEmision: certificado.lugaremision || 'PUNO',
            observaciones,
        };
    }
    async calcularPromedioGeneral(certificadoId) {
        const certificado = await prisma.certificado.findUnique({
            where: { id: certificadoId },
            include: {
                certificadodetalle: {
                    include: {
                        certificadonota: true,
                    },
                },
            },
        });
        if (!certificado) {
            throw new Error('Certificado no encontrado');
        }
        const todasLasNotas = [];
        for (const detalle of certificado.certificadodetalle) {
            for (const nota of detalle.certificadonota) {
                if (nota.nota !== null && !nota.esexonerado) {
                    todasLasNotas.push(nota.nota);
                }
            }
        }
        if (todasLasNotas.length === 0) {
            throw new Error('No hay notas para calcular promedio');
        }
        const promedio = todasLasNotas.reduce((sum, n) => sum + n, 0) / todasLasNotas.length;
        const promedioRedondeado = Math.round(promedio * 100) / 100;
        await prisma.certificado.update({
            where: { id: certificadoId },
            data: {
                promediogeneral: promedioRedondeado,
            },
        });
        logger.info(`Promedio calculado para certificado ${certificadoId}: ${promedioRedondeado}`);
        return promedioRedondeado;
    }
    async findById(id) {
        const certificado = await prisma.certificado.findUnique({
            where: { id },
            include: {
                estudiante: {
                    select: {
                        id: true,
                        dni: true,
                        nombres: true,
                        apellidopaterno: true,
                        apellidomaterno: true,
                        fechanacimiento: true,
                        lugarnacimiento: true,
                        sexo: true,
                    },
                },
                configuracioninstitucion: {
                    select: {
                        id: true,
                        nombre: true,
                        codigomodular: true,
                        direccion: true,
                        ugel: true,
                        provincia: true,
                        logo_url: true,
                    },
                },
                certificadodetalle: {
                    include: {
                        aniolectivo: true,
                        grado: {
                            include: {
                                niveleducativo: true,
                            },
                        },
                        certificadonota: {
                            include: {
                                areacurricular: true,
                            },
                            orderBy: {
                                orden: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        orden: 'asc',
                    },
                },
                usuario_certificado_usuarioemision_idTousuario: {
                    select: {
                        id: true,
                        nombres: true,
                        apellidos: true,
                        cargo: true,
                    },
                },
                usuario_certificado_usuarioanulacion_idTousuario: {
                    select: {
                        id: true,
                        nombres: true,
                        apellidos: true,
                    },
                },
            },
        });
        if (!certificado) {
            throw new Error('Certificado no encontrado');
        }
        return certificado;
    }
    async findByCodigoVirtual(codigoVirtual) {
        const certificado = await prisma.certificado.findUnique({
            where: { codigovirtual: codigoVirtual },
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
        return certificado;
    }
    async findAll(filtros, pagination) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const where = {};
        if (filtros.estudianteId) {
            where.estudiante_id = filtros.estudianteId;
        }
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        if (filtros.codigoVirtual) {
            where.codigovirtual = { contains: filtros.codigoVirtual };
        }
        if (filtros.numero) {
            where.numero = { contains: filtros.numero };
        }
        if (filtros.fechaEmisionDesde || filtros.fechaEmisionHasta) {
            where.fechaemision = {};
            if (filtros.fechaEmisionDesde) {
                where.fechaemision.gte = filtros.fechaEmisionDesde;
            }
            if (filtros.fechaEmisionHasta) {
                where.fechaemision.lte = filtros.fechaEmisionHasta;
            }
        }
        const [total, data] = await Promise.all([
            prisma.certificado.count({ where }),
            prisma.certificado.findMany({
                where,
                skip,
                take: limit,
                include: {
                    estudiante: {
                        select: {
                            dni: true,
                            nombres: true,
                            apellidopaterno: true,
                            apellidomaterno: true,
                        },
                    },
                },
                orderBy: {
                    fechaemision: 'desc',
                },
            }),
        ]);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async anular(id, data, usuarioId) {
        const certificado = await this.findById(id);
        if (certificado.estado === EstadoCertificado.ANULADO) {
            throw new Error('El certificado ya está anulado');
        }
        const certificadoAnulado = await prisma.certificado.update({
            where: { id },
            data: {
                estado: EstadoCertificado.ANULADO,
                motivoanulacion: data.motivoAnulacion,
                usuarioanulacion_id: usuarioId,
                fechaanulacion: new Date(),
            },
        });
        logger.info(`Certificado ${id} anulado por usuario ${usuarioId}`);
        return certificadoAnulado;
    }
    async rectificar(id, data, usuarioId) {
        const certificadoAnterior = await this.findById(id);
        if (certificadoAnterior.estado === EstadoCertificado.ANULADO) {
            throw new Error('No se puede rectificar un certificado anulado');
        }
        const nuevoCodigoVirtual = await this.generarCodigoVirtual();
        const certificadoNuevo = await prisma.certificado.create({
            data: {
                institucion_id: certificadoAnterior.institucion_id,
                codigovirtual: nuevoCodigoVirtual,
                estudiante_id: certificadoAnterior.estudiante_id,
                fechaemision: new Date(),
                horaemision: new Date(),
                lugaremision: certificadoAnterior.lugaremision,
                gradoscompletados: certificadoAnterior.gradoscompletados,
                situacionfinal: certificadoAnterior.situacionfinal,
                promediogeneral: certificadoAnterior.promediogeneral,
                observacionretiros: data.observaciones?.retiros || certificadoAnterior.observacionretiros,
                observaciontraslados: data.observaciones?.traslados || certificadoAnterior.observaciontraslados,
                observacionsiagie: data.observaciones?.siagie || certificadoAnterior.observacionsiagie,
                observacionpruebasubicacion: data.observaciones?.pruebasUbicacion || certificadoAnterior.observacionpruebasubicacion,
                observacionconvalidacion: data.observaciones?.convalidacion || certificadoAnterior.observacionconvalidacion,
                observacionotros: data.observaciones?.otros || certificadoAnterior.observacionotros,
                ordenmerito: certificadoAnterior.ordenmerito,
                estado: EstadoCertificado.BORRADOR,
                version: (certificadoAnterior.version || 1) + 1,
                esrectificacion: true,
                certificadoanterior_id: certificadoAnterior.id,
                motivorectificacion: data.motivoRectificacion,
                usuarioemision_id: usuarioId,
            },
        });
        if (certificadoAnterior.certificadodetalle && certificadoAnterior.certificadodetalle.length > 0) {
            for (const detalle of certificadoAnterior.certificadodetalle) {
                const nuevoDetalle = await prisma.certificadodetalle.create({
                    data: {
                        certificado_id: certificadoNuevo.id,
                        aniolectivo_id: detalle.aniolectivo_id,
                        grado_id: detalle.grado_id,
                        situacionfinal: detalle.situacionfinal,
                        observaciones: detalle.observaciones,
                        orden: detalle.orden,
                    },
                });
                for (const nota of detalle.certificadonota) {
                    await prisma.certificadonota.create({
                        data: {
                            certificadodetalle_id: nuevoDetalle.id,
                            area_id: nota.area_id,
                            nota: nota.nota,
                            notaliteral: nota.notaliteral,
                            esexonerado: nota.esexonerado,
                            orden: nota.orden,
                        },
                    });
                }
            }
        }
        await prisma.certificado.update({
            where: { id: certificadoAnterior.id },
            data: {
                estado: EstadoCertificado.ANULADO,
                motivoanulacion: `Anulado por rectificación: ${data.motivoRectificacion}`,
                usuarioanulacion_id: usuarioId,
                fechaanulacion: new Date(),
            },
        });
        logger.info(`Certificado ${id} rectificado. Nuevo certificado: ${certificadoNuevo.id} (código: ${nuevoCodigoVirtual})`);
        return certificadoNuevo;
    }
}
export const certificadoService = new CertificadoService();
//# sourceMappingURL=certificado.service.js.map