/**
 * Dialog para Crear Nuevo Usuario
 * Formulario completo con validación y mejor UX
 */

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Lock,
  Phone,
  CreditCard,
  Briefcase,
  Users,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import type { CreateUsuarioDTO } from '@/services/admin.service';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UsuarioCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  cargo: string;
  password: string;
  confirmPassword: string;
  rolId: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  nombres?: string;
  apellidos?: string;
  password?: string;
  confirmPassword?: string;
  roles?: string;
}

export function UsuarioCreateDialog({ open, onOpenChange }: UsuarioCreateDialogProps) {
  const queryClient = useQueryClient();

  // Estado del formulario
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    cargo: '',
    password: '',
    confirmPassword: '',
    rolId: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  // Obtener roles disponibles
  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: () => adminService.getRoles(),
  });

  const roles = rolesResponse?.data || [];

  // Mutation para crear usuario
  const createMutation = useMutation({
    mutationFn: (data: CreateUsuarioDTO) => adminService.createUsuario(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario creado exitosamente', {
        description: `El usuario ${formData.username} ha sido creado correctamente.`,
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error('Error al crear usuario', {
        description: error.message || 'No se pudo crear el usuario.',
      });
    },
  });

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username
    if (!formData.username.trim()) {
      newErrors.username = 'El username es requerido';
    } else if (formData.username.length < 3) {
      newErrors.username = 'El username debe tener al menos 3 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Solo letras, números y guiones bajos';
    }

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

    // Password
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres';
    }

    // Confirm Password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, rolId, ...restData } = formData;
    
    // Buscar el código del rol seleccionado (el backend espera códigos, no IDs)
    const rolSeleccionado = roles.find(r => r.id === rolId);
    if (!rolSeleccionado) {
      toast.error('Error', { description: 'No se pudo identificar el rol seleccionado' });
      return;
    }
    
    const dataToSend = {
      ...restData,
      roles: [rolSeleccionado.codigo], // El backend espera códigos de rol
    };
    createMutation.mutate(dataToSend);
  };

  const handleClose = () => {
    setFormData({
      username: '',
      email: '',
      nombres: '',
      apellidos: '',
      dni: '',
      telefono: '',
      cargo: '',
      password: '',
      confirmPassword: '',
      rolId: '',
    });
    setErrors({});
    setShowPassword(false);
    onOpenChange(false);
  };

  const handleRoleSelect = (roleId: string) => {
    setFormData((prev) => ({
      ...prev,
      rolId: roleId,
    }));
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error al escribir
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Crear Nuevo Usuario
          </DialogTitle>
          <DialogDescription>
            Complete los datos del nuevo usuario del sistema. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información de Cuenta */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Información de Cuenta</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="usuario123"
                      value={formData.username}
                      onChange={(e) => updateField('username', e.target.value)}
                      className={`pl-10 ${errors.username ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.username}
                    </p>
                  )}
                </div>

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

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Contraseña <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirmar Contraseña <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repita la contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className={errors.confirmPassword ? 'border-destructive' : ''}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showPassword"
                      checked={showPassword}
                      onCheckedChange={(checked) => setShowPassword(checked as boolean)}
                    />
                    <Label htmlFor="showPassword" className="text-sm font-normal cursor-pointer">
                      Mostrar contraseñas
                    </Label>
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

                {/* Cargo */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cargo"
                      placeholder="Ej: Administrador de Sistema, Secretaria, etc."
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
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Crear Usuario'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
