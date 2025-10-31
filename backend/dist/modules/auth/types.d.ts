export interface AuthUser {
    id: string;
    username: string;
    email: string;
    dni: string | null;
    nombres: string | null;
    apellidos: string | null;
    telefono: string | null;
    cargo: string | null;
    activo: boolean;
    roles: AuthRole[];
    permisos: string[];
}
export interface AuthRole {
    id: string;
    codigo: string;
    nombre: string;
    nivel: number;
    permisos: AuthPermission[];
}
export interface AuthPermission {
    id: string;
    codigo: string;
    nombre: string;
    modulo: string;
}
export interface LoginResponse {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}
export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}
export interface JwtPayload {
    sub?: string;
    username?: string;
    email?: string;
    roles?: string[];
    permisos?: string[];
    iat?: number;
    exp?: number;
}
export interface RegisterData {
    username: string;
    email: string;
    password: string;
    dni?: string;
    nombres?: string;
    apellidos?: string;
    telefono?: string;
    cargo?: string;
    rolesIds?: string[];
}
export interface LoginData {
    usernameOrEmail: string;
    password: string;
}
export interface SessionData {
    id: string;
    userId: string;
    token: string;
    ip: string | null;
    userAgent: string | null;
    fechaInicio: Date;
    fechaExpiracion: Date;
    activa: boolean;
}
export interface ForgotPasswordData {
    email: string;
}
export interface ResetPasswordData {
    token: string;
    newPassword: string;
}
export interface AuthRequest extends Request {
    user?: AuthUser;
    sessionId?: string;
}
//# sourceMappingURL=types.d.ts.map