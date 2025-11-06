import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { LogoutOverlay } from '@/components/LogoutOverlay';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  const { isLoggingOut } = useAuth();
  
  return (
    <ThemeProvider>
      <Outlet />
      <Toaster />
      {/* Overlay global para animación de logout */}
      <LogoutOverlay isVisible={isLoggingOut} />
    </ThemeProvider>
  );
}
