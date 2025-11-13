/**
 * Dialog para Confirmar Entrega de Certificado
 * Registra la entrega física de un certificado
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/custom/LoadingSpinner';
import { CheckCircle2, AlertCircle, User, IdCard, Package } from 'lucide-react';
import { mesaPartesService, type Solicitud } from '@/services/mesa-partes.service';
import { toast } from 'sonner';

interface ConfirmarEntregaDialogProps {
  open: boolean;
  onClose: () => void;
  solicitud: Solicitud;
  onSuccess?: () => void;
}

export function ConfirmarEntregaDialog({
  open,
  onClose,
  solicitud,
  onSuccess,
}: ConfirmarEntregaDialogProps) {
  const queryClient = useQueryClient();
  const [dniReceptor, setDniReceptor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [confirmado, setConfirmado] = useState(false);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const entregarMutation = useMutation({
    mutationFn: async () => {
      // Validaciones
      if (!dniReceptor.trim() || dniReceptor.length !== 8) {
        throw new Error('El DNI debe tener 8 dígitos');
      }

      if (!confirmado) {
        throw new Error('Debe confirmar la entrega');
      }

      return mesaPartesService.marcarEntregado(solicitud.id, {
        tipoEntrega: 'FISICA',
        dniReceptor,
        firmaRecepcion: undefined, // Podría implementarse con canvas
        observaciones: observaciones || undefined,
      });
    },
    onSuccess: () => {
      toast.success('✅ Entrega confirmada', {
        description: 'El certificado ha sido marcado como entregado exitosamente',
      });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['listas-entrega'] });
      queryClient.invalidateQueries({ queryKey: ['certificados-entregados'] });
      queryClient.invalidateQueries({ queryKey: ['mesa-partes-solicitudes'] });

      // Descargar constancia automáticamente
      toast.info('📄 Descargando constancia de entrega...', {
        description: 'La constancia se descargará automáticamente',
      });

      setTimeout(() => {
        mesaPartesService.descargarConstanciaEntrega(solicitud.id);
      }, 1000);

      // Llamar callback de éxito
      onSuccess?.();

      // Limpiar formulario
      setDniReceptor('');
      setObservaciones('');
      setConfirmado(false);
    },
    onError: (error: any) => {
      toast.error('❌ Error al confirmar entrega', {
        description: error.response?.data?.message || error.message || 'No se pudo registrar la entrega',
      });
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleConfirmar = () => {
    entregarMutation.mutate();
  };

  const getNombreCompleto = () => {
    if (!solicitud.estudiante) return 'N/A';
    const { nombres, apellidoPaterno, apellidoMaterno } = solicitud.estudiante;
    return `${apellidoPaterno} ${apellidoMaterno}, ${nombres}`;
  };

  const handleDniChange = (value: string) => {
    // Solo números, máximo 8 dígitos
    const cleaned = value.replace(/\D/g, '').slice(0, 8);
    setDniReceptor(cleaned);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Confirmar Entrega de Certificado
          </DialogTitle>
          <DialogDescription>
            Registre la entrega física del certificado y los datos del receptor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información del Certificado */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20 p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <AlertCircle className="h-4 w-4" />
              Información del Certificado
            </h4>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <div className="flex justify-between">
                <span className="font-medium">Expediente:</span>
                <span className="font-mono">{solicitud.numeroexpediente}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Estudiante:</span>
                <span>{getNombreCompleto()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">DNI Estudiante:</span>
                <span className="font-mono">{solicitud.estudiante?.numeroDocumento || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Código Certificado:</span>
                <span className="font-mono text-xs">{solicitud.certificado?.codigoVerificacion || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* DNI del Receptor */}
          <div className="space-y-2">
            <Label htmlFor="dni-receptor">
              DNI del Receptor *
            </Label>
            <div className="flex gap-2">
              <IdCard className="h-4 w-4 text-muted-foreground mt-3" />
              <Input
                id="dni-receptor"
                value={dniReceptor}
                onChange={(e) => handleDniChange(e.target.value)}
                placeholder="12345678"
                className="flex-1 font-mono"
                maxLength={8}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {dniReceptor === solicitud.estudiante?.numeroDocumento
                ? '✓ DNI coincide con el estudiante'
                : 'DNI de la persona que recoge el certificado'}
            </p>
            {dniReceptor.length === 8 && dniReceptor !== solicitud.estudiante?.numeroDocumento && (
              <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  El DNI del receptor no coincide con el estudiante. Asegúrese de que tiene autorización para recoger el certificado.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">
              Observaciones (Opcional)
            </Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Información adicional sobre la entrega (ej: parentesco del receptor, hora, etc.)..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {observaciones.length}/500 caracteres
            </p>
          </div>

          {/* Confirmación */}
          <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20 p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="confirmar-entrega"
                checked={confirmado}
                onChange={(e) => setConfirmado(e.target.checked)}
                className="mt-1"
              />
              <div>
                <label
                  htmlFor="confirmar-entrega"
                  className="text-sm font-medium text-green-900 dark:text-green-100 cursor-pointer"
                >
                  Confirmo que he entregado físicamente el certificado
                </label>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Al marcar esta casilla, confirmo que el certificado fue entregado personalmente al receptor identificado con el DNI indicado arriba.
                </p>
              </div>
            </div>
          </div>

          {/* Alerta de Acción */}
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              Esta acción marcará la solicitud como <strong>ENTREGADO</strong> y completará el proceso. Esta acción no se puede deshacer.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={entregarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={
              entregarMutation.isPending ||
              !dniReceptor ||
              dniReceptor.length !== 8 ||
              !confirmado
            }
            className="bg-green-600 hover:bg-green-700"
          >
            {entregarMutation.isPending ? (
              <>
                <LoadingSpinner className="mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmar Entrega
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
