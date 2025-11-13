/**
 * Página de Gestión de Pagos para Mesa de Partes
 * Validación de pagos en efectivo y digitales
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/custom/PageHeader';
import { StatsCard } from '@/components/custom/StatsCard';
import { DataTable } from '@/components/custom/DataTable';
import type { Column } from '@/components/custom/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  DollarSign,
  Inbox,
  Clock,
  Wallet,
  Ban,
  Timer,
  Smartphone,
  Banknote,
  Building2,
  Filter,
  Download,
  FileText,
} from 'lucide-react';
import { pagoService, type Pago, type EstadoPago, type MetodoPago } from '@/services/pago.service';
import { ValidarPagoDialog } from '@/components/mesa-partes/ValidarPagoDialog';
import { RegistrarPagoEfectivoDialog } from '@/components/mesa-partes/RegistrarPagoEfectivoDialog';
import { ComprobanteViewer } from '@/components/mesa-partes/ComprobanteViewer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function PagosPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [estadoActual, setEstadoActual] = useState<EstadoPago | 'TODOS'>('TODOS');
  const [metodoPagoActual, setMetodoPagoActual] = useState<MetodoPago | 'TODOS'>('TODOS');
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [mostrarValidarDialog, setMostrarValidarDialog] = useState(false);
  const [mostrarRegistrarDialog, setMostrarRegistrarDialog] = useState(false);
  const [mostrarComprobanteViewer, setMostrarComprobanteViewer] = useState(false);

  // ============================================================================
  // QUERIES
  // ============================================================================

  // Obtener estadísticas
  const { data: estadisticas } = useQuery({
    queryKey: ['pagos-stats'],
    queryFn: () => pagoService.getEstadisticas(),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  });

  // Construir filtros según los tabs activos
  const filtros: any = {};
  if (estadoActual !== 'TODOS') filtros.estado = estadoActual;
  if (metodoPagoActual !== 'TODOS') filtros.metodoPago = metodoPagoActual;

  // Obtener pagos con filtros
  const { data: pagosResponse, isLoading: loadingPagos, refetch } = useQuery({
    queryKey: ['pagos', page, limit, filtros],
    queryFn: () => pagoService.getPagos({ ...filtros, page, limit }),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  });

  // Reset página al cambiar estado o método
  useEffect(() => {
    setPage(1);
  }, [estadoActual, metodoPagoActual]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleValidar = (pago: Pago) => {
    setPagoSeleccionado(pago);
    setMostrarValidarDialog(true);
  };

  const handleVerComprobante = (pago: Pago) => {
    setPagoSeleccionado(pago);
    setMostrarComprobanteViewer(true);
  };

  const handleValidarSuccess = () => {
    setMostrarValidarDialog(false);
    setPagoSeleccionado(null);
    refetch();
  };

  const handleRegistrarSuccess = () => {
    setMostrarRegistrarDialog(false);
    refetch();
  };

  const getEstadoBadge = (estado: EstadoPago | string) => {
    const config: Record<string, { label: string; className: string }> = {
      PENDIENTE: { label: 'Pendiente', className: 'bg-orange-100 text-orange-800' },
      PAGADO: { label: 'Pagado', className: 'bg-blue-100 text-blue-800' },
      VALIDADO: { label: 'Validado', className: 'bg-green-100 text-green-800' },
      RECHAZADO: { label: 'Rechazado', className: 'bg-red-100 text-red-800' },
      EXPIRADO: { label: 'Expirado', className: 'bg-gray-100 text-gray-800' },
      PENDIENTE_VALIDACION: { label: 'Pendiente Validación', className: 'bg-yellow-100 text-yellow-800' },
      CANCELADO: { label: 'Cancelado', className: 'bg-gray-100 text-gray-800' },
    };

    const estadoConfig = config[estado] || { label: estado, className: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={cn('font-medium', estadoConfig.className)}>
        {estadoConfig.label}
      </Badge>
    );
  };

  const getMetodoBadge = (metodo: MetodoPago | string) => {
    // Normalizar el método a mayúsculas
    const metodoNormalizado = (metodo || '').toUpperCase();
    
    const config = {
      YAPE: { label: 'Yape', className: 'bg-purple-100 text-purple-800' },
      PLIN: { label: 'Plin', className: 'bg-pink-100 text-pink-800' },
      EFECTIVO: { label: 'Efectivo', className: 'bg-green-100 text-green-800' },
      TARJETA: { label: 'Tarjeta', className: 'bg-blue-100 text-blue-800' },
      AGENTE_BANCARIO: { label: 'Agente', className: 'bg-cyan-100 text-cyan-800' },
      AGENTEBANCARIO: { label: 'Agente', className: 'bg-cyan-100 text-cyan-800' },
    }[metodoNormalizado] || { label: metodo, className: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={cn('font-medium', config.className)}>
        {config.label}
      </Badge>
    );
  };

  const formatFecha = (fecha?: Date | string) => {
    if (!fecha) return 'N/A';
    try {
      return format(new Date(fecha), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return 'N/A';
    }
  };

  const formatMonto = (monto: number | string | any) => {
    const montoNum = typeof monto === 'number' ? monto : Number(monto);
    return `S/ ${montoNum.toFixed(2)}`;
  };

  // ============================================================================
  // HANDLERS DE DESCARGA
  // ============================================================================

  const handleDescargarTicket = async (pago: Pago) => {
    try {
      const blob = await pagoService.descargarTicket(pago.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-${pago.numeroorden || pago.codigo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Ticket descargado correctamente');
    } catch (error: any) {
      toast.error('Error al descargar ticket', {
        description: error.message || 'No se pudo generar el ticket',
      });
    }
  };

  const handleDescargarRecibo = async (pago: Pago) => {
    try {
      const blob = await pagoService.descargarRecibo(pago.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo-${pago.numeroorden || pago.codigo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Recibo descargado correctamente');
    } catch (error: any) {
      toast.error('Error al descargar recibo', {
        description: error.message || 'No se pudo generar el recibo',
      });
    }
  };

  // ============================================================================
  // COLUMNAS DE LA TABLA
  // ============================================================================

  const columns: Column<Pago>[] = [
    {
      key: 'codigo',
      title: 'Código',
      sortable: true,
      render: (_, row) => (
        <div className="font-mono text-sm font-medium">
          {row.numeroorden || row.codigo || 'N/A'}
        </div>
      ),
    },
    {
      key: 'solicitud',
      title: 'Expediente',
      render: (_, row) => (
        <div className="text-sm">
          {row.solicitud?.numeroexpediente ? (
            <div>
              <div className="font-mono font-medium">{row.solicitud.numeroexpediente}</div>
              {row.solicitud.estudiante && (
                <div className="text-xs text-muted-foreground">
                  {row.solicitud.estudiante.apellidopaterno} {row.solicitud.estudiante.nombres}
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">Sin expediente</span>
          )}
        </div>
      ),
    },
    {
      key: 'monto',
      title: 'Monto',
      sortable: true,
      render: (_, row) => (
        <div className="font-semibold text-sm">{formatMonto(row.monto)}</div>
      ),
    },
    {
      key: 'metodoPago',
      title: 'Método',
      sortable: true,
      render: (_, row) => getMetodoBadge(row.metodoPago || (row as any).metodopago),
    },
    {
      key: 'estado',
      title: 'Estado',
      sortable: true,
      render: (_, row) => getEstadoBadge(row.estado),
    },
    {
      key: 'fechaCreacion',
      title: 'Fecha Creación',
      sortable: true,
      render: (_, row) => (
        <div className="text-sm">
          {formatFecha(row.fechaCreacion || row.fechaPago || (row as any).fecharegistro)}
        </div>
      ),
    },
    {
      key: 'comprobante',
      title: 'Comprobante',
      render: (_, row) => {
        const tieneComprobante = row.urlcomprobante || row.comprobantePath;
        const metodoPago = row.metodoPago || (row as any).metodopago;
        const esEfectivo = metodoPago?.toUpperCase() === 'EFECTIVO';
        const numeroRecibo = row.numeroRecibo || (row as any).numerorecibo;
        
        if (esEfectivo && numeroRecibo) {
          return (
            <div className="text-sm">
              <div className="font-mono text-xs">{numeroRecibo}</div>
              <div className="text-xs text-muted-foreground">Recibo</div>
            </div>
          );
        }
        
        if (tieneComprobante) {
          return (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleVerComprobante(row)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          );
        }
        
        return <span className="text-xs text-muted-foreground">Sin comprobante</span>;
      },
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {/* Botón Validar */}
          {pagoService.puedeValidar(row) && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleValidar(row)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Validar
            </Button>
          )}

          {/* Botón Descargar Ticket */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDescargarTicket(row)}
            title="Descargar ticket de pago"
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Botón Descargar Recibo (solo efectivo validado) */}
          {(row.metodoPago === 'EFECTIVO' || (row as any).metodopago === 'EFECTIVO') && row.estado === 'VALIDADO' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDescargarRecibo(row)}
              title="Descargar recibo oficial"
            >
              <FileText className="h-4 w-4" />
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
        title="Gestión de Pagos"
        description="Mesa de Partes - Valida pagos en efectivo y digitales"
        actions={
          <Button onClick={() => setMostrarRegistrarDialog(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Registrar Pago Efectivo
          </Button>
        }
      />

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Pagos"
          value={estadisticas?.totalPagos || 0}
          description="Todos los pagos"
          icon={CreditCard}
        />

        <StatsCard
          title="Pendientes Validación"
          value={estadisticas?.pendientesValidacion || 0}
          description="Por validar"
          icon={AlertCircle}
          className="border-orange-200 dark:border-orange-900"
        />

        <StatsCard
          title="Validados"
          value={estadisticas?.validados || 0}
          description="Aprobados"
          icon={CheckCircle2}
          className="border-green-200 dark:border-green-900"
        />

        <StatsCard
          title="Rechazados"
          value={estadisticas?.rechazados || 0}
          description="No aprobados"
          icon={XCircle}
          className="border-red-200 dark:border-red-900"
        />
      </div>

      {/* Filtros con Tabs */}
      <div className="space-y-4">
        {/* Tabs por Estado */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">Filtrar por Estado</h3>
          </div>
          <Tabs value={estadoActual} onValueChange={(value) => setEstadoActual(value as any)} className="w-full">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-transparent p-0">
              <TabsTrigger value="TODOS" className="gap-2">
                <Inbox className="h-4 w-4" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="PENDIENTE" className="gap-2">
                <Clock className="h-4 w-4" />
                Pendientes
              </TabsTrigger>
              <TabsTrigger value="PAGADO" className="gap-2">
                <Wallet className="h-4 w-4" />
                Pagados
              </TabsTrigger>
              <TabsTrigger value="VALIDADO" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Validados
              </TabsTrigger>
              <TabsTrigger value="RECHAZADO" className="gap-2">
                <Ban className="h-4 w-4" />
                Rechazados
              </TabsTrigger>
              <TabsTrigger value="EXPIRADO" className="gap-2">
                <Timer className="h-4 w-4" />
                Expirados
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tabs por Método de Pago */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">Filtrar por Método de Pago</h3>
          </div>
          <Tabs value={metodoPagoActual} onValueChange={(value) => setMetodoPagoActual(value as any)} className="w-full">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-transparent p-0">
              <TabsTrigger value="TODOS" className="gap-2">
                <Inbox className="h-4 w-4" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="EFECTIVO" className="gap-2">
                <Banknote className="h-4 w-4" />
                Efectivo
              </TabsTrigger>
              <TabsTrigger value="YAPE" className="gap-2">
                <Smartphone className="h-4 w-4" />
                Yape
              </TabsTrigger>
              <TabsTrigger value="PLIN" className="gap-2">
                <Smartphone className="h-4 w-4" />
                Plin
              </TabsTrigger>
              <TabsTrigger value="TARJETA" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Tarjeta
              </TabsTrigger>
              <TabsTrigger value="AGENTE_BANCARIO" className="gap-2">
                <Building2 className="h-4 w-4" />
                Agente Bancario
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tabla de Pagos */}
      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={pagosResponse?.data || []}
            loading={loadingPagos}
            emptyMessage="No hay pagos para mostrar"
            pagination={
              pagosResponse?.meta
                ? {
                    currentPage: pagosResponse.meta.page,
                    totalPages: pagosResponse.meta.totalPages,
                    pageSize: pagosResponse.meta.limit,
                    totalItems: pagosResponse.meta.total,
                    onPageChange: setPage,
                  }
                : undefined
            }
            search={{
              placeholder: 'Buscar por código...',
              onSearch: () => {
                // Implementar búsqueda si es necesario
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      {pagoSeleccionado && mostrarValidarDialog && (
        <ValidarPagoDialog
          open={mostrarValidarDialog}
          onClose={() => {
            setMostrarValidarDialog(false);
            setPagoSeleccionado(null);
          }}
          pago={pagoSeleccionado}
          onSuccess={handleValidarSuccess}
        />
      )}

      <RegistrarPagoEfectivoDialog
        open={mostrarRegistrarDialog}
        onClose={() => setMostrarRegistrarDialog(false)}
        onSuccess={handleRegistrarSuccess}
      />

      {pagoSeleccionado && mostrarComprobanteViewer && (
        <ComprobanteViewer
          open={mostrarComprobanteViewer}
          onClose={() => {
            setMostrarComprobanteViewer(false);
            setPagoSeleccionado(null);
          }}
          pago={pagoSeleccionado}
        />
      )}
    </div>
  );
}
