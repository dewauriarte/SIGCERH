/**
 * Layout Específico para Administrador
 *
 * Combina componentes personalizados:
 * - AdminSidebar: Navegación de gestión del sistema
 * - AdminTopbar: Acciones rápidas y notificaciones
 * - Outlet: Renderiza las páginas hijas
 *
 * Características:
 * - Sidebar colapsable
 * - Topbar con breadcrumbs dinámicos
 * - Notificaciones en tiempo real
 * - Gestión completa del sistema
 */

import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';

/**
 * Componente AdminLayout
 * Layout principal para el rol ADMIN
 */
export default function AdminLayout() {
  return (
    <SidebarProvider>
      {/* Sidebar con navegación específica de Admin */}
      <AdminSidebar />

      {/* Área principal de contenido */}
      <SidebarInset>
        {/* Topbar con acciones rápidas y notificaciones */}
        <AdminTopbar />

        {/* Contenido de la página actual */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

