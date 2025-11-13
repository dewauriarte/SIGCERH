/**
 * Página para Procesar Actas con OCR de forma LIBRE
 * No está atada a expedientes - el editor sube cualquier acta y procesa
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Brain, Upload, Loader2, FileImage, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { editorService } from '@/services/editor.service';
import { gradoService, type Grado } from '@/services/grado.service';
import { anioLectivoService, type AnioLectivo } from '@/services/anioLectivo.service';

export default function ProcesarOCRLibrePage() {
  const navigate = useNavigate();

  // Queries para años lectivos y grados
  const { data: aniosLectivosData } = useQuery({
    queryKey: ['anios-lectivos-todos'],
    queryFn: async () => {
      const response = await anioLectivoService.getAniosLectivos({ limit: 100 });
      return response.data;
    },
  });

  const { data: gradosData } = useQuery({
    queryKey: ['grados-activos'],
    queryFn: async () => {
      const response = await gradoService.getGradosActivos();
      return response.data;
    },
  });

  const aniosLectivos = aniosLectivosData || [];
  const grados = gradosData || [];

  // Estados
  const [archivoActa, setArchivoActa] = useState<File | null>(null);
  const [previsualizacion, setPrevisualizacion] = useState<string | null>(null);
  const [metadata, setMetadata] = useState({
    anioLectivoId: '',
    gradoId: '',
    seccion: 'A',
    turno: 'MAÑANA',
    tipoEvaluacion: 'FINAL',
  });
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Máximo 10MB');
      return;
    }

    setArchivoActa(file);

    // Crear previsualización
    const reader = new FileReader();
    reader.onload = (e) => {
      setPrevisualizacion(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remover archivo
  const handleRemoveFile = () => {
    setArchivoActa(null);
    setPrevisualizacion(null);
  };

  // Procesar con OCR
  const procesarMutation = useMutation({
    mutationFn: async () => {
      if (!archivoActa) throw new Error('No hay archivo');

      // Validar metadata
      if (!metadata.anioLectivoId) throw new Error('Selecciona el año lectivo');
      if (!metadata.gradoId) throw new Error('Selecciona el grado');

      setProcesando(true);
      setProgreso(10);

      // Simular progreso visual
      const interval = setInterval(() => {
        setProgreso((prev) => Math.min(prev + 3, 85));
      }, 500);

      try {
        // Convertir imagen a base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(archivoActa);
        });
        const imageBase64 = await base64Promise;

        setProgreso(30);

        // Encontrar el año lectivo y grado seleccionados
        const anioLectivoSeleccionado = aniosLectivos.find((a: AnioLectivo) => a.id === metadata.anioLectivoId);
        const gradoSeleccionado = grados.find((g: Grado) => g.id === metadata.gradoId);

        console.log('DEBUG OCR:', {
          anioLectivoId: metadata.anioLectivoId,
          gradoId: metadata.gradoId,
          aniosLectivosDisponibles: aniosLectivos.length,
          gradosDisponibles: grados.length,
          anioLectivoSeleccionado,
          gradoSeleccionado
        });

        if (!anioLectivoSeleccionado || !gradoSeleccionado) {
          throw new Error(`Año lectivo o grado no encontrado. Año: ${anioLectivoSeleccionado?.anio || 'N/A'}, Grado: ${gradoSeleccionado?.nombre || 'N/A'}`);
        }

        // Llamar al backend para procesar OCR con Gemini
        const response = await editorService.procesarOCRLibre(
          {
            anioLectivo: anioLectivoSeleccionado.anio,
            grado: gradoSeleccionado.nombre,
            seccion: metadata.seccion,
            turno: metadata.turno,
            tipoEvaluacion: metadata.tipoEvaluacion,
          },
          imageBase64
        );

        clearInterval(interval);
        setProgreso(100);

        return response.data; // Devolver el resultado del OCR
      } catch (error) {
        clearInterval(interval);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('OCR Procesado con Gemini AI', {
        description: `${data.totalEstudiantes} estudiantes detectados con ${data.confianza}% de confianza`,
      });
      setProcesando(false);
      setProgreso(0);
      
      // Redirigir a página de revisión con los datos
      navigate('/editor/revisar-ocr-libre', {
        state: { resultadoOCR: data }
      });
    },
    onError: (error: any) => {
      setProcesando(false);
      setProgreso(0);
      toast.error('Error al procesar OCR', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  const handleProcesar = () => {
    procesarMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Dashboard
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8 text-purple-600" />
          Procesar Acta con OCR
        </h1>
        <p className="text-muted-foreground mt-2">
          Sube una imagen del acta física y extrae los datos con Gemini AI
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Columna izquierda: Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>1. Datos del Acta</CardTitle>
            <CardDescription>Ingresa la información del acta a procesar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Año Lectivo */}
            <div className="space-y-2">
              <Label htmlFor="anio">Año Lectivo *</Label>
              <Select value={metadata.anioLectivoId} onValueChange={(value) => setMetadata({ ...metadata, anioLectivoId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el año" />
                </SelectTrigger>
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
            </div>

            {/* Grado */}
            <div className="space-y-2">
              <Label htmlFor="grado">Grado *</Label>
              <Select value={metadata.gradoId} onValueChange={(value) => setMetadata({ ...metadata, gradoId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el grado" />
                </SelectTrigger>
                <SelectContent>
                  {grados.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No hay grados disponibles
                    </div>
                  ) : (
                    grados.map((grado: Grado) => (
                      <SelectItem key={grado.id} value={grado.id}>
                        {grado.nombre} {grado.niveleducativo ? `(${grado.niveleducativo.nombre})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Sección */}
            <div className="space-y-2">
              <Label htmlFor="seccion">Sección</Label>
              <Input
                id="seccion"
                value={metadata.seccion}
                onChange={(e) => setMetadata({ ...metadata, seccion: e.target.value.toUpperCase() })}
                placeholder="A"
                maxLength={2}
              />
            </div>

            {/* Turno */}
            <div className="space-y-2">
              <Label htmlFor="turno">Turno</Label>
              <Select value={metadata.turno} onValueChange={(value) => setMetadata({ ...metadata, turno: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAÑANA">Mañana</SelectItem>
                  <SelectItem value="TARDE">Tarde</SelectItem>
                  <SelectItem value="NOCHE">Noche</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo Evaluación */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Evaluación</Label>
              <Select value={metadata.tipoEvaluacion} onValueChange={(value) => setMetadata({ ...metadata, tipoEvaluacion: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FINAL">Final</SelectItem>
                  <SelectItem value="RECUPERACION">Recuperación</SelectItem>
                  <SelectItem value="SUBSANACION">Subsanación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Columna derecha: Upload */}
        <Card>
          <CardHeader>
            <CardTitle>2. Subir Imagen del Acta</CardTitle>
            <CardDescription>Imagen del acta física a procesar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!archivoActa ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent transition-colors"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-2">Click para subir archivo</p>
                <p className="text-xs text-muted-foreground">
                  Formatos: JPG, PNG, WEBP (máx. 10MB)
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Previsualización */}
                {previsualizacion && (
                  <div className="relative border rounded-lg overflow-hidden">
                    <img
                      src={previsualizacion}
                      alt="Previsualización"
                      className="w-full h-64 object-contain bg-gray-50 dark:bg-gray-900"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Info del archivo */}
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <FileImage className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{archivoActa.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(archivoActa.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                {/* Botón Procesar */}
                <Button
                  size="lg"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleProcesar}
                  disabled={!metadata.anioLectivoId || !metadata.gradoId || procesando}
                >
                  {procesando ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-5 w-5" />
                      Procesar con Gemini AI
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Progreso */}
      <Dialog open={procesando} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600 animate-pulse" />
              Procesando con Gemini AI
            </DialogTitle>
            <DialogDescription>
              Extrayendo datos del acta. Esto puede tomar 10-15 segundos...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Progress value={progreso} className="w-full" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Procesando...</span>
              <span>{progreso}%</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {progreso < 30 && 'Enviando imagen a Gemini...'}
                {progreso >= 30 && progreso < 70 && 'Extrayendo datos de estudiantes...'}
                {progreso >= 70 && progreso < 100 && 'Finalizando procesamiento...'}
                {progreso === 100 && '¡Completado!'}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

