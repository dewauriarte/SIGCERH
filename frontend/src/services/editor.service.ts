/**
 * Servicio para Editor / Oficina de Actas
 * Maneja todas las operaciones del rol EDITOR
 *
 * Responsabilidades:
 * - Gestión de expedientes asignados
 * - Búsqueda de actas físicas
 * - Subida y procesamiento de actas
 * - OCR y extracción de datos
 * - Generación de certificados borradores
 * - Envío a UGEL para validación
 */

import { apiClient } from '@/lib/apiClient';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

/**
 * Expediente asignado al Editor para búsqueda de acta
 */
export interface ExpedienteAsignado {
  id: string;
  numeroExpediente: string;
  fechaAsignacion: Date | string;
  diasDesdeAsignacion: number;
  prioridad: 'NORMAL' | 'URGENTE' | 'MUY_URGENTE';
  estadoBusqueda: EstadoBusqueda;

  estudiante: {
    id: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    numeroDocumento: string;
  };

  datosAcademicos?: {
    anioLectivo?: number;
    grado?: string;
    colegioOrigen?: string;
  } | null;
}

/**
 * Estados posibles en la búsqueda de acta
 */
export type EstadoBusqueda =
  | 'PENDIENTE_BUSQUEDA'
  | 'DERIVADO_A_EDITOR'
  | 'EN_BUSQUEDA'
  | 'ACTA_ENCONTRADA'
  | 'ACTA_ENCONTRADA_PENDIENTE_PAGO'
  | 'ACTA_NO_ENCONTRADA'
  | 'ESPERANDO_PAGO'
  | 'LISTO_PARA_OCR'
  | 'EN_PROCESAMIENTO_OCR';

/**
 * Acta física encontrada y subida
 */
export interface ActaFisica {
  id: string;
  expedienteId: string;
  archivoUrl: string;
  estadoOCR: 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'ERROR';

  metadata: {
    anioLectivo: number;
    grado: string;
    seccion: string;
    turno: 'MAÑANA' | 'TARDE';
    tipoEvaluacion: 'FINAL' | 'RECUPERACION';
    ubicacionFisica: string;
  };

  plantillaCurricular?: PlantillaCurricular;
}

/**
 * Plantilla de áreas curriculares según año y grado
 */
export interface PlantillaCurricular {
  id: string;
  anioLectivo: number;
  grado: string;
  areas: AreaCurricular[];
}

/**
 * Área curricular (materia/asignatura)
 */
export interface AreaCurricular {
  posicion: number;
  nombre: string;
  codigo: string;
}

/**
 * Estudiante detectado por OCR
 */
export interface EstudianteOCR {
  numero: number;
  codigo: string;
  tipo: 'G' | 'P'; // Gratuito / Pagante
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  nombreCompleto?: string; // Nombre completo construido
  sexo: 'M' | 'F';
  notas: number[] | Record<string, number>; // Array de notas o objeto con áreas
  notasArray?: number[]; // Array de notas para visualización
  comportamiento: string;
  asignaturasDesaprobadas: number;
  situacionFinal: 'P' | 'A' | 'R'; // Promovido / Aprobado / Reprobado
  observaciones?: string;
}

/**
 * Resultado del procesamiento OCR
 */
export interface ResultadoOCR {
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
  fechaProcesamiento?: string;
  procesadoPor?: string;
}

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  estadoBusqueda?: EstadoBusqueda;
}

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Respuesta genérica de API
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ============================================================================
// CLASE DE SERVICIO
// ============================================================================

class EditorService {
  /**
  // ==========================================================================
  // EXPEDIENTES ASIGNADOS
  // ==========================================================================

  /**
   * Obtiene expedientes asignados al editor actual
   */
  async getExpedientesAsignados(
    params: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<ExpedienteAsignado>> {
    const response = await apiClient.get<PaginatedResponse<ExpedienteAsignado>>(
      `/editor/expedientes`,
      { params }
    );
    return response.data;
  }

  /**
   * Obtiene expedientes pendientes de búsqueda
   */
  async getExpedientesPendientes(
    params: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<ExpedienteAsignado>> {
    const response = await apiClient.get<PaginatedResponse<ExpedienteAsignado>>(
      `/editor/expedientes/pendientes-busqueda`,
      { params }
    );
    return response.data;
  }

  // ==========================================================================
  // BÚSQUEDA DE ACTAS
  // ==========================================================================

  /**
   * Iniciar búsqueda de acta
   * Transición: DERIVADO_A_EDITOR → EN_BUSQUEDA
   */
  async iniciarBusqueda(solicitudId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/editor/expedientes/${solicitudId}/iniciar-busqueda`);
    return response.data;
  }

  /**
   * Marca un acta como encontrada
   */
  async marcarActaEncontrada(
    expedienteId: string,
    data: {
      ubicacionFisica: string;
      observaciones?: string;
    }
  ): Promise<ApiResponse<ExpedienteAsignado>> {
    const response = await apiClient.post<ApiResponse<ExpedienteAsignado>>(
      `/editor/expedientes/${expedienteId}/acta-encontrada`,
      data
    );
    return response.data;
  }

  /**
   * Marca un acta como NO encontrada
   */
  async marcarActaNoEncontrada(
    expedienteId: string,
    data: {
      motivoNoEncontrada: string;
      observaciones?: string;
    }
  ): Promise<ApiResponse<ExpedienteAsignado>> {
    const response = await apiClient.post<ApiResponse<ExpedienteAsignado>>(
      `/editor/expedientes/${expedienteId}/acta-no-encontrada`,
      data
    );
    return response.data;
  }

  /**
   * Sube un acta física escaneada con metadatos
   */
  async subirActa(
    expedienteId: string,
    data: {
      anioLectivo: string;
      grado: string;
      seccion: string;
      turno: string;
      tipoEvaluacion: string;
      ubicacionFisica: string;
      colegioOrigen?: string;
    }
  ): Promise<ApiResponse<any>> {
    // TODO: Cuando se implemente FormData con archivo real
    // const formData = new FormData();
    // formData.append('archivo', archivo);
    // ... otros campos
    
    const response = await apiClient.post<ApiResponse<any>>(
      `/editor/expedientes/${expedienteId}/subir-acta`,
      data
    );
    return response.data;
  }

  // ==========================================================================
  // PROCESAMIENTO OCR
  // ==========================================================================

  /**
   * Procesar acta con OCR
   */
  async procesarOCR(expedienteId: string): Promise<ApiResponse<ResultadoOCR>> {
    const response = await apiClient.post<ApiResponse<ResultadoOCR>>(
      `/editor/expedientes/${expedienteId}/procesar-ocr`
    );
    return response.data;
  }

  /**
   * Obtener resultado del OCR procesado
   */
  async obtenerResultadoOCR(expedienteId: string): Promise<ApiResponse<ResultadoOCR>> {
    const response = await apiClient.get<ApiResponse<ResultadoOCR>>(
      `/editor/expedientes/${expedienteId}/resultado-ocr`
    );
    return response.data;
  }

  /**
   * Guardar resultado OCR en BD (crear estudiantes, certificados y notas)
   */
  async guardarResultadoOCR(expedienteId: string, resultadoOCR: ResultadoOCR): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/editor/expedientes/${expedienteId}/guardar-ocr`,
      resultadoOCR
    );
    return response.data;
  }

  /**
   * Procesar acta con OCR en modo libre (sin expediente)
   */
  async procesarOCRLibre(metadata: any, imageBase64: string): Promise<ApiResponse<ResultadoOCR>> {
    const response = await apiClient.post<ApiResponse<ResultadoOCR>>(
      `/editor/ocr/procesar-libre`,
      { metadata, imageBase64 }
    );
    return response.data;
  }

  /**
   * Guardar resultado OCR en modo libre (sin expediente asociado)
   */
  async guardarOCRLibre(datosExtraidos: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/editor/ocr/guardar-libre`,
      datosExtraidos
    );
    return response.data;
  }

  /**
   * Obtiene actas en proceso de OCR
   */
  async getActasEnOCR(
    params: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<ActaFisica>> {
    const response = await apiClient.get<PaginatedResponse<ActaFisica>>(
      `/editor/actas/en-ocr`,
      { params }
    );
    return response.data;
  }

  /**
   * Obtiene la plantilla curricular según año y grado
   */
  async getPlantillaCurricular(
    anioLectivo: number,
    grado: string
  ): Promise<ApiResponse<PlantillaCurricular>> {
    const response = await apiClient.get<ApiResponse<PlantillaCurricular>>(
      `/curriculo/plantilla`,
      { params: { anio: anioLectivo, grado } }
    );
    return response.data;
  }

  // ==========================================================================
  // CERTIFICADOS BORRADORES
  // ==========================================================================

  /**
   * Obtiene borradores listos para enviar a UGEL
   */
  async getBorradoresListos(
    params: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get<PaginatedResponse<any>>(
      `/editor/certificados/borradores`,
      { params }
    );
    return response.data;
  }

  /**
   * Envía certificados a UGEL para validación
   */
  async enviarAUgel(certificadoIds: string[]): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/editor/certificados/enviar-ugel`,
      { certificadoIds }
    );
    return response.data;
  }

  // ==========================================================================
  // OBSERVACIONES DE UGEL
  // ==========================================================================

  /**
   * Obtiene certificados observados por UGEL
   */
  async getCertificadosObservados(
    params: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get<PaginatedResponse<any>>(
      `/editor/certificados/observados`,
      { params }
    );
    return response.data;
  }

  /**
   * Obtiene detalle de observaciones de un certificado
   */
  async getObservacionesCertificado(certificadoId: string): Promise<ApiResponse<{
    certificadoId: string;
    observaciones: string;
    fechaObservacion: Date | string;
    observadoPor: string;
    estudiante: any;
    datosActuales: any;
  }>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/editor/certificados/${certificadoId}/observaciones`
    );
    return response.data;
  }

  /**
   * Corrige datos de un certificado observado
   */
  async corregirCertificado(
    certificadoId: string,
    datosCorregidos: {
      nombres?: string;
      apellidoPaterno?: string;
      apellidoMaterno?: string;
      notas?: { [areaCodigo: string]: number };
      observaciones?: string;
    }
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.put<ApiResponse<any>>(
      `/editor/certificados/${certificadoId}/corregir`,
      datosCorregidos
    );
    return response.data;
  }

  /**
   * Reenvía certificado corregido a UGEL
   */
  async reenviarAUgel(certificadoId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/editor/certificados/${certificadoId}/reenviar-ugel`
    );
    return response.data;
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  /**
   * Obtiene estadísticas del editor
   */
  async getEstadisticas(): Promise<ApiResponse<{
    expedientesAsignados: number;
    actasEncontradasHoy: number;
    procesadasConOCR: number;
    enviadasAUgel: number;
    observadosPorUgel: number;
  }>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/editor/estadisticas`
    );
    return response.data;
  }
}

// ============================================================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================================================

export const editorService = new EditorService();
