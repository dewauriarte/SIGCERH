/**
 * Servicio de Solicitudes
 * Gestiona el flujo completo de solicitudes con 13 estados
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { solicitudStateMachine } from './state-machine';
import { notificacionService } from '../notificaciones/notificacion.service';
import { TipoNotificacion, CanalNotificacion } from '../notificaciones/types';
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
   * PORTAL PÚBLICO
   * ========================================
   */

  /**
   * Crear solicitud desde portal público
   * Crea automáticamente estudiante, colegio y otros registros necesarios
   */
  async createFromPublicPortal(data: any): Promise<any> {
    logger.info('🚀 Creando solicitud desde portal público...');

    // 1. Buscar o crear estudiante
    let estudiante = await prisma.estudiante.findFirst({
      where: {
        dni: data.estudiante.numeroDocumento,
      },
    });

    if (!estudiante) {
      logger.info('📝 Creando nuevo estudiante:', data.estudiante.numeroDocumento);
      
      // Buscar institución por defecto o usar la primera disponible
      const institucion = await prisma.configuracioninstitucion.findFirst();
      
      if (!institucion) {
        throw new Error('No hay instituciones configuradas en el sistema');
      }

      estudiante = await prisma.estudiante.create({
        data: {
          institucion_id: institucion.id,
          dni: data.estudiante.numeroDocumento,
          nombres: data.estudiante.nombres,
          apellidopaterno: data.estudiante.apellidoPaterno,
          apellidomaterno: data.estudiante.apellidoMaterno,
          fechanacimiento: new Date(data.estudiante.fechaNacimiento),
          telefono: data.contacto.celular,
          email: data.contacto.email || null,
        },
      });
    } else {
      logger.info('✅ Estudiante ya existe:', estudiante.id);
    }

    // 2. Por ahora usamos el nombre del colegio directamente
    // La tabla de instituciones educativas puede no existir o tener otro nombre
    const nombreColegio = data.datosAcademicos.nombreColegio;

    // 3. Generar código de seguimiento único (S-YYYY-NNNNNN)
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

    logger.info('🔖 Código generado:', numeroseguimiento);

    // 4. Buscar o crear tipo de solicitud por defecto
    let tipoSolicitud = await prisma.tiposolicitud.findFirst();

    if (!tipoSolicitud) {
      logger.info('📋 Creando tipo de solicitud por defecto...');
      tipoSolicitud = await prisma.tiposolicitud.create({
        data: {
          codigo: 'CERT_EST',
          nombre: 'Certificado de Estudios',
          descripcion: 'Solicitud de certificado de estudios históricos',
          activo: true,
        },
      });
    }

    // 5. Preparar datos académicos y de contacto como JSON
    const datosAcademicos = {
      departamento: data.datosAcademicos.departamento,
      provincia: data.datosAcademicos.provincia,
      distrito: data.datosAcademicos.distrito,
      nombreColegio: nombreColegio,
      ultimoAnioCursado: data.datosAcademicos.ultimoAnioCursado,
      nivel: data.datosAcademicos.nivel,
    };

    const contacto = {
      celular: data.contacto.celular,
      email: data.contacto.email || null,
    };

    // 6. Guardar archivo de carta poder si existe
    let cartaPoderUrl: string | null = null;
    
    const tieneCartaPoder = data.esApoderado && 
                            data.datosApoderado && 
                            typeof data.datosApoderado.cartaPoderBase64 === 'string' && 
                            data.datosApoderado.cartaPoderBase64.length > 0;
    
    if (tieneCartaPoder) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        logger.info('📎 Guardando carta poder...');
        
        // Decodificar base64
        const base64Data = data.datosApoderado!.cartaPoderBase64!.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Crear directorio si no existe
        const storageDir = path.join(process.cwd(), 'storage', 'comprobantes');
        await fs.mkdir(storageDir, { recursive: true });
        
        // Generar nombre único
        const ext = data.datosApoderado!.cartaPoderNombre?.split('.').pop() || 'pdf';
        const fileName = `carta-poder-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = path.join(storageDir, fileName);
        
        // Guardar archivo
        await fs.writeFile(filePath, buffer);
        cartaPoderUrl = `/storage/comprobantes/${fileName}`;
        
        logger.info('✅ Carta poder guardada: ' + cartaPoderUrl);
      } catch (error) {
        logger.error('❌ Error al guardar carta poder:', error);
        // No fallar la solicitud por error en archivo
      }
    }

    // 7. Crear solicitud con datos estructurados en observaciones (como JSON)
    const solicitud = await prisma.solicitud.create({
      data: {
        numeroexpediente,
        numeroseguimiento,
        estudiante_id: estudiante.id,
        tiposolicitud_id: tipoSolicitud.id,
        estado: 'REGISTRADA' as EstadoSolicitud, // Estado inicial correcto: REGISTRADA
        fechasolicitud: new Date(),
        prioridad: 'NORMAL',
        observaciones: JSON.stringify({
          datosAcademicos,
          contacto,
          motivoSolicitud: data.motivoSolicitud,
          esApoderado: data.esApoderado,
          datosApoderado: data.datosApoderado ? {
            tipoDocumento: data.datosApoderado.tipoDocumento,
            numeroDocumento: data.datosApoderado.numeroDocumento,
            nombres: data.datosApoderado.nombres,
            apellidoPaterno: data.datosApoderado.apellidoPaterno,
            apellidoMaterno: data.datosApoderado.apellidoMaterno,
            relacionConEstudiante: data.datosApoderado.relacionConEstudiante,
            cartaPoderUrl,
          } : null,
        }),
      },
    });

    logger.info('✅ Solicitud creada en BD:', solicitud.id);

    // Crear notificación para Mesa de Partes
    try {
      await notificacionService.crear(
        TipoNotificacion.SOLICITUD_RECIBIDA,
        'mesadepartes@sigcerh.local', // Email genérico para Mesa de Partes
        solicitud.id,
        {
          nombreEstudiante: `${estudiante.apellidopaterno} ${estudiante.apellidomaterno}, ${estudiante.nombres}`,
          codigoSeguimiento: numeroseguimiento,
          mensaje: `Nueva solicitud recibida: ${numeroexpediente}`,
        },
        CanalNotificacion.EMAIL
      );
      logger.info('📧 Notificación creada para Mesa de Partes');
    } catch (error: any) {
      logger.error('Error al crear notificación:', error.message);
      // No fallar la solicitud por error en notificación
    }

    return solicitud;
  }

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
    // NOTA: Este método usa un DTO diferente al del portal público
    // Se mantiene para compatibilidad con otros módulos
    const dataAny = data as any;

    // Validar que el estudiante existe
    const estudiante = await prisma.estudiante.findUnique({
      where: { id: dataAny.estudianteId },
    });

    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

    // Validar que el tipo de solicitud existe
    const tipoSolicitud = await prisma.tiposolicitud.findUnique({
      where: { id: dataAny.tipoSolicitudId },
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
        estudiante_id: dataAny.estudianteId,
        tiposolicitud_id: dataAny.tipoSolicitudId,
        modalidadentrega: dataAny.modalidadEntrega,
        direccionentrega: dataAny.direccionEntrega,
        estado: EstadoSolicitud.REGISTRADA,
        prioridad: dataAny.prioridad || 'NORMAL',
        observaciones: dataAny.observaciones,
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
      where.numeroseguimiento = { contains: filtros.numeroseguimiento, mode: 'insensitive' };
    }

    // Búsqueda genérica en múltiples campos
    if (filtros.busqueda) {
      const searchTerm = filtros.busqueda.trim();
      where.OR = [
        { numeroexpediente: { contains: searchTerm, mode: 'insensitive' } },
        { numeroseguimiento: { contains: searchTerm, mode: 'insensitive' } },
        {
          estudiante: {
            OR: [
              { dni: { contains: searchTerm, mode: 'insensitive' } },
              { nombres: { contains: searchTerm, mode: 'insensitive' } },
              { apellidopaterno: { contains: searchTerm, mode: 'insensitive' } },
              { apellidomaterno: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        },
      ];
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
          usuario_solicitud_usuariogeneracion_idTousuario: {
            select: {
              id: true,
              nombres: true,
              apellidos: true,
              email: true,
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
            fechanacimiento: true,
            telefono: true,
            email: true,
          },
        },
        tiposolicitud: {
          select: {
            nombre: true,
          },
        },
        pago: {
          select: {
            id: true,
            numeroorden: true,
            monto: true,
            metodopago: true,
            estado: true,
            fechapago: true,
            fecharegistro: true,
            numerorecibo: true,
            urlcomprobante: true,
          },
        },
      },
    });

    if (!solicitud) {
      throw new Error('Código de seguimiento no encontrado');
    }

    return this.formatSolicitudPublica(solicitud);
  }

  /**
   * Buscar por código de seguimiento Y validar DNI (público - con validación)
   */
  async findByCodigoYDni(codigo: string, dni: string): Promise<any> {
    const solicitud = await prisma.solicitud.findFirst({
      where: { numeroseguimiento: codigo },
      include: {
        estudiante: {
          select: {
            dni: true,
            nombres: true,
            apellidopaterno: true,
            apellidomaterno: true,
            fechanacimiento: true,
            telefono: true,
            email: true,
          },
        },
        tiposolicitud: {
          select: {
            nombre: true,
          },
        },
        pago: {
          select: {
            id: true,
            numeroorden: true,
            monto: true,
            metodopago: true,
            estado: true,
            fechapago: true,
            fecharegistro: true,
            numerorecibo: true,
            urlcomprobante: true,
          },
        },
      },
    });

    if (!solicitud) {
      throw new Error('Código de seguimiento no encontrado');
    }

    // Validar que el DNI coincida con el del estudiante
    if (solicitud.estudiante.dni !== dni) {
      throw new Error('El DNI ingresado no coincide con el de la solicitud');
    }

    return this.formatSolicitudPublica(solicitud);
  }

  /**
   * Formatear solicitud para respuesta pública
   */
  private formatSolicitudPublica(solicitud: any): any {

    // Parsear datos de observaciones (están guardados como JSON)
    let datosExtras: any = {};
    try {
      if (solicitud.observaciones) {
        datosExtras = JSON.parse(solicitud.observaciones);
      }
    } catch (error) {
      logger.warn('No se pudo parsear observaciones como JSON:', solicitud.observaciones);
      // Si no es JSON, asumir formato antiguo
      datosExtras = {
        datosAcademicos: {
          nombreColegio: 'Información no disponible',
          departamento: '',
          provincia: '',
          distrito: '',
          ultimoAnioCursado: 0,
          nivel: '',
        },
        contacto: {
          celular: solicitud.estudiante.telefono || '',
          email: solicitud.estudiante.email || null,
        },
        motivoSolicitud: '',
        esApoderado: false,
      };
    }

    // Retornar información pública en formato que espera el frontend
    return {
      solicitud: {
        id: solicitud.id,
        codigo: solicitud.numeroseguimiento,
        numeroExpediente: solicitud.numeroexpediente,
        estado: solicitud.estado,
        fechaCreacion: solicitud.fechasolicitud,
        fechaActualizacion: solicitud.fechaactualizacion || solicitud.fechasolicitud,
        tipoSolicitud: solicitud.tiposolicitud.nombre,
        modalidadEntrega: solicitud.modalidadentrega || 'DIGITAL',
        certificadoId: solicitud.certificado_id,
        pagoId: solicitud.pago_id,
        actaEncontrada: solicitud.estado !== 'ACTA_NO_ENCONTRADA',
        observaciones: solicitud.estado === 'ACTA_NO_ENCONTRADA' || solicitud.estado === 'OBSERVADO' ? solicitud.observaciones : null,
        esApoderado: datosExtras.esApoderado || false,
        datosApoderado: datosExtras.datosApoderado || null,
        // Información del pago (si existe)
        pago: solicitud.pago ? {
          id: solicitud.pago.id,
          numeroOrden: solicitud.pago.numeroorden,
          monto: Number(solicitud.pago.monto),
          metodoPago: solicitud.pago.metodopago,
          estado: solicitud.pago.estado,
          fechaPago: solicitud.pago.fechapago || solicitud.pago.fecharegistro,
          numeroRecibo: solicitud.pago.numerorecibo,
          urlComprobante: solicitud.pago.urlcomprobante,
        } : null,
        estudiante: {
          tipoDocumento: 'DNI', // Por defecto DNI
          numeroDocumento: solicitud.estudiante.dni,
          nombres: solicitud.estudiante.nombres,
          apellidoPaterno: solicitud.estudiante.apellidopaterno,
          apellidoMaterno: solicitud.estudiante.apellidomaterno,
          fechaNacimiento: solicitud.estudiante.fechanacimiento,
        },
        datosAcademicos: {
          departamento: datosExtras.datosAcademicos?.departamento || '',
          provincia: datosExtras.datosAcademicos?.provincia || '',
          distrito: datosExtras.datosAcademicos?.distrito || '',
          nombreColegio: datosExtras.datosAcademicos?.nombreColegio || 'Información no disponible',
          ultimoAnioCursado: datosExtras.datosAcademicos?.ultimoAnioCursado || 0,
          nivel: datosExtras.datosAcademicos?.nivel || '',
        },
        contacto: {
          celular: datosExtras.contacto?.celular || solicitud.estudiante.telefono || '',
          email: datosExtras.contacto?.email || solicitud.estudiante.email || null,
        },
        motivoSolicitud: datosExtras.motivoSolicitud || '',
      },
      timeline: [], // TODO: implementar historial de estados
      proximoPaso: this.getProximoPaso(solicitud.estado || ''),
      puedeDescargar: solicitud.estado === 'CERTIFICADO_EMITIDO',
      puedePagar: solicitud.estado === 'ACTA_ENCONTRADA_PENDIENTE_PAGO' || solicitud.estado === 'EN_BUSQUEDA',
    };
  }

  /**
   * Obtener mensaje del próximo paso según el estado
   */
  private getProximoPaso(estado: string): string {
    const mensajes: Record<string, string> = {
      'REGISTRADA': 'Su solicitud fue registrada. Nuestro equipo iniciará la búsqueda del acta en 3-5 días hábiles.',
      'EN_BUSQUEDA': 'Estamos localizando su acta física en nuestros archivos.',
      'ACTA_ENCONTRADA_PENDIENTE_PAGO': '¡Encontramos su acta! Realice el pago de S/ 15.00 para continuar.',
      'ACTA_NO_ENCONTRADA': 'No pudimos localizar el acta. Revise las recomendaciones proporcionadas.',
      'PAGO_VALIDADO': 'Pago confirmado. Su certificado está siendo procesado.',
      'EN_PROCESAMIENTO_OCR': 'Procesando el certificado con tecnología OCR...',
      'EN_VALIDACION_UGEL': 'Validando la autenticidad del acta con UGEL...',
      'OBSERVADO_POR_UGEL': 'El certificado requiere correcciones. Revise las observaciones.',
      'EN_REGISTRO_SIAGEC': 'Registrando digitalmente su certificado...',
      'EN_FIRMA_DIRECCION': 'Esperando la firma digital de la Dirección...',
      'CERTIFICADO_EMITIDO': '¡Su certificado está listo! Puede descargarlo ahora.',
      'ENTREGADO': 'Certificado entregado exitosamente.',
    };

    return mensajes[estado] || 'Estado desconocido';
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

  /**
   * Obtener estadísticas del dashboard de Mesa de Partes
   */
  async getEstadisticasMesaPartes(): Promise<any> {
    try {
      // Contar solicitudes por estado
      const [
        totalSolicitudes,
        pendientesDerivacion,
        listasEntrega,
        entregadosHoy,
      ] = await Promise.all([
        // Total de solicitudes
        prisma.solicitud.count(),
        
        // Solicitudes pendientes de derivación
        prisma.solicitud.count({
          where: { estado: EstadoSolicitud.REGISTRADA }
        }),
        
        // Certificados listos para entrega
        prisma.solicitud.count({
          where: { estado: EstadoSolicitud.CERTIFICADO_EMITIDO }
        }),
        
        // Entregados hoy
        prisma.solicitud.count({
          where: {
            estado: EstadoSolicitud.ENTREGADO,
            solicitudhistorial: {
              some: {
                estadonuevo: EstadoSolicitud.ENTREGADO,
                fecha: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)), // Inicio del día
                }
              }
            }
          }
        }),
      ]);

      return {
        totalSolicitudes,
        pendientesDerivacion,
        listasEntrega,
        entregadosHoy,
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de Mesa de Partes:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitudes de la última semana agrupadas por día
   */
  async getSolicitudesUltimaSemana(): Promise<any> {
    try {
      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 7);
      hace7Dias.setHours(0, 0, 0, 0);

      const solicitudes = await prisma.solicitud.findMany({
        where: {
          fechasolicitud: {
            gte: hace7Dias,
          }
        },
        select: {
          fechasolicitud: true,
        }
      });

      // Agrupar por día de la semana
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const contadorPorDia = dias.map((dia, index) => ({
        dia,
        solicitudes: 0,
        pagos: 0, // Se llenará desde el servicio de pagos
      }));

      solicitudes.forEach(sol => {
        const diaSemana = new Date(sol.fechasolicitud).getDay();
        contadorPorDia[diaSemana].solicitudes++;
      });

      return contadorPorDia;
    } catch (error) {
      logger.error('Error al obtener solicitudes de última semana:', error);
      throw error;
    }
  }

  /**
   * Obtener actividad reciente del sistema
   */
  async getActividadReciente(limit: number = 10): Promise<any[]> {
    try {
      const historial = await prisma.solicitudhistorial.findMany({
        take: limit,
        orderBy: {
          fecha: 'desc',
        },
        include: {
          solicitud: {
            include: {
              estudiante: {
                select: {
                  nombres: true,
                  apellidopaterno: true,
                  apellidomaterno: true,
                }
              }
            }
          },
          usuario: {
            select: {
              nombres: true,
              apellidos: true,
            }
          }
        },
      });

      return historial.map(h => {
        const nombreCompleto = h.solicitud?.estudiante
          ? `${h.solicitud.estudiante.nombres} ${h.solicitud.estudiante.apellidopaterno} ${h.solicitud.estudiante.apellidomaterno}`
          : 'Desconocido';

        let tipo: 'solicitud' | 'pago' | 'entrega' = 'solicitud';
        let descripcion = '';

        // Determinar tipo y descripción según el estado
        switch (h.estadonuevo) {
          case EstadoSolicitud.REGISTRADA:
            tipo = 'solicitud';
            descripcion = `Nueva solicitud recibida - ${nombreCompleto}`;
            break;
          case EstadoSolicitud.PAGO_VALIDADO:
            tipo = 'pago';
            descripcion = `Pago validado - ${nombreCompleto}`;
            break;
          case EstadoSolicitud.ENTREGADO:
            tipo = 'entrega';
            descripcion = `Certificado entregado - ${nombreCompleto}`;
            break;
          case EstadoSolicitud.ASIGNADA_BUSQUEDA:
            tipo = 'solicitud';
            descripcion = `Solicitud derivada a editor - ${nombreCompleto}`;
            break;
          case EstadoSolicitud.ACTA_ENCONTRADA:
            tipo = 'solicitud';
            descripcion = `Acta encontrada - ${nombreCompleto}`;
            break;
          case EstadoSolicitud.CERTIFICADO_EMITIDO:
            tipo = 'solicitud';
            descripcion = `Certificado emitido - ${nombreCompleto}`;
            break;
          default:
            descripcion = h.estadonuevo 
              ? `${h.estadonuevo.replace(/_/g, ' ')} - ${nombreCompleto}`
              : `Cambio de estado - ${nombreCompleto}`;
        }

        return {
          id: h.id,
          tipo,
          descripcion,
          fecha: h.fecha,
          estado: h.estadonuevo,
        };
      });
    } catch (error) {
      logger.error('Error al obtener actividad reciente:', error);
      throw error;
    }
  }
}

export const solicitudService = new SolicitudService();

