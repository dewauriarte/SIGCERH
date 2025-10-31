import { z } from 'zod';
import { EstadoSolicitud, ModalidadEntrega, Prioridad } from './types';
export const CreateSolicitudDTO = z.object({
    estudianteId: z.string().uuid('ID de estudiante inválido'),
    tipoSolicitudId: z.string().uuid('ID de tipo de solicitud inválido'),
    modalidadEntrega: z.nativeEnum(ModalidadEntrega, {
        message: 'Modalidad de entrega inválida',
    }),
    direccionEntrega: z.string().optional(),
    colegioNombre: z
        .string()
        .min(3, 'Nombre del colegio debe tener al menos 3 caracteres')
        .max(255),
    colegioUbicacion: z.string().optional(),
    anioLectivo: z
        .number()
        .int()
        .min(1985, 'Año lectivo mínimo: 1985')
        .max(2012, 'Año lectivo máximo: 2012'),
    gradoId: z.string().uuid('ID de grado inválido'),
    celular: z
        .string()
        .min(9, 'Celular debe tener al menos 9 dígitos')
        .max(15)
        .regex(/^[0-9+\-\s]+$/, 'Formato de celular inválido'),
    email: z.string().email('Email inválido').optional(),
    motivoSolicitud: z.string().min(5, 'Motivo debe tener al menos 5 caracteres'),
    observaciones: z.string().optional(),
    prioridad: z.nativeEnum(Prioridad).optional().default(Prioridad.NORMAL),
});
export const DerivarEditorDTO = z.object({
    editorId: z.string().uuid('ID de editor inválido').optional(),
    observaciones: z.string().max(500).optional(),
});
export const ActaEncontradaDTO = z.object({
    actaId: z.string().uuid('ID de acta inválido'),
    ubicacionFisica: z
        .string()
        .min(3, 'Ubicación física es requerida')
        .max(255),
    observaciones: z.string().max(500).optional(),
});
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
export const ValidarPagoDTO = z.object({
    pagoId: z.string().uuid('ID de pago inválido'),
    metodoPago: z
        .enum(['YAPE', 'PLIN', 'TARJETA', 'EFECTIVO', 'AGENTE'])
        .optional(),
    comprobantePago: z.string().optional(),
    observaciones: z.string().max(500).optional(),
});
export const IniciarProcesamientoDTO = z.object({
    actaId: z.string().uuid('ID de acta inválido').optional(),
    observaciones: z.string().max(500).optional(),
});
export const AprobarUGELDTO = z.object({
    observaciones: z.string().max(500).optional(),
    validadoPor: z.string().optional().describe('Nombre del validador UGEL'),
});
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
export const CorregirObservacionDTO = z.object({
    observaciones: z
        .string()
        .min(10, 'Debe explicar las correcciones realizadas')
        .max(1000),
    camposCorregidos: z.array(z.string()).min(1),
});
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
export const FirmarCertificadoDTO = z.object({
    tipoFirma: z.enum(['DIGITAL', 'FISICA'], {
        message: 'Tipo de firma debe ser DIGITAL o FISICA',
    }),
    observaciones: z.string().max(500).optional(),
    certificadoFirmadoUrl: z.string().url().optional().describe('URL del certificado firmado (si aplica)'),
});
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
export const FiltrosSolicitudDTO = z.object({
    estado: z.nativeEnum(EstadoSolicitud).optional(),
    estudianteId: z.string().uuid().optional(),
    tipoSolicitudId: z.string().uuid().optional(),
    fechaDesde: z.coerce.date().optional(),
    fechaHasta: z.coerce.date().optional(),
    prioridad: z.nativeEnum(Prioridad).optional(),
    numeroExpediente: z.string().optional(),
    numeroseguimiento: z.string().optional(),
    asignadoAEditor: z.string().uuid().optional(),
    pendientePago: z.boolean().optional(),
    conCertificado: z.boolean().optional(),
});
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
export const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
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
export const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.query);
            next();
        }
        catch (error) {
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
//# sourceMappingURL=dtos.js.map