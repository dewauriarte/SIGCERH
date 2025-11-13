/**
 * Hook personalizado para detectar cambios en tiempo real
 * Compara data actual con versión anterior para detectar nuevos registros
 */

import { useEffect, useRef, useState } from 'react';

interface UseRealtimeUpdatesOptions<T> {
  data: T[] | undefined;
  isRefetching: boolean;
  getItemId: (item: T) => string;
}

interface RealtimeUpdateResult {
  hasNewData: boolean;
  newCount: number;
  lastUpdate: Date | null;
  isRefetching: boolean;
}

export function useRealtimeUpdates<T>({
  data,
  isRefetching,
  getItemId,
}: UseRealtimeUpdatesOptions<T>): RealtimeUpdateResult {
  const previousDataRef = useRef<T[]>([]);
  const [hasNewData, setHasNewData] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      return;
    }

    // Si es la primera carga, simplemente guardar los datos
    if (previousDataRef.current.length === 0) {
      previousDataRef.current = data;
      setLastUpdate(new Date());
      return;
    }

    // Comparar IDs de items actuales con anteriores
    const previousIds = new Set(previousDataRef.current.map(getItemId));
    const currentIds = new Set(data.map(getItemId));

    // Detectar nuevos items que no estaban antes
    const newItems = data.filter((item) => !previousIds.has(getItemId(item)));

    if (newItems.length > 0) {
      setHasNewData(true);
      setNewCount(newItems.length);
      setLastUpdate(new Date());

      // Auto-reset después de 5 segundos
      setTimeout(() => {
        setHasNewData(false);
        setNewCount(0);
      }, 5000);
    } else {
      // Si no hay nuevos items pero hubo actualización, solo actualizar el timestamp
      if (previousDataRef.current.length !== data.length) {
        setLastUpdate(new Date());
      }
    }

    // Actualizar referencia con los datos actuales
    previousDataRef.current = data;
  }, [data, getItemId]);

  return {
    hasNewData,
    newCount,
    lastUpdate,
    isRefetching,
  };
}

