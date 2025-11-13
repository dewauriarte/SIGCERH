/**
 * Página ValidarActaPage
 * Editor visual para validar y normalizar datos OCR de un acta física
 * Flujo: Ver JSON → Validar → Corregir → Normalizar → BD
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  Edit,
  Database,
  BookOpen,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { ValidadorNotasOCR } from '@/components/editor/ValidadorNotasOCR';
import { ListaEstudiantesOCR } from '@/components/editor/ListaEstudiantesOCR';
import { actaService } from '@/services/acta.service';
import { normalizacionService } from '@/services/normalizacion.service';
import type {
  DatosOCRExtraccion,
  ResultadoValidacionOCR,
  EstudianteOCRExtraccion,
} from '@/types/normalizacion.types';
import { cn } from '@/lib/utils';

export default function ValidarActaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [datosEditados, setDatosEditados] = useState<DatosOCRExtraccion | null>(
    null
  );
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [progresoNormalizacion, setProgresoNormalizacion] = useState(0);

  // Query: Obtener acta
  const {
    data: actaResponse,
    isLoading: isLoadingActa,
    error: errorActa,
  } = useQuery({
    queryKey: ['acta', id],
    queryFn: () => actaService.getActaById(id!),
    enabled: !!id,
  });

  const acta = actaResponse?.data;

  // Query: Validar datos OCR
  const {
    data: validacionResponse,
    isLoading: isLoadingValidacion,
    refetch: refetchValidacion,
  } = useQuery({
    queryKey: ['validacion-acta', id],
    queryFn: () => normalizacionService.validarActa(id!),
    enabled: !!id && !!acta?.datosextraidosjson,
  });

  const validacion = validacionResponse?.data;

  // Mutation: Normalizar acta
  const normalizarMutation = useMutation({
    mutationFn: () => {
      const datos = datosEditados || acta?.datosextraidosjson;
      return normalizacionService.normalizarActa(id!, {
        datosExtraidos: datos,
      });
    },
    onSuccess: (response) => {
      const resultado = response.data;
      toast.success('Acta normalizada exitosamente', {
        description: `${resultado.estadisticas.estudiantes_procesados} estudiantes y ${resultado.estadisticas.notas_creadas} notas normalizadas`,
      });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['acta', id] });
      queryClient.invalidateQueries({ queryKey: ['actas'] });

      // Redirigir a lista después de un delay
      setTimeout(() => {
        navigate('/editor/normalizar-actas');
      }, 2000);
    },
    onError: (error: any) => {
      toast.error('Error al normalizar acta', {
        description: error.response?.data?.message || error.message,
      });
      setProgresoNormalizacion(0);
    },
    onMutate: () => {
      // Simular progreso
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setProgresoNormalizacion(progress);
        if (progress >= 90) {
          clearInterval(interval);
        }
      }, 200);
    },
  });

  // Efecto: Inicializar datos editados
  useEffect(() => {
    if (acta?.datosextraidosjson && !datosEditados) {
      setDatosEditados(acta.datosextraidosjson);
    }
  }, [acta, datosEditados]);

  // Efecto: Revalidar al cambiar datos
  useEffect(() => {
    if (datosEditados) {
      refetchValidacion();
    }
  }, [datosEditados, refetchValidacion]);

  // Handlers
  const handleEstudiantesChange = (estudiantes: EstudianteOCRExtraccion[]) => {
    if (datosEditados) {
      setDatosEditados({
        ...datosEditados,
        estudiantes,
      });
    }
  };

  const handleNormalizar = () => {
    if (!validacion?.valido) {
      toast.error('No se puede normalizar', {
        description: 'Corrija los errores de validación primero',
      });
      return;
    }
    setMostrarConfirmacion(true);
  };

  const confirmarNormalizacion = () => {
    setMostrarConfirmacion(false);
    normalizarMutation.mutate();
  };

  // Loading state
  if (isLoadingActa) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando acta...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (errorActa || !acta) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Error al cargar acta</h2>
          <p className="text-muted-foreground">
            {errorActa?.message || 'Acta no encontrada'}
          </p>
          <Button onClick={() => navigate('/editor/normalizar-actas')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  // Sin datos OCR
  if (!acta.datosextraidosjson || !acta.procesadoconia) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto" />
          <h2 className="text-2xl font-bold">Acta sin procesar con OCR</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Esta acta no ha sido procesada con OCR todavía. Debe procesarla primero
            desde la página "Procesar OCR" antes de poder normalizarla.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/editor/normalizar-actas')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a la lista
            </Button>
            <Button onClick={() => navigate('/editor/procesar-ocr')}>
              Ir a Procesar OCR
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const datosOCR: DatosOCRExtraccion = datosEditados || acta.datosextraidosjson;

  // Validar estructura de datos OCR
  if (!datosOCR || !datosOCR.estudiantes || !Array.isArray(datosOCR.estudiantes)) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Estructura de datos inválida</h2>
          <p className="text-muted-foreground">
            El JSON extraído por OCR no tiene el formato esperado
          </p>
          <Button onClick={() => navigate('/editor/normalizar-actas')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/editor/normalizar-actas')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold">Validar y Normalizar Acta</h1>
          </div>
          <p className="text-muted-foreground">
            Revise los datos extraídos por OCR y realice correcciones si es necesario
          </p>
        </div>

        <Button
          onClick={handleNormalizar}
          disabled={
            !validacion?.valido ||
            normalizarMutation.isPending ||
            isLoadingValidacion
          }
          size="lg"
          className="gap-2"
        >
          {normalizarMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Normalizando...
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              Normalizar Acta
            </>
          )}
        </Button>
      </div>

      {/* Progress Bar (si está normalizando) */}
      {normalizarMutation.isPending && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Normalizando datos...</span>
                <span className="font-medium">{progresoNormalizacion}%</span>
              </div>
              <Progress value={progresoNormalizacion} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Insertando estudiantes y notas en la base de datos
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info del Acta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información del Acta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Número</p>
              <p className="font-semibold">{acta.numero}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Año Lectivo
              </p>
              <p className="font-semibold">
                {acta.aniolectivo?.anio || 'N/A'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                Grado
              </p>
              <p className="font-semibold">{acta.grado?.nombre || 'N/A'}</p>
            </div>

            {acta.libro && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Libro/Folio
                </p>
                <p className="font-semibold">
                  {typeof acta.libro === 'object' ? acta.libro.codigo : acta.libro}
                  {acta.folio && ` / ${acta.folio}`}
                </p>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              Procesada con OCR
            </Badge>
            {datosOCR.metadata?.modelo_ia && (
              <Badge variant="outline">
                Modelo: {datosOCR.metadata.modelo_ia}
              </Badge>
            )}
            {datosOCR.metadata?.confianza_promedio !== undefined && (
              <Badge variant="outline">
                Confianza: {datosOCR.metadata.confianza_promedio.toFixed(1)}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validador de Notas */}
      <ValidadorNotasOCR
        validacion={validacion}
        isLoading={isLoadingValidacion}
      />

      {/* Tabs: Editor / JSON */}
      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="editor" className="gap-2">
            <Edit className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="json" className="gap-2">
            <Eye className="h-4 w-4" />
            JSON Original
          </TabsTrigger>
        </TabsList>

        {/* Tab: Editor */}
        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Tabla Editable de Estudiantes
                </CardTitle>
                <Badge>
                  {datosOCR.estudiantes.length} estudiante
                  {datosOCR.estudiantes.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ListaEstudiantesOCR
                estudiantes={datosOCR.estudiantes}
                areasDetectadas={datosOCR.metadata?.areas_detectadas || []}
                mapeoAreas={validacion?.mapeoAreas?.mapeosExitosos}
                onEstudiantesChange={handleEstudiantesChange}
                readOnly={normalizarMutation.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: JSON Original */}
        <TabsContent value="json">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                JSON Original (Solo Lectura)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(acta.datosextraidosjson, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Confirmación */}
      <AlertDialog open={mostrarConfirmacion} onOpenChange={setMostrarConfirmacion}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Confirmar Normalización
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Está a punto de normalizar el acta{' '}
                  <strong>{acta.numero}</strong> e insertar los datos en la base de
                  datos.
                </p>
                <div className="bg-muted p-3 rounded space-y-1 text-sm">
                  <p>
                    <strong>Estudiantes:</strong> {datosOCR.estudiantes.length}
                  </p>
                  <p>
                    <strong>Áreas curriculares:</strong>{' '}
                    {datosOCR.metadata?.areas_detectadas?.length || 0}
                  </p>
                  <p>
                    <strong>Total notas:</strong>{' '}
                    {datosOCR.estudiantes.length *
                      (datosOCR.metadata?.areas_detectadas?.length || 0)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Una vez normalizada, el acta se marcará como procesada y los datos
                  estarán disponibles para generar certificados.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarNormalizacion}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar Normalización
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
