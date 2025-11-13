/**
 * Servicio Frontend para Años Lectivos
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

export interface AnioLectivo {
  id: string;
  institucion_id: string;
  anio: number;
  fechainicio: string;
  fechafin: string;
  activo: boolean;
  observaciones?: string;
  _count?: {
    actafisica: number;
    certificadodetalle: number;
    curriculogrado: number;
  };
}

export interface CreateAnioLectivoDTO {
  anio: number;
  fechainicio: string;
  fechafin: string;
  activo?: boolean;
  observaciones?: string;
}

export interface FiltrosAnioLectivo {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}

class AnioLectivoService {
  private readonly baseUrl = '/anios-lectivos';

  async getAniosLectivos(filtros: FiltrosAnioLectivo = {}): Promise<PaginatedResponse<AnioLectivo>> {
    const response = await apiClient.get<PaginatedResponse<AnioLectivo>>(this.baseUrl, {
      params: filtros,
    });
    return response.data;
  }

  async getAnioLectivoById(id: string): Promise<ApiResponse<AnioLectivo>> {
    const response = await apiClient.get<ApiResponse<AnioLectivo>>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createAnioLectivo(data: CreateAnioLectivoDTO): Promise<ApiResponse<AnioLectivo>> {
    const response = await apiClient.post<ApiResponse<AnioLectivo>>(this.baseUrl, data);
    return response.data;
  }

  async updateAnioLectivo(id: string, data: Partial<CreateAnioLectivoDTO>): Promise<ApiResponse<AnioLectivo>> {
    const response = await apiClient.put<ApiResponse<AnioLectivo>>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteAnioLectivo(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getAniosLectivosActivos(): Promise<ApiResponse<AnioLectivo[]>> {
    const response = await apiClient.get<ApiResponse<AnioLectivo[]>>(`${this.baseUrl}/activos`);
    return response.data;
  }

  async getAnioLectivoActual(): Promise<ApiResponse<AnioLectivo>> {
    const response = await apiClient.get<ApiResponse<AnioLectivo>>(`${this.baseUrl}/actual`);
    return response.data;
  }
}

export const anioLectivoService = new AnioLectivoService();

