/**
 * Diálogo para crear un nuevo estudiante
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { estudianteService, type CreateEstudianteDTO } from '@/services/estudiante.service';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { User, Contact, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EstudianteCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EstudianteCreateDialog({ open, onOpenChange }: EstudianteCreateDialogProps) {
  const queryClient = useQueryClient();

  // Estados del formulario
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    lugarNacimiento: '',
    sexo: 'M' as 'M' | 'F',
    email: '',
    telefono: '',
    direccion: '',
    observaciones: '',
    estado: 'ACTIVO',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.dni) newErrors.dni = 'El DNI es requerido';
    else if (!/^\d{8}$/.test(formData.dni)) newErrors.dni = 'El DNI debe tener 8 dígitos';

    if (!formData.nombres?.trim()) newErrors.nombres = 'Los nombres son requeridos';
    if (!formData.apellidoPaterno?.trim()) newErrors.apellidoPaterno = 'El apellido paterno es requerido';
    if (!formData.apellidoMaterno?.trim()) newErrors.apellidoMaterno = 'El apellido materno es requerido';
    if (!formData.fechaNacimiento) newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida';

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.telefono && !/^\d{9}$/.test(formData.telefono)) {
      newErrors.telefono = 'El teléfono debe tener 9 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateEstudianteDTO) => estudianteService.createEstudiante(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estudiantes'] });
      toast.success('Estudiante creado exitosamente', { duration: 3000 });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Error al crear estudiante';
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('Por favor corrija los errores en el formulario', { duration: 3000 });
      return;
    }

    const data: CreateEstudianteDTO = {
      dni: formData.dni,
      nombres: formData.nombres,
      apellidoPaterno: formData.apellidoPaterno,
      apellidoMaterno: formData.apellidoMaterno,
      fechaNacimiento: new Date(formData.fechaNacimiento).toISOString(),
      lugarNacimiento: formData.lugarNacimiento || undefined,
      sexo: formData.sexo,
      email: formData.email || undefined,
      telefono: formData.telefono || undefined,
      direccion: formData.direccion || undefined,
      observaciones: formData.observaciones || undefined,
      estado: formData.estado,
    };

    createMutation.mutate(data);
  };

  const resetForm = () => {
    setFormData({
      dni: '',
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      fechaNacimiento: '',
      lugarNacimiento: '',
      sexo: 'M',
      email: '',
      telefono: '',
      direccion: '',
      observaciones: '',
      estado: 'ACTIVO',
    });
    setErrors({});
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-blue-600" />
            Crear Nuevo Estudiante
          </DialogTitle>
          <DialogDescription>
            Complete la información del estudiante. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
          <div className="space-y-6">
            {/* Datos Personales */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">Datos Personales</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dni">DNI <span className="text-red-500">*</span></Label>
                    <Input
                      id="dni"
                      value={formData.dni}
                      onChange={(e) => updateField('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="12345678"
                      maxLength={8}
                      className={errors.dni ? 'border-red-500' : ''}
                    />
                    {errors.dni && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.dni}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sexo">Sexo <span className="text-red-500">*</span></Label>
                    <Select value={formData.sexo} onValueChange={(v: 'M' | 'F') => updateField('sexo', v)}>
                      <SelectTrigger id="sexo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombres">Nombres <span className="text-red-500">*</span></Label>
                    <Input
                      id="nombres"
                      value={formData.nombres}
                      onChange={(e) => updateField('nombres', e.target.value)}
                      placeholder="Juan Carlos"
                      className={errors.nombres ? 'border-red-500' : ''}
                    />
                    {errors.nombres && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.nombres}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apellidoPaterno">Apellido Paterno <span className="text-red-500">*</span></Label>
                    <Input
                      id="apellidoPaterno"
                      value={formData.apellidoPaterno}
                      onChange={(e) => updateField('apellidoPaterno', e.target.value)}
                      placeholder="García"
                      className={errors.apellidoPaterno ? 'border-red-500' : ''}
                    />
                    {errors.apellidoPaterno && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.apellidoPaterno}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apellidoMaterno">Apellido Materno <span className="text-red-500">*</span></Label>
                    <Input
                      id="apellidoMaterno"
                      value={formData.apellidoMaterno}
                      onChange={(e) => updateField('apellidoMaterno', e.target.value)}
                      placeholder="Rodríguez"
                      className={errors.apellidoMaterno ? 'border-red-500' : ''}
                    />
                    {errors.apellidoMaterno && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.apellidoMaterno}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fechaNacimiento">Fecha de Nacimiento <span className="text-red-500">*</span></Label>
                    <Input
                      id="fechaNacimiento"
                      type="date"
                      value={formData.fechaNacimiento}
                      onChange={(e) => updateField('fechaNacimiento', e.target.value)}
                      className={errors.fechaNacimiento ? 'border-red-500' : ''}
                    />
                    {errors.fechaNacimiento && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.fechaNacimiento}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="lugarNacimiento">Lugar de Nacimiento</Label>
                    <Input
                      id="lugarNacimiento"
                      value={formData.lugarNacimiento}
                      onChange={(e) => updateField('lugarNacimiento', e.target.value)}
                      placeholder="Lima, Perú"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datos de Contacto */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Contact className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-lg">Datos de Contacto</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => updateField('telefono', e.target.value.replace(/\D/g, '').slice(0, 9))}
                      placeholder="987654321"
                      maxLength={9}
                      className={errors.telefono ? 'border-red-500' : ''}
                    />
                    {errors.telefono && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.telefono}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => updateField('direccion', e.target.value)}
                      placeholder="Av. Principal 123"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información Adicional */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-lg">Información Adicional</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => updateField('observaciones', e.target.value)}
                      rows={3}
                      placeholder="Notas adicionales..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={formData.estado} onValueChange={(v) => updateField('estado', v)}>
                      <SelectTrigger id="estado">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVO">Activo</SelectItem>
                        <SelectItem value="INACTIVO">Inactivo</SelectItem>
                        <SelectItem value="EGRESADO">Egresado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Crear Estudiante'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
