/**
 * Servicio para gestión de libros de actas físicas
 */

import { apiClient } from '@/lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export interface NivelEducativo {
  id: string;
  codigo: string;
  nombre: string;
}

export interface Libro {
  id: string;
  nivel_id?: string;
  codigo: string;
  nombre?: string;
  descripcion?: string;
  tipo_acta?: 'EVALUACION' | 'RECUPERACION' | 'SUBSANACION' | 'TRASLADO' | 'CONVALIDACION';
  anio_inicio: number;
  anio_fin?: number;
  folio_inicio?: number;
  folio_fin?: number;
  total_folios?: number;
  folios_utilizados?: number;
  ubicacion_fisica?: string;
  estante?: string;
  seccion_archivo?: 'HISTORICOS' | 'ACTIVOS' | 'ARCHIVO_CENTRAL' | 'DIRECCION';
  estado: 'ACTIVO' | 'EN_USO' | 'COMPLETO' | 'ARCHIVADO' | 'DETERIORADO' | 'PERDIDO';
  observaciones?: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion?: string;
  niveleducativo?: NivelEducativo;
  _count?: {
    actafisica: number;
  };
}

export interface CreateLibroDTO {
  codigo: string;
  nivel_id?: string;
  nombre?: string;
  descripcion?: string;
  tipo_acta?: 'EVALUACION' | 'RECUPERACION' | 'SUBSANACION' | 'TRASLADO' | 'CONVALIDACION';
  anio_inicio: number;
  anio_fin?: number;
  folio_inicio?: number;
  folio_fin?: number;
  total_folios?: number;
  ubicacion_fisica?: string;
  estante?: string;
  seccion_archivo?: 'HISTORICOS' | 'ACTIVOS' | 'ARCHIVO_CENTRAL' | 'DIRECCION';
  estado?: 'ACTIVO' | 'EN_USO' | 'COMPLETO' | 'ARCHIVADO' | 'DETERIORADO' | 'PERDIDO';
  observaciones?: string;
}

export interface UpdateLibroDTO extends Partial<CreateLibroDTO> {}

export interface FiltrosLibro {
  search?: string;
  estado?: 'ACTIVO' | 'EN_USO' | 'COMPLETO' | 'ARCHIVADO' | 'DETERIORADO' | 'PERDIDO';
  activo?: boolean;
  page?: number;
  limit?: number;
}

class LibroService {
  /**
   * Obtener libros con filtros y paginación
   */
  async getLibros(params?: FiltrosLibro): Promise<PaginatedResponse<Libro>> {
    const response = await apiClient.get<PaginatedResponse<Libro>>('/libros', { params });
    return response.data;
  }

  /**
   * Obtener libros activos para dropdowns
   */
  async getLibrosActivos(): Promise<ApiResponse<Libro[]>> {
    const response = await apiClient.get<ApiResponse<Libro[]>>('/libros/activos');
    return response.data;
  }

  /**
   * Obtener un libro por ID
   */
  async getLibro(id: string): Promise<ApiResponse<Libro>> {
    const response = await apiClient.get<ApiResponse<Libro>>(`/libros/${id}`);
    return response.data;
  }

  /**
   * Crear nuevo libro
   */
  async createLibro(data: CreateLibroDTO): Promise<ApiResponse<Libro>> {
    const response = await apiClient.post<ApiResponse<Libro>>('/libros', data);
    return response.data;
  }

  /**
   * Actualizar un libro
   */
  async updateLibro(id: string, data: UpdateLibroDTO): Promise<ApiResponse<Libro>> {
    const response = await apiClient.put<ApiResponse<Libro>>(`/libros/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar un libro (soft delete)
   */
  async deleteLibro(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/libros/${id}`);
    return response.data;
  }
}

export const libroService = new LibroService();

