/**
 * Indicador de Actualización en Tiempo Real
 * Muestra el estado de sincronización y nuevos datos disponibles
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RefreshIndicatorProps {
  isRefetching: boolean;
  lastUpdate: Date | null;
  hasNewData?: boolean;
  newCount?: number;
  onRefresh?: () => void;
}

export function RefreshIndicator({
  isRefetching,
  lastUpdate,
  hasNewData = false,
  newCount = 0,
  onRefresh,
}: RefreshIndicatorProps) {
  const getLastUpdateText = () => {
    if (!lastUpdate) return 'Sin actualizar';
    
    try {
      return formatDistanceToNow(lastUpdate, {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return 'Recién actualizado';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Indicador de nuevos datos */}
      {hasNewData && newCount > 0 && (
        <Badge
          variant="default"
          className="bg-green-500 hover:bg-green-600 text-white animate-pulse"
        >
          +{newCount} {newCount === 1 ? 'nuevo' : 'nuevos'}
        </Badge>
      )}

      {/* Estado de sincronización */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isRefetching ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Actualizando...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="hidden sm:inline">{getLastUpdateText()}</span>
          </>
        )}
      </div>

      {/* Botón de refrescar manual (opcional) */}
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefetching}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          <span className="sr-only">Actualizar</span>
        </Button>
      )}
    </div>
  );
}

