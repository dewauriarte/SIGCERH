/**
 * DTOs para el módulo de solicitudes con validación Zod
 */

import { z } from 'zod';
import { EstadoSolicitud, ModalidadEntrega, Prioridad } from './types';

/**
 * DTO para crear solicitud desde portal público
 * Acepta datos completos del estudiante y los crea automáticamente
 */
export const CreateSolicitudDTO = z.object({
  // Indicador de apoderado
  esApoderado: z.boolean().default(false),
  
  // Datos del apoderado (opcional)
  datosApoderado: z.object({
    tipoDocumento: z.string(),
    numeroDocumento: z.string(),
    nombres: z.string(),
    apellidoPaterno: z.string(),
    apellidoMaterno: z.string(),
    relacionConEstudiante: z.string(),
    // Carta poder (archivo convertido a base64)
    cartaPoderBase64: z.string().optional(),
    cartaPoderNombre: z.string().optional(),
    cartaPoderTipo: z.string().optional(),
  }).optional(),

  // Datos del estudiante
  estudiante: z.object({
    tipoDocumento: z.string().min(1),
    numeroDocumento: z.string().length(8),
    nombres: z.string().min(2),
    apellidoPaterno: z.string().min(2),
    apellidoMaterno: z.string().min(2),
    fechaNacimiento: z.string(), // ISO date string
  }),

  // Datos académicos
  datosAcademicos: z.object({
    departamento: z.string().min(1),
    provincia: z.string().min(1),
    distrito: z.string().min(1),
    nombreColegio: z.string().min(3),
    ultimoAnioCursado: z.number().int().min(1985).max(2012),
    nivel: z.enum(['PRIMARIA', 'SECUNDARIA']),
  }),

  // Contacto
  contacto: z.object({
    celular: z.string().length(9).regex(/^9\d{8}$/),
    email: z.union([
      z.string().email(),
      z.literal(''),
      z.undefined(),
    ]).optional(),
  }),

  // Motivo
  motivoSolicitud: z.string().min(1),
});

export type CreateSolicitudDTOType = z.infer<typeof CreateSolicitudDTO>;

/**
 * DTO para derivar a Editor (Mesa de Partes)
 */
export const DerivarEditorDTO = z.object({
  editorId: z.string().uuid('ID de editor inválido').optional(),
  observaciones: z.string().max(500).optional(),
});

export type DerivarEditorDTOType = z.infer<typeof DerivarEditorDTO>;

/**
 * DTO para marcar acta como encontrada (Editor)
 */
export const ActaEncontradaDTO = z.object({
  actaId: z.string().uuid('ID de acta inválido'),
  ubicacionFisica: z
    .string()
    .min(3, 'Ubicación física es requerida')
    .max(255),
  observaciones: z.string().max(500).optional(),
});

export type ActaEncontradaDTOType = z.infer<typeof ActaEncontradaDTO>;

/**
 * DTO para marcar acta como no encontrada (Editor)
 */
export const ActaNoEncontradaDTO = z.object({
  motivoNoEncontrada: z
    .string()
    .min(10, 'Debe especificar el motivo (mín 10 caracteres)')
    .max(500),
  observaciones: z
    .string()
    .min(20, 'Observaciones requeridas (mín 20 caracteres)')
    .max(1000),
  sugerenciasUsuario: z
    .string()
    .optional()
    .describe('Sugerencias para el usuario sobre qué hacer'),
});

export type ActaNoEncontradaDTOType = z.infer<typeof ActaNoEncontradaDTO>;

/**
 * DTO para validar pago (Sistema/Mesa de Partes)
 */
export const ValidarPagoDTO = z.object({
  pagoId: z.string().uuid('ID de pago inválido'),
  metodoPago: z
    .enum(['YAPE', 'PLIN', 'TARJETA', 'EFECTIVO', 'AGENTE'])
    .optional(),
  comprobantePago: z.string().optional(),
  observaciones: z.string().max(500).optional(),
});

export type ValidarPagoDTOType = z.infer<typeof ValidarPagoDTO>;

/**
 * DTO para iniciar procesamiento OCR (Editor)
 */
export const IniciarProcesamientoDTO = z.object({
  actaId: z.string().uuid('ID de acta inválido').optional(),
  observaciones: z.string().max(500).optional(),
});

export type IniciarProcesamientoDTOType = z.infer<typeof IniciarProcesamientoDTO>;

/**
 * DTO para aprobar certificado (UGEL)
 */
export const AprobarUGELDTO = z.object({
  observaciones: z.string().max(500).optional(),
  validadoPor: z.string().optional().describe('Nombre del validador UGEL'),
});

export type AprobarUGELDTOType = z.infer<typeof AprobarUGELDTO>;

/**
 * DTO para observar certificado (UGEL)
 */
export const ObservarUGELDTO = z.object({
  observaciones: z
    .string()
    .min(20, 'Observaciones requeridas (mín 20 caracteres)')
    .max(1000),
  camposObservados: z
    .array(z.string())
    .min(1, 'Debe especificar al menos un campo observado'),
  requiereCorreccion: z.boolean().default(true),
});

export type ObservarUGELDTOType = z.infer<typeof ObservarUGELDTO>;

/**
 * DTO para corregir observación de UGEL (Editor)
 */
export const CorregirObservacionDTO = z.object({
  observaciones: z
    .string()
    .min(10, 'Debe explicar las correcciones realizadas')
    .max(1000),
  camposCorregidos: z.array(z.string()).min(1),
});

export type CorregirObservacionDTOType = z.infer<typeof CorregirObservacionDTO>;

/**
 * DTO para registrar en SIAGEC
 */
export const RegistrarSIAGECDTO = z.object({
  codigoQR: z
    .string()
    .min(10, 'Código QR es requerido')
    .max(255),
  codigoVirtual: z
    .string()
    .length(7, 'Código virtual debe tener 7 dígitos')
    .regex(/^[0-9]{7}$/, 'Código virtual debe ser numérico de 7 dígitos'),
  urlVerificacion: z.string().url('URL de verificación inválida').optional(),
  observaciones: z.string().max(500).optional(),
});

export type RegistrarSIAGECDTOType = z.infer<typeof RegistrarSIAGECDTO>;

/**
 * DTO para firmar certificado (Dirección)
 */
export const FirmarCertificadoDTO = z.object({
  tipoFirma: z.enum(['DIGITAL', 'FISICA'], {
    message: 'Tipo de firma debe ser DIGITAL o FISICA',
  }),
  observaciones: z.string().max(500).optional(),
  certificadoFirmadoUrl: z.string().url().optional().describe('URL del certificado firmado (si aplica)'),
});

export type FirmarCertificadoDTOType = z.infer<typeof FirmarCertificadoDTO>;

/**
 * DTO para marcar como entregado (Mesa de Partes/Sistema)
 */
export const MarcarEntregadoDTO = z.object({
  tipoEntrega: z.enum(['DESCARGA', 'FISICA'], {
    message: 'Tipo de entrega debe ser DESCARGA o FISICA',
  }),
  firmaRecepcion: z
    .string()
    .optional()
    .describe('Firma del usuario al recoger (si es FISICA)'),
  dniReceptor: z
    .string()
    .length(8, 'DNI debe tener 8 dígitos')
    .regex(/^[0-9]{8}$/, 'DNI debe ser numérico')
    .optional(),
  observaciones: z.string().max(500).optional(),
});

export type MarcarEntregadoDTOType = z.infer<typeof MarcarEntregadoDTO>;

/**
 * DTO para filtros de consulta
 * IMPORTANTE: Los query params vienen como strings, usar coerce para booleanos
 */
export const FiltrosSolicitudDTO = z.object({
  estado: z.nativeEnum(EstadoSolicitud).optional(),
  estudianteId: z.string().uuid().optional(),
  tipoSolicitudId: z.string().uuid().optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  prioridad: z.nativeEnum(Prioridad).optional(),
  numeroExpediente: z.string().optional(),
  numeroseguimiento: z.string().optional(),
  // Búsqueda genérica en múltiples campos (expediente, seguimiento, DNI)
  busqueda: z.string().optional(),
  // Filtros por rol
  asignadoAEditor: z.string().uuid().optional(),
  pendientePago: z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    return val === 'true' || val === true;
  }, z.boolean().optional()),
  conCertificado: z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    return val === 'true' || val === true;
  }, z.boolean().optional())
});

export type FiltrosSolicitudDTOType = z.infer<typeof FiltrosSolicitudDTO>;

/**
 * DTO para seguimiento público (sin auth)
 */
export const SeguimientoPublicoDTO = z.object({
  codigoSeguimiento: z
    .string()
    .min(5, 'Código de seguimiento inválido')
    .max(50),
  dni: z
    .string()
    .length(8, 'DNI debe tener 8 dígitos')
    .regex(/^[0-9]{8}$/, 'DNI debe ser numérico')
    .optional()
    .describe('DNI del estudiante para verificación'),
});

export type SeguimientoPublicoDTOType = z.infer<typeof SeguimientoPublicoDTO>;

/**
 * Middleware de validación Zod genérico
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

/**
 * Validar query params
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros de consulta inválidos',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

