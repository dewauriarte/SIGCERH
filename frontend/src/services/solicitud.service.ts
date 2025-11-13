import { apiClient } from '@/lib/apiClient';

// ============================
// TIPOS Y INTERFACES
// ============================

export interface SolicitudCreateDTO {
  // Tipo de persona
  esApoderado: boolean;
  datosApoderado?: {
    tipoDocumento: string;
    numeroDocumento: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    relacionConEstudiante: string;
  };

  // Datos del estudiante
  estudiante: {
    tipoDocumento: string;
    numeroDocumento: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    fechaNacimiento: string; // ISO format
  };

  // Datos académicos
  datosAcademicos: {
    departamento: string;
    provincia: string;
    distrito: string;
    nombreColegio: string;
    ultimoAnioCursado: number;
    nivel: 'PRIMARIA' | 'SECUNDARIA';
  };

  // Datos de contacto
  contacto: {
    celular: string;
    email?: string;
  };

  // Motivo
  motivoSolicitud: string;
}

export interface Solicitud {
  id: string;
  codigo: string; // S-2025-001234
  estado: EstadoSolicitud;
  fechaCreacion: string;
  fechaActualizacion: string;

  esApoderado: boolean;
  datosApoderado?: any;

  estudiante: {
    tipoDocumento: string;
    numeroDocumento: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    fechaNacimiento: string;
  };

  datosAcademicos: {
    departamento: string;
    provincia: string;
    distrito: string;
    nombreColegio: string;
    ultimoAnioCursado: number;
    nivel: string;
  };

  contacto: {
    celular: string;
    email?: string | null;
  };

  motivoSolicitud: string;

  // Información adicional según el estado
  actaEncontrada?: boolean;
  observaciones?: string | null;
  pagoId?: string | null;
  certificadoId?: string | null;
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

export interface SolicitudSeguimiento {
  solicitud: Solicitud;
  timeline: TimelineItem[];
  proximoPaso: string;
  puedeDescargar: boolean;
  puedePagar: boolean;
}

export interface TimelineItem {
  estado: EstadoSolicitud;
  fecha: string;
  descripcion: string;
  activo: boolean;
  completado: boolean;
}

// ============================
// INTERFACES PARA UGEL
// ============================

export interface SolicitudPendienteUGEL {
  id: string;
  codigo: string;
  estudiante: {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    numeroDocumento: string;
  };
  colegio: string;
  nivel: string;
  editorProceso: {
    id: string;
    nombres: string;
    apellidos: string;
  };
  fechaProcesamiento: string;
  diasPendiente: number;
}

export interface AprobarUGELDTO {
  comentarios?: string;
  firmaDigital?: boolean;
}

export interface ObservarUGELDTO {
  observaciones: string; // Obligatorio
  camposObservados: string[]; // Lista de campos con errores
}

export interface EstadisticasUGEL {
  pendientesValidacion: number;
  aprobadosHoy: number;
  observadosHoy: number;
  totalValidado: number;
  promedioValidacionDias: number;
  validacionesPorDia: {
    fecha: string;
    aprobados: number;
    observados: number;
  }[];
}

// ============================
// INTERFACES PARA SIAGEC
// ============================

export interface SolicitudPendienteSIAGEC {
  id: string;
  codigo: string;
  estudiante: {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    numeroDocumento: string;
  };
  colegio: string;
  nivel: string;
  validadorUGEL: {
    id: string;
    nombres: string;
    apellidos: string;
  };
  fechaValidacion: string;
  diasPendiente: number;
}

export interface RegistrarSIAGECDTO {
  codigoQR: string; // Hash del QR generado
  codigoVirtual: string; // Código de 7 dígitos
  urlVerificacion?: string; // URL completa de verificación
}

export interface CodigoGenerado {
  codigoVirtual: string; // Ejemplo: "1234567"
  codigoQR: string; // Hash para generar QR
  urlVerificacion: string; // URL completa
  qrImageUrl: string; // URL de la imagen QR generada
}

export interface EstadisticasSIAGEC {
  pendientesRegistro: number;
  registradosHoy: number;
  conObservaciones: number;
  totalRegistrado: number;
  promedioRegistroDias: number;
  registrosPorDia: {
    fecha: string;
    registrados: number;
  }[];
}

// ============================
// SERVICIO
// ============================

export const solicitudService = {
  /**
   * Crear una nueva solicitud de certificado (portal público)
   */
  async crear(data: SolicitudCreateDTO): Promise<Solicitud> {
    const response = await apiClient.post<{ success: boolean; message: string; data: Solicitud }>('/solicitudes-publicas/crear', data);
    return response.data.data; // Extraer el objeto data anidado
  },

  /**
   * Consultar el estado de una solicitud por código y DNI
   * (Sin autenticación - público)
   */
  async consultarEstado(codigo: string, dni: string): Promise<SolicitudSeguimiento> {
    const response = await apiClient.get<{ success: boolean; message: string; data: SolicitudSeguimiento }>(
      `/solicitudes-publicas/seguimiento/${codigo}`,
      {
        params: { dni }
      }
    );
    return response.data.data; // Extraer el objeto data anidado
  },

  /**
   * Obtener mis solicitudes (requiere autenticación)
   */
  async misSolicitudes(): Promise<Solicitud[]> {
    const response = await apiClient.get<Solicitud[]>('/solicitudes/mis-solicitudes');
    return response.data;
  },

  /**
   * Obtener una solicitud por ID (requiere autenticación)
   */
  async obtenerPorId(id: string): Promise<Solicitud> {
    const response = await apiClient.get<Solicitud>(`/solicitudes/${id}`);
    return response.data;
  },

  /**
   * Cancelar una solicitud
   */
  async cancelar(id: string, motivo: string): Promise<Solicitud> {
    const response = await apiClient.patch<Solicitud>(`/solicitudes/${id}/cancelar`, {
      motivo
    });
    return response.data;
  },

  // ============================
  // MÉTODOS PARA UGEL
  // ============================

  /**
   * Obtener solicitudes pendientes de validación UGEL
   */
  async getPendientesValidacionUGEL(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    solicitudes: SolicitudPendienteUGEL[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await apiClient.get('/solicitudes/ugel/pendientes-validacion', {
      params
    });
    return response.data;
  },

  /**
   * Aprobar certificado (UGEL)
   */
  async aprobarUGEL(solicitudId: string, data: AprobarUGELDTO): Promise<Solicitud> {
    const response = await apiClient.post<Solicitud>(
      `/solicitudes/${solicitudId}/ugel/aprobar`,
      data
    );
    return response.data;
  },

  /**
   * Observar certificado - devolver a Editor (UGEL)
   */
  async observarUGEL(solicitudId: string, data: ObservarUGELDTO): Promise<Solicitud> {
    const response = await apiClient.post<Solicitud>(
      `/solicitudes/${solicitudId}/ugel/observar`,
      data
    );
    return response.data;
  },

  /**
   * Obtener estadísticas para dashboard UGEL
   */
  async getEstadisticasUGEL(): Promise<EstadisticasUGEL> {
    const response = await apiClient.get<EstadisticasUGEL>('/solicitudes/ugel/estadisticas');
    return response.data;
  },

  // ============================
  // MÉTODOS PARA SIAGEC
  // ============================

  /**
   * Obtener solicitudes pendientes de registro SIAGEC
   */
  async getPendientesRegistroSIAGEC(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    solicitudes: SolicitudPendienteSIAGEC[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await apiClient.get('/solicitudes/siagec/pendientes-registro', {
      params
    });
    return response.data;
  },

  /**
   * Registrar certificado en SIAGEC con códigos QR y virtual
   */
  async registrarSIAGEC(solicitudId: string, data: RegistrarSIAGECDTO): Promise<Solicitud> {
    const response = await apiClient.post<Solicitud>(
      `/solicitudes/${solicitudId}/siagec/registrar`,
      data
    );
    return response.data;
  },

  /**
   * Obtener estadísticas para dashboard SIAGEC
   * TODO: Implementar endpoint en backend
   */
  async getEstadisticasSIAGEC(): Promise<EstadisticasSIAGEC> {
    const response = await apiClient.get<EstadisticasSIAGEC>('/solicitudes/siagec/estadisticas');
    return response.data;
  },
};
