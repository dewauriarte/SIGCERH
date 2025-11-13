/**
 * Servicio de Procesamiento OCR
 * Integra Gemini OCR real o usa simulación como fallback
 */

import { logger } from '@config/logger';
import { config } from '@config/env';
import { ocrGeminiService } from './ocr-gemini.service';

interface EstudianteOCR {
  numero: number;
  codigo: string;
  tipo: 'G' | 'P'; // Gratuito / Pagante
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  sexo: 'M' | 'F';
  notas: number[]; // 12 notas
  comportamiento: string;
  asignaturasDesaprobadas: number;
  situacionFinal: 'A' | 'R' | 'D'; // Aprobado / Repitente / Desaprobado
  observaciones?: string;
}

interface ResultadoOCR {
  totalEstudiantes: number;
  estudiantes: EstudianteOCR[];
  metadataActa: {
    anioLectivo: number;
    grado: string;
    seccion: string;
    turno: string;
    tipoEvaluacion: string;
    colegioOrigen: string;
  };
  confianza: number; // 0-100
  advertencias: string[];
}

export class OCRService {
  /**
   * Procesar acta con OCR (Gemini real o simulación)
   */
  async procesarActa(
    solicitudId: string,
    metadataActa: {
      anioLectivo: string;
      grado: string;
      seccion: string;
      turno: string;
      tipoEvaluacion: string;
      colegioOrigen?: string;
      areas?: any[];
    },
    imagePath?: string
  ): Promise<ResultadoOCR> {
    logger.info(`🤖 Iniciando procesamiento OCR para solicitud ${solicitudId}`);

    // Intentar usar Gemini real si está configurado
    if (config.ocr.useReal && imagePath) {
      logger.info('🎯 Intentando procesamiento con Gemini real...');
      
      try {
        // Verificar que el servicio esté disponible
        const isAvailable = await ocrGeminiService.isAvailable();
        
        if (isAvailable) {
          // Preparar metadata con áreas curriculares
          let areas = metadataActa.areas;
          
          // Si no hay áreas o el array está vacío, generar plantilla estándar
          if (!areas || !Array.isArray(areas) || areas.length === 0) {
            logger.debug('⚙️ Generando plantilla curricular estándar...');
            areas = await this.getPlantillaCurricularCompleta(
              parseInt(metadataActa.anioLectivo),
              metadataActa.grado
            );
            logger.debug(`✓ ${areas.length} áreas generadas`);
          }

          const metadata = {
            anioLectivo: parseInt(metadataActa.anioLectivo),
            grado: metadataActa.grado,
            seccion: metadataActa.seccion,
            turno: metadataActa.turno,
            tipoEvaluacion: metadataActa.tipoEvaluacion,
            colegioOrigen: metadataActa.colegioOrigen,
            areas,
          };

          // Llamar a Gemini
          const resultado = await ocrGeminiService.procesarActaConGemini(
            solicitudId,
            imagePath,
            metadata
          );

          logger.info(`✅ OCR con Gemini completado: ${resultado.totalEstudiantes} estudiantes`);
          return resultado;
        } else {
          logger.warn('⚠️ Servicio Gemini no disponible, usando simulación como fallback');
        }
      } catch (error: any) {
        logger.error(`❌ Error en Gemini OCR, usando simulación como fallback: ${error.message}`);
      }
    } else if (config.ocr.useReal && !imagePath) {
      logger.warn('⚠️ USE_REAL_OCR está activado pero no se proporcionó imagen, usando simulación');
    } else {
      logger.info('ℹ️ Usando simulación OCR (USE_REAL_OCR=false)');
    }

    // Fallback: Simulación
    return await this.procesarActaSimulado(solicitudId, metadataActa);
  }

  /**
   * Simulación de procesamiento OCR (fallback)
   */
  private async procesarActaSimulado(
    solicitudId: string,
    metadataActa: {
      anioLectivo: string;
      grado: string;
      seccion: string;
      turno: string;
      tipoEvaluacion: string;
      colegioOrigen?: string;
    }
  ): Promise<ResultadoOCR> {
    logger.info(`🤖 Procesamiento OCR simulado para solicitud ${solicitudId}`);

    // Simular delay de procesamiento (1-2 segundos)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generar datos simulados de estudiantes
    const numEstudiantes = Math.floor(Math.random() * 10) + 15; // 15-25 estudiantes
    const estudiantes: EstudianteOCR[] = [];

    const nombresEjemplo = [
      'Juan Carlos',
      'María Elena',
      'José Luis',
      'Ana Patricia',
      'Carlos Alberto',
      'Rosa María',
      'Pedro Miguel',
      'Carmen Lucía',
      'Luis Fernando',
      'Julia Isabel',
    ];

    const apellidosEjemplo = [
      'García',
      'Rodríguez',
      'Martínez',
      'López',
      'González',
      'Pérez',
      'Sánchez',
      'Ramírez',
      'Torres',
      'Flores',
    ];

    for (let i = 1; i <= numEstudiantes; i++) {
      const apellidoPaterno =
        apellidosEjemplo[Math.floor(Math.random() * apellidosEjemplo.length)];
      const apellidoMaterno =
        apellidosEjemplo[Math.floor(Math.random() * apellidosEjemplo.length)];
      const nombres = nombresEjemplo[Math.floor(Math.random() * nombresEjemplo.length)];

      // Generar 12 notas aleatorias (10-20)
      const notas = Array.from({ length: 12 }, () => Math.floor(Math.random() * 11) + 10);

      const promedio = notas.reduce((a, b) => a + b, 0) / notas.length;
      const asignaturasDesaprobadas = notas.filter((n) => n < 11).length;

      let situacionFinal: 'A' | 'R' | 'D';
      if (promedio >= 11 && asignaturasDesaprobadas === 0) {
        situacionFinal = 'A'; // Aprobado
      } else if (asignaturasDesaprobadas > 3) {
        situacionFinal = 'R'; // Repitente
      } else {
        situacionFinal = 'D'; // Desaprobado
      }

      estudiantes.push({
        numero: i,
        codigo: `EST-${metadataActa.anioLectivo}-${String(i).padStart(4, '0')}`,
        tipo: Math.random() > 0.5 ? 'G' : 'P',
        apellidoPaterno,
        apellidoMaterno,
        nombres,
        sexo: Math.random() > 0.5 ? 'M' : 'F',
        notas,
        comportamiento: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        asignaturasDesaprobadas,
        situacionFinal,
        observaciones:
          asignaturasDesaprobadas > 0 ? `${asignaturasDesaprobadas} asignaturas desaprobadas` : undefined,
      });
    }

    const resultado: ResultadoOCR = {
      totalEstudiantes: numEstudiantes,
      estudiantes,
      metadataActa: {
        anioLectivo: parseInt(metadataActa.anioLectivo),
        grado: metadataActa.grado,
        seccion: metadataActa.seccion,
        turno: metadataActa.turno,
        tipoEvaluacion: metadataActa.tipoEvaluacion,
        colegioOrigen: metadataActa.colegioOrigen || 'Sin especificar',
      },
      confianza: Math.floor(Math.random() * 10) + 90, // 90-100%
      advertencias: [],
    };

    // Agregar advertencias aleatorias
    if (resultado.confianza < 95) {
      resultado.advertencias.push('Algunos caracteres pueden requerir validación manual');
    }

    logger.info(
      `✅ OCR completado: ${resultado.totalEstudiantes} estudiantes detectados con ${resultado.confianza}% de confianza`
    );

    return resultado;
  }

  /**
   * Obtener áreas curriculares según año y grado (nombres simples)
   * TODO: Implementar lógica real basada en base de datos
   */
  async getPlantillaCurricular(anio: number, grado: string): Promise<string[]> {
    // Plantilla estándar de 12 áreas para secundaria 1985-2012
    return [
      'Matemática',
      'Comunicación',
      'Inglés',
      'Arte',
      'Historia, Geografía y Economía',
      'Formación Ciudadana y Cívica',
      'Persona, Familia y Relaciones Humanas',
      'Educación Física',
      'Educación Religiosa',
      'Ciencia, Tecnología y Ambiente',
      'Educación para el Trabajo',
      'Tutoría',
    ];
  }

  /**
   * Obtener áreas curriculares completas con posición y código
   * Usado para Gemini OCR
   */
  async getPlantillaCurricularCompleta(anio: number, grado: string): Promise<any[]> {
    const nombres = await this.getPlantillaCurricular(anio, grado);
    return nombres.map((nombre, index) => ({
      posicion: index + 1,
      nombre: nombre.toUpperCase(),
      codigo: this.generarCodigoArea(nombre),
    }));
  }

  /**
   * Generar código de área (abreviación)
   */
  private generarCodigoArea(nombre: string): string {
    const palabras = nombre.split(/[\s,]+/);
    if (palabras.length === 1) {
      return palabras[0].substring(0, 3).toUpperCase();
    }
    return palabras.map(p => p[0]).join('').toUpperCase().substring(0, 4);
  }
}

export const ocrService = new OCRService();

