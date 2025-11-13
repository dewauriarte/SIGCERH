/**
 * Página para Revisar y Corregir Resultados OCR
 * Permite editar estudiantes y aprobar los datos para guardarlos en BD
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Users,
  GraduationCap,
  Edit2,
  Save,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { editorService, type ResultadoOCR, type EstudianteOCR } from '@/services/editor.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EditarEstudianteOCRDialog } from '@/components/editor/EditarEstudianteOCRDialog';

export default function RevisarOCRPage() {
  const { expedienteId } = useParams<{ expedienteId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [resultado, setResultado] = useState<ResultadoOCR | null>(null);
  const [estudianteEditando, setEstudianteEditando] = useState<EstudianteOCR | null>(null);
  const [estudiantesEditados, setEstudiantesEditados] = useState<Set<number>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Obtener resultado OCR
  const { data: resultadoData, isLoading } = useQuery({
    queryKey: ['editor-resultado-ocr', expedienteId],
    queryFn: () => editorService.obtenerResultadoOCR(expedienteId!),
    enabled: !!expedienteId,
  });

  useEffect(() => {
    if (resultadoData?.data) {
      setResultado(resultadoData.data);
    }
  }, [resultadoData]);

  // Mutation para guardar en BD
  const guardarMutation = useMutation({
    mutationFn: async () => {
      if (!resultado) throw new Error('No hay resultado');
      return await editorService.guardarResultadoOCR(expedienteId!, resultado);
    },
    onSuccess: () => {
      toast.success('Datos guardados correctamente', {
        description: `${resultado?.totalEstudiantes} estudiantes detectados. Datos guardados en el acta física.`,
      });
      queryClient.invalidateQueries({ queryKey: ['editor-expedientes-asignados'] });
      queryClient.invalidateQueries({ queryKey: ['editor-expedientes-ocr'] });
      queryClient.invalidateQueries({ queryKey: ['editor-stats-expedientes'] });

      // Volver a la página de procesar OCR
      setTimeout(() => {
        navigate('/editor/procesar-ocr');
      }, 1500);
    },
    onError: (error: any) => {
      toast.error('Error al guardar', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  const handleEditarEstudiante = (estudiante: EstudianteOCR) => {
    setEstudianteEditando(estudiante);
    setEditDialogOpen(true);
  };

  const handleGuardarEstudiante = (estudianteActualizado: EstudianteOCR) => {
    if (!resultado) return;

    // Actualizar el estudiante en la lista
    const nuevosEstudiantes = resultado.estudiantes.map((est) =>
      est.numero === estudianteActualizado.numero ? estudianteActualizado : est
    );

    setResultado({
      ...resultado,
      estudiantes: nuevosEstudiantes,
    });

    // Marcar como editado
    setEstudiantesEditados((prev) => new Set(prev).add(estudianteActualizado.numero));

    toast.success('Estudiante actualizado');
  };

  const handleVolver = () => {
    navigate('/editor/procesar-ocr');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!resultado) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontró resultado OCR para este expediente</p>
            <Button onClick={handleVolver} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={handleVolver} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Procesar OCR
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileCheck className="h-8 w-8 text-green-600" />
            Revisar Resultado OCR
          </h1>
          <p className="text-muted-foreground mt-2">
            Revisa y corrige los datos extraídos antes de guardar en la base de datos
          </p>
        </div>
      </div>

      {/* Metadata del Acta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Metadata del Acta</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Año Lectivo:</span>{' '}
            <span className="font-medium">{resultado.metadataActa.anioLectivo}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Grado:</span>{' '}
            <span className="font-medium">{resultado.metadataActa.grado}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Sección:</span>{' '}
            <span className="font-medium">{resultado.metadataActa.seccion}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Turno:</span>{' '}
            <span className="font-medium">{resultado.metadataActa.turno}</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-muted-foreground">Tipo Evaluación:</span>{' '}
            <span className="font-medium">{resultado.metadataActa.tipoEvaluacion}</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-muted-foreground">Colegio Origen:</span>{' '}
            <span className="font-medium">{resultado.metadataActa.colegioOrigen}</span>
          </div>
        </CardContent>
      </Card>

      {/* Resumen del OCR */}
      <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                ✅ OCR Completado
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Se detectaron{' '}
                <span className="font-bold">{resultado.totalEstudiantes}</span> estudiantes con{' '}
                <span className="font-bold">{resultado.confianza}%</span> de confianza
              </p>
              {resultado.procesadoCon && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Procesado con: {resultado.procesadoCon}
                </p>
              )}
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">{resultado.totalEstudiantes}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <Edit2 className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                <p className="text-2xl font-bold text-blue-600">{estudiantesEditados.size}</p>
                <p className="text-xs text-muted-foreground">Corregidos</p>
              </div>
            </div>
          </div>

          {/* Advertencias */}
          {resultado.advertencias && resultado.advertencias.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Advertencias:
                  </p>
                  <ul className="mt-1 text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                    {resultado.advertencias.map((adv, idx) => (
                      <li key={idx}>• {adv}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Estudiantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Estudiantes Detectados ({resultado.totalEstudiantes})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {resultado.estudiantes.map((estudiante) => (
                <EstudianteCard
                  key={estudiante.numero}
                  estudiante={estudiante}
                  onEditar={handleEditarEstudiante}
                  editado={estudiantesEditados.has(estudiante.numero)}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Acciones Finales */}
      <Card className="border-blue-200 dark:border-blue-900 sticky bottom-6 shadow-lg">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Resumen Final</p>
              <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm">
                <span>
                  <strong>{resultado.totalEstudiantes}</strong> Estudiantes
                </span>
                <span>
                  <strong>{estudiantesEditados.size}</strong> Corregidos
                </span>
                <span className="text-green-600 font-semibold">Listos</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={handleVolver} 
                disabled={guardarMutation.isPending}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                size="lg"
                onClick={() => guardarMutation.mutate()}
                disabled={guardarMutation.isPending}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                {guardarMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    <span className="hidden sm:inline">✅ APROBAR Y GUARDAR EN BD</span>
                    <span className="sm:hidden">✅ GUARDAR</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de Edición */}
      {estudianteEditando && (
        <EditarEstudianteOCRDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          estudiante={estudianteEditando}
          onGuardar={handleGuardarEstudiante}
        />
      )}
    </div>
  );
}

// Componente para mostrar cada estudiante
function EstudianteCard({
  estudiante,
  onEditar,
  editado = false,
}: {
  estudiante: EstudianteOCR;
  onEditar?: (estudiante: EstudianteOCR) => void;
  editado?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const getSituacionBadge = (situacion: 'A' | 'R' | 'D') => {
    const config = {
      A: {
        label: 'Aprobado',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
      R: { label: 'Repitente', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      D: {
        label: 'Desaprobado',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      },
    };
    const { label, className } = config[situacion];
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <Card className="border-gray-200 dark:border-gray-800">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold break-words">
              {estudiante.numero}. {estudiante.apellidoPaterno} {estudiante.apellidoMaterno},{' '}
              {estudiante.nombres}
              {estudiante.tipo === 'P' && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Pagante
                </Badge>
              )}
              {editado && (
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-300 text-xs">
                  ✓ Editado
                </Badge>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              DNI/Código: {estudiante.codigo} | Sexo: {estudiante.sexo}
            </p>
            {estudiante.observaciones && (
              <p className="text-xs text-red-500 flex items-center gap-1 break-words">
                <AlertTriangle className="h-3 w-3 shrink-0" /> {estudiante.observaciones}
              </p>
            )}
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {getSituacionBadge(estudiante.situacionFinal)}
              {estudiante.asignaturasDesaprobadas > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {estudiante.asignaturasDesaprobadas} desap.
                </Badge>
              )}
            </div>
            <div className="flex gap-1 w-full sm:w-auto">
              {onEditar && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEditar(estudiante)}
                  className="flex-1 sm:flex-initial"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Editar</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setExpanded(!expanded)}
                className="flex-1 sm:flex-initial"
              >
                <span className="hidden sm:inline">{expanded ? 'Ocultar' : 'Ver notas'}</span>
                <span className="sm:hidden">{expanded ? 'Ocultar' : 'Notas'}</span>
              </Button>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Notas:</h4>
            <div className="overflow-x-auto -mx-2 px-2 pb-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs min-w-max">
                {estudiante.notas.map((nota, idx) => (
                  <div key={idx} className="flex justify-between whitespace-nowrap">
                    <span>Área {idx + 1}:</span>
                    <span className={nota < 11 ? 'text-red-500 font-bold' : ''}>{nota}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs">
              <strong>Comportamiento:</strong> {estudiante.comportamiento}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

