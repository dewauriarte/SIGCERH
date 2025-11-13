/**
 * Servicio para guardar resultados OCR en tabla actafisica
 * NO crea certificados - solo guarda los datos extraídos del acta
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { solicitudStateMachine } from '../solicitudes/state-machine';

const prisma = new PrismaClient();

interface EstudianteOCRData {
  numero: number;
  codigo: string;
  tipo: 'G' | 'P';
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  sexo: 'M' | 'F';
  notas: number[];
  comportamiento: string;
  asignaturasDesaprobadas: number;
  situacionFinal: 'A' | 'R' | 'D';
  observaciones?: string;
}

interface ResultadoOCRData {
  totalEstudiantes: number;
  estudiantes: EstudianteOCRData[];
  metadataActa: {
    anioLectivo: number;
    grado: string;
    seccion: string;
    turno: string;
    tipoEvaluacion: string;
    colegioOrigen: string;
    areas?: any[];
  };
  confianza: number;
  advertencias: string[];
  procesadoCon?: string;
}

export class GuardarOCRService {
  /**
   * Guardar datos extraídos por OCR en tabla actafisica
   * Los certificados se crearán en una fase posterior
   */
  async guardarResultadoOCR(
    solicitudId: string,
    editorId: string,
    resultadoOCR: ResultadoOCRData
  ) {
    try {
      // 1. Obtener solicitud
      const solicitud = await prisma.solicitud.findUnique({
        where: { id: solicitudId },
        include: {
          estudiante: true,
          configuracioninstitucion: true,
        },
      });

      if (!solicitud) {
        throw new Error('Solicitud no encontrada');
      }

      // Validar que esté asignada al editor
      if (solicitud.usuariogeneracion_id !== editorId) {
        throw new Error('Esta solicitud no está asignada a este editor');
      }

      // Validar estado
      if (solicitud.estado !== 'EN_PROCESAMIENTO_OCR' && solicitud.estado !== 'LISTO_PARA_OCR') {
        throw new Error(`Estado inválido para guardar OCR: ${solicitud.estado}`);
      }

      const institucionId = solicitud.configuracioninstitucion?.id;
      if (!institucionId) {
        throw new Error('Institución no encontrada');
      }

      logger.info(`Guardando datos de OCR: ${resultadoOCR.totalEstudiantes} estudiantes detectados`);

      // Obtener metadata del acta desde observaciones
      let metadataActa: any = {};
      try {
        const obs = JSON.parse(solicitud.observaciones || '{}');
        metadataActa = obs.actaFisica || {};
      } catch (e) {
        logger.warn('No se pudo parsear metadata del acta');
      }

      // 2. Buscar año lectivo
      const anioLectivo = await prisma.aniolectivo.findFirst({
        where: {
          institucion_id: institucionId,
          anio: resultadoOCR.metadataActa.anioLectivo,
        },
      });

      if (!anioLectivo) {
        throw new Error(`No se encontró año lectivo ${resultadoOCR.metadataActa.anioLectivo} para esta institución`);
      }

      // 3. Buscar grado
      const grado = await prisma.grado.findFirst({
        where: {
          nombre: {
            contains: resultadoOCR.metadataActa.grado,
            mode: 'insensitive',
          },
        },
      });

      if (!grado) {
        throw new Error(`No se encontró grado ${resultadoOCR.metadataActa.grado}`);
      }

      // 4. Generar número único para el acta
      const numeroActa = `${solicitud.numeroexpediente}-${resultadoOCR.metadataActa.anioLectivo}-${resultadoOCR.metadataActa.seccion}`;

      // 5. Guardar en actafisica
      const actaFisica = await prisma.actafisica.upsert({
        where: {
          numero_aniolectivo_id: {
            numero: numeroActa,
            aniolectivo_id: anioLectivo.id,
          },
        },
        create: {
          numero: numeroActa,
          tipo: resultadoOCR.metadataActa.tipoEvaluacion || 'FINAL',
          aniolectivo_id: anioLectivo.id,
          grado_id: grado.id,
          seccion: resultadoOCR.metadataActa.seccion,
          turno: resultadoOCR.metadataActa.turno,
          tipoevaluacion: resultadoOCR.metadataActa.tipoEvaluacion,
          colegiorigen: resultadoOCR.metadataActa.colegioOrigen,
          ubicacionfisica: metadataActa.ubicacionFisica,
          nombrearchivo: metadataActa.nombreArchivo,
          urlarchivo: metadataActa.archivoUrl,
          estado: 'PROCESADO',
          solicitud_id: solicitud.id,
          procesadoconia: true,
          fechaprocesamiento: new Date(),
          datosextraidosjson: resultadoOCR as any,
          usuariosubida_id: editorId,
          observaciones: `Procesado con ${resultadoOCR.procesadoCon || 'OCR'}. Confianza: ${resultadoOCR.confianza}%. Total estudiantes: ${resultadoOCR.totalEstudiantes}`,
        },
        update: {
          procesadoconia: true,
          fechaprocesamiento: new Date(),
          datosextraidosjson: resultadoOCR as any,
          estado: 'PROCESADO',
          observaciones: `Procesado con ${resultadoOCR.procesadoCon || 'OCR'}. Confianza: ${resultadoOCR.confianza}%. Total estudiantes: ${resultadoOCR.totalEstudiantes}`,
        },
      });

      logger.info(`✓ Acta guardada: ${actaFisica.numero}`);

      // 6. Actualizar solicitud a siguiente estado
      await prisma.solicitud.update({
        where: { id: solicitudId },
        data: {
          estado: 'EN_VALIDACION_UGEL',
          fechaactualizacion: new Date(),
        },
      });

      // 7. Crear historial de transición
      await solicitudStateMachine.transicion(
        solicitudId,
        'EN_VALIDACION_UGEL' as any,
        editorId,
        'EDITOR' as any,
        `Acta procesada con OCR. ${resultadoOCR.totalEstudiantes} estudiantes detectados. Datos guardados en actafisica.`
      );

      logger.info(`✅ Datos de OCR guardados en actafisica para solicitud ${solicitud.numeroexpediente}`);

      return {
        estudiantesDetectados: resultadoOCR.totalEstudiantes,
        confianza: resultadoOCR.confianza,
        actaId: actaFisica.id,
        numeroActa: actaFisica.numero,
      };
    } catch (error) {
      logger.error('Error guardando resultado OCR:', error);
      throw error;
    }
  }
}

export const guardarOCRService = new GuardarOCRService();
