/**
 * Página de Gestión de Niveles Educativos (Admin)
 * Refactorizada con componentes separados y menú de acciones
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nivelEducativoService, type NivelEducativo } from '@/services/nivel-educativo.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Layers, Search, MoreVertical, Eye, Pencil, Trash2, GripVertical } from 'lucide-react';
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
import {
  NivelEducativoCreateDialog,
  NivelEducativoEditDialog,
  NivelEducativoDetailDialog,
  NivelEducativoDeleteDialog,
} from '@/components/niveles-educativos';

// Componente de fila sortable
function SortableRow({
  nivel,
  index,
  onDetail,
  onEdit,
  onDelete,
}: {
  nivel: NivelEducativo;
  index: number;
  onDetail: (nivel: NivelEducativo) => void;
  onEdit: (nivel: NivelEducativo) => void;
  onDelete: (nivel: NivelEducativo) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: nivel.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted' : 'hover:bg-muted/50'}>
      <TableCell className="w-16">
        <div className="flex items-center gap-1.5">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium text-muted-foreground text-sm">{index + 1}</span>
        </div>
      </TableCell>
      <TableCell className="font-medium font-mono text-sm">{nivel.codigo}</TableCell>
      <TableCell className="font-medium">{nivel.nombre}</TableCell>
      <TableCell className="hidden md:table-cell max-w-xs truncate text-muted-foreground">
        {nivel.descripcion || '-'}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="secondary" className="font-semibold">
          {nivel._count?.grado || 0}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={nivel.activo ? 'default' : 'secondary'}>
          {nivel.activo ? '✓ Activo' : '✗ Inactivo'}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDetail(nivel)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(nivel)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(nivel)} className="text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function NivelesEducativosPage() {
  const queryClient = useQueryClient();

  // Sensors para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Estados de paginación y filtros
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activoFiltro, setActivoFiltro] = useState<string>('ALL');

  // Estados de diálogos
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedNivel, setSelectedNivel] = useState<NivelEducativo | null>(null);

  // Query para obtener niveles
  const { data, isLoading } = useQuery({
    queryKey: ['niveles-educativos', page, search, activoFiltro],
    queryFn: () =>
      nivelEducativoService.getNivelesEducativos({
        page,
        limit: 20,
        search: search || undefined,
        activo: activoFiltro && activoFiltro !== 'ALL' ? activoFiltro === 'true' : undefined,
      }),
  });

  const niveles = data?.data || [];
  const pagination = data?.pagination;

  // Mutation para actualizar orden
  const updateOrdenMutation = useMutation({
    mutationFn: ({ id, orden }: { id: string; orden: number }) =>
      nivelEducativoService.updateNivelEducativo(id, { orden }),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar orden');
    },
  });

  // Manejar fin de drag & drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = niveles.findIndex((n) => n.id === active.id);
    const newIndex = niveles.findIndex((n) => n.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedNiveles = arrayMove(niveles, oldIndex, newIndex);

    try {
      const pageOffset = (page - 1) * 20;

      await Promise.all(
        reorderedNiveles.map((nivel, index) =>
          nivelEducativoService.updateNivelEducativo(nivel.id, {
            orden: pageOffset + index + 1,
          })
        )
      );

      queryClient.invalidateQueries({ queryKey: ['niveles-educativos'] });
      toast.success('Orden actualizado correctamente');
    } catch (error: any) {
      toast.error('Error al actualizar el orden');
    }
  };

  // Handlers para abrir diálogos
  const handleOpenDetail = (nivel: NivelEducativo) => {
    setSelectedNivel(nivel);
    setShowDetailDialog(true);
  };

  const handleOpenEdit = (nivel: NivelEducativo) => {
    setSelectedNivel(nivel);
    setShowEditDialog(true);
  };

  const handleOpenDelete = (nivel: NivelEducativo) => {
    setSelectedNivel(nivel);
    setShowDeleteDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layers className="h-8 w-8 text-blue-600" />
            Niveles Educativos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestión de niveles educativos del sistema (Inicial, Primaria, Secundaria, etc.)
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Nivel
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de búsqueda</CardTitle>
          <CardDescription>Busque y filtre los niveles educativos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o nombre..."
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
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="true">✓ Solo activos</SelectItem>
                <SelectItem value="false">✗ Solo inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="text-sm text-muted-foreground p-4 border-b bg-muted/30">
            💡 Arrastra las filas para cambiar el orden de los niveles educativos
          </div>
          <div className="border rounded-lg">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Orden</TableHead>
                    <TableHead className="w-[120px]">Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Descripción</TableHead>
                    <TableHead className="w-[100px] text-center">Grados</TableHead>
                    <TableHead className="w-[100px]">Estado</TableHead>
                    <TableHead className="w-[80px] text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span className="text-muted-foreground">Cargando niveles educativos...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : niveles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Layers className="h-12 w-12 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">No se encontraron niveles educativos</p>
                          {(search || activoFiltro !== 'ALL') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearch('');
                                setActivoFiltro('ALL');
                              }}
                            >
                              Limpiar filtros
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <SortableContext items={niveles.map((n) => n.id)} strategy={verticalListSortingStrategy}>
                      {niveles.map((nivel, index) => (
                        <SortableRow
                          key={nivel.id}
                          nivel={nivel}
                          index={index}
                          onDetail={handleOpenDetail}
                          onEdit={handleOpenEdit}
                          onDelete={handleOpenDelete}
                        />
                      ))}
                    </SortableContext>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      {pagination && pagination.pages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Mostrando página <span className="font-medium">{pagination.page}</span> de{' '}
                <span className="font-medium">{pagination.pages}</span> (
                <span className="font-medium">{pagination.total}</span> registro
                {pagination.total !== 1 ? 's' : ''} en total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                >
                  Siguiente →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diálogos */}
      <NivelEducativoCreateDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      <NivelEducativoEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        nivel={selectedNivel}
      />

      <NivelEducativoDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        nivel={selectedNivel}
      />

      <NivelEducativoDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        nivel={selectedNivel}
      />
    </div>
  );
}
