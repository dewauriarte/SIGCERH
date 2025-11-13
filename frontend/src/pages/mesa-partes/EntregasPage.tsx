/**
 * Página de Gestión de Entregas para Mesa de Partes
 * Gestión de certificados listos para entrega
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/custom/PageHeader';
import { StatsCard } from '@/components/custom/StatsCard';
import { DataTable } from '@/components/custom/DataTable';
import type { Column } from '@/components/custom/DataTable';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  Eye,
  Download,
  Package,
  Inbox,
  Truck,
} from 'lucide-react';
import { mesaPartesService, type Solicitud } from '@/services/mesa-partes.service';
import { ConfirmarEntregaDialog } from '@/components/mesa-partes/ConfirmarEntregaDialog';
import { CertificadoPreview } from '@/components/mesa-partes/CertificadoPreview';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function EntregasPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [estadoActual, setEstadoActual] = useState<'LISTOS' | 'ENTREGADOS'>('LISTOS');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Solicitud | null>(null);
  const [mostrarConfirmarDialog, setMostrarConfirmarDialog] = useState(false);
  const [mostrarPreviewDialog, setMostrarPreviewDialog] = useState(false);

  // ============================================================================
  // QUERIES
  // ============================================================================

  // Obtener certificados listos para entrega
  const { data: listasResponse, isLoading: loadingListas, refetch } = useQuery({
    queryKey: ['listas-entrega', page, limit],
    queryFn: () => mesaPartesService.getListasEntrega({ page, limit }),
    refetchInterval: 30000,
    enabled: estadoActual === 'LISTOS',
  });

  // Obtener certificados ya entregados
  const { data: entregadosResponse, isLoading: loadingEntregados } = useQuery({
    queryKey: ['certificados-entregados', page, limit],
    queryFn: () => mesaPartesService.getCertificadosEntregados({ page, limit }),
    refetchInterval: 30000,
    enabled: estadoActual === 'ENTREGADOS',
  });

  // Datos según tab activo
  const currentData = estadoActual === 'LISTOS' ? listasResponse : entregadosResponse;
  const isLoading = estadoActual === 'LISTOS' ? loadingListas : loadingEntregados;

  // Reset página al cambiar estado
  useEffect(() => {
    setPage(1);
  }, [estadoActual]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleVerCertificado = (solicitud: Solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setMostrarPreviewDialog(true);
  };

  const handleConfirmarEntrega = (solicitud: Solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setMostrarConfirmarDialog(true);
  };

  const handleEntregaSuccess = () => {
    setMostrarConfirmarDialog(false);
    setSolicitudSeleccionada(null);
    refetch();
  };

  const getNombreCompleto = (solicitud: Solicitud): string => {
    if (!solicitud.estudiante) return 'N/A';
    const { nombres, apellidoPaterno, apellidoMaterno } = solicitud.estudiante;
    return `${apellidoPaterno} ${apellidoMaterno}, ${nombres}`;
  };

  const formatFecha = (fecha: Date | string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'N/A';
    }
  };

  // ============================================================================
  // COLUMNAS DE LA TABLA
  // ============================================================================

  const columns: Column<Solicitud>[] = [
    {
      key: 'numeroexpediente',
      title: 'Expediente',
      sortable: true,
      render: (_, row) => (
        <div className="font-mono text-sm">{row.numeroexpediente}</div>
      ),
    },
    {
      key: 'estudiante',
      title: 'Estudiante',
      render: (_, row) => (
        <div className="min-w-[200px]">
          <p className="font-medium">{getNombreCompleto(row)}</p>
          <p className="text-xs text-muted-foreground">
            DNI: {row.estudiante?.numeroDocumento || 'N/A'}
          </p>
        </div>
      ),
    },
    {
      key: 'certificado',
      title: 'Código Certificado',
      render: (_, row) => (
        <div className="font-mono text-sm">
          {row.certificado?.codigoVerificacion || 'N/A'}
        </div>
      ),
    },
    {
      key: 'estado',
      title: 'Estado',
      sortable: true,
      render: (_, row) => <StatusBadge status={row.estado as any} />,
    },
    {
      key: 'fechasolicitud',
      title: 'Fecha Solicitud',
      sortable: true,
      render: (_, row) => (
        <div className="text-sm">{formatFecha(row.fechasolicitud)}</div>
      ),
    },
    {
      key: 'certificado-preview',
      title: 'Certificado',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.certificado && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleVerCertificado(row)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  // Descargar certificado
                  window.open(`/api/certificados/${row.certificado?.id}/descargar`, '_blank');
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.estado === 'CERTIFICADO_EMITIDO' && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleConfirmarEntrega(row)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Entregar
            </Button>
          )}
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
        title="Gestión de Entregas"
        description="Mesa de Partes - Entrega de certificados emitidos"
      />

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Listos para Entrega"
          value={listasResponse?.meta.total || 0}
          description="Certificados emitidos"
          icon={Package}
          className="border-blue-200 dark:border-blue-900"
        />

        <StatsCard
          title="Entregados"
          value={entregadosResponse?.meta.total || 0}
          description="Completados"
          icon={CheckCircle2}
          className="border-green-200 dark:border-green-900"
        />
      </div>

      {/* Tabs por Estado */}
      <Tabs value={estadoActual} onValueChange={(value) => setEstadoActual(value as any)} className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="LISTOS" className="gap-2">
            <Package className="h-4 w-4" />
            Listos para Entrega
          </TabsTrigger>
          <TabsTrigger value="ENTREGADOS" className="gap-2">
            <Truck className="h-4 w-4" />
            Entregados
          </TabsTrigger>
        </TabsList>

        <TabsContent value={estadoActual} className="mt-6">
          {/* Tabla de Certificados */}
          <Card>
            <CardContent className="p-6">
              <DataTable
                columns={columns}
                data={currentData?.data || []}
                loading={isLoading}
                emptyMessage={
                  estadoActual === 'LISTOS'
                    ? 'No hay certificados listos para entrega'
                    : 'No hay certificados entregados'
                }
                pagination={
                  currentData?.meta
                    ? {
                        currentPage: currentData.meta.page,
                        totalPages: currentData.meta.totalPages,
                        pageSize: currentData.meta.limit,
                        totalItems: currentData.meta.total,
                        onPageChange: setPage,
                      }
                    : undefined
                }
                search={{
                  placeholder: 'Buscar por expediente o DNI...',
                  onSearch: () => {
                    // Implementar búsqueda si es necesario
                  },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {solicitudSeleccionada && mostrarConfirmarDialog && (
        <ConfirmarEntregaDialog
          open={mostrarConfirmarDialog}
          onClose={() => {
            setMostrarConfirmarDialog(false);
            setSolicitudSeleccionada(null);
          }}
          solicitud={solicitudSeleccionada}
          onSuccess={handleEntregaSuccess}
        />
      )}

      {solicitudSeleccionada && mostrarPreviewDialog && (
        <CertificadoPreview
          open={mostrarPreviewDialog}
          onClose={() => {
            setMostrarPreviewDialog(false);
            setSolicitudSeleccionada(null);
          }}
          solicitud={solicitudSeleccionada}
        />
      )}
    </div>
  );
}
