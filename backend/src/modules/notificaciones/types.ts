/**
 * Tipos, enums e interfaces para el módulo de notificaciones
 */

/**
 * Tipos de notificación
 */
export enum TipoNotificacion {
  ACTA_ENCONTRADA = 'ACTA_ENCONTRADA',
  CERTIFICADO_EMITIDO = 'CERTIFICADO_EMITIDO',
}

/**
 * Canales de notificación
 */
export enum CanalNotificacion {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
}

/**
 * Estados de notificación
 */
export enum EstadoNotificacion {
  PENDIENTE = 'PENDIENTE',
  ENVIADA = 'ENVIADA',
  FALLIDA = 'FALLIDA',
  REENVIADA = 'REENVIADA',
}

/**
 * Datos para renderizar plantillas
 */
export interface DatosNotificacion {
  nombreEstudiante: string;
  codigoSeguimiento?: string;
  codigoVirtual?: string;
  monto?: number;
  urlDescarga?: string;
  enlacePlataforma?: string;
}

/**
 * Resultado de envío de email
 */
export interface ResultadoEnvio {
  exito: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Item de notificación en cola
 */
export interface ItemCola {
  notificacionId: string;
  prioridad: number;
  fechaAgregado: Date;
}

/**
 * Datos para enlace de WhatsApp
 */
export interface EnlaceWhatsApp {
  telefono: string;
  nombre: string;
  mensaje: string;
  url: string;
}

