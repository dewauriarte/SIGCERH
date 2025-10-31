import { z } from 'zod';
export declare const UpdateConfiguracionDTO: z.ZodObject<{
    nombre: z.ZodOptional<z.ZodString>;
    codigoModular: z.ZodOptional<z.ZodString>;
    direccion: z.ZodOptional<z.ZodString>;
    telefono: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    telefono?: string | undefined;
    nombre?: string | undefined;
    direccion?: string | undefined;
    codigoModular?: string | undefined;
}, {
    email?: string | undefined;
    telefono?: string | undefined;
    nombre?: string | undefined;
    direccion?: string | undefined;
    codigoModular?: string | undefined;
}>;
export type UpdateConfiguracionDTOType = z.infer<typeof UpdateConfiguracionDTO>;
export declare const CreateNivelDTO: z.ZodObject<{
    nombre: z.ZodString;
    codigo: z.ZodString;
    descripcion: z.ZodOptional<z.ZodString>;
    orden: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    codigo: string;
    nombre: string;
    orden: number;
    descripcion?: string | undefined;
}, {
    codigo: string;
    nombre: string;
    descripcion?: string | undefined;
    orden?: number | undefined;
}>;
export type CreateNivelDTOType = z.infer<typeof CreateNivelDTO>;
export declare const UpdateNivelDTO: z.ZodObject<{
    nombre: z.ZodOptional<z.ZodString>;
    codigo: z.ZodOptional<z.ZodString>;
    descripcion: z.ZodOptional<z.ZodString>;
    orden: z.ZodOptional<z.ZodNumber>;
    activo: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    activo?: boolean | undefined;
    codigo?: string | undefined;
    nombre?: string | undefined;
    descripcion?: string | undefined;
    orden?: number | undefined;
}, {
    activo?: boolean | undefined;
    codigo?: string | undefined;
    nombre?: string | undefined;
    descripcion?: string | undefined;
    orden?: number | undefined;
}>;
export type UpdateNivelDTOType = z.infer<typeof UpdateNivelDTO>;
export declare const validate: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=dtos.d.ts.map