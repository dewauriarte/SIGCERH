import { z } from 'zod';
export declare const CreateAnioLectivoDTO: z.ZodObject<{
    anio: z.ZodNumber;
    fechaInicio: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
    fechaFin: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
}, "strip", z.ZodTypeAny, {
    anio: number;
    fechaInicio?: Date | undefined;
    fechaFin?: Date | undefined;
}, {
    anio: number;
    fechaInicio?: string | Date | undefined;
    fechaFin?: string | Date | undefined;
}>;
export type CreateAnioLectivoDTOType = z.infer<typeof CreateAnioLectivoDTO>;
export declare const UpdateAnioLectivoDTO: z.ZodObject<{
    anio: z.ZodOptional<z.ZodNumber>;
    fechaInicio: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
    fechaFin: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
    activo: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    activo?: boolean | undefined;
    anio?: number | undefined;
    fechaInicio?: Date | undefined;
    fechaFin?: Date | undefined;
}, {
    activo?: boolean | undefined;
    anio?: number | undefined;
    fechaInicio?: string | Date | undefined;
    fechaFin?: string | Date | undefined;
}>;
export type UpdateAnioLectivoDTOType = z.infer<typeof UpdateAnioLectivoDTO>;
export declare const CreateGradoDTO: z.ZodObject<{
    nivelEducativoId: z.ZodOptional<z.ZodString>;
    numero: z.ZodNumber;
    nombre: z.ZodString;
    nombreCorto: z.ZodOptional<z.ZodString>;
    orden: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    nombre: string;
    numero: number;
    orden: number;
    nivelEducativoId?: string | undefined;
    nombreCorto?: string | undefined;
}, {
    nombre: string;
    numero: number;
    orden?: number | undefined;
    nivelEducativoId?: string | undefined;
    nombreCorto?: string | undefined;
}>;
export type CreateGradoDTOType = z.infer<typeof CreateGradoDTO>;
export declare const UpdateGradoDTO: z.ZodObject<{
    nivelEducativoId: z.ZodOptional<z.ZodString>;
    numero: z.ZodOptional<z.ZodNumber>;
    nombre: z.ZodOptional<z.ZodString>;
    nombreCorto: z.ZodOptional<z.ZodString>;
    orden: z.ZodOptional<z.ZodNumber>;
    activo: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    activo?: boolean | undefined;
    nombre?: string | undefined;
    numero?: number | undefined;
    orden?: number | undefined;
    nivelEducativoId?: string | undefined;
    nombreCorto?: string | undefined;
}, {
    activo?: boolean | undefined;
    nombre?: string | undefined;
    numero?: number | undefined;
    orden?: number | undefined;
    nivelEducativoId?: string | undefined;
    nombreCorto?: string | undefined;
}>;
export type UpdateGradoDTOType = z.infer<typeof UpdateGradoDTO>;
export declare const CreateAreaCurricularDTO: z.ZodObject<{
    codigo: z.ZodString;
    nombre: z.ZodString;
    orden: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    esCompetenciaTransversal: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    codigo: string;
    nombre: string;
    orden: number;
    esCompetenciaTransversal: boolean;
}, {
    codigo: string;
    nombre: string;
    orden?: number | undefined;
    esCompetenciaTransversal?: boolean | undefined;
}>;
export type CreateAreaCurricularDTOType = z.infer<typeof CreateAreaCurricularDTO>;
export declare const UpdateAreaCurricularDTO: z.ZodObject<{
    codigo: z.ZodOptional<z.ZodString>;
    nombre: z.ZodOptional<z.ZodString>;
    orden: z.ZodOptional<z.ZodNumber>;
    esCompetenciaTransversal: z.ZodOptional<z.ZodBoolean>;
    activo: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    activo?: boolean | undefined;
    codigo?: string | undefined;
    nombre?: string | undefined;
    orden?: number | undefined;
    esCompetenciaTransversal?: boolean | undefined;
}, {
    activo?: boolean | undefined;
    codigo?: string | undefined;
    nombre?: string | undefined;
    orden?: number | undefined;
    esCompetenciaTransversal?: boolean | undefined;
}>;
export type UpdateAreaCurricularDTOType = z.infer<typeof UpdateAreaCurricularDTO>;
export declare const validate: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=dtos.d.ts.map