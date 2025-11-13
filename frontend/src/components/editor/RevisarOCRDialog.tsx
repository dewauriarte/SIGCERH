/**
 * Dialog de Revisión de Datos OCR - Editor
 *
 * Permite revisar y corregir los datos extraídos mediante OCR del acta física.
 * Muestra una lista de hasta 30 estudiantes con sus notas por área curricular.
 * Cada estudiante puede ser editado individualmente.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  AlertTriangle,
  Edit,
  Users,
  BookOpen,
  Send,
} from 'lucide-react';
import { type ActaFisica } from '@/services/editor.service';
import { StudentEditModal } from './StudentEditModal';
import { toast } from 'sonner';

interface RevisarOCRDialogProps {
  open: boolean;
  onClose: () => void;
  acta: ActaFisica;
}

// Mock de estudiantes extraídos por OCR
interface EstudianteOCR {
  id: string;
  orden: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  notas: { [areaCodigo: string]: number };
  promedio: number;
  estado: 'APROBADO' | 'DESAPROBADO' | 'RETIRADO';
  confianzaOCR: number; // 0-100%
}

export function RevisarOCRDialog({
  open,
  onClose,
  acta,
}: RevisarOCRDialogProps) {
  const queryClient = useQueryClient();

  // ============================================================================
  // ESTADO LOCAL
  // ============================================================================

  // Mock de estudiantes extraídos
  const [estudiantes, setEstudiantes] = useState<EstudianteOCR[]>([
    {
      id: '1',
      orden: 1,
      nombres: 'Juan Carlos',
      apellidoPaterno: 'García',
      apellidoMaterno: 'Pérez',
      notas: { MAT: 15, COM: 14, ING: 16, CTA: 13, HGE: 15 },
      promedio: 14.6,
      estado: 'APROBADO',
      confianzaOCR: 95,
    },
    {
      id: '2',
      orden: 2,
      nombres: 'María Elena',
      apellidoPaterno: 'Rodríguez',
      apellidoMaterno: 'López',
      notas: { MAT: 17, COM: 16, ING: 18, CTA: 17, HGE: 16 },
      promedio: 16.8,
      estado: 'APROBADO',
      confianzaOCR: 92,
    },
    {
      id: '3',
      orden: 3,
      nombres: 'Carlos Alberto',
      apellidoPaterno: 'Martínez',
      apellidoMaterno: 'Sánchez',
      notas: { MAT: 10, COM: 11, ING: 12, CTA: 9, HGE: 11 },
      promedio: 10.6,
      estado: 'DESAPROBADO',
      confianzaOCR: 88,
    },
  ]);

  const [estudianteEditando, setEstudianteEditando] = useState<EstudianteOCR | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // ============================================================================
  // MUTATION - GUARDAR CAMBIOS
  // ============================================================================

  const guardarCambiosMutation = useMutation({
    mutationFn: async () => {
      // TODO: Implementar endpoint para guardar datos corregidos
      // return editorService.guardarDatosOCR(acta.id, estudiantes);

      // Mock temporal
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 1500);
      });
    },
    onSuccess: () => {
      toast.success('Datos guardados correctamente', {
        description: 'Los estudiantes han sido registrados y enviados a UGEL',
      });
      queryClient.invalidateQueries({ queryKey: ['editor-actas-ocr'] });
      queryClient.invalidateQueries({ queryKey: ['editor-stats-ocr'] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al guardar los datos');
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleEditEstudiante = (estudiante: EstudianteOCR) => {
    setEstudianteEditando(estudiante);
    setEditModalOpen(true);
  };

  const handleSaveEstudiante = (estudianteActualizado: EstudianteOCR) => {
    setEstudiantes((prev) =>
      prev.map((e) => (e.id === estudianteActualizado.id ? estudianteActualizado : e))
    );
    setEditModalOpen(false);
    setEstudianteEditando(null);
    toast.success('Estudiante actualizado');
  };

  const handleEnviarAUgel = async () => {
    await guardarCambiosMutation.mutateAsync();
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getEstadoBadge = (estado: string) => {
    const config = {
      APROBADO: { label: 'Aprobado', className: 'bg-green-100 text-green-800' },
      DESAPROBADO: { label: 'Desaprobado', className: 'bg-red-100 text-red-800' },
      RETIRADO: { label: 'Retirado', className: 'bg-gray-100 text-gray-800' },
    }[estado];

    return <Badge className={config?.className}>{config?.label}</Badge>;
  };

  const getConfianzaColor = (confianza: number) => {
    if (confianza >= 90) return 'text-green-600';
    if (confianza >= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  const estudiantesConBajaConfianza = estudiantes.filter((e) => e.confianzaOCR < 90).length;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Revisar y Corregir Datos OCR
            </DialogTitle>
            <DialogDescription>
              Acta ID: {acta.id} • {acta.metadata.grado} - Sección {acta.metadata.seccion} •{' '}
              {acta.metadata.anioLectivo}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Resumen */}
            <div className="grid gap-4 md:grid-cols-3">
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm font-semibold">{estudiantes.length} estudiantes</p>
                  <p className="text-xs text-muted-foreground">Extraídos del acta</p>
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <p className="text-sm font-semibold">
                    {acta.plantillaCurricular?.areas.length || 0} áreas
                  </p>
                  <p className="text-xs text-muted-foreground">Curriculares detectadas</p>
                </AlertDescription>
              </Alert>

              <Alert
                className={
                  estudiantesConBajaConfianza > 0
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200'
                    : 'bg-green-50 dark:bg-green-900/20 border-green-200'
                }
              >
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <p className="text-sm font-semibold">{estudiantesConBajaConfianza} requieren revisión</p>
                  <p className="text-xs text-muted-foreground">Confianza OCR &lt; 90%</p>
                </AlertDescription>
              </Alert>
            </div>

            <Separator />

            {/* Tabla de Estudiantes */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead className="text-center">Promedio</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Confianza OCR</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudiantes.map((estudiante) => (
                    <TableRow key={estudiante.id}>
                      <TableCell className="font-medium">{estudiante.orden}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {estudiante.apellidoPaterno} {estudiante.apellidoMaterno}, {estudiante.nombres}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Object.keys(estudiante.notas).length} notas registradas
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={estudiante.promedio >= 11 ? 'default' : 'destructive'}>
                          {estudiante.promedio.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{getEstadoBadge(estudiante.estado)}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${getConfianzaColor(estudiante.confianzaOCR)}`}>
                          {estudiante.confianzaOCR}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEstudiante(estudiante)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Advertencia si hay baja confianza */}
            {estudiantesConBajaConfianza > 0 && (
              <Alert className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <strong>Atención:</strong> {estudiantesConBajaConfianza} estudiante(s) tienen
                  confianza OCR menor al 90%. Se recomienda revisar manualmente antes de enviar a
                  UGEL.
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Acciones */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Revisa cada estudiante cuidadosamente antes de enviar
              </p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={guardarCambiosMutation.isPending}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleEnviarAUgel}
                  disabled={guardarCambiosMutation.isPending}
                  className="bg-primary"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {guardarCambiosMutation.isPending ? 'Enviando...' : 'Enviar a UGEL'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edición de Estudiante */}
      {estudianteEditando && (
        <StudentEditModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEstudianteEditando(null);
          }}
          estudiante={estudianteEditando}
          areasCurriculares={acta.plantillaCurricular?.areas || []}
          onSave={handleSaveEstudiante}
        />
      )}
    </>
  );
}
