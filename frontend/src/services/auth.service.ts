import { apiClient } from '@/lib/apiClient';
import { type User } from '@/stores/authStore';

// ==================== INTERFACES ====================

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  dni?: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface MeResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface GenericResponse {
  success: boolean;
  message: string;
}

// ==================== AUTH SERVICE ====================

export const authService = {
  /**
   * Login de usuario
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Registro de nuevo usuario (rol PUBLICO por defecto)
   */
  register: async (credentials: RegisterCredentials): Promise<RegisterResponse> => {
    const response = await apiClient.post('/auth/register', credentials);
    return response.data;
  },

  /**
   * Logout del usuario
   */
  logout: async (refreshToken: string): Promise<GenericResponse> => {
    const response = await apiClient.post('/auth/logout', { refreshToken });
    return response.data;
  },

  /**
   * Obtener información del usuario autenticado
   */
  me: async (): Promise<MeResponse> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Refrescar el access token usando refresh token
   */
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  /**
   * Solicitar recuperación de contraseña
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<GenericResponse> => {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Resetear contraseña con token
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<GenericResponse> => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Cambiar contraseña del usuario autenticado
   */
  changePassword: async (data: ChangePasswordRequest): Promise<GenericResponse> => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },
};

