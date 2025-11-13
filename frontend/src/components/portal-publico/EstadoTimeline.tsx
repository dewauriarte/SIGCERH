import type { EstadoSolicitud } from '@/services/solicitud.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  CheckCircle2,
  XCircle,
  CreditCard,
  FileCheck,
  AlertTriangle,
  Clock,
  Download,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EstadoTimelineProps {
  estadoActual: EstadoSolicitud;
  actaEncontrada?: boolean;
  observaciones?: string;
  pago?: {
    id: string;
    numeroOrden: string;
    monto: number;
    metodoPago: string;
    estado: string;
    fechaPago?: Date | string;
    numeroRecibo?: string;
    urlComprobante?: string;
  } | null;
  onPagar?: () => void;
  onDescargar?: () => void;
}

// Configuración de estados con mensajes y estilos
const ESTADOS_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    mensaje: string;
    actionLabel?: string;
  }
> = {
  REGISTRADA: {
    label: 'Registrada',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    mensaje: 'Su solicitud ha sido registrada. Pronto iniciará el proceso de búsqueda del acta.',
  },
  DERIVADO_A_EDITOR: {
    label: 'En Proceso',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    mensaje: 'Su solicitud ha sido asignada a nuestro equipo de búsqueda. Iniciaremos la localización del acta en breve.',
  },
  EN_BUSQUEDA: {
    label: 'En Búsqueda',
    icon: Search,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    mensaje:
      'Nuestro equipo está localizando su acta en los archivos históricos. Tiempo estimado: 3-5 días hábiles.',
  },
  ACTA_ENCONTRADA_PENDIENTE_PAGO: {
    label: 'Acta Encontrada - Pendiente de Pago',
    icon: CreditCard,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    mensaje:
      '¡BUENAS NOTICIAS! Encontramos su acta en nuestro archivo. Para continuar con la emisión del certificado, realice el pago de S/ 15.00.',
    actionLabel: 'Ir a Pagar',
  },
  ACTA_NO_ENCONTRADA: {
    label: 'Acta No Encontrada',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    mensaje:
      'No pudimos localizar el acta con los datos proporcionados. Posibles causas: nombre del colegio incorrecto, años no coinciden, o acta en reorganización. No se realizó ningún cobro.',
  },
  LISTO_PARA_OCR: {
    label: 'Pago Validado',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    mensaje: '¡Pago confirmado! Su acta está lista para ser digitalizada. El certificado estará disponible en 5-7 días hábiles.',
  },
  PAGO_VALIDADO: {
    label: 'Pago Validado',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    mensaje: '¡Pago confirmado! Su certificado está siendo procesado. Tiempo estimado: 5-7 días hábiles.',
  },
  EN_PROCESAMIENTO_OCR: {
    label: 'En Procesamiento',
    icon: FileCheck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    mensaje: 'Su acta está siendo digitalizada y procesada. Nuestro equipo está preparando su certificado.',
  },
  CERTIFICADO_EMITIDO: {
    label: 'Certificado Emitido',
    icon: Check,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    mensaje:
      '🎉 ¡Su trámite ha finalizado exitosamente! Su certificado digital está listo con firma electrónica y código QR de verificación.',
    actionLabel: 'Descargar Certificado',
  },
  ENTREGADO: {
    label: 'Entregado',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    mensaje: 'Certificado entregado y proceso completado.',
  },
  RECHAZADO: {
    label: 'Rechazado',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    mensaje: 'La solicitud ha sido rechazada.',
  },
  CANCELADO: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    mensaje: 'La solicitud ha sido cancelada.',
  },
};

// Orden lógico de estados para el timeline (simplificado)
const FLUJO_NORMAL = [
  'REGISTRADA',
  'DERIVADO_A_EDITOR',
  'EN_BUSQUEDA',
  'ACTA_ENCONTRADA_PENDIENTE_PAGO',
  'LISTO_PARA_OCR', // Estado después de pago validado
  'EN_PROCESAMIENTO_OCR',
  'CERTIFICADO_EMITIDO',
  'ENTREGADO',
] as EstadoSolicitud[];

export function EstadoTimeline({
  estadoActual,
  observaciones,
  pago,
  onPagar,
  onDescargar,
}: EstadoTimelineProps) {
  // Validación: si el estado no existe, usar uno por defecto
  const config = ESTADOS_CONFIG[estadoActual] || ESTADOS_CONFIG['EN_BUSQUEDA'];
  const Icon = config.icon;

  // Mostrar TODOS los estados
  const getEstadosTimeline = () => {
    // Si acta no encontrada
    if (estadoActual === 'ACTA_NO_ENCONTRADA') {
      return ['REGISTRADA', 'EN_BUSQUEDA', 'ACTA_NO_ENCONTRADA'];
    }

    // Si está rechazado o cancelado
    if (estadoActual === 'RECHAZADO' || estadoActual === 'CANCELADO') {
      return ['REGISTRADA', 'EN_BUSQUEDA', estadoActual];
    }

    // Flujo normal - MOSTRAR TODOS
    return FLUJO_NORMAL;
  };

  const estadosTimeline = getEstadosTimeline();

  const isEstadoCompleted = (estado: string) => {
    const currentIndex = FLUJO_NORMAL.indexOf(estadoActual);
    const estadoIndex = FLUJO_NORMAL.indexOf(estado as EstadoSolicitud);
    return estadoIndex < currentIndex;
  };

  const isEstadoActual = (estado: string) => {
    return estado === estadoActual;
  };

  return (
    <div className="space-y-6">
      {/* Card principal con estado actual */}
      <Card className={cn('border-2', config.bgColor)}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full',
                config.bgColor
              )}
            >
              <Icon className={cn('h-6 w-6', config.color)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{config.label}</h3>
                <Badge variant="outline" className={cn('', config.color)}>
                  Estado Actual
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{config.mensaje}</p>

              {/* Observaciones si existen */}
              {observaciones && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Observaciones:</strong> {observaciones}
                  </p>
                </div>
              )}

              {/* Información del pago si existe */}
              {pago && (
                <div className="mt-4 p-4 rounded-lg border bg-muted/50">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Estado del Pago
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Orden:</span>
                      <span className="ml-2 font-mono font-medium">{pago.numeroOrden}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Monto:</span>
                      <span className="ml-2 font-semibold">S/ {pago.monto.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Método:</span>
                      <span className="ml-2">{pago.metodoPago}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estado:</span>
                      <Badge 
                        className="ml-2" 
                        variant={pago.estado === 'VALIDADO' ? 'default' : pago.estado === 'PENDIENTE' ? 'secondary' : 'destructive'}
                      >
                        {pago.estado}
                      </Badge>
                    </div>
                  </div>
                  {pago.estado === 'PAGADO' && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pago registrado - Validación en proceso (24-48 horas)
                    </div>
                  )}
                </div>
              )}

              {/* Botones de acción */}
              {config.actionLabel && (
                <div className="mt-4">
                  {estadoActual === 'ACTA_ENCONTRADA_PENDIENTE_PAGO' && onPagar && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Métodos de pago disponibles:</p>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={onPagar}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pagar con Yape/Plin
                        </Button>
                        <Button variant="outline" onClick={onPagar}>
                          Pagar con Tarjeta
                        </Button>
                        <Button variant="outline" onClick={onPagar}>
                          Pagar en Efectivo
                        </Button>
                      </div>
                    </div>
                  )}

                  {estadoActual === 'CERTIFICADO_EMITIDO' && onDescargar && (
                    <Button onClick={onDescargar} size="lg">
                      <Download className="mr-2 h-5 w-5" />
                      {config.actionLabel}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline vertical con TODOS los estados */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Progreso del Trámite</h3>
          <div className="space-y-2">
            {estadosTimeline.map((estado, index) => {
              const estadoConfig = ESTADOS_CONFIG[estado] || ESTADOS_CONFIG['EN_BUSQUEDA'];
              const EstadoIcon = estadoConfig.icon;
              const completed = isEstadoCompleted(estado);
              const current = isEstadoActual(estado);
              const pending = !completed && !current;

              return (
                <div key={estado} className="relative">
                  {/* Línea conectora */}
                  {index < estadosTimeline.length - 1 && (
                    <div
                      className={cn(
                        'absolute left-5 top-10 h-8 w-0.5',
                        completed ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'
                      )}
                    />
                  )}

                  {/* Estado */}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2',
                        completed && 'bg-green-600 border-green-600',
                        current && cn(estadoConfig.bgColor, 'border-current'),
                        pending && 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                      )}
                    >
                      {completed ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <EstadoIcon
                          className={cn(
                            'h-5 w-5',
                            current && estadoConfig.color,
                            pending && 'text-gray-400 dark:text-gray-600'
                          )}
                        />
                      )}
                    </div>

                    <div className="flex-1 pb-6">
                      <p
                        className={cn(
                          'font-medium',
                          current && 'text-foreground',
                          completed && 'text-green-600',
                          pending && 'text-muted-foreground'
                        )}
                      >
                        {estadoConfig.label}
                      </p>
                      {current && (
                        <p className="text-sm text-muted-foreground mt-1">{estadoConfig.mensaje}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
