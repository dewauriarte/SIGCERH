/**
 * Diálogo para Procesar Acta con OCR
 * Fase 5 - Sprint 6
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Users,
  GraduationCap,
  Edit2,
  Save,
} from 'lucide-react';
import { editorService, type ExpedienteAsignado, type ResultadoOCR, type EstudianteOCR } from '@/services/editor.service';
import { EditarEstudianteOCRDialog } from './EditarEstudianteOCRDialog';

interface ProcesarOCRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expediente: ExpedienteAsignado;
  metadataActa: {
    anioLectivo: string;
    grado: string;
    seccion: string;
    turno: string;
    tipoEvaluacion: string;
    numero?: string;
    libro?: string;
    folio?: string;
    colegioOrigen?: string;
  };
}

export function ProcesarOCRDialog({
  open,
  onOpenChange,
  expediente,
  metadataActa,
}: ProcesarOCRDialogProps) {
  const queryClient = useQueryClient();
  const [resultado, setResultado] = useState<ResultadoOCR | null>(null);
  const [progreso, setProgreso] = useState(0);
  const [estudianteEditando, setEstudianteEditando] = useState<EstudianteOCR | null>(null);
  const [estudiantesEditados, setEstudiantesEditados] = useState<Set<number>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Mutation para procesar OCR
  const procesarMutation = useMutation({
    mutationFn: async () => {
      // Simular progreso
      setProgreso(0);
      const interval = setInterval(() => {
        setProgreso((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await editorService.procesarOCR(expediente.id);
      
      clearInterval(interval);
      setProgreso(100);
      
      return response.data;
    },
    onSuccess: (data) => {
      setResultado(data);
      toast.success('OCR completado', {
        description: `Se detectaron ${data.totalEstudiantes} estudiantes con ${data.confianza}% de confianza`,
      });
      queryClient.invalidateQueries({ queryKey: ['editor-expedientes-asignados'] });
      queryClient.invalidateQueries({ queryKey: ['editor-stats-expedientes'] });
    },
    onError: (error: any) => {
      toast.error('Error al procesar OCR', {
        description: error.response?.data?.message || error.message,
      });
      setProgreso(0);
    },
  });

  const handleProcesar = () => {
    procesarMutation.mutate();
  };

  const handleCerrar = () => {
    onOpenChange(false);
    setTimeout(() => {
      setResultado(null);
      setProgreso(0);
      setEstudiantesEditados(new Set());
    }, 300);
  };

  const handleEditarEstudiante = (estudiante: EstudianteOCR) => {
    setEstudianteEditando(estudiante);
    setEditDialogOpen(true);
  };

  const handleGuardarEstudiante = (estudianteEditado: EstudianteOCR) => {
    if (!resultado) return;

    const nuevosEstudiantes = resultado.estudiantes.map(e =>
      e.numero === estudianteEditado.numero ? estudianteEditado : e
    );

    setResultado({ ...resultado, estudiantes: nuevosEstudiantes });
    setEstudiantesEditados(prev => new Set(prev).add(estudianteEditado.numero));
  };

  // Mutation para guardar en BD
  const guardarMutation = useMutation({
    mutationFn: async () => {
      if (!resultado) throw new Error('No hay resultado');
      return await editorService.guardarResultadoOCR(expediente.id, resultado);
    },
    onSuccess: () => {
      toast.success('Datos guardados correctamente', {
        description: `${resultado?.totalEstudiantes} estudiantes detectados. Datos guardados en el acta física.`,
      });
      queryClient.invalidateQueries({ queryKey: ['editor-expedientes-asignados'] });
      queryClient.invalidateQueries({ queryKey: ['editor-stats-expedientes'] });
      handleCerrar();
    },
    onError: (error: any) => {
      toast.error('Error al guardar', {
        description: error.response?.data?.message || error.message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={handleCerrar}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Procesar con IA/OCR
          </DialogTitle>
          <DialogDescription>
            Extraer datos del acta escaneada usando inteligencia artificial
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 py-4">
            {/* Metadata del Acta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Información del Acta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Año Lectivo:</span>
                    <p className="font-medium">{metadataActa.anioLectivo}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Grado:</span>
                    <p className="font-medium">{metadataActa.grado}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sección:</span>
                    <p className="font-medium">{metadataActa.seccion}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Turno:</span>
                    <p className="font-medium">{metadataActa.turno}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-medium">{metadataActa.tipoEvaluacion}</p>
                  </div>
                  {metadataActa.libro && (
                    <div>
                      <span className="text-muted-foreground">Libro:</span>
                      <p className="font-medium">{metadataActa.libro}</p>
                    </div>
                  )}
                  {metadataActa.numero && (
                    <div>
                      <span className="text-muted-foreground">Número:</span>
                      <p className="font-medium">{metadataActa.numero}</p>
                    </div>
                  )}
                  {metadataActa.folio && (
                    <div>
                      <span className="text-muted-foreground">Folio:</span>
                      <p className="font-medium">{metadataActa.folio}</p>
                    </div>
                  )}
                  {metadataActa.colegioOrigen && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Colegio:</span>
                      <p className="font-medium">{metadataActa.colegioOrigen}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Botón de Procesamiento o Loading */}
            {!resultado && !procesarMutation.isPending && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Button
                  size="lg"
                  className="text-lg h-14 px-8"
                  onClick={handleProcesar}
                  disabled={procesarMutation.isPending}
                >
                  <Brain className="mr-2 h-6 w-6" />
                  🤖 PROCESAR CON IA/OCR
                </Button>
                <p className="text-sm text-muted-foreground">
                  El procesamiento puede tomar 1-2 minutos
                </p>
              </div>
            )}

            {/* Loading State */}
            {procesarMutation.isPending && (
              <Card className="border-purple-200 dark:border-purple-900">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                    <div className="space-y-2 w-full">
                      <p className="text-lg font-semibold">Procesando con IA...</p>
                      <p className="text-sm text-muted-foreground">
                        Esto puede tomar 1-2 minutos. Por favor, espere.
                      </p>
                      <Progress value={progreso} className="w-full" />
                      <p className="text-xs text-muted-foreground">{progreso}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resultado del OCR */}
            {resultado && (
              <div className="space-y-4">
                {/* Resumen */}
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
                          <span className="font-bold">{resultado.totalEstudiantes}</span> estudiantes
                          con <span className="font-bold">{resultado.confianza}%</span> de confianza
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        <Users className="mr-1 h-3 w-3" />
                        {resultado.totalEstudiantes} estudiantes
                      </Badge>
                    </div>

                    {resultado.advertencias.length > 0 && (
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
                    <ScrollArea className="h-[400px]">
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

                {/* Resumen Final y Guardar */}
                <Card className="border-blue-200 dark:border-blue-900">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Resumen</p>
                        <div className="flex gap-6 text-sm">
                          <span><strong>{resultado.totalEstudiantes}</strong> Estudiantes totales</span>
                          <span><strong>{estudiantesEditados.size}</strong> Con correcciones</span>
                          <span className="text-green-600 font-semibold">Listos para guardar</span>
                        </div>
                      </div>
                      <Button 
                        size="lg" 
                        onClick={() => guardarMutation.mutate()}
                        disabled={guardarMutation.isPending}
                      >
                        {guardarMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-5 w-5" />
                            ✅ APROBAR Y GUARDAR EN BD
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer con acciones */}
        <Separator />
        <div className="flex justify-end gap-2 px-6 py-4">
          {resultado && !guardarMutation.isPending && (
            <Button variant="outline" onClick={handleCerrar}>
              Cerrar
            </Button>
          )}
          {!procesarMutation.isPending && !resultado && (
            <Button variant="outline" onClick={handleCerrar}>
              Cancelar
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Diálogo de Edición */}
      {estudianteEditando && (
        <EditarEstudianteOCRDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          estudiante={estudianteEditando}
          onGuardar={handleGuardarEstudiante}
        />
      )}
    </Dialog>
  );
}

// Componente para mostrar cada estudiante
function EstudianteCard({ 
  estudiante, 
  onEditar,
  editado = false
}: { 
  estudiante: EstudianteOCR;
  onEditar?: (estudiante: EstudianteOCR) => void;
  editado?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const getSituacionBadge = (situacion: 'A' | 'R' | 'D') => {
    const config = {
      A: { label: 'Aprobado', variant: 'default' as const, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      R: { label: 'Repitente', variant: 'destructive' as const, className: '' },
      D: { label: 'Desaprobado', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    };
    const { label, className } = config[situacion];
    return <Badge className={className}>{label}</Badge>;
  };

  const promedio = (estudiante.notas.reduce((a, b) => a + b, 0) / estudiante.notas.length).toFixed(1);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="font-mono">
                {estudiante.numero}
              </Badge>
              <h4 className="font-semibold">
                {estudiante.apellidoPaterno} {estudiante.apellidoMaterno}, {estudiante.nombres}
              </h4>
              <Badge variant="outline">{estudiante.sexo}</Badge>
              <Badge variant="outline">{estudiante.tipo === 'G' ? 'Gratuito' : 'Pagante'}</Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Código: {estudiante.codigo}</span>
              <span>Promedio: {promedio}</span>
              <span>Comportamiento: {estudiante.comportamiento}</span>
            </div>

            {expanded && (
              <div className="mt-4 space-y-2">
                <Separator />
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {estudiante.notas.map((nota, idx) => (
                    <div key={idx} className="text-center">
                      <div className={`text-lg font-bold ${nota < 11 ? 'text-red-600' : 'text-green-600'}`}>
                        {nota}
                      </div>
                      <div className="text-xs text-muted-foreground">C{idx + 1}</div>
                    </div>
                  ))}
                </div>
                {estudiante.observaciones && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <span className="font-medium">Observaciones: </span>
                    {estudiante.observaciones}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {editado && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                ✓ Editado
              </Badge>
            )}
            {getSituacionBadge(estudiante.situacionFinal)}
            {estudiante.asignaturasDesaprobadas > 0 && (
              <Badge variant="destructive" className="text-xs">
                {estudiante.asignaturasDesaprobadas} desaprobadas
              </Badge>
            )}
            <div className="flex gap-1">
              {onEditar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditar(estudiante)}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Editar
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Ocultar' : 'Ver notas'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

