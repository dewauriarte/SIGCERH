/**
 * Topbar Específico para Editor / Oficina de Actas
 *
 * Funcionalidades:
 * - Breadcrumbs dinámicos según la página
 * - Acciones rápidas del flujo de trabajo
 * - Búsqueda de expedientes por código/DNI
 * - Notificaciones de expedientes urgentes
 * - Estado de procesamiento OCR en tiempo real
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
  FolderSearch,
  Upload,
  FileScan,
  Send,
  AlertTriangle,
  Home,
  FileText,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { editorService } from '@/services/editor.service';
import { notificacionService } from '@/services/notificacion.service';
import { NotificacionesPanel } from './NotificacionesPanel';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function EditorTopbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTheme } = useThemeStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificacionesOpen, setNotificacionesOpen] = useState(false);

  // ==========================================================================
  // QUERIES - Notificaciones y contadores
  // ==========================================================================

  // Obtener contador de notificaciones no leídas desde backend
  const { data: contadorNoLeidas } = useQuery({
    queryKey: ['notificaciones-contador'],
    queryFn: () => notificacionService.contadorNoLeidas(),
    refetchInterval: 30000, // 30 segundos
  });

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
    if (path.startsWith('/expedientes')) return 'Expedientes';
    if (path.startsWith('/ocr')) return 'Procesamiento OCR';
    if (path.startsWith('/certificados')) return 'Certificados';
    if (path.startsWith('/archivo')) return 'Archivo de Actas';
    if (path.startsWith('/configuracion')) return 'Configuración';
    return 'Editor';
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
              Oficina de Actas
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
        {/* Acciones Rápidas del Flujo */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden lg:flex">
              Acciones Rápidas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Flujo de Trabajo</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => navigate('/editor/actas-fisicas')}>
              <FolderSearch className="mr-2 h-4 w-4 text-blue-500" />
              Actas Físicas
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/editor/procesar-ocr')}>
              <FileScan className="mr-2 h-4 w-4 text-purple-500" />
              Procesar con OCR
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/certificados/borradores')}>
              <Send className="mr-2 h-4 w-4 text-orange-500" />
              Enviar a UGEL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Búsqueda de Expedientes */}
        <Button
          variant="outline"
          className="relative h-9 w-9 p-0 xl:h-10 xl:w-64 xl:justify-start xl:px-3 xl:py-2"
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
              <CommandInput placeholder="Buscar por expediente, DNI, o nombre del estudiante..." />
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
                      navigate('/expedientes');
                    }}
                  >
                    <FolderSearch className="mr-2 h-4 w-4" />
                    <span>Expedientes Asignados</span>
                  </CommandItem>

                  <CommandItem
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate('/ocr');
                    }}
                  >
                    <FileScan className="mr-2 h-4 w-4" />
                    <span>Procesamiento OCR</span>
                  </CommandItem>

                  <CommandItem
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate('/certificados');
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Certificados</span>
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
