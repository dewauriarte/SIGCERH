/**
 * Servicio de Notificaciones
 * Maneja las notificaciones del usuario autenticado
 */

import { apiClient } from '@/lib/apiClient';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface Notificacion {
  id: string;
  tipo: string;
  destinatario: string;
  asunto?: string;
  mensaje: string;
  canal: string;
  solicitud_id?: string;
  certificado_id?: string;
  estado: 'PENDIENTE' | 'ENVIADA' | 'FALLIDA' | 'REENVIADA';
  fechacreacion: Date | string;
  fechaleido?: Date | string | null;
  solicitud?: {
    numeroexpediente: string;
    estudiante: {
      nombres: string;
      apellidopaterno: string;
      apellidomaterno: string;
    };
  };
}

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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ============================================================================
// CLASE DEL SERVICIO
// ============================================================================

class NotificacionService {
  /**
   * Obtener notificaciones del usuario
   */
  async getNotificaciones(params: {
    page?: number;
    limit?: number;
    soloNoLeidas?: boolean;
  } = {}): Promise<PaginatedResponse<Notificacion>> {
    const { page = 1, limit = 20, soloNoLeidas = false } = params;
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(soloNoLeidas && { soloNoLeidas: 'true' }),
    });

    const response = await apiClient.get<PaginatedResponse<Notificacion>>(
      `/notificaciones/usuario?${queryParams}`
    );
    return response.data;
  }

  /**
   * Marcar notificación como leída
   */
  async marcarLeida(id: string): Promise<void> {
    await apiClient.post(`/notificaciones/${id}/marcar-leida`);
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async marcarTodasLeidas(): Promise<void> {
    await apiClient.post('/notificaciones/marcar-todas-leidas');
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  async contadorNoLeidas(): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      '/notificaciones/contador-no-leidas'
    );
    return response.data.data.count;
  }
}

// Exportar instancia única
export const notificacionService = new NotificacionService();
export default notificacionService;

