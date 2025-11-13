/**
 * Dialog para Editar Usuario Existente
 * Formulario completo con validación y mejor UX
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Briefcase,
  Users,
  AlertCircle,
  CheckCircle2,
  Save,
  Shield,
} from 'lucide-react';
import { adminService, type Usuario } from '@/services/admin.service';
import type { UpdateUsuarioDTO } from '@/services/admin.service';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

interface UsuarioEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
}

interface FormData {
  email: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  cargo: string;
  rolId: string;
  activo: boolean;
}

interface FormErrors {
  email?: string;
  nombres?: string;
  apellidos?: string;
  roles?: string;
}

export function UsuarioEditDialog({ open, onOpenChange, usuario }: UsuarioEditDialogProps) {
  const queryClient = useQueryClient();

  // Estado del formulario
  const [formData, setFormData] = useState<FormData>({
    email: '',
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    cargo: '',
    rolId: '',
    activo: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Cargar datos del usuario cuando cambia
  useEffect(() => {
    if (usuario) {
      const rolId = usuario.roles && usuario.roles.length > 0 ? usuario.roles[0].id : '';
      
      setFormData({
        email: usuario.email || '',
        nombres: usuario.nombres || '',
        apellidos: usuario.apellidos || '',
        dni: usuario.dni || '',
        telefono: usuario.telefono || '',
        cargo: usuario.cargo || '',
        rolId: rolId,
        activo: usuario.activo,
      });
    }
  }, [usuario]);

  // Obtener roles disponibles
  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: () => adminService.getRoles(),
  });

  const roles = rolesResponse?.data || [];

  // Mutation para actualizar usuario
  const updateMutation = useMutation({
    mutationFn: async ({ id, data, rolId }: { id: string; data: UpdateUsuarioDTO; rolId?: string }) => {
      // Primero actualizar datos del usuario
      const usuarioActualizado = await adminService.updateUsuario(id, data);
      
      // Luego asignar el rol (siempre que haya un rolId)
      if (rolId) {
        await adminService.asignarRoles(id, [rolId]);
      }
    },
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con usuarios
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      
      // Forzar refetch inmediato
      queryClient.refetchQueries({ queryKey: ['usuarios'] });
      
      toast.success('Usuario actualizado', {
        description: `Los datos de ${usuario?.username} han sido actualizados correctamente.`,
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar', {
        description: error.message || 'No se pudo actualizar el usuario.',
      });
    },
  });

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email no válido';
    }

    // Nombres
    if (!formData.nombres.trim()) {
      newErrors.nombres = 'Los nombres son requeridos';
    }

    // Apellidos
    if (!formData.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son requeridos';
    }

    // Rol
    if (!formData.rolId) {
      newErrors.roles = 'Debe seleccionar un rol';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('Formulario incompleto', {
        description: 'Por favor complete todos los campos requeridos correctamente.',
      });
      return;
    }

    if (usuario) {
      // Extraer rolId y preparar datos para actualización
      const { rolId, ...restData } = formData;
      
      const dataToSend: UpdateUsuarioDTO = {
        email: restData.email,
        nombres: restData.nombres,
        apellidos: restData.apellidos,
        dni: restData.dni || undefined,
        telefono: restData.telefono || undefined,
        cargo: restData.cargo || undefined,
        activo: restData.activo,
      };
      
      updateMutation.mutate({
        id: usuario.id,
        data: dataToSend,
        rolId: rolId || undefined, // Siempre enviar el rol si existe
      });
    }
  };

  const handleClose = () => {
    setErrors({});
    onOpenChange(false);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        email: '',
        nombres: '',
        apellidos: '',
        dni: '',
        telefono: '',
        cargo: '',
        rolId: '',
        activo: true,
      });
      setErrors({});
    }
  }, [open]);

  const handleRoleSelect = (roleId: string) => {
    setFormData((prev) => ({
      ...prev,
      rolId: roleId,
    }));
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error al escribir
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!usuario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Usuario
          </DialogTitle>
          <DialogDescription>
            Modifica los datos de <strong>@{usuario.username}</strong>. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Estado del Usuario */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Estado de la Cuenta</h3>
              </div>

              <div className="space-y-4">
                {/* Switch Activo/Inactivo */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="activo" className="text-base font-medium">
                      Usuario Activo
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.activo
                        ? 'El usuario puede acceder al sistema'
                        : 'El usuario no puede iniciar sesión'}
                    </p>
                  </div>
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => updateField('activo', checked)}
                  />
                </div>

                {/* Info Username (solo lectura) */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Username</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        El username no se puede modificar
                      </p>
                    </div>
                    <Badge variant="secondary">@{usuario.username}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Información de Contacto</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefono"
                      placeholder="987654321"
                      maxLength={15}
                      value={formData.telefono}
                      onChange={(e) => updateField('telefono', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Personal */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Información Personal</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombres */}
                <div className="space-y-2">
                  <Label htmlFor="nombres">
                    Nombres <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nombres"
                    placeholder="Juan Carlos"
                    value={formData.nombres}
                    onChange={(e) => updateField('nombres', e.target.value)}
                    className={errors.nombres ? 'border-destructive' : ''}
                  />
                  {errors.nombres && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.nombres}
                    </p>
                  )}
                </div>

                {/* Apellidos */}
                <div className="space-y-2">
                  <Label htmlFor="apellidos">
                    Apellidos <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="apellidos"
                    placeholder="Pérez García"
                    value={formData.apellidos}
                    onChange={(e) => updateField('apellidos', e.target.value)}
                    className={errors.apellidos ? 'border-destructive' : ''}
                  />
                  {errors.apellidos && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.apellidos}
                    </p>
                  )}
                </div>

                {/* DNI */}
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dni"
                      placeholder="12345678"
                      maxLength={8}
                      value={formData.dni}
                      onChange={(e) => updateField('dni', e.target.value.replace(/\D/g, ''))}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Cargo */}
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cargo"
                      placeholder="Ej: Administrador de Sistema"
                      value={formData.cargo}
                      onChange={(e) => updateField('cargo', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">
                  Roles y Permisos <span className="text-destructive">*</span>
                </h3>
              </div>

              {errors.roles && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.roles}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-3">
                {roles.map((rol) => (
                  <div
                    key={rol.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent ${
                      formData.rolId === rol.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                    onClick={() => handleRoleSelect(rol.id)}
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="radio"
                        id={`rol-${rol.id}`}
                        name="rol"
                        checked={formData.rolId === rol.id}
                        onChange={() => handleRoleSelect(rol.id)}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                    </div>
                    <div className="flex-1">
                      <Label
                        htmlFor={`rol-${rol.id}`}
                        className="font-medium cursor-pointer flex items-center gap-2"
                      >
                        {rol.nombre}
                        {formData.rolId === rol.id && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </Label>
                      {rol.descripcion && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {rol.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {formData.rolId && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm font-semibold mb-3">Rol seleccionado:</p>
                  {(() => {
                    const rolSeleccionado = roles.find((r) => r.id === formData.rolId);
                    return rolSeleccionado ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{rolSeleccionado.nombre}</p>
                            {rolSeleccionado.descripcion && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {rolSeleccionado.descripcion}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">{rolSeleccionado.codigo}</Badge>
                        </div>
                        {rolSeleccionado.permisos && rolSeleccionado.permisos.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs font-medium mb-2 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              {rolSeleccionado.permisos.length} permisos incluidos
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {rolSeleccionado.permisos.slice(0, 5).map((permiso) => (
                                <Badge key={permiso.id} variant="outline" className="text-xs">
                                  {permiso.nombre}
                                </Badge>
                              ))}
                              {rolSeleccionado.permisos.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{rolSeleccionado.permisos.length - 5} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info de Cambios en Roles */}
          {usuario.roles[0]?.id !== formData.rolId && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Has modificado el rol del usuario. Los cambios se aplicarán al guardar.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={updateMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
