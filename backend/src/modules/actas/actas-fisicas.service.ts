/**
 * Servicio de Actas Físicas
 * Gestión completa del ciclo de vida de actas: subida, búsqueda, procesamiento OCR
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { fileUploadService, UploadedActa } from '@shared/services/file-upload.service';
import { curriculoGradoService } from '../academico/curriculo-grado.service';
import {
  CreateActaFisicaDTOType,
  UpdateActaFisicaDTOType,
  FiltrosActaDTOType,
  ProcesarOCRDTOType,
} from './dtos';
import {
  EstadoActa,
  TRANSICIONES_VALIDAS,
  DatosOCR,
  EstudianteOCR,
} from './types';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export class ActaFisicaService {
  /**
   * ========================================
   * MÉTODOS CRUD BÁSICOS
   * ========================================
   */

  /**
   * Crear acta física con archivo adjunto
   */
  async create(
    data: CreateActaFisicaDTOType,
    file: Express.Multer.File,
    usuarioId: string
  ) {
    // Validar que año lectivo existe
    const anioLectivo = await prisma.aniolectivo.findUnique({
      where: { id: data.anioLectivoId },
    });

    if (!anioLectivo) {
      throw new Error('Año lectivo no encontrado');
    }

    // Validar rango 1985-2012
    if (anioLectivo.anio < 1985 || anioLectivo.anio > 2012) {
      throw new Error('El año lectivo debe estar entre 1985 y 2012');
    }

    // Validar que grado existe
    const grado = await prisma.grado.findUnique({
      where: { id: data.gradoId },
    });

    if (!grado) {
      throw new Error('Grado no encontrado');
    }

    // Guardar archivo y generar hash
    const uploadedFile: UploadedActa = await fileUploadService.saveActa(file, {
      numero: data.numero,
      anio: anioLectivo.anio,
    });

    // Verificar que no existe otra acta con el mismo hash
    const actaExistente = await prisma.actafisica.findFirst({
      where: { hasharchivo: uploadedFile.hash },
    });

    if (actaExistente) {
      throw new Error(
        'Ya existe un acta con este archivo (mismo hash). Posible duplicado.'
      );
    }

    // Verificar unicidad de número + año lectivo
    const actaDuplicada = await prisma.actafisica.findFirst({
      where: {
        numero: data.numero,
        aniolectivo_id: data.anioLectivoId,
      },
    });

    if (actaDuplicada) {
      throw new Error(
        `Ya existe un acta con el número ${data.numero} para el año ${anioLectivo.anio}`
      );
    }

    // Crear acta
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

    logger.info(
      `Acta creada: ${acta.numero} (${anioLectivo.anio} - ${grado.nombre})`
    );

    return acta;
  }

  /**
   * Listar actas con filtros
   */
  async findAll(filtros: FiltrosActaDTOType = {}, pagination?: { page: number; limit: number }) {
    const where: any = {};

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

    // Paginación
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

  /**
   * Obtener acta por ID
   */
  async findById(id: string) {
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

  /**
   * Actualizar metadata de acta
   */
  async update(id: string, data: UpdateActaFisicaDTOType) {
    const acta = await this.findById(id);

    // Validar unicidad si se cambia el número
    if (data.numero && data.numero !== acta.numero) {
      const actaDuplicada = await prisma.actafisica.findFirst({
        where: {
          numero: data.numero,
          aniolectivo_id: acta.aniolectivo_id,
          id: { not: id },
        },
      });

      if (actaDuplicada) {
        throw new Error(
          `Ya existe un acta con el número ${data.numero} para este año`
        );
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

  /**
   * ========================================
   * MÁQUINA DE ESTADOS
   * ========================================
   */

  /**
   * Validar transición de estado
   */
  private validarTransicion(estadoActual: string, estadoNuevo: EstadoActa): void {
    const estadoActualEnum = estadoActual as EstadoActa;
    const transicionesPermitidas = TRANSICIONES_VALIDAS[estadoActualEnum];

    if (!transicionesPermitidas.includes(estadoNuevo)) {
      throw new Error(
        `Transición inválida: no se puede cambiar de ${estadoActual} a ${estadoNuevo}`
      );
    }
  }

  /**
   * Cambiar estado de acta
   */
  private async cambiarEstado(
    id: string,
    estadoNuevo: EstadoActa,
    observaciones?: string
  ) {
    const acta = await this.findById(id);

    // Validar transición
    this.validarTransicion(acta.estado!, estadoNuevo);

    // Actualizar estado
    const actaActualizada = await prisma.actafisica.update({
      where: { id },
      data: {
        estado: estadoNuevo,
        observaciones: observaciones || acta.observaciones,
      },
    });

    logger.info(
      `Acta ${acta.numero}: ${acta.estado} → ${estadoNuevo}`
    );

    return actaActualizada;
  }

  /**
   * ========================================
   * MÉTODOS DE ESTADOS
   * ========================================
   */

  /**
   * Asignar acta a una solicitud (cambio a ASIGNADA_BUSQUEDA)
   */
  async asignarSolicitud(actaId: string, solicitudId: string) {
    const acta = await this.findById(actaId);

    // Validar que la solicitud existe
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: solicitudId },
    });

    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    // Cambiar estado
    await this.cambiarEstado(
      actaId,
      EstadoActa.ASIGNADA_BUSQUEDA,
      `Asignada a solicitud ${solicitud.numeroexpediente}`
    );

    // Vincular solicitud
    const actaActualizada = await prisma.actafisica.update({
      where: { id: actaId },
      data: {
        solicitud_id: solicitudId,
      },
      include: {
        solicitud: true,
      },
    });

    logger.info(
      `Acta ${acta.numero} asignada a solicitud ${solicitud.numeroexpediente}`
    );

    return actaActualizada;
  }

  /**
   * Marcar acta como encontrada (cuando Editor la localiza físicamente)
   */
  async marcarEncontrada(actaId: string, observaciones?: string) {
    const acta = await this.cambiarEstado(
      actaId,
      EstadoActa.ENCONTRADA,
      observaciones || 'Acta localizada en archivo físico'
    );

    return acta;
  }

  /**
   * Marcar acta como no encontrada
   */
  async marcarNoEncontrada(actaId: string, observaciones?: string) {
    const acta = await this.cambiarEstado(
      actaId,
      EstadoActa.NO_ENCONTRADA,
      observaciones || 'Acta no localizada en archivo físico'
    );

    return acta;
  }

  /**
   * ========================================
   * PROCESAMIENTO OCR
   * ========================================
   */

  /**
   * ⭐ CRÍTICO: Recibir datos procesados por OCR y crear certificados
   */
  async recibirDatosOCR(actaId: string, datos: ProcesarOCRDTOType) {
    const acta = await this.findById(actaId);

    // Validar que el acta está en estado ENCONTRADA
    if (acta.estado !== EstadoActa.ENCONTRADA) {
      throw new Error(
        `El acta debe estar en estado ENCONTRADA para procesar OCR. Estado actual: ${acta.estado}`
      );
    }

    // Obtener plantilla de currículo para el año y grado
    const anio = acta.aniolectivo.anio;
    const numeroGrado = acta.grado.numero;

    logger.info(
      `Procesando OCR para acta ${acta.numero}: ${datos.estudiantes.length} estudiantes`
    );

    const plantillaCurriculo = await curriculoGradoService.getPlantillaByAnioGrado(
      anio,
      numeroGrado
    );

    if (plantillaCurriculo.length === 0) {
      throw new Error(
        `No se encontró currículo configurado para ${anio} - Grado ${numeroGrado}. Configure el currículo primero.`
      );
    }

    logger.info(
      `Plantilla de currículo: ${plantillaCurriculo.length} áreas curriculares`
    );

    // Procesar cada estudiante
    const certificadosCreados: string[] = [];
    const errores: any[] = [];

    for (const estudianteOCR of datos.estudiantes) {
      try {
        // 1. Buscar o crear estudiante
        let estudiante;

        if (estudianteOCR.dni) {
          // Buscar por DNI
          estudiante = await prisma.estudiante.findFirst({
            where: {
              dni: estudianteOCR.dni,
            },
          });
        }

        if (!estudiante) {
          // Crear nuevo estudiante
          estudiante = await prisma.estudiante.create({
            data: {
              dni: estudianteOCR.dni || `TEMP${Date.now()}${estudianteOCR.numero}`,
              apellidopaterno: estudianteOCR.apellidoPaterno,
              apellidomaterno: estudianteOCR.apellidoMaterno,
              nombres: estudianteOCR.nombres,
              sexo: estudianteOCR.sexo,
              fechanacimiento: estudianteOCR.fechaNacimiento
                ? new Date(estudianteOCR.fechaNacimiento)
                : new Date('2000-01-01'), // Fecha temporal si no se proporciona
              estado: 'ACTIVO',
            },
          });

          logger.info(
            `Estudiante creado: ${estudiante.nombres} ${estudiante.apellidopaterno}`
          );
        }

        // 2. Generar código virtual único
        const codigoVirtual = `CERT-${anio}-${numeroGrado}-${Date.now()}-${estudiante.id.substring(0, 8)}`;

        // 3. Crear certificado en estado BORRADOR
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

        // 4. Crear certificado detalle para el año/grado
        const certificadoDetalle = await prisma.certificadodetalle.create({
          data: {
            certificado_id: certificado.id,
            aniolectivo_id: acta.aniolectivo_id,
            grado_id: acta.grado_id,
            situacionfinal: estudianteOCR.situacionFinal,
            orden: 1,
          },
        });

        // 5. Crear notas según la plantilla de currículo
        const notasCreadas: string[] = [];

        for (const area of plantillaCurriculo) {
          // Buscar nota en los datos del OCR
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

        logger.info(
          `Certificado creado: ${certificado.codigovirtual} - ${estudiante.nombres} ${estudiante.apellidopaterno} (${notasCreadas.length} notas)`
        );
      } catch (error: any) {
        logger.error(
          `Error al procesar estudiante ${estudianteOCR.nombres} ${estudianteOCR.apellidoPaterno}:`,
          error
        );
        errores.push({
          estudiante: `${estudianteOCR.nombres} ${estudianteOCR.apellidoPaterno}`,
          error: error.message,
        });
      }
    }

    // 6. Actualizar acta con datos procesados
    const actaActualizada = await prisma.actafisica.update({
      where: { id: actaId },
      data: {
        procesadoconia: true,
        fechaprocesamiento: new Date(),
        datosextraidosjson: datos as any,
      },
    });

    logger.info(
      `Procesamiento OCR completado: ${certificadosCreados.length} certificados creados, ${errores.length} errores`
    );

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

  /**
   * Validar manualmente acta procesada
   */
  async validarManualmente(actaId: string, observaciones: string, validado: boolean) {
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

    logger.info(
      `Acta ${acta.numero} validada manualmente: ${validado ? 'APROBADA' : 'RECHAZADA'}`
    );

    return actaActualizada;
  }

  /**
   * Comparar datos OCR con acta física
   * Retorna datos para comparación visual
   */
  async compararOCRconFisica(actaId: string) {
    const acta = await this.findById(actaId);

    if (!acta.procesadoconia || !acta.datosextraidosjson) {
      throw new Error('El acta debe estar procesada con OCR para compararla');
    }

    const datosOCR = acta.datosextraidosjson as unknown as DatosOCR;

    // Obtener certificados creados desde esta acta
    const certificados = await prisma.certificado.findMany({
      where: {
        estado: 'BORRADOR',
        fechacreacion: {
          gte: acta.fechaprocesamiento!,
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

  /**
   * Validar con correcciones
   * Permite corregir datos antes de aprobar
   */
  async validarConCorrecciones(
    actaId: string,
    validado: boolean,
    observaciones: string,
    correcciones?: Array<{
      estudianteId: string;
      campo: string;
      valorAnterior: string;
      valorNuevo: string;
    }>
  ) {
    const acta = await this.findById(actaId);

    if (!acta.procesadoconia) {
      throw new Error('El acta debe estar procesada con OCR para validarla');
    }

    // Aplicar correcciones si existen
    if (correcciones && correcciones.length > 0) {
      for (const correccion of correcciones) {
        const estudiante = await prisma.estudiante.findUnique({
          where: { id: correccion.estudianteId },
        });

        if (!estudiante) {
          logger.warn(
            `Estudiante ${correccion.estudianteId} no encontrado para corrección`
          );
          continue;
        }

        // Aplicar corrección según el campo
        const updateData: any = {};
        
        if (correccion.campo === 'apellidoPaterno') {
          updateData.apellidopaterno = correccion.valorNuevo;
        } else if (correccion.campo === 'apellidoMaterno') {
          updateData.apellidomaterno = correccion.valorNuevo;
        } else if (correccion.campo === 'nombres') {
          updateData.nombres = correccion.valorNuevo;
        } else if (correccion.campo === 'dni') {
          updateData.dni = correccion.valorNuevo;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.estudiante.update({
            where: { id: correccion.estudianteId },
            data: updateData,
          });

          logger.info(
            `Corrección aplicada: ${correccion.campo} de "${correccion.valorAnterior}" a "${correccion.valorNuevo}" para estudiante ${correccion.estudianteId}`
          );
        }
      }
    }

    // Actualizar acta con resultado de validación
    const observacionesFinal = correcciones && correcciones.length > 0
      ? `${observaciones}\n\nCORRECCIONES APLICADAS:\n${correcciones.map((c) => `- ${c.campo}: "${c.valorAnterior}" → "${c.valorNuevo}"`).join('\n')}`
      : observaciones;

    const actaActualizada = await prisma.actafisica.update({
      where: { id: actaId },
      data: {
        observaciones: `${acta.observaciones || ''}\n\nVALIDACIÓN CON CORRECCIONES (${validado ? 'APROBADA' : 'RECHAZADA'}): ${observacionesFinal}`,
      },
    });

    logger.info(
      `Acta ${acta.numero} validada con ${correcciones?.length || 0} correcciones: ${validado ? 'APROBADA' : 'RECHAZADA'}`
    );

    return actaActualizada;
  }

  /**
   * ========================================
   * EXPORTACIÓN A EXCEL
   * ========================================
   */

  /**
   * Exportar acta a Excel
   */
  async exportarExcel(actaId: string): Promise<Buffer> {
    const acta = await this.findById(actaId);

    if (!acta.procesadoconia || !acta.datosextraidosjson) {
      throw new Error(
        'El acta debe estar procesada con OCR para exportar a Excel'
      );
    }

    const datosOCR = acta.datosextraidosjson as unknown as DatosOCR;

    // Crear libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Acta de Evaluación');

    // Configurar página
    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.paperSize = 9; // A4

    // Título
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `ACTA DE EVALUACIÓN - ${acta.numero}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Información del acta
    worksheet.addRow([]);
    worksheet.addRow(['Año Lectivo:', acta.aniolectivo.anio]);
    worksheet.addRow(['Grado:', acta.grado.nombre]);
    worksheet.addRow(['Sección:', acta.seccion || '-']);
    worksheet.addRow(['Turno:', acta.turno || '-']);
    worksheet.addRow([]);

    // Encabezados de tabla
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

    // Agregar estudiantes
    datosOCR.estudiantes.forEach((estudiante: EstudianteOCR) => {
      worksheet.addRow([
        estudiante.numero,
        estudiante.apellidoPaterno,
        estudiante.apellidoMaterno,
        estudiante.nombres,
        estudiante.sexo,
        estudiante.situacionFinal || '-',
      ]);
    });

    // Autoajustar columnas
    worksheet.columns = [
      { width: 8 },
      { width: 20 },
      { width: 20 },
      { width: 25 },
      { width: 10 },
      { width: 15 },
    ];

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Guardar URL de Excel exportado
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

