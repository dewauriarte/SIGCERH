/**
 * Tipos e interfaces para el módulo de autenticación
 */

/**
 * Usuario autenticado (incluye roles y permisos)
 */
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
  permisos: string[]; // códigos de permisos
}

/**
 * Rol con permisos
 */
export interface AuthRole {
  id: string;
  codigo: string;
  nombre: string;
  nivel: number;
  permisos: AuthPermission[];
}

/**
 * Permiso
 */
export interface AuthPermission {
  id: string;
  codigo: string;
  nombre: string;
  modulo: string;
}

/**
 * Respuesta de login
 */
export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Respuesta de refresh token
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Payload del JWT
 */
export interface JwtPayload {
  sub?: string; // userId (opcional para compatibilidad con tokens externos)
  username?: string;
  email?: string;
  roles?: string[]; // códigos de roles
  permisos?: string[]; // códigos de permisos
  iat?: number;
  exp?: number;
}

/**
 * Datos para registro de usuario
 */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  dni?: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  cargo?: string;
  rolesIds?: string[]; // IDs de roles a asignar
}

/**
 * Datos para login
 */
export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

/**
 * Datos de sesión
 */
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

/**
 * Datos para recuperación de contraseña
 */
export interface ForgotPasswordData {
  email: string;
}

/**
 * Datos para reseteo de contraseña
 */
export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

/**
 * Request extendido con usuario autenticado
 */
export interface AuthRequest extends Request {
  user?: AuthUser;
  sessionId?: string;
}

