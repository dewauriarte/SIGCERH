/**
 * Modal de Perfil de Usuario
 * Permite ver y editar información del perfil, avatar y contraseña
 */

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User as UserIcon, Upload, Trash2, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { userService, type UpdateProfileData } from '@/services/user.service';
import { useAuthStore, type User } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { getStorageUrl } from '@/lib/storageUrl';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

export function UserProfileModal({ open, onOpenChange, user }: UserProfileModalProps) {
  const queryClient = useQueryClient();
  const { roleLabel } = useRole();
  const { setUser } = useAuthStore();

  // Estados del formulario
  const [nombres, setNombres] = useState(user.nombres);
  const [apellidos, setApellidos] = useState(user.apellidos);
  const [email, setEmail] = useState(user.email);
  const [telefono, setTelefono] = useState(user.telefono || '');
  const [cargo, setCargo] = useState(user.cargo || '');

  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados para mostrar/ocultar contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutation para actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => userService.updateProfile(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Perfil actualizado exitosamente');
      // Actualizar el usuario en el store
      setUser({ ...user, ...response.data });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar perfil');
    },
  });

  // Mutation para subir avatar
  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => {
      console.log('Mutation: uploadAvatar iniciado con archivo:', file.name);
      return userService.uploadAvatar(file);
    },
    onSuccess: (response) => {
      console.log('Avatar subido exitosamente:', response);
      toast.success('Avatar actualizado exitosamente');
      setAvatarPreview(null);
      setSelectedFile(null);
      // Actualizar el usuario en el store
      setUser({ ...user, avatar: response.data.avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      console.error('Error al subir avatar:', error);
      toast.error(error.response?.data?.message || 'Error al subir avatar');
    },
  });

  // Mutation para eliminar avatar
  const deleteAvatarMutation = useMutation({
    mutationFn: () => userService.deleteAvatar(),
    onSuccess: () => {
      toast.success('Avatar eliminado exitosamente');
      setUser({ ...user, avatar: undefined });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar avatar');
    },
  });

  // Mutation para cambiar contraseña
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      userService.changePassword(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Contraseña cambiada exitosamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cambiar contraseña');
    },
  });

  const handleSaveProfile = () => {
    if (!nombres.trim() || !apellidos.trim() || !email.trim()) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    updateProfileMutation.mutate({
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      email: email.trim(),
      telefono: telefono.trim() || undefined,
      cargo: cargo.trim() || undefined,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor seleccione una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona una imagen primero');
      return;
    }
    console.log('Subiendo avatar:', selectedFile.name, selectedFile.type, selectedFile.size);
    uploadAvatarMutation.mutate(selectedFile);
  };

  const handleDeleteAvatar = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar tu avatar?')) {
      deleteAvatarMutation.mutate();
    }
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const getInitials = () => {
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Mi Perfil
          </DialogTitle>
          <DialogDescription>
            Gestiona tu información personal, avatar y seguridad de la cuenta
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="avatar">Avatar</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
          </TabsList>

          {/* Tab: Información General */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos Personales</CardTitle>
                <CardDescription>
                  Actualiza tu información personal y de contacto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombres">Nombres *</Label>
                    <Input
                      id="nombres"
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      placeholder="Nombres"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos *</Label>
                    <Input
                      id="apellidos"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      placeholder="Apellidos"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="999 999 999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Tu cargo en la institución"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Rol del Sistema</Label>
                  <Badge variant="secondary" className="text-sm">
                    {roleLabel}
                  </Badge>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="w-full"
                >
                  {updateProfileMutation.isPending ? (
                    <>Guardando...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Avatar */}
          <TabsContent value="avatar" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Foto de Perfil</CardTitle>
                <CardDescription>
                  Sube una imagen para personalizar tu perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={avatarPreview || getStorageUrl(user.avatar) || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Tamaño máximo: 5MB
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formatos: JPG, PNG, GIF
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="space-y-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Seleccionar Imagen
                  </Button>

                  {selectedFile && (
                    <Button
                      onClick={handleUploadAvatar}
                      disabled={uploadAvatarMutation.isPending}
                      className="w-full"
                    >
                      {uploadAvatarMutation.isPending ? (
                        <>Subiendo...</>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar Avatar
                        </>
                      )}
                    </Button>
                  )}

                  {user.avatar && (
                    <Button
                      onClick={handleDeleteAvatar}
                      disabled={deleteAvatarMutation.isPending}
                      variant="destructive"
                      className="w-full"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar Avatar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Seguridad */}
          <TabsContent value="security" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cambiar Contraseña</CardTitle>
                <CardDescription>
                  Actualiza tu contraseña para mantener tu cuenta segura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Contraseña Actual</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Tu contraseña actual"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending}
                  className="w-full"
                >
                  {changePasswordMutation.isPending ? (
                    <>Cambiando...</>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Cambiar Contraseña
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
