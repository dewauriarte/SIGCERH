/**
 * Servicio para Mesa de Partes
 * Maneja todas las operaciones del rol MESA_DE_PARTES
 */

import { apiClient } from '@/lib/apiClient';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface Solicitud {
  id: string;
  numeroexpediente: string;
  numeroseguimiento: string;
  estado: EstadoSolicitud;
  fechasolicitud: Date | string;
  fechaActualizacion?: Date | string;
  prioridad: 'NORMAL' | 'URGENTE' | 'MUY_URGENTE';
  observaciones?: string | null;

  // Relaciones
  estudiante?: {
    id: string;
    numeroDocumento: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
  };

  tipoSolicitud?: {
    id: string;
    nombre: string;
  };

  editor?: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    activo?: boolean;
  };

  pago?: {
    id: string;
    numeroOrden: string;
    monto: number;
    metodoPago: string;
    estado: 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO' | 'PAGADO';
    numeroRecibo?: string | null;
    fechaPago?: Date | string | null;
    urlComprobante?: string | null;
    observaciones?: string | null;
  } | null;

  certificado?: {
    id: string;
    codigoVerificacion?: string;
    estado: string;
  };
}

export type EstadoSolicitud =
  | 'REGISTRADA'
  | 'DERIVADO_A_EDITOR'
  | 'EN_BUSQUEDA'
  | 'ACTA_ENCONTRADA_PENDIENTE_PAGO'
  | 'ACTA_NO_ENCONTRADA'
  | 'LISTO_PARA_OCR' // Después de pago validado
  | 'PAGO_VALIDADO' // Deprecated
  | 'EN_PROCESAMIENTO_OCR'
  | 'CERTIFICADO_EMITIDO'
  | 'ENTREGADO'
  | 'RECHAZADO'
  | 'CANCELADO';

export interface FiltrosSolicitud {
  estado?: EstadoSolicitud;
  estudianteId?: string;
  numeroExpediente?: string;
  numeroseguimiento?: string;
  busqueda?: string; // Búsqueda genérica en múltiples campos
  fechaDesde?: string;
  fechaHasta?: string;
  prioridad?: 'NORMAL' | 'URGENTE' | 'MUY_URGENTE';
  asignadoAEditor?: string;
  pendientePago?: boolean;
  conCertificado?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
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

export interface Editor {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  activo: boolean;
}

export interface DerivarEditorData {
  editorId?: string;
  observaciones?: string;
}

export interface ValidarPagoData {
  pagoId: string;
  metodoPago?: 'YAPE' | 'PLIN' | 'TARJETA' | 'EFECTIVO' | 'AGENTE';
  comprobantePago?: string;
  observaciones?: string;
}

export interface MarcarEntregadoData {
  tipoEntrega: 'DESCARGA' | 'FISICA';
  firmaRecepcion?: string;
  dniReceptor?: string;
  observaciones?: string;
}

export interface EstadisticasMesaPartes {
  totalSolicitudes: number;
  pendientesDerivacion: number;
  enProceso: number;
  pagosValidar: number;
  listasEntrega: number;
  entregados: number;
}

// ============================================================================
// CLASE DE SERVICIO
// ============================================================================

class MesaPartesService {
  // ==========================================================================
  // SOLICITUDES - LISTADO Y CONSULTA
  // ==========================================================================

  /**
   * Mapear datos del backend (snake_case) a frontend (camelCase)
   */
  private mapSolicitud(data: any): Solicitud {
    // El editor asignado está en usuario_solicitud_usuariogeneracion_idTousuario
    const editorData = data.usuario_solicitud_usuariogeneracion_idTousuario || 
                      data.editor || 
                      data.usuariogeneracion;
    
    // Mapear información del pago
    const pagoData = data.pago ? {
      id: data.pago.id,
      numeroOrden: data.pago.numeroorden,
      monto: Number(data.pago.monto),
      metodoPago: data.pago.metodopago,
      estado: data.pago.estado,
      numeroRecibo: data.pago.numerorecibo,
      fechaPago: data.pago.fechapago,
      urlComprobante: data.pago.urlcomprobante,
      observaciones: data.pago.observaciones,
    } : null;
    
    return {
      ...data,
      estudiante: data.estudiante ? {
        id: data.estudiante.id,
        numeroDocumento: data.estudiante.dni || data.estudiante.numeroDocumento,
        nombres: data.estudiante.nombres,
        apellidoPaterno: data.estudiante.apellidopaterno || data.estudiante.apellidoPaterno,
        apellidoMaterno: data.estudiante.apellidomaterno || data.estudiante.apellidoMaterno,
      } : undefined,
      editor: editorData ? {
        id: editorData.id,
        nombres: editorData.nombres,
        apellidos: editorData.apellidos,
        email: editorData.email,
        activo: editorData.activo,
      } : undefined,
      pago: pagoData,
    };
  }

  /**
   * Obtener todas las solicitudes con filtros y paginación
   */
  async getSolicitudes(
    filtros: FiltrosSolicitud = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<Solicitud>> {
    const params = new URLSearchParams();

    // Agregar filtros
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.estudianteId) params.append('estudianteId', filtros.estudianteId);
    if (filtros.numeroExpediente) params.append('numeroExpediente', filtros.numeroExpediente);
    if (filtros.numeroseguimiento) params.append('numeroseguimiento', filtros.numeroseguimiento);
    // Búsqueda genérica en múltiples campos (expediente, seguimiento, DNI, nombres)
    if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
    if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
    if (filtros.prioridad) params.append('prioridad', filtros.prioridad);
    if (filtros.asignadoAEditor) params.append('asignadoAEditor', filtros.asignadoAEditor);
    if (filtros.pendientePago !== undefined) params.append('pendientePago', String(filtros.pendientePago));
    if (filtros.conCertificado !== undefined) params.append('conCertificado', String(filtros.conCertificado));

    // Agregar paginación
    params.append('page', String(pagination.page || 1));
    params.append('limit', String(pagination.limit || 20));

    const response = await apiClient.get<any>(
      `/solicitudes?${params.toString()}`
    );

    // Mapear datos del backend
    return {
      ...response.data,
      data: response.data.data.map((s: any) => this.mapSolicitud(s)),
    };
  }

  /**
   * Obtener detalle completo de una solicitud
   */
  async getSolicitudById(id: string): Promise<ApiResponse<Solicitud>> {
    const response = await apiClient.get<any>(
      `/solicitudes/${id}`
    );

    return {
      ...response.data,
      data: this.mapSolicitud(response.data.data),
    };
  }

  /**
   * Obtener solicitudes pendientes de derivación a Editor
   */
  async getPendientesDerivacion(
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<Solicitud>> {
    const params = new URLSearchParams();
    params.append('page', String(pagination.page || 1));
    params.append('limit', String(pagination.limit || 20));

    const response = await apiClient.get<any>(
      `/solicitudes/mesa-partes/pendientes-derivacion?${params.toString()}`
    );

    return {
      ...response.data,
      data: response.data.data.map((s: any) => this.mapSolicitud(s)),
    };
  }

  /**
   * Obtener certificados listos para entrega
   */
  async getListasEntrega(
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<Solicitud>> {
    const params = new URLSearchParams();
    params.append('page', String(pagination.page || 1));
    params.append('limit', String(pagination.limit || 20));

    const response = await apiClient.get<any>(
      `/solicitudes/mesa-partes/listas-entrega?${params.toString()}`
    );

    return {
      ...response.data,
      data: response.data.data.map((s: any) => this.mapSolicitud(s)),
    };
  }

  // ==========================================================================
  // DERIVACIÓN A EDITOR
  // ==========================================================================

  /**
   * Derivar solicitud a un Editor
   */
  async derivarAEditor(
    solicitudId: string,
    data: DerivarEditorData
  ): Promise<ApiResponse<Solicitud>> {
    const response = await apiClient.post<any>(
      `/solicitudes/${solicitudId}/mesa-partes/derivar-editor`,
      data
    );

    return {
      ...response.data,
      data: this.mapSolicitud(response.data.data),
    };
  }

  /**
   * Obtener lista de editores disponibles para derivación
   */
  async getEditoresDisponibles(): Promise<ApiResponse<Editor[]>> {
    const response = await apiClient.get<ApiResponse<Editor[]>>(
      `/usuarios/editores`
    );

    return response.data;
  }

  // ==========================================================================
  // VALIDACIÓN DE PAGOS
  // ==========================================================================

  /**
   * Validar pago en efectivo manualmente
   */
  async validarPagoEfectivo(
    solicitudId: string,
    data: ValidarPagoData
  ): Promise<ApiResponse<Solicitud>> {
    const response = await apiClient.post<any>(
      `/solicitudes/${solicitudId}/mesa-partes/validar-pago-efectivo`,
      data
    );

    return {
      ...response.data,
      data: this.mapSolicitud(response.data.data),
    };
  }

  /**
   * Obtener solicitudes con pagos pendientes de validación
   */
  async getPagosPendientesValidacion(
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<Solicitud>> {
    return this.getSolicitudes(
      {
        pendientePago: true,
      },
      pagination
    );
  }

  // ==========================================================================
  // ENTREGAS DE CERTIFICADOS
  // ==========================================================================

  /**
   * Marcar certificado como entregado
   */
  async marcarEntregado(
    solicitudId: string,
    data: MarcarEntregadoData
  ): Promise<ApiResponse<Solicitud>> {
    const response = await apiClient.post<any>(
      `/solicitudes/${solicitudId}/mesa-partes/marcar-entregado`,
      data
    );

    return {
      ...response.data,
      data: this.mapSolicitud(response.data.data),
    };
  }

  /**
   * Obtener certificados ya entregados
   */
  async getCertificadosEntregados(
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<Solicitud>> {
    return this.getSolicitudes(
      {
        estado: 'ENTREGADO',
      },
      pagination
    );
  }

  // ==========================================================================
  // ESTADÍSTICAS Y DASHBOARD
  // ==========================================================================

  /**
   * Obtener estadísticas para el dashboard de Mesa de Partes
   */
  async getEstadisticas(): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/solicitudes/mesa-partes/estadisticas`
    );
    return response.data;
  }

  /**
   * Obtener solicitudes de la última semana
   */
  async getSolicitudesUltimaSemana(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/solicitudes/mesa-partes/solicitudes-semana`
    );
    return response.data;
  }

  /**
   * Obtener actividad reciente del sistema
   */
  async getActividadReciente(limit: number = 10): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/solicitudes/mesa-partes/actividad-reciente?limit=${limit}`
    );
    return response.data;
  }

  // ==========================================================================
  // BÚSQUEDA
  // ==========================================================================

  /**
   * Buscar solicitudes por diferentes criterios
   */
  async buscarSolicitudes(
    query: string,
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<Solicitud>> {
    // Intentar buscar por expediente o seguimiento
    return this.getSolicitudes(
      {
        numeroExpediente: query,
        numeroseguimiento: query,
      },
      pagination
    );
  }

  /**
   * Descargar constancia de entrega de certificado
   * Solo disponible para solicitudes en estado ENTREGADO
   */
  async descargarConstanciaEntrega(solicitudId: string): Promise<void> {
    // Descargar directamente abriendo en nueva ventana
    const url = `/api/solicitudes/${solicitudId}/constancia-entrega`;
    window.open(url, '_blank');
  }
}

// Exportar instancia única del servicio
export const mesaPartesService = new MesaPartesService();
export default mesaPartesService;
