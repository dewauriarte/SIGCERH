import { z } from 'zod';
import { TipoNotificacion, CanalNotificacion } from './types';
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
export const CrearNotificacionDTO = z.object({
    tipo: z.nativeEnum(TipoNotificacion),
    destinatario: z.string().email('Email inválido'),
    canal: z.nativeEnum(CanalNotificacion),
    solicitudId: z.string().uuid().optional(),
    certificadoId: z.string().uuid().optional(),
    datos: z.object({
        nombreEstudiante: z.string(),
        codigoSeguimiento: z.string().optional(),
        codigoVirtual: z.string().optional(),
        monto: z.number().optional(),
        urlDescarga: z.string().optional(),
        enlacePlataforma: z.string().optional(),
    }),
});
export const MarcarEnviadaDTO = z.object({
    observaciones: z.string().optional(),
});
export const FiltrosNotificacionDTO = z.object({
    canal: z.nativeEnum(CanalNotificacion).optional(),
    estado: z.string().optional(),
    tipo: z.nativeEnum(TipoNotificacion).optional(),
    fechaDesde: z.coerce.date().optional(),
    fechaHasta: z.coerce.date().optional(),
});
//# sourceMappingURL=dtos.js.map