import { z } from 'zod';
import { EstadoCertificado } from './types';
export declare function validate(schema: z.ZodSchema): (req: any, _res: any, next: any) => void;
export declare function validateQuery(schema: z.ZodSchema): (req: any, _res: any, next: any) => void;
export declare const GenerarCertificadoDTO: z.ZodObject<{
    estudianteId: z.ZodString;
    lugarEmision: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    observaciones: z.ZodOptional<z.ZodObject<{
        retiros: z.ZodOptional<z.ZodString>;
        traslados: z.ZodOptional<z.ZodString>;
        siagie: z.ZodOptional<z.ZodString>;
        pruebasUbicacion: z.ZodOptional<z.ZodString>;
        convalidacion: z.ZodOptional<z.ZodString>;
        otros: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        retiros?: string | undefined;
        traslados?: string | undefined;
        siagie?: string | undefined;
        pruebasUbicacion?: string | undefined;
        convalidacion?: string | undefined;
        otros?: string | undefined;
    }, {
        retiros?: string | undefined;
        traslados?: string | undefined;
        siagie?: string | undefined;
        pruebasUbicacion?: string | undefined;
        convalidacion?: string | undefined;
        otros?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    estudianteId: string;
    lugarEmision: string;
    observaciones?: {
        retiros?: string | undefined;
        traslados?: string | undefined;
        siagie?: string | undefined;
        pruebasUbicacion?: string | undefined;
        convalidacion?: string | undefined;
        otros?: string | undefined;
    } | undefined;
}, {
    estudianteId: string;
    observaciones?: {
        retiros?: string | undefined;
        traslados?: string | undefined;
        siagie?: string | undefined;
        pruebasUbicacion?: string | undefined;
        convalidacion?: string | undefined;
        otros?: string | undefined;
    } | undefined;
    lugarEmision?: string | undefined;
}>;
export declare const GenerarPDFDTO: z.ZodObject<{
    certificadoId: z.ZodString;
    regenerar: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    certificadoId: string;
    regenerar: boolean;
}, {
    certificadoId: string;
    regenerar?: boolean | undefined;
}>;
export declare const AnularCertificadoDTO: z.ZodObject<{
    motivoAnulacion: z.ZodString;
}, "strip", z.ZodTypeAny, {
    motivoAnulacion: string;
}, {
    motivoAnulacion: string;
}>;
export declare const RectificarCertificadoDTO: z.ZodObject<{
    motivoRectificacion: z.ZodString;
    observaciones: z.ZodOptional<z.ZodObject<{
        retiros: z.ZodOptional<z.ZodString>;
        traslados: z.ZodOptional<z.ZodString>;
        siagie: z.ZodOptional<z.ZodString>;
        pruebasUbicacion: z.ZodOptional<z.ZodString>;
        convalidacion: z.ZodOptional<z.ZodString>;
        otros: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        retiros?: string | undefined;
        traslados?: string | undefined;
        siagie?: string | undefined;
        pruebasUbicacion?: string | undefined;
        convalidacion?: string | undefined;
        otros?: string | undefined;
    }, {
        retiros?: string | undefined;
        traslados?: string | undefined;
        siagie?: string | undefined;
        pruebasUbicacion?: string | undefined;
        convalidacion?: string | undefined;
        otros?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    motivoRectificacion: string;
    observaciones?: {
        retiros?: string | undefined;
        traslados?: string | undefined;
        siagie?: string | undefined;
        pruebasUbicacion?: string | undefined;
        convalidacion?: string | undefined;
        otros?: string | undefined;
    } | undefined;
}, {
    motivoRectificacion: string;
    observaciones?: {
        retiros?: string | undefined;
        traslados?: string | undefined;
        siagie?: string | undefined;
        pruebasUbicacion?: string | undefined;
        convalidacion?: string | undefined;
        otros?: string | undefined;
    } | undefined;
}>;
export declare const MarcarFirmaManuscritaDTO: z.ZodObject<{
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    observaciones?: string | undefined;
}, {
    observaciones?: string | undefined;
}>;
export declare const FiltrosCertificadoDTO: z.ZodObject<{
    estudianteId: z.ZodOptional<z.ZodString>;
    estado: z.ZodOptional<z.ZodNativeEnum<typeof EstadoCertificado>>;
    codigoVirtual: z.ZodOptional<z.ZodString>;
    numero: z.ZodOptional<z.ZodString>;
    fechaEmisionDesde: z.ZodOptional<z.ZodDate>;
    fechaEmisionHasta: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    numero?: string | undefined;
    estado?: EstadoCertificado | undefined;
    estudianteId?: string | undefined;
    codigoVirtual?: string | undefined;
    fechaEmisionDesde?: Date | undefined;
    fechaEmisionHasta?: Date | undefined;
}, {
    numero?: string | undefined;
    estado?: EstadoCertificado | undefined;
    estudianteId?: string | undefined;
    codigoVirtual?: string | undefined;
    fechaEmisionDesde?: Date | undefined;
    fechaEmisionHasta?: Date | undefined;
}>;
export type GenerarCertificadoDTOType = z.infer<typeof GenerarCertificadoDTO>;
export type GenerarPDFDTOType = z.infer<typeof GenerarPDFDTO>;
export type AnularCertificadoDTOType = z.infer<typeof AnularCertificadoDTO>;
export type RectificarCertificadoDTOType = z.infer<typeof RectificarCertificadoDTO>;
export type MarcarFirmaManuscritaDTOType = z.infer<typeof MarcarFirmaManuscritaDTO>;
export type FiltrosCertificadoDTOType = z.infer<typeof FiltrosCertificadoDTO>;
//# sourceMappingURL=dtos.d.ts.map