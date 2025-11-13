/**
 * Dialog de Búsqueda de Acta - Editor
 *
 * Permite al editor registrar el resultado de la búsqueda del acta física:
 * - Acta Encontrada: requiere ubicación física
 * - Acta No Encontrada: requiere motivo
 *
 * Ambas opciones permiten observaciones adicionales.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  XCircle,
  MapPin,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { editorService, type ExpedienteAsignado } from '@/services/editor.service';
import { toast } from 'sonner';

interface BuscarActaDialogProps {
  open: boolean;
  onClose: () => void;
  expediente: ExpedienteAsignado;
}

type Accion = 'encontrada' | 'no_encontrada' | null;

export function BuscarActaDialog({
  open,
  onClose,
  expediente,
}: BuscarActaDialogProps) {
  // ============================================================================
  // ESTADO LOCAL
  // ============================================================================

  const [accion, setAccion] = useState<Accion>(null);
  const [ubicacionFisica, setUbicacionFisica] = useState('');
  const [motivoNoEncontrada, setMotivoNoEncontrada] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const queryClient = useQueryClient();

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const actaEncontradaMutation = useMutation({
    mutationFn: async () => {
      if (!ubicacionFisica.trim()) {
        throw new Error('La ubicación física es obligatoria');
      }

      return editorService.marcarActaEncontrada(expediente.id, {
        ubicacionFisica: ubicacionFisica.trim(),
        observaciones: observaciones.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Acta marcada como encontrada correctamente');
      queryClient.invalidateQueries({ queryKey: ['editor-expedientes-asignados'] });
      queryClient.invalidateQueries({ queryKey: ['editor-stats-expedientes'] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al marcar acta como encontrada');
    },
  });

  const actaNoEncontradaMutation = useMutation({
    mutationFn: async () => {
      if (!motivoNoEncontrada.trim()) {
        throw new Error('El motivo es obligatorio');
      }

      if (motivoNoEncontrada.trim().length < 10) {
        throw new Error('El motivo debe tener al menos 10 caracteres');
      }

      return editorService.marcarActaNoEncontrada(expediente.id, {
        motivoNoEncontrada: motivoNoEncontrada.trim(),
        observaciones: observaciones.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Acta marcada como no encontrada');
      queryClient.invalidateQueries({ queryKey: ['editor-expedientes-asignados'] });
      queryClient.invalidateQueries({ queryKey: ['editor-stats-expedientes'] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al marcar acta como no encontrada');
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleClose = () => {
    setAccion(null);
    setUbicacionFisica('');
    setMotivoNoEncontrada('');
    setObservaciones('');
    onClose();
  };

  const handleSubmit = async () => {
    if (accion === 'encontrada') {
      await actaEncontradaMutation.mutateAsync();
    } else if (accion === 'no_encontrada') {
      await actaNoEncontradaMutation.mutateAsync();
    }
  };

  const isLoading = actaEncontradaMutation.isPending || actaNoEncontradaMutation.isPending;

  // ============================================================================
  // RENDER - SELECCIÓN DE ACCIÓN
  // ============================================================================

  if (accion === null) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Resultado de Búsqueda
            </DialogTitle>
            <DialogDescription>
              Expediente: {expediente.numeroExpediente}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Selecciona el resultado de tu búsqueda del acta física para el estudiante{' '}
                <strong>
                  {expediente.estudiante.apellidoPaterno} {expediente.estudiante.apellidoMaterno},{' '}
                  {expediente.estudiante.nombres}
                </strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-3 pt-4">
              <Button
                variant="outline"
                className="w-full h-auto p-4 flex items-start gap-3 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                onClick={() => setAccion('encontrada')}
              >
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-left flex-1">
                  <p className="font-semibold">Acta Encontrada</p>
                  <p className="text-xs text-muted-foreground">
                    El acta física fue localizada en el archivo
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto p-4 flex items-start gap-3 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => setAccion('no_encontrada')}
              >
                <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-left flex-1">
                  <p className="font-semibold">Acta No Encontrada</p>
                  <p className="text-xs text-muted-foreground">
                    El acta no pudo ser localizada después de la búsqueda
                  </p>
                </div>
              </Button>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ============================================================================
  // RENDER - FORMULARIO ACTA ENCONTRADA
  // ============================================================================

  if (accion === 'encontrada') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Acta Encontrada
            </DialogTitle>
            <DialogDescription>
              Registra la ubicación física del acta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                El acta de{' '}
                <strong>
                  {expediente.estudiante.apellidoPaterno} {expediente.estudiante.apellidoMaterno}
                </strong>{' '}
                ha sido encontrada
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="ubicacion" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicación Física <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ubicacion"
                value={ubicacionFisica}
                onChange={(e) => setUbicacionFisica(e.target.value)}
                placeholder="Ej: Estante 3, Nivel 2, Caja 15"
                disabled={isLoading}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Especifica dónde se encuentra el acta física en el archivo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones (opcional)</Label>
              <Textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas adicionales sobre el estado del acta, condición del documento, etc."
                rows={3}
                disabled={isLoading}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {observaciones.length}/500
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setAccion(null)}
                disabled={isLoading}
              >
                Atrás
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!ubicacionFisica.trim() || isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Guardando...' : 'Confirmar Acta Encontrada'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ============================================================================
  // RENDER - FORMULARIO ACTA NO ENCONTRADA
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Acta No Encontrada
          </DialogTitle>
          <DialogDescription>
            Especifica el motivo por el cual no se encontró el acta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              El acta de{' '}
              <strong>
                {expediente.estudiante.apellidoPaterno} {expediente.estudiante.apellidoMaterno}
              </strong>{' '}
              no fue encontrada
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motivo"
              value={motivoNoEncontrada}
              onChange={(e) => setMotivoNoEncontrada(e.target.value)}
              placeholder="Describe detalladamente el motivo: acta extraviada, archivo incompleto, año no disponible, etc."
              rows={4}
              disabled={isLoading}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 10 caracteres · {motivoNoEncontrada.length}/500
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones-no">Observaciones (opcional)</Label>
            <Textarea
              id="observaciones-no"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Información adicional sobre la búsqueda realizada"
              rows={3}
              disabled={isLoading}
              maxLength={500}
            />
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Este expediente será marcado como "No Encontrado" y se notificará al solicitante.
              El motivo debe ser claro y específico.
            </AlertDescription>
          </Alert>

          <Separator />

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setAccion(null)}
              disabled={isLoading}
            >
              Atrás
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={motivoNoEncontrada.trim().length < 10 || isLoading}
                variant="destructive"
              >
                {isLoading ? 'Guardando...' : 'Confirmar No Encontrada'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
