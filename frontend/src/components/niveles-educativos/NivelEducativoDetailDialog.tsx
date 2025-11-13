/**
 * Componente: Diálogo para ver detalles de un nivel educativo
 */

import { useQuery } from '@tanstack/react-query';
import { nivelEducativoService, type NivelEducativo } from '@/services/nivel-educativo.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Hash, Layers, FileText, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface NivelEducativoDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nivel: NivelEducativo | null;
}

export function NivelEducativoDetailDialog({ open, onOpenChange, nivel }: NivelEducativoDetailDialogProps) {
  const { data: nivelCompleto, isLoading } = useQuery({
    queryKey: ['nivel-educativo', nivel?.id],
    queryFn: () => nivel ? nivelEducativoService.getNivelEducativo(nivel.id) : Promise.reject('No hay nivel'),
    enabled: open && !!nivel?.id,
  });

  const nivelData = nivelCompleto || nivel;
  
  if (!nivelData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            Detalles del Nivel Educativo
          </DialogTitle>
          <DialogDescription>Información completa del nivel educativo</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span>Código</span>
              </div>
              <p className="text-xl font-bold font-mono bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded">
                {nivelData.codigo}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" />
                <span>Orden</span>
              </div>
              <p className="text-xl font-semibold">{nivelData.orden}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Nombre</span>
            </div>
            <p className="text-lg font-medium">{nivelData.nombre}</p>
          </div>

          {nivelData.descripcion && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Descripción</span>
              </div>
              <p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                {nivelData.descripcion}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Estado</p>
            <Badge variant={nivelData.activo ? 'default' : 'secondary'} className="text-sm">
              {nivelData.activo ? '✓ Activo' : '✗ Inactivo'}
            </Badge>
          </div>

          <Separator />

          {/* Grados Asociados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Grados Asociados</p>
              </div>
              <Badge variant="outline">
                {nivelData._count?.grado || nivelData.grado?.length || 0} grado{((nivelData._count?.grado || nivelData.grado?.length || 0) !== 1) ? 's' : ''}
              </Badge>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground italic">Cargando grados...</p>
            ) : nivelData.grado && nivelData.grado.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {nivelData.grado
                  .filter(grado => grado.activo !== false)
                  .map((grado) => (
                    <div
                      key={grado.id}
                      className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent transition-colors"
                    >
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium truncate">
                        {grado.nombrecorto || grado.nombre}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic p-3 bg-slate-50 dark:bg-slate-900 rounded">
                No hay grados asociados a este nivel educativo
              </p>
            )}
          </div>

          <Separator />

          {/* Metadatos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Fecha de creación</span>
              </div>
              <p className="text-sm">
                {nivelData.fechacreacion
                  ? format(new Date(nivelData.fechacreacion), "PPP 'a las' p", { locale: es })
                  : 'No disponible'}
              </p>
            </div>

            {nivelData.fechaactualizacion && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Última actualización</span>
                </div>
                <p className="text-sm">
                  {format(new Date(nivelData.fechaactualizacion), "PPP 'a las' p", { locale: es })}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

