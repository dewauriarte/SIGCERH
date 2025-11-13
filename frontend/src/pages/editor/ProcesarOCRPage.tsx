/**
 * Página para Procesar Expedientes con OCR
 * Lista expedientes en estado LISTO_PARA_OCR y permite procesarlos con Gemini
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Brain, Loader2, AlertCircle, Eye, FileText, Edit, Trash2, ArrowRight, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

import { editorService, type ExpedienteAsignado } from '@/services/editor.service';
import { actaService, type ActaFisica, type ActaCreateDTO, type ActaUpdateDTO } from '@/services/acta.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { FormularioActa } from '@/components/actas/FormularioActa';
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

export default function ProcesarOCRPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [progreso, setProgreso] = useState(0);
  
  // Estados para CRUD de Actas
  const [actaDialogOpen, setActaDialogOpen] = useState(false);
  const [actaSeleccionada, setActaSeleccionada] = useState<ActaFisica | null>(null);
  const [expedienteActual, setExpedienteActual] = useState<ExpedienteAsignado | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actaParaEliminar, setActaParaEliminar] = useState<string | null>(null);
  const [archivoActa, setArchivoActa] = useState<File | null>(null);

  // Obtener expedientes listos para OCR
  const { data: expedientesData, isLoading } = useQuery({
    queryKey: ['editor-expedientes-ocr', busqueda],
    queryFn: () =>
      editorService.getExpedientesAsignados({
        page: 1,
        limit: 100,
        estadoBusqueda: 'LISTO_PARA_OCR',
      }),
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  // Filtrar expedientes por búsqueda
  const expedientes = expedientesData?.data?.filter((exp) => {
    if (!busqueda.trim()) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      exp.numeroExpediente.toLowerCase().includes(searchLower) ||
      exp.estudiante.nombres.toLowerCase().includes(searchLower) ||
      exp.estudiante.apellidoPaterno.toLowerCase().includes(searchLower) ||
      exp.estudiante.apellidoMaterno.toLowerCase().includes(searchLower) ||
      exp.estudiante.numeroDocumento.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Mutation para procesar OCR
  const procesarMutation = useMutation({
    mutationFn: async (expedienteId: string) => {
      setProcesandoId(expedienteId);
      setProgreso(10);

      // Simular progreso
      const interval = setInterval(() => {
        setProgreso((prev) => Math.min(prev + 5, 85));
      }, 300);

      try {
        const response = await editorService.procesarOCR(expedienteId);
        clearInterval(interval);
        setProgreso(100);
        return response;
      } catch (error) {
        clearInterval(interval);
        throw error;
      }
    },
    onSuccess: (data, expedienteId) => {
      toast.success('OCR Procesado', {
        description: `${data.data.totalEstudiantes} estudiantes detectados`,
      });
      queryClient.invalidateQueries({ queryKey: ['editor-expedientes-ocr'] });
      queryClient.invalidateQueries({ queryKey: ['editor-expedientes-asignados'] });

      // Esperar un momento y redirigir a la página de revisión
      setTimeout(() => {
        setProcesandoId(null);
        setProgreso(0);
        navigate(`/editor/procesar-ocr/${expedienteId}/revisar`);
      }, 1000);
    },
    onError: (error: any) => {
      setProcesandoId(null);
      setProgreso(0);
      toast.error('Error al procesar OCR', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  const handleProcesar = (expediente: ExpedienteAsignado) => {
    procesarMutation.mutate(expediente.id);
  };

  const handleVerDetalle = (expediente: ExpedienteAsignado) => {
    // Navegar a la página de expedientes asignados con el detalle abierto
    navigate(`/editor/expedientes-asignados?detalle=${expediente.id}`);
  };

  // ============================================================================
  // CRUD DE ACTAS
  // ============================================================================

  // Abrir modal para crear acta
  const handleContinuarConActa = (expediente: ExpedienteAsignado) => {
    setExpedienteActual(expediente);
    setActaSeleccionada(null);
    setArchivoActa(null);
    setActaDialogOpen(true);
  };

  // Abrir modal para editar acta
  const handleEditarActa = (expediente: ExpedienteAsignado, acta: ActaFisica) => {
    setExpedienteActual(expediente);
    setActaSeleccionada(acta);
    setArchivoActa(null);
    setActaDialogOpen(true);
  };

  // Mutation para crear acta
  const crearActaMutation = useMutation({
    mutationFn: async (data: ActaCreateDTO) => {
      const result = await actaService.createActa(data);
      
      // Si hay archivo, subirlo
      if (archivoActa && result.data.id) {
        await actaService.subirArchivo(result.data.id, archivoActa);
      }
      
      return result;
    },
    onSuccess: () => {
      toast.success('Acta creada exitosamente');
      setActaDialogOpen(false);
      setArchivoActa(null);
      queryClient.invalidateQueries({ queryKey: ['editor-expedientes-ocr'] });
    },
    onError: (error: any) => {
      toast.error('Error al crear acta', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  // Mutation para actualizar acta
  const actualizarActaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ActaUpdateDTO }) => {
      return await actaService.updateActa(id, data);
    },
    onSuccess: () => {
      toast.success('Acta actualizada exitosamente');
      setActaDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['editor-expedientes-ocr'] });
    },
    onError: (error: any) => {
      toast.error('Error al actualizar acta', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  // Mutation para eliminar acta
  const eliminarActaMutation = useMutation({
    mutationFn: async (id: string) => {
      return await actaService.deleteActa(id);
    },
    onSuccess: () => {
      toast.success('Acta eliminada exitosamente');
      setDeleteDialogOpen(false);
      setActaParaEliminar(null);
      queryClient.invalidateQueries({ queryKey: ['editor-expedientes-ocr'] });
    },
    onError: (error: any) => {
      toast.error('Error al eliminar acta', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  // Handler para submit del formulario
  const handleSubmitActa = (data: ActaCreateDTO | ActaUpdateDTO) => {
    if (actaSeleccionada) {
      // Editar
      actualizarActaMutation.mutate({
        id: actaSeleccionada.id,
        data: data as ActaUpdateDTO,
      });
    } else {
      // Crear
      crearActaMutation.mutate(data as ActaCreateDTO);
    }
  };

  // Handler para eliminar
  const handleConfirmarEliminar = () => {
    if (actaParaEliminar) {
      eliminarActaMutation.mutate(actaParaEliminar);
    }
  };

  const isMutating = crearActaMutation.isPending || actualizarActaMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8 text-purple-600" />
          Procesar Expedientes con OCR
        </h1>
        <p className="text-muted-foreground mt-2">
          Procesa actas con Google Gemini AI para extraer datos de estudiantes
        </p>
      </div>

      {/* Buscador */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar por expediente, DNI, nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Listos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{expedientes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Procesando
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{procesandoId ? 1 : 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {procesandoId ? expedientes.length - 1 : expedientes.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Lista de Expedientes */}
      <div className="space-y-4">
        {expedientes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {busqueda
                  ? 'No se encontraron expedientes con ese criterio'
                  : 'No hay expedientes listos para procesar con OCR'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {expedientes.map((expediente) => (
                <ExpedienteCard
                  key={expediente.id}
                  expediente={expediente}
                  onProcesar={handleProcesar}
                  onVerDetalle={handleVerDetalle}
                  onContinuarConActa={handleContinuarConActa}
                  onEditarActa={handleEditarActa}
                  onEliminarActa={(id) => {
                    setActaParaEliminar(id);
                    setDeleteDialogOpen(true);
                  }}
                  procesando={procesandoId === expediente.id}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Modal de Progreso */}
      <Dialog open={procesandoId !== null} onOpenChange={() => {}}>
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

      {/* Modal CRUD de Acta */}
      <Dialog open={actaDialogOpen} onOpenChange={setActaDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              {actaSeleccionada ? 'Editar Acta Física' : 'Registrar Acta Física'}
            </DialogTitle>
            <DialogDescription>
              {expedienteActual && (
                <>
                  Expediente: {expedienteActual.numeroExpediente} -{' '}
                  {expedienteActual.estudiante.apellidoPaterno}{' '}
                  {expedienteActual.estudiante.apellidoMaterno},{' '}
                  {expedienteActual.estudiante.nombres}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {expedienteActual && (
            <FormularioActa
              acta={actaSeleccionada || undefined}
              solicitudId={expedienteActual.id}
              onSubmit={handleSubmitActa}
              onCancel={() => {
                setActaDialogOpen(false);
                setArchivoActa(null);
              }}
              isLoading={isMutating}
              archivoActual={archivoActa}
              onArchivoChange={setArchivoActa}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmación para Eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta acta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El acta será eliminada permanentemente del
              sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarEliminar}
              className="bg-destructive hover:bg-destructive/90"
            >
              {eliminarActaMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Componente para cada expediente
function ExpedienteCard({
  expediente,
  onProcesar,
  onVerDetalle,
  onContinuarConActa,
  onEditarActa,
  onEliminarActa,
  procesando,
}: {
  expediente: ExpedienteAsignado;
  onProcesar: (exp: ExpedienteAsignado) => void;
  onVerDetalle: (exp: ExpedienteAsignado) => void;
  onContinuarConActa: (exp: ExpedienteAsignado) => void;
  onEditarActa: (exp: ExpedienteAsignado, acta: ActaFisica) => void;
  onEliminarActa: (id: string) => void;
  procesando: boolean;
}) {
  // Parsear metadata del acta
  let metadataActa: ActaFisica | null = null;
  let tieneActa = false;
  try {
    const obs = JSON.parse((expediente as any).observaciones || '{}');
    if (obs.actaFisica) {
      metadataActa = obs.actaFisica;
      tieneActa = true;
    }
  } catch {}

  return (
    <Card className={procesando ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/10' : ''}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm font-semibold">
                    {expediente.numeroExpediente}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    LISTO PARA OCR
                  </Badge>
                </div>
                <p className="text-lg font-semibold">
                  {expediente.estudiante.apellidoPaterno} {expediente.estudiante.apellidoMaterno},{' '}
                  {expediente.estudiante.nombres}
                </p>
                <p className="text-sm text-muted-foreground">
                  DNI: {expediente.estudiante.numeroDocumento}
                </p>
              </div>
            </div>

            {/* Metadata del Acta */}
            {tieneActa && metadataActa && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default" className="bg-green-600">
                    <FileCheck className="h-3 w-3 mr-1" />
                    Acta Registrada
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm bg-muted/50 p-3 rounded-md">
                  <div>
                    <span className="text-muted-foreground">Año:</span>{' '}
                    <span className="font-medium">{metadataActa.anioLectivo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Grado:</span>{' '}
                    <span className="font-medium">{metadataActa.grado}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sección:</span>{' '}
                    <span className="font-medium">{metadataActa.seccion}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Turno:</span>{' '}
                    <span className="font-medium">{metadataActa.turno}</span>
                  </div>
                  {metadataActa.ubicacionFisica && (
                    <div className="col-span-full">
                      <span className="text-muted-foreground">Ubicación:</span>{' '}
                      <span className="font-medium">{metadataActa.ubicacionFisica}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-2 ml-4">
            {!tieneActa ? (
              <>
                <Button
                  size="sm"
                  onClick={() => onContinuarConActa(expediente)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Continuar (Registrar Acta)
                </Button>
                <Button size="sm" variant="outline" onClick={() => onVerDetalle(expediente)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalle
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={() => onProcesar(expediente)}
                  disabled={procesando}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {procesando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Procesar con Gemini
                    </>
                  )}
                </Button>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => metadataActa && onEditarActa(expediente, metadataActa)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => metadataActa && onEliminarActa(metadataActa.id)}
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="sm" variant="outline" onClick={() => onVerDetalle(expediente)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalle
                </Button>
              </>
            )}
          </div>
        </div>

        {procesando && (
          <div className="mt-4 flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Procesando con Gemini AI...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
