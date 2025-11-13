/**
 * Sidebar Específico para Administrador
 * Navegación organizada para gestión completa del sistema
 */

import * as React from "react";
import { Shield, Badge as BadgeIcon } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";
import { navigationAdmin } from "@/config/navigation";

/**
 * Componente AdminSidebar
 * Muestra navegación específica para el rol Administrador
 */
export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      {/* Header con logo y título */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-purple-600 text-white">
                  <Shield className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">SIGCERH Admin</span>
                  <span className="truncate text-xs">Administración</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Badge de rol */}
        <div className="px-3 py-2">
          <Badge variant="outline" className="w-full justify-center bg-purple-50 text-purple-700 border-purple-300">
            <BadgeIcon className="mr-1 h-3 w-3" />
            Administrador
          </Badge>
        </div>
      </SidebarHeader>

      {/* Contenido - Navegación principal */}
      <SidebarContent>
        <NavMain items={navigationAdmin} />
      </SidebarContent>

      {/* Footer - Usuario */}
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

