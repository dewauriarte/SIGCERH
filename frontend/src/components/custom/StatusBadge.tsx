import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Estados válidos del sistema (13 estados según backend)
 * Basado en backend/src/modules/solicitudes/types.ts
 */
export type StatusType =
  | 'REGISTRADA'
  | 'DERIVADO_A_EDITOR'
  | 'EN_BUSQUEDA'
  | 'ACTA_ENCONTRADA_PENDIENTE_PAGO'
  | 'ACTA_NO_ENCONTRADA'
  | 'PAGO_VALIDADO'
  | 'EN_PROCESAMIENTO_OCR'
  | 'EN_VALIDACION_UGEL'
  | 'OBSERVADO_POR_UGEL'
  | 'EN_REGISTRO_SIAGEC'
  | 'EN_FIRMA_DIRECCION'
  | 'CERTIFICADO_EMITIDO'
  | 'ENTREGADO';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: string; className: string }> = {
  REGISTRADA: {
    label: 'Registrada',
    variant: 'default',
    className: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400',
  },
  DERIVADO_A_EDITOR: {
    label: 'Derivado a Editor',
    variant: 'default',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  },
  EN_BUSQUEDA: {
    label: 'En búsqueda',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  },
  ACTA_ENCONTRADA_PENDIENTE_PAGO: {
    label: 'Pendiente de pago',
    variant: 'default',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  },
  ACTA_NO_ENCONTRADA: {
    label: 'Acta no encontrada',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  },
  PAGO_VALIDADO: {
    label: 'Pago validado',
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  EN_PROCESAMIENTO_OCR: {
    label: 'En procesamiento OCR',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  },
  EN_VALIDACION_UGEL: {
    label: 'En validación UGEL',
    variant: 'default',
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
  },
  OBSERVADO_POR_UGEL: {
    label: 'Observado por UGEL',
    variant: 'destructive',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  EN_REGISTRO_SIAGEC: {
    label: 'En registro SIAGEC',
    variant: 'default',
    className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
  },
  EN_FIRMA_DIRECCION: {
    label: 'En firma dirección',
    variant: 'default',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400',
  },
  CERTIFICADO_EMITIDO: {
    label: 'Certificado emitido',
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  ENTREGADO: {
    label: 'Entregado',
    variant: 'default',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Manejar estados undefined o desconocidos
  if (!status) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'font-medium transition-all duration-200',
          'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
          className
        )}
      >
        Sin estado
      </Badge>
    );
  }

  const config = statusConfig[status] || {
    label: status.replace(/_/g, ' '),
    variant: 'outline',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
  };
  
  return (
    <Badge
      variant={config.variant as any}
      className={cn(
        'font-medium transition-all duration-200',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}

