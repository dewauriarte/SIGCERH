/**
 * Controlador de OCR
 */

import { Request, Response } from 'express';
import { ocrService } from './ocr.service';
import { guardarOCRService } from './guardar-ocr.service';
import { logger } from '@config/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OCRController {
  /**
   * POST /api/editor/ocr/procesar-libre
   * Procesar acta con OCR sin necesidad de expediente
   */
  async procesarOCRLibre(req: Request, res: Response): Promise<void> {
    try {
      const { metadata, imageBase64 } = req.body;
      const editorId = (req as any).user?.id;

      if (!editorId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      if (!metadata || !imageBase64) {
        res.status(400).json({
          success: false,
          message: 'Metadata e imagen son requeridos',
        });
        return;
      }

      logger.info(`🧠 Editor ${editorId} - Procesando OCR libre`);

      // Convertir base64 a ruta temporal (en producción, podrías usar un storage)
      const tempImagePath = imageBase64; // Gemini puede recibir base64 directamente

      // Procesar con OCR
      const resultado = await ocrService.procesarActa(
        'ocr-libre', // solicitudId temporal
        {
          anioLectivo: metadata.anioLectivo,
          grado: metadata.grado,
          seccion: metadata.seccion,
          turno: metadata.turno,
          tipoEvaluacion: metadata.tipoEvaluacion,
          areas: [], // Se generará automáticamente
        },
        tempImagePath
      );

      logger.info(`✅ OCR libre procesado: ${resultado.totalEstudiantes} estudiantes`);

      res.status(200).json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      logger.error('❌ Error al procesar OCR libre:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar OCR',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/editor/expedientes/:id/procesar-ocr
   * Procesar acta con OCR
   */
  async procesarOCR(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const editorId = (req as any).user?.id;

      if (!editorId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      // Obtener solicitud con metadata del acta
      const solicitud = await prisma.solicitud.findUnique({
        where: { id },
        include: {
          estudiante: true,
        },
      });

      if (!solicitud) {
        res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada',
        });
        return;
      }

      // Validar que esté asignada al editor
      if (solicitud.usuariogeneracion_id !== editorId) {
        res.status(403).json({
          success: false,
          message: 'Esta solicitud no está asignada a este editor',
        });
        return;
      }

      // Validar estado (debe estar en LISTO_PARA_OCR)
      if (solicitud.estado !== 'LISTO_PARA_OCR') {
        res.status(400).json({
          success: false,
          message: `La solicitud debe estar en estado LISTO_PARA_OCR. Estado actual: ${solicitud.estado}`,
        });
        return;
      }

      // Extraer metadata del acta de observaciones
      let metadataActa: any;
      try {
        const observaciones = JSON.parse(solicitud.observaciones || '{}');
        metadataActa = observaciones.actaFisica;

        if (!metadataActa) {
          throw new Error('No se encontró metadata del acta');
        }
      } catch (error) {
        res.status(400).json({
          success: false,
          message: 'Metadata del acta no disponible. Debe subir el acta primero.',
        });
        return;
      }

      // Obtener ruta de la imagen (si existe)
      const imagePath = metadataActa.archivoUrl ? metadataActa.archivoUrl : undefined;

      // Procesar con OCR
      const resultado = await ocrService.procesarActa(
        id,
        {
          anioLectivo: metadataActa.anioLectivo?.toString() || '2025',
          grado: metadataActa.grado || 'Sin especificar',
          seccion: metadataActa.seccion || 'A',
          turno: metadataActa.turno || 'MAÑANA',
          tipoEvaluacion: metadataActa.tipoEvaluacion || 'FINAL',
          colegioOrigen: metadataActa.colegioOrigen,
          areas: metadataActa.areas,
        },
        imagePath
      );

      // Guardar resultado del OCR en observaciones
      const observacionesActualizadas = JSON.parse(solicitud.observaciones || '{}');
      observacionesActualizadas.resultadoOCR = {
        ...resultado,
        fechaProcesamiento: new Date(),
        procesadoPor: editorId,
      };

      await prisma.solicitud.update({
        where: { id },
        data: {
          observaciones: JSON.stringify(observacionesActualizadas),
        },
      });

      logger.info(`✅ OCR procesado para solicitud ${solicitud.numeroexpediente} por editor ${editorId}`);

      res.json({
        success: true,
        message: `OCR completado: ${resultado.totalEstudiantes} estudiantes detectados`,
        data: resultado,
      });
    } catch (error: any) {
      logger.error('Error en procesarOCR:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al procesar OCR',
      });
    }
  }

  /**
   * GET /api/editor/expedientes/:id/resultado-ocr
   * Obtener resultado del OCR procesado
   */
  async obtenerResultadoOCR(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const editorId = (req as any).user?.id;

      const solicitud = await prisma.solicitud.findUnique({
        where: { id },
      });

      if (!solicitud) {
        res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada',
        });
        return;
      }

      // Validar que esté asignada al editor
      if (solicitud.usuariogeneracion_id !== editorId) {
        res.status(403).json({
          success: false,
          message: 'Esta solicitud no está asignada a este editor',
        });
        return;
      }

      // Extraer resultado OCR
      try {
        const observaciones = JSON.parse(solicitud.observaciones || '{}');
        const resultadoOCR = observaciones.resultadoOCR;

        if (!resultadoOCR) {
          res.status(404).json({
            success: false,
            message: 'No se ha procesado el OCR para este expediente',
          });
          return;
        }

        res.json({
          success: true,
          data: resultadoOCR,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error al obtener resultado OCR',
        });
      }
    } catch (error: any) {
      logger.error('Error en obtenerResultadoOCR:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener resultado OCR',
      });
    }
  }

  /**
   * POST /api/editor/expedientes/:id/guardar-ocr
   * Guardar resultado OCR en base de datos
   */
  async guardarOCR(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const editorId = (req as any).user?.id;
      const resultadoOCR = req.body;

      if (!editorId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      if (!resultadoOCR || !resultadoOCR.estudiantes || resultadoOCR.estudiantes.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Datos de OCR inválidos',
        });
        return;
      }

      const resultado = await guardarOCRService.guardarResultadoOCR(
        id,
        editorId,
        resultadoOCR
      );

      logger.info(`✅ OCR guardado en actafisica para solicitud ${id}: ${resultado.estudiantesDetectados} estudiantes`);

      res.json({
        success: true,
        message: `Datos del acta guardados correctamente. ${resultado.estudiantesDetectados} estudiantes detectados. Los certificados se generarán en la siguiente fase.`,
        data: resultado,
      });
    } catch (error: any) {
      logger.error('Error en guardarOCR:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al guardar resultado OCR',
      });
    }
  }

  /**
   * POST /api/editor/ocr/guardar-libre
   * Guardar resultado OCR en modo libre (sin expediente)
   */
  async guardarOCRLibre(req: Request, res: Response): Promise<void> {
    try {
      const editorId = (req as any).user?.id;
      const { estudiantes, metadataActa, confianza, procesadoCon } = req.body;

      if (!editorId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      if (!estudiantes || estudiantes.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Datos de estudiantes son requeridos',
        });
        return;
      }

      // Generar número único para el acta
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const numeroActa = `OCR-LIBRE-${timestamp}`;

      // Buscar o usar IDs de aniolectivo y grado (usar defaults si no existen)
      const anioLectivoNum = metadataActa?.anioLectivo || new Date().getFullYear();
      const gradoNombre = metadataActa?.grado || 'Primer Grado';

      // Buscar aniolectivo
      let aniolectivo = await prisma.aniolectivo.findFirst({
        where: { anio: anioLectivoNum },
      });

      // Si no existe, usar el más reciente o crear uno
      if (!aniolectivo) {
        aniolectivo = await prisma.aniolectivo.findFirst({
          orderBy: { anio: 'desc' },
        });
      }

      // Buscar grado
      let grado = await prisma.grado.findFirst({
        where: { 
          nombre: {
            contains: gradoNombre,
            mode: 'insensitive',
          },
        },
      });

      // Si no existe, usar el primero disponible
      if (!grado) {
        grado = await prisma.grado.findFirst();
      }

      if (!aniolectivo || !grado) {
        throw new Error('No se pudo determinar año lectivo o grado. Verifica que existan registros en las tablas maestras.');
      }

      // Extraer áreas detectadas según el formato de las notas
      let areasDetectadas: string[] = [];
      let notasTransformadas: any[] = [];

      if (estudiantes.length > 0 && estudiantes[0].notas) {
        const primerasNotas = estudiantes[0].notas;

        // Verificar si las notas vienen como objeto (Record<string, number>) o array
        if (Array.isArray(primerasNotas)) {
          // Formato array: [15, 18, 12, ...] → Usar metadata.areas para nombres
          areasDetectadas = metadataActa?.areas?.map((a: any) => a.nombre || a) ||
                           primerasNotas.map((_, i) => `Área ${i + 1}`);

          // Transformar estudiantes con notas como objeto
          notasTransformadas = estudiantes.map((est: any) => {
            const notasObj: Record<string, number | null> = {};
            areasDetectadas.forEach((area, index) => {
              notasObj[area] = est.notas[index] !== undefined ? est.notas[index] : null;
            });
            return {
              ...est,
              notas: notasObj,
            };
          });
        } else if (typeof primerasNotas === 'object') {
          // Formato objeto: { "MATEMATICA": 15, "COMUNICACION": 18, ... }
          areasDetectadas = Object.keys(primerasNotas);
          notasTransformadas = estudiantes; // Ya está en el formato correcto
        }
      }

      // Transformar a la estructura esperada por el sistema de normalización
      const datosOCRNormalizados = {
        estudiantes: (notasTransformadas.length > 0 ? notasTransformadas : estudiantes).map((est: any) => ({
          numero: est.numero,
          codigo: est.codigo || undefined,
          tipo: est.tipo || undefined, // G (Gratuito) / P (Pagante)
          dni: est.dni || undefined,
          apellidoPaterno: est.apellidoPaterno,
          apellidoMaterno: est.apellidoMaterno,
          nombres: est.nombres,
          sexo: est.sexo || undefined,
          fechaNacimiento: est.fechaNacimiento || undefined,
          comportamiento: est.comportamiento || undefined,
          asignaturasDesaprobadas: est.asignaturasDesaprobadas || 0,
          situacionFinal: est.situacionFinal || undefined,
          observaciones: est.observaciones || undefined,
          notas: typeof est.notas === 'object' && !Array.isArray(est.notas) ? est.notas : {},
        })),
        metadata: {
          total_estudiantes: estudiantes.length,
          confianza_promedio: confianza || 0,
          areas_detectadas: areasDetectadas,
          procesado_en: new Date().toISOString(),
          modelo_ia: procesadoCon || 'Gemini',
          advertencias: [],
        },
      };

      // Crear un registro de actaFisica sin asociar a solicitud
      const actaFisica = await prisma.actafisica.create({
        data: {
          numero: numeroActa,
          tipo: 'OCR_LIBRE',
          aniolectivo_id: aniolectivo.id,
          grado_id: grado.id,
          seccion: metadataActa?.seccion || 'A',
          turno: metadataActa?.turno || 'MAÑANA',
          tipoevaluacion: metadataActa?.tipoEvaluacion || 'FINAL',
          procesadoconia: true,
          estado: 'PROCESADO_OCR',
          usuariosubida_id: editorId,
          fechasubida: new Date(),
          fechaprocesamiento: new Date(),
          datosextraidosjson: datosOCRNormalizados as any,
          // solicitud_id: null  (no se asocia a ninguna solicitud)
        },
      });

      logger.info(`✅ OCR guardado en modo libre (actafisica ${actaFisica.id}): ${estudiantes.length} estudiantes`);

      res.json({
        success: true,
        message: `Datos del acta guardados correctamente en actaFisica. ${estudiantes.length} estudiantes detectados.`,
        data: {
          actaFisicaId: actaFisica.id,
          estudiantesDetectados: estudiantes.length,
          confianza,
        },
      });
    } catch (error: any) {
      logger.error('Error en guardarOCRLibre:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al guardar resultado OCR',
      });
    }
  }
}

export const ocrController = new OCRController();

