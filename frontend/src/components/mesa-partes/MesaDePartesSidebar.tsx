/**
 * Sidebar Específico para Mesa de Partes
 * Navegación y accesos directos personalizados
 */

import * as React from "react";
import { Package, Badge as BadgeIcon } from "lucide-react";
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
import { navigationMesaDePartes } from "@/config/navigation";
import { useQuery } from "@tanstack/react-query";
import { mesaPartesService } from "@/services/mesa-partes.service";
import { pagoService } from "@/services/pago.service";

export function MesaDePartesSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();

  // Obtener contadores para badges
  const { data: solicitudesPendientes } = useQuery({
    queryKey: ['mesa-partes-solicitudes-count'],
    queryFn: () => mesaPartesService.getPendientesDerivacion({ page: 1, limit: 1 }),
    refetchInterval: 3 * 60 * 1000, // 3 minutos
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const { data: pagosStats } = useQuery({
    queryKey: ['pagos-stats-sidebar'],
    queryFn: () => pagoService.getEstadisticas(),
    refetchInterval: 3 * 60 * 1000, // 3 minutos
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const { data: certificadosListos } = useQuery({
    queryKey: ['listas-entrega-count'],
    queryFn: () => mesaPartesService.getListasEntrega({ page: 1, limit: 1 }),
    refetchInterval: 3 * 60 * 1000, // 3 minutos
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Agregar badges a los items de navegación
  const navItemsConBadges = navigationMesaDePartes.map((item) => {
    if (item.url === '/solicitudes') {
      return {
        ...item,
        badge: solicitudesPendientes?.meta.total ? String(solicitudesPendientes.meta.total) : undefined,
      };
    }
    if (item.url === '/pagos') {
      return {
        ...item,
        badge: pagosStats?.pendientesValidacion ? String(pagosStats.pendientesValidacion) : undefined,
      };
    }
    if (item.url === '/entregas') {
      return {
        ...item,
        badge: certificadosListos?.meta.total ? String(certificadosListos.meta.total) : undefined,
      };
    }
    return item;
  });

  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Package className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Mesa de Partes</span>
                  <span className="truncate text-xs">SIGCERH</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Badge de rol */}
        <div className="px-3 py-2">
          <Badge variant="outline" className="w-full justify-center">
            <BadgeIcon className="mr-1 h-3 w-3" />
            Mesa de Partes
          </Badge>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItemsConBadges} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
