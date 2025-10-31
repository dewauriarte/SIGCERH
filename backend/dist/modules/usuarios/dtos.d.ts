import { z } from 'zod';
export declare const CreateUsuarioDTO: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    dni: z.ZodOptional<z.ZodString>;
    nombres: z.ZodOptional<z.ZodString>;
    apellidos: z.ZodOptional<z.ZodString>;
    telefono: z.ZodOptional<z.ZodString>;
    cargo: z.ZodOptional<z.ZodString>;
    rolesIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    activo: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    activo: boolean;
    password: string;
    rolesIds: string[];
    dni?: string | undefined;
    nombres?: string | undefined;
    apellidos?: string | undefined;
    telefono?: string | undefined;
    cargo?: string | undefined;
}, {
    username: string;
    email: string;
    password: string;
    dni?: string | undefined;
    nombres?: string | undefined;
    apellidos?: string | undefined;
    telefono?: string | undefined;
    cargo?: string | undefined;
    activo?: boolean | undefined;
    rolesIds?: string[] | undefined;
}>;
export type CreateUsuarioDTOType = z.infer<typeof CreateUsuarioDTO>;
export declare const UpdateUsuarioDTO: z.ZodObject<{
    username: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    dni: z.ZodOptional<z.ZodString>;
    nombres: z.ZodOptional<z.ZodString>;
    apellidos: z.ZodOptional<z.ZodString>;
    telefono: z.ZodOptional<z.ZodString>;
    cargo: z.ZodOptional<z.ZodString>;
    activo: z.ZodOptional<z.ZodBoolean>;
    bloqueado: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    username?: string | undefined;
    email?: string | undefined;
    dni?: string | undefined;
    nombres?: string | undefined;
    apellidos?: string | undefined;
    telefono?: string | undefined;
    cargo?: string | undefined;
    bloqueado?: boolean | undefined;
    activo?: boolean | undefined;
    password?: string | undefined;
}, {
    username?: string | undefined;
    email?: string | undefined;
    dni?: string | undefined;
    nombres?: string | undefined;
    apellidos?: string | undefined;
    telefono?: string | undefined;
    cargo?: string | undefined;
    bloqueado?: boolean | undefined;
    activo?: boolean | undefined;
    password?: string | undefined;
}>;
export type UpdateUsuarioDTOType = z.infer<typeof UpdateUsuarioDTO>;
export declare const AsignarRolesDTO: z.ZodObject<{
    rolesIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    rolesIds: string[];
}, {
    rolesIds: string[];
}>;
export type AsignarRolesDTOType = z.infer<typeof AsignarRolesDTO>;
export declare const ListUsuariosQueryDTO: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
    search: z.ZodOptional<z.ZodString>;
    activo: z.ZodOptional<z.ZodEffects<z.ZodEnum<["true", "false"]>, boolean, "true" | "false">>;
    rol: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    activo?: boolean | undefined;
    rol?: string | undefined;
    search?: string | undefined;
}, {
    activo?: "true" | "false" | undefined;
    rol?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
    search?: string | undefined;
}>;
export type ListUsuariosQueryDTOType = z.infer<typeof ListUsuariosQueryDTO>;
export declare const validate: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
export declare const validateQuery: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=dtos.d.ts.map