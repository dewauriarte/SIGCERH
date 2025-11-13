/**
 * Componente: Diálogo para eliminar un nivel educativo
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nivelEducativoService, type NivelEducativo } from '@/services/nivel-educativo.service';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, Info } from 'lucide-react';

interface NivelEducativoDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nivel: NivelEducativo | null;
}

export function NivelEducativoDeleteDialog({ open, onOpenChange, nivel }: NivelEducativoDeleteDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => nivelEducativoService.deleteNivelEducativo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niveles-educativos'] });
      toast.success('Nivel educativo eliminado exitosamente');
      onOpenChange(false);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Error al eliminar nivel educativo';
      
      // Mensaje más específico si hay datos relacionados
      if (errorMessage.includes('grado') || errorMessage.includes('relacionado')) {
        toast.error('No se puede eliminar el nivel', {
          description: 'Este nivel tiene grados asociados. Elimine primero los grados o reasígnelos a otro nivel.',
          duration: 5000,
        });
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const handleDelete = () => {
    if (!nivel) return;
    deleteMutation.mutate(nivel.id);
  };

  if (!nivel) return null;

  const tieneGrados = nivel._count && nivel._count.grado > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Nivel Educativo
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Información del nivel */}
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Nivel a eliminar:</p>
                <p className="font-semibold text-lg">{nivel.nombre}</p>
                <p className="font-mono text-sm text-muted-foreground">{nivel.codigo}</p>
              </div>

              {/* Advertencia si tiene grados */}
              {tieneGrados ? (
                <div className="rounded-lg border-2 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <p className="font-semibold text-red-900 dark:text-red-100">
                        ⚠️ No se puede eliminar este nivel
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        Este nivel tiene{' '}
                        <Badge variant="destructive" className="mx-1">
                          {nivel._count.grado} grado{nivel._count.grado !== 1 ? 's' : ''}
                        </Badge>{' '}
                        asociado{nivel._count.grado !== 1 ? 's' : ''}.
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Para eliminarlo, primero debe:
                      </p>
                      <ul className="text-sm text-red-700 dark:text-red-300 list-none space-y-1 ml-2">
                        <li>• Eliminar todos los grados asociados, o</li>
                        <li>• Reasignar los grados a otro nivel educativo</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                        Confirmación necesaria
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        ¿Está seguro que desea eliminar este nivel educativo? Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending || tieneGrados}
          >
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tieneGrados ? 'No se puede eliminar' : 'Eliminar'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

