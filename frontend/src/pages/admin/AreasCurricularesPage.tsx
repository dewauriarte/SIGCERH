/**
 * Página de Gestión de Áreas Curriculares (Admin)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { areaCurricularService, type AreaCurricular, type CreateAreaCurricularDTO } from '@/services/area-curricular.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Eye, Pencil, Trash2, BookOpen, Search, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Componente de fila sortable
function SortableRow({ area, index, onEdit, onDelete, onDetail }: { 
  area: AreaCurricular;
  index: number;
  onEdit: (area: AreaCurricular) => void;
  onDelete: (area: AreaCurricular) => void;
  onDetail: (area: AreaCurricular) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: area.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted' : ''}>
      <TableCell className="w-16">
        <div className="flex items-center gap-1.5">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium text-muted-foreground text-sm">{index + 1}</span>
        </div>
      </TableCell>
      <TableCell className="font-medium font-mono">{area.codigo}</TableCell>
      <TableCell>{area.nombre}</TableCell>
      <TableCell>
        <Badge variant={area.escompetenciatransversal ? 'secondary' : 'outline'}>
          {area.escompetenciatransversal ? 'Transversal' : 'Regular'}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={area.activo ? 'default' : 'secondary'}>
          {area.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onDetail(area)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(area)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(area)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AreasCurricularesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activoFiltro, setActivoFiltro] = useState<string>('ALL');
  const [competenciaFiltro, setCompetenciaFiltro] = useState<string>('ALL');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedArea, setSelectedArea] = useState<AreaCurricular | null>(null);

  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formOrden, setFormOrden] = useState('');
  const [formEsCompetencia, setFormEsCompetencia] = useState(false);
  const [formActivo, setFormActivo] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['areas-curriculares', page, search, activoFiltro, competenciaFiltro],
    queryFn: () =>
      areaCurricularService.getAreasCurriculares({
        page,
        limit: 20,
        search: search || undefined,
        activo: activoFiltro && activoFiltro !== 'ALL' ? activoFiltro === 'true' : undefined,
        escompetenciatransversal: competenciaFiltro && competenciaFiltro !== 'ALL' ? competenciaFiltro === 'true' : undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAreaCurricularDTO) => areaCurricularService.createAreaCurricular(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas-curriculares'] });
      setShowCreateDialog(false);
      toast.success('Área curricular creada exitosamente');
      limpiarFormulario();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear área curricular');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAreaCurricularDTO> }) =>
      areaCurricularService.updateAreaCurricular(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas-curriculares'] });
      setShowEditDialog(false);
      toast.success('Área curricular actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar área curricular');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => areaCurricularService.deleteAreaCurricular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas-curriculares'] });
      setShowDeleteDialog(false);
      toast.success('Área curricular eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar área curricular');
    },
  });

  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Manejar fin de drag & drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = areas.findIndex((a) => a.id === active.id);
    const newIndex = areas.findIndex((a) => a.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reordenar localmente
    const reorderedAreas = arrayMove(areas, oldIndex, newIndex);
    
    // Actualizar TODOS los órdenes en el backend
    try {
      const pageOffset = (page - 1) * 20;
      
      await Promise.all(
        reorderedAreas.map((area, index) => 
          areaCurricularService.updateAreaCurricular(area.id, { 
            orden: pageOffset + index + 1 
          })
        )
      );

      queryClient.invalidateQueries({ queryKey: ['areas-curriculares'] });
      toast.success('Orden actualizado');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al reordenar');
      console.error('Error completo:', error.response?.data);
      queryClient.invalidateQueries({ queryKey: ['areas-curriculares'] });
    }
  };

  const limpiarFormulario = () => {
    setFormCodigo('');
    setFormNombre('');
    setFormOrden('');
    setFormEsCompetencia(false);
    setFormActivo(true);
  };

  const handleCreate = () => {
    const data: CreateAreaCurricularDTO = {
      codigo: formCodigo.toUpperCase(),
      nombre: formNombre,
      orden: parseInt(formOrden),
      escompetenciatransversal: formEsCompetencia,
      activo: formActivo,
    };
    createMutation.mutate(data);
  };

  const handleEdit = () => {
    if (!selectedArea) return;
    const data: Partial<CreateAreaCurricularDTO> = {
      codigo: formCodigo.toUpperCase(),
      nombre: formNombre,
      orden: parseInt(formOrden),
      escompetenciatransversal: formEsCompetencia,
      activo: formActivo,
    };
    updateMutation.mutate({ id: selectedArea.id, data });
  };

  const openEditDialog = (area: AreaCurricular) => {
    setSelectedArea(area);
    setFormCodigo(area.codigo);
    setFormNombre(area.nombre);
    setFormOrden(area.orden.toString());
    setFormEsCompetencia(area.escompetenciatransversal);
    setFormActivo(area.activo);
    setShowEditDialog(true);
  };

  const areas = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Áreas Curriculares
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestión de áreas curriculares del sistema
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              💡 Arrastra las filas para reordenar
            </span>
          </p>
        </div>
        <Button onClick={() => { limpiarFormulario(); setShowCreateDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Área
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar área..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={competenciaFiltro} onValueChange={setCompetenciaFiltro}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="false">Áreas regulares</SelectItem>
            <SelectItem value="true">Competencias transversales</SelectItem>
          </SelectContent>
        </Select>
        <Select value={activoFiltro} onValueChange={setActivoFiltro}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Orden</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell>
                </TableRow>
              ) : areas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">No se encontraron áreas curriculares</TableCell>
                </TableRow>
              ) : (
                <SortableContext items={areas.map(a => a.id)} strategy={verticalListSortingStrategy}>
                  {areas.map((area, index) => (
                    <SortableRow
                      key={area.id}
                      area={area}
                      index={index}
                      onDetail={(a) => { setSelectedArea(a); setShowDetailDialog(true); }}
                      onEdit={openEditDialog}
                      onDelete={(a) => { setSelectedArea(a); setShowDeleteDialog(true); }}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.pages} ({pagination.total} registros)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
            <Button variant="outline" onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); setShowEditDialog(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{showCreateDialog ? 'Crear Nueva Área Curricular' : 'Editar Área Curricular'}</DialogTitle>
            <DialogDescription>Complete los campos requeridos (*) para {showCreateDialog ? 'registrar' : 'actualizar'} el área curricular</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)] pr-2">
            {/* Datos Básicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Datos Básicos</h3>
              
              <div className="space-y-2">
                <Label htmlFor="codigo" className="text-sm font-medium">Código <span className="text-red-500">*</span></Label>
                <Input 
                  id="codigo" 
                  value={formCodigo} 
                  onChange={(e) => setFormCodigo(e.target.value.toUpperCase())} 
                  placeholder="MAT" 
                  maxLength={20}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">Solo mayúsculas, números y guiones bajos</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-medium">Nombre <span className="text-red-500">*</span></Label>
                <Input id="nombre" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Matemática" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orden" className="text-sm font-medium">Orden <span className="text-red-500">*</span></Label>
                <Input id="orden" type="number" value={formOrden} onChange={(e) => setFormOrden(e.target.value)} min="1" placeholder="1" />
                <p className="text-xs text-muted-foreground">Posición en listados y certificados</p>
              </div>
            </div>

            {/* Configuración */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Configuración</h3>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="escompetencia"
                  checked={formEsCompetencia}
                  onChange={(e) => setFormEsCompetencia(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="escompetencia" className="text-sm font-medium">Es Competencia Transversal</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="activo" className="text-sm font-medium">Activo</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setShowEditDialog(false); }}>Cancelar</Button>
            <Button onClick={showCreateDialog ? handleCreate : handleEdit} disabled={createMutation.isPending || updateMutation.isPending}>
              {showCreateDialog ? 'Crear' : 'Actualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalles */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detalles del Área Curricular</DialogTitle>
            <DialogDescription>Información completa del área curricular</DialogDescription>
          </DialogHeader>
          {selectedArea && (
            <div className="space-y-6 py-4 overflow-y-auto flex-1 pr-2">
              {/* Datos Básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Datos Básicos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Código</p>
                    <p className="text-lg font-mono font-bold">{selectedArea.codigo}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Orden</p>
                    <p className="text-base font-semibold">{selectedArea.orden}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-lg font-semibold">{selectedArea.nombre}</p>
                </div>
              </div>

              {/* Configuración */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Configuración</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                    <Badge variant={selectedArea.escompetenciatransversal ? 'secondary' : 'outline'} className="text-sm">
                      {selectedArea.escompetenciatransversal ? 'Competencia Transversal' : 'Área Regular'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                    <Badge variant={selectedArea.activo ? 'default' : 'secondary'} className="text-sm">
                      {selectedArea.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              {selectedArea._count && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Registros Asociados</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium text-muted-foreground">Notas en Certificados</p>
                      <p className="text-2xl font-bold">{selectedArea._count.certificadonota}</p>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium text-muted-foreground">Currículos</p>
                      <p className="text-2xl font-bold">{selectedArea._count.curriculogrado}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Área Curricular</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar el área "{selectedArea?.nombre}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => selectedArea && deleteMutation.mutate(selectedArea.id)}
              disabled={deleteMutation.isPending}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

