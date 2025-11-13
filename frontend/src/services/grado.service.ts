/**
 * Servicio Frontend para Grados
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

export interface Grado {
  id: string;
  institucion_id: string;
  numero: number;
  nombre: string;
  nombrecorto?: string;
  nivel_id?: string;
  orden: number;
  activo: boolean;
  niveleducativo?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  _count?: {
    actafisica: number;
    certificadodetalle: number;
  };
}

export interface CreateGradoDTO {
  numero: number;
  nombre: string;
  nombrecorto?: string;
  nivelId?: string;
  orden?: number; // Opcional, por defecto = numero
  activo?: boolean;
}

export interface FiltrosGrado {
  search?: string;
  nivelId?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}

class GradoService {
  private readonly baseUrl = '/grados';

  async getGrados(filtros: FiltrosGrado = {}): Promise<PaginatedResponse<Grado>> {
    const response = await apiClient.get<PaginatedResponse<Grado>>(this.baseUrl, {
      params: filtros,
    });
    return response.data;
  }

  async getGradoById(id: string): Promise<ApiResponse<Grado>> {
    const response = await apiClient.get<ApiResponse<Grado>>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createGrado(data: CreateGradoDTO): Promise<ApiResponse<Grado>> {
    const response = await apiClient.post<ApiResponse<Grado>>(this.baseUrl, data);
    return response.data;
  }

  async updateGrado(id: string, data: Partial<CreateGradoDTO>): Promise<ApiResponse<Grado>> {
    const response = await apiClient.put<ApiResponse<Grado>>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteGrado(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getGradosActivos(): Promise<ApiResponse<Grado[]>> {
    const response = await apiClient.get<ApiResponse<Grado[]>>(`${this.baseUrl}/activos`);
    return response.data;
  }
}

export const gradoService = new GradoService();

