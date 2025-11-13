/**
 * Sidebar Específico para Editor / Oficina de Actas
 * Navegación organizada por fases del flujo de trabajo:
 * 1. Dashboard
 * 2. Expedientes Asignados (búsqueda de actas)
 * 3. Procesamiento OCR
 * 4. Certificados (borradores, enviados, aprobados)
 * 5. Archivo de Actas
 */

import * as React from "react";
import { FileSearch, Badge as BadgeIcon } from "lucide-react";
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
import { navigationEditor } from "@/config/navigation";
import { useQuery } from "@tanstack/react-query";
import { editorService } from "@/services/editor.service";
import { useNuevasAsignaciones } from "@/hooks/useNuevasAsignaciones";

/**
 * Componente EditorSidebar
 * Muestra navegación específica para el rol Editor con contadores en tiempo real
 */
export function EditorSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();

  // ==========================================================================
  // HOOK - Detectar nuevas asignaciones en tiempo real
  // ==========================================================================

  const { totalAsignados } = useNuevasAsignaciones({
    enabled: true,
    pollInterval: 30000, // 30 segundos
  });

  // ==========================================================================
  // QUERIES - Obtener contadores para badges
  // ==========================================================================

  // Certificados observados por UGEL (DESHABILITADO - Fase 7 no implementada)
  const { data: certificadosObservados } = useQuery({
    queryKey: ['editor-certificados-observados-count'],
    queryFn: () => editorService.getCertificadosObservados({ page: 1, limit: 1 }),
    enabled: false, // Deshabilitar hasta implementar Fase 7
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Actas en procesamiento OCR (DESHABILITADO - Fase 5 no implementada)
  const { data: actasOCR } = useQuery({
    queryKey: ['editor-actas-ocr-count'],
    queryFn: () => editorService.getActasEnOCR({ page: 1, limit: 1 }),
    enabled: false, // Deshabilitar hasta implementar Fase 5
    refetchInterval: 30000,
    staleTime: 15000,
  });

  // Borradores listos para enviar a UGEL (DESHABILITADO - Fase 6 no implementada)
  const { data: borradoresListos } = useQuery({
    queryKey: ['editor-borradores-listos-count'],
    queryFn: () => editorService.getBorradoresListos({ page: 1, limit: 1 }),
    enabled: false, // Deshabilitar hasta implementar Fase 6
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // ==========================================================================
  // AGREGAR BADGES A LA NAVEGACIÓN
  // ==========================================================================

  const navItemsConBadges = navigationEditor.map((item) => {
    // Expedientes Asignados - mostrar total de asignados
    if (item.url === '/expedientes') {
      return {
        ...item,
        badge: totalAsignados > 0 ? String(totalAsignados) : undefined,
      };
    }

    // Procesamiento OCR
    if (item.url === '/editor/procesar-ocr') {
      // Obtener cantidad de expedientes en LISTO_PARA_OCR
      // TODO: Agregar query específica si es necesario
      return {
        ...item,
        badge: undefined, // Por ahora sin badge, se puede agregar después
      };
    }

    // Certificados - mostrar borradores listos
    if (item.url === '/certificados') {
      return {
        ...item,
        badge: borradoresListos?.meta.total
          ? String(borradoresListos.meta.total)
          : undefined,
        // Agregar subitems con badges
        items: item.items?.map((subitem) => {
          if (subitem.url === '/certificados/observados') {
            return {
              ...subitem,
              badge: certificadosObservados?.meta.total
                ? String(certificadosObservados.meta.total)
                : undefined,
            };
          }
          return subitem;
        }),
      };
    }

    return item;
  });

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
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-600 text-white">
                  <FileSearch className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Oficina de Actas</span>
                  <span className="truncate text-xs">Editor</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Badge de rol */}
        <div className="px-3 py-2">
          <Badge variant="outline" className="w-full justify-center bg-orange-50 text-orange-700 border-orange-300">
            <BadgeIcon className="mr-1 h-3 w-3" />
            Editor / Oficina de Actas
          </Badge>
        </div>
      </SidebarHeader>

      {/* Contenido - Navegación principal */}
      <SidebarContent>
        <NavMain items={navItemsConBadges} />
      </SidebarContent>

      {/* Footer - Usuario */}
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
