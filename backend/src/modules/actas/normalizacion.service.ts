/**
 * Servicio de Normalización de Actas Físicas
 * Convierte JSON flexible extraído por IA → Datos estructurados en BD
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import {
  DatosOCRExtraccion,
  EstudianteOCRExtraccion,
  ResultadoNormalizacion,
  ResultadoValidacionOCR,
  MapeoAreaCurricular,
  ResultadoMapeoAreas,
  ActaEstudianteDetalle,
  ConsolidadoNotasCertificado,
  ConfiguracionNormalizacion,
  CONFIGURACION_DEFAULT,
  ErrorNormalizacion,
  EstadisticasNormalizacion,
} from './normalizacion.types';

const prisma = new PrismaClient();

export class NormalizacionService {
  private config: ConfiguracionNormalizacion;

  constructor(config?: Partial<ConfiguracionNormalizacion>) {
    this.config = { ...CONFIGURACION_DEFAULT, ...config };
  }

  /**
   * ========================================
   * 1. VALIDACIÓN PRE-NORMALIZACIÓN
   * ========================================
   */

  /**
   * Valida que el JSON esté completo y correcto antes de normalizar
   */
  async validarDatosOCR(
    actaId: string,
    datosOCR?: DatosOCRExtraccion
  ): Promise<ResultadoValidacionOCR> {
    const acta = await prisma.actafisica.findUnique({
      where: { id: actaId },
      include: {
        aniolectivo: true,
        grado: true,
      },
    });

    if (!acta) {
      throw new Error('Acta no encontrada');
    }

    if (!acta.procesadoconia) {
      throw new Error('El acta no ha sido procesada con OCR');
    }

    // Usar datos proporcionados o extraer del acta
    const datos = datosOCR || (acta.datosextraidosjson as any);

    if (!datos || !datos.estudiantes) {
      throw new Error('No hay datos JSON para validar');
    }

    const errores: any[] = [];
    const advertencias: any[] = [];
    let estudiantesConDNI = 0;
    let notasNumericas = 0;
    let notasLiterales = 0;
    let notasFaltantes = 0;

    // Validar cada estudiante
    for (const [index, est] of datos.estudiantes.entries()) {
      // Validar datos básicos
      if (!est.nombres || !est.apellidoPaterno || !est.apellidoMaterno) {
        errores.push({
          tipo: 'estudiante_sin_nombre',
          estudiante: { numero: est.numero },
          detalle: `Estudiante #${est.numero}: Falta nombre completo`,
          sugerencia: 'Complete los nombres manualmente antes de normalizar',
        });
      }

      // Validar DNI
      if (!est.dni) {
        if (this.config.requerir_dni) {
          errores.push({
            tipo: 'estudiante_sin_dni',
            estudiante: {
              numero: est.numero,
              nombre: `${est.nombres} ${est.apellidoPaterno}`,
            },
            detalle: 'DNI no proporcionado',
            sugerencia: 'Se requiere DNI para todos los estudiantes',
          });
        } else {
          advertencias.push({
            tipo: 'dni_temporal',
            estudiante: {
              numero: est.numero,
              nombre: `${est.nombres} ${est.apellidoPaterno}`,
            },
            detalle: 'Se generará un DNI temporal',
          });
        }
      } else {
        estudiantesConDNI++;
      }

      // Validar notas
      if (!est.notas || Object.keys(est.notas).length === 0) {
        advertencias.push({
          tipo: 'nota_faltante',
          estudiante: {
            numero: est.numero,
            nombre: `${est.nombres} ${est.apellidoPaterno}`,
          },
          detalle: 'No tiene notas registradas',
        });
      } else {
        for (const [area, nota] of Object.entries(est.notas)) {
          if (nota === null || nota === undefined) {
            notasFaltantes++;
          } else if (typeof nota === 'number') {
            if (nota < 0 || nota > 20) {
              errores.push({
                tipo: 'nota_invalida',
                estudiante: {
                  numero: est.numero,
                  nombre: `${est.nombres} ${est.apellidoPaterno}`,
                },
                area,
                detalle: `Nota fuera de rango: ${nota}`,
                sugerencia: 'Las notas deben estar entre 0 y 20',
              });
            } else {
              notasNumericas++;
            }
          } else {
            notasLiterales++;
          }
        }
      }
    }

    // Mapeo de áreas
    const resultadoMapeo = await this.mapearAreas(
      acta.aniolectivo.anio,
      acta.grado.numero,
      datos.estudiantes
    );

    // Agregar errores/advertencias de áreas no mapeadas
    if (this.config.validar_areas_estricto && resultadoMapeo.areasNoMapeadas.length > 0) {
      for (const areaNombre of resultadoMapeo.areasNoMapeadas) {
        errores.push({
          tipo: 'area_no_encontrada',
          area: areaNombre,
          detalle: `Área "${areaNombre}" no encontrada en el currículo`,
          sugerencia: 'Configure el área en el currículo o corrija el nombre',
        });
      }
    } else {
      for (const areaNombre of resultadoMapeo.areasNoMapeadas) {
        advertencias.push({
          tipo: 'area_aproximada',
          area: areaNombre,
          detalle: `Área "${areaNombre}" no encontrada, se omitirá`,
        });
      }
    }

    return {
      valido: errores.length === 0,
      errores,
      advertencias,
      estadisticas: {
        total_estudiantes: datos.estudiantes.length,
        estudiantes_con_dni: estudiantesConDNI,
        estudiantes_sin_dni: datos.estudiantes.length - estudiantesConDNI,
        total_notas: notasNumericas + notasLiterales + notasFaltantes,
        notas_numericas: notasNumericas,
        notas_literales: notasLiterales,
        notas_faltantes: notasFaltantes,
        areas_detectadas: resultadoMapeo.mapeosExitosos.length + resultadoMapeo.areasNoMapeadas.length,
        areas_mapeadas: resultadoMapeo.mapeosExitosos.length,
        areas_no_mapeadas: resultadoMapeo.areasNoMapeadas.length,
      },
    };
  }

  /**
   * ========================================
   * 2. MAPEO DE ÁREAS CURRICULARES
   * ========================================
   */

  /**
   * Mapea nombres de áreas extraídos por OCR con áreas en BD
   * Usa coincidencia exacta, aproximada y manual
   */
  private async mapearAreas(
    anio: number,
    gradoNumero: number,
    estudiantes: EstudianteOCRExtraccion[]
  ): Promise<ResultadoMapeoAreas> {
    // Obtener todas las áreas únicas del JSON
    const areasOCR = new Set<string>();
    estudiantes.forEach((est) => {
      if (est.notas) {
        Object.keys(est.notas).forEach((area) => areasOCR.add(area.toUpperCase().trim()));
      }
    });

    // Obtener currículo del año/grado
    const curriculo = await prisma.curriculogrado.findMany({
      where: {
        aniolectivo: {
          anio,
        },
        grado: {
          numero: gradoNumero,
        },
      },
      include: {
        areacurricular: true,
      },
      orderBy: {
        orden: 'asc',
      },
    });

    // Si no hay currículo, buscar áreas genéricas
    let areasDisponibles = curriculo.map((c) => c.areacurricular);
    if (areasDisponibles.length === 0) {
      areasDisponibles = await prisma.areacurricular.findMany({
        where: { activo: true },
        orderBy: { orden: 'asc' },
      });
    }

    const mapeosExitosos: MapeoAreaCurricular[] = [];
    const areasNoMapeadas: string[] = [];
    const sugerencias: any[] = [];

    // Mapear cada área OCR
    for (const areaOCR of Array.from(areasOCR)) {
      let mapeo: MapeoAreaCurricular | null = null;

      // 1. Intentar coincidencia exacta
      const areaExacta = areasDisponibles.find(
        (a) => a.nombre.toUpperCase().trim() === areaOCR ||
               a.codigo.toUpperCase().trim() === areaOCR
      );

      if (areaExacta) {
        mapeo = {
          nombre_ocr: areaOCR,
          area_id: areaExacta.id,
          area_nombre: areaExacta.nombre,
          area_codigo: areaExacta.codigo,
          confianza: 100,
          metodo: 'exacto',
        };
      } else {
        // 2. Intentar coincidencia aproximada (contiene o está contenido)
        const candidatos = areasDisponibles
          .map((area) => {
            const nombreArea = area.nombre.toUpperCase().trim();
            let similitud = 0;

            // Contiene
            if (nombreArea.includes(areaOCR) || areaOCR.includes(nombreArea)) {
              similitud = 80;
            }
            // Palabras clave comunes
            else {
              const palabrasOCR = areaOCR.split(/\s+/);
              const palabrasArea = nombreArea.split(/\s+/);
              const coincidencias = palabrasOCR.filter((p) => palabrasArea.includes(p));
              similitud = (coincidencias.length / Math.max(palabrasOCR.length, palabrasArea.length)) * 100;
            }

            return {
              area,
              similitud,
            };
          })
          .filter((c) => c.similitud >= this.config.umbral_similitud_areas)
          .sort((a, b) => b.similitud - a.similitud);

        if (candidatos.length > 0) {
          // Usar el mejor candidato
          const mejor = candidatos[0];
          mapeo = {
            nombre_ocr: areaOCR,
            area_id: mejor.area.id,
            area_nombre: mejor.area.nombre,
            area_codigo: mejor.area.codigo,
            confianza: mejor.similitud,
            metodo: 'aproximado',
          };

          // Si hay múltiples candidatos, agregar sugerencia
          if (candidatos.length > 1) {
            sugerencias.push({
              nombre_ocr: areaOCR,
              candidatos: candidatos.slice(0, 3).map((c) => ({
                area_id: c.area.id,
                area_nombre: c.area.nombre,
                similitud: c.similitud,
              })),
            });
          }
        }
      }

      if (mapeo) {
        mapeosExitosos.push(mapeo);
      } else {
        areasNoMapeadas.push(areaOCR);
      }
    }

    return {
      mapeosExitosos,
      areasNoMapeadas,
      sugerencias,
    };
  }

  /**
   * ========================================
   * 3. NORMALIZACIÓN PRINCIPAL
   * ========================================
   */

  /**
   * ⭐ MÉTODO PRINCIPAL: Normalizar acta (JSON → BD)
   */
  async normalizarActa(actaId: string, usuarioId?: string): Promise<ResultadoNormalizacion> {
    const inicio = Date.now();

    const acta = await prisma.actafisica.findUnique({
      where: { id: actaId },
      include: {
        aniolectivo: true,
        grado: true,
        libro: true,
      },
    });

    if (!acta) {
      throw new Error('Acta no encontrada');
    }

    if (!acta.procesadoconia) {
      throw new Error('El acta debe estar procesada con OCR primero');
    }

    // Si ya está normalizada, eliminar datos anteriores para re-normalizar
    if (acta.normalizada) {
      logger.warn(`[NORMALIZACIÓN] Acta ${actaId} ya normalizada, se eliminarán datos anteriores para re-normalizar`);
      
      // Eliminar datos anteriores
      await prisma.$transaction(async (tx) => {
        // 1. Obtener todos los vínculos actaestudiante de esta acta
        const actasEstudiantes = await tx.actaestudiante.findMany({
          where: { acta_id: actaId },
          select: { id: true }
        });
        
        const actasEstudiantesIds = actasEstudiantes.map(ae => ae.id);
        
        // 2. Eliminar todas las notas asociadas
        if (actasEstudiantesIds.length > 0) {
          await tx.actanota.deleteMany({
            where: { acta_estudiante_id: { in: actasEstudiantesIds } }
          });
        }
        
        // 3. Eliminar los vínculos actaestudiante
        await tx.actaestudiante.deleteMany({
          where: { acta_id: actaId }
        });
        
        // 4. Marcar acta como NO normalizada
        await tx.actafisica.update({
          where: { id: actaId },
          data: { normalizada: false }
        });
      });
      
      logger.info(`[NORMALIZACIÓN] Datos anteriores eliminados, procediendo a re-normalizar`);
    }

    if (!acta.datosextraidosjson) {
      throw new Error('No hay datos JSON para normalizar');
    }

    // Validar datos antes de normalizar
    const validacion = await this.validarDatosOCR(actaId);
    if (!validacion.valido && this.config.modo_transaccion === 'todo_o_nada') {
      throw new Error(
        `Datos inválidos: ${validacion.errores.length} errores encontrados. ` +
        `Corrija los errores antes de normalizar.`
      );
    }

    const datos = acta.datosextraidosjson as any as DatosOCRExtraccion;
    const estudiantes = datos.estudiantes || [];

    // Mapear áreas
    const mapeoAreas = await this.mapearAreas(
      acta.aniolectivo.anio,
      acta.grado.numero,
      estudiantes
    );

    const mapaAreas = new Map(
      mapeoAreas.mapeosExitosos.map((m) => [m.nombre_ocr, m])
    );

    logger.info(
      `[NORMALIZACIÓN] Iniciando normalización - Acta: ${acta.numero}, ` +
      `Estudiantes: ${estudiantes.length}, Áreas mapeadas: ${mapaAreas.size}`
    );

    // === NORMALIZACIÓN EN TRANSACCIÓN ===
    const errores: ErrorNormalizacion[] = [];
    let estudiantesCreados = 0;
    let estudiantesExistentes = 0;
    let vinculosCreados = 0;
    let notasCreadas = 0;

    for (const estOCR of estudiantes) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Buscar estudiante existente (estrategia inteligente)
          let estudiante = null;
          
          // ESTRATEGIA 1: Si tiene DNI real (no temporal), buscar por DNI
          if (estOCR.dni && !estOCR.dni.startsWith('T') && this.config.campos_match_estudiante.includes('dni')) {
            estudiante = await tx.estudiante.findFirst({
              where: { dni: estOCR.dni }
            });
            
            if (estudiante) {
              logger.debug(`✓ Estudiante encontrado por DNI: ${estOCR.dni}`);
            }
          }
          
          // ESTRATEGIA 2: Buscar por nombre completo (clave para vincular actas del mismo estudiante)
          if (!estudiante) {
            estudiante = await tx.estudiante.findFirst({
              where: {
                nombres: estOCR.nombres,
                apellidopaterno: estOCR.apellidoPaterno,
                apellidomaterno: estOCR.apellidoMaterno,
              },
            });
            
            if (estudiante) {
              logger.debug(`✓ Estudiante encontrado por nombre: ${estOCR.apellidoPaterno} ${estOCR.apellidomaterno} ${estOCR.nombres}`);
              estudiantesExistentes++;
            }
          } else {
            estudiantesExistentes++;
          }

          // 2. Crear nuevo estudiante solo si no existe
          if (!estudiante) {
            // Crear estudiante con DNI temporal
            // DNI debe ser máximo 8 caracteres, generar uno único y corto
            let dni = estOCR.dni;
            
            if (!dni && this.config.permitir_dni_temporal) {
              // Generar DNI temporal de 8 dígitos: T + timestamp últimos 6 dígitos + número estudiante
              const timestamp = Date.now().toString().slice(-5); // Últimos 5 dígitos del timestamp
              const numero = estOCR.numero.toString().padStart(2, '0'); // Número con 2 dígitos
              dni = `T${timestamp}${numero}`; // Ej: T34567801
            }

            if (!dni) {
              throw new Error('DNI requerido y no proporcionado');
            }

            estudiante = await tx.estudiante.create({
              data: {
                dni,
                apellidopaterno: estOCR.apellidoPaterno,
                apellidomaterno: estOCR.apellidoMaterno,
                nombres: estOCR.nombres,
                sexo: estOCR.sexo || 'M',
                fechanacimiento: estOCR.fechaNacimiento
                  ? new Date(estOCR.fechaNacimiento)
                  : new Date('2000-01-01'),
                estado: 'ACTIVO',
              },
            });

            estudiantesCreados++;
          }

          // 2. Verificar si ya existe vínculo (por si falla y se reintenta)
          const vinculoExistente = await tx.actaestudiante.findFirst({
            where: {
              acta_id: actaId,
              estudiante_id: estudiante.id,
            },
          });

          if (vinculoExistente) {
            if (this.config.estrategia_duplicados === 'error') {
              throw new Error(`Estudiante ya vinculado a esta acta`);
            } else if (this.config.estrategia_duplicados === 'saltar') {
              logger.warn(
                `Estudiante ${estudiante.id} ya vinculado al acta ${actaId}, se omite`
              );
              return;
            }
            // Si es 'actualizar', continuar
          }

          // 3. Crear actaestudiante (vínculo)
          const actaEstudiante = await tx.actaestudiante.create({
            data: {
              acta_id: actaId,
              estudiante_id: estudiante.id,
              numero_orden: estOCR.numero,
              situacion_final: estOCR.situacionFinal,
              observaciones: estOCR.observaciones,
            },
          });

          vinculosCreados++;

          // 4. Crear notas
          if (estOCR.notas) {
            for (const [nombreAreaOCR, valorNota] of Object.entries(estOCR.notas)) {
              const nombreNormalizado = nombreAreaOCR.toUpperCase().trim();
              const mapeo = mapaAreas.get(nombreNormalizado);

              if (!mapeo) {
                logger.warn(
                  `Área "${nombreAreaOCR}" no mapeada, se omite para estudiante ${estudiante.id}`
                );
                continue;
              }

              // Procesar valor de nota
              let nota: number | null = null;
              let notaLiteral: string | null = null;

              if (typeof valorNota === 'number') {
                nota = valorNota;
              } else if (typeof valorNota === 'string') {
                // Intentar convertir a número
                const notaNum = parseFloat(valorNota);
                if (!isNaN(notaNum) && notaNum >= 0 && notaNum <= 20) {
                  nota = notaNum;
                } else {
                  notaLiteral = valorNota;
                }
              }

              // Crear nota
              await tx.actanota.create({
                data: {
                  acta_estudiante_id: actaEstudiante.id,
                  area_id: mapeo.area_id,
                  nota,
                  nota_literal: notaLiteral,
                  nombre_area_ocr: nombreAreaOCR,
                  confianza_ocr: mapeo.confianza,
                  orden: 1, // Se puede mejorar con orden real
                },
              });

              notasCreadas++;
            }
          }
        });
      } catch (error: any) {
        const nombreCompleto = `${estOCR.nombres} ${estOCR.apellidoPaterno} ${estOCR.apellidoMaterno}`;
        logger.error(
          `[NORMALIZACIÓN] Error procesando estudiante #${estOCR.numero} "${nombreCompleto}"`,
          {
            actaId,
            estudiante: estOCR,
            error: error.message,
            stack: error.stack,
          }
        );

        errores.push({
          estudiante: {
            numero: estOCR.numero,
            nombre: nombreCompleto,
            dni: estOCR.dni,
          },
          fase: 'vinculo_acta',
          error: error.message,
          stack: error.stack,
        });

        // Si es modo "todo o nada", lanzar error
        if (this.config.modo_transaccion === 'todo_o_nada') {
          throw error;
        }
      }
    }

    // Marcar acta como normalizada
    await prisma.actafisica.update({
      where: { id: actaId },
      data: {
        normalizada: true,
        fecha_normalizacion: new Date(),
        estado: 'NORMALIZADA',
      },
    });

    const tiempoTotal = Date.now() - inicio;

    logger.info(
      `[NORMALIZACIÓN] Completada exitosamente - Acta: ${acta.numero}, ` +
      `Estudiantes: ${estudiantesCreados + estudiantesExistentes}, ` +
      `Vínculos: ${vinculosCreados}, Notas: ${notasCreadas}, ` +
      `Tiempo: ${tiempoTotal}ms`
    );

    return {
      success: errores.length === 0,
      mensaje:
        errores.length === 0
          ? `Normalización exitosa: ${vinculosCreados} estudiantes procesados`
          : `Normalización parcial: ${errores.length} errores encontrados`,
      acta: {
        id: acta.id,
        numero: acta.numero,
        normalizada: true,
        fecha_normalizacion: new Date(),
      },
      estadisticas: {
        estudiantes_procesados: vinculosCreados,
        estudiantes_creados: estudiantesCreados,
        estudiantes_existentes: estudiantesExistentes,
        vinculos_creados: vinculosCreados,
        notas_creadas: notasCreadas,
        tiempo_procesamiento_ms: tiempoTotal,
      },
      errores: errores.length > 0 ? errores : undefined,
    };
  }

  /**
   * ========================================
   * 4. CONSULTAS DE DATOS NORMALIZADOS
   * ========================================
   */

  /**
   * Obtener todas las actas de un estudiante
   */
  async getActasDeEstudiante(estudianteId: string): Promise<ActaEstudianteDetalle[]> {
    const actas = await prisma.actaEstudiante.findMany({
      where: { estudiante_id: estudianteId },
      include: {
        actafisica: {
          include: {
            aniolectivo: true,
            grado: {
              include: {
                niveleducativo: true,
              },
            },
            libro: true,
          },
        },
        notas: {
          include: {
            areacurricular: true,
          },
          orderBy: {
            orden: 'asc',
          },
        },
      },
      orderBy: [
        {
          actafisica: {
            aniolectivo: {
              anio: 'asc',
            },
          },
        },
        {
          actafisica: {
            grado: {
              numero: 'asc',
            },
          },
        },
      ],
    });

    return actas.map((acta) => ({
      id: acta.id,
      acta: {
        id: acta.actafisica.id,
        numero: acta.actafisica.numero!,
        folio: acta.actafisica.folio ? parseInt(acta.actafisica.folio) : undefined,
        tipo: acta.actafisica.tipo,
        fechaEmision: acta.actafisica.fechaemision || undefined,
      },
      libro: acta.actafisica.libro
        ? {
            codigo: acta.actafisica.libro.codigo,
            nombre: acta.actafisica.libro.nombre || '',
            ubicacion: acta.actafisica.libro.ubicacion_fisica || '',
          }
        : undefined,
      anioLectivo: {
        anio: acta.actafisica.aniolectivo.anio,
      },
      grado: {
        numero: acta.actafisica.grado.numero,
        nombre: acta.actafisica.grado.nombre,
      },
      nivel: acta.actafisica.grado.niveleducativo
        ? {
            nombre: acta.actafisica.grado.niveleducativo.nombre,
          }
        : undefined,
      numeroOrden: acta.numero_orden,
      situacionFinal: acta.situacion_final || undefined,
      observaciones: acta.observaciones || undefined,
      notas: acta.notas.map((nota) => ({
        id: nota.id,
        area: {
          id: nota.areacurricular.id,
          codigo: nota.areacurricular.codigo,
          nombre: nota.areacurricular.nombre,
          orden: nota.areacurricular.orden,
        },
        nota: nota.nota || undefined,
        notaLiteral: nota.nota_literal || undefined,
        esExonerado: nota.es_exonerado || false,
        nombreAreaOCR: nota.nombre_area_ocr || undefined,
        confianzaOCR: nota.confianza_ocr ? parseFloat(nota.confianza_ocr.toString()) : undefined,
        orden: nota.orden,
      })),
      fechaRegistro: acta.fecha_registro || new Date(),
    }));
  }

  /**
   * Consolidar notas para generar certificado
   */
  async consolidarNotasParaCertificado(estudianteId: string): Promise<ConsolidadoNotasCertificado> {
    const estudiante = await prisma.estudiante.findUnique({
      where: { id: estudianteId },
    });

    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

    const actas = await this.getActasDeEstudiante(estudianteId);

    // Agrupar por año/grado
    const periodos = actas.map((acta) => ({
      anio: acta.anioLectivo.anio,
      grado: {
        numero: acta.grado.numero,
        nombre: acta.grado.nombre,
      },
      nivel: acta.nivel,
      situacionFinal: acta.situacionFinal,
      notas: acta.notas.map((nota) => ({
        area: {
          codigo: nota.area.codigo,
          nombre: nota.area.nombre,
          orden: nota.area.orden,
        },
        nota: nota.nota,
        notaLiteral: nota.notaLiteral,
        esExonerado: nota.esExonerado,
      })),
      acta: {
        numero: acta.acta.numero,
        folio: acta.acta.folio,
        libro: acta.libro?.codigo,
      },
    }));

    // Estadísticas
    const anios = periodos.map((p) => p.anio);
    const grados = periodos.map((p) => p.grado.numero);
    const todasNotas = periodos.flatMap((p) => p.notas);
    const notasNumericas = todasNotas.filter((n) => n.nota !== undefined && n.nota !== null);
    const promedio =
      notasNumericas.length > 0
        ? notasNumericas.reduce((sum, n) => sum + n.nota!, 0) / notasNumericas.length
        : undefined;

    return {
      estudiante: {
        id: estudiante.id,
        dni: estudiante.dni!,
        nombreCompleto: estudiante.nombrecompleto || '',
      },
      periodos,
      estadisticas: {
        total_periodos: periodos.length,
        anio_inicio: Math.min(...anios),
        anio_fin: Math.max(...anios),
        grados_cursados: [...new Set(grados)].sort(),
        promedio_general: promedio ? Math.round(promedio * 100) / 100 : undefined,
        total_notas: todasNotas.length,
        notas_aprobadas: notasNumericas.filter((n) => n.nota! >= 11).length,
        notas_desaprobadas: notasNumericas.filter((n) => n.nota! < 11).length,
      },
    };
  }
}

export const normalizacionService = new NormalizacionService();
