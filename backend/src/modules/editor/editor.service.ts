/**
 * Servicio del módulo Editor
 * Gestiona expedientes asignados y búsqueda de actas físicas
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { solicitudStateMachine } from '../solicitudes/state-machine';
import { EstadoSolicitud, RolSolicitud } from '../solicitudes/types';
import { notificacionService } from '../notificaciones/notificacion.service';
import { TipoNotificacion } from '../notificaciones/types';
import { differenceInDays, startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export class EditorService {
  /**
   * Obtener expedientes asignados al editor actual
   */
  async getExpedientesAsignados(
    editorId: string,
    filtros: {
      page: number;
      limit: number;
      estadoBusqueda?: string;
      search?: string;
    }
  ) {
    const { page, limit, estadoBusqueda, search } = filtros;
    const skip = (page - 1) * limit;

    // Construir where clause
    const where: any = {
      usuariogeneracion_id: editorId,
      estado: {
        in: [
          'DERIVADO_A_EDITOR',
          'EN_BUSQUEDA',
          'ACTA_ENCONTRADA_PENDIENTE_PAGO',
          'ACTA_NO_ENCONTRADA',
          'PAGO_VALIDADO',
          'EN_PROCESAMIENTO_OCR',
          'EN_VALIDACION_UGEL',
          'OBSERVADO_POR_UGEL',
        ],
      },
    };

    // Filtrar por estado de búsqueda si se especifica
    if (estadoBusqueda && estadoBusqueda !== 'TODOS') {
      where.estado = estadoBusqueda;
    }

    // Buscar por nombre de estudiante o número de expediente
    if (search) {
      where.OR = [
        {
          numeroexpediente: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
        {
          numeroseguimiento: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
        {
          estudiante: {
            OR: [
              {
                nombres: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                apellidopaterno: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                apellidomaterno: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                dni: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          },
        },
      ];
    }

    // Consultar solicitudes
    const [total, solicitudes] = await Promise.all([
      prisma.solicitud.count({ where }),
      prisma.solicitud.findMany({
        where,
        skip,
        take: limit,
        include: {
          estudiante: true,
          tiposolicitud: true,
          usuario_solicitud_usuariogeneracion_idTousuario: {
            select: {
              id: true,
              nombres: true,
              apellidos: true,
            },
          },
        },
        orderBy: {
          fechaactualizacion: 'desc',
        },
      }),
    ]);

    // Mapear datos con información adicional
    const expedientes = solicitudes.map((solicitud) => {
      const diasDesdeAsignacion = solicitud.fechainicioproceso
        ? differenceInDays(new Date(), new Date(solicitud.fechainicioproceso))
        : 0;

      // Determinar prioridad según días transcurridos
      let prioridad: 'NORMAL' | 'URGENTE' | 'MUY_URGENTE' = 'NORMAL';
      if (diasDesdeAsignacion > 7) {
        prioridad = 'MUY_URGENTE';
      } else if (diasDesdeAsignacion > 3) {
        prioridad = 'URGENTE';
      }

      // Parsear observaciones JSON para obtener datos académicos
      let datosAcademicos: any = {};
      if (solicitud.observaciones) {
        try {
          const obs = JSON.parse(solicitud.observaciones);
          datosAcademicos = obs.datosAcademicos || {};
        } catch (e) {
          // Si no es JSON válido, ignorar
        }
      }

      return {
        id: solicitud.id,
        numeroExpediente: solicitud.numeroexpediente,
        fechaAsignacion: solicitud.fechainicioproceso,
        diasDesdeAsignacion,
        prioridad,
        estadoBusqueda: solicitud.estado,
        estudiante: {
          id: solicitud.estudiante.id,
          nombres: solicitud.estudiante.nombres,
          apellidoPaterno: solicitud.estudiante.apellidopaterno,
          apellidoMaterno: solicitud.estudiante.apellidomaterno,
          numeroDocumento: solicitud.estudiante.dni,
        },
        datosAcademicos: {
          anioLectivo: datosAcademicos.ultimoAnioCursado || null,
          grado: datosAcademicos.nivel || null,
          colegioOrigen: datosAcademicos.nombreColegio || null,
        },
      };
    });

    return {
      data: expedientes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener estadísticas del editor
   */
  async getEstadisticas(editorId: string) {
    const hoy = new Date();
    const inicioHoy = startOfDay(hoy);
    const finHoy = endOfDay(hoy);

    // Consultar todas las estadísticas en paralelo
    const [
      expedientesAsignados,
      actasEncontradasHoy,
      procesadasConOCR,
      enviadasAUgel,
      observadosPorUgel,
    ] = await Promise.all([
      // TOTAL de expedientes asignados al editor (todos los estados que maneja el editor)
      prisma.solicitud.count({
        where: {
          usuariogeneracion_id: editorId,
          estado: {
            in: [
              'DERIVADO_A_EDITOR',
              'EN_BUSQUEDA',
              'ACTA_ENCONTRADA_PENDIENTE_PAGO',
              'ACTA_NO_ENCONTRADA',
              'PAGO_VALIDADO',
              'EN_PROCESAMIENTO_OCR',
              'EN_VALIDACION_UGEL',
              'OBSERVADO_POR_UGEL',
            ],
          },
        },
      }),

      // Actas encontradas hoy
      prisma.solicitud.count({
        where: {
          usuariogeneracion_id: editorId,
          estado: 'ACTA_ENCONTRADA_PENDIENTE_PAGO',
          fechaactualizacion: {
            gte: inicioHoy,
            lte: finHoy,
          },
        },
      }),

      // Procesadas con OCR (estado EN_PROCESAMIENTO_OCR o posterior)
      prisma.solicitud.count({
        where: {
          usuariogeneracion_id: editorId,
          estado: {
            in: ['EN_PROCESAMIENTO_OCR', 'EN_VALIDACION_UGEL', 'OBSERVADO_POR_UGEL'],
          },
        },
      }),

      // Enviadas a UGEL
      prisma.solicitud.count({
        where: {
          usuariogeneracion_id: editorId,
          estado: {
            in: ['EN_VALIDACION_UGEL', 'EN_REGISTRO_SIAGEC', 'EN_FIRMA_DIRECCION', 'CERTIFICADO_EMITIDO', 'ENTREGADO'],
          },
        },
      }),

      // Observados por UGEL
      prisma.solicitud.count({
        where: {
          usuariogeneracion_id: editorId,
          estado: 'OBSERVADO_POR_UGEL',
        },
      }),
    ]);

    return {
      expedientesAsignados,
      actasEncontradasHoy,
      procesadasConOCR,
      enviadasAUgel,
      observadosPorUgel,
    };
  }

  /**
   * Marcar acta como encontrada
   */
  async marcarActaEncontrada(
    solicitudId: string,
    editorId: string,
    data: {
      ubicacionFisica: string;
      observaciones?: string;
    }
  ) {
    // Obtener solicitud para validación
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
      include: {
        estudiante: true,
      },
    });

    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    // Validar que esté asignada al editor
    if (solicitud.usuariogeneracion_id !== editorId) {
      throw new Error('Esta solicitud no está asignada a este editor');
    }

    // Validar estado actual - Solo EN_BUSQUEDA
    if (solicitud.estado !== EstadoSolicitud.EN_BUSQUEDA) {
      throw new Error(`La solicitud debe estar en estado EN_BUSQUEDA. Estado actual: ${solicitud.estado}`);
    }

    // Actualizar observaciones con info de la búsqueda
    let observacionesActualizadas: any = {};
    if (solicitud.observaciones) {
      try {
        observacionesActualizadas = JSON.parse(solicitud.observaciones);
      } catch (e) {
        // Si no es JSON válido, crear objeto nuevo
      }
    }

    observacionesActualizadas.busquedaActa = {
      fechaBusqueda: new Date(),
      resultado: 'ENCONTRADA',
      ubicacionFisica: data.ubicacionFisica,
      observaciones: data.observaciones || null,
    };

    // Ejecutar transición de estado (esto actualizará el historial)
    const solicitudActualizada = await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.ACTA_ENCONTRADA_PENDIENTE_PAGO,
      editorId,
      RolSolicitud.EDITOR,
      `Acta encontrada en: ${data.ubicacionFisica}`,
      { ubicacionFisica: data.ubicacionFisica }
    );

    // Actualizar observaciones DESPUÉS de la transición para preservar el JSON
    await prisma.solicitud.update({
      where: { id: solicitudId },
      data: {
        observaciones: JSON.stringify(observacionesActualizadas),
      },
    });

    // ✅ CREAR ORDEN DE PAGO AUTOMÁTICAMENTE
    try {
      // Verificar si ya tiene un pago asociado
      if (!solicitud.pago_id) {
        // Obtener monto del tipo de solicitud (por defecto S/ 15.00)
        const montoBase = 15.00;

        // Generar número de orden único
        const anio = new Date().getFullYear();
        const countPagos = await prisma.pago.count();
        const numeroOrden = `ORD-${anio}-${String(countPagos + 1).padStart(6, '0')}`;

        // Crear orden de pago
        const pago = await prisma.pago.create({
          data: {
            numeroorden: numeroOrden,
            monto: montoBase,
            montoneto: montoBase,
            metodopago: 'PENDIENTE', // Usuario elegirá después
            fechapago: new Date(),
            estado: 'PENDIENTE',
            observaciones: `Orden generada automáticamente al encontrar acta - Expediente: ${solicitud.numeroexpediente}`,
          },
        });

        // Vincular pago a la solicitud
        await prisma.solicitud.update({
          where: { id: solicitudId },
          data: {
            pago_id: pago.id,
          },
        });

        logger.info(`✅ Orden de pago creada automáticamente: ${numeroOrden} para solicitud ${solicitud.numeroexpediente}`);
      }
    } catch (errorPago: any) {
      logger.error(`⚠️ No se pudo crear orden de pago automática: ${errorPago.message}`);
      // No fallar la operación principal si falla la creación del pago
    }

    // Crear notificación para el usuario (indicando que debe realizar el pago)
    try {
      await notificacionService.crear(
        TipoNotificacion.ACTA_ENCONTRADA,
        solicitud.estudiante.email || solicitud.estudiante.telefono || '',
        solicitudId,
        {
          numeroExpediente: solicitud.numeroexpediente,
          estudianteNombre: `${solicitud.estudiante.apellidopaterno} ${solicitud.estudiante.apellidomaterno} ${solicitud.estudiante.nombres}`,
          monto: 15.0,
          ubicacionFisica: data.ubicacionFisica,
        }
      );
    } catch (error: any) {
      logger.warn('Error al crear notificación (no crítico):', error.message);
    }

    logger.info(`Acta marcada como encontrada: Solicitud ${solicitud.numeroexpediente} por editor ${editorId}`);

    return solicitudActualizada;
  }

  /**
   * Marcar acta como NO encontrada
   */
  async marcarActaNoEncontrada(
    solicitudId: string,
    editorId: string,
    data: {
      motivoNoEncontrada: string;
      observaciones?: string;
    }
  ) {
    // Obtener solicitud para validación
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
      include: {
        estudiante: true,
      },
    });

    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    // Validar que esté asignada al editor
    if (solicitud.usuariogeneracion_id !== editorId) {
      throw new Error('Esta solicitud no está asignada a este editor');
    }

    // Validar estado actual - Solo EN_BUSQUEDA
    if (solicitud.estado !== EstadoSolicitud.EN_BUSQUEDA) {
      throw new Error(`La solicitud debe estar en estado EN_BUSQUEDA. Estado actual: ${solicitud.estado}`);
    }

    // Actualizar observaciones con info de la búsqueda
    let observacionesActualizadas: any = {};
    if (solicitud.observaciones) {
      try {
        observacionesActualizadas = JSON.parse(solicitud.observaciones);
      } catch (e) {
        // Si no es JSON válido, crear objeto nuevo
      }
    }

    observacionesActualizadas.busquedaActa = {
      fechaBusqueda: new Date(),
      resultado: 'NO_ENCONTRADA',
      motivoNoEncontrada: data.motivoNoEncontrada,
      observaciones: data.observaciones || null,
    };

    // Ejecutar transición de estado (esto actualizará el historial)
    const solicitudActualizada = await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.ACTA_NO_ENCONTRADA,
      editorId,
      RolSolicitud.EDITOR,
      `Acta no encontrada. Motivo: ${data.motivoNoEncontrada}`,
      { motivoNoEncontrada: data.motivoNoEncontrada }
    );

    // Actualizar observaciones DESPUÉS de la transición para preservar el JSON
    await prisma.solicitud.update({
      where: { id: solicitudId },
      data: {
        observaciones: JSON.stringify(observacionesActualizadas),
      },
    });

    // Crear notificación para el usuario (sin cobrar)
    try {
      await notificacionService.crear(
        TipoNotificacion.ACTA_NO_ENCONTRADA,
        solicitud.estudiante.email || solicitud.estudiante.telefono || '',
        solicitudId,
        {
          numeroExpediente: solicitud.numeroexpediente,
          estudianteNombre: `${solicitud.estudiante.apellidopaterno} ${solicitud.estudiante.apellidomaterno} ${solicitud.estudiante.nombres}`,
          motivo: data.motivoNoEncontrada,
        }
      );
    } catch (error: any) {
      logger.warn('Error al crear notificación (no crítico):', error.message);
    }

    logger.info(`Acta marcada como NO encontrada: Solicitud ${solicitud.numeroexpediente} por editor ${editorId}`);

    return solicitudActualizada;
  }

  /**
   * Iniciar búsqueda de acta
   * Transición: DERIVADO_A_EDITOR → EN_BUSQUEDA
   */
  async iniciarBusqueda(solicitudId: string, editorId: string) {
    // Obtener solicitud
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
    });

    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    // Validar que esté asignada al editor
    if (solicitud.usuariogeneracion_id !== editorId) {
      throw new Error('Esta solicitud no está asignada a este editor');
    }

    // Validar estado actual
    if (solicitud.estado !== EstadoSolicitud.DERIVADO_A_EDITOR) {
      throw new Error(`La solicitud debe estar en estado DERIVADO_A_EDITOR. Estado actual: ${solicitud.estado}`);
    }

    // Ejecutar transición
    const solicitudActualizada = await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.EN_BUSQUEDA,
      editorId,
      RolSolicitud.EDITOR,
      'Editor ha iniciado la búsqueda del acta física'
    );

    logger.info(`Búsqueda iniciada: Solicitud ${solicitud.numeroexpediente} por editor ${editorId}`);

    return solicitudActualizada;
  }

  /**
   * Subir acta física escaneada con metadatos
   * Transición: ACTA_ENCONTRADA_PENDIENTE_PAGO → EN_PROCESAMIENTO_OCR (después de pago validado)
   * Crea registro en la tabla actafisica
   */
  async subirActa(
    solicitudId: string,
    editorId: string,
    data: {
      anioLectivoId: string;
      gradoId: string;
      seccion: string;
      turno: string;
      tipoEvaluacion: string;
      numero?: string;
      folio?: string;
      libroId?: string;
      colegioOrigen?: string;
      observaciones?: string;
      archivoUrl?: string; // URL del archivo subido (cuando se implemente S3/storage)
    }
  ) {
    // Obtener solicitud
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
    });

    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    // Validar que esté asignada al editor
    if (solicitud.usuariogeneracion_id !== editorId) {
      throw new Error('Esta solicitud no está asignada a este editor');
    }

    // Validar estado actual - debe estar en LISTO_PARA_OCR (pago validado)
    if (solicitud.estado !== EstadoSolicitud.LISTO_PARA_OCR) {
      throw new Error(
        `La solicitud debe estar en LISTO_PARA_OCR (pago validado). Estado actual: ${solicitud.estado}`
      );
    }

    // Crear registro de ActaFisica en la tabla
    const actaFisica = await prisma.actafisica.create({
      data: {
        numero: data.numero || `ACTA-${solicitud.numeroexpediente}`,
        tipo: 'FINAL',
        aniolectivo_id: data.anioLectivoId,
        grado_id: data.gradoId,
        seccion: data.seccion,
        turno: data.turno as any,
        tipoevaluacion: data.tipoEvaluacion,
        libro_id: data.libroId,
        folio: data.folio,
        colegioorden: data.colegioOrigen,
        observaciones: data.observaciones,
        urlarchivo: data.archivoUrl,
        estado: 'DISPONIBLE',
        procesadoconia: false,
        solicitud_id: solicitudId,
        usuariosubida_id: editorId,
        fechasubida: new Date(),
      },
      include: {
        aniolectivo: true,
        grado: {
          include: {
            niveleducativo: true,
          },
        },
        libro: true,
      },
    });

    logger.info(`✅ Acta física creada: ${actaFisica.numero} para solicitud ${solicitud.numeroexpediente}`);

    // ✅ TRANSICIÓN AUTOMÁTICA: LISTO_PARA_OCR → EN_PROCESAMIENTO_OCR
    const solicitudActualizada = await solicitudStateMachine.transicion(
      solicitudId,
      EstadoSolicitud.EN_PROCESAMIENTO_OCR,
      editorId,
      RolSolicitud.EDITOR,
      'Acta física subida y en cola para procesamiento OCR'
    );

    logger.info(`✅ Acta subida: Solicitud ${solicitud.numeroexpediente} cambió a EN_PROCESAMIENTO_OCR`);

    return {
      solicitud: solicitudActualizada,
      actaFisica,
    };
  }
}

export const editorService = new EditorService();

