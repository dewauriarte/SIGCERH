/**
 * Servicio de Solicitudes
 * Gestiona el flujo completo de solicitudes con 13 estados
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { solicitudStateMachine } from './state-machine';
import {
  EstadoSolicitud,
  RolSolicitud,
  FiltrosSolicitud,
  PaginacionOptions,
  ResultadoPaginado,
} from './types';
import type {
  CreateSolicitudDTOType,
  ActaEncontradaDTOType,
  ActaNoEncontradaDTOType,
  ValidarPagoDTOType,
  AprobarUGELDTOType,
  ObservarUGELDTOType,
  CorregirObservacionDTOType,
  RegistrarSIAGECDTOType,
  FirmarCertificadoDTOType,
  MarcarEntregadoDTOType,
} from './dtos';

const prisma = new PrismaClient();

export class SolicitudService {
  /**
   * ========================================
   * CRUD BÁSICO
   * ========================================
   */

  /**
   * Crear nueva solicitud (Usuario Público)
   * Estado inicial: REGISTRADA
   */
  async create(data: CreateSolicitudDTOType, usuarioId?: string): Promise<any> {
    // Validar que el estudiante existe
    const estudiante = await prisma.estudiante.findUnique({
      where: { id: data.estudianteId },
    });

    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

    // Validar que el tipo de solicitud existe
    const tipoSolicitud = await prisma.tiposolicitud.findUnique({
      where: { id: data.tipoSolicitudId },
    });

    if (!tipoSolicitud) {
      throw new Error('Tipo de solicitud no encontrado');
    }

    // Generar código de seguimiento único (S-YYYY-NNNNNN)
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

    // Generar número de expediente
    const numeroexpediente = `EXP-${anio}-${numero}`;

    // Crear solicitud
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

    // Registrar en historial
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

    logger.info(
      `Solicitud creada: ${solicitud.numeroexpediente} para estudiante ${estudiante.dni}`
    );

    return solicitud;
  }

  /**
   * Obtener solicitudes con filtros y paginación
   */
  async findAll(
    filtros: FiltrosSolicitud = {},
    options: PaginacionOptions = {}
  ): Promise<ResultadoPaginado<any>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    // Construir where clause
    const where: any = {};

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

    // Consultar
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

  /**
   * Obtener solicitud por ID
   */
  async findById(id: string): Promise<any> {
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

  /**
   * Buscar por código de seguimiento (público - sin auth)
   */
  async findByCodigo(codigo: string): Promise<any> {
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

    // Retornar solo información pública
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

  /**
   * Buscar por número de expediente
   */
  async findByNumeroExpediente(numeroExpediente: string): Promise<any> {
    const solicitud = await prisma.solicitud.findFirst({
      where: { numeroexpediente: numeroExpediente },
    });

    if (!solicitud) {
      throw new Error('Número de expediente no encontrado');
    }

    return this.findById(solicitud.id);
  }

  /**
   * Obtener historial completo de una solicitud
   */
  async getHistorial(solicitudId: string): Promise<any[]> {
    return await solicitudStateMachine.getHistorial(solicitudId);
  }

  /**
   * ========================================
   * MÉTODOS DE TRANSICIÓN POR ROL
   * ========================================
   */

  /**
   * MESA DE PARTES: Derivar solicitud a Editor
   * REGISTRADA → DERIVADO_A_EDITOR
   */
  async derivarAEditor(
    solicitudId: string,
    usuarioId: string,
    editorId?: string,
    observaciones?: string
  ): Promise<any> {
    return await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.DERIVADO_A_EDITOR,
      usuarioId,
      RolSolicitud.MESA_DE_PARTES,
      observaciones || `Derivado a Editor ${editorId || 'general'}`,
      { editorId }
    );
  }

  /**
   * EDITOR: Iniciar búsqueda de acta física
   * DERIVADO_A_EDITOR → EN_BUSQUEDA
   */
  async iniciarBusqueda(
    solicitudId: string,
    usuarioId: string,
    observaciones?: string
  ): Promise<any> {
    return await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.EN_BUSQUEDA,
      usuarioId,
      RolSolicitud.EDITOR,
      observaciones || 'Iniciando búsqueda de acta física en archivo'
    );
  }

  /**
   * EDITOR: Marcar acta como encontrada
   * EN_BUSQUEDA → ACTA_ENCONTRADA_PENDIENTE_PAGO
   */
  async marcarActaEncontrada(
    solicitudId: string,
    usuarioId: string,
    data: ActaEncontradaDTOType
  ): Promise<any> {
    // Vincular acta a solicitud
    await prisma.actafisica.update({
      where: { id: data.actaId },
      data: {
        solicitud_id: solicitudId,
        estado: 'ENCONTRADA',
        ubicacionfisica: data.ubicacionFisica,
      },
    });

    const resultado = await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.ACTA_ENCONTRADA_PENDIENTE_PAGO,
      usuarioId,
      RolSolicitud.EDITOR,
      data.observaciones ||
        `Acta encontrada. Ubicación: ${data.ubicacionFisica}`,
      { actaId: data.actaId }
    );

    // Enviar notificación automática (sin await para no bloquear)
    this.enviarNotificacionActaEncontrada(solicitudId).catch((error) => {
      logger.error(`Error al enviar notificación de acta encontrada: ${error.message}`);
    });

    return resultado;
  }

  /**
   * Enviar notificación de acta encontrada
   */
  private async enviarNotificacionActaEncontrada(solicitudId: string): Promise<void> {
    try {
      const { notificacionService } = await import('../notificaciones/notificacion.service.js');
      const { TipoNotificacion, CanalNotificacion } = await import('../notificaciones/types.js');

      // Obtener datos de la solicitud
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

      await notificacionService.crear(
        TipoNotificacion.ACTA_ENCONTRADA,
        solicitud.estudiante.email,
        solicitudId,
        {
          nombreEstudiante,
          codigoSeguimiento: solicitud.numeroexpediente || solicitud.id.substring(0, 8),
          monto: 15.0,
          enlacePlataforma: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/seguimiento/${solicitud.numeroexpediente}`,
        },
        CanalNotificacion.EMAIL
      );
    } catch (error: any) {
      logger.error(`Error al crear notificación de acta encontrada: ${error.message}`);
    }
  }

  /**
   * EDITOR: Marcar acta como no encontrada
   * EN_BUSQUEDA → ACTA_NO_ENCONTRADA (Estado final)
   */
  async marcarActaNoEncontrada(
    solicitudId: string,
    usuarioId: string,
    data: ActaNoEncontradaDTOType
  ): Promise<any> {
    return await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.ACTA_NO_ENCONTRADA,
      usuarioId,
      RolSolicitud.EDITOR,
      `Motivo: ${data.motivoNoEncontrada}\nObservaciones: ${data.observaciones}`,
      {
        motivoNoEncontrada: data.motivoNoEncontrada,
        sugerencias: data.sugerenciasUsuario,
      }
    );
  }

  /**
   * SISTEMA/MESA_DE_PARTES: Validar pago
   * ACTA_ENCONTRADA_PENDIENTE_PAGO → PAGO_VALIDADO
   */
  async validarPago(
    solicitudId: string,
    data: ValidarPagoDTOType,
    usuarioId?: string
  ): Promise<any> {
    // Vincular pago a solicitud
    await prisma.solicitud.update({
      where: { id: solicitudId },
      data: { pago_id: data.pagoId },
    });

    return await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.PAGO_VALIDADO,
      usuarioId || 'SISTEMA',
      usuarioId ? RolSolicitud.MESA_DE_PARTES : RolSolicitud.SISTEMA,
      data.observaciones || `Pago validado. Método: ${data.metodoPago || 'DIGITAL'}`,
      { pagoId: data.pagoId, metodoPago: data.metodoPago }
    );
  }

  /**
   * EDITOR: Iniciar procesamiento con OCR
   * PAGO_VALIDADO → EN_PROCESAMIENTO_OCR
   */
  async iniciarProcesamiento(
    solicitudId: string,
    usuarioId: string,
    actaId?: string,
    observaciones?: string
  ): Promise<any> {
    return await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.EN_PROCESAMIENTO_OCR,
      usuarioId,
      RolSolicitud.EDITOR,
      observaciones || 'Iniciando digitalización y procesamiento con OCR',
      { actaId }
    );
  }

  /**
   * EDITOR: Enviar a validación UGEL
   * EN_PROCESAMIENTO_OCR → EN_VALIDACION_UGEL
   */
  async enviarAValidacionUGEL(
    solicitudId: string,
    usuarioId: string,
    observaciones?: string
  ): Promise<any> {
    return await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.EN_VALIDACION_UGEL,
      usuarioId,
      RolSolicitud.EDITOR,
      observaciones || 'Certificado enviado a validación de UGEL'
    );
  }

  /**
   * UGEL: Aprobar certificado
   * EN_VALIDACION_UGEL → EN_REGISTRO_SIAGEC
   */
  async aprobarUGEL(
    solicitudId: string,
    usuarioId: string,
    data: AprobarUGELDTOType
  ): Promise<any> {
    return await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.EN_REGISTRO_SIAGEC,
      usuarioId,
      RolSolicitud.UGEL,
      data.observaciones || 'Certificado aprobado por UGEL',
      { validadoPor: data.validadoPor }
    );
  }

  /**
   * UGEL: Observar certificado (requiere correcciones)
   * EN_VALIDACION_UGEL → OBSERVADO_POR_UGEL
   */
  async observarUGEL(
    solicitudId: string,
    usuarioId: string,
    data: ObservarUGELDTOType
  ): Promise<any> {
    return await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.OBSERVADO_POR_UGEL,
      usuarioId,
      RolSolicitud.UGEL,
      `Observaciones: ${data.observaciones}\nCampos observados: ${data.camposObservados.join(', ')}`,
      {
        camposObservados: data.camposObservados,
        requiereCorreccion: data.requiereCorreccion,
      }
    );
  }

  /**
   * EDITOR: Corregir observaciones de UGEL
   * OBSERVADO_POR_UGEL → EN_VALIDACION_UGEL
   */
  async corregirObservacionUGEL(
    solicitudId: string,
    usuarioId: string,
    data: CorregirObservacionDTOType
  ): Promise<any> {
    return await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.EN_VALIDACION_UGEL,
      usuarioId,
      RolSolicitud.EDITOR,
      `Correcciones aplicadas: ${data.observaciones}\nCampos corregidos: ${data.camposCorregidos.join(', ')}`,
      { camposCorregidos: data.camposCorregidos }
    );
  }

  /**
   * SIAGEC: Registrar certificado y generar códigos
   * EN_REGISTRO_SIAGEC → EN_FIRMA_DIRECCION
   */
  async registrarSIAGEC(
    solicitudId: string,
    usuarioId: string,
    data: RegistrarSIAGECDTOType
  ): Promise<any> {
    return await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.EN_FIRMA_DIRECCION,
      usuarioId,
      RolSolicitud.SIAGEC,
      data.observaciones ||
        `Registrado en SIAGEC. Código Virtual: ${data.codigoVirtual}`,
      {
        codigoQR: data.codigoQR,
        codigoVirtual: data.codigoVirtual,
        urlVerificacion: data.urlVerificacion,
      }
    );
  }

  /**
   * DIRECCIÓN: Firmar certificado
   * EN_FIRMA_DIRECCION → CERTIFICADO_EMITIDO
   */
  async firmarCertificado(
    solicitudId: string,
    usuarioId: string,
    data: FirmarCertificadoDTOType
  ): Promise<any> {
    // Actualizar fecha de firma
    await prisma.solicitud.update({
      where: { id: solicitudId },
      data: {
        usuariofirma_id: usuarioId,
        fechafirma: new Date(),
      },
    });

    const resultado = await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.CERTIFICADO_EMITIDO,
      usuarioId,
      RolSolicitud.DIRECCION,
      data.observaciones || `Certificado firmado (${data.tipoFirma})`,
      {
        tipoFirma: data.tipoFirma,
        certificadoFirmadoUrl: data.certificadoFirmadoUrl,
      }
    );

    // Enviar notificación automática (sin await para no bloquear)
    this.enviarNotificacionCertificadoEmitido(solicitudId).catch((error) => {
      logger.error(`Error al enviar notificación de certificado emitido: ${error.message}`);
    });

    return resultado;
  }

  /**
   * Enviar notificación de certificado emitido
   */
  private async enviarNotificacionCertificadoEmitido(solicitudId: string): Promise<void> {
    try {
      const { notificacionService } = await import('../notificaciones/notificacion.service.js');
      const { TipoNotificacion, CanalNotificacion } = await import('../notificaciones/types.js');

      // Obtener datos de la solicitud con certificado
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

      // Obtener código de certificado (si existe)
      const certificado = await prisma.certificado.findFirst({
        where: { estudiante_id: solicitud.estudiante_id },
        orderBy: { fechaemision: 'desc' },
        select: {
          codigovirtual: true,
          urlpdf: true,
        },
      });

      await notificacionService.crear(
        TipoNotificacion.CERTIFICADO_EMITIDO,
        solicitud.estudiante.email,
        solicitudId,
        {
          nombreEstudiante,
          codigoVirtual: certificado?.codigovirtual || 'PENDIENTE',
          urlDescarga: certificado?.urlpdf
            ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/certificados/${certificado.codigovirtual}`
            : `${process.env.FRONTEND_URL || 'http://localhost:3000'}/mis-certificados`,
          enlacePlataforma: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/seguimiento/${solicitud.numeroexpediente}`,
        },
        CanalNotificacion.EMAIL
      );
    } catch (error: any) {
      logger.error(`Error al crear notificación de certificado emitido: ${error.message}`);
    }
  }

  /**
   * MESA_DE_PARTES/SISTEMA: Marcar como entregado
   * CERTIFICADO_EMITIDO → ENTREGADO (Estado final)
   */
  async marcarEntregado(
    solicitudId: string,
    usuarioId: string,
    data: MarcarEntregadoDTOType
  ): Promise<any> {
    return await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.ENTREGADO,
      usuarioId,
      data.tipoEntrega === 'DESCARGA'
        ? RolSolicitud.SISTEMA
        : RolSolicitud.MESA_DE_PARTES,
      data.observaciones ||
        `Certificado entregado (${data.tipoEntrega}${data.dniReceptor ? ` - DNI: ${data.dniReceptor}` : ''})`,
      {
        tipoEntrega: data.tipoEntrega,
        dniReceptor: data.dniReceptor,
        firmaRecepcion: data.firmaRecepcion,
      }
    );
  }

  /**
   * ========================================
   * MÉTODOS DE CONSULTA POR ROL
   * ========================================
   */

  /**
   * Mesa de Partes: Solicitudes pendientes de derivación
   */
  async getPendientesDerivacion(options: PaginacionOptions = {}): Promise<any> {
    return await this.findAll(
      { estado: EstadoSolicitud.REGISTRADA },
      options
    );
  }

  /**
   * Editor: Solicitudes asignadas para búsqueda
   */
  async getAsignadasBusqueda(editorId: string, options: PaginacionOptions = {}): Promise<any> {
    return await this.findAll(
      {
        estados: [
          EstadoSolicitud.DERIVADO_A_EDITOR,
          EstadoSolicitud.EN_BUSQUEDA,
        ],
        asignadoAEditor: editorId,
      },
      options
    );
  }

  /**
   * UGEL: Solicitudes pendientes de validación
   */
  async getPendientesValidacionUGEL(options: PaginacionOptions = {}): Promise<any> {
    return await this.findAll(
      { estado: EstadoSolicitud.EN_VALIDACION_UGEL },
      options
    );
  }

  /**
   * SIAGEC: Solicitudes pendientes de registro
   */
  async getPendientesRegistroSIAGEC(options: PaginacionOptions = {}): Promise<any> {
    return await this.findAll(
      { estado: EstadoSolicitud.EN_REGISTRO_SIAGEC },
      options
    );
  }

  /**
   * Dirección: Solicitudes pendientes de firma
   */
  async getPendientesFirma(options: PaginacionOptions = {}): Promise<any> {
    return await this.findAll(
      { estado: EstadoSolicitud.EN_FIRMA_DIRECCION },
      options
    );
  }

  /**
   * Mesa de Partes: Certificados listos para entrega
   */
  async getListasEntrega(options: PaginacionOptions = {}): Promise<any> {
    return await this.findAll(
      { estado: EstadoSolicitud.CERTIFICADO_EMITIDO },
      options
    );
  }
}

export const solicitudService = new SolicitudService();

