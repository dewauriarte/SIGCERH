/**
 * Dialog para Editar Libro de Actas
 * Carga datos existentes y permite actualización
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  Save,
  Loader2,
} from 'lucide-react';
import { libroService, type UpdateLibroDTO } from '@/services/libro.service';
import { nivelEducativoService } from '@/services/nivel-educativo.service';

interface LibroEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  libroId: string | null;
}

interface FormErrors {
  codigo?: string;
  descripcion?: string;
  anio_inicio?: string;
  anio_fin?: string;
}

export function LibroEditDialog({ open, onOpenChange, libroId }: LibroEditDialogProps) {
  const queryClient = useQueryClient();

  // Query para niveles educativos
  const { data: nivelesData } = useQuery({
    queryKey: ['niveles-educativos-activos'],
    queryFn: () => nivelEducativoService.getNivelesEducativosActivos(),
  });

  const niveles = nivelesData?.data || [];

  const [formData, setFormData] = useState<UpdateLibroDTO>({
    codigo: '',
    nivel_id: undefined,
    nombre: '',
    descripcion: '',
    tipo_acta: undefined,
    ubicacion_fisica: '',
    anio_inicio: undefined,
    anio_fin: undefined,
    folio_inicio: undefined,
    folio_fin: undefined,
    total_folios: undefined,
    estante: '',
    seccion_archivo: undefined,
    estado: 'ACTIVO',
    observaciones: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Cargar datos del libro
  const { data: libroResponse, isLoading } = useQuery({
    queryKey: ['libro', libroId],
    queryFn: () => libroService.getLibro(libroId!),
    enabled: open && !!libroId,
  });

  const libro = libroResponse?.data;

  // Cargar datos cuando se obtiene el libro
  useEffect(() => {
    if (libro) {
      setFormData({
        codigo: libro.codigo || '',
        nivel_id: libro.nivel_id || undefined,
        nombre: libro.nombre || '',
        descripcion: libro.descripcion || '',
        tipo_acta: libro.tipo_acta || undefined,
        ubicacion_fisica: libro.ubicacion_fisica || '',
        anio_inicio: libro.anio_inicio || undefined,
        anio_fin: libro.anio_fin || undefined,
        folio_inicio: libro.folio_inicio || undefined,
        folio_fin: libro.folio_fin || undefined,
        total_folios: libro.total_folios || undefined,
        estante: libro.estante || '',
        seccion_archivo: libro.seccion_archivo || undefined,
        estado: libro.estado || 'ACTIVO',
        observaciones: libro.observaciones || '',
      });
    }
  }, [libro]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateLibroDTO) => libroService.updateLibro(libroId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['libros'] });
      queryClient.invalidateQueries({ queryKey: ['libro', libroId] });
      toast.success('Libro actualizado', {
        description: 'Los cambios se han guardado exitosamente.',
      });
      handleClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string; errors?: Array<{ message: string; path: string[] }> } } };
      
      // Si hay errores de validación específicos
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const validationErrors = err.response.data.errors;
        const errorMessages = validationErrors.map(e => e.message).join(', ');
        
        toast.error('Error de validación', {
          description: errorMessages,
          duration: 5000,
        });
      } else {
        toast.error('Error al actualizar libro', {
          description: err.response?.data?.message || 'No se pudo actualizar el libro. Verifica los datos e intenta nuevamente.',
          duration: 4000,
        });
      }
    },
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.codigo?.trim()) {
      newErrors.codigo = 'El código es requerido';
    }

    if (!formData.descripcion?.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }

    // Validar año inicio
    if (formData.anio_inicio !== undefined) {
      if (formData.anio_inicio < 1985) {
        newErrors.anio_inicio = 'El año de inicio debe ser mayor o igual a 1985';
      } else if (formData.anio_inicio > 2012) {
        newErrors.anio_inicio = 'El año de inicio debe ser menor o igual a 2012';
      }
    }

    // Validar año fin
    if (formData.anio_fin !== undefined) {
      if (formData.anio_fin < 1985) {
        newErrors.anio_fin = 'El año de fin debe ser mayor o igual a 1985';
      } else if (formData.anio_fin > 2012) {
        newErrors.anio_fin = 'El año de fin debe ser menor o igual a 2012';
      }
    }

    // Validar rango de años
    if (formData.anio_inicio && formData.anio_fin) {
      if (formData.anio_inicio > formData.anio_fin) {
        newErrors.anio_fin = 'El año fin debe ser mayor o igual al año inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('Formulario incompleto', {
        description: 'Por favor complete todos los campos requeridos.',
      });
      return;
    }

    updateMutation.mutate(formData);
  };

  const handleClose = () => {
    setErrors({});
    onOpenChange(false);
  };

  const updateField = (field: keyof UpdateLibroDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Editar Libro de Actas
          </DialogTitle>
          <DialogDescription>
            Modifique la información del libro. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Información Básica */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Información Básica</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Código */}
                  <div className="space-y-2">
                    <Label htmlFor="codigo">
                      Código <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="codigo"
                      placeholder="Ej: LIBRO-001"
                      value={formData.codigo}
                      onChange={(e) => updateField('codigo', e.target.value)}
                      className={errors.codigo ? 'border-destructive' : ''}
                    />
                    {errors.codigo && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.codigo}
                      </p>
                    )}
                  </div>

                  {/* Nivel Educativo */}
                  <div className="space-y-2">
                    <Label htmlFor="nivel_id">Nivel Educativo</Label>
                    <Select value={formData.nivel_id} onValueChange={(value) => updateField('nivel_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        {niveles.map((nivel) => (
                          <SelectItem key={nivel.id} value={nivel.id}>
                            {nivel.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nombre */}
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Libro</Label>
                    <Input
                      id="nombre"
                      placeholder="Ej: Libro de Actas de Primaria 2010"
                      value={formData.nombre}
                      onChange={(e) => updateField('nombre', e.target.value)}
                    />
                  </div>

                  {/* Estado */}
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={formData.estado} onValueChange={(value) => updateField('estado', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVO">Activo</SelectItem>
                        <SelectItem value="EN_USO">En Uso</SelectItem>
                        <SelectItem value="COMPLETO">Completo</SelectItem>
                        <SelectItem value="ARCHIVADO">Archivado</SelectItem>
                        <SelectItem value="DETERIORADO">Deteriorado</SelectItem>
                        <SelectItem value="PERDIDO">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sección de Archivo */}
                  <div className="space-y-2">
                    <Label htmlFor="seccion_archivo">Sección de Archivo</Label>
                    <Select value={formData.seccion_archivo} onValueChange={(value) => updateField('seccion_archivo', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sección" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HISTORICOS">Históricos</SelectItem>
                        <SelectItem value="ACTIVOS">Activos</SelectItem>
                        <SelectItem value="ARCHIVO_CENTRAL">Archivo Central</SelectItem>
                        <SelectItem value="DIRECCION">Dirección</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Descripción */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="descripcion">
                      Descripción <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Descripción del libro de actas"
                      value={formData.descripcion}
                      onChange={(e) => updateField('descripcion', e.target.value)}
                      className={errors.descripcion ? 'border-destructive' : ''}
                      rows={3}
                    />
                    {errors.descripcion && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ubicación y Detalles */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Ubicación y Detalles</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Ubicación Física */}
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="ubicacion">Ubicación Física</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="ubicacion"
                        placeholder="Ej: Archivo Principal - Estante 3"
                        value={formData.ubicacion_fisica}
                        onChange={(e) => updateField('ubicacion_fisica', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Año Inicio */}
                  <div className="space-y-2">
                    <Label htmlFor="anio_inicio">
                      Año Inicio <span className="text-xs text-muted-foreground font-normal">(1985-2012)</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="anio_inicio"
                        type="number"
                        placeholder="1985-2012"
                        value={formData.anio_inicio || ''}
                        onChange={(e) => updateField('anio_inicio', e.target.value ? parseInt(e.target.value) : undefined)}
                        className={`pl-10 ${errors.anio_inicio ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.anio_inicio && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.anio_inicio}
                      </p>
                    )}
                  </div>

                  {/* Año Fin */}
                  <div className="space-y-2">
                    <Label htmlFor="anio_fin">
                      Año Fin <span className="text-xs text-muted-foreground font-normal">(1985-2012)</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="anio_fin"
                        type="number"
                        placeholder="1985-2012"
                        value={formData.anio_fin || ''}
                        onChange={(e) => updateField('anio_fin', e.target.value ? parseInt(e.target.value) : undefined)}
                        className={`pl-10 ${errors.anio_fin ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.anio_fin && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.anio_fin}
                      </p>
                    )}
                  </div>

                  {/* Folio Inicio */}
                  <div className="space-y-2">
                    <Label htmlFor="folio_inicio">Folio Inicio</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="folio_inicio"
                        type="number"
                        placeholder="1"
                        value={formData.folio_inicio || ''}
                        onChange={(e) => updateField('folio_inicio', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Folio Fin */}
                  <div className="space-y-2">
                    <Label htmlFor="folio_fin">Folio Fin</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="folio_fin"
                        type="number"
                        placeholder="200"
                        value={formData.folio_fin || ''}
                        onChange={(e) => updateField('folio_fin', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Total Folios */}
                  <div className="space-y-2">
                    <Label htmlFor="total_folios">Total de Folios</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="total_folios"
                        type="number"
                        placeholder="100"
                        value={formData.total_folios || ''}
                        onChange={(e) => updateField('total_folios', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Estante */}
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="estante">Estante</Label>
                    <Input
                      id="estante"
                      placeholder="Ej: E-05, Estante 3"
                      value={formData.estante}
                      onChange={(e) => updateField('estante', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observaciones */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    placeholder="Notas adicionales sobre el libro..."
                    value={formData.observaciones}
                    onChange={(e) => updateField('observaciones', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={updateMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending || isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
