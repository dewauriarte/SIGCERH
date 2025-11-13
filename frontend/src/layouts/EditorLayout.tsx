/**
 * Layout Específico para Editor / Oficina de Actas
 *
 * Combina componentes personalizados:
 * - EditorSidebar: Navegación por fases del flujo
 * - EditorTopbar: Acciones rápidas y notificaciones
 * - Outlet: Renderiza las páginas hijas
 *
 * Características:
 * - Sidebar colapsable
 * - Topbar con breadcrumbs dinámicos
 * - Notificaciones en tiempo real
 * - Búsqueda contextual
 */

import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { EditorTopbar } from '@/components/editor/EditorTopbar';

/**
 * Componente EditorLayout
 * Layout principal para el rol Editor
 */
export default function EditorLayout() {
  return (
    <SidebarProvider>
      {/* Sidebar con navegación específica del Editor */}
      <EditorSidebar />

      {/* Área principal de contenido */}
      <SidebarInset>
        {/* Topbar con acciones rápidas y notificaciones */}
        <EditorTopbar />

        {/* Contenido de la página actual */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
