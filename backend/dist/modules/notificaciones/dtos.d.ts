import { z } from 'zod';
import { TipoNotificacion, CanalNotificacion } from './types';
export declare function validate(schema: z.ZodSchema): (req: any, _res: any, next: any) => void;
export declare function validateQuery(schema: z.ZodSchema): (req: any, _res: any, next: any) => void;
export declare const CrearNotificacionDTO: z.ZodObject<{
    tipo: z.ZodNativeEnum<typeof TipoNotificacion>;
    destinatario: z.ZodString;
    canal: z.ZodNativeEnum<typeof CanalNotificacion>;
    solicitudId: z.ZodOptional<z.ZodString>;
    certificadoId: z.ZodOptional<z.ZodString>;
    datos: z.ZodObject<{
        nombreEstudiante: z.ZodString;
        codigoSeguimiento: z.ZodOptional<z.ZodString>;
        codigoVirtual: z.ZodOptional<z.ZodString>;
        monto: z.ZodOptional<z.ZodNumber>;
        urlDescarga: z.ZodOptional<z.ZodString>;
        enlacePlataforma: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        nombreEstudiante: string;
        codigoVirtual?: string | undefined;
        codigoSeguimiento?: string | undefined;
        monto?: number | undefined;
        urlDescarga?: string | undefined;
        enlacePlataforma?: string | undefined;
    }, {
        nombreEstudiante: string;
        codigoVirtual?: string | undefined;
        codigoSeguimiento?: string | undefined;
        monto?: number | undefined;
        urlDescarga?: string | undefined;
        enlacePlataforma?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    tipo: TipoNotificacion;
    destinatario: string;
    canal: CanalNotificacion;
    datos: {
        nombreEstudiante: string;
        codigoVirtual?: string | undefined;
        codigoSeguimiento?: string | undefined;
        monto?: number | undefined;
        urlDescarga?: string | undefined;
        enlacePlataforma?: string | undefined;
    };
    solicitudId?: string | undefined;
    certificadoId?: string | undefined;
}, {
    tipo: TipoNotificacion;
    destinatario: string;
    canal: CanalNotificacion;
    datos: {
        nombreEstudiante: string;
        codigoVirtual?: string | undefined;
        codigoSeguimiento?: string | undefined;
        monto?: number | undefined;
        urlDescarga?: string | undefined;
        enlacePlataforma?: string | undefined;
    };
    solicitudId?: string | undefined;
    certificadoId?: string | undefined;
}>;
export declare const MarcarEnviadaDTO: z.ZodObject<{
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    observaciones?: string | undefined;
}, {
    observaciones?: string | undefined;
}>;
export declare const FiltrosNotificacionDTO: z.ZodObject<{
    canal: z.ZodOptional<z.ZodNativeEnum<typeof CanalNotificacion>>;
    estado: z.ZodOptional<z.ZodString>;
    tipo: z.ZodOptional<z.ZodNativeEnum<typeof TipoNotificacion>>;
    fechaDesde: z.ZodOptional<z.ZodDate>;
    fechaHasta: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    fechaDesde?: Date | undefined;
    fechaHasta?: Date | undefined;
    estado?: string | undefined;
    tipo?: TipoNotificacion | undefined;
    canal?: CanalNotificacion | undefined;
}, {
    fechaDesde?: Date | undefined;
    fechaHasta?: Date | undefined;
    estado?: string | undefined;
    tipo?: TipoNotificacion | undefined;
    canal?: CanalNotificacion | undefined;
}>;
export type CrearNotificacionDTOType = z.infer<typeof CrearNotificacionDTO>;
export type MarcarEnviadaDTOType = z.infer<typeof MarcarEnviadaDTO>;
export type FiltrosNotificacionDTOType = z.infer<typeof FiltrosNotificacionDTO>;
//# sourceMappingURL=dtos.d.ts.map