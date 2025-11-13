/**
 * Servicio Frontend para Estudiantes
 */

import { apiClient } from '@/lib/apiClient';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination: PaginationInfo;
}

export interface Estudiante {
  id: string;
  institucion_id: string;
  dni: string;
  nombres: string;
  apellidopaterno: string;
  apellidomaterno: string;
  nombrecompleto: string;
  fechanacimiento: string;
  lugarnacimiento?: string;
  sexo: 'M' | 'F';
  email?: string;
  telefono?: string;
  direccion?: string;
  observaciones?: string;
  estado?: string;
  fecharegistro: string;
  fechaactualizacion?: string;
}

export interface CreateEstudianteDTO {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  lugarNacimiento?: string;
  sexo: 'M' | 'F';
  email?: string;
  telefono?: string;
  direccion?: string;
  observaciones?: string;
  estado?: string;
}

export interface FiltrosEstudiante {
  search?: string;
  estado?: string;
  sexo?: string;
  page?: number;
  limit?: number;
}

export interface ActaNota {
  area: string;
  codigo_area: string;
  nota: number | null;
  nota_literal: string | null;
}

export interface ActaPorGrado {
  grado: string;
  numero_grado: number;
  anio_lectivo: number;
  situacion_final: string;
  promedio: number;
  notas: ActaNota[];
  acta_id: string;
  acta_numero: string;
}

export interface ActasParaCertificado {
  estudiante: {
    id: string;
    dni: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    nombre_completo: string;
    tiene_dni_temporal: boolean;
  };
  actas_por_grado: Record<string, ActaPorGrado>;
  total_actas: number;
  grados_completos: number[];
  grados_faltantes: number[];
  puede_generar_certificado: boolean;
}

export interface BusquedaNombreResult {
  estudiantes: Estudiante[];
  total: number;
}

export interface ActualizarDNIDTO {
  nuevoDNI: string;
  fusionarDuplicado?: boolean;
}

class EstudianteService {
  private readonly baseUrl = '/estudiantes';

  /**
   * Obtener estudiantes con filtros y paginación
   */
  async getEstudiantes(filtros: FiltrosEstudiante = {}): Promise<PaginatedResponse<Estudiante>> {
    const response = await apiClient.get<PaginatedResponse<Estudiante>>(this.baseUrl, {
      params: filtros,
    });
    return response.data;
  }

  /**
   * Obtener estudiante por ID
   */
  async getEstudiante(id: string): Promise<Estudiante> {
    const response = await apiClient.get<ApiResponse<Estudiante>>(`${this.baseUrl}/${id}`);
    return response.data.data;
  }

  /**
   * Obtener estudiante por ID (alias para compatibilidad)
   */
  async getEstudianteById(id: string): Promise<ApiResponse<Estudiante>> {
    const response = await apiClient.get<ApiResponse<Estudiante>>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Crear nuevo estudiante
   */
  async createEstudiante(data: CreateEstudianteDTO): Promise<ApiResponse<Estudiante>> {
    const response = await apiClient.post<ApiResponse<Estudiante>>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Actualizar estudiante
   */
  async updateEstudiante(id: string, data: Partial<CreateEstudianteDTO>): Promise<ApiResponse<Estudiante>> {
    const response = await apiClient.put<ApiResponse<Estudiante>>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar estudiante
   */
  async deleteEstudiante(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Obtener estudiantes activos
   */
  async getEstudiantesActivos(): Promise<ApiResponse<Estudiante[]>> {
    const response = await apiClient.get<ApiResponse<Estudiante[]>>(`${this.baseUrl}/activos`);
    return response.data;
  }

  /**
   * Buscar estudiantes por nombre completo
   */
  async buscarPorNombre(apellidos: string, nombres: string): Promise<ApiResponse<BusquedaNombreResult>> {
    const response = await apiClient.get<ApiResponse<BusquedaNombreResult>>(`${this.baseUrl}/buscar-nombre`, {
      params: { apellidos, nombres },
    });
    return response.data;
  }

  /**
   * Obtener todas las actas de un estudiante agrupadas por grado
   */
  async getActasParaCertificado(id: string): Promise<ApiResponse<ActasParaCertificado>> {
    const response = await apiClient.get<ApiResponse<ActasParaCertificado>>(`${this.baseUrl}/${id}/actas-certificado`);
    return response.data;
  }

  /**
   * Actualizar DNI de estudiante (temporal a real)
   */
  async actualizarDNI(id: string, data: ActualizarDNIDTO): Promise<ApiResponse<Estudiante>> {
    const response = await apiClient.put<ApiResponse<Estudiante>>(`${this.baseUrl}/${id}/actualizar-dni`, data);
    return response.data;
  }
}

export const estudianteService = new EstudianteService();

