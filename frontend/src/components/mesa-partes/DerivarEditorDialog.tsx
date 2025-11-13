/**
 * Dialog para Derivar Solicitud a Editor
 * Permite seleccionar un editor disponible y agregar observaciones
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { UserPlus, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { mesaPartesService, type Solicitud, type Editor } from '@/services/mesa-partes.service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DerivarEditorDialogProps {
  open: boolean;
  onClose: () => void;
  solicitud: Solicitud;
  onSuccess?: () => void;
}

export function DerivarEditorDialog({
  open,
  onClose,
  solicitud,
  onSuccess,
}: DerivarEditorDialogProps) {
  const queryClient = useQueryClient();
  const [editorSeleccionado, setEditorSeleccionado] = useState<string>('');
  const [observaciones, setObservaciones] = useState('');

  // ============================================================================
  // QUERIES
  // ============================================================================

  // Obtener editores disponibles
  const { data: editoresResponse, isLoading: loadingEditores } = useQuery({
    queryKey: ['editores-disponibles'],
    queryFn: () => mesaPartesService.getEditoresDisponibles(),
    enabled: open, // Solo cargar cuando el dialog está abierto
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const derivarMutation = useMutation({
    mutationFn: (data: { editorId?: string; observaciones?: string }) =>
      mesaPartesService.derivarAEditor(solicitud.id, data),
    onSuccess: () => {
      toast.success('✅ Solicitud derivada', {
        description: 'La solicitud ha sido asignada al editor exitosamente',
      });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['mesa-partes-solicitudes'] });
      queryClient.invalidateQueries({ queryKey: ['mesa-partes-stats'] });

      // Llamar callback de éxito
      onSuccess?.();

      // Limpiar formulario
      setEditorSeleccionado('');
      setObservaciones('');
    },
    onError: (error: any) => {
      toast.error('❌ Error al derivar', {
        description: error.response?.data?.message || error.message || 'No se pudo derivar la solicitud',
      });
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDerivar = () => {
    if (!editorSeleccionado) {
      toast.error('Editor requerido', {
        description: 'Debe seleccionar un editor para derivar la solicitud',
      });
      return;
    }

    const data: any = {
      editorId: editorSeleccionado,
    };
    
    if (observaciones && observaciones.trim()) {
      data.observaciones = observaciones.trim();
    }

    derivarMutation.mutate(data);
  };

  const getNombreCompletoEstudiante = () => {
    if (!solicitud.estudiante) return 'N/A';
    const { nombres, apellidoPaterno, apellidoMaterno } = solicitud.estudiante;
    return `${apellidoPaterno} ${apellidoMaterno}, ${nombres}`;
  };

  const getNombreCompletoEditor = (editor: Editor) => {
    return `${editor.nombres || ''} ${editor.apellidos || ''}`.trim();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-background to-muted/20 shrink-0">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">Derivar Solicitud a Editor</DialogTitle>
              <DialogDescription className="mt-1">
                Expediente: <span className="font-mono font-medium">{solicitud.numeroexpediente}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content con scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
          {/* Información de la Solicitud */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Información de la Solicitud</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Estudiante</p>
                <p className="font-medium">{getNombreCompletoEstudiante()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  DNI: <span className="font-mono">{solicitud.estudiante?.numeroDocumento || 'N/A'}</span>
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <Badge variant="secondary" className="font-mono">{solicitud.numeroseguimiento}</Badge>
              </div>
            </div>
          </div>

          {/* Selección de Editor */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <Label htmlFor="editor" className="font-semibold">
                Seleccionar Editor <span className="text-destructive">*</span>
              </Label>
            </div>
            {loadingEditores ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <LoadingSpinner className="mb-3" />
                <p className="text-sm">Cargando editores...</p>
              </div>
            ) : editoresResponse?.data && editoresResponse.data.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                {editoresResponse.data.map((editor) => (
                  <button
                    key={editor.id}
                    type="button"
                    onClick={() => setEditorSeleccionado(editor.id)}
                    className={cn(
                      'w-full text-left rounded-lg border p-3 transition-all',
                      'hover:shadow-md',
                      editorSeleccionado === editor.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-full',
                        editorSeleccionado === editor.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{getNombreCompletoEditor(editor)}</p>
                          {editorSeleccionado === editor.id && (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{editor.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm">
                  No hay editores disponibles. La solicitud quedará pendiente de asignación.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Observaciones */}
          <div className="space-y-3">
            <Label htmlFor="observaciones" className="font-semibold">
              Observaciones (Opcional)
            </Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Solicitud urgente, revisar datos del colegio..."
              rows={3}
              className="resize-none"
              maxLength={500}
            />
            <div className="flex items-center justify-between text-xs">
              <p className="text-muted-foreground">
                {observaciones.length}/500 caracteres
              </p>
            </div>
          </div>

          {/* Mensaje informativo */}
          {!editorSeleccionado && !loadingEditores && editoresResponse?.data && editoresResponse.data.length > 0 && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Debe seleccionar un editor para continuar.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/20 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={derivarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDerivar}
            disabled={derivarMutation.isPending}
            className="min-w-[140px]"
          >
            {derivarMutation.isPending ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Derivando...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Derivar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
