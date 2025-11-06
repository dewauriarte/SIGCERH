import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType =
  | 'EN_BUSQUEDA'
  | 'DERIVADO_A_EDITOR'
  | 'ACTA_ENCONTRADA'
  | 'ACTA_NO_ENCONTRADA'
  | 'PENDIENTE_PAGO'
  | 'PAGO_VALIDADO'
  | 'EN_PROCESAMIENTO'
  | 'EN_VALIDACION_UGEL'
  | 'APROBADO_UGEL'
  | 'OBSERVADO_UGEL'
  | 'EN_SIAGEC'
  | 'OBSERVADO_SIAGEC'
  | 'EN_FIRMA_FINAL'
  | 'CERTIFICADO_EMITIDO'
  | 'OBSERVADO_DIRECCION'
  | 'ENTREGADO'
  | 'RECHAZADO';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: string; className: string }> = {
  EN_BUSQUEDA: {
    label: 'En búsqueda',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  },
  DERIVADO_A_EDITOR: {
    label: 'Derivado a Editor',
    variant: 'default',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  },
  ACTA_ENCONTRADA: {
    label: 'Acta encontrada',
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  ACTA_NO_ENCONTRADA: {
    label: 'Acta no encontrada',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  },
  PENDIENTE_PAGO: {
    label: 'Pendiente de pago',
    variant: 'default',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  },
  PAGO_VALIDADO: {
    label: 'Pago validado',
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  EN_PROCESAMIENTO: {
    label: 'En procesamiento',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  },
  EN_VALIDACION_UGEL: {
    label: 'En validación UGEL',
    variant: 'default',
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
  },
  APROBADO_UGEL: {
    label: 'Aprobado por UGEL',
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  OBSERVADO_UGEL: {
    label: 'Observado por UGEL',
    variant: 'destructive',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  EN_SIAGEC: {
    label: 'En SIAGEC',
    variant: 'default',
    className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
  },
  OBSERVADO_SIAGEC: {
    label: 'Observado por SIAGEC',
    variant: 'destructive',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  EN_FIRMA_FINAL: {
    label: 'En firma final',
    variant: 'default',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400',
  },
  CERTIFICADO_EMITIDO: {
    label: 'Certificado emitido',
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  OBSERVADO_DIRECCION: {
    label: 'Observado por Dirección',
    variant: 'destructive',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  ENTREGADO: {
    label: 'Entregado',
    variant: 'default',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
  RECHAZADO: {
    label: 'Rechazado',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
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

