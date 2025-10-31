import { z } from 'zod';
export declare const RegisterDTO: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    dni: z.ZodOptional<z.ZodString>;
    nombres: z.ZodOptional<z.ZodString>;
    apellidos: z.ZodOptional<z.ZodString>;
    telefono: z.ZodOptional<z.ZodString>;
    cargo: z.ZodOptional<z.ZodString>;
    rolesIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
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
    rolesIds?: string[] | undefined;
}>;
export type RegisterDTOType = z.infer<typeof RegisterDTO>;
export declare const LoginDTO: z.ZodObject<{
    usernameOrEmail: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    usernameOrEmail: string;
}, {
    password: string;
    usernameOrEmail: string;
}>;
export type LoginDTOType = z.infer<typeof LoginDTO>;
export declare const RefreshTokenDTO: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type RefreshTokenDTOType = z.infer<typeof RefreshTokenDTO>;
export declare const ForgotPasswordDTO: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export type ForgotPasswordDTOType = z.infer<typeof ForgotPasswordDTO>;
export declare const ResetPasswordDTO: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    newPassword: string;
}, {
    token: string;
    newPassword: string;
}>;
export type ResetPasswordDTOType = z.infer<typeof ResetPasswordDTO>;
export declare const ChangePasswordDTO: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPassword: string;
    currentPassword: string;
}, {
    newPassword: string;
    currentPassword: string;
}>;
export type ChangePasswordDTOType = z.infer<typeof ChangePasswordDTO>;
export declare const validate: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=dtos.d.ts.map