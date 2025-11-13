/**
 * Topbar Específico para Administrador
 *
 * Funcionalidades:
 * - Breadcrumbs dinámicos según la página
 * - Búsqueda de usuarios y configuración
 * - Notificaciones del sistema
 * - Theme switcher
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useThemeStore } from '@/stores/themeStore';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Moon,
  Sun,
  Search,
  Bell,
  Users,
  Settings,
  BarChart3,
  Database,
  Home,
  Shield,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function AdminTopbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTheme } = useThemeStore();
  const [searchOpen, setSearchOpen] = useState(false);

  // ==========================================================================
  // QUERIES - Notificaciones y contadores
  // ==========================================================================

  const { data: estadisticas } = useQuery({
    queryKey: ['admin-stats-topbar'],
    queryFn: () => adminService.getEstadisticas(),
    refetchInterval: 60000, // 1 minuto
  });

  // Contador de notificaciones (usuarios bloqueados, errores del sistema, etc.)
  const totalNotificaciones = (estadisticas?.data?.usuarios?.bloqueados || 0);

  // ==========================================================================
  // ATAJO DE TECLADO - Búsqueda (Cmd/Ctrl + K)
  // ==========================================================================

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // ==========================================================================
  // BREADCRUMBS - Obtener nombre de página actual
  // ==========================================================================

  const getPageName = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/dashboard/usuarios')) {
      if (path.includes('/crear')) return 'Crear Usuario';
      if (path.includes('/editar')) return 'Editar Usuario';
      if (path.match(/\/usuarios\/[^/]+$/)) return 'Detalle de Usuario';
      return 'Usuarios';
    }
    if (path.startsWith('/dashboard/roles')) return 'Roles y Permisos';
    if (path.startsWith('/dashboard/reportes')) {
      if (path.includes('/auditoria')) return 'Auditoría';
      return 'Reportes';
    }
    if (path.startsWith('/dashboard/configuracion')) {
      if (path.includes('/curriculo')) return 'Currículo';
      return 'Configuración';
    }
    if (path.startsWith('/dashboard/base-datos')) return 'Base de Datos';
    return 'Administración';
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 bg-background px-4 border-b">
      <SidebarTrigger className="-ml-1" />

      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/dashboard">
              Administración
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{getPageName()}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Acciones y Herramientas */}
      <div className="ml-auto flex items-center gap-2">
        {/* Acciones Rápidas */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden lg:flex">
              Acciones Rápidas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Panel de Control</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => navigate('/dashboard/usuarios/crear')}>
              <Users className="mr-2 h-4 w-4 text-blue-500" />
              Crear Usuario
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/dashboard/roles')}>
              <Shield className="mr-2 h-4 w-4 text-purple-500" />
              Gestionar Roles
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/dashboard/reportes')}>
              <BarChart3 className="mr-2 h-4 w-4 text-green-500" />
              Ver Reportes
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/dashboard/configuracion')}>
              <Settings className="mr-2 h-4 w-4 text-orange-500" />
              Configuración
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Búsqueda */}
        <Button
          variant="outline"
          className="relative h-9 w-9 p-0 xl:h-10 xl:w-64 xl:justify-start xl:px-3 xl:py-2"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4 xl:mr-2" />
          <span className="hidden xl:inline-flex text-muted-foreground">
            Buscar usuarios...
          </span>
          <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Dialog de Búsqueda */}
        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogContent className="p-0">
            <Command className="rounded-lg border shadow-md">
              <CommandInput placeholder="Buscar usuarios, configuración..." />
              <CommandList>
                <CommandEmpty>No se encontraron resultados.</CommandEmpty>

                <CommandGroup heading="Navegación Rápida">
                  <CommandItem
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate('/dashboard');
                    }}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </CommandItem>

                  <CommandItem
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate('/dashboard/usuarios');
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span>Usuarios</span>
                  </CommandItem>

                  <CommandItem
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate('/dashboard/roles');
                    }}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Roles y Permisos</span>
                  </CommandItem>

                  <CommandItem
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate('/dashboard/reportes');
                    }}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Reportes</span>
                  </CommandItem>

                  <CommandItem
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate('/dashboard/configuracion');
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </CommandItem>

                  <CommandItem
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate('/dashboard/base-datos');
                    }}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    <span>Base de Datos</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>

        {/* Notificaciones */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-[1.2rem] w-[1.2rem]" />
              {totalNotificaciones > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                >
                  {totalNotificaciones > 99 ? '99+' : totalNotificaciones}
                </Badge>
              )}
              <span className="sr-only">Notificaciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificaciones del Sistema</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Usuarios Bloqueados */}
            {estadisticas?.data?.usuarios?.bloqueados ? (
              <DropdownMenuItem onClick={() => navigate('/dashboard/usuarios?estado=bloqueados')}>
                <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Usuarios Bloqueados</p>
                  <p className="text-xs text-muted-foreground">
                    {estadisticas.data.usuarios.bloqueados} usuario(s) requieren atención
                  </p>
                </div>
                <Badge variant="destructive">{estadisticas.data.usuarios.bloqueados}</Badge>
              </DropdownMenuItem>
            ) : null}

            {/* Sistema */}
            <DropdownMenuItem onClick={() => navigate('/dashboard/reportes/auditoria')}>
              <Activity className="mr-2 h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Actividad del Sistema</p>
                <p className="text-xs text-muted-foreground">
                  Ver logs de auditoría
                </p>
              </div>
            </DropdownMenuItem>

            {totalNotificaciones === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No hay notificaciones pendientes
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Switcher */}
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
      </div>
    </header>
  );
}
