/**
 * Página de Gestión de Libros de Actas Físicas - MEJORADA
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Edit, Eye, Trash2, Search, MoreVertical, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { libroService, type Libro } from '@/services/libro.service';
import { toast } from 'sonner';
import { LibroCreateDialog } from '@/components/admin/libros/LibroCreateDialog';
import { LibroEditDialog } from '@/components/admin/libros/LibroEditDialog';
import { LibroDetailDialog } from '@/components/admin/libros/LibroDetailDialog';

export default function LibrosPage() {
  const queryClient = useQueryClient();

  // Estado local
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('ALL');

  // Estados para modales
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedLibro, setSelectedLibro] = useState<Libro | null>(null);

  // Reset page cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [search, estadoFiltro]);

  // Queries
  const { data: librosResponse, isLoading } = useQuery({
    queryKey: ['libros', page, search, estadoFiltro],
    queryFn: () =>
      libroService.getLibros({
        page,
        limit: 20,
        search: search || undefined,
        estado: estadoFiltro && estadoFiltro !== 'ALL' ? (estadoFiltro as any) : undefined,
        activo: true, // Solo mostrar libros activos (no eliminados)
      }),
  });

  const libros = librosResponse?.data || [];
  const pagination = librosResponse?.pagination;
  const totalPages = pagination?.totalPages || 1;

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: libroService.deleteLibro,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['libros'] });
      toast.success('Libro eliminado', {
        description: `El libro "${selectedLibro?.codigo}" ha sido eliminado del sistema.`,
      });
      setShowDeleteDialog(false);
      setSelectedLibro(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error('Error al eliminar libro', {
        description: err.response?.data?.message || 'No se pudo eliminar el libro. Inténtalo de nuevo.',
      });
      console.error('Error eliminando libro:', error);
    },
  });

  // Handlers
  const handleViewDetails = (libro: Libro) => {
    setSelectedLibro(libro);
    setShowDetailDialog(true);
  };

  const handleEdit = (libro: Libro) => {
    setSelectedLibro(libro);
    setShowEditDialog(true);
  };

  const handleDelete = (libro: Libro) => {
    setSelectedLibro(libro);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedLibro) {
      console.log('🗑️ Intentando eliminar libro:', selectedLibro.id, selectedLibro.codigo);
      deleteMutation.mutate(selectedLibro.id);
    }
  };

  // Helpers
  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; className: string }> = {
      ACTIVO: { variant: 'default', className: 'bg-green-600' },
      ARCHIVADO: { variant: 'secondary', className: '' },
      DETERIORADO: { variant: 'default', className: 'bg-yellow-600' },
      PERDIDO: { variant: 'destructive', className: '' },
      EXTRAVIADO: { variant: 'destructive', className: '' },
    };

    const badge = badges[estado] || { variant: 'secondary', className: '' };

    return (
      <Badge variant={badge.variant} className={badge.className}>
        {estado}
      </Badge>
    );
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Libros de Actas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión de inventario de libros físicos
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Libro
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código o descripción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por Estado */}
            <div>
              <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="ARCHIVADO">Archivado</SelectItem>
                  <SelectItem value="DETERIORADO">Deteriorado</SelectItem>
                  <SelectItem value="PERDIDO">Perdido</SelectItem>
                  <SelectItem value="EXTRAVIADO">Extraviado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Libros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Libros del Sistema</CardTitle>
              <CardDescription className="mt-1">
                {pagination?.total || 0} libros registrados
              </CardDescription>
            </div>
            <Badge variant="secondary">
              <BookOpen className="h-3 w-3 mr-1" />
              {libros.length} en esta página
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : libros.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron libros</h3>
              <p className="text-muted-foreground mb-4">
                Intenta con otros filtros o crea un nuevo libro.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Libro
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Rango Folios</TableHead>
                    <TableHead>Años</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Actas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {libros.map((libro) => (
                    <TableRow key={libro.id}>
                      <TableCell>
                        <span className="font-mono font-semibold">{libro.codigo}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {libro.niveleducativo?.nombre || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{libro.descripcion || 'Sin descripción'}</span>
                      </TableCell>
                      <TableCell>
                        {libro.folio_inicio && libro.folio_fin ? (
                          <span className="text-sm font-medium">
                            {libro.folio_inicio} - {libro.folio_fin}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({(libro.folio_fin - libro.folio_inicio + 1)} folios)
                            </span>
                          </span>
                        ) : libro.total_folios ? (
                          <span className="text-sm">{libro.total_folios} folios</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {libro.anio_inicio && libro.anio_fin
                            ? `${libro.anio_inicio} - ${libro.anio_fin}`
                            : libro.anio_inicio || libro.anio_fin || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>{getEstadoBadge(libro.estado)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{libro._count?.actafisica || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(libro)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(libro)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(libro)}
                              disabled={!!libro._count?.actafisica}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, pagination?.total || 0)} de{' '}
                {pagination?.total || 0} libros
              </p>
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        if (totalPages <= 7) return true;
                        if (p === 1 || p === totalPages) return true;
                        if (p >= page - 1 && p <= page + 1) return true;
                        return false;
                      })
                      .map((p, idx, arr) => {
                        if (idx > 0 && arr[idx - 1] !== p - 1) {
                          return (
                            <PaginationItem key={`ellipsis-${p}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return (
                          <PaginationItem key={p}>
                            <PaginationLink
                              onClick={() => setPage(p)}
                              isActive={page === p}
                              className="cursor-pointer"
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs Profesionales */}
      <LibroCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <LibroEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        libroId={selectedLibro?.id || null}
      />

      <LibroDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        libroId={selectedLibro?.id || null}
      />

      {/* AlertDialog: Confirmar Eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              ¿Eliminar Libro?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Estás a punto de eliminar el libro <strong className="font-mono text-foreground">{selectedLibro?.codigo}</strong>.
                </p>
                
                {selectedLibro?._count?.actafisica && selectedLibro._count.actafisica > 0 ? (
                  <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-destructive text-sm">
                          No se puede eliminar este libro
                        </p>
                        <p className="text-sm text-destructive/90">
                          Tiene <strong>{selectedLibro._count.actafisica} acta(s)</strong> registrada(s). 
                          Primero debes reasignar o eliminar las actas asociadas.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-muted-foreground/20 bg-muted/50 p-4">
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Información del libro:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-none">
                          {selectedLibro?.descripcion && (
                            <li>• {selectedLibro.descripcion}</li>
                          )}
                          {selectedLibro?.ubicacion_fisica && (
                            <li>• Ubicación: {selectedLibro.ubicacion_fisica}</li>
                          )}
                          {(selectedLibro?.anio_inicio || selectedLibro?.anio_fin) && (
                            <li>• Período: {selectedLibro.anio_inicio || '?'} - {selectedLibro.anio_fin || '?'}</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                {!selectedLibro?._count?.actafisica && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Advertencia:</strong> Esta acción no se puede deshacer.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setSelectedLibro(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={!!selectedLibro?._count?.actafisica || deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Libro
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
