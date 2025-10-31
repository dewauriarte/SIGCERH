import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { solicitudStateMachine } from './state-machine';
import { EstadoSolicitud, RolSolicitud, } from './types';
const prisma = new PrismaClient();
export class SolicitudService {
    async create(data, usuarioId) {
        const estudiante = await prisma.estudiante.findUnique({
            where: { id: data.estudianteId },
        });
        if (!estudiante) {
            throw new Error('Estudiante no encontrado');
        }
        const tipoSolicitud = await prisma.tiposolicitud.findUnique({
            where: { id: data.tipoSolicitudId },
        });
        if (!tipoSolicitud) {
            throw new Error('Tipo de solicitud no encontrado');
        }
        const anio = new Date().getFullYear();
        const count = await prisma.solicitud.count({
            where: {
                fechasolicitud: {
                    gte: new Date(`${anio}-01-01`),
                    lte: new Date(`${anio}-12-31`),
                },
            },
        });
        const numero = String(count + 1).padStart(6, '0');
        const numeroseguimiento = `S-${anio}-${numero}`;
        const numeroexpediente = `EXP-${anio}-${numero}`;
        const solicitud = await prisma.solicitud.create({
            data: {
                numeroexpediente,
                numeroseguimiento,
                estudiante_id: data.estudianteId,
                tiposolicitud_id: data.tipoSolicitudId,
                modalidadentrega: data.modalidadEntrega,
                direccionentrega: data.direccionEntrega,
                estado: EstadoSolicitud.REGISTRADA,
                prioridad: data.prioridad || 'NORMAL',
                observaciones: data.observaciones,
                usuariosolicitud_id: usuarioId,
                fechasolicitud: new Date(),
            },
            include: {
                estudiante: true,
                tiposolicitud: true,
            },
        });
        await prisma.solicitudhistorial.create({
            data: {
                solicitud_id: solicitud.id,
                estadoanterior: null,
                estadonuevo: EstadoSolicitud.REGISTRADA,
                usuario_id: usuarioId || null,
                observaciones: 'Solicitud creada por usuario público',
                fecha: new Date(),
            },
        });
        logger.info(`Solicitud creada: ${solicitud.numeroexpediente} para estudiante ${estudiante.dni}`);
        return solicitud;
    }
    async findAll(filtros = {}, options = {}) {
        const page = options.page || 1;
        const limit = options.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        if (filtros.estados && filtros.estados.length > 0) {
            where.estado = { in: filtros.estados };
        }
        if (filtros.estudianteId) {
            where.estudiante_id = filtros.estudianteId;
        }
        if (filtros.tipoSolicitudId) {
            where.tiposolicitud_id = filtros.tipoSolicitudId;
        }
        if (filtros.prioridad) {
            where.prioridad = filtros.prioridad;
        }
        if (filtros.numeroExpediente) {
            where.numeroexpediente = { contains: filtros.numeroExpediente, mode: 'insensitive' };
        }
        if (filtros.numeroseguimiento) {
            where.numeroseguimiento = filtros.numeroseguimiento;
        }
        if (filtros.fechaDesde || filtros.fechaHasta) {
            where.fechasolicitud = {};
            if (filtros.fechaDesde) {
                where.fechasolicitud.gte = filtros.fechaDesde;
            }
            if (filtros.fechaHasta) {
                where.fechasolicitud.lte = filtros.fechaHasta;
            }
        }
        if (filtros.pendientePago !== undefined) {
            where.estado = EstadoSolicitud.ACTA_ENCONTRADA_PENDIENTE_PAGO;
            where.pago_id = filtros.pendientePago ? null : { not: null };
        }
        if (filtros.conCertificado !== undefined) {
            where.certificado_id = filtros.conCertificado ? { not: null } : null;
        }
        const [solicitudes, total] = await Promise.all([
            prisma.solicitud.findMany({
                where,
                skip,
                take: limit,
                include: {
                    estudiante: {
                        select: {
                            id: true,
                            dni: true,
                            nombres: true,
                            apellidopaterno: true,
                            apellidomaterno: true,
                        },
                    },
                    tiposolicitud: {
                        select: {
                            id: true,
                            nombre: true,
                            codigo: true,
                        },
                    },
                    pago: {
                        select: {
                            id: true,
                            monto: true,
                            estado: true,
                            metodopago: true,
                        },
                    },
                    certificado: {
                        select: {
                            id: true,
                            codigovirtual: true,
                            estado: true,
                        },
                    },
                },
                orderBy: { fechasolicitud: 'desc' },
            }),
            prisma.solicitud.count({ where }),
        ]);
        return {
            data: solicitudes,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findById(id) {
        const solicitud = await prisma.solicitud.findUnique({
            where: { id },
            include: {
                estudiante: true,
                tiposolicitud: true,
                pago: true,
                certificado: true,
                actafisica: {
                    include: {
                        aniolectivo: true,
                        grado: true,
                    },
                },
                usuario_solicitud_usuariosolicitud_idTousuario: {
                    select: {
                        id: true,
                        nombres: true,
                        apellidos: true,
                        email: true,
                    },
                },
                usuario_solicitud_usuariovalidacionpago_idTousuario: {
                    select: {
                        id: true,
                        nombres: true,
                        apellidos: true,
                    },
                },
                usuario_solicitud_usuariogeneracion_idTousuario: {
                    select: {
                        id: true,
                        nombres: true,
                        apellidos: true,
                    },
                },
                usuario_solicitud_usuariofirma_idTousuario: {
                    select: {
                        id: true,
                        nombres: true,
                        apellidos: true,
                    },
                },
                usuario_solicitud_usuarioentrega_idTousuario: {
                    select: {
                        id: true,
                        nombres: true,
                        apellidos: true,
                    },
                },
            },
        });
        if (!solicitud) {
            throw new Error('Solicitud no encontrada');
        }
        return solicitud;
    }
    async findByCodigo(codigo) {
        const solicitud = await prisma.solicitud.findFirst({
            where: { numeroseguimiento: codigo },
            include: {
                estudiante: {
                    select: {
                        dni: true,
                        nombres: true,
                        apellidopaterno: true,
                        apellidomaterno: true,
                    },
                },
                tiposolicitud: {
                    select: {
                        nombre: true,
                    },
                },
            },
        });
        if (!solicitud) {
            throw new Error('Código de seguimiento no encontrado');
        }
        return {
            numeroExpediente: solicitud.numeroexpediente,
            numeroseguimiento: solicitud.numeroseguimiento,
            estado: solicitud.estado,
            fechasolicitud: solicitud.fechasolicitud,
            estudiante: {
                nombre: `${solicitud.estudiante.nombres} ${solicitud.estudiante.apellidopaterno}`,
            },
            tipoSolicitud: solicitud.tiposolicitud.nombre,
            modalidadEntrega: solicitud.modalidadentrega,
        };
    }
    async findByNumeroExpediente(numeroExpediente) {
        const solicitud = await prisma.solicitud.findFirst({
            where: { numeroexpediente: numeroExpediente },
        });
        if (!solicitud) {
            throw new Error('Número de expediente no encontrado');
        }
        return this.findById(solicitud.id);
    }
    async getHistorial(solicitudId) {
        return await solicitudStateMachine.getHistorial(solicitudId);
    }
    async derivarAEditor(solicitudId, usuarioId, editorId, observaciones) {
        return await solicitudStateMachine.transicion(solicitudId, EstadoSolicitud.DERIVADO_A_EDITOR, usuarioId, RolSolicitud.MESA_DE_PARTES, observaciones || `Derivado a Editor ${editorId || 'general'}`, { editorId });
    }
    async iniciarBusqueda(solicitudId, usuarioId, observaciones) {
        return await solicitudStateMachine.transicion(solicitudId, EstadoSolicitud.EN_BUSQUEDA, usuarioId, RolSolicitud.EDITOR, observaciones || 'Iniciando búsqueda de acta física en archivo');
    }
    async marcarActaEncontrada(solicitudId, usuarioId, data) {
        await prisma.actafisica.update({
            where: { id: data.actaId },
            data: {
                solicitud_id: solicitudId,
                estado: 'ENCONTRADA',
                ubicacionfisica: data.ubicacionFisica,
            },
        });
        const resultado = await solicitudStateMachine.transicion(solicitudId, EstadoSolicitud.ACTA_ENCONTRADA_PENDIENTE_PAGO, usuarioId, RolSolicitud.EDITOR, data.observaciones ||
            `Acta encontrada. Ubicación: ${data.ubicacionFisica}`, { actaId: data.actaId });
        this.enviarNotificacionActaEncontrada(solicitudId).catch((error) => {
            logger.error(`Error al enviar notificación de acta encontrada: ${error.message}`);
        });
        return resultado;
    }
    async enviarNotificacionActaEncontrada(solicitudId) {
        try {
            const { notificacionService } = await import('../notificaciones/notificacion.service.js');
            const { TipoNotificacion, CanalNotificacion } = await import('../notificaciones/types.js');
            const solicitud = await prisma.solicitud.findUnique({
                where: { id: solicitudId },
                include: {
                    estudiante: {
                        select: {
                            nombres: true,
                            apellidopaterno: true,
                            apellidomaterno: true,
                            email: true,
                        },
                    },
                },
            });
            if (!solicitud || !solicitud.estudiante?.email) {
                logger.warn(`No se pudo enviar notificación: solicitud ${solicitudId} sin email`);
                return;
            }
            const nombreEstudiante = `${solicitud.estudiante.apellidopaterno} ${solicitud.estudiante.apellidomaterno} ${solicitud.estudiante.nombres}`;
            await notificacionService.crear(TipoNotificacion.ACTA_ENCONTRADA, solicitud.estudiante.email, solicitudId, {
                nombreEstudiante,
                codigoSeguimiento: solicitud.numeroexpediente || solicitud.id.substring(0, 8),
                monto: 15.0,
                enlacePlataforma: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/seguimiento/${solicitud.numeroexpediente}`,
            }, CanalNotificacion.EMAIL);
        }
        catch (error) {
            logger.error(`Error al crear notificación de acta encontrada: ${error.message}`);
        }
    }
    async marcarActaNoEncontrada(solicitudId, usuarioId, data) {
        return await solicitudStateMachine.transicion(solicitudId, EstadoSolicitud.ACTA_NO_ENCONTRADA, usuarioId, RolSolicitud.EDITOR, `Motivo: ${data.motivoNoEncontrada}\nObservaciones: ${data.observaciones}`, {
            motivoNoEncontrada: data.motivoNoEncontrada,
            sugerencias: data.sugerenciasUsuario,
        });
    }
    async validarPago(solicitudId, data, usuarioId) {
        await prisma.solicitud.update({
            where: { id: solicitudId },
            data: { pago_id: data.pagoId },
        });
        return await solicitudStateMachine.transicion(solicitudId, EstadoSolicitud.PAGO_VALIDADO, usuarioId || 'SISTEMA', usuarioId ? RolSolicitud.MESA_DE_PARTES : RolSolicitud.SISTEMA, data.observaciones || `Pago validado. Método: ${data.metodoPago || 'DIGITAL'}`, { pagoId: data.pagoId, metodoPago: data.metodoPago });
    }
    async iniciarProcesamiento(solicitudId, usuarioId, actaId, observaciones) {
        return await solicitudStateMachine.transicion(solicitudId, EstadoSolicitud.EN_PROCESAMIENTO_OCR, usuarioId, RolSolicitud.EDITOR, observaciones || 'Iniciando digitalización y procesamiento con OCR', { actaId });
    }
    async enviarAValidacionUGEL(solicitudId, usuarioId, observaciones) {
        return await solicitudStateMachine.transicion(solicitudId, EstadoSolicitud.EN_VALIDACION_UGEL, usuarioId, RolSolicitud.EDITOR, observaciones || 'Certificado enviado a validación de UGEL');
    }
    async aprobarUGEL(solicitudId, usuarioId, data) {
        return await solicitudStateMachine.transicion(solicitudId, EstadoSolicitud.EN_REGISTRO_SIAGEC, usuarioId, RolSolicitud.UGEL, data.observaciones || 'Certificado aprobado por UGEL', { validadoPor: data.validadoPor });
    }
    async observarUGEL(solicitudId, usuarioId, data) {
        return await solicitudStateMachine.transicion(solicitudId, EstadoSolicitud.OBSERVADO_POR_UGEL, usuarioId, RolSolicitud.UGEL, `Observaciones: ${data.observaciones}\nCampos observados: ${data.camposObservados.join(', ')}`, {
            camposObservados: data.camposObservados,
            requiereCorreccion: data.requiereCorreccion,
        });
    }
    async corregirObservacionUGEL(solicitudId, usuarioId, data) {
        return await solicitudStateMachine.transicion(solicitudId, EstadoSolicitud.EN_VALIDACION_UGEL, usuarioId, RolSolicitud.EDITOR, `Correcciones aplicadas: ${data.observaciones}\nCampos corregidos: ${data.camposCorregidos.join(', ')}`, { camposCorregidos: data.camposCorregidos });
    }
    async registrarSIAGEC(solicitudId, usuarioId, data) {
        return await solicitudStateMachine.transicion(solicitudId, EstadoSolicitud.EN_FIRMA_DIRECCION, usuarioId, RolSolicitud.SIAGEC, data.observaciones ||
            `Registrado en SIAGEC. Código Virtual: ${data.codigoVirtual}`, {
            codigoQR: data.codigoQR,
            codigoVirtual: data.codigoVirtual,
            urlVerificacion: data.urlVerificacion,
        });
    }
    async firmarCertificado(solicitudId, usuarioId, data) {
        await prisma.solicitud.update({
            where: { id: solicitudId },
            data: {
                usuariofirma_id: usuarioId,
                fechafirma: new Date(),
            },
        });
        const resultado = await solicitudStateMachine.transicion(solicitudId, EstadoSolicitud.CERTIFICADO_EMITIDO, usuarioId, RolSolicitud.DIRECCION, data.observaciones || `Certificado firmado (${data.tipoFirma})`, {
            tipoFirma: data.tipoFirma,
            certificadoFirmadoUrl: data.certificadoFirmadoUrl,
        });
        this.enviarNotificacionCertificadoEmitido(solicitudId).catch((error) => {
            logger.error(`Error al enviar notificación de certificado emitido: ${error.message}`);
        });
        return resultado;
    }
    async enviarNotificacionCertificadoEmitido(solicitudId) {
        try {
            const { notificacionService } = await import('../notificaciones/notificacion.service.js');
            const { TipoNotificacion, CanalNotificacion } = await import('../notificaciones/types.js');
            const solicitud = await prisma.solicitud.findUnique({
                where: { id: solicitudId },
                include: {
                    estudiante: {
                        select: {
                            nombres: true,
                            apellidopaterno: true,
                            apellidomaterno: true,
                            email: true,
                        },
                    },
                },
            });
            if (!solicitud || !solicitud.estudiante?.email) {
                logger.warn(`No se pudo enviar notificación: solicitud ${solicitudId} sin email`);
                return;
            }
            const nombreEstudiante = `${solicitud.estudiante.apellidopaterno} ${solicitud.estudiante.apellidomaterno} ${solicitud.estudiante.nombres}`;
            const certificado = await prisma.certificado.findFirst({
                where: { estudiante_id: solicitud.estudiante_id },
                orderBy: { fechaemision: 'desc' },
                select: {
                    codigovirtual: true,
                    urlpdf: true,
                },
            });
            await notificacionService.crear(TipoNotificacion.CERTIFICADO_EMITIDO, solicitud.estudiante.email, solicitudId, {
                nombreEstudiante,
                codigoVirtual: certificado?.codigovirtual || 'PENDIENTE',
                urlDescarga: certificado?.urlpdf
                    ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificados/${certificado.codigovirtual}`
                    : `${process.env.FRONTEND_URL || 'http://localhost:3000'}/mis-certificados`,
                enlacePlataforma: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/seguimiento/${solicitud.numeroexpediente}`,
            }, CanalNotificacion.EMAIL);
        }
        catch (error) {
            logger.error(`Error al crear notificación de certificado emitido: ${error.message}`);
        }
    }
    async marcarEntregado(solicitudId, usuarioId, data) {
        return await solicitudStateMachine.transicion(solicitudId, EstadoSolicitud.ENTREGADO, usuarioId, data.tipoEntrega === 'DESCARGA'
            ? RolSolicitud.SISTEMA
            : RolSolicitud.MESA_DE_PARTES, data.observaciones ||
            `Certificado entregado (${data.tipoEntrega}${data.dniReceptor ? ` - DNI: ${data.dniReceptor}` : ''})`, {
            tipoEntrega: data.tipoEntrega,
            dniReceptor: data.dniReceptor,
            firmaRecepcion: data.firmaRecepcion,
        });
    }
    async getPendientesDerivacion(options = {}) {
        return await this.findAll({ estado: EstadoSolicitud.REGISTRADA }, options);
    }
    async getAsignadasBusqueda(editorId, options = {}) {
        return await this.findAll({
            estados: [
                EstadoSolicitud.DERIVADO_A_EDITOR,
                EstadoSolicitud.EN_BUSQUEDA,
            ],
            asignadoAEditor: editorId,
        }, options);
    }
    async getPendientesValidacionUGEL(options = {}) {
        return await this.findAll({ estado: EstadoSolicitud.EN_VALIDACION_UGEL }, options);
    }
    async getPendientesRegistroSIAGEC(options = {}) {
        return await this.findAll({ estado: EstadoSolicitud.EN_REGISTRO_SIAGEC }, options);
    }
    async getPendientesFirma(options = {}) {
        return await this.findAll({ estado: EstadoSolicitud.EN_FIRMA_DIRECCION }, options);
    }
    async getListasEntrega(options = {}) {
        return await this.findAll({ estado: EstadoSolicitud.CERTIFICADO_EMITIDO }, options);
    }
}
export const solicitudService = new SolicitudService();
//# sourceMappingURL=solicitud.service.js.map