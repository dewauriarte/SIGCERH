import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { fileUploadService } from '@shared/services/file-upload.service';
import { curriculoGradoService } from '../academico/curriculo-grado.service';
import { EstadoActa, TRANSICIONES_VALIDAS, } from './types';
import ExcelJS from 'exceljs';
const prisma = new PrismaClient();
export class ActaFisicaService {
    async create(data, file, usuarioId) {
        const anioLectivo = await prisma.aniolectivo.findUnique({
            where: { id: data.anioLectivoId },
        });
        if (!anioLectivo) {
            throw new Error('Año lectivo no encontrado');
        }
        if (anioLectivo.anio < 1985 || anioLectivo.anio > 2012) {
            throw new Error('El año lectivo debe estar entre 1985 y 2012');
        }
        const grado = await prisma.grado.findUnique({
            where: { id: data.gradoId },
        });
        if (!grado) {
            throw new Error('Grado no encontrado');
        }
        const uploadedFile = await fileUploadService.saveActa(file, {
            numero: data.numero,
            anio: anioLectivo.anio,
        });
        const actaExistente = await prisma.actafisica.findFirst({
            where: { hasharchivo: uploadedFile.hash },
        });
        if (actaExistente) {
            throw new Error('Ya existe un acta con este archivo (mismo hash). Posible duplicado.');
        }
        const actaDuplicada = await prisma.actafisica.findFirst({
            where: {
                numero: data.numero,
                aniolectivo_id: data.anioLectivoId,
            },
        });
        if (actaDuplicada) {
            throw new Error(`Ya existe un acta con el número ${data.numero} para el año ${anioLectivo.anio}`);
        }
        const acta = await prisma.actafisica.create({
            data: {
                numero: data.numero,
                tipo: data.tipo,
                aniolectivo_id: data.anioLectivoId,
                grado_id: data.gradoId,
                seccion: data.seccion,
                turno: data.turno,
                fechaemision: data.fechaEmision,
                libro: data.libro,
                folio: data.folio,
                tipoevaluacion: data.tipoEvaluacion,
                colegiorigen: data.colegioOrigen,
                ubicacionfisica: data.ubicacionFisica,
                nombrearchivo: uploadedFile.filename,
                urlarchivo: uploadedFile.url,
                hasharchivo: uploadedFile.hash,
                estado: EstadoActa.DISPONIBLE,
                observaciones: data.observaciones,
                usuariosubida_id: usuarioId,
            },
            include: {
                aniolectivo: true,
                grado: true,
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombres: true,
                        apellidos: true,
                    },
                },
            },
        });
        logger.info(`Acta creada: ${acta.numero} (${anioLectivo.anio} - ${grado.nombre})`);
        return acta;
    }
    async findAll(filtros = {}, pagination) {
        const where = {};
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        if (filtros.anioLectivoId) {
            where.aniolectivo_id = filtros.anioLectivoId;
        }
        if (filtros.gradoId) {
            where.grado_id = filtros.gradoId;
        }
        if (filtros.procesado !== undefined) {
            where.procesadoconia = filtros.procesado;
        }
        if (filtros.solicitudId) {
            where.solicitud_id = filtros.solicitudId;
        }
        if (filtros.fechaDesde || filtros.fechaHasta) {
            where.fechasubida = {};
            if (filtros.fechaDesde) {
                where.fechasubida.gte = filtros.fechaDesde;
            }
            if (filtros.fechaHasta) {
                where.fechasubida.lte = filtros.fechaHasta;
            }
        }
        const skip = pagination ? (pagination.page - 1) * pagination.limit : undefined;
        const take = pagination?.limit;
        const [actas, total] = await Promise.all([
            prisma.actafisica.findMany({
                where,
                skip,
                take,
                include: {
                    aniolectivo: true,
                    grado: true,
                    solicitud: {
                        select: {
                            id: true,
                            numeroexpediente: true,
                            estado: true,
                        },
                    },
                    usuario: {
                        select: {
                            id: true,
                            username: true,
                            nombres: true,
                            apellidos: true,
                        },
                    },
                },
                orderBy: {
                    fechasubida: 'desc',
                },
            }),
            prisma.actafisica.count({ where }),
        ]);
        return {
            actas,
            pagination: pagination
                ? {
                    page: pagination.page,
                    limit: pagination.limit,
                    total,
                    pages: Math.ceil(total / pagination.limit),
                }
                : undefined,
        };
    }
    async findById(id) {
        const acta = await prisma.actafisica.findUnique({
            where: { id },
            include: {
                aniolectivo: true,
                grado: true,
                solicitud: {
                    select: {
                        id: true,
                        numeroexpediente: true,
                        estado: true,
                        estudiante: {
                            select: {
                                id: true,
                                dni: true,
                                nombres: true,
                                apellidopaterno: true,
                                apellidomaterno: true,
                            },
                        },
                    },
                },
                usuario: {
                    select: {
                        id: true,
                        username: true,
                        nombres: true,
                        apellidos: true,
                    },
                },
            },
        });
        if (!acta) {
            throw new Error('Acta no encontrada');
        }
        return acta;
    }
    async update(id, data) {
        const acta = await this.findById(id);
        if (data.numero && data.numero !== acta.numero) {
            const actaDuplicada = await prisma.actafisica.findFirst({
                where: {
                    numero: data.numero,
                    aniolectivo_id: acta.aniolectivo_id,
                    id: { not: id },
                },
            });
            if (actaDuplicada) {
                throw new Error(`Ya existe un acta con el número ${data.numero} para este año`);
            }
        }
        const actaActualizada = await prisma.actafisica.update({
            where: { id },
            data: {
                numero: data.numero,
                tipo: data.tipo,
                seccion: data.seccion,
                turno: data.turno,
                fechaemision: data.fechaEmision,
                libro: data.libro,
                folio: data.folio,
                tipoevaluacion: data.tipoEvaluacion,
                colegiorigen: data.colegioOrigen,
                ubicacionfisica: data.ubicacionFisica,
                observaciones: data.observaciones,
            },
            include: {
                aniolectivo: true,
                grado: true,
            },
        });
        logger.info(`Acta actualizada: ${actaActualizada.numero}`);
        return actaActualizada;
    }
    validarTransicion(estadoActual, estadoNuevo) {
        const estadoActualEnum = estadoActual;
        const transicionesPermitidas = TRANSICIONES_VALIDAS[estadoActualEnum];
        if (!transicionesPermitidas.includes(estadoNuevo)) {
            throw new Error(`Transición inválida: no se puede cambiar de ${estadoActual} a ${estadoNuevo}`);
        }
    }
    async cambiarEstado(id, estadoNuevo, observaciones) {
        const acta = await this.findById(id);
        this.validarTransicion(acta.estado, estadoNuevo);
        const actaActualizada = await prisma.actafisica.update({
            where: { id },
            data: {
                estado: estadoNuevo,
                observaciones: observaciones || acta.observaciones,
            },
        });
        logger.info(`Acta ${acta.numero}: ${acta.estado} → ${estadoNuevo}`);
        return actaActualizada;
    }
    async asignarSolicitud(actaId, solicitudId) {
        const acta = await this.findById(actaId);
        const solicitud = await prisma.solicitud.findUnique({
            where: { id: solicitudId },
        });
        if (!solicitud) {
            throw new Error('Solicitud no encontrada');
        }
        await this.cambiarEstado(actaId, EstadoActa.ASIGNADA_BUSQUEDA, `Asignada a solicitud ${solicitud.numeroexpediente}`);
        const actaActualizada = await prisma.actafisica.update({
            where: { id: actaId },
            data: {
                solicitud_id: solicitudId,
            },
            include: {
                solicitud: true,
            },
        });
        logger.info(`Acta ${acta.numero} asignada a solicitud ${solicitud.numeroexpediente}`);
        return actaActualizada;
    }
    async marcarEncontrada(actaId, observaciones) {
        const acta = await this.cambiarEstado(actaId, EstadoActa.ENCONTRADA, observaciones || 'Acta localizada en archivo físico');
        return acta;
    }
    async marcarNoEncontrada(actaId, observaciones) {
        const acta = await this.cambiarEstado(actaId, EstadoActa.NO_ENCONTRADA, observaciones || 'Acta no localizada en archivo físico');
        return acta;
    }
    async recibirDatosOCR(actaId, datos) {
        const acta = await this.findById(actaId);
        if (acta.estado !== EstadoActa.ENCONTRADA) {
            throw new Error(`El acta debe estar en estado ENCONTRADA para procesar OCR. Estado actual: ${acta.estado}`);
        }
        const anio = acta.aniolectivo.anio;
        const numeroGrado = acta.grado.numero;
        logger.info(`Procesando OCR para acta ${acta.numero}: ${datos.estudiantes.length} estudiantes`);
        const plantillaCurriculo = await curriculoGradoService.getPlantillaByAnioGrado(anio, numeroGrado);
        if (plantillaCurriculo.length === 0) {
            throw new Error(`No se encontró currículo configurado para ${anio} - Grado ${numeroGrado}. Configure el currículo primero.`);
        }
        logger.info(`Plantilla de currículo: ${plantillaCurriculo.length} áreas curriculares`);
        const certificadosCreados = [];
        const errores = [];
        for (const estudianteOCR of datos.estudiantes) {
            try {
                let estudiante;
                if (estudianteOCR.dni) {
                    estudiante = await prisma.estudiante.findFirst({
                        where: {
                            dni: estudianteOCR.dni,
                        },
                    });
                }
                if (!estudiante) {
                    estudiante = await prisma.estudiante.create({
                        data: {
                            dni: estudianteOCR.dni || `TEMP${Date.now()}${estudianteOCR.numero}`,
                            apellidopaterno: estudianteOCR.apellidoPaterno,
                            apellidomaterno: estudianteOCR.apellidoMaterno,
                            nombres: estudianteOCR.nombres,
                            sexo: estudianteOCR.sexo,
                            fechanacimiento: estudianteOCR.fechaNacimiento
                                ? new Date(estudianteOCR.fechaNacimiento)
                                : new Date('2000-01-01'),
                            estado: 'ACTIVO',
                        },
                    });
                    logger.info(`Estudiante creado: ${estudiante.nombres} ${estudiante.apellidopaterno}`);
                }
                const codigoVirtual = `CERT-${anio}-${numeroGrado}-${Date.now()}-${estudiante.id.substring(0, 8)}`;
                const certificado = await prisma.certificado.create({
                    data: {
                        codigovirtual: codigoVirtual,
                        estudiante_id: estudiante.id,
                        fechaemision: new Date(),
                        horaemision: new Date(),
                        gradoscompletados: [acta.grado.nombre],
                        situacionfinal: estudianteOCR.situacionFinal || 'PENDIENTE',
                        estado: 'BORRADOR',
                    },
                });
                const certificadoDetalle = await prisma.certificadodetalle.create({
                    data: {
                        certificado_id: certificado.id,
                        aniolectivo_id: acta.aniolectivo_id,
                        grado_id: acta.grado_id,
                        situacionfinal: estudianteOCR.situacionFinal,
                        orden: 1,
                    },
                });
                const notasCreadas = [];
                for (const area of plantillaCurriculo) {
                    const notaOCR = estudianteOCR.notas[area.codigo] || estudianteOCR.notas[area.nombre];
                    await prisma.certificadonota.create({
                        data: {
                            certificadodetalle_id: certificadoDetalle.id,
                            area_id: area.id,
                            nota: notaOCR !== undefined ? notaOCR : null,
                            orden: area.orden,
                        },
                    });
                    notasCreadas.push(area.nombre);
                }
                certificadosCreados.push(certificado.id);
                logger.info(`Certificado creado: ${certificado.codigovirtual} - ${estudiante.nombres} ${estudiante.apellidopaterno} (${notasCreadas.length} notas)`);
            }
            catch (error) {
                logger.error(`Error al procesar estudiante ${estudianteOCR.nombres} ${estudianteOCR.apellidoPaterno}:`, error);
                errores.push({
                    estudiante: `${estudianteOCR.nombres} ${estudianteOCR.apellidoPaterno}`,
                    error: error.message,
                });
            }
        }
        const actaActualizada = await prisma.actafisica.update({
            where: { id: actaId },
            data: {
                procesadoconia: true,
                fechaprocesamiento: new Date(),
                datosextraidosjson: datos,
            },
        });
        logger.info(`Procesamiento OCR completado: ${certificadosCreados.length} certificados creados, ${errores.length} errores`);
        return {
            success: true,
            message: `Procesamiento completado`,
            acta: actaActualizada,
            resultados: {
                certificadosCreados: certificadosCreados.length,
                estudiantesTotales: datos.estudiantes.length,
                errores: errores.length > 0 ? errores : undefined,
            },
        };
    }
    async validarManualmente(actaId, observaciones, validado) {
        const acta = await this.findById(actaId);
        if (!acta.procesadoconia) {
            throw new Error('El acta debe estar procesada con OCR para validarla');
        }
        const actaActualizada = await prisma.actafisica.update({
            where: { id: actaId },
            data: {
                observaciones: `${acta.observaciones || ''}\n\nVALIDACIÓN MANUAL (${validado ? 'APROBADA' : 'RECHAZADA'}): ${observaciones}`,
            },
        });
        logger.info(`Acta ${acta.numero} validada manualmente: ${validado ? 'APROBADA' : 'RECHAZADA'}`);
        return actaActualizada;
    }
    async compararOCRconFisica(actaId) {
        const acta = await this.findById(actaId);
        if (!acta.procesadoconia || !acta.datosextraidosjson) {
            throw new Error('El acta debe estar procesada con OCR para compararla');
        }
        const datosOCR = acta.datosextraidosjson;
        const certificados = await prisma.certificado.findMany({
            where: {
                estado: 'BORRADOR',
                fechacreacion: {
                    gte: acta.fechaprocesamiento,
                },
            },
            include: {
                estudiante: true,
                certificadodetalle: {
                    include: {
                        certificadonota: {
                            include: {
                                areacurricular: true,
                            },
                        },
                    },
                },
            },
            take: datosOCR.estudiantes.length,
        });
        return {
            acta: {
                id: acta.id,
                numero: acta.numero,
                anio: acta.aniolectivo.anio,
                grado: acta.grado.nombre,
                urlArchivo: acta.urlarchivo,
            },
            datosOCR: datosOCR.estudiantes,
            certificadosCreados: certificados.map((cert) => ({
                id: cert.id,
                codigoVirtual: cert.codigovirtual,
                estudiante: {
                    id: cert.estudiante.id,
                    dni: cert.estudiante.dni,
                    nombres: cert.estudiante.nombres,
                    apellidoPaterno: cert.estudiante.apellidopaterno,
                    apellidoMaterno: cert.estudiante.apellidomaterno,
                },
                notas: cert.certificadodetalle[0]?.certificadonota.map((nota) => ({
                    area: nota.areacurricular.nombre,
                    nota: nota.nota,
                })),
            })),
        };
    }
    async validarConCorrecciones(actaId, validado, observaciones, correcciones) {
        const acta = await this.findById(actaId);
        if (!acta.procesadoconia) {
            throw new Error('El acta debe estar procesada con OCR para validarla');
        }
        if (correcciones && correcciones.length > 0) {
            for (const correccion of correcciones) {
                const estudiante = await prisma.estudiante.findUnique({
                    where: { id: correccion.estudianteId },
                });
                if (!estudiante) {
                    logger.warn(`Estudiante ${correccion.estudianteId} no encontrado para corrección`);
                    continue;
                }
                const updateData = {};
                if (correccion.campo === 'apellidoPaterno') {
                    updateData.apellidopaterno = correccion.valorNuevo;
                }
                else if (correccion.campo === 'apellidoMaterno') {
                    updateData.apellidomaterno = correccion.valorNuevo;
                }
                else if (correccion.campo === 'nombres') {
                    updateData.nombres = correccion.valorNuevo;
                }
                else if (correccion.campo === 'dni') {
                    updateData.dni = correccion.valorNuevo;
                }
                if (Object.keys(updateData).length > 0) {
                    await prisma.estudiante.update({
                        where: { id: correccion.estudianteId },
                        data: updateData,
                    });
                    logger.info(`Corrección aplicada: ${correccion.campo} de "${correccion.valorAnterior}" a "${correccion.valorNuevo}" para estudiante ${correccion.estudianteId}`);
                }
            }
        }
        const observacionesFinal = correcciones && correcciones.length > 0
            ? `${observaciones}\n\nCORRECCIONES APLICADAS:\n${correcciones.map((c) => `- ${c.campo}: "${c.valorAnterior}" → "${c.valorNuevo}"`).join('\n')}`
            : observaciones;
        const actaActualizada = await prisma.actafisica.update({
            where: { id: actaId },
            data: {
                observaciones: `${acta.observaciones || ''}\n\nVALIDACIÓN CON CORRECCIONES (${validado ? 'APROBADA' : 'RECHAZADA'}): ${observacionesFinal}`,
            },
        });
        logger.info(`Acta ${acta.numero} validada con ${correcciones?.length || 0} correcciones: ${validado ? 'APROBADA' : 'RECHAZADA'}`);
        return actaActualizada;
    }
    async exportarExcel(actaId) {
        const acta = await this.findById(actaId);
        if (!acta.procesadoconia || !acta.datosextraidosjson) {
            throw new Error('El acta debe estar procesada con OCR para exportar a Excel');
        }
        const datosOCR = acta.datosextraidosjson;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Acta de Evaluación');
        worksheet.pageSetup.orientation = 'landscape';
        worksheet.pageSetup.paperSize = 9;
        worksheet.mergeCells('A1:F1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `ACTA DE EVALUACIÓN - ${acta.numero}`;
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.addRow([]);
        worksheet.addRow(['Año Lectivo:', acta.aniolectivo.anio]);
        worksheet.addRow(['Grado:', acta.grado.nombre]);
        worksheet.addRow(['Sección:', acta.seccion || '-']);
        worksheet.addRow(['Turno:', acta.turno || '-']);
        worksheet.addRow([]);
        const headerRow = worksheet.addRow([
            'N°',
            'Apellido Paterno',
            'Apellido Materno',
            'Nombres',
            'Sexo',
            'Situación Final',
        ]);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9D9D9' },
        };
        datosOCR.estudiantes.forEach((estudiante) => {
            worksheet.addRow([
                estudiante.numero,
                estudiante.apellidoPaterno,
                estudiante.apellidoMaterno,
                estudiante.nombres,
                estudiante.sexo,
                estudiante.situacionFinal || '-',
            ]);
        });
        worksheet.columns = [
            { width: 8 },
            { width: 20 },
            { width: 20 },
            { width: 25 },
            { width: 10 },
            { width: 15 },
        ];
        const buffer = await workbook.xlsx.writeBuffer();
        const excelFilename = `ACTA_${acta.numero}_${Date.now()}.xlsx`;
        const excelUrl = `/storage/actas/excel/${excelFilename}`;
        await prisma.actafisica.update({
            where: { id: actaId },
            data: {
                urlexcelexportado: excelUrl,
                fechaexportacionexcel: new Date(),
            },
        });
        logger.info(`Acta ${acta.numero} exportada a Excel`);
        return Buffer.from(buffer);
    }
}
export const actaFisicaService = new ActaFisicaService();
//# sourceMappingURL=actas-fisicas.service.js.map