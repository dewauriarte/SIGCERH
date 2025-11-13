/**
 * Servicio de Administración
 * Gestión de usuarios, roles, permisos y configuración del sistema
 */

import { apiClient } from '@/lib/apiClient';

// ============================================================================
// TIPOS
// ============================================================================

// Tipos base para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  usuarios?: T[];
  solicitudes?: T[];
  certificados?: T[];
  items?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface Usuario {
  id: string;
  username: string;
  email: string;
  dni: string | null;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  cargo: string | null;
  activo: boolean;
  bloqueado: boolean;
  ultimoAcceso: Date | null;
  fechaCreacion: Date;
  roles: RolUsuario[];
}

export interface RolUsuario {
  id: string;
  codigo: string;
  nombre: string;
  nivel: number;
}

export interface Rol {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  nivel: number;
  activo: boolean;
  permisos: Permiso[];
}

export interface Permiso {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  modulo: string;
  activo: boolean;
}

export interface CreateUsuarioDTO {
  username: string;
  email: string;
  password: string;
  dni?: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  cargo?: string;
  roles: string[]; // Array de códigos de rol
}

export interface UpdateUsuarioDTO {
  email?: string;
  dni?: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  cargo?: string;
  activo?: boolean;
  bloqueado?: boolean;
}

export interface EstadisticasAdmin {
  usuarios: {
    total: number;
    activos: number;
    bloqueados: number;
    nuevosMesActual: number;
  };
  solicitudes: {
    total: number;
    pendientes: number;
    procesadas: number;
    mesActual: number;
  };
  certificados: {
    total: number;
    emitidos: number;
    digitales: number;
    mesActual: number;
  };
  sistema: {
    espacioUsado: string;
    tiempoPromedioEmision: number;
    tasaExito: number;
    ultimaActualizacion: Date;
  };
}

export interface SolicitudPorMes {
  mes: string;
  total: number;
  aprobadas: number;
  rechazadas: number;
}

export interface CertificadoPorColegio {
  colegio: string;
  total: number;
}

export interface AuditoriaLog {
  id: string;
  fecha: Date;
  usuario: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  ip: string | null;
  userAgent: string | null;
  datosAnteriores: any;
  datosNuevos: any;
}

export interface ConfiguracionInstitucional {
  id: string;
  nombre: string;
  codigoModular: string;
  ugel: string;
  distrito: string;
  provincia: string;
  departamento: string;
  direccion: string;
  telefono: string | null;
  email: string | null;
  logo: string | null;
  nombreDirector: string;
  cargoDirector: string;
  firmaDigital: string | null;
  textoLegal: string | null;
  activo: boolean;
}

// ============================================================================
// SERVICIO
// ============================================================================

class AdminService {
  // ==========================================================================
  // DASHBOARD Y ESTADÍSTICAS
  // ==========================================================================

  /**
   * Obtener estadísticas generales para el dashboard
   */
  async getEstadisticas(): Promise<ApiResponse<EstadisticasAdmin>> {
    const response = await apiClient.get<ApiResponse<EstadisticasAdmin>>(
      '/admin/estadisticas'
    );
    return response.data;
  }

  /**
   * Obtener solicitudes por mes (últimos 12 meses)
   */
  async getSolicitudesPorMes(): Promise<ApiResponse<SolicitudPorMes[]>> {
    const response = await apiClient.get<ApiResponse<SolicitudPorMes[]>>(
      '/admin/solicitudes-por-mes'
    );
    return response.data;
  }

  /**
   * Obtener top 10 colegios por certificados emitidos
   */
  async getCertificadosPorColegio(): Promise<ApiResponse<CertificadoPorColegio[]>> {
    const response = await apiClient.get<ApiResponse<CertificadoPorColegio[]>>(
      '/admin/certificados-por-colegio'
    );
    return response.data;
  }

  // ==========================================================================
  // GESTIÓN DE USUARIOS
  // ==========================================================================

  /**
   * Listar usuarios con paginación y filtros
   */
  async getUsuarios(
    params: PaginationParams & {
      search?: string;
      rol?: string;
      activo?: boolean;
    } = {}
  ): Promise<PaginatedResponse<Usuario>> {
    const response = await apiClient.get<PaginatedResponse<Usuario>>('/admin/usuarios', {
      params,
    });
    
    return response.data;
  }

  /**
   * Obtener usuario por ID
   */
  async getUsuario(id: string): Promise<ApiResponse<Usuario>> {
    const response = await apiClient.get<ApiResponse<Usuario>>(`/admin/usuarios/${id}`);
    return response.data;
  }

  /**
   * Crear nuevo usuario
   */
  async createUsuario(data: CreateUsuarioDTO): Promise<ApiResponse<Usuario>> {
    const response = await apiClient.post<ApiResponse<Usuario>>('/admin/usuarios', data);
    return response.data;
  }

  /**
   * Actualizar usuario
   */
  async updateUsuario(id: string, data: UpdateUsuarioDTO): Promise<ApiResponse<Usuario>> {
    const response = await apiClient.patch<ApiResponse<Usuario>>(`/admin/usuarios/${id}`, data);
    return response.data;
  }

  /**
   * Desactivar usuario
   */
  async desactivarUsuario(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/admin/usuarios/${id}/desactivar`);
    return response.data;
  }

  /**
   * Activar usuario
   */
  async activarUsuario(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/admin/usuarios/${id}/activar`);
    return response.data;
  }

  /**
   * Bloquear usuario
   */
  async bloquearUsuario(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/admin/usuarios/${id}/bloquear`);
    return response.data;
  }

  /**
   * Desbloquear usuario
   */
  async desbloquearUsuario(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/admin/usuarios/${id}/desbloquear`);
    return response.data;
  }

  /**
   * Asignar roles a usuario
   */
  async asignarRoles(id: string, rolesIds: string[]): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(
      `/usuarios/${id}/roles`,
      { rolesIds }
    );
    return response.data;
  }

  /**
   * Resetear contraseña de usuario
   */
  async resetearPassword(id: string, nuevaPassword: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(
      `/admin/usuarios/${id}/resetear-password`,
      { password: nuevaPassword }
    );
    return response.data;
  }

  /**
   * Eliminar usuario permanentemente
   */
  async eliminarUsuario(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/usuarios/${id}`);
    return response.data;
  }

  // ==========================================================================
  // GESTIÓN DE ROLES Y PERMISOS
  // ==========================================================================

  /**
   * Listar todos los roles
   */
  async getRoles(): Promise<ApiResponse<Rol[]>> {
    const response = await apiClient.get<ApiResponse<Rol[]>>('/admin/roles');
    return response.data;
  }

  /**
   * Obtener rol por ID con sus permisos
   */
  async getRol(id: string): Promise<ApiResponse<Rol>> {
    const response = await apiClient.get<ApiResponse<Rol>>(`/roles/${id}`);
    return response.data;
  }

  /**
   * Listar todos los permisos disponibles
   */
  async getPermisos(): Promise<ApiResponse<Permiso[]>> {
    const response = await apiClient.get<ApiResponse<Permiso[]>>('/permisos');
    return response.data;
  }

  /**
   * Asignar permisos a un rol
   */
  async asignarPermisos(rolId: string, permisos: string[]): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(
      `/roles/${rolId}/permisos`,
      { permisos }
    );
    return response.data;
  }

  // ==========================================================================
  // CONFIGURACIÓN INSTITUCIONAL
  // ==========================================================================

  /**
   * Obtener configuración de la institución
   */
  async getConfiguracionInstitucional(): Promise<ApiResponse<ConfiguracionInstitucional>> {
    const response = await apiClient.get<ApiResponse<ConfiguracionInstitucional>>(
      '/configuracion/institucion'
    );
    return response.data;
  }

  /**
   * Actualizar configuración institucional
   */
  async updateConfiguracionInstitucional(
    data: Partial<ConfiguracionInstitucional>
  ): Promise<ApiResponse<ConfiguracionInstitucional>> {
    const response = await apiClient.put<ApiResponse<ConfiguracionInstitucional>>(
      '/configuracion/institucion',
      data
    );
    return response.data;
  }

  /**
   * Subir logo de la institución
   */
  async uploadLogo(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/configuracion/institucion/logo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Subir firma digital del director
   */
  async uploadFirmaDigital(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('firma', file);

    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/configuracion/institucion/firma',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  // ==========================================================================
  // AUDITORÍA
  // ==========================================================================

  /**
   * Listar logs de auditoría con paginación y filtros
   */
  async getAuditoria(
    params: PaginationParams & {
      usuario?: string;
      entidad?: string;
      accion?: string;
      desde?: string;
      hasta?: string;
    } = {}
  ): Promise<PaginatedResponse<AuditoriaLog>> {
    const response = await apiClient.get<PaginatedResponse<AuditoriaLog>>(
      '/auditoria',
      { params }
    );
    return response.data;
  }

  /**
   * Exportar logs de auditoría a Excel
   */
  async exportarAuditoria(filtros: any): Promise<Blob> {
    const response = await apiClient.get('/auditoria/exportar', {
      params: filtros,
      responseType: 'blob',
    });
    return response.data;
  }

  // ==========================================================================
  // REPORTES
  // ==========================================================================

  /**
   * Generar reporte de solicitudes
   */
  async generarReporteSolicitudes(filtros: {
    desde?: string;
    hasta?: string;
    estado?: string;
    colegio?: string;
  }): Promise<Blob> {
    const response = await apiClient.get('/reportes/solicitudes', {
      params: filtros,
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Generar reporte de certificados
   */
  async generarReporteCertificados(filtros: {
    desde?: string;
    hasta?: string;
    tipo?: string;
    colegio?: string;
  }): Promise<Blob> {
    const response = await apiClient.get('/reportes/certificados', {
      params: filtros,
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Generar reporte de pagos
   */
  async generarReportePagos(filtros: {
    desde?: string;
    hasta?: string;
    metodoPago?: string;
  }): Promise<Blob> {
    const response = await apiClient.get('/reportes/pagos', {
      params: filtros,
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Generar reporte de usuarios
   */
  async generarReporteUsuarios(filtros: {
    rol?: string;
    activo?: boolean;
  }): Promise<Blob> {
    const response = await apiClient.get('/reportes/usuarios', {
      params: filtros,
      responseType: 'blob',
    });
    return response.data;
  }
}

export const adminService = new AdminService();

