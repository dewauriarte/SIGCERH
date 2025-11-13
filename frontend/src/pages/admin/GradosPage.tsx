/**
 * Página de Gestión de Grados (Admin)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gradoService, type Grado, type CreateGradoDTO } from '@/services/grado.service';
import { nivelEducativoService } from '@/services/nivel-educativo.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, Pencil, Trash2, GraduationCap, Search, GripVertical, MoreVertical } from 'lucide-react';
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Componente de fila sortable
function SortableRow({ grado, index, onEdit, onDelete, onDetail }: { 
  grado: Grado;
  index: number;
  onEdit: (grado: Grado) => void;
  onDelete: (grado: Grado) => void;
  onDetail: (grado: Grado) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: grado.id });

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
      <TableCell>{grado.nombre}</TableCell>
      <TableCell>{grado.nombrecorto || '-'}</TableCell>
      <TableCell>
        <Badge variant={grado.activo ? 'default' : 'secondary'}>
          {grado.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDetail(grado)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(grado)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(grado)} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function GradosPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activoFiltro, setActivoFiltro] = useState<string>('ALL');
  const [nivelTab, setNivelTab] = useState<string>('secundaria');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedGrado, setSelectedGrado] = useState<Grado | null>(null);

  const [formNumero, setFormNumero] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formNombreCorto, setFormNombreCorto] = useState('');
  const [formNivelId, setFormNivelId] = useState('');
  const [formActivo, setFormActivo] = useState(true);

  // Sensors para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: nivelesData } = useQuery({
    queryKey: ['niveles-activos'],
    queryFn: () => nivelEducativoService.getNivelesEducativosActivos(),
  });

  const niveles = nivelesData?.data || [];

  // Identificar qué niveles educativos existen
  const tienePrimaria = niveles.some(n => n.nombre.toLowerCase().includes('primaria'));
  const tieneSecundaria = niveles.some(n => n.nombre.toLowerCase().includes('secundaria'));

  // Calcular nivel ID según tab activo
  const nivelId = (() => {
    if (!niveles.length) {
      return undefined;
    }
    
    // Buscar el nivel exacto según el tab
    const nivel = niveles.find(n => {
      const nombreLower = n.nombre.toLowerCase();
      if (nivelTab === 'primaria') {
        return nombreLower.includes('primaria');
      } else if (nivelTab === 'secundaria') {
        return nombreLower.includes('secundaria');
      }
      return false;
    });
    
    return nivel?.id;
  })();

  const { data, isLoading } = useQuery({
    queryKey: ['grados', page, search, activoFiltro, nivelId],
    queryFn: () =>
      gradoService.getGrados({
        page,
        limit: 20,
        search: search || undefined,
        activo: activoFiltro && activoFiltro !== 'ALL' ? activoFiltro === 'true' : undefined,
        nivelId: nivelId,
      }),
    enabled: !!nivelesData && niveles.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateGradoDTO) => gradoService.createGrado(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grados'] });
      setShowCreateDialog(false);
      toast.success('Grado creado exitosamente');
      limpiarFormulario();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear grado');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateGradoDTO> }) =>
      gradoService.updateGrado(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grados'] });
      setShowEditDialog(false);
      toast.success('Grado actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar grado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradoService.deleteGrado(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grados'] });
      setShowDeleteDialog(false);
      toast.success('Grado eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar grado');
    },
  });

  // Manejar fin de drag & drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = grados.findIndex((g) => g.id === active.id);
    const newIndex = grados.findIndex((g) => g.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedGrados = arrayMove(grados, oldIndex, newIndex);
    
    try {
      const pageOffset = (page - 1) * 20;
      
      await Promise.all(
        reorderedGrados.map((grado, index) => 
          gradoService.updateGrado(grado.id, { 
            orden: pageOffset + index + 1 
          })
        )
      );

      queryClient.invalidateQueries({ queryKey: ['grados'] });
      toast.success('Orden actualizado');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al reordenar');
      console.error('Error completo:', error.response?.data);
      queryClient.invalidateQueries({ queryKey: ['grados'] });
    }
  };

  const limpiarFormulario = () => {
    setFormNumero('');
    setFormNombre('');
    setFormNombreCorto('');
    setFormNivelId('');
    setFormActivo(true);
  };

  const handleCreate = () => {
    const data: CreateGradoDTO = {
      numero: parseInt(formNumero),
      nombre: formNombre,
      nombrecorto: formNombreCorto || undefined,
      nivelId: formNivelId || undefined,
      orden: parseInt(formNumero), // Orden = numero
      activo: formActivo,
    };
    createMutation.mutate(data);
  };

  const handleEdit = () => {
    if (!selectedGrado) return;
    const data: Partial<CreateGradoDTO> = {
      numero: parseInt(formNumero),
      nombre: formNombre,
      nombrecorto: formNombreCorto || undefined,
      nivelId: formNivelId || undefined,
      orden: parseInt(formNumero), // Orden = numero
      activo: formActivo,
    };
    updateMutation.mutate({ id: selectedGrado.id, data });
  };

  const handleOpenEdit = (grado: Grado) => {
    setSelectedGrado(grado);
    setFormNumero(grado.numero.toString());
    setFormNombre(grado.nombre);
    setFormNombreCorto(grado.nombrecorto || '');
    setFormNivelId(grado.nivel_id || 'SIN_NIVEL');
    setFormActivo(grado.activo);
    setShowEditDialog(true);
  };

  const grados = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            Grados
          </h1>
          <p className="text-muted-foreground mt-2">Gestión de grados académicos</p>
        </div>
        <Button onClick={() => { limpiarFormulario(); setShowCreateDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Grado
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
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

      <Tabs value={nivelTab} onValueChange={setNivelTab} className="space-y-4">
        <TabsList>
          {tieneSecundaria && <TabsTrigger value="secundaria">Secundaria</TabsTrigger>}
          {tienePrimaria && <TabsTrigger value="primaria">Primaria</TabsTrigger>}
          {!tieneSecundaria && !tienePrimaria && (
            <div className="text-sm text-muted-foreground">No hay niveles educativos configurados</div>
          )}
        </TabsList>

        {tieneSecundaria && (
          <TabsContent value="secundaria" className="space-y-4">
          <div className="text-sm text-muted-foreground">
            💡 Arrastra las filas para cambiar el orden de los grados
          </div>

          <div className="border rounded-lg">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Orden</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Nombre Corto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">Cargando...</TableCell>
                    </TableRow>
                  ) : grados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">No se encontraron grados</TableCell>
                    </TableRow>
                  ) : (
                    <SortableContext items={grados.map(g => g.id)} strategy={verticalListSortingStrategy}>
                      {grados.map((grado, index) => (
                        <SortableRow
                          key={grado.id}
                          grado={grado}
                          index={index}
                          onDetail={(g) => { setSelectedGrado(g); setShowDetailDialog(true); }}
                          onEdit={handleOpenEdit}
                          onDelete={(g) => { setSelectedGrado(g); setShowDeleteDialog(true); }}
                        />
                      ))}
                    </SortableContext>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
        </TabsContent>
        )}

        {tienePrimaria && (
          <TabsContent value="primaria" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              💡 Arrastra las filas para cambiar el orden de los grados
            </div>

            <div className="border rounded-lg">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Orden</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Nombre Corto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">Cargando...</TableCell>
                    </TableRow>
                  ) : grados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">No se encontraron grados</TableCell>
                    </TableRow>
                  ) : (
                    <SortableContext items={grados.map(g => g.id)} strategy={verticalListSortingStrategy}>
                      {grados.map((grado, index) => (
                        <SortableRow
                          key={grado.id}
                          grado={grado}
                          index={index}
                          onDetail={(g) => { setSelectedGrado(g); setShowDetailDialog(true); }}
                          onEdit={handleOpenEdit}
                          onDelete={(g) => { setSelectedGrado(g); setShowDeleteDialog(true); }}
                        />
                      ))}
                    </SortableContext>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
        </TabsContent>
        )}
      </Tabs>

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
            <DialogTitle className="text-2xl font-bold">{showCreateDialog ? 'Crear Nuevo Grado' : 'Editar Grado'}</DialogTitle>
            <DialogDescription>Complete los campos requeridos (*) para {showCreateDialog ? 'registrar' : 'actualizar'} el grado</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)] pr-2">
            {/* Datos Básicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Datos Básicos</h3>
              
              <div className="space-y-2">
                <Label htmlFor="numero" className="text-sm font-medium">Número <span className="text-red-500">*</span></Label>
                <Input id="numero" type="number" value={formNumero} onChange={(e) => setFormNumero(e.target.value)} min="1" max="12" placeholder="1" />
                <p className="text-xs text-muted-foreground">El orden se asignará automáticamente igual al número</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-medium">Nombre <span className="text-red-500">*</span></Label>
                <Input id="nombre" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Ej: Primer Grado" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombrecorto" className="text-sm font-medium">Nombre Corto</Label>
                <Input id="nombrecorto" value={formNombreCorto} onChange={(e) => setFormNombreCorto(e.target.value)} placeholder="Ej: 1°" />
              </div>
            </div>

            {/* Configuración */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Configuración</h3>
              
              <div className="space-y-2">
                <Label htmlFor="nivel" className="text-sm font-medium">Nivel Educativo</Label>
                <Select value={formNivelId} onValueChange={setFormNivelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIN_NIVEL">Sin nivel</SelectItem>
                    {niveles.map((nivel) => (
                      <SelectItem key={nivel.id} value={nivel.id}>{nivel.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <DialogTitle className="text-2xl font-bold">Detalles del Grado</DialogTitle>
            <DialogDescription>Información completa del grado académico</DialogDescription>
          </DialogHeader>
          {selectedGrado && (
            <div className="space-y-6 py-4 overflow-y-auto flex-1 pr-2">
              {/* Datos Básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Datos Básicos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Número</p>
                    <p className="text-base font-semibold">{selectedGrado.numero}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Orden</p>
                    <p className="text-base font-semibold">{selectedGrado.orden}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-lg font-semibold">{selectedGrado.nombre}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nombre Corto</p>
                  <p className="text-base">{selectedGrado.nombrecorto || <span className="text-muted-foreground italic">No especificado</span>}</p>
                </div>
              </div>

              {/* Configuración */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Configuración</h3>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nivel Educativo</p>
                  <p className="text-base">{selectedGrado.niveleducativo?.nombre || <span className="text-muted-foreground italic">No especificado</span>}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge variant={selectedGrado.activo ? 'default' : 'secondary'} className="text-sm">
                    {selectedGrado.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              {/* Estadísticas */}
              {selectedGrado._count && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Registros Asociados</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium text-muted-foreground">Actas</p>
                      <p className="text-2xl font-bold">{selectedGrado._count.actafisica}</p>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium text-muted-foreground">Certificados</p>
                      <p className="text-2xl font-bold">{selectedGrado._count.certificadodetalle}</p>
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

      {/* AlertDialog para Eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Grado?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  ¿Está seguro que desea eliminar el grado{' '}
                  <strong>{selectedGrado?.nombre}</strong>?
                </p>
                {selectedGrado && (
                  <ul className="list-none space-y-1 text-sm">
                    <li><strong>Número:</strong> {selectedGrado.numero}</li>
                    <li><strong>Nivel:</strong> {selectedGrado.niveleducativo?.nombre || 'Sin nivel'}</li>
                    {selectedGrado._count && (
                      <>
                        <li><strong>Actas asociadas:</strong> {selectedGrado._count.actafisica}</li>
                        <li><strong>Certificados asociados:</strong> {selectedGrado._count.certificadodetalle}</li>
                      </>
                    )}
                  </ul>
                )}
                {selectedGrado?._count && (selectedGrado._count.actafisica > 0 || selectedGrado._count.certificadodetalle > 0) && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Información:</strong> Este grado tiene registros asociados. 
                      No se podrá eliminar hasta que se eliminen primero las actas y certificados relacionados.
                    </p>
                  </div>
                )}
                <p className="text-muted-foreground text-sm mt-2">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedGrado && deleteMutation.mutate(selectedGrado.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

