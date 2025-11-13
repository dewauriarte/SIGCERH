/**
 * Protected Layout Router
 * Detecta el rol del usuario y renderiza el layout específico
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Search, Home, ClipboardList, FileText, CreditCard, User, Settings } from 'lucide-react';
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
import { useState, useEffect } from 'react';

// Importar layouts específicos por rol (sistema simplificado con 4 roles)
import MesaDePartesLayout from './MesaDePartesLayout';
import EditorLayout from './EditorLayout';
import AdminLayout from './AdminLayout';

export default function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  const { isMesaDePartes, isEditor, isAdmin } = useRole();

  // El polling de sesión se ejecuta automáticamente en el hook useAuth
  // Esto verifica la sesión cada 30 segundos y hace logout automático si falla

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Renderizar layout específico según el rol
  if (isMesaDePartes) {
    return <MesaDePartesLayout />;
  }

  if (isEditor) {
    return <EditorLayout />;
  }

  if (isAdmin) {
    return <AdminLayout />;
  }

  // Por defecto, layout genérico para PUBLICO
  return <GenericProtectedLayout />;
}

/**
 * Layout Genérico (temporal para roles sin layout específico)
 */
function GenericProtectedLayout() {
  const { setTheme } = useThemeStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 bg-background px-4 border-b">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">
                  SIGCERH
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
              onClick={() => setOpen(true)}
            >
              <Search className="h-4 w-4 xl:mr-2" />
              <span className="hidden xl:inline-flex text-muted-foreground">Buscar...</span>
              <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="p-0">
                <Command className="rounded-lg border shadow-md">
                  <CommandInput placeholder="Buscar en SIGCERH..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                    <CommandGroup heading="Navegación">
                      <CommandItem onSelect={() => { setOpen(false); window.location.href = '/dashboard'; }}>
                        <Home className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </CommandItem>
                      <CommandItem onSelect={() => setOpen(false)}>
                        <ClipboardList className="mr-2 h-4 w-4" />
                        <span>Solicitudes</span>
                      </CommandItem>
                      <CommandItem onSelect={() => setOpen(false)}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Certificados</span>
                      </CommandItem>
                      <CommandItem onSelect={() => setOpen(false)}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Pagos</span>
                      </CommandItem>
                    </CommandGroup>
                    <CommandGroup heading="Configuración">
                      <CommandItem onSelect={() => setOpen(false)}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                      </CommandItem>
                      <CommandItem onSelect={() => setOpen(false)}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Preferencias</span>
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </DialogContent>
            </Dialog>

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
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
