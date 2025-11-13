/**
 * Tipos, enums e interfaces para el módulo de solicitudes
 * Sistema de Certificados Históricos 1985-2012
 * ACTUALIZADO: Flujo simplificado con 4 roles (PUBLICO, MESA_DE_PARTES, EDITOR, ADMIN)
 */

/**
 * 9 Estados del ciclo de vida de una solicitud (simplificado)
 * Se eliminaron estados relacionados con UGEL, SIAGEC y DIRECCIÓN
 */
export enum EstadoSolicitud {
  REGISTRADA = 'REGISTRADA',
  DERIVADO_A_EDITOR = 'DERIVADO_A_EDITOR',
  EN_BUSQUEDA = 'EN_BUSQUEDA',
  ACTA_ENCONTRADA_PENDIENTE_PAGO = 'ACTA_ENCONTRADA_PENDIENTE_PAGO',
  ACTA_NO_ENCONTRADA = 'ACTA_NO_ENCONTRADA',
  LISTO_PARA_OCR = 'LISTO_PARA_OCR', // ✅ Después de pago validado
  PAGO_VALIDADO = 'PAGO_VALIDADO', // Deprecated - mantener por compatibilidad
  EN_PROCESAMIENTO_OCR = 'EN_PROCESAMIENTO_OCR',
  CERTIFICADO_EMITIDO = 'CERTIFICADO_EMITIDO',
  ENTREGADO = 'ENTREGADO',
}

/**
 * Modalidades de entrega del certificado
 */
export enum ModalidadEntrega {
  DIGITAL = 'DIGITAL', // Descarga PDF con firma digital
  FISICA = 'FISICA', // Retiro en UGEL con firma manuscrita
}

/**
 * Prioridad de la solicitud
 */
export enum Prioridad {
  NORMAL = 'NORMAL',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
}

/**
 * Roles que pueden ejecutar transiciones (simplificado a 4 roles)
 */
export enum RolSolicitud {
  SISTEMA = 'SISTEMA', // Transiciones automáticas
  PUBLICO = 'PUBLICO',
  MESA_DE_PARTES = 'MESA_DE_PARTES',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
}

/**
 * Configuración de transición entre estados
 */
export interface TransicionConfig {
  nextStates: EstadoSolicitud[]; // Estados destino permitidos
  roles: RolSolicitud[]; // Roles que pueden ejecutar esta transición
  requiresData?: string[]; // Campos requeridos para la transición
  description?: string; // Descripción de la transición
}

/**
 * Mapa de transiciones válidas por estado (simplificado)
 * Define qué transiciones son permitidas desde cada estado y quién puede ejecutarlas
 * Flujo simplificado: El EDITOR ahora completa todo el proceso hasta emitir certificado
 */
export const TRANSICIONES_VALIDAS: Record<
  EstadoSolicitud,
  TransicionConfig
> = {
  [EstadoSolicitud.REGISTRADA]: {
    nextStates: [EstadoSolicitud.DERIVADO_A_EDITOR],
    roles: [RolSolicitud.MESA_DE_PARTES, RolSolicitud.SISTEMA],
    description: 'Mesa de Partes deriva solicitud a Editor',
  },
  [EstadoSolicitud.DERIVADO_A_EDITOR]: {
    nextStates: [EstadoSolicitud.EN_BUSQUEDA],
    roles: [RolSolicitud.EDITOR, RolSolicitud.ADMIN],
    description: 'Editor inicia búsqueda de acta física',
  },
  [EstadoSolicitud.EN_BUSQUEDA]: {
    nextStates: [
      EstadoSolicitud.ACTA_ENCONTRADA_PENDIENTE_PAGO,
      EstadoSolicitud.ACTA_NO_ENCONTRADA,
    ],
    roles: [RolSolicitud.EDITOR, RolSolicitud.ADMIN],
    description: 'Editor marca acta como encontrada o no encontrada',
  },
  [EstadoSolicitud.ACTA_ENCONTRADA_PENDIENTE_PAGO]: {
    nextStates: [EstadoSolicitud.LISTO_PARA_OCR],
    roles: [RolSolicitud.SISTEMA, RolSolicitud.MESA_DE_PARTES],
    requiresData: ['pago_id'],
    description:
      'Sistema valida pago automático o Mesa de Partes valida pago en efectivo',
  },
  [EstadoSolicitud.LISTO_PARA_OCR]: {
    nextStates: [EstadoSolicitud.EN_PROCESAMIENTO_OCR],
    roles: [RolSolicitud.EDITOR, RolSolicitud.ADMIN],
    description: 'Pago validado - Editor puede subir acta física para OCR',
  },
  [EstadoSolicitud.ACTA_NO_ENCONTRADA]: {
    nextStates: [], // Estado final - proceso termina sin pago
    roles: [],
    description: 'Estado final - Acta no encontrada, sin cobro',
  },
  [EstadoSolicitud.PAGO_VALIDADO]: {
    nextStates: [EstadoSolicitud.EN_PROCESAMIENTO_OCR],
    roles: [RolSolicitud.EDITOR, RolSolicitud.ADMIN],
    description: 'Editor inicia procesamiento con OCR',
  },
  [EstadoSolicitud.EN_PROCESAMIENTO_OCR]: {
    nextStates: [EstadoSolicitud.CERTIFICADO_EMITIDO],
    roles: [RolSolicitud.EDITOR, RolSolicitud.ADMIN],
    description: 'Editor completa el certificado y lo emite',
  },
  [EstadoSolicitud.CERTIFICADO_EMITIDO]: {
    nextStates: [EstadoSolicitud.ENTREGADO],
    roles: [RolSolicitud.SISTEMA, RolSolicitud.MESA_DE_PARTES],
    description:
      'Usuario descarga (automático) o retira en oficina (Mesa de Partes)',
  },
  [EstadoSolicitud.ENTREGADO]: {
    nextStates: [], // Estado final - proceso exitoso
    roles: [],
    description: 'Estado final - Certificado entregado',
  },
};

/**
 * Datos de una transición de estado
 */
export interface TransicionData {
  solicitudId: string;
  estadoAnterior: EstadoSolicitud;
  estadoNuevo: EstadoSolicitud;
  usuarioId: string;
  rol: RolSolicitud;
  observaciones?: string;
  metadata?: Record<string, any>; // Datos adicionales de la transición
}

/**
 * Entrada del historial de una solicitud
 */
export interface HistorialEntry {
  id: string;
  solicitudId: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  observaciones?: string;
  usuarioId?: string;
  fecha: Date;
}

/**
 * Filtros para consultar solicitudes
 */
export interface FiltrosSolicitud {
  estado?: EstadoSolicitud;
  estados?: EstadoSolicitud[]; // Múltiples estados
  estudianteId?: string;
  tipoSolicitudId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  prioridad?: Prioridad;
  numeroExpediente?: string;
  numeroseguimiento?: string;
  // Filtros por rol
  asignadoAEditor?: string; // Para filtrar solicitudes de un editor específico
  pendientePago?: boolean;
  conCertificado?: boolean;
}

/**
 * Opciones de paginación
 */
export interface PaginacionOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Resultado paginado
 */
export interface ResultadoPaginado<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Validar si una transición es permitida
 */
export function esTransicionValida(
  estadoActual: EstadoSolicitud,
  estadoDestino: EstadoSolicitud,
  rol: RolSolicitud
): boolean {
  const config = TRANSICIONES_VALIDAS[estadoActual];

  if (!config) {
    return false;
  }

  // Verificar que el estado destino es permitido
  if (!config.nextStates.includes(estadoDestino)) {
    return false;
  }

  // Verificar que el rol puede ejecutar esta transición
  if (!config.roles.includes(rol) && !config.roles.includes(RolSolicitud.SISTEMA)) {
    return false;
  }

  return true;
}

/**
 * Obtener estados siguientes permitidos desde un estado actual
 */
export function getEstadosSiguientes(
  estadoActual: EstadoSolicitud
): EstadoSolicitud[] {
  const config = TRANSICIONES_VALIDAS[estadoActual];
  return config ? config.nextStates : [];
}

/**
 * Obtener roles que pueden ejecutar transición desde un estado
 */
export function getRolesPermitidos(estadoActual: EstadoSolicitud): RolSolicitud[] {
  const config = TRANSICIONES_VALIDAS[estadoActual];
  return config ? config.roles : [];
}

/**
 * Verificar si un estado es final (no tiene transiciones siguientes)
 */
export function esEstadoFinal(estado: EstadoSolicitud): boolean {
  const siguientes = getEstadosSiguientes(estado);
  return siguientes.length === 0;
}

