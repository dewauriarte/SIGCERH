/**
 * Página de Gestión de Usuarios
 * CRUD completo de usuarios del sistema
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Lock,
  Unlock,
  Key,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { adminService, type Usuario } from '@/services/admin.service';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UsuarioCreateDialog } from '@/components/admin/usuarios/UsuarioCreateDialog';
import { UsuarioEditDialog } from '@/components/admin/usuarios/UsuarioEditDialog';
import { UsuarioDetailDialog } from '@/components/admin/usuarios/UsuarioDetailDialog';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function UsuariosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estado local
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [rolFiltro, setRolFiltro] = useState<string>('ALL');
  const [activoFiltro, setActivoFiltro] = useState<string>('ALL');
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  const { data: usuariosResponse, isLoading } = useQuery({
    queryKey: ['usuarios', page, search, rolFiltro, activoFiltro],
    queryFn: () =>
      adminService.getUsuarios({
        page,
        limit: 20,
        search: search || undefined,
        rol: rolFiltro && rolFiltro !== 'ALL' ? rolFiltro : undefined,
        activo: activoFiltro === 'ALL' ? undefined : activoFiltro === 'true',
      }),
  });

  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: () => adminService.getRoles(),
  });

  const usuarios = usuariosResponse?.usuarios || [];
  const pagination = usuariosResponse?.pagination;
  const roles = rolesResponse?.data || [];

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [search, rolFiltro, activoFiltro]);

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  const desactivarMutation = useMutation({
    mutationFn: (id: string) => adminService.desactivarUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario desactivado', {
        description: 'El usuario ha sido desactivado exitosamente.',
      });
    },
    onError: () => {
      toast.error('Error', {
        description: 'No se pudo desactivar el usuario.',
      });
    },
  });

  const activarMutation = useMutation({
    mutationFn: (id: string) => adminService.activarUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario activado', {
        description: 'El usuario ha sido activado exitosamente.',
      });
    },
    onError: () => {
      toast.error('Error', {
        description: 'No se pudo activar el usuario.',
      });
    },
  });

  const bloquearMutation = useMutation({
    mutationFn: (id: string) => adminService.bloquearUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario bloqueado', {
        description: 'El usuario ha sido bloqueado exitosamente.',
      });
    },
    onError: () => {
      toast.error('Error', {
        description: 'No se pudo bloquear el usuario.',
      });
    },
  });

  const desbloquearMutation = useMutation({
    mutationFn: (id: string) => adminService.desbloquearUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario desbloqueado', {
        description: 'El usuario ha sido desbloqueado exitosamente.',
      });
    },
    onError: () => {
      toast.error('Error', {
        description: 'No se pudo desbloquear el usuario.',
      });
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => adminService.eliminarUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario eliminado', {
        description: 'El usuario ha sido eliminado permanentemente del sistema.',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar', {
        description: error.message || 'No se pudo eliminar el usuario.',
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      adminService.resetearPassword(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setShowResetPasswordDialog(false);
      setNewPassword('');
      setSelectedUsuario(null);
      toast.success('Contraseña reseteada', {
        description: 'La contraseña ha sido actualizada exitosamente.',
      });
    },
    onError: () => {
      toast.error('Error', {
        description: 'No se pudo resetear la contraseña.',
      });
    },
  });

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleResetPassword = () => {
    if (selectedUsuario && newPassword && newPassword === confirmPassword) {
      resetPasswordMutation.mutate({
        id: selectedUsuario.id,
        password: newPassword,
      });
    } else if (newPassword !== confirmPassword) {
      toast.error('Error', {
        description: 'Las contraseñas no coinciden.',
      });
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Usuario
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email, DNI o username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por Rol */}
            <div>
              <Select value={rolFiltro} onValueChange={setRolFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los roles</SelectItem>
                  {roles.map((rol) => (
                    <SelectItem key={rol.id} value={rol.codigo}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Estado */}
            <div>
              <Select value={activoFiltro} onValueChange={setActivoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="true">Activos</SelectItem>
                  <SelectItem value="false">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Usuarios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuarios del Sistema</CardTitle>
              <CardDescription className="mt-1">
                {pagination?.total || 0} usuarios registrados
              </CardDescription>
            </div>
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" />
              {usuarios.length} en esta página
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
          ) : usuarios.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No se encontraron usuarios
              </h3>
              <p className="text-muted-foreground mb-4">
                Intenta con otros filtros o crea un nuevo usuario.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      {/* Usuario */}
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {usuario.nombres} {usuario.apellidos}
                          </p>
                          <p className="text-sm text-muted-foreground">@{usuario.username}</p>
                          {usuario.dni && (
                            <p className="text-xs text-muted-foreground">DNI: {usuario.dni}</p>
                          )}
                        </div>
                      </TableCell>

                      {/* Contacto */}
                      <TableCell>
                        <div>
                          <p className="text-sm">{usuario.email}</p>
                          {usuario.telefono && (
                            <p className="text-xs text-muted-foreground">{usuario.telefono}</p>
                          )}
                        </div>
                      </TableCell>

                      {/* Roles */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {usuario.roles.map((rol) => (
                            <Badge key={rol.id} variant="secondary" className="text-xs">
                              {rol.nombre}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={usuario.activo ? 'default' : 'secondary'}
                            className={`w-fit ${usuario.activo ? 'bg-green-600' : ''}`}
                          >
                            {usuario.activo ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Activo
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactivo
                              </>
                            )}
                          </Badge>
                          {usuario.bloqueado && (
                            <Badge variant="destructive" className="w-fit">
                              <Lock className="h-3 w-3 mr-1" />
                              Bloqueado
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Último Acceso */}
                      <TableCell>
                        {usuario.ultimoAcceso ? (
                          <span className="text-sm">
                            {format(new Date(usuario.ultimoAcceso), 'PPp', { locale: es })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUsuario(usuario);
                                setShowDetailDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUsuario(usuario);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {usuario.activo ? (
                              <DropdownMenuItem
                                onClick={() => desactivarMutation.mutate(usuario.id)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Desactivar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => activarMutation.mutate(usuario.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Activar
                              </DropdownMenuItem>
                            )}

                            {usuario.bloqueado ? (
                              <DropdownMenuItem
                                onClick={() => desbloquearMutation.mutate(usuario.id)}
                              >
                                <Unlock className="h-4 w-4 mr-2" />
                                Desbloquear
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => bloquearMutation.mutate(usuario.id)}
                              >
                                <Lock className="h-4 w-4 mr-2" />
                                Bloquear
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUsuario(usuario);
                                setShowResetPasswordDialog(true);
                              }}
                            >
                              <Key className="h-4 w-4 mr-2" />
                              Resetear Contraseña
                            </DropdownMenuItem>

                            {usuario.activo && (
                              <>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUsuario(usuario);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar Usuario
                                </DropdownMenuItem>
                              </>
                            )}
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
          {pagination && (
            <div className="flex flex-col gap-4 mt-6">
              <p className="text-sm text-muted-foreground text-center">
                Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, pagination.total)} de{' '}
                {pagination.total} usuarios
              </p>
              
              {pagination.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(page - 1)}
                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {/* Primera página */}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setPage(1)}
                        isActive={page === 1}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>

                    {/* Ellipsis inicio */}
                    {page > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Páginas del medio */}
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(p => {
                        // Mostrar página actual y vecinas
                        if (p === 1 || p === pagination.totalPages) return false;
                        return Math.abs(p - page) <= 1;
                      })
                      .map(p => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            onClick={() => setPage(p)}
                            isActive={page === p}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                    {/* Ellipsis final */}
                    {page < pagination.totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Última página */}
                    {pagination.totalPages > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setPage(pagination.totalPages)}
                          isActive={page === pagination.totalPages}
                          className="cursor-pointer"
                        >
                          {pagination.totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(page + 1)}
                        className={page >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Confirmar Eliminación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente al usuario del sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-semibold">
                    ¿Estás seguro de eliminar este usuario?
                  </p>
                  <div className="space-y-1 text-sm">
                    <p><strong>Usuario:</strong> @{selectedUsuario?.username}</p>
                    <p><strong>Nombre:</strong> {selectedUsuario?.nombres} {selectedUsuario?.apellidos}</p>
                    <p><strong>Email:</strong> {selectedUsuario?.email}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Esta acción es permanente y no se puede deshacer. 
                    Todos los datos del usuario serán eliminados del sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedUsuario(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUsuario) {
                  eliminarMutation.mutate(selectedUsuario.id);
                  setShowDeleteDialog(false);
                  setSelectedUsuario(null);
                }
              }}
              disabled={eliminarMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {eliminarMutation.isPending ? 'Eliminando...' : 'Eliminar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Resetear Contraseña */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetear Contraseña</DialogTitle>
            <DialogDescription>
              Establece una nueva contraseña para {selectedUsuario?.nombres}{' '}
              {selectedUsuario?.apellidos}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="newPassword">
                Nueva Contraseña <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingrese la nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 8 caracteres. Se recomienda usar mayúsculas, minúsculas y números.
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">
                Confirmar Contraseña <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirme la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={confirmPassword && newPassword !== confirmPassword ? 'border-destructive' : ''}
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Las contraseñas no coinciden
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetPasswordDialog(false);
                setNewPassword('');
                setConfirmPassword('');
                setShowPassword(false);
                setSelectedUsuario(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={
                !newPassword || 
                !confirmPassword || 
                newPassword.length < 8 || 
                newPassword !== confirmPassword
              }
            >
              <Key className="h-4 w-4 mr-2" />
              Resetear Contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Crear Usuario */}
      <UsuarioCreateDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Dialog: Editar Usuario */}
      <UsuarioEditDialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) {
            // Delay para permitir que la animación de cierre termine
            setTimeout(() => setSelectedUsuario(null), 200);
          }
        }}
        usuario={selectedUsuario}
      />

      {/* Dialog: Ver Detalles */}
      <UsuarioDetailDialog
        open={showDetailDialog}
        onOpenChange={(open) => {
          setShowDetailDialog(open);
          if (!open) {
            setTimeout(() => setSelectedUsuario(null), 200);
          }
        }}
        usuario={selectedUsuario}
        onEdit={() => {
          setShowDetailDialog(false);
          setShowEditDialog(true);
        }}
        onResetPassword={() => {
          setShowDetailDialog(false);
          setShowResetPasswordDialog(true);
        }}
      />
    </div>
  );
}

