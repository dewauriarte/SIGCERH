import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Remover clases anteriores
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      // Forzar actualización del body
      if (systemTheme === 'dark') {
        body.style.backgroundColor = '#2a2a2e';
      } else {
        body.style.backgroundColor = '#f9fafb';
      }
    } else {
      root.classList.add(theme);
      // Forzar actualización del body
      if (theme === 'dark') {
        body.style.backgroundColor = '#2a2a2e';
      } else {
        body.style.backgroundColor = '#f9fafb';
      }
    }
  }, [theme]);

  return <>{children}</>;
}

