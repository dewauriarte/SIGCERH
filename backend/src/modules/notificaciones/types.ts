/**
 * Tipos, enums e interfaces para el módulo de notificaciones
 */

/**
 * Tipos de notificación
 */
export enum TipoNotificacion {
  // Mesa de Partes
  SOLICITUD_RECIBIDA = 'SOLICITUD_RECIBIDA',
  PAGO_RECIBIDO = 'PAGO_RECIBIDO',
  CERTIFICADO_LISTO = 'CERTIFICADO_LISTO',
  
  // Editor
  SOLICITUD_DERIVADA = 'SOLICITUD_DERIVADA',
  ACTA_ENCONTRADA = 'ACTA_ENCONTRADA',
  ACTA_NO_ENCONTRADA = 'ACTA_NO_ENCONTRADA',
  
  // UGEL
  CERTIFICADO_PENDIENTE_VALIDACION = 'CERTIFICADO_PENDIENTE_VALIDACION',
  CERTIFICADO_OBSERVADO = 'CERTIFICADO_OBSERVADO',
  
  // General
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
  mensaje?: string;
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

