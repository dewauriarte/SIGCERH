import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, type LoginCredentials, type RegisterCredentials } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Hook principal de autenticación
 * Maneja login, registro, logout, verificación de sesión
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { 
    user, 
    token, 
    refreshToken,
    isAuthenticated, 
    isLoading,
    isLoggingOut: isLoggingOutStore,
    login: loginStore, 
    logout: logoutStore,
    setUser,
    setLoggingOut,
    checkAuth,
    hasRole,
    hasPermission,
    getPrimaryRole,
  } = useAuthStore();

  // ==================== LOGIN ====================
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // Llamar al endpoint de login
      const response = await authService.login(credentials);
      
      // Agregar un pequeño delay para mostrar la animación (1.5 segundos)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return response;
    },
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data;
      
      // Guardar en store
      loginStore(user, accessToken, refreshToken);
      
      // Notificar éxito
      toast.success('¡Bienvenido!', {
        description: `Hola ${user.nombres || user.username}`,
      });

      // Redirigir según rol
      redirectByRole(user.roles[0]?.codigo || 'PUBLICO');
    },
    onError: (error: any) => {
      toast.error('Error al iniciar sesión', {
        description: error.response?.data?.message || 'Credenciales inválidas',
      });
    },
  });

  // ==================== REGISTRO ====================
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      // Llamar al endpoint de registro
      const response = await authService.register(credentials);
      
      // Agregar un pequeño delay para mostrar la animación (1.5 segundos)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return response;
    },
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data;
      
      // Guardar en store
      loginStore(user, accessToken, refreshToken);
      
      // Notificar éxito
      toast.success('¡Registro exitoso!', {
        description: 'Tu cuenta ha sido creada correctamente',
      });

      // Redirigir al dashboard
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error('Error al registrarse', {
        description: error.response?.data?.message || 'No se pudo crear la cuenta',
      });
    },
  });

  // ==================== LOGOUT ====================
  const handleLogout = async () => {
    // Activar estado de logging out
    setLoggingOut(true);
    
    try {
      // Llamar al endpoint de logout (si hay refreshToken)
      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch (error) {
          console.error('Error al hacer logout en el servidor:', error);
        }
      }
      
      // Agregar delay para mostrar la animación completa (1.5 segundos)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Limpiar store
      logoutStore();
      
      // Limpiar cache de React Query
      queryClient.clear();
      
      // Pequeño delay adicional antes de redirigir
      setTimeout(() => {
        // Notificar
        toast.success('Sesión cerrada', {
          description: 'Has cerrado sesión correctamente',
        });

        // Redirigir al login
        navigate('/login');
      }, 100);
    } catch (error) {
      // Incluso si falla, limpiamos el frontend
      logoutStore();
      queryClient.clear();
      
      setTimeout(() => {
        navigate('/login');
      }, 100);
    }
  };

  // ==================== VERIFICAR SESIÓN ====================
  // Este query se ejecuta periódicamente para verificar que la sesión sigue activa
  const sessionQuery = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      try {
        const response = await authService.me();
        // Actualizar usuario en store si cambió
        if (response.data) {
          setUser(response.data);
        }
        return response;
      } catch (error) {
        // Si la sesión falló, hacer logout
        logoutStore();
        navigate('/login');
        toast.error('Sesión expirada', {
          description: 'Por favor, inicia sesión nuevamente',
        });
        throw error;
      }
    },
    enabled: isAuthenticated && !!token, // Solo si está autenticado
    refetchInterval: 30000, // Cada 30 segundos
    refetchIntervalInBackground: false, // No refrescar en background
    retry: false, // No reintentar si falla
  });

  // ==================== HELPERS ====================
  /**
   * Redirige al usuario según su rol
   */
  const redirectByRole = (role: string) => {
    const roleRoutes: Record<string, string> = {
      PUBLICO: '/dashboard',
      MESA_DE_PARTES: '/dashboard',
      EDITOR: '/dashboard',
      ENCARGADO_UGEL: '/dashboard',
      ENCARGADO_SIAGEC: '/dashboard',
      DIRECCION: '/dashboard',
      ADMIN: '/dashboard',
    };

    const route = roleRoutes[role] || '/dashboard';
    navigate(route);
  };

  /**
   * Obtener nombre completo del usuario
   */
  const getFullName = () => {
    if (!user) return '';
    if (user.nombres && user.apellidos) {
      return `${user.nombres} ${user.apellidos}`;
    }
    return user.username;
  };

  /**
   * Obtener iniciales del usuario
   */
  const getInitials = () => {
    if (!user) return '';
    
    if (user.nombres && user.apellidos) {
      const firstInitial = user.nombres.charAt(0).toUpperCase();
      const lastInitial = user.apellidos.charAt(0).toUpperCase();
      return `${firstInitial}${lastInitial}`;
    }
    
    return user.username.slice(0, 2).toUpperCase();
  };

  return {
    // Estado
    user,
    token,
    refreshToken,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    
    // Mutaciones
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    
    logout: handleLogout,
    isLoggingOut: isLoggingOutStore,
    
    // Query de sesión
    sessionQuery,
    isCheckingSession: sessionQuery.isFetching,
    
    // Utilidades
    checkAuth,
    hasRole,
    hasPermission,
    getPrimaryRole,
    getFullName,
    getInitials,
    redirectByRole,
  };
};

/**
 * Hook simplificado para obtener el usuario
 */
export const useUser = () => {
  const user = useAuthStore((state) => state.user);
  return user;
};

/**
 * Hook para verificar autenticación
 */
export const useIsAuthenticated = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  
  return {
    isAuthenticated,
    checkAuth,
  };
};
