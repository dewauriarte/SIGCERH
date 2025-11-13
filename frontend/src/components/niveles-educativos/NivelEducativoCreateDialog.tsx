/**
 * Componente: Diálogo para crear un nuevo nivel educativo
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nivelEducativoService, type CreateNivelEducativoDTO } from '@/services/nivel-educativo.service';
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

interface NivelEducativoCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NivelEducativoCreateDialog({ open, onOpenChange }: NivelEducativoCreateDialogProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    activo: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateNivelEducativoDTO) => nivelEducativoService.createNivelEducativo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niveles-educativos'] });
      toast.success('Nivel educativo creado exitosamente');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear nivel educativo');
    },
  });

  const handleClose = () => {
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      activo: true,
    });
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.codigo.trim()) {
      toast.error('El código es obligatorio');
      return;
    }
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const data: CreateNivelEducativoDTO = {
      codigo: formData.codigo.toUpperCase().trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || undefined,
      orden: 999, // El backend o el drag & drop ajustará el orden real
      activo: formData.activo,
    };

    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Crear Nivel Educativo</DialogTitle>
          <DialogDescription>
            Complete los datos del nuevo nivel educativo. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Código */}
            <div className="space-y-2">
              <Label htmlFor="create-codigo">
                Código <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                placeholder="Ej: PRIMARIA, SECUNDARIA"
                maxLength={20}
                className="font-mono"
                required
              />
              <p className="text-xs text-muted-foreground">
                Solo mayúsculas, números y guiones bajos. Ejemplo: PRIMARIA, INICIAL
              </p>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="create-nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Educación Primaria"
                required
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="create-descripcion">Descripción</Label>
              <Textarea
                id="create-descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional del nivel educativo"
                rows={3}
              />
            </div>

            {/* Activo */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="create-activo">Estado</Label>
                <p className="text-xs text-muted-foreground">
                  {formData.activo ? 'El nivel estará disponible para su uso' : 'El nivel no estará disponible'}
                </p>
              </div>
              <Switch
                id="create-activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Nivel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

