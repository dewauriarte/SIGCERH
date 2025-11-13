/**
 * Servicio para Normalización de Actas Físicas
 * Validación y normalización de datos OCR extraídos por IA
 */

import { apiClient } from '@/lib/apiClient';
import type {
  ResultadoValidacionOCR,
  ResultadoNormalizacion,
  ActaEstudianteDetalle,
  ConsolidadoNotasCertificado,
  DatosNormalizacionDTO,
  FiltrosActasNormalizacion,
  EstadisticasActasNormalizacion,
  ApiResponse,
  PaginatedResponse,
} from '@/types/normalizacion.types';
import type { ActaFisica } from './acta.service';

// ============================================================================
// CLASE DE SERVICIO
// ============================================================================

class NormalizacionService {
  /**
   * Validar datos OCR de un acta antes de normalizar
   * Verifica estructura, estudiantes, notas y mapeo de áreas curriculares
   *
   * @param actaId - ID del acta a validar
   * @returns Resultado de la validación con errores, advertencias y estadísticas
   */
  async validarActa(actaId: string): Promise<ApiResponse<ResultadoValidacionOCR>> {
    const response = await apiClient.post<ApiResponse<ResultadoValidacionOCR>>(
      `/actas/${actaId}/validar`
    );
    return response.data;
  }

  /**
   * Normalizar un acta (JSON → BD estructurada)
   * Convierte datos OCR validados en registros de BD normalizados
   *
   * @param actaId - ID del acta a normalizar
   * @param datos - Datos con correcciones manuales si las hay
   * @returns Resultado de la normalización con estadísticas
   */
  async normalizarActa(
    actaId: string,
    datos?: DatosNormalizacionDTO
  ): Promise<ApiResponse<ResultadoNormalizacion>> {
    const response = await apiClient.post<ApiResponse<ResultadoNormalizacion>>(
      `/actas/${actaId}/normalizar`,
      datos || {}
    );
    return response.data;
  }

  /**
   * Obtener todas las actas normalizadas de un estudiante
   * Incluye notas organizadas por año/grado
   *
   * @param estudianteId - ID del estudiante
   * @returns Array de actas con detalles completos
   */
  async getActasEstudiante(estudianteId: string): Promise<ApiResponse<ActaEstudianteDetalle[]>> {
    const response = await apiClient.get<ApiResponse<ActaEstudianteDetalle[]>>(
      `/actas/estudiantes/${estudianteId}/actas`
    );
    return response.data;
  }

  /**
   * Obtener consolidado de notas de un estudiante para certificado
   * Agrupa notas por año/grado con estadísticas
   *
   * @param estudianteId - ID del estudiante
   * @returns Consolidado completo de notas académicas
   */
  async getNotasConsolidadas(
    estudianteId: string
  ): Promise<ApiResponse<ConsolidadoNotasCertificado>> {
    const response = await apiClient.get<ApiResponse<ConsolidadoNotasCertificado>>(
      `/actas/estudiantes/${estudianteId}/notas-consolidadas`
    );
    return response.data;
  }

  /**
   * Obtener lista de actas con filtros para normalización
   * Lista de actas procesadas, normalizadas o pendientes
   *
   * @param filtros - Filtros de búsqueda (estado, año, grado, etc.)
   * @returns Lista paginada de actas
   */
  async getActasParaNormalizar(
    filtros?: FiltrosActasNormalizacion
  ): Promise<PaginatedResponse<ActaFisica>> {
    const response = await apiClient.get<PaginatedResponse<ActaFisica>>('/actas', {
      params: {
        ...filtros,
        // Agregar parámetros específicos para normalización
        procesadoConIA: true, // Solo actas procesadas con OCR
      },
    });
    return response.data;
  }

  /**
   * Obtener estadísticas generales de normalización
   * Total de actas procesadas, normalizadas, pendientes, etc.
   *
   * @returns Estadísticas del sistema de normalización
   */
  async getEstadisticasNormalizacion(): Promise<ApiResponse<EstadisticasActasNormalizacion>> {
    const response = await apiClient.get<ApiResponse<EstadisticasActasNormalizacion>>(
      '/actas/estadisticas/normalizacion'
    );
    return response.data;
  }

  /**
   * Re-normalizar un acta ya normalizada (sobrescribir datos)
   * CUIDADO: Elimina registros anteriores y vuelve a normalizar
   *
   * @param actaId - ID del acta a re-normalizar
   * @param datos - Nuevos datos con correcciones
   * @returns Resultado de la re-normalización
   */
  async renormalizarActa(
    actaId: string,
    datos?: DatosNormalizacionDTO
  ): Promise<ApiResponse<ResultadoNormalizacion>> {
    const response = await apiClient.put<ApiResponse<ResultadoNormalizacion>>(
      `/actas/${actaId}/renormalizar`,
      datos || {}
    );
    return response.data;
  }

  /**
   * Verificar si un acta está normalizada
   * Helper rápido para verificar estado de normalización
   *
   * @param actaId - ID del acta
   * @returns True si está normalizada
   */
  async isActaNormalizada(actaId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ normalizada: boolean }>>(
        `/actas/${actaId}/estado-normalizacion`
      );
      return response.data.data.normalizada;
    } catch (error) {
      console.error('Error verificando normalización:', error);
      return false;
    }
  }

  /**
   * Obtener historial de normalizaciones de un acta
   * Si se ha normalizado múltiples veces
   *
   * @param actaId - ID del acta
   * @returns Array con historial de normalizaciones
   */
  async getHistorialNormalizacion(actaId: string): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/actas/${actaId}/historial-normalizacion`
    );
    return response.data;
  }
}

// Exportar instancia única (singleton)
export const normalizacionService = new NormalizacionService();
export default normalizacionService;
