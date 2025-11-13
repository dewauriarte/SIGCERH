/**
 * Servicio de integración con Gemini OCR (servicio Python)
 */

import axios, { AxiosInstance } from 'axios';
import fs from 'fs/promises';
import { logger } from '@config/logger';
import { config } from '@config/env';

interface ResultadoOCR {
  totalEstudiantes: number;
  estudiantes: any[];
  metadataActa: {
    anioLectivo: number;
    grado: string;
    seccion: string;
    turno: string;
    tipoEvaluacion: string;
    areas: any[];
  };
  confianza: number;
  advertencias: string[];
  procesadoCon?: string;
  tiempoProcesamientoMs?: number;
}

export class OCRGeminiService {
  private client: AxiosInstance;
  private serviceUrl: string;
  private isAvailableCache: boolean | null = null;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 300000; // 5 minutos (aumentado para evitar checks durante procesamiento)

  constructor() {
    this.serviceUrl = config.ocr.serviceUrl;

    // Crear cliente HTTP con timeout generoso para Gemini
    this.client = axios.create({
      baseURL: this.serviceUrl,
      timeout: 240000, // 240 segundos (Gemini puede tardar más en actas grandes o bajo carga)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.info(`OCR Gemini Service configurado: ${this.serviceUrl}`);
  }

  /**
   * Verifica si el servicio Python OCR está disponible
   */
  async isAvailable(): Promise<boolean> {
    // Cache de health check (evitar muchas requests)
    const now = Date.now();
    if (this.isAvailableCache !== null && now - this.lastHealthCheck < this.healthCheckInterval) {
      logger.debug(`✓ Usando cache de health check (disponible: ${this.isAvailableCache})`);
      return this.isAvailableCache;
    }

    try {
      const response = await this.client.get('/health', { timeout: 10000 }); // 10s para permitir respuesta
      
      // El servicio está disponible si está configurado (gemini_configured = true)
      // No dependemos del health check interno de Gemini
      this.isAvailableCache = response.data?.gemini_configured === true;
      this.lastHealthCheck = now;

      if (this.isAvailableCache) {
        logger.debug('✓ Servicio OCR Gemini configurado y disponible');
        
        // Log de advertencia si el health check interno falló, pero NO bloquear
        if (response.data?.gemini_healthy === false) {
          logger.warn('⚠️ Health check interno falló, pero intentaremos procesar igual');
        }
      } else {
        logger.warn('⚠️ Servicio OCR no está configurado (falta API Key)');
      }

      return this.isAvailableCache;
    } catch (error: any) {
      // Si ya teníamos cache positivo, mantenerlo (el servicio puede estar ocupado procesando)
      if (this.isAvailableCache === true) {
        logger.warn(`⚠️ Health check falló pero mantenemos cache positivo (servicio probablemente ocupado): ${error.message}`);
        this.lastHealthCheck = now; // Actualizar timestamp para no reintentar pronto
        return true; // Mantener disponible
      }
      
      // Si nunca fue disponible, marcar como no disponible
      this.isAvailableCache = false;
      this.lastHealthCheck = now;
      logger.warn(`⚠️ Servicio OCR Gemini no disponible: ${error.message}`);
      return false;
    }
  }

  /**
   * Procesa un acta con Gemini OCR real
   */
  async procesarActaConGemini(
    solicitudId: string,
    imagePathOrBase64: string,
    metadata: {
      anioLectivo: number;
      grado: string;
      seccion: string;
      turno: string;
      tipoEvaluacion: string;
      areas: any[];
    }
  ): Promise<ResultadoOCR> {
    logger.info(`🤖 Procesando acta con Gemini para solicitud ${solicitudId}`);

    // Verificar que el servicio esté disponible
    const available = await this.isAvailable();
    if (!available) {
      throw new Error('Servicio OCR Gemini no está disponible');
    }

    try {
      let imageDataUrl: string;

      // Verificar si es base64 (data:image...) o una ruta de archivo
      if (imagePathOrBase64.startsWith('data:image')) {
        // Ya es un data URL completo
        imageDataUrl = imagePathOrBase64;
        logger.debug('📷 Usando imagen base64 directa');
      } else if (imagePathOrBase64.startsWith('/') || imagePathOrBase64.includes('\\')) {
        // Es una ruta de archivo
        logger.debug(`📂 Leyendo imagen desde archivo: ${imagePathOrBase64}`);
        const imageBuffer = await fs.readFile(imagePathOrBase64);
        const imageBase64 = imageBuffer.toString('base64');
        const mimeType = this.getMimeType(imagePathOrBase64);
        imageDataUrl = `data:${mimeType};base64,${imageBase64}`;
      } else {
        // Asumir que es base64 sin el prefijo data:
        logger.debug('📷 Usando imagen base64 (sin prefijo data:)');
        imageDataUrl = imagePathOrBase64; // Pasarlo tal cual
      }

      // Preparar metadata para el servicio Python
      const requestData = {
        image_base64: imageDataUrl,
        metadata: {
          anio_lectivo: metadata.anioLectivo,
          grado: metadata.grado,
          seccion: metadata.seccion,
          turno: metadata.turno,
          tipo_evaluacion: metadata.tipoEvaluacion,
          areas: metadata.areas,
        },
      };

      // Llamar al servicio Python con reintentos
      logger.debug(`📤 Enviando request a ${this.serviceUrl}/api/ocr/process`);
      const startTime = Date.now();

      let response;
      let lastError;
      const maxRetries = 2; // Reintentar hasta 2 veces
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 1) {
            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Backoff: 2s, 4s
            logger.warn(`🔄 Reintento ${attempt}/${maxRetries} después de ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
          
          response = await this.client.post('/api/ocr/process', requestData);
          break; // Éxito, salir del loop
        } catch (err: any) {
          lastError = err;
          if (attempt === maxRetries || err.code !== 'ECONNABORTED') {
            throw err; // Si es el último intento o no es timeout, lanzar error
          }
          logger.warn(`⚠️ Intento ${attempt} falló (timeout), reintentando...`);
        }
      }

      const processingTime = Date.now() - startTime;
      logger.info(`✅ Gemini OCR completado en ${processingTime}ms`);

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Error desconocido en servicio OCR');
      }

      const resultado: ResultadoOCR = response.data.data;

      // Normalizar campos de snake_case a camelCase y agregar campos adicionales
      if (resultado.estudiantes) {
        resultado.estudiantes = resultado.estudiantes.map((estudiante: any) => {
          // Construir nombreCompleto
          const nombreCompleto = [
            estudiante.apellido_paterno || estudiante.apellidoPaterno || '',
            estudiante.apellido_materno || estudiante.apellidoMaterno || '',
            estudiante.nombres || ''
          ].filter(Boolean).join(' ').trim() || 'Sin nombre';

          // Convertir notas a array SOLO si son objeto (para visualización frontend)
          let notasArray: number[] = [];
          if (estudiante.notas) {
            if (Array.isArray(estudiante.notas)) {
              notasArray = estudiante.notas;
            } else if (typeof estudiante.notas === 'object') {
              notasArray = Object.values(estudiante.notas) as number[];
            }
          }

          // ✅ Normalizar TODOS los campos de snake_case a camelCase
          return {
            numero: estudiante.numero,
            tipo: estudiante.tipo || 'G',
            apellidoPaterno: estudiante.apellido_paterno || estudiante.apellidoPaterno || '',
            apellidoMaterno: estudiante.apellido_materno || estudiante.apellidoMaterno || '',
            nombres: estudiante.nombres || '',
            nombreCompleto,
            sexo: estudiante.sexo || 'M',
            notas: estudiante.notas || [],
            notasArray,
            comportamiento: estudiante.comportamiento || '',
            asignaturasDesaprobadas: estudiante.asignaturas_desaprobadas ?? estudiante.asignaturasDesaprobadas ?? 0,
            situacionFinal: estudiante.situacion_final || estudiante.situacionFinal || 'P',
            observaciones: estudiante.observaciones || null,
          };
        });
      }

      logger.info(
        `✅ OCR procesado: ${resultado.totalEstudiantes} estudiantes detectados ` +
          `(confianza: ${resultado.confianza}%)`
      );

      return resultado;
    } catch (error: any) {
      // Manejar errores específicos
      if (error.response) {
        // Error de respuesta del servicio Python
        const status = error.response.status;
        const message = error.response.data?.error || error.message;

        if (status === 503) {
          logger.error('❌ Servicio OCR no disponible (503)');
          throw new Error('Servicio OCR no disponible. Verifica que el servicio Python esté ejecutándose.');
        } else if (status === 400) {
          logger.error(`❌ Error de validación en OCR: ${message}`);
          throw new Error(`Error de validación: ${message}`);
        } else {
          logger.error(`❌ Error en servicio OCR (${status}): ${message}`);
          throw new Error(`Error en servicio OCR: ${message}`);
        }
      } else if (error.request) {
        // No hubo respuesta (timeout, conexión rechazada, etc.)
        logger.error(`❌ No se pudo conectar al servicio OCR: ${error.message}`);
        throw new Error('No se pudo conectar al servicio OCR. Verifica que esté ejecutándose en ' + this.serviceUrl);
      } else {
        // Error en configuración del request
        logger.error(`❌ Error al procesar OCR: ${error.message}`);
        throw new Error(`Error al procesar OCR: ${error.message}`);
      }
    }
  }

  /**
   * Determina el MIME type de una imagen basado en su extensión
   */
  private getMimeType(filePath: string): string {
    const ext = filePath.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
    };
    return mimeTypes[ext || ''] || 'image/jpeg';
  }

  /**
   * Invalida el cache de disponibilidad (útil para forzar recheck)
   */
  invalidateCache() {
    this.isAvailableCache = null;
    this.lastHealthCheck = 0;
  }
}

// Exportar instancia única
export const ocrGeminiService = new OCRGeminiService();

