import { Outlet, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/themeStore';
import { Moon, Sun, FileText, Home, Info, Phone, LogIn } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function PublicLayout() {
  const { setTheme } = useThemeStore();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header público */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">SIGCERH</span>
              <span className="text-xs text-muted-foreground hidden sm:block">
                Sistema de Certificados Históricos
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Home className="inline-block mr-1 h-4 w-4" />
              Inicio
            </Link>
            <Link
              to="/about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Info className="inline-block mr-1 h-4 w-4" />
              Acerca de
            </Link>
            <Link
              to="/contact"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Phone className="inline-block mr-1 h-4 w-4" />
              Contacto
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Cambiar tema</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  Claro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  Oscuro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button asChild>
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Ingresar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer público */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">SIGCERH</h3>
              <p className="text-sm text-muted-foreground">
                Sistema de Gestión de Certificados Históricos 1985-2012
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Enlaces Rápidos</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/signup" className="hover:text-foreground transition-colors">
                    Crear Cuenta
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-foreground transition-colors">
                    Iniciar Sesión
                  </Link>
                </li>
                <li>
                  <Link to="/verify" className="hover:text-foreground transition-colors">
                    Verificar Certificado
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Soporte</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/help" className="hover:text-foreground transition-colors">
                    Centro de Ayuda
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-foreground transition-colors">
                    Preguntas Frecuentes
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-foreground transition-colors">
                    Contactar Soporte
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/privacy" className="hover:text-foreground transition-colors">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-foreground transition-colors">
                    Términos y Condiciones
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 SIGCERH - Todos los derechos reservados</p>
            <p className="mt-2">
              Sistema desarrollado para la gestión de certificados educativos históricos
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
