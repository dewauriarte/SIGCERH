/**
 * Dialog para Ver Detalles del Usuario
 * Vista completa con tabs de información, actividad y permisos
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { adminService } from '@/services/admin.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Briefcase,
  Shield,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Activity,
  Info,
  Edit,
  Key,
  AlertCircle,
} from 'lucide-react';
import { type Usuario } from '@/services/admin.service';
import type { Rol } from '@/services/admin.service';
import { Separator } from '@/components/ui/separator';

interface UsuarioDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
  onEdit?: () => void;
  onResetPassword?: () => void;
}

export function UsuarioDetailDialog({
  open,
  onOpenChange,
  usuario,
  onEdit,
  onResetPassword,
}: UsuarioDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('info');

  // Obtener roles completos con permisos
  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: () => adminService.getRoles(),
    enabled: open && !!usuario,
  });

  const rolesCompletos = rolesResponse?.data || [];

  // Obtener los roles completos del usuario con tipos correctos
  const rolesUsuario: Rol[] = usuario?.roles.map((rolUsuario) => {
    const rolCompleto = rolesCompletos.find((r) => r.id === rolUsuario.id);
    return rolCompleto;
  }).filter((r): r is Rol => r !== undefined) || [];

  // Calcular total de permisos
  const totalPermisos = rolesUsuario.reduce((total, rol) => {
    const permisosCount = rol.permisos?.length || 0;
    return total + permisosCount;
  }, 0);

  if (!usuario) return null;

  const handleEdit = () => {
    onOpenChange(false);
    onEdit?.();
  };

  const handleResetPassword = () => {
    onOpenChange(false);
    onResetPassword?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalles del Usuario
          </DialogTitle>
          <DialogDescription>
            Información completa de <strong>@{usuario.username}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Información
            </TabsTrigger>
            <TabsTrigger value="permisos" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles y Permisos
            </TabsTrigger>
            <TabsTrigger value="actividad" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Actividad
            </TabsTrigger>
          </TabsList>

          {/* TAB: Información General */}
          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Estado de la Cuenta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Estado de la Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Estado Activo */}
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Estado</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {usuario.activo ? 'Cuenta activa' : 'Cuenta inactiva'}
                      </p>
                    </div>
                    <Badge
                      variant={usuario.activo ? 'default' : 'secondary'}
                      className={usuario.activo ? 'bg-green-600' : ''}
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
                  </div>

                  {/* Estado Bloqueado */}
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Bloqueo</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {usuario.bloqueado ? 'Usuario bloqueado' : 'Sin bloqueos'}
                      </p>
                    </div>
                    {usuario.bloqueado ? (
                      <Badge variant="destructive">
                        <Lock className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Desbloqueado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información de Cuenta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información de Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Username</Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">@{usuario.username}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{usuario.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Nombres</Label>
                    <p className="font-medium">{usuario.nombres || '-'}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Apellidos</Label>
                    <p className="font-medium">{usuario.apellidos || '-'}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">DNI</Label>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{usuario.dni || '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Teléfono</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{usuario.telefono || '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-muted-foreground text-xs">Cargo</Label>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{usuario.cargo || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Roles y Permisos */}
          <TabsContent value="permisos" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Rol Asignado
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usuario.roles.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Este usuario no tiene roles asignados
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rolesUsuario.map((rol) => (
                      <div
                        key={rol.id}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <div>
                              <h4 className="font-semibold text-lg">{rol.nombre}</h4>
                              {rol.descripcion && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {rol.descripcion}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary">{rol.codigo}</Badge>
                        </div>

                        <Separator className="my-3" />

                        {/* Permisos del Rol */}
                        {rol.permisos && rol.permisos.length > 0 ? (
                          <div>
                            <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Permisos Activos ({rol.permisos.length})
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {rol.permisos.map((permiso) => (
                                <div
                                  key={permiso.id}
                                  className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">{permiso.nombre}</p>
                                    {permiso.descripcion && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {permiso.descripcion}
                                      </p>
                                    )}
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {permiso.modulo}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">
                              Este rol no tiene permisos específicos asignados
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumen de Permisos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Resumen de Accesos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Rol asignado</span>
                    <Badge variant="secondary">{usuario.roles.length > 0 ? usuario.roles[0].nombre : 'Sin rol'}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Total de permisos</span>
                    <Badge variant="secondary">{totalPermisos}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Estado de acceso</span>
                    <Badge variant={usuario.activo && !usuario.bloqueado ? 'default' : 'destructive'}>
                      {usuario.activo && !usuario.bloqueado ? 'Permitido' : 'Denegado'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Actividad */}
          <TabsContent value="actividad" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Información de Actividad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Fecha de Creación */}
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Fecha de Creación</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {usuario.fechaCreacion
                          ? format(new Date(usuario.fechaCreacion), "EEEE, d 'de' MMMM 'de' yyyy", {
                              locale: es,
                            })
                          : 'No disponible'}
                      </p>
                      {usuario.fechaCreacion && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Hace{' '}
                          {Math.floor(
                            (new Date().getTime() - new Date(usuario.fechaCreacion).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{' '}
                          días
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Último Acceso */}
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="p-2 rounded-full bg-blue-500/10">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Último Acceso</p>
                      {usuario.ultimoAcceso ? (
                        <>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(
                              new Date(usuario.ultimoAcceso),
                              "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm",
                              { locale: es }
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Hace{' '}
                            {Math.floor(
                              (new Date().getTime() - new Date(usuario.ultimoAcceso).getTime()) /
                                (1000 * 60 * 60)
                            )}{' '}
                            horas
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          Este usuario nunca ha iniciado sesión
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Estadísticas de Uso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border text-center">
                    <p className="text-2xl font-bold text-primary">
                      {usuario.ultimoAcceso
                        ? Math.floor(
                            (new Date().getTime() - new Date(usuario.fechaCreacion).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        : 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Días en el sistema</p>
                  </div>

                  <div className="p-4 rounded-lg border text-center">
                    <p className="text-2xl font-bold text-primary">{usuario.roles.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Roles asignados</p>
                  </div>

                  <div className="p-4 rounded-lg border text-center">
                    <p className="text-2xl font-bold text-primary">
                      {usuario.activo && !usuario.bloqueado ? '✓' : '✗'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Acceso permitido</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <DialogFooter>
          <div className="flex items-center gap-2 w-full justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <div className="flex gap-2">
              {onResetPassword && (
                <Button variant="outline" onClick={handleResetPassword}>
                  <Key className="h-4 w-4 mr-2" />
                  Resetear Contraseña
                </Button>
              )}
              {onEdit && (
                <Button onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Usuario
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
