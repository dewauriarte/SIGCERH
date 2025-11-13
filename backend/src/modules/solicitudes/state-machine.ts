/**
 * Máquina de Estados para Solicitudes
 * Gestiona transiciones, validaciones y registro automático en historial
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import {
  EstadoSolicitud,
  RolSolicitud,
  TransicionData,
  TRANSICIONES_VALIDAS,
} from './types';

const prisma = new PrismaClient();

export class SolicitudStateMachine {
  /**
   * Ejecutar una transición de estado con validaciones completas
   */
  async transicion(
    solicitudId: string,
    estadoDestino: EstadoSolicitud,
    usuarioId: string,
    rol: RolSolicitud,
    observaciones?: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    // 1. Obtener solicitud actual
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

    const estadoActual = solicitud.estado as EstadoSolicitud;

    // 2. Validar transición
    this.validateTransicion(estadoActual, estadoDestino, rol);

    // 3. Ejecutar hooks pre-transición
    await this.onBeforeTransicion({
      solicitudId,
      estadoAnterior: estadoActual,
      estadoNuevo: estadoDestino,
      usuarioId,
      rol,
      observaciones,
      metadata,
    });

    // 4. Actualizar estado en base de datos
    const updateData: any = {
      estado: estadoDestino,
      fechaactualizacion: new Date(),
    };

    // Actualizar campos de trazabilidad según el estado
    this.updateTrazabilidadFields(updateData, estadoDestino, usuarioId, metadata);

    // NO sobrescribir observaciones - se preserva el JSON existente
    // Las observaciones se manejan por separado en cada servicio específico
    // (editor.service, mesa-partes.service, etc.)

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

    // 5. Registrar en historial
    await this.registrarHistorial(
      solicitudId,
      estadoActual,
      estadoDestino,
      usuarioId,
      observaciones
    );

    // 6. Ejecutar hooks post-transición (notificaciones, etc.)
    await this.onAfterTransicion({
      solicitudId,
      estadoAnterior: estadoActual,
      estadoNuevo: estadoDestino,
      usuarioId,
      rol,
      observaciones,
      metadata,
    });

    logger.info(
      `Transición exitosa: Solicitud ${solicitud.numeroexpediente || solicitudId} de ${estadoActual} → ${estadoDestino} por ${rol}`
    );

    return solicitudActualizada;
  }

  /**
   * Validar que la transición es permitida
   */
  validateTransicion(
    estadoActual: EstadoSolicitud,
    estadoDestino: EstadoSolicitud,
    rol: RolSolicitud
  ): void {
    // Validar que el estado actual existe en el mapa de transiciones
    const config = TRANSICIONES_VALIDAS[estadoActual];
    if (!config) {
      throw new Error(
        `Estado actual "${estadoActual}" no es válido`
      );
    }

    // Validar que el estado destino es permitido desde el estado actual
    if (!config.nextStates.includes(estadoDestino)) {
      throw new Error(
        `Transición no permitida: No se puede ir de "${estadoActual}" a "${estadoDestino}". Estados permitidos: ${config.nextStates.join(', ')}`
      );
    }

    // Validar que el rol puede ejecutar esta transición
    if (!config.roles.includes(rol) && !config.roles.includes(RolSolicitud.SISTEMA)) {
      throw new Error(
        `Rol "${rol}" no tiene permisos para ejecutar la transición de "${estadoActual}" a "${estadoDestino}". Roles permitidos: ${config.roles.join(', ')}`
      );
    }

    logger.debug(`Transición validada: ${estadoActual} → ${estadoDestino} por ${rol}`);
  }

  /**
   * Actualizar campos de trazabilidad según el estado destino
   */
  private updateTrazabilidadFields(
    updateData: any,
    estadoDestino: EstadoSolicitud,
    usuarioId: string,
    metadata?: Record<string, any>
  ): void {
    const now = new Date();

    switch (estadoDestino) {
      case EstadoSolicitud.REGISTRADA:
        updateData.usuariosolicitud_id = usuarioId;
        updateData.fechasolicitud = now;
        break;

      case EstadoSolicitud.DERIVADO_A_EDITOR:
        // Asignar editor si se especificó en metadata
        if (metadata?.editorId) {
          updateData.usuariogeneracion_id = metadata.editorId;
        }
        updateData.fechainicioproceso = now;
        break;

      case EstadoSolicitud.EN_BUSQUEDA:
        // Si aún no hay editor asignado, usar el usuario que inicia la búsqueda
        if (!updateData.usuariogeneracion_id) {
          updateData.usuariogeneracion_id = usuarioId;
        }
        break;

      case EstadoSolicitud.PAGO_VALIDADO:
        updateData.usuariovalidacionpago_id = usuarioId;
        updateData.fechavalidacionpago = now;
        break;

      case EstadoSolicitud.EN_PROCESAMIENTO_OCR:
        // Si ya hay editor asignado, no sobrescribirlo
        if (!updateData.usuariogeneracion_id) {
          updateData.usuariogeneracion_id = usuarioId;
        }
        if (!updateData.fechainicioproceso) {
          updateData.fechainicioproceso = now;
        }
        break;

      case EstadoSolicitud.CERTIFICADO_EMITIDO:
        updateData.fechageneracioncertificado = now;
        break;

      case EstadoSolicitud.EN_FIRMA_DIRECCION:
      case EstadoSolicitud.ENTREGADO:
        // La firma se registrará cuando se ejecute firmarCertificado
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

  /**
   * Registrar transición en historial
   */
  private async registrarHistorial(
    solicitudId: string,
    estadoAnterior: EstadoSolicitud,
    estadoNuevo: EstadoSolicitud,
    usuarioId: string,
    observaciones?: string
  ): Promise<void> {
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

      logger.debug(
        `Historial registrado: ${estadoAnterior} → ${estadoNuevo} para solicitud ${solicitudId}`
      );
    } catch (error) {
      logger.error('Error al registrar historial:', error);
      // No fallar la transición si falla el historial, pero loguear el error
    }
  }

  /**
   * Hook ejecutado ANTES de la transición
   * Útil para validaciones de negocio adicionales
   */
  private async onBeforeTransicion(data: TransicionData): Promise<void> {
    // Validaciones específicas según el estado destino
    switch (data.estadoNuevo) {
      case EstadoSolicitud.PAGO_VALIDADO:
        // Validar que existe un pago asociado
        const solicitudConPago = await prisma.solicitud.findUnique({
          where: { id: data.solicitudId },
          include: { pago: true },
        });

        if (!solicitudConPago?.pago_id) {
          throw new Error(
            'No se puede validar pago: no existe pago asociado a la solicitud'
          );
        }
        break;

      case EstadoSolicitud.EN_REGISTRO_SIAGEC:
        // Validar que UGEL aprobó
        if (data.estadoAnterior !== EstadoSolicitud.EN_VALIDACION_UGEL) {
          throw new Error(
            'Solo se puede registrar en SIAGEC después de aprobación UGEL'
          );
        }
        break;

      case EstadoSolicitud.CERTIFICADO_EMITIDO:
        // Validar que existe certificado asociado
        const solicitudConCert = await prisma.solicitud.findUnique({
          where: { id: data.solicitudId },
          include: { certificado: true },
        });

        if (!solicitudConCert?.certificado_id) {
          throw new Error(
            'No se puede emitir: no existe certificado asociado'
          );
        }
        break;
    }

    logger.debug(`Hook onBeforeTransicion ejecutado para ${data.estadoNuevo}`);
  }

  /**
   * Hook ejecutado DESPUÉS de la transición
   * Útil para disparar notificaciones, actualizar entidades relacionadas, etc.
   */
  private async onAfterTransicion(data: TransicionData): Promise<void> {
    // Disparar notificaciones según el estado
    await this.enviarNotificacion(data);

    // Actualizar entidades relacionadas según el estado
    await this.actualizarEntidadesRelacionadas(data);

    logger.debug(`Hook onAfterTransicion ejecutado para ${data.estadoNuevo}`);
  }

  /**
   * Enviar notificación al usuario según el estado
   * TODO: Integrar con Sprint 10 (Módulo Notificaciones)
   */
  private async enviarNotificacion(data: TransicionData): Promise<void> {
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

      if (!solicitud) return;

      logger.info(
        `[NOTIFICACIÓN] Enviar notificación para estado ${data.estadoNuevo} a solicitud ${solicitud.numeroexpediente}`
      );

      // TODO: Implementar envío real cuando exista módulo de notificaciones
      // await notificacionService.enviar({
      //   solicitudId: data.solicitudId,
      //   tipo: this.getTipoNotificacion(data.estadoNuevo),
      //   destinatario: solicitud.estudiante,
      //   estado: data.estadoNuevo
      // });
    } catch (error) {
      logger.error('Error al enviar notificación:', error);
      // No fallar la transición si falla la notificación
    }
  }

  /**
   * Actualizar entidades relacionadas después de una transición
   */
  private async actualizarEntidadesRelacionadas(
    data: TransicionData
  ): Promise<void> {
    try {
      // Actualizar estado del acta física si está asociada
      if (
        data.estadoNuevo === EstadoSolicitud.EN_BUSQUEDA ||
        data.estadoNuevo === EstadoSolicitud.ACTA_ENCONTRADA_PENDIENTE_PAGO
      ) {
        const solicitud = await prisma.solicitud.findUnique({
          where: { id: data.solicitudId },
          include: { actafisica: true },
        });

        if (solicitud?.actafisica && solicitud.actafisica.length > 0) {
          // Actualizar estado del acta según corresponda
          const actaEstado =
            data.estadoNuevo === EstadoSolicitud.EN_BUSQUEDA
              ? 'ASIGNADA_BUSQUEDA'
              : 'ENCONTRADA';

          await prisma.actafisica.update({
            where: { id: solicitud.actafisica[0]!.id },
            data: { estado: actaEstado },
          });

          logger.debug(
            `Acta física actualizada a estado ${actaEstado}`
          );
        }
      }
    } catch (error) {
      logger.error('Error al actualizar entidades relacionadas:', error);
      // No fallar la transición
    }
  }

  /**
   * Obtener historial completo de una solicitud
   */
  async getHistorial(solicitudId: string): Promise<any[]> {
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

  /**
   * Verificar si una solicitud puede transicionar a un estado específico
   */
  async canTransition(
    solicitudId: string,
    estadoDestino: EstadoSolicitud,
    rol: RolSolicitud
  ): Promise<{ can: boolean; reason?: string }> {
    try {
      const solicitud = await prisma.solicitud.findUnique({
        where: { id: solicitudId },
      });

      if (!solicitud) {
        return { can: false, reason: 'Solicitud no encontrada' };
      }

      const estadoActual = solicitud.estado as EstadoSolicitud;

      // Validar transición
      this.validateTransicion(estadoActual, estadoDestino, rol);

      return { can: true };
    } catch (error: any) {
      return { can: false, reason: error.message };
    }
  }
}

export const solicitudStateMachine = new SolicitudStateMachine();

