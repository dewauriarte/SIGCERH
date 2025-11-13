/**
 * Servicio para gestión de Actas Físicas
 * CRUD completo de actas con metadata
 */

import { apiClient } from '@/lib/apiClient';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface ActaFisica {
  id: string;
  numero: string;
  tipo: string;
  solicitud_id?: string | null;
  
  // Relaciones
  aniolectivo_id: string;
  aniolectivo?: {
    id: string;
    anio: number;
    activo: boolean;
  };
  
  grado_id: string;
  grado?: {
    id: string;
    institucion_id: string;
    nivel_id: string;
    numero: number;
    nombre: string;
    nombrecorto: string;
    orden: number;
    activo: boolean;
    niveleducativo?: {
      id: string;
      nombre: string;
      nombrecorto: string;
      orden: number;
      activo: boolean;
    };
  };
  
  // Metadata del acta
  seccion?: string | null;
  turno?: string | null;
  fechaemision?: string | null;
  libro_id?: string | null;
  libro?: {
    id: string;
    codigo: string;
    descripcion?: string | null;
    activo: boolean;
  } | null;
  folio?: string | null;
  tipoevaluacion?: string | null;
  
  // Archivo
  nombrearchivo?: string | null;
  urlarchivo?: string | null;
  hasharchivo?: string | null;
  
  // Estado y procesamiento
  estado?: string | null;
  procesadoconia?: boolean;
  fechaprocesamiento?: string | null;
  datosextraidosjson?: any;
  
  // Información adicional
  observaciones?: string | null;
  
  // Exportación
  urlexcelexportado?: string | null;
  fechaexportacionexcel?: string | null;
  
  // Auditoría
  usuariosubida_id?: string | null;
  usuario?: {
    id: string;
    username: string;
    nombres: string;
    apellidos: string;
  };
  fechasubida?: string;
  fechaactualizacion?: string | null;
}

export interface ActaCreateDTO {
  solicitudId: string;
  anioLectivo: number;
  grado: string;
  seccion: string;
  turno: 'MAÑANA' | 'TARDE' | 'NOCHE';
  tipoEvaluacion: 'FINAL' | 'RECUPERACION' | 'SUBSANACION';
  observaciones?: string;
  estadoFisico?: 'EXCELENTE' | 'BUENO' | 'REGULAR' | 'DETERIORADO';
  requiereRestauracion?: boolean;
}

export interface ActaUpdateDTO {
  numero?: string;
  anioLectivoId?: string;
  gradoId?: string;
  seccion?: string;
  turno?: 'MAÑANA' | 'TARDE' | 'NOCHE';
  tipoEvaluacion?: 'FINAL' | 'RECUPERACION' | 'SUBSANACION';
  libroId?: string;
  folio?: string;
  observaciones?: string;
  // NOTA: No existe campo 'estadoFisico' en la BD
}

export interface SubirArchivoActaDTO {
  archivo: File;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// CLASE DE SERVICIO
// ============================================================================

class ActaService {
  /**
   * Obtener todas las actas con paginación
   */
  async getActas(params?: {
    page?: number;
    limit?: number;
    solicitudId?: string;
    anioLectivo?: number;
    estadoOCR?: string;
    libroId?: string;
  }): Promise<PaginatedResponse<ActaFisica>> {
    const response = await apiClient.get<PaginatedResponse<ActaFisica>>('/actas', {
      params,
    });
    return response.data;
  }

  /**
   * Obtener acta por ID
   */
  async getActaById(id: string): Promise<ApiResponse<ActaFisica>> {
    const response = await apiClient.get<ApiResponse<ActaFisica>>(`/actas/${id}`);
    return response.data;
  }

  /**
   * Obtener acta por solicitud ID
   */
  async getActaBySolicitud(solicitudId: string): Promise<ApiResponse<ActaFisica>> {
    const response = await apiClient.get<ApiResponse<ActaFisica>>(
      `/actas/solicitud/${solicitudId}`
    );
    return response.data;
  }

  /**
   * Crear nueva acta
   */
  async createActa(data: ActaCreateDTO): Promise<ApiResponse<ActaFisica>> {
    const response = await apiClient.post<ApiResponse<ActaFisica>>('/actas', data);
    return response.data;
  }

  /**
   * Actualizar acta existente
   */
  async updateActa(id: string, data: ActaUpdateDTO): Promise<ApiResponse<ActaFisica>> {
    const response = await apiClient.put<ApiResponse<ActaFisica>>(`/actas/${id}`, data);
    return response.data;
  }

  /**
   * Actualizar acta física (alias de updateActa)
   */
  async updateActaFisica(id: string, data: ActaUpdateDTO): Promise<ApiResponse<ActaFisica>> {
    return this.updateActa(id, data);
  }

  /**
   * Eliminar acta
   */
  async deleteActa(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/actas/${id}`);
    return response.data;
  }

  /**
   * Subir archivo escaneado del acta (imagen o PDF)
   */
  async subirArchivo(id: string, archivo: File): Promise<ApiResponse<ActaFisica>> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const response = await apiClient.post<ApiResponse<ActaFisica>>(
      `/actas/${id}/subir-archivo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Actualizar estado OCR del acta
   */
  async actualizarEstadoOCR(
    id: string,
    estado: 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'ERROR'
  ): Promise<ApiResponse<ActaFisica>> {
    const response = await apiClient.patch<ApiResponse<ActaFisica>>(
      `/actas/${id}/estado-ocr`,
      { estadoOCR: estado }
    );
    return response.data;
  }

  /**
   * Buscar actas por criterios
   */
  async buscarActas(params: {
    anioLectivo?: number;
    grado?: string;
    colegio?: string;
    estadoOCR?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ActaFisica>> {
    const response = await apiClient.get<PaginatedResponse<ActaFisica>>('/actas/buscar', {
      params,
    });
    return response.data;
  }

  /**
   * Obtener estadísticas de actas
   */
  async getEstadisticas(): Promise<ApiResponse<{
    totalActas: number;
    porEstadoOCR: Record<string, number>;
    porAnioLectivo: Record<string, number>;
    porEstadoFisico: Record<string, number>;
  }>> {
    const response = await apiClient.get('/actas/estadisticas');
    return response.data;
  }

  // ============================================================================
  // MÉTODOS AUXILIARES PARA NORMALIZACIÓN
  // ============================================================================

  /**
   * Obtener actas procesadas con OCR pendientes de normalizar
   */
  async getActasPendientesNormalizacion(params?: {
    page?: number;
    limit?: number;
    anioLectivo?: number;
    gradoId?: string;
  }): Promise<PaginatedResponse<ActaFisica>> {
    const response = await apiClient.get<PaginatedResponse<ActaFisica>>('/actas', {
      params: {
        ...params,
        procesadoconia: true,
        normalizada: false,
      },
    });
    return response.data;
  }

  /**
   * Obtener actas ya normalizadas
   */
  async getActasNormalizadas(params?: {
    page?: number;
    limit?: number;
    anioLectivo?: number;
    gradoId?: string;
  }): Promise<PaginatedResponse<ActaFisica>> {
    const response = await apiClient.get<PaginatedResponse<ActaFisica>>('/actas', {
      params: {
        ...params,
        normalizada: true,
      },
    });
    return response.data;
  }

  /**
   * Verificar si un acta tiene datos OCR procesados
   */
  tieneDatosOCR(acta: ActaFisica): boolean {
    return !!(acta.procesadoconia && acta.datosextraidosjson);
  }

  /**
   * Verificar si un acta está normalizada
   */
  estaNormalizada(acta: ActaFisica): boolean {
    return !!(acta as any).normalizada;
  }

  /**
   * Obtener JSON de datos extraídos por OCR
   */
  getDatosOCR(acta: ActaFisica): any {
    return acta.datosextraidosjson;
  }
}

// Exportar instancia única
export const actaService = new ActaService();
export default actaService;

