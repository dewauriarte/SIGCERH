/**
 * Página de Certificados Observados por UGEL - Editor
 *
 * Muestra certificados que UGEL ha observado (rechazado con comentarios).
 * El Editor debe corregir los datos según las observaciones y reenviar.
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/custom/PageHeader';
import { DataTable } from '@/components/custom/DataTable';
import { StatsCard } from '@/components/custom/StatsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  Clock,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { editorService } from '@/services/editor.service';
import { VerObservacionDialog } from '@/components/editor/VerObservacionDialog';
import { CorregirDatosDialog } from '@/components/editor/CorregirDatosDialog';

// ============================================================================
// TIPOS
// ============================================================================

interface CertificadoObservado {
  id: string;
  expedienteId: string;
  numeroExpediente: string;
  estudiante: {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    numeroDocumento: string;
  };
  observaciones: string;
  fechaObservacion: Date | string;
  observadoPor: string;
  diasDesdeObservacion: number;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function CertificadosObservadosPage() {
  const queryClient = useQueryClient();

  // ============================================================================
  // ESTADO LOCAL
  // ============================================================================

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [certificadoSeleccionado, setCertificadoSeleccionado] = useState<CertificadoObservado | null>(null);
  const [verObservacionOpen, setVerObservacionOpen] = useState(false);
  const [corregirOpen, setCorregirOpen] = useState(false);

  // ============================================================================
  // QUERIES
  // ============================================================================

  // DESHABILITADO - Fase 7 (Observaciones UGEL) no implementada aún
  const { data: observadosData, isLoading } = useQuery({
    queryKey: ['editor-certificados-observados', page, limit],
    queryFn: () => editorService.getCertificadosObservados({ page, limit }),
    enabled: false, // Deshabilitar hasta implementar backend de observaciones
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
  });

  const { data: estadisticas } = useQuery({
    queryKey: ['editor-stats-observados'],
    queryFn: () => editorService.getEstadisticas(),
    refetchInterval: 2 * 60 * 1000,
  });

  const certificados: CertificadoObservado[] = observadosData?.data || [];

  // ============================================================================
  // ACCIONES
  // ============================================================================

  const handleVerObservacion = (certificado: CertificadoObservado) => {
    setCertificadoSeleccionado(certificado);
    setVerObservacionOpen(true);
  };

  const handleCorregir = (certificado: CertificadoObservado) => {
    setCertificadoSeleccionado(certificado);
    setCorregirOpen(true);
  };

  // ============================================================================
  // DEFINICIÓN DE COLUMNAS
  // ============================================================================

  const columns = [
    {
      key: 'numeroExpediente',
      title: 'Expediente',
      sortable: true,
      render: (_: string, row: CertificadoObservado) => (
        <div>
          <p className="font-medium">{row.numeroExpediente}</p>
          <p className="text-xs text-muted-foreground">ID: {row.id.slice(0, 8)}</p>
        </div>
      ),
    },
    {
      key: 'estudiante',
      title: 'Estudiante',
      sortable: false,
      render: (_: string, row: CertificadoObservado) => (
        <div>
          <p className="font-medium">
            {row.estudiante.apellidoPaterno} {row.estudiante.apellidoMaterno},{' '}
            {row.estudiante.nombres}
          </p>
          <p className="text-xs text-muted-foreground">DNI: {row.estudiante.numeroDocumento}</p>
        </div>
      ),
    },
    {
      key: 'observaciones',
      title: 'Observaciones',
      sortable: false,
      render: (_: string, row: CertificadoObservado) => (
        <div className="max-w-xs">
          <p className="text-sm truncate">{row.observaciones}</p>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() => handleVerObservacion(row)}
          >
            Ver completo
          </Button>
        </div>
      ),
    },
    {
      key: 'fechaObservacion',
      title: 'Fecha Observación',
      sortable: true,
      render: (_: string, row: CertificadoObservado) => (
        <div className="text-sm">
          <p>{new Date(row.fechaObservacion).toLocaleDateString()}</p>
          <p className="text-xs text-muted-foreground">
            Hace {row.diasDesdeObservacion} días
          </p>
        </div>
      ),
    },
    {
      key: 'urgencia',
      title: 'Urgencia',
      sortable: true,
      render: (_: string, row: CertificadoObservado) => {
        const dias = row.diasDesdeObservacion;
        if (dias > 7) {
          return <Badge className="bg-red-100 text-red-800">Urgente</Badge>;
        } else if (dias > 3) {
          return <Badge className="bg-orange-100 text-orange-800">Prioritario</Badge>;
        }
        return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>;
      },
    },
    {
      key: 'acciones',
      title: 'Acciones',
      sortable: false,
      render: (_: string, row: CertificadoObservado) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVerObservacion(row)}
            title="Ver Observaciones"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCorregir(row)}
            title="Corregir Datos"
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
        </div>
      ),
    },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Certificados Observados por UGEL"
        description="Corrige los datos según las observaciones de UGEL y reenvía"
      />

      {/* Alerta Importante */}
      {certificados.length > 0 && (
        <Alert className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <strong>Atención:</strong> Tienes {certificados.length} certificado(s) observado(s) por
            UGEL que requieren corrección y reenvío.
          </AlertDescription>
        </Alert>
      )}

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Observados"
          value={certificados.length}
          description="Por corregir"
          icon={AlertTriangle}
          className="border-orange-200 dark:border-orange-900"
        />

        <StatsCard
          title="Urgentes (>7 días)"
          value={certificados.filter(c => c.diasDesdeObservacion > 7).length}
          description="Requieren atención inmediata"
          icon={XCircle}
          className="border-red-200 dark:border-red-900"
        />

        <StatsCard
          title="Prioritarios (3-7 días)"
          value={certificados.filter(c => c.diasDesdeObservacion > 3 && c.diasDesdeObservacion <= 7).length}
          description="Atender pronto"
          icon={Clock}
          className="border-yellow-200 dark:border-yellow-900"
        />

        <StatsCard
          title="Corregidos Hoy"
          value={0}
          description="Reenviados a UGEL"
          icon={CheckCircle2}
          className="border-green-200 dark:border-green-900"
        />
      </div>

      {/* Instrucciones */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Instrucciones:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Lee cuidadosamente las observaciones de UGEL</li>
              <li>Corrige los datos según lo indicado</li>
              <li>Verifica que todos los cambios sean correctos</li>
              <li>Reenvía el certificado corregido a UGEL</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando...</div>
      ) : certificados.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold">No hay certificados observados</p>
              <p className="text-sm text-muted-foreground">
                Todos los certificados han sido aprobados o están en revisión
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={certificados}
          isLoading={isLoading}
          pagination={{
            currentPage: page,
            totalPages: observadosData?.meta?.totalPages || 1,
            pageSize: limit,
            totalItems: observadosData?.meta?.total || 0,
            onPageChange: setPage,
          }}
        />
      )}

      {/* Dialogs */}
      {certificadoSeleccionado && (
        <>
          <VerObservacionDialog
            open={verObservacionOpen}
            onClose={() => {
              setVerObservacionOpen(false);
              setCertificadoSeleccionado(null);
            }}
            certificado={certificadoSeleccionado}
            onCorregir={() => {
              setVerObservacionOpen(false);
              setCorregirOpen(true);
            }}
          />

          <CorregirDatosDialog
            open={corregirOpen}
            onClose={() => {
              setCorregirOpen(false);
              setCertificadoSeleccionado(null);
            }}
            certificado={certificadoSeleccionado}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['editor-certificados-observados'] });
              queryClient.invalidateQueries({ queryKey: ['editor-stats-observados'] });
            }}
          />
        </>
      )}
    </div>
  );
}
