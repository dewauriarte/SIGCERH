/**
 * Servicio Frontend para Áreas Curriculares
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

export interface AreaCurricular {
  id: string;
  institucion_id: string;
  codigo: string;
  nombre: string;
  orden: number;
  escompetenciatransversal: boolean;
  activo: boolean;
  _count?: {
    certificadonota: number;
    curriculogrado: number;
  };
}

export interface CreateAreaCurricularDTO {
  codigo: string;
  nombre: string;
  orden: number;
  escompetenciatransversal?: boolean;
  activo?: boolean;
}

export interface FiltrosAreaCurricular {
  search?: string;
  escompetenciatransversal?: boolean;
  activo?: boolean;
  page?: number;
  limit?: number;
}

class AreaCurricularService {
  private readonly baseUrl = '/areas-curriculares';

  async getAreasCurriculares(filtros: FiltrosAreaCurricular = {}): Promise<PaginatedResponse<AreaCurricular>> {
    const response = await apiClient.get<PaginatedResponse<AreaCurricular>>(this.baseUrl, {
      params: filtros,
    });
    return response.data;
  }

  async getAreaCurricularById(id: string): Promise<ApiResponse<AreaCurricular>> {
    const response = await apiClient.get<ApiResponse<AreaCurricular>>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createAreaCurricular(data: CreateAreaCurricularDTO): Promise<ApiResponse<AreaCurricular>> {
    const response = await apiClient.post<ApiResponse<AreaCurricular>>(this.baseUrl, data);
    return response.data;
  }

  async updateAreaCurricular(
    id: string,
    data: Partial<CreateAreaCurricularDTO>
  ): Promise<ApiResponse<AreaCurricular>> {
    const response = await apiClient.put<ApiResponse<AreaCurricular>>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteAreaCurricular(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getAreasCurricularesActivas(): Promise<ApiResponse<AreaCurricular[]>> {
    const response = await apiClient.get<ApiResponse<AreaCurricular[]>>(`${this.baseUrl}/activas`);
    return response.data;
  }
}

export const areaCurricularService = new AreaCurricularService();

