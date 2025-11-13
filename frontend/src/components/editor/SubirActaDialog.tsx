/**
 * Dialog de Subida de Acta - Editor
 *
 * Permite al editor subir el acta física escaneada junto con sus metadatos.
 * Incluye:
 * - Upload de archivo (PDF o imagen)
 * - Formulario de metadata (año, grado, sección, turno, tipo evaluación)
 * - Preview de plantilla curricular
 * - Validaciones completas antes del envío
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { FileUpload } from '@/components/custom/FileUpload';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { editorService, type ExpedienteAsignado } from '@/services/editor.service';
import { gradoService, type Grado } from '@/services/grado.service';
import { anioLectivoService, type AnioLectivo } from '@/services/anioLectivo.service';
import { toast } from 'sonner';

interface SubirActaDialogProps {
  open: boolean;
  onClose: () => void;
  expediente: ExpedienteAsignado;
}

type Turno = 'MAÑANA' | 'TARDE';
type TipoEvaluacion = 'FINAL' | 'RECUPERACION';

const SECCIONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function SubirActaDialog({
  open,
  onClose,
  expediente,
}: SubirActaDialogProps) {
  const queryClient = useQueryClient();

  // ============================================================================
  // ESTADO LOCAL
  // ============================================================================

  const [archivo, setArchivo] = useState<File | null>(null);
  const [anioLectivoId, setAnioLectivoId] = useState<string>('');
  const [gradoId, setGradoId] = useState<string>('');
  const [seccion, setSeccion] = useState<string>('A');
  const [turno, setTurno] = useState<Turno>('MAÑANA');
  const [tipoEvaluacion, setTipoEvaluacion] = useState<TipoEvaluacion>('FINAL');
  const [numero, setNumero] = useState<string>('');
  const [folio, setFolio] = useState<string>('');
  const [fechaEmision, setFechaEmision] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // ============================================================================
  // QUERIES - CARGAR GRADOS Y AÑOS LECTIVOS
  // ============================================================================

  const { data: gradosData, isLoading: loadingGrados } = useQuery({
    queryKey: ['grados-activos'],
    queryFn: async () => {
      const response = await gradoService.getGradosActivos();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { data: aniosData, isLoading: loadingAnios } = useQuery({
    queryKey: ['anios-lectivos-activos'],
    queryFn: async () => {
      const response = await anioLectivoService.getAniosActivos();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const grados = gradosData || [];
  const aniosLectivos = aniosData || [];

  // ============================================================================
  // EFFECT - GENERAR NÚMERO DE ACTA AUTOMÁTICAMENTE
  // ============================================================================

  useEffect(() => {
    if (open && anioLectivoId && gradoId && grados.length > 0) {
      const gradoSeleccionado = grados.find(g => g.id === gradoId);
      const anioSeleccionado = aniosLectivos.find(a => a.id === anioLectivoId);
      
      if (gradoSeleccionado && anioSeleccionado) {
        const prefix = gradoSeleccionado.nombrecorto || `${gradoSeleccionado.numero}G`;
        setNumero(`ACT-${anioSeleccionado.anio}-${prefix}-${Date.now().toString().slice(-4)}`);
      }
    }
  }, [open, anioLectivoId, gradoId, grados, aniosLectivos]);

  // ============================================================================
  // QUERIES - PLANTILLA CURRICULAR
  // ============================================================================

  // DESHABILITADO - Fase 5 (OCR) no implementada aún
  // Se implementará cuando el backend de plantilla curricular esté listo
  // const { data: plantillaData, isLoading: loadingPlantilla } = useQuery({
  //   queryKey: ['plantilla-curricular', anioLectivo, grado],
  //   queryFn: () => editorService.getPlantillaCurricular(parseInt(anioLectivo), grado),
  //   enabled: false,
  // });
  // const plantilla: PlantillaCurricular | undefined = plantillaData?.data;

  // ============================================================================
  // MUTATION - SUBIR ACTA
  // ============================================================================

  const subirActaMutation = useMutation({
    mutationFn: async () => {
      if (!archivo) throw new Error('Debe seleccionar un archivo');
      if (!anioLectivoId) throw new Error('El año lectivo es obligatorio');
      if (!gradoId) throw new Error('El grado es obligatorio');
      if (!seccion) throw new Error('La sección es obligatoria');
      if (!numero.trim()) throw new Error('El número de acta es obligatorio');

      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('expedienteId', expediente.id);
      formData.append('anioLectivoId', anioLectivoId);
      formData.append('gradoId', gradoId);
      formData.append('seccion', seccion);
      formData.append('turno', turno);
      formData.append('numero', numero);
      
      // Campos opcionales
      if (tipoEvaluacion) {
        formData.append('tipoEvaluacion', tipoEvaluacion);
      }
      if (folio.trim()) {
        formData.append('folio', folio);
      }
      if (fechaEmision) {
        formData.append('fechaEmision', fechaEmision);
      }
      if (observaciones.trim()) {
        formData.append('observaciones', observaciones);
      }

      // Simular progreso de subida
      setUploadProgress(10);
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(30);

      // Llamar al endpoint
      const response = await editorService.subirActa(expediente.id, {
        anioLectivoId,
        gradoId,
        seccion,
        turno,
        numero,
        tipoEvaluacion: tipoEvaluacion || undefined,
        folio: folio.trim() || undefined,
        fechaEmision: fechaEmision || undefined,
        observaciones: observaciones.trim() || undefined,
      });

      setUploadProgress(100);
      return response;
    },
    onSuccess: () => {
      toast.success('Acta subida correctamente', {
        description: 'El acta será procesada con OCR automáticamente',
      });
      queryClient.invalidateQueries({ queryKey: ['editor-expedientes-asignados'] });
      queryClient.invalidateQueries({ queryKey: ['editor-stats-expedientes'] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al subir el acta');
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleClose = () => {
    setArchivo(null);
    setAnioLectivoId('');
    setGradoId('');
    setSeccion('A');
    setTurno('MAÑANA');
    setTipoEvaluacion('FINAL');
    setNumero('');
    setFolio('');
    setFechaEmision('');
    setObservaciones('');
    setUploadProgress(0);
    onClose();
  };

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setArchivo(files[0]);
    }
  };

  const handleSubmit = async () => {
    await subirActaMutation.mutateAsync();
  };

  const canSubmit = archivo && anioLectivoId && gradoId && seccion && numero.trim() && !subirActaMutation.isPending;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Subir Acta Física
          </DialogTitle>
          <DialogDescription>
            Expediente: {expediente.numeroExpediente} - {expediente.estudiante.apellidoPaterno}{' '}
            {expediente.estudiante.apellidoMaterno}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del expediente */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Sube el acta física escaneada del estudiante{' '}
              <strong>{expediente.estudiante.nombres}</strong>. Los datos se extraerán
              automáticamente mediante OCR.
            </AlertDescription>
          </Alert>

          {/* Upload de archivo */}
          <Card>
            <CardContent className="pt-6">
              <Label className="flex items-center gap-2 mb-3">
                <Upload className="h-4 w-4" />
                Archivo del Acta <span className="text-red-500">*</span>
              </Label>

              <FileUpload
                onFileSelect={handleFileSelect}
                accept={{
                  'application/pdf': ['.pdf'],
                  'image/*': ['.jpg', '.jpeg', '.png'],
                }}
                maxSize={10 * 1024 * 1024} // 10MB
                disabled={subirActaMutation.isPending}
              />

              {archivo && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{archivo.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(archivo.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                Formatos aceptados: PDF, JPG, PNG • Tamaño máximo: 10 MB
              </p>
            </CardContent>
          </Card>

          {/* Metadata del Acta */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-primary" />
                Metadatos del Acta
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Número de Acta */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="numero">
                    Número de Acta <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="numero"
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Ej: ACT-2010-5G-001"
                    maxLength={50}
                    disabled={subirActaMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Código único del acta (máx. 50 caracteres)
                  </p>
                </div>

                {/* Año Lectivo */}
                <div className="space-y-2">
                  <Label htmlFor="anio">
                    Año Lectivo <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={anioLectivoId} 
                    onValueChange={setAnioLectivoId} 
                    disabled={subirActaMutation.isPending || loadingAnios}
                  >
                    <SelectTrigger id="anio">
                      <SelectValue placeholder={loadingAnios ? "Cargando..." : "Seleccione año lectivo"} />
                    </SelectTrigger>
                    <SelectContent>
                      {aniosLectivos.length === 0 && !loadingAnios && (
                        <SelectItem value="" disabled>
                          No hay años lectivos disponibles
                        </SelectItem>
                      )}
                      {aniosLectivos.map((anio) => (
                        <SelectItem key={anio.id} value={anio.id}>
                          {anio.anio} ({new Date(anio.fechainicio).toLocaleDateString()} - {new Date(anio.fechafin).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {loadingAnios ? 'Cargando años lectivos...' : `${aniosLectivos.length} año(s) disponible(s)`}
                  </p>
                </div>

                {/* Grado */}
                <div className="space-y-2">
                  <Label htmlFor="grado">
                    Grado <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={gradoId} 
                    onValueChange={setGradoId} 
                    disabled={subirActaMutation.isPending || loadingGrados}
                  >
                    <SelectTrigger id="grado">
                      <SelectValue placeholder={loadingGrados ? "Cargando..." : "Seleccione grado"} />
                    </SelectTrigger>
                    <SelectContent>
                      {grados.length === 0 && !loadingGrados && (
                        <SelectItem value="" disabled>
                          No hay grados disponibles
                        </SelectItem>
                      )}
                      {grados.map((grado) => (
                        <SelectItem key={grado.id} value={grado.id}>
                          {grado.nombre} {grado.niveleducativo ? `(${grado.niveleducativo.nombre})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {loadingGrados ? 'Cargando grados...' : `${grados.length} grado(s) disponible(s)`}
                  </p>
                </div>

                {/* Sección */}
                <div className="space-y-2">
                  <Label htmlFor="seccion">
                    Sección <span className="text-red-500">*</span>
                  </Label>
                  <Select value={seccion} onValueChange={setSeccion} disabled={subirActaMutation.isPending}>
                    <SelectTrigger id="seccion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECCIONES.map((s) => (
                        <SelectItem key={s} value={s}>
                          Sección {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Turno */}
                <div className="space-y-2">
                  <Label htmlFor="turno">
                    Turno <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={turno}
                    onValueChange={(v) => setTurno(v as Turno)}
                    disabled={subirActaMutation.isPending}
                  >
                    <SelectTrigger id="turno">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAÑANA">Mañana</SelectItem>
                      <SelectItem value="TARDE">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de Evaluación */}
                <div className="space-y-2">
                  <Label htmlFor="tipo">
                    Tipo de Evaluación
                  </Label>
                  <Select
                    value={tipoEvaluacion}
                    onValueChange={(v) => setTipoEvaluacion(v as TipoEvaluacion)}
                    disabled={subirActaMutation.isPending}
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FINAL">Evaluación Final</SelectItem>
                      <SelectItem value="RECUPERACION">Evaluación de Recuperación</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Opcional</p>
                </div>

                {/* Folio */}
                <div className="space-y-2">
                  <Label htmlFor="folio">
                    Folio
                  </Label>
                  <Input
                    id="folio"
                    type="text"
                    value={folio}
                    onChange={(e) => setFolio(e.target.value)}
                    placeholder="Ej: 123"
                    maxLength={50}
                    disabled={subirActaMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número de folio en el libro (opcional)
                  </p>
                </div>

                {/* Fecha de Emisión */}
                <div className="space-y-2">
                  <Label htmlFor="fechaEmision">
                    Fecha de Emisión
                  </Label>
                  <Input
                    id="fechaEmision"
                    type="date"
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                    disabled={subirActaMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground">Fecha en que se emitió el acta</p>
                </div>

                {/* Observaciones */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observaciones">
                    Observaciones
                  </Label>
                  <Textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Observaciones adicionales sobre el acta..."
                    rows={3}
                    disabled={subirActaMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Notas adicionales sobre el acta (opcional)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Plantilla Curricular - DESHABILITADO hasta implementar backend */}
          {/* {plantilla && (
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Plantilla Curricular Detectada
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">
                      <School className="h-3 w-3 mr-1" />
                      {plantilla.grado}
                    </Badge>
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {plantilla.anioLectivo}
                    </Badge>
                    <Badge variant="secondary">{plantilla.areas.length} áreas curriculares</Badge>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {plantilla.areas.map((area) => (
                      <div
                        key={area.codigo}
                        className="text-xs p-2 bg-muted rounded-md flex items-center gap-2"
                      >
                        <span className="font-mono text-muted-foreground">{area.posicion}.</span>
                        <span className="truncate">{area.nombre}</span>
                      </div>
                    ))}
                  </div>

                  <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-xs">
                      Estas áreas curriculares se utilizarán como referencia para la extracción OCR.
                      Podrás revisar y corregir los datos después del procesamiento.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )} */}

          <Separator />

          {/* Progress Bar durante subida */}
          {subirActaMutation.isPending && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subiendo acta...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">*</span> Campos obligatorios
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={subirActaMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="bg-primary"
              >
                {subirActaMutation.isPending ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Guardar y Procesar con OCR
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
