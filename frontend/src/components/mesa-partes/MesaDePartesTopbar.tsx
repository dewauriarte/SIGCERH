/**
 * Topbar Específico para Mesa de Partes
 * Acciones rápidas, notificaciones y búsqueda contextual
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  ClipboardList,
  CreditCard,
  Package,
  DollarSign,
  FileCheck,
  Home,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { mesaPartesService } from '@/services/mesa-partes.service';
import { pagoService } from '@/services/pago.service';
import { notificacionService } from '@/services/notificacion.service';
import { NotificacionesPanel } from './NotificacionesPanel';

export function MesaDePartesTopbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTheme } = useThemeStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificacionesOpen, setNotificacionesOpen] = useState(false);

  // Obtener contador de notificaciones no leídas desde backend
  const { data: contadorNoLeidas } = useQuery({
    queryKey: ['notificaciones-contador'],
    queryFn: () => notificacionService.contadorNoLeidas(),
    refetchInterval: 30000, // 30 segundos
  });

  // Atajo de teclado para búsqueda (Cmd/Ctrl + K)
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

  // Obtener nombre de página actual para breadcrumbs
  const getPageName = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/solicitudes') return 'Solicitudes';
    if (path === '/pagos') return 'Pagos';
    if (path === '/entregas') return 'Entregas';
    if (path === '/busqueda') return 'Búsqueda';
    if (path === '/configuracion') return 'Configuración';
    return 'Mesa de Partes';
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 bg-background px-4 border-b">
      <SidebarTrigger className="-ml-1" />

      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/dashboard">
              Mesa de Partes
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{getPageName()}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Acciones Rápidas y Herramientas */}
      <div className="ml-auto flex items-center gap-2">
        {/* Acciones Rápidas */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden lg:flex">
              Acciones Rápidas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Acciones Frecuentes</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/solicitudes')}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Ver Solicitudes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/pagos')}>
              <DollarSign className="mr-2 h-4 w-4" />
              Registrar Pago Efectivo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/entregas')}>
              <Package className="mr-2 h-4 w-4" />
              Gestionar Entregas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Búsqueda */}
        <Button
          variant="outline"
          className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4 xl:mr-2" />
          <span className="hidden xl:inline-flex text-muted-foreground">
            Buscar expediente...
          </span>
          <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Dialog de Búsqueda */}
        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogContent className="p-0">
            <Command className="rounded-lg border shadow-md">
              <CommandInput placeholder="Buscar por expediente, DNI, o estudiante..." />
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
                      navigate('/solicitudes');
                    }}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    <span>Solicitudes</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate('/pagos');
                    }}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Pagos</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate('/entregas');
                    }}
                  >
                    <FileCheck className="mr-2 h-4 w-4" />
                    <span>Entregas</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>

        {/* Notificaciones */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setNotificacionesOpen(true)}
        >
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {(contadorNoLeidas || 0) > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {(contadorNoLeidas || 0) > 99 ? '99+' : contadorNoLeidas}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>

        {/* Panel de Notificaciones */}
        <NotificacionesPanel
          open={notificacionesOpen}
          onClose={() => setNotificacionesOpen(false)}
        />

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
