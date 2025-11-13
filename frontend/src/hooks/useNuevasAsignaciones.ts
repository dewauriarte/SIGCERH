/**
 * Hook para detectar nuevas asignaciones de expedientes en tiempo real
 *
 * Compara los IDs de expedientes actuales con los previos
 * y muestra notificaciones toast cuando hay nuevas asignaciones.
 */

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { editorService } from '@/services/editor.service';
import { toast } from 'sonner';

interface UseNuevasAsignacionesOptions {
  enabled?: boolean;
  pollInterval?: number;
}

export function useNuevasAsignaciones(options: UseNuevasAsignacionesOptions = {}) {
  const {
    enabled = true,
    pollInterval = 30000, // 30 segundos por defecto
  } = options;

  // Ref para almacenar los IDs previos
  const prevExpedienteIds = useRef<Set<string> | null>(null);

  // Query para obtener expedientes asignados
  const { data: expedientesData } = useQuery({
    queryKey: ['editor-expedientes-nuevos'],
    queryFn: () => editorService.getExpedientesAsignados({ page: 1, limit: 100 }),
    enabled,
    refetchInterval: pollInterval,
    staleTime: pollInterval - 5000,
  });

  // Obtener estadísticas para el badge
  const { data: estadisticas } = useQuery({
    queryKey: ['editor-stats-nuevos'],
    queryFn: () => editorService.getEstadisticas(),
    enabled,
    refetchInterval: pollInterval,
  });

  // Detectar nuevas asignaciones
  useEffect(() => {
    if (!expedientesData?.data || !enabled) return;

    const currentIds = new Set(expedientesData.data.map((exp: any) => exp.id));

    // Primera carga - solo guardar los IDs
    if (prevExpedienteIds.current === null) {
      prevExpedienteIds.current = currentIds;
      return;
    }

    // Detectar nuevos IDs
    const nuevosIds = Array.from(currentIds).filter(
      (id) => !prevExpedienteIds.current!.has(id)
    );

    // Si hay nuevos expedientes, mostrar notificación
    if (nuevosIds.length > 0) {
      const expedientesNuevos = expedientesData.data.filter((exp: any) =>
        nuevosIds.includes(exp.id)
      );

      // Mostrar toast por cada nuevo expediente (máximo 3)
      expedientesNuevos.slice(0, 3).forEach((exp: any) => {
        toast.success('Nueva asignación recibida', {
          description: `Expediente ${exp.numeroExpediente} - ${exp.estudiante.apellidoPaterno}`,
          duration: 5000,
        });
      });

      // Si hay más de 3, mostrar un toast general
      if (expedientesNuevos.length > 3) {
        toast.info(`${expedientesNuevos.length} nuevas asignaciones`, {
          description: 'Revisa la lista de expedientes',
          duration: 5000,
        });
      }
    }

    // Actualizar los IDs previos
    prevExpedienteIds.current = currentIds;
  }, [expedientesData, enabled]);

  return {
    totalAsignados: estadisticas?.data?.expedientesAsignados || 0,
    expedientes: expedientesData?.data || [],
  };
}
