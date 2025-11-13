/**
 * Página de Envío a UGEL - Editor
 *
 * Muestra certificados borradores listos para enviar a UGEL para validación.
 * Permite selección múltiple y envío en lote.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/custom/PageHeader';
import { StatsCard } from '@/components/custom/StatsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { editorService } from '@/services/editor.service';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

interface CertificadoBorrador {
  id: string;
  expedienteId: string;
  numeroExpediente: string;
  estudiante: {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    numeroDocumento: string;
  };
  datosAcademicos: {
    anioLectivo: number;
    grado: string;
    promedio: number;
  };
  fechaGeneracion: Date | string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function EnviarAUgelPage() {
  const queryClient = useQueryClient();

  // ============================================================================
  // ESTADO LOCAL
  // ============================================================================

  const [page] = useState(1);
  const [limit] = useState(20);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  // ============================================================================
  // QUERIES
  // ============================================================================

  // DESHABILITADO - Fase 6 (Enviar a UGEL) no implementada aún
  const { data: borradoresData, isLoading } = useQuery({
    queryKey: ['editor-borradores-listos', page, limit],
    queryFn: () => editorService.getBorradoresListos({ page, limit }),
    enabled: false, // Deshabilitar hasta implementar backend de borradores
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
  });

  const { data: estadisticas } = useQuery({
    queryKey: ['editor-stats-envios'],
    queryFn: () => editorService.getEstadisticas(),
    refetchInterval: 2 * 60 * 1000,
  });

  const borradores: CertificadoBorrador[] = borradoresData?.data || [];

  // ============================================================================
  // MUTATION - ENVIAR A UGEL
  // ============================================================================

  const enviarMutation = useMutation({
    mutationFn: async () => {
      if (seleccionados.size === 0) {
        throw new Error('Debe seleccionar al menos un certificado');
      }

      const certificadoIds = Array.from(seleccionados);
      return editorService.enviarAUgel(certificadoIds);
    },
    onSuccess: () => {
      toast.success('Certificados enviados a UGEL', {
        description: `${seleccionados.size} certificado(s) enviado(s) correctamente`,
      });
      setSeleccionados(new Set());
      queryClient.invalidateQueries({ queryKey: ['editor-borradores-listos'] });
      queryClient.invalidateQueries({ queryKey: ['editor-stats-envios'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al enviar certificados');
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleToggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  };

  const handleSeleccionarTodos = () => {
    if (seleccionados.size === borradores.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(borradores.map((b) => b.id)));
    }
  };

  const handleEnviar = async () => {
    if (seleccionados.size === 0) {
      toast.error('Selecciona al menos un certificado');
      return;
    }

    await enviarMutation.mutateAsync();
  };

  const todosSeleccionados = borradores.length > 0 && seleccionados.size === borradores.length;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Enviar a UGEL"
        description="Certificados borradores listos para validación de UGEL"
      />

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Borradores Listos"
          value={borradores.length}
          description="Certificados por enviar"
          icon={FileCheck}
          className="border-blue-200 dark:border-blue-900"
        />

        <StatsCard
          title="Seleccionados"
          value={seleccionados.size}
          description="Para enviar ahora"
          icon={CheckCircle2}
          className="border-green-200 dark:border-green-900"
        />

        <StatsCard
          title="Enviados a UGEL"
          value={estadisticas?.data?.enviadasAUgel || 0}
          description="Total histórico"
          icon={Send}
          className="border-purple-200 dark:border-purple-900"
        />

        <StatsCard
          title="Observados"
          value={estadisticas?.data?.observadosPorUgel || 0}
          description="Requieren corrección"
          icon={AlertTriangle}
          className="border-orange-200 dark:border-orange-900"
        />
      </div>

      {/* Instrucciones */}
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Selecciona los certificados que deseas enviar a UGEL para su validación. Una vez enviados,
          UGEL revisará y aprobará o enviará observaciones.
        </AlertDescription>
      </Alert>

      {/* Acciones de Selección */}
      {borradores.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={handleSeleccionarTodos}>
                  {todosSeleccionados ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {seleccionados.size} de {borradores.length} seleccionados
                </p>
              </div>

              <Button
                onClick={handleEnviar}
                disabled={seleccionados.size === 0 || enviarMutation.isPending}
                className="bg-primary"
              >
                <Send className="mr-2 h-4 w-4" />
                {enviarMutation.isPending
                  ? 'Enviando...'
                  : `Enviar ${seleccionados.size > 0 ? `(${seleccionados.size})` : ''}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Certificados */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : borradores.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold">No hay borradores pendientes</p>
              <p className="text-sm text-muted-foreground">
                Todos los certificados han sido enviados a UGEL
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={todosSeleccionados}
                        onCheckedChange={handleSeleccionarTodos}
                      />
                    </TableHead>
                    <TableHead>Expediente</TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Datos Académicos</TableHead>
                    <TableHead className="text-center">Promedio</TableHead>
                    <TableHead>Fecha Generación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borradores.map((borrador) => (
                    <TableRow
                      key={borrador.id}
                      className={seleccionados.has(borrador.id) ? 'bg-primary/5' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={seleccionados.has(borrador.id)}
                          onCheckedChange={() => handleToggleSeleccion(borrador.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{borrador.numeroExpediente}</p>
                          <p className="text-xs text-muted-foreground">ID: {borrador.id.slice(0, 8)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {borrador.estudiante.apellidoPaterno} {borrador.estudiante.apellidoMaterno},{' '}
                            {borrador.estudiante.nombres}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            DNI: {borrador.estudiante.numeroDocumento}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{borrador.datosAcademicos.grado}</p>
                          <p className="text-xs text-muted-foreground">
                            {borrador.datosAcademicos.anioLectivo}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={borrador.datosAcademicos.promedio >= 11 ? 'default' : 'destructive'}
                        >
                          {borrador.datosAcademicos.promedio.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {new Date(borrador.fechaGeneracion).toLocaleDateString()}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      {borradores.length > 0 && (
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <strong>Importante:</strong> Los certificados enviados a UGEL entrarán en estado de
            "Validación". UGEL puede aprobarlos o enviar observaciones que deberás corregir.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
