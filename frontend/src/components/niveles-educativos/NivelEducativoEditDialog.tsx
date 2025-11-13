/**
 * Componente: Diálogo para editar un nivel educativo existente
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  nivelEducativoService,
  type NivelEducativo,
  type CreateNivelEducativoDTO,
} from '@/services/nivel-educativo.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface NivelEducativoEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nivel: NivelEducativo | null;
}

export function NivelEducativoEditDialog({ open, onOpenChange, nivel }: NivelEducativoEditDialogProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    activo: true,
  });

  useEffect(() => {
    if (nivel) {
      setFormData({
        codigo: nivel.codigo,
        nombre: nivel.nombre,
        descripcion: nivel.descripcion || '',
        activo: nivel.activo,
      });
    }
  }, [nivel]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateNivelEducativoDTO> }) =>
      nivelEducativoService.updateNivelEducativo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niveles-educativos'] });
      toast.success('Nivel educativo actualizado exitosamente');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar nivel educativo');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nivel) return;

    // Validaciones
    if (!formData.codigo.trim()) {
      toast.error('El código es obligatorio');
      return;
    }
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const data: Partial<CreateNivelEducativoDTO> = {
      codigo: formData.codigo.toUpperCase().trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || undefined,
      activo: formData.activo,
    };

    updateMutation.mutate({ id: nivel.id, data });
  };

  if (!nivel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Nivel Educativo</DialogTitle>
          <DialogDescription>
            Modifique los datos del nivel educativo. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Código */}
            <div className="space-y-2">
              <Label htmlFor="edit-codigo">
                Código <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                placeholder="Ej: PRIMARIA, SECUNDARIA"
                maxLength={20}
                className="font-mono"
                required
              />
              <p className="text-xs text-muted-foreground">
                Solo mayúsculas, números y guiones bajos
              </p>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Educación Primaria"
                required
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="edit-descripcion">Descripción</Label>
              <Textarea
                id="edit-descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional del nivel educativo"
                rows={3}
              />
            </div>

            {/* Activo */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="edit-activo">Estado</Label>
                <p className="text-xs text-muted-foreground">
                  {formData.activo ? 'El nivel estará disponible para su uso' : 'El nivel no estará disponible'}
                </p>
              </div>
              <Switch
                id="edit-activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
            </div>

            {/* Información de grados asociados */}
            {nivel._count && nivel._count.grado > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ Este nivel tiene {nivel._count.grado} grado{nivel._count.grado !== 1 ? 's' : ''} asociado
                  {nivel._count.grado !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

