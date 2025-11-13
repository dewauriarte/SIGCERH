/**
 * Dialog para Validar Pago (Aprobar o Rechazar)
 * Permite aprobar o rechazar pagos con comprobante o efectivo
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/custom/LoadingSpinner';
import { CheckCircle2, XCircle, AlertCircle, Eye, DollarSign } from 'lucide-react';
import { pagoService, type Pago } from '@/services/pago.service';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ValidarPagoDialogProps {
  open: boolean;
  onClose: () => void;
  pago: Pago;
  onSuccess?: () => void;
}

export function ValidarPagoDialog({
  open,
  onClose,
  pago,
  onSuccess,
}: ValidarPagoDialogProps) {
  const queryClient = useQueryClient();
  const [accion, setAccion] = useState<'aprobar' | 'rechazar' | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const validarMutation = useMutation({
    mutationFn: async () => {
      if (accion === 'aprobar') {
        return pagoService.aprobarPago(pago.id, observaciones || undefined);
      } else if (accion === 'rechazar') {
        if (!motivoRechazo.trim()) {
          throw new Error('El motivo de rechazo es obligatorio');
        }
        return pagoService.rechazarPago(pago.id, motivoRechazo, observaciones || undefined);
      }
      throw new Error('Acción no válida');
    },
    onSuccess: () => {
      toast.success(
        accion === 'aprobar' ? '✅ Pago aprobado' : '❌ Pago rechazado',
        {
          description: `El pago ha sido ${accion === 'aprobar' ? 'aprobado' : 'rechazado'} exitosamente`,
        }
      );

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['pagos'] });
      queryClient.invalidateQueries({ queryKey: ['pagos-stats'] });
      queryClient.invalidateQueries({ queryKey: ['mesa-partes-solicitudes'] });

      // Llamar callback de éxito
      onSuccess?.();

      // Limpiar formulario
      setAccion(null);
      setObservaciones('');
      setMotivoRechazo('');
    },
    onError: (error: any) => {
      toast.error('❌ Error al validar pago', {
        description: error.response?.data?.message || error.message || 'No se pudo procesar la validación',
      });
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAprobar = () => {
    setAccion('aprobar');
  };

  const handleRechazar = () => {
    setAccion('rechazar');
  };

  const handleConfirmar = () => {
    if (accion === 'rechazar' && !motivoRechazo.trim()) {
      toast.error('Motivo requerido', {
        description: 'Debe especificar el motivo del rechazo',
      });
      return;
    }

    validarMutation.mutate();
  };

  const handleCancelar = () => {
    if (accion) {
      setAccion(null);
      setObservaciones('');
      setMotivoRechazo('');
    } else {
      onClose();
    }
  };

  const formatFecha = (fecha?: string) => {
    if (!fecha) return 'N/A';
    try {
      return format(new Date(fecha), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return 'N/A';
    }
  };

  const formatMonto = (monto: number) => {
    return `S/ ${monto.toFixed(2)}`;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Validar Pago
          </DialogTitle>
          <DialogDescription>
            Revisa los detalles del pago y decide si aprobarlo o rechazarlo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información del Pago */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20 p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <AlertCircle className="h-4 w-4" />
              Información del Pago
            </h4>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <div className="flex justify-between">
                <span className="font-medium">Código:</span>
                <span className="font-mono">{pago.codigo}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Monto:</span>
                <span className="font-semibold text-lg">{formatMonto(pago.monto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Método:</span>
                <Badge variant="outline">{pagoService.getMetodoPagoLabel(pago.metodoPago)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Estado:</span>
                <Badge variant="outline">{pagoService.getEstadoPagoLabel(pago.estado)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Fecha Creación:</span>
                <span className="font-mono text-xs">{formatFecha(pago.fechaCreacion)}</span>
              </div>
            </div>
          </div>

          {/* Comprobante (si existe) */}
          {pagoService.tieneComprobante(pago) && (
            <div>
              <Label>Comprobante</Label>
              <div className="mt-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Comprobante disponible para revisión
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = pagoService.getComprobanteUrl(pago);
                      if (url) window.open(url, '_blank');
                    }}
                  >
                    Ver Comprobante
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Sin Acción Seleccionada */}
          {!accion && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Seleccione una acción: aprobar o rechazar el pago
              </AlertDescription>
            </Alert>
          )}

          {/* Formulario de Aprobación */}
          {accion === 'aprobar' && (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Está por aprobar este pago. El estado de la solicitud cambiará a "Pago Validado" y continuará el proceso.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="observaciones-aprobar">
                  Observaciones (Opcional)
                </Label>
                <Textarea
                  id="observaciones-aprobar"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Agregar notas sobre la validación..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {observaciones.length}/500 caracteres
                </p>
              </div>
            </div>
          )}

          {/* Formulario de Rechazo */}
          {accion === 'rechazar' && (
            <div className="space-y-4">
              <Alert className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  Está por rechazar este pago. Se notificará al usuario y deberá realizar un nuevo pago.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="motivo-rechazo">
                  Motivo del Rechazo (Requerido) *
                </Label>
                <Textarea
                  id="motivo-rechazo"
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Especifique el motivo del rechazo (ej: comprobante ilegible, monto incorrecto, etc.)..."
                  rows={3}
                  className="resize-none"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {motivoRechazo.length}/500 caracteres (mínimo 10)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones-rechazo">
                  Observaciones Adicionales (Opcional)
                </Label>
                <Textarea
                  id="observaciones-rechazo"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Información adicional..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancelar}
            disabled={validarMutation.isPending}
          >
            {accion ? 'Volver' : 'Cancelar'}
          </Button>

          {!accion && (
            <>
              <Button
                variant="destructive"
                onClick={handleRechazar}
                disabled={validarMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleAprobar}
                disabled={validarMutation.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
            </>
          )}

          {accion && (
            <Button
              variant={accion === 'aprobar' ? 'default' : 'destructive'}
              onClick={handleConfirmar}
              disabled={validarMutation.isPending || (accion === 'rechazar' && motivoRechazo.length < 10)}
            >
              {validarMutation.isPending ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  {accion === 'aprobar' ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirmar Aprobación
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Confirmar Rechazo
                    </>
                  )}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
