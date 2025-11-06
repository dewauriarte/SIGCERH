import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipos para el usuario autenticado
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

export interface User {
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

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  
  // Acciones
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setLoggingOut: (loggingOut: boolean) => void;
  checkAuth: () => boolean;
  
  // Utilidades
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string | string[]) => boolean;
  getPrimaryRole: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isLoggingOut: false,
      
      // Login: almacena usuario, tokens y marca como autenticado
      login: (user, token, refreshToken) => {
        set({ 
          user, 
          token, 
          refreshToken, 
          isAuthenticated: true,
          isLoading: false 
        });
      },
      
      // Logout: limpia todo el estado
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          refreshToken: null, 
          isAuthenticated: false,
          isLoading: false,
          isLoggingOut: false
        });
      },
      
      // Actualiza solo el usuario
      setUser: (user) => {
        set({ user });
      },
      
      // Actualiza solo el token
      setToken: (token) => {
        set({ token });
      },
      
      // Actualiza solo el refresh token
      setRefreshToken: (refreshToken) => {
        set({ refreshToken });
      },
      
      // Cambia el estado de loading
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      // Cambia el estado de logging out
      setLoggingOut: (loggingOut) => {
        set({ isLoggingOut: loggingOut });
      },
      
      // Verifica si el usuario está autenticado
      checkAuth: () => {
        const { user, token } = get();
        return !!(user && token);
      },
      
      // Verifica si el usuario tiene un rol específico
      hasRole: (role) => {
        const { user } = get();
        if (!user) return false;
        
        const roles = user.roles.map(r => r.codigo);
        
        if (Array.isArray(role)) {
          return role.some(r => roles.includes(r));
        }
        
        return roles.includes(role);
      },
      
      // Verifica si el usuario tiene un permiso específico
      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        
        if (Array.isArray(permission)) {
          return permission.some(p => user.permisos.includes(p));
        }
        
        return user.permisos.includes(permission);
      },
      
      // Obtiene el rol primario (el de mayor nivel)
      getPrimaryRole: () => {
        const { user } = get();
        if (!user || !user.roles.length) return null;
        
        // Ordenar por nivel y retornar el primero
        const sortedRoles = [...user.roles].sort((a, b) => b.nivel - a.nivel);
        return sortedRoles[0].codigo;
      },
    }),
    {
      name: 'auth-storage', // key en localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

