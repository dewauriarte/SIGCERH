import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { EstadoSolicitud, RolSolicitud, TRANSICIONES_VALIDAS, } from './types';
const prisma = new PrismaClient();
export class SolicitudStateMachine {
    async transicion(solicitudId, estadoDestino, usuarioId, rol, observaciones, metadata) {
        const solicitud = await prisma.solicitud.findUnique({
            where: { id: solicitudId },
            include: {
                estudiante: true,
                tiposolicitud: true,
            },
        });
        if (!solicitud) {
            throw new Error(`Solicitud ${solicitudId} no encontrada`);
        }
        const estadoActual = solicitud.estado;
        this.validateTransicion(estadoActual, estadoDestino, rol);
        await this.onBeforeTransicion({
            solicitudId,
            estadoAnterior: estadoActual,
            estadoNuevo: estadoDestino,
            usuarioId,
            rol,
            observaciones,
            metadata,
        });
        const updateData = {
            estado: estadoDestino,
            fechaactualizacion: new Date(),
        };
        this.updateTrazabilidadFields(updateData, estadoDestino, usuarioId);
        if (observaciones) {
            updateData.observaciones = observaciones;
        }
        const solicitudActualizada = await prisma.solicitud.update({
            where: { id: solicitudId },
            data: updateData,
            include: {
                estudiante: true,
                tiposolicitud: true,
                pago: true,
                certificado: true,
            },
        });
        await this.registrarHistorial(solicitudId, estadoActual, estadoDestino, usuarioId, observaciones);
        await this.onAfterTransicion({
            solicitudId,
            estadoAnterior: estadoActual,
            estadoNuevo: estadoDestino,
            usuarioId,
            rol,
            observaciones,
            metadata,
        });
        logger.info(`Transición exitosa: Solicitud ${solicitud.numeroexpediente || solicitudId} de ${estadoActual} → ${estadoDestino} por ${rol}`);
        return solicitudActualizada;
    }
    validateTransicion(estadoActual, estadoDestino, rol) {
        const config = TRANSICIONES_VALIDAS[estadoActual];
        if (!config) {
            throw new Error(`Estado actual "${estadoActual}" no es válido`);
        }
        if (!config.nextStates.includes(estadoDestino)) {
            throw new Error(`Transición no permitida: No se puede ir de "${estadoActual}" a "${estadoDestino}". Estados permitidos: ${config.nextStates.join(', ')}`);
        }
        if (!config.roles.includes(rol) && !config.roles.includes(RolSolicitud.SISTEMA)) {
            throw new Error(`Rol "${rol}" no tiene permisos para ejecutar la transición de "${estadoActual}" a "${estadoDestino}". Roles permitidos: ${config.roles.join(', ')}`);
        }
        logger.debug(`Transición validada: ${estadoActual} → ${estadoDestino} por ${rol}`);
    }
    updateTrazabilidadFields(updateData, estadoDestino, usuarioId) {
        const now = new Date();
        switch (estadoDestino) {
            case EstadoSolicitud.REGISTRADA:
                updateData.usuariosolicitud_id = usuarioId;
                updateData.fechasolicitud = now;
                break;
            case EstadoSolicitud.PAGO_VALIDADO:
                updateData.usuariovalidacionpago_id = usuarioId;
                updateData.fechavalidacionpago = now;
                break;
            case EstadoSolicitud.EN_PROCESAMIENTO_OCR:
                updateData.usuariogeneracion_id = usuarioId;
                updateData.fechainicioproceso = now;
                break;
            case EstadoSolicitud.CERTIFICADO_EMITIDO:
                updateData.fechageneracioncertificado = now;
                break;
            case EstadoSolicitud.EN_FIRMA_DIRECCION:
            case EstadoSolicitud.ENTREGADO:
                if (estadoDestino === EstadoSolicitud.ENTREGADO) {
                    updateData.usuarioentrega_id = usuarioId;
                    updateData.fechaentrega = now;
                }
                break;
            case EstadoSolicitud.ACTA_NO_ENCONTRADA:
                updateData.fecharechazo = now;
                updateData.motivorechazo = 'Acta física no encontrada en archivo';
                break;
        }
    }
    async registrarHistorial(solicitudId, estadoAnterior, estadoNuevo, usuarioId, observaciones) {
        try {
            await prisma.solicitudhistorial.create({
                data: {
                    solicitud_id: solicitudId,
                    estadoanterior: estadoAnterior,
                    estadonuevo: estadoNuevo,
                    usuario_id: usuarioId,
                    observaciones: observaciones || null,
                    fecha: new Date(),
                },
            });
            logger.debug(`Historial registrado: ${estadoAnterior} → ${estadoNuevo} para solicitud ${solicitudId}`);
        }
        catch (error) {
            logger.error('Error al registrar historial:', error);
        }
    }
    async onBeforeTransicion(data) {
        switch (data.estadoNuevo) {
            case EstadoSolicitud.PAGO_VALIDADO:
                const solicitudConPago = await prisma.solicitud.findUnique({
                    where: { id: data.solicitudId },
                    include: { pago: true },
                });
                if (!solicitudConPago?.pago_id) {
                    throw new Error('No se puede validar pago: no existe pago asociado a la solicitud');
                }
                break;
            case EstadoSolicitud.EN_REGISTRO_SIAGEC:
                if (data.estadoAnterior !== EstadoSolicitud.EN_VALIDACION_UGEL) {
                    throw new Error('Solo se puede registrar en SIAGEC después de aprobación UGEL');
                }
                break;
            case EstadoSolicitud.CERTIFICADO_EMITIDO:
                const solicitudConCert = await prisma.solicitud.findUnique({
                    where: { id: data.solicitudId },
                    include: { certificado: true },
                });
                if (!solicitudConCert?.certificado_id) {
                    throw new Error('No se puede emitir: no existe certificado asociado');
                }
                break;
        }
        logger.debug(`Hook onBeforeTransicion ejecutado para ${data.estadoNuevo}`);
    }
    async onAfterTransicion(data) {
        await this.enviarNotificacion(data);
        await this.actualizarEntidadesRelacionadas(data);
        logger.debug(`Hook onAfterTransicion ejecutado para ${data.estadoNuevo}`);
    }
    async enviarNotificacion(data) {
        const estadosNotificables = [
            EstadoSolicitud.ACTA_ENCONTRADA_PENDIENTE_PAGO,
            EstadoSolicitud.ACTA_NO_ENCONTRADA,
            EstadoSolicitud.PAGO_VALIDADO,
            EstadoSolicitud.CERTIFICADO_EMITIDO,
        ];
        if (!estadosNotificables.includes(data.estadoNuevo)) {
            return;
        }
        try {
            const solicitud = await prisma.solicitud.findUnique({
                where: { id: data.solicitudId },
                include: { estudiante: true },
            });
            if (!solicitud)
                return;
            logger.info(`[NOTIFICACIÓN] Enviar notificación para estado ${data.estadoNuevo} a solicitud ${solicitud.numeroexpediente}`);
        }
        catch (error) {
            logger.error('Error al enviar notificación:', error);
        }
    }
    async actualizarEntidadesRelacionadas(data) {
        try {
            if (data.estadoNuevo === EstadoSolicitud.EN_BUSQUEDA ||
                data.estadoNuevo === EstadoSolicitud.ACTA_ENCONTRADA_PENDIENTE_PAGO) {
                const solicitud = await prisma.solicitud.findUnique({
                    where: { id: data.solicitudId },
                    include: { actafisica: true },
                });
                if (solicitud?.actafisica && solicitud.actafisica.length > 0) {
                    const actaEstado = data.estadoNuevo === EstadoSolicitud.EN_BUSQUEDA
                        ? 'ASIGNADA_BUSQUEDA'
                        : 'ENCONTRADA';
                    await prisma.actafisica.update({
                        where: { id: solicitud.actafisica[0].id },
                        data: { estado: actaEstado },
                    });
                    logger.debug(`Acta física actualizada a estado ${actaEstado}`);
                }
            }
        }
        catch (error) {
            logger.error('Error al actualizar entidades relacionadas:', error);
        }
    }
    async getHistorial(solicitudId) {
        return await prisma.solicitudhistorial.findMany({
            where: { solicitud_id: solicitudId },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombres: true,
                        apellidos: true,
                        email: true,
                    },
                },
            },
            orderBy: { fecha: 'asc' },
        });
    }
    async canTransition(solicitudId, estadoDestino, rol) {
        try {
            const solicitud = await prisma.solicitud.findUnique({
                where: { id: solicitudId },
            });
            if (!solicitud) {
                return { can: false, reason: 'Solicitud no encontrada' };
            }
            const estadoActual = solicitud.estado;
            this.validateTransicion(estadoActual, estadoDestino, rol);
            return { can: true };
        }
        catch (error) {
            return { can: false, reason: error.message };
        }
    }
}
export const solicitudStateMachine = new SolicitudStateMachine();
//# sourceMappingURL=state-machine.js.map