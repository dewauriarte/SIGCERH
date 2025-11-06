import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth.service';

// Variable para rastrear si ya estamos refrescando el token
let isRefreshing = false;
// Cola de peticiones que esperan el refresh
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

// Procesa la cola de peticiones después del refresh
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

// ==================== REQUEST INTERCEPTOR ====================
// Agrega el token JWT a todas las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================
// Maneja errores y refresh token automático
apiClient.interceptors.response.use(
  (response) => response, // Si la respuesta es exitosa, simplemente la retornamos
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Si el error no es 401, lo rechazamos directamente
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Si la petición es a /auth/refresh o /auth/login, no intentamos refresh
    if (
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register')
    ) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Si ya intentamos hacer refresh una vez, no lo intentamos de nuevo
    if (originalRequest._retry) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Si ya estamos refrescando, agregamos a la cola
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest!);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    // Marcamos que ya intentamos y que estamos refrescando
    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = useAuthStore.getState().refreshToken;

    if (!refreshToken) {
      isRefreshing = false;
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // Intentamos refrescar el token
      const response = await authService.refreshToken(refreshToken);
      
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Actualizamos los tokens en el store
      useAuthStore.getState().setToken(accessToken);
      useAuthStore.getState().setRefreshToken(newRefreshToken);

      // Procesamos la cola de peticiones
      processQueue(null, accessToken);

      // Actualizamos el header de la petición original
      if (originalRequest && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }

      isRefreshing = false;

      // Reintentamos la petición original
      return apiClient(originalRequest!);
    } catch (refreshError) {
      // Si el refresh falla, cerramos sesión
      processQueue(refreshError, null);
      isRefreshing = false;
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

