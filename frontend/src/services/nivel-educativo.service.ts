/**
 * Servicio Frontend para Niveles Educativos
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

export interface NivelEducativo {
  id: string;
  institucion_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
  fechacreacion?: string;
  fechaactualizacion?: string;
  grado?: Array<{
    id: string;
    numero: number;
    nombre: string;
    nombrecorto?: string;
    activo?: boolean;
  }>;
  _count?: {
    grado: number;
  };
}

export interface CreateNivelEducativoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden: number;
  activo?: boolean;
}

export interface FiltrosNivelEducativo {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}

class NivelEducativoService {
  private readonly baseUrl = '/niveles-educativos';

  async getNivelesEducativos(filtros: FiltrosNivelEducativo = {}): Promise<PaginatedResponse<NivelEducativo>> {
    const response = await apiClient.get<PaginatedResponse<NivelEducativo>>(this.baseUrl, {
      params: filtros,
    });
    return response.data;
  }

  async getNivelEducativoById(id: string): Promise<ApiResponse<NivelEducativo>> {
    const response = await apiClient.get<ApiResponse<NivelEducativo>>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getNivelEducativo(id: string): Promise<NivelEducativo> {
    const response = await this.getNivelEducativoById(id);
    return response.data;
  }

  async createNivelEducativo(data: CreateNivelEducativoDTO): Promise<ApiResponse<NivelEducativo>> {
    const response = await apiClient.post<ApiResponse<NivelEducativo>>(this.baseUrl, data);
    return response.data;
  }

  async updateNivelEducativo(
    id: string,
    data: Partial<CreateNivelEducativoDTO>
  ): Promise<ApiResponse<NivelEducativo>> {
    const response = await apiClient.put<ApiResponse<NivelEducativo>>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteNivelEducativo(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getNivelesEducativosActivos(): Promise<ApiResponse<NivelEducativo[]>> {
    const response = await apiClient.get<ApiResponse<NivelEducativo[]>>(`${this.baseUrl}/activos`);
    return response.data;
  }
}

export const nivelEducativoService = new NivelEducativoService();

