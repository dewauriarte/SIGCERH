import { z } from 'zod';
export declare const CreateEstudianteDTO: z.ZodObject<{
    dni: z.ZodString;
    nombres: z.ZodString;
    apellidoPaterno: z.ZodString;
    apellidoMaterno: z.ZodString;
    fechaNacimiento: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
    lugarNacimiento: z.ZodOptional<z.ZodString>;
    sexo: z.ZodOptional<z.ZodEnum<["M", "F"]>>;
    direccion: z.ZodOptional<z.ZodString>;
    telefono: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    nombrePadre: z.ZodOptional<z.ZodString>;
    nombreMadre: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    dni: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    email?: string | undefined;
    telefono?: string | undefined;
    direccion?: string | undefined;
    sexo?: "M" | "F" | undefined;
    fechaNacimiento?: Date | undefined;
    lugarNacimiento?: string | undefined;
    nombrePadre?: string | undefined;
    nombreMadre?: string | undefined;
}, {
    dni: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    email?: string | undefined;
    telefono?: string | undefined;
    direccion?: string | undefined;
    sexo?: "M" | "F" | undefined;
    fechaNacimiento?: string | Date | undefined;
    lugarNacimiento?: string | undefined;
    nombrePadre?: string | undefined;
    nombreMadre?: string | undefined;
}>;
export type CreateEstudianteDTOType = z.infer<typeof CreateEstudianteDTO>;
export declare const UpdateEstudianteDTO: z.ZodObject<{
    dni: z.ZodOptional<z.ZodString>;
    nombres: z.ZodOptional<z.ZodString>;
    apellidoPaterno: z.ZodOptional<z.ZodString>;
    apellidoMaterno: z.ZodOptional<z.ZodString>;
    fechaNacimiento: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
    lugarNacimiento: z.ZodOptional<z.ZodString>;
    sexo: z.ZodOptional<z.ZodEnum<["M", "F"]>>;
    direccion: z.ZodOptional<z.ZodString>;
    telefono: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    nombrePadre: z.ZodOptional<z.ZodString>;
    nombreMadre: z.ZodOptional<z.ZodString>;
    activo: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    dni?: string | undefined;
    nombres?: string | undefined;
    telefono?: string | undefined;
    activo?: boolean | undefined;
    direccion?: string | undefined;
    sexo?: "M" | "F" | undefined;
    apellidoPaterno?: string | undefined;
    apellidoMaterno?: string | undefined;
    fechaNacimiento?: Date | undefined;
    lugarNacimiento?: string | undefined;
    nombrePadre?: string | undefined;
    nombreMadre?: string | undefined;
}, {
    email?: string | undefined;
    dni?: string | undefined;
    nombres?: string | undefined;
    telefono?: string | undefined;
    activo?: boolean | undefined;
    direccion?: string | undefined;
    sexo?: "M" | "F" | undefined;
    apellidoPaterno?: string | undefined;
    apellidoMaterno?: string | undefined;
    fechaNacimiento?: string | Date | undefined;
    lugarNacimiento?: string | undefined;
    nombrePadre?: string | undefined;
    nombreMadre?: string | undefined;
}>;
export type UpdateEstudianteDTOType = z.infer<typeof UpdateEstudianteDTO>;
export declare const SearchEstudianteQueryDTO: z.ZodObject<{
    dni: z.ZodOptional<z.ZodString>;
    nombre: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    dni?: string | undefined;
    nombre?: string | undefined;
}, {
    dni?: string | undefined;
    nombre?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
}>;
export type SearchEstudianteQueryDTOType = z.infer<typeof SearchEstudianteQueryDTO>;
export declare const validate: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
export declare const validateQuery: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=dtos.d.ts.map