/**
 * Página de Gestión de Estudiantes (Admin) - Versión Profesional
 * CRUD completo con componentes modulares
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { estudianteService, type Estudiante } from '@/services/estudiante.service';
import { EstudianteCreateDialog, EstudianteEditDialog, EstudianteDetailDialog } from '@/components/admin/estudiantes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Plus, Users, Search, Eye, Pencil, Trash2, MoreVertical, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function EstudiantesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Estados
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('ALL');
  
  // Estados para diálogos
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEstudianteId, setSelectedEstudianteId] = useState<string | null>(null);
  const [estudianteToDelete, setEstudianteToDelete] = useState<Estudiante | null>(null);

  // Reset page cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [search, estadoFiltro]);

  // Query para listar estudiantes (solo activos por defecto)
  const { data, isLoading } = useQuery({
    queryKey: ['estudiantes', page, search, estadoFiltro],
    queryFn: () =>
      estudianteService.getEstudiantes({
        page,
        limit: 20,
        search: search || undefined,
        estado: estadoFiltro === 'ALL' ? 'ACTIVO' : estadoFiltro,
      }),
  });

  // Mutation para eliminar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => estudianteService.deleteEstudiante(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estudiantes'] });
      setShowDeleteDialog(false);
      setEstudianteToDelete(null);
      toast.success('Estudiante eliminado exitosamente', { duration: 3000 });
    },
    onError: (error: unknown) => {
      console.error('Error al eliminar estudiante:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Error al eliminar estudiante';
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const estudiantes = data?.data || [];
  const pagination = data?.pagination;

  // Generar array de páginas para paginación
  const renderPageNumbers = () => {
    if (!pagination) return [];
    
    const pages: (number | string)[] = [];
    const totalPages = pagination.pages;
    const currentPage = pagination.page;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            Estudiantes
          </h1>
          <p className="text-muted-foreground mt-2">Gestión de estudiantes del sistema</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Estudiante
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por DNI o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos (Activos)</SelectItem>
            <SelectItem value="ACTIVO">Solo Activos</SelectItem>
            <SelectItem value="EGRESADO">Solo Egresados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DNI</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Fecha Nacimiento</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell>
              </TableRow>
            ) : estudiantes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">No se encontraron estudiantes</TableCell>
              </TableRow>
            ) : (
              estudiantes.map((estudiante) => (
                <TableRow key={estudiante.id}>
                  <TableCell className="font-medium font-mono">{estudiante.dni}</TableCell>
                  <TableCell>{estudiante.nombrecompleto}</TableCell>
                  <TableCell>{new Date(estudiante.fechanacimiento).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{estudiante.sexo === 'M' ? 'Masculino' : 'Femenino'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        estudiante.estado === 'ACTIVO'
                          ? 'default'
                          : estudiante.estado === 'EGRESADO'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {estudiante.estado}
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
                        <DropdownMenuItem
                          onClick={() => navigate(`/estudiantes/${estudiante.id}/historial`)}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Historial Académico
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedEstudianteId(estudiante.id);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedEstudianteId(estudiante.id);
                            setShowEditDialog(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEstudianteToDelete(estudiante);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {pagination && pagination.pages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {renderPageNumbers().map((pageNum, idx) => (
              <PaginationItem key={idx}>
                {pageNum === '...' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => setPage(pageNum as number)}
                    isActive={page === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                className={page === pagination.pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Diálogos */}
      <EstudianteCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <EstudianteEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        estudianteId={selectedEstudianteId}
      />

      <EstudianteDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        estudianteId={selectedEstudianteId}
      />

      {/* AlertDialog para Eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Estudiante?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  ¿Está seguro que desea eliminar al estudiante{' '}
                  <strong>{estudianteToDelete?.nombrecompleto}</strong>?
                </p>
                {estudianteToDelete && (
                  <ul className="list-none space-y-1 text-sm">
                    <li><strong>DNI:</strong> {estudianteToDelete.dni}</li>
                    <li><strong>Estado:</strong> {estudianteToDelete.estado}</li>
                  </ul>
                )}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Nota:</strong> Si el estudiante tiene certificados o solicitudes asociadas,
                    será desactivado en lugar de eliminado permanentemente.
                  </p>
                </div>
                <p className="text-muted-foreground text-sm mt-2">
                  Esta acción cambiará el estado del estudiante a INACTIVO si tiene información académica.
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
              onClick={() => estudianteToDelete && deleteMutation.mutate(estudianteToDelete.id)}
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
