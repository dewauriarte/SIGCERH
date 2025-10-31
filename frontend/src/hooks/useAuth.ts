import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { authService } from '@/services/auth.service';

export const useLogin = () => {
  return useMutation({
    mutationFn: authService.login,
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: authService.logout,
  });
};

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: authService.me,
    enabled: false, // Solo llamar cuando se necesite
  });
};

// Hook de ejemplo para health check
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await apiClient.get('/health');
      return response.data;
    },
  });
};

