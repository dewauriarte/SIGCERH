import { z } from 'zod';
import { EstadoCertificado } from './types';
export function validate(schema) {
    return (req, _res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            throw new Error(`Validación fallida: ${error.message}`);
        }
    };
}
export function validateQuery(schema) {
    return (req, _res, next) => {
        try {
            schema.parse(req.query);
            next();
        }
        catch (error) {
            throw new Error(`Validación fallida: ${error.message}`);
        }
    };
}
export const GenerarCertificadoDTO = z.object({
    estudianteId: z.string().uuid('ID de estudiante inválido'),
    lugarEmision: z.string().optional().default('PUNO'),
    observaciones: z
        .object({
        retiros: z.string().optional(),
        traslados: z.string().optional(),
        siagie: z.string().optional(),
        pruebasUbicacion: z.string().optional(),
        convalidacion: z.string().optional(),
        otros: z.string().optional(),
    })
        .optional(),
});
export const GenerarPDFDTO = z.object({
    certificadoId: z.string().uuid('ID de certificado inválido'),
    regenerar: z.boolean().optional().default(false),
});
export const AnularCertificadoDTO = z.object({
    motivoAnulacion: z
        .string()
        .min(10, 'El motivo debe tener al menos 10 caracteres')
        .max(500, 'El motivo no puede exceder 500 caracteres'),
});
export const RectificarCertificadoDTO = z.object({
    motivoRectificacion: z
        .string()
        .min(10, 'El motivo debe tener al menos 10 caracteres')
        .max(500, 'El motivo no puede exceder 500 caracteres'),
    observaciones: z
        .object({
        retiros: z.string().optional(),
        traslados: z.string().optional(),
        siagie: z.string().optional(),
        pruebasUbicacion: z.string().optional(),
        convalidacion: z.string().optional(),
        otros: z.string().optional(),
    })
        .optional(),
});
export const MarcarFirmaManuscritaDTO = z.object({
    observaciones: z.string().optional(),
});
export const FiltrosCertificadoDTO = z.object({
    estudianteId: z.string().uuid().optional(),
    estado: z.nativeEnum(EstadoCertificado).optional(),
    codigoVirtual: z.string().optional(),
    numero: z.string().optional(),
    fechaEmisionDesde: z.coerce.date().optional(),
    fechaEmisionHasta: z.coerce.date().optional(),
});
//# sourceMappingURL=dtos.js.map