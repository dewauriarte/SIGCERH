import { apiClient } from '@/lib/apiClient';

// ============================
// TIPOS Y INTERFACES
// ============================

export interface Pago {
  id: string;
  solicitudId?: string;
  codigo: string; // P-2025-001234 o numeroorden
  numeroorden?: string; // Número de orden del backend
  numeroOperacion?: string;
  monto: number;
  metodoPago: MetodoPago | string;
  estado: EstadoPago;
  fechaCreacion: string;
  fechaPago?: string;
  fechaValidacion?: string;
  numeroRecibo?: string;
  comprobantePath?: string;
  urlcomprobante?: string;
  observaciones?: string;
  solicitud?: {
    id: string;
    numeroexpediente: string;
    numeroseguimiento?: string;
    estudiante?: {
      dni: string;
      nombres: string;
      apellidopaterno: string;
      apellidomaterno: string;
    };
  } | null;
}

export type MetodoPago =
  | 'YAPE'
  | 'PLIN'
  | 'EFECTIVO'
  | 'TARJETA'
  | 'AGENTE_BANCARIO';

export type EstadoPago =
  | 'PENDIENTE'
  | 'PAGADO'
  | 'VALIDADO'
  | 'RECHAZADO'
  | 'EXPIRADO'
  | 'PENDIENTE_VALIDACION'
  | 'CANCELADO';

export interface PagoCreateDTO {
  solicitudId: string;
  metodoPago: MetodoPago;
}

export interface ComprobanteUploadDTO {
  pagoId: string;
  comprobante: File;
}

export interface QRCodeData {
  qrCode: string; // Base64 o URL
  instrucciones: string[];
  monto: number;
  codigoReferencia: string;
}

// ============================
// SERVICIO
// ============================

export const pagoService = {
  /**
   * Generar orden de pago para una solicitud
   */
  async generarOrden(solicitudId: string, metodoPago: MetodoPago): Promise<Pago> {
    const response = await apiClient.post<Pago>('/pagos/generar-orden', {
      solicitudId,
      metodoPago
    });
    return response.data;
  },

  /**
   * Obtener código QR para Yape/Plin
   */
  async obtenerQR(pagoId: string): Promise<QRCodeData> {
    const response = await apiClient.get<QRCodeData>(`/pagos/${pagoId}/qr`);
    return response.data;
  },

  /**
   * Subir comprobante de pago
   */
  async subirComprobante(pagoId: string, comprobante: File): Promise<Pago> {
    const formData = new FormData();
    formData.append('comprobante', comprobante);

    const response = await apiClient.post<Pago>(
      `/pagos/${pagoId}/comprobante`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  /**
   * Consultar estado de un pago
   */
  async consultarEstado(pagoId: string): Promise<Pago> {
    const response = await apiClient.get<Pago>(`/pagos/${pagoId}/estado`);
    return response.data;
  },

  /**
   * Obtener pago por solicitud
   */
  async obtenerPorSolicitud(solicitudId: string): Promise<Pago | null> {
    try {
      const response = await apiClient.get<Pago>(`/pagos/solicitud/${solicitudId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Generar código para pago en agente/bodega
   */
  async generarCodigoAgente(pagoId: string): Promise<{ codigo: string; instrucciones: string[] }> {
    const response = await apiClient.post<{ codigo: string; instrucciones: string[] }>(
      `/pagos/${pagoId}/codigo-agente`
    );
    return response.data;
  },

  // ============================
  // MÉTODOS PARA MESA DE PARTES
  // ============================

  /**
   * Obtener pagos pendientes de validación (Mesa de Partes)
   */
  async getPendientesValidacion(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<{
    data: Pago[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const response = await apiClient.get('/pagos/pendientes-validacion', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
      },
    });
    return response.data;
  },

  /**
   * Obtener todos los pagos con filtros (Mesa de Partes)
   */
  async getPagos(filters: {
    estado?: EstadoPago;
    metodoPago?: MetodoPago;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    data: Pago[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const response = await apiClient.get('/pagos', { params: filters });
    
    // Mapear datos del backend (snake_case) a frontend (camelCase)
    const mappedData = response.data.data.map((pago: any) => ({
      ...pago,
      codigo: pago.numeroorden || pago.codigo || 'N/A',
      numeroorden: pago.numeroorden,
      numeroOperacion: pago.numerooperacion,
      metodoPago: pago.metodopago || pago.metodoPago || 'N/A',
      fechaCreacion: pago.fecharegistro || pago.fechaCreacion || pago.fechapago,
      fechaPago: pago.fechapago,
      numeroRecibo: pago.numerorecibo,
      comprobantePath: pago.urlcomprobante || pago.comprobantePath,
      urlcomprobante: pago.urlcomprobante,
      solicitudId: pago.solicitud?.id || pago.solicitudId,
    }));

    return {
      data: mappedData,
      meta: response.data.meta,
    };
  },

  /**
   * Validar pago manualmente (aprobar o rechazar)
   */
  async validarPago(
    pagoId: string,
    data: {
      aprobado: boolean;
      observaciones?: string;
      motivoRechazo?: string;
    }
  ): Promise<Pago> {
    const response = await apiClient.post<Pago>(`/pagos/${pagoId}/validar-manual`, data);
    return response.data;
  },

  /**
   * Aprobar pago
   */
  async aprobarPago(pagoId: string, observaciones?: string): Promise<Pago> {
    return this.validarPago(pagoId, { aprobado: true, observaciones });
  },

  /**
   * Rechazar pago
   */
  async rechazarPago(pagoId: string, motivoRechazo: string, observaciones?: string): Promise<Pago> {
    return this.validarPago(pagoId, { aprobado: false, motivoRechazo, observaciones });
  },

  /**
   * Registrar pago en efectivo
   */
  async registrarEfectivo(data: {
    solicitudId: string;
    numeroRecibo: string;
    monto: number;
    fechaPago: string;
    observaciones?: string;
    comprobanteBase64?: string;
  }): Promise<Pago> {
    const response = await apiClient.post<{ success: boolean; message: string; data: any }>('/pagos/registrar-efectivo', data);
    return response.data.data; // Extract nested data object
  },

  /**
   * Descargar ticket de pago (PDF)
   */
  async descargarTicket(pagoId: string): Promise<Blob> {
    const response = await apiClient.get(`/pagos/${pagoId}/ticket`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Descargar recibo de pago en efectivo (PDF)
   */
  async descargarRecibo(pagoId: string): Promise<Blob> {
    const response = await apiClient.get(`/pagos/${pagoId}/recibo`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Obtener estadísticas de pagos (Mesa de Partes)
   * Ahora usa el endpoint dedicado en el backend
   */
  async getEstadisticas(): Promise<{
    totalPagos: number;
    pendientesValidacion: number;
    validados: number;
    rechazados: number;
    montoTotal: number;
    montoValidado: number;
  }> {
    try {
      const response = await apiClient.get<{ success: boolean; message: string; data: {
        totalPagos: number;
        pendientesValidacion: number;
        validados: number;
        rechazados: number;
        montoTotal: number;
        montoValidado: number;
      } }>('/pagos/estadisticas');

      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas de pagos:', error);
      return {
        totalPagos: 0,
        pendientesValidacion: 0,
        validados: 0,
        rechazados: 0,
        montoTotal: 0,
        montoValidado: 0,
      };
    }
  },

  /**
   * Obtener URL del comprobante
   */
  getComprobanteUrl(pago: Pago): string | null {
    if (!pago.comprobantePath) return null;
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return `${API_URL}${pago.comprobantePath}`;
  },

  /**
   * Obtener detalle completo de un pago
   */
  async getPagoById(pagoId: string): Promise<Pago> {
    const response = await apiClient.get<Pago>(`/pagos/${pagoId}`);
    return response.data;
  },

  /**
   * Obtener label del método de pago
   */
  getMetodoPagoLabel(metodo: MetodoPago): string {
    const labels: Record<MetodoPago, string> = {
      YAPE: 'Yape',
      PLIN: 'Plin',
      TARJETA: 'Tarjeta de Crédito/Débito',
      EFECTIVO: 'Efectivo',
      AGENTE_BANCARIO: 'Agente/BCP',
    };
    return labels[metodo] || metodo;
  },

  /**
   * Obtener label del estado de pago
   */
  getEstadoPagoLabel(estado: EstadoPago | string): string {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      PAGADO: 'Pagado',
      PENDIENTE_VALIDACION: 'Pendiente de Validación',
      VALIDADO: 'Validado',
      RECHAZADO: 'Rechazado',
      CANCELADO: 'Cancelado',
      EXPIRADO: 'Expirado',
    };
    return labels[estado] || estado;
  },

  /**
   * Verificar si el pago tiene comprobante
   */
  tieneComprobante(pago: Pago): boolean {
    return !!(pago.comprobantePath && pago.metodoPago !== 'EFECTIVO');
  },

  /**
   * Verificar si el pago puede ser validado
   */
  puedeValidar(pago: Pago): boolean {
    return pago.estado === 'PENDIENTE_VALIDACION';
  },
};
