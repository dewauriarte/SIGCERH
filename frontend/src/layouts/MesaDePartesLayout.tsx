/**
 * Layout Específico para Mesa de Partes
 * Incluye sidebar y topbar personalizados
 */

import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { MesaDePartesSidebar } from '@/components/mesa-partes/MesaDePartesSidebar';
import { MesaDePartesTopbar } from '@/components/mesa-partes/MesaDePartesTopbar';

export default function MesaDePartesLayout() {
  return (
    <SidebarProvider>
      <MesaDePartesSidebar />
      <SidebarInset>
        <MesaDePartesTopbar />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
