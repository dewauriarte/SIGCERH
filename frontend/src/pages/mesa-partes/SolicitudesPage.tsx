/**
 * Página principal de Solicitudes para Mesa de Partes
 * Muestra todas las solicitudes con filtros y permite derivar a Editor
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/custom/PageHeader';
import { StatsCard } from '@/components/custom/StatsCard';
import { DataTable } from '@/components/custom/DataTable';
import type { Column } from '@/components/custom/DataTable';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { RefreshIndicator } from '@/components/custom/RefreshIndicator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ClipboardList,
  Clock,
  CreditCard,
  FileCheck,
  UserPlus,
  Eye,
  AlertCircle,
  Inbox,
  UserCog,
  Search,
  CheckCircle2,
  XCircle,
  Banknote,
  Cpu,
  ShieldCheck,
  FileWarning,
  Database,
  PenTool,
  Package,
  Truck,
} from 'lucide-react';
import { mesaPartesService, type Solicitud, type EstadoSolicitud } from '@/services/mesa-partes.service';
import { DerivarEditorDialog } from '@/components/mesa-partes/DerivarEditorDialog';
import { SolicitudDetalleDialog } from '@/components/mesa-partes/SolicitudDetalleDialog';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

// ============================================================================
// COMPONENTE DE BÚSQUEDA
// ============================================================================

interface BusquedaProps {
  onBuscar: (termino: string) => void;
}

function BarraBusqueda({ onBuscar }: BusquedaProps) {
  const [busqueda, setBusqueda] = useState('');

  const handleChange = (value: string) => {
    setBusqueda(value);
    // Búsqueda en tiempo real - aplicar inmediatamente
    onBuscar(value.trim());
  };

  const handleLimpiar = () => {
    setBusqueda('');
    onBuscar('');
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Buscar Solicitud</label>
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por N° Expediente, Código de Seguimiento o DNI..."
              value={busqueda}
              onChange={(e) => handleChange(e.target.value)}
              className="max-w-md"
            />
            {busqueda && (
              <Button onClick={handleLimpiar} variant="outline">
                Limpiar
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            La búsqueda se realiza automáticamente mientras escribes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function SolicitudesPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [estadoActual, setEstadoActual] = useState<EstadoSolicitud | 'TODAS'>('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Solicitud | null>(null);
  const [mostrarDerivarDialog, setMostrarDerivarDialog] = useState(false);
  const [mostrarDetalleDialog, setMostrarDetalleDialog] = useState(false);

  // ============================================================================
  // QUERIES
  // ============================================================================

  // Obtener estadísticas
  const { data: estadisticas } = useQuery({
    queryKey: ['mesa-partes-stats'],
    queryFn: () => mesaPartesService.getEstadisticas(),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  });

  // Construir filtros según el tab activo
  const filtros = estadoActual !== 'TODAS' ? { estado: estadoActual } : {};
  const filtrosCompletos = {
    ...filtros,
    ...(busqueda ? { busqueda } : {}),
  };

  // Obtener solicitudes con filtros y búsqueda
  const { data: solicitudesResponse, isLoading: loadingSolicitudes, refetch } = useQuery({
    queryKey: ['mesa-partes-solicitudes', page, limit, filtrosCompletos],
    queryFn: () => mesaPartesService.getSolicitudes(filtrosCompletos, { page, limit }),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  });

  // Reset página al cambiar filtros
  useEffect(() => {
    setPage(1);
  }, [estadoActual, busqueda]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleVerDetalle = (solicitud: Solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setMostrarDetalleDialog(true);
  };

  const handleDerivarEditor = (solicitud: Solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setMostrarDerivarDialog(true);
  };

  const handleDerivarSuccess = () => {
    setMostrarDerivarDialog(false);
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
        <div>
          <div className="font-mono text-sm font-medium">{row.numeroexpediente}</div>
          <div className="font-mono text-xs text-muted-foreground">{row.numeroseguimiento}</div>
        </div>
      ),
    },
    {
      key: 'estudiante',
      title: 'Estudiante',
      render: (_, row) => (
        <div className="max-w-[180px]">
          <p className="font-medium text-sm truncate">{getNombreCompleto(row)}</p>
          <p className="text-xs text-muted-foreground">
            DNI: {row.estudiante?.numeroDocumento || 'N/A'}
          </p>
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
      title: 'Fecha',
      sortable: true,
      render: (_, row) => (
        <div className="text-sm whitespace-nowrap">{formatFecha(row.fechasolicitud)}</div>
      ),
    },
    {
      key: 'editor',
      title: 'Editor',
      render: (_, row) => (
        <div className="text-sm max-w-[140px]">
          {row.editor ? (
            <div className="truncate">
              <p className="font-medium truncate">
                {row.editor.nombres} {row.editor.apellidos}
              </p>
            </div>
          ) : (
            <Badge variant="outline" className="text-orange-600">
              Sin asignar
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleVerDetalle(row)}
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {/* Mostrar botón SOLO si NO tiene editor asignado y está en estados iniciales */}
          {!row.editor && (row.estado === 'REGISTRADA' || row.estado === 'EN_BUSQUEDA' || row.estado === 'DERIVADO_A_EDITOR') && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleDerivarEditor(row)}
              title="Asignar Editor"
            >
              <UserPlus className="h-4 w-4" />
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
        title="Gestión de Solicitudes"
        description="Mesa de Partes - Visualiza, filtra y deriva solicitudes a los editores"
      />

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Solicitudes"
          value={estadisticas?.data?.totalSolicitudes || 0}
          description="Todas las solicitudes"
          icon={ClipboardList}
          trend={
            estadisticas?.data?.totalSolicitudes && estadisticas.data.totalSolicitudes > 0
              ? { value: '+5.2%', isPositive: true }
              : undefined
          }
        />

        <StatsCard
          title="Pendientes Derivación"
          value={estadisticas?.data?.pendientesDerivacion || 0}
          description="Sin asignar a Editor"
          icon={Clock}
          className="border-orange-200 dark:border-orange-900"
        />

        <StatsCard
          title="Pagos por Validar"
          value={estadisticas?.data?.pagosValidar || 0}
          description="Pagos en efectivo"
          icon={CreditCard}
          className="border-blue-200 dark:border-blue-900"
        />

        <StatsCard
          title="Listos para Entrega"
          value={estadisticas?.data?.listasEntrega || 0}
          description="Certificados terminados"
          icon={FileCheck}
          className="border-green-200 dark:border-green-900"
        />
      </div>

      {/* Búsqueda */}
      <BarraBusqueda onBuscar={setBusqueda} />

      {/* Tabs por Estado */}
      <Tabs value={estadoActual} onValueChange={(value) => setEstadoActual(value as any)} className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="TODAS" className="gap-2">
            <Inbox className="h-4 w-4" />
            Todas
          </TabsTrigger>
          <TabsTrigger value="REGISTRADA" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Registradas
          </TabsTrigger>
          <TabsTrigger value="DERIVADO_A_EDITOR" className="gap-2">
            <UserCog className="h-4 w-4" />
            Derivadas
          </TabsTrigger>
          <TabsTrigger value="EN_BUSQUEDA" className="gap-2">
            <Search className="h-4 w-4" />
            En Búsqueda
          </TabsTrigger>
          <TabsTrigger value="ACTA_ENCONTRADA_PENDIENTE_PAGO" className="gap-2">
            <Banknote className="h-4 w-4" />
            Pendiente Pago
          </TabsTrigger>
          <TabsTrigger value="ACTA_NO_ENCONTRADA" className="gap-2">
            <XCircle className="h-4 w-4" />
            Acta No Encontrada
          </TabsTrigger>
          <TabsTrigger value="PAGO_VALIDADO" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Pago Validado
          </TabsTrigger>
          <TabsTrigger value="EN_PROCESAMIENTO_OCR" className="gap-2">
            <Cpu className="h-4 w-4" />
            En Procesamiento
          </TabsTrigger>
          <TabsTrigger value="CERTIFICADO_EMITIDO" className="gap-2">
            <Package className="h-4 w-4" />
            Emitido
          </TabsTrigger>
          <TabsTrigger value="ENTREGADO" className="gap-2">
            <Truck className="h-4 w-4" />
            Entregado
          </TabsTrigger>
        </TabsList>

        <TabsContent value={estadoActual} className="mt-6">
          {/* Tabla de Solicitudes */}
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <DataTable
                  columns={columns}
                  data={solicitudesResponse?.data || []}
                  loading={loadingSolicitudes}
                  emptyMessage="No hay solicitudes para mostrar"
                  pagination={
                    solicitudesResponse?.meta
                      ? {
                          currentPage: solicitudesResponse.meta.page,
                          totalPages: solicitudesResponse.meta.totalPages,
                          pageSize: solicitudesResponse.meta.limit,
                          totalItems: solicitudesResponse.meta.total,
                          onPageChange: setPage,
                        }
                      : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Detalles Mejorado */}
      {solicitudSeleccionada && (
        <SolicitudDetalleDialog
          open={mostrarDetalleDialog}
          onClose={() => {
            setMostrarDetalleDialog(false);
            setSolicitudSeleccionada(null);
          }}
          solicitud={solicitudSeleccionada}
        />
      )}

      {/* Dialog para Derivar a Editor */}
      {solicitudSeleccionada && (
        <DerivarEditorDialog
          open={mostrarDerivarDialog}
          onClose={() => {
            setMostrarDerivarDialog(false);
            setSolicitudSeleccionada(null);
          }}
          solicitud={solicitudSeleccionada}
          onSuccess={handleDerivarSuccess}
        />
      )}
    </div>
  );
}
