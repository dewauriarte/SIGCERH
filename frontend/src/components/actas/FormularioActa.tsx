/**
 * Componente de Formulario de Acta Física
 * Con validación Zod y soporte para crear/editar
 * Actualizado: usa selects de base de datos para año lectivo y grado
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, X, Upload, FileText, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gradoService, type Grado } from '@/services/grado.service';
import { anioLectivoService, type AnioLectivo } from '@/services/anioLectivo.service';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ActaFisica, ActaCreateDTO, ActaUpdateDTO } from '@/services/acta.service';

// ============================================================================
// ESQUEMA DE VALIDACIÓN ZOD
// ============================================================================

const actaSchema = z.object({
  anioLectivoId: z.string().uuid('Debe seleccionar un año lectivo válido'),
  gradoId: z.string().uuid('Debe seleccionar un grado válido'),
  seccion: z.string().min(1, 'La sección es requerida'),
  turno: z.enum(['MAÑANA', 'TARDE', 'NOCHE'], {
    required_error: 'El turno es requerido',
  }),
  tipoEvaluacion: z.enum(['FINAL', 'RECUPERACION', 'SUBSANACION'], {
    required_error: 'El tipo de evaluación es requerido',
  }),
  numero: z.string().optional(),
  libroId: z.string().uuid().optional(),
  folio: z.string().optional(),
  colegioOrigen: z.string().optional(),
  observaciones: z.string().optional(),
});

type ActaFormValues = z.infer<typeof actaSchema>;

// ============================================================================
// PROPS DEL COMPONENTE
// ============================================================================

interface FormularioActaProps {
  acta?: ActaFisica; // Si existe, es modo edición
  solicitudId: string;
  onSubmit: (data: ActaCreateDTO | ActaUpdateDTO) => void;
  onCancel: () => void;
  isLoading?: boolean;
  archivoActual?: File | null;
  onArchivoChange?: (archivo: File | null) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function FormularioActa({
  acta,
  solicitudId,
  onSubmit,
  onCancel,
  isLoading = false,
  archivoActual,
  onArchivoChange,
}: FormularioActaProps) {
  const [archivo, setArchivo] = useState<File | null>(archivoActual || null);

  // Query para años lectivos
  const { data: aniosLectivosData } = useQuery({
    queryKey: ['anios-lectivos-todos'],
    queryFn: async () => {
      const response = await anioLectivoService.getAniosLectivos({ limit: 100 });
      return response.data;
    },
  });

  // Query para grados activos
  const { data: gradosData } = useQuery({
    queryKey: ['grados-activos'],
    queryFn: async () => {
      const response = await gradoService.getGradosActivos();
      return response.data;
    },
  });

  const aniosLectivos = aniosLectivosData || [];
  const grados = gradosData || [];

  const form = useForm<ActaFormValues>({
    resolver: zodResolver(actaSchema),
    defaultValues: acta
      ? {
          anioLectivoId: acta.aniolectivo_id || '',
          gradoId: acta.grado_id || '',
          seccion: acta.seccion || '',
          turno: acta.turno || 'MAÑANA',
          tipoEvaluacion: acta.tipoevaluacion || 'FINAL',
          numero: acta.numero || '',
          libroId: acta.libro_id || '',
          folio: acta.folio || '',
          colegioOrigen: acta.colegioorden || undefined,
          observaciones: acta.observaciones || undefined,
        }
      : {
          anioLectivoId: '',
          gradoId: '',
          seccion: 'A',
          turno: 'MAÑANA',
          tipoEvaluacion: 'FINAL',
          numero: '',
          libroId: '',
          folio: '',
        },
  });

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setArchivo(file);
    onArchivoChange?.(file);
  };

  const handleSubmit = (values: ActaFormValues) => {
    if (acta) {
      // Modo edición
      onSubmit(values as ActaUpdateDTO);
    } else {
      // Modo creación
      onSubmit({
        ...values,
        solicitudId,
      } as ActaCreateDTO);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Información del Acta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información del Acta Física
            </CardTitle>
            <CardDescription>
              Datos de identificación y ubicación del acta original
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Año Lectivo y Grado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="anioLectivoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año Lectivo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione año" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {aniosLectivos.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No hay años lectivos disponibles
                          </div>
                        ) : (
                          [...aniosLectivos]
                            .sort((a, b) => b.anio - a.anio)
                            .map((anio: AnioLectivo) => (
                              <SelectItem key={anio.id} value={anio.id}>
                                {anio.anio}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>Año del acta (1985-2012)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gradoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grado *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione grado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {grados.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No hay grados disponibles
                          </div>
                        ) : (
                          grados.map((grado: Grado) => (
                            <SelectItem key={grado.id} value={grado.id}>
                              {grado.nombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sección y Turno */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="seccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sección *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: A, B, C" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="turno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turno *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione turno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MAÑANA">Mañana</SelectItem>
                        <SelectItem value="TARDE">Tarde</SelectItem>
                        <SelectItem value="NOCHE">Noche</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tipo de Evaluación */}
            <FormField
              control={form.control}
              name="tipoEvaluacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Evaluación *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FINAL">Final</SelectItem>
                      <SelectItem value="RECUPERACION">Recuperación</SelectItem>
                      <SelectItem value="SUBSANACION">Subsanación</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Número, Libro y Folio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input placeholder="N° acta" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="libroId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Libro</FormLabel>
                    <FormControl>
                      <Input placeholder="ID del libro" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="folio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folio</FormLabel>
                    <FormControl>
                      <Input placeholder="Folio" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Colegio de Origen */}
            <FormField
              control={form.control}
              name="colegioOrigen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colegio de Origen (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre completo del colegio"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observaciones */}
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Comentarios adicionales sobre el acta..."
                      {...field}
                      value={field.value || ''}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Subir Archivo */}
        {!acta && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Archivo Escaneado (Opcional)
              </CardTitle>
              <CardDescription>
                Puede subir el archivo ahora o después de registrar el acta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="archivo">Imagen o PDF del Acta</Label>
                <Input
                  id="archivo"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleArchivoChange}
                  disabled={isLoading}
                />
                {archivo && (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      Archivo seleccionado: {archivo.name} (
                      {(archivo.size / 1024 / 1024).toFixed(2)} MB)
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {acta ? 'Actualizar Acta' : 'Guardar Acta'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

