/**
 * Página de Expedientes Asignados - Editor
 *
 * Muestra todos los expedientes asignados al editor actual para búsqueda de actas.
 * Incluye filtros por estado, prioridad y búsqueda.
 * Permite ver detalles y realizar acciones (buscar acta, subir acta).
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/custom/PageHeader';
import { DataTable } from '@/components/custom/DataTable';
import { StatsCard } from '@/components/custom/StatsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FolderSearch,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Eye,
  Play,
  Search,
  XCircle,
  UserCog,
  Banknote,
  Brain,
} from 'lucide-react';
import { editorService, type ExpedienteAsignado, type EstadoBusqueda } from '@/services/editor.service';
import { DetalleExpedienteDialog } from '@/components/editor/DetalleExpedienteDialog';
import { BuscarActaDialog } from '@/components/editor/BuscarActaDialog';
import { SubirActaDialog } from '@/components/editor/SubirActaDialog';
import { ProcesarOCRDialog } from '@/components/editor/ProcesarOCRDialog';

// ============================================================================
// TIPOS
// ============================================================================

type Prioridad = 'NORMAL' | 'URGENTE' | 'MUY_URGENTE';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ExpedientesAsignadosPage() {
  const queryClient = useQueryClient();
  
  // Estados locales
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [estadoActual, setEstadoActual] = useState<EstadoBusqueda | 'TODOS'>('TODOS');
  const [prioridadFiltro, setPrioridadFiltro] = useState<Prioridad | 'TODOS'>('TODOS');
  const [busqueda, setBusqueda] = useState('');

  // Dialogs
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState<ExpedienteAsignado | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [buscarActaOpen, setBuscarActaOpen] = useState(false);
  const [subirActaOpen, setSubirActaOpen] = useState(false);
  const [procesarOCROpen, setProcesarOCROpen] = useState(false);
  const [metadataActa, setMetadataActa] = useState<any>(null);

  // Reset page when changing tabs
  const handleTabChange = (value: string) => {
    setEstadoActual(value as EstadoBusqueda | 'TODOS');
    setPage(1);
  };

  // ============================================================================
  // QUERIES
  // ============================================================================

  const { data: expedientesData, isLoading } = useQuery({
    queryKey: ['editor-expedientes-asignados', page, limit, estadoActual, prioridadFiltro, busqueda],
    queryFn: () => editorService.getExpedientesAsignados({ 
      page, 
      limit,
      estadoBusqueda: estadoActual !== 'TODOS' ? estadoActual : undefined,
    }),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
    staleTime: 60 * 1000, // 1 minuto
  });

  const { data: estadisticas } = useQuery({
    queryKey: ['editor-stats-expedientes'],
    queryFn: () => editorService.getEstadisticas(),
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
  });

  // Aplicar filtros adicionales en el cliente (el estado ya se filtró en backend)
  const expedientesFiltrados = expedientesData?.data?.filter((exp) => {
    // Filtro por prioridad
    if (prioridadFiltro !== 'TODOS' && exp.prioridad !== prioridadFiltro) {
      return false;
    }

    // Búsqueda por texto
    if (busqueda.trim()) {
      const searchLower = busqueda.toLowerCase();
      return (
        exp.numeroExpediente.toLowerCase().includes(searchLower) ||
        exp.estudiante.nombres.toLowerCase().includes(searchLower) ||
        exp.estudiante.apellidoPaterno.toLowerCase().includes(searchLower) ||
        exp.estudiante.apellidoMaterno.toLowerCase().includes(searchLower) ||
        exp.estudiante.numeroDocumento.includes(searchLower)
      );
    }

    return true;
  }) || [];

  // ============================================================================
  // ACCIONES
  // ============================================================================

  const handleVerDetalle = (expediente: ExpedienteAsignado) => {
    setExpedienteSeleccionado(expediente);
    setDetalleOpen(true);
  };

  const handleIniciarBusqueda = async (expediente: ExpedienteAsignado) => {
    try {
      await editorService.iniciarBusqueda(expediente.id);
      toast.success('Búsqueda iniciada correctamente');
      // Refrescar datos
      queryClient.invalidateQueries({ queryKey: ['editor-expedientes-asignados'] });
      queryClient.invalidateQueries({ queryKey: ['editor-stats-expedientes'] });
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar búsqueda');
    }
  };

  const handleMarcarResultado = (expediente: ExpedienteAsignado) => {
    setExpedienteSeleccionado(expediente);
    setBuscarActaOpen(true);
  };

  const handleSubirActa = (expediente: ExpedienteAsignado) => {
    setExpedienteSeleccionado(expediente);
    setSubirActaOpen(true);
  };

  // ============================================================================
  // DEFINICIÓN DE COLUMNAS
  // ============================================================================

  const getEstadoBadge = (estado: EstadoBusqueda) => {
    const config: Record<string, { label: string; className: string }> = {
      DERIVADO_A_EDITOR: { label: 'Pendiente Búsqueda', className: 'bg-gray-100 text-gray-800' },
      EN_BUSQUEDA: { label: 'En Búsqueda', className: 'bg-blue-100 text-blue-800' },
      ACTA_ENCONTRADA_PENDIENTE_PAGO: { label: 'Encontrada - Esperando Pago', className: 'bg-green-100 text-green-800' },
      ACTA_NO_ENCONTRADA: { label: 'No Encontrada', className: 'bg-red-100 text-red-800' },
      PENDIENTE_BUSQUEDA: { label: 'Pendiente', className: 'bg-gray-100 text-gray-800' },
      ACTA_ENCONTRADA: { label: 'Acta Encontrada', className: 'bg-green-100 text-green-800' },
      ESPERANDO_PAGO: { label: 'Esperando Pago', className: 'bg-yellow-100 text-yellow-800' },
      LISTO_PARA_OCR: { label: 'Listo para OCR', className: 'bg-purple-100 text-purple-800' },
      REGISTRADA: { label: 'Registrada', className: 'bg-blue-100 text-blue-800' },
    };

    const fallback = { label: estado, className: 'bg-gray-100 text-gray-800' };
    const badge = config[estado] || fallback;
    
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const getPrioridadBadge = (prioridad: Prioridad) => {
    const config: Record<string, { label: string; className: string }> = {
      NORMAL: { label: 'Normal', className: 'bg-blue-100 text-blue-800' },
      URGENTE: { label: 'Urgente', className: 'bg-orange-100 text-orange-800' },
      MUY_URGENTE: { label: 'Muy Urgente', className: 'bg-red-100 text-red-800' },
    };

    const badge = config[prioridad] || { label: prioridad, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const columns = [
    {
      key: 'numeroExpediente',
      title: 'Expediente',
      sortable: true,
      render: (_: string, row: ExpedienteAsignado) => (
        <div>
          <p className="font-medium">{row.numeroExpediente}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(row.fechaAsignacion).toLocaleDateString()}
          </p>
        </div>
      ),
    },
    {
      key: 'estudiante',
      title: 'Estudiante',
      sortable: false,
      render: (_: string, row: ExpedienteAsignado) => (
        <div>
          <p className="font-medium">
            {row.estudiante.apellidoPaterno} {row.estudiante.apellidoMaterno}, {row.estudiante.nombres}
          </p>
          <p className="text-xs text-muted-foreground">DNI: {row.estudiante.numeroDocumento}</p>
        </div>
      ),
    },
    {
      key: 'datosAcademicos',
      title: 'Datos Académicos',
      sortable: false,
      render: (_: string, row: ExpedienteAsignado) => (
        <div className="text-sm">
          <p>{row.datosAcademicos?.grado || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{row.datosAcademicos?.anioLectivo || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'diasDesdeAsignacion',
      title: 'Días Asignado',
      sortable: true,
      render: (_: string, row: ExpedienteAsignado) => (
        <div className="text-center">
          <p className={`font-semibold ${row.diasDesdeAsignacion > 7 ? 'text-orange-600' : ''}`}>
            {row.diasDesdeAsignacion}
          </p>
          <p className="text-xs text-muted-foreground">días</p>
        </div>
      ),
    },
    {
      key: 'prioridad',
      title: 'Prioridad',
      sortable: true,
      render: (_: string, row: ExpedienteAsignado) => getPrioridadBadge(row.prioridad),
    },
    {
      key: 'estadoBusqueda',
      title: 'Estado',
      sortable: true,
      render: (_: string, row: ExpedienteAsignado) => getEstadoBadge(row.estadoBusqueda),
    },
    {
      key: 'acciones',
      title: 'Acciones',
      sortable: false,
      render: (_: string, row: ExpedienteAsignado) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVerDetalle(row)}
            title="Ver Detalle"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {/* Botón: Iniciar Búsqueda (DERIVADO_A_EDITOR o PENDIENTE_BUSQUEDA) */}
          {(row.estadoBusqueda === 'DERIVADO_A_EDITOR' || row.estadoBusqueda === 'PENDIENTE_BUSQUEDA') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleIniciarBusqueda(row)}
              title="Iniciar Búsqueda"
            >
              <Search className="h-4 w-4 text-blue-600" />
            </Button>
          )}

          {/* Botón: Marcar Resultado (EN_BUSQUEDA) */}
          {row.estadoBusqueda === 'EN_BUSQUEDA' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarcarResultado(row)}
              title="Marcar Resultado"
            >
              <Play className="h-4 w-4 text-green-600" />
            </Button>
          )}

          {/* Botón: Esperando Pago (ACTA_ENCONTRADA_PENDIENTE_PAGO) */}
          {row.estadoBusqueda === 'ACTA_ENCONTRADA_PENDIENTE_PAGO' && (
            <Button
              variant="ghost"
              size="sm"
              disabled
              title="Esperando validación de pago"
            >
              <Banknote className="h-4 w-4 text-orange-400" />
            </Button>
          )}

          {/* Botón: Subir Acta (LISTO_PARA_OCR sin acta subida) */}
          {row.estadoBusqueda === 'LISTO_PARA_OCR' && !hasActaSubida(row) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSubirActa(row)}
              title="Subir Acta Física"
            >
              <Upload className="h-4 w-4 text-purple-600" />
            </Button>
          )}

          {/* Botón: Procesar OCR (LISTO_PARA_OCR con acta subida) */}
          {row.estadoBusqueda === 'LISTO_PARA_OCR' && hasActaSubida(row) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleProcesarOCR(row)}
              title="Procesar con IA/OCR"
            >
              <Brain className="h-4 w-4 text-purple-600" />
            </Button>
          )}

          {/* Botón: Ver Resultado OCR (EN_PROCESAMIENTO_OCR) */}
          {row.estadoBusqueda === 'EN_PROCESAMIENTO_OCR' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleProcesarOCR(row)}
              title="Ver Resultado OCR"
            >
              <Brain className="h-4 w-4 text-blue-600" />
            </Button>
          )}

          {/* Botón: Acta No Encontrada (ACTA_NO_ENCONTRADA) */}
          {row.estadoBusqueda === 'ACTA_NO_ENCONTRADA' && (
            <Button
              variant="ghost"
              size="sm"
              disabled
              title="Acta no encontrada"
            >
              <XCircle className="h-4 w-4 text-red-400" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Helper: Verificar si el expediente tiene acta subida
  const hasActaSubida = (expediente: ExpedienteAsignado) => {
    try {
      // Los expedientes en LISTO_PARA_OCR ya tienen acta subida por definición
      if (expediente.estadoBusqueda === 'LISTO_PARA_OCR') {
        return true; // Todos los LISTO_PARA_OCR ya pagaron y tienen acta
      }
      const observaciones = JSON.parse((expediente as any).observaciones || '{}');
      return !!observaciones.actaFisica;
    } catch {
      return false;
    }
  };

  // Handler: Procesar OCR
  const handleProcesarOCR = (expediente: ExpedienteAsignado) => {
    try {
      const observaciones = JSON.parse((expediente as any).observaciones || '{}');
      const actaFisica = observaciones.actaFisica;

      if (!actaFisica) {
        toast.error('No se encontró metadata del acta');
        return;
      }

      setExpedienteSeleccionado(expediente);
      setMetadataActa(actaFisica);
      setProcesarOCROpen(true);
    } catch (error) {
      toast.error('Error al abrir procesamiento OCR');
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Expedientes Asignados"
        description="Gestiona los expedientes asignados para búsqueda de actas"
      />

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Asignados"
          value={estadisticas?.data?.expedientesAsignados || 0}
          description="Expedientes activos"
          icon={FolderSearch}
          className="border-blue-200 dark:border-blue-900"
        />

        <StatsCard
          title="Pendientes Búsqueda"
          value={expedientesFiltrados.filter(e => 
            e.estadoBusqueda === 'DERIVADO_A_EDITOR' || e.estadoBusqueda === 'PENDIENTE_BUSQUEDA'
          ).length}
          description="Por iniciar búsqueda"
          icon={Clock}
          className="border-orange-200 dark:border-orange-900"
        />

        <StatsCard
          title="Actas Encontradas"
          value={expedientesFiltrados.filter(e => 
            e.estadoBusqueda === 'ACTA_ENCONTRADA' || 
            e.estadoBusqueda === 'ACTA_ENCONTRADA_PENDIENTE_PAGO' || 
            e.estadoBusqueda === 'LISTO_PARA_OCR'
          ).length}
          description="Listas para procesar"
          icon={CheckCircle2}
          className="border-green-200 dark:border-green-900"
        />

        <StatsCard
          title="Urgentes"
          value={expedientesFiltrados.filter(e => e.prioridad === 'MUY_URGENTE' || e.prioridad === 'URGENTE').length}
          description="Requieren atención"
          icon={AlertTriangle}
          className="border-red-200 dark:border-red-900"
        />
      </div>

      {/* Tabs por Estado */}
      <Tabs value={estadoActual} onValueChange={handleTabChange} className="w-full">
        <TabsList className="inline-flex h-auto flex-wrap justify-start gap-1 bg-muted p-1 rounded-md">
          <TabsTrigger value="TODOS" className="gap-2">
            <FolderSearch className="h-4 w-4" />
            Todos
          </TabsTrigger>
          <TabsTrigger value="DERIVADO_A_EDITOR" className="gap-2">
            <UserCog className="h-4 w-4" />
            Pendiente Búsqueda
          </TabsTrigger>
          <TabsTrigger value="EN_BUSQUEDA" className="gap-2">
            <Search className="h-4 w-4" />
            En Búsqueda
          </TabsTrigger>
          <TabsTrigger value="ACTA_ENCONTRADA_PENDIENTE_PAGO" className="gap-2">
            <Banknote className="h-4 w-4" />
            Esperando Pago
          </TabsTrigger>
          <TabsTrigger value="LISTO_PARA_OCR" className="gap-2">
            <Upload className="h-4 w-4" />
            Listo para OCR
          </TabsTrigger>
          <TabsTrigger value="EN_PROCESAMIENTO_OCR" className="gap-2">
            <Brain className="h-4 w-4" />
            En OCR
          </TabsTrigger>
          <TabsTrigger value="ACTA_NO_ENCONTRADA" className="gap-2">
            <XCircle className="h-4 w-4" />
            No Encontrada
          </TabsTrigger>
        </TabsList>

        <TabsContent value={estadoActual} className="mt-6 space-y-4">
          {/* Filtros Adicionales */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Prioridad</label>
                  <Select value={prioridadFiltro} onValueChange={(v) => setPrioridadFiltro(v as Prioridad | 'TODOS')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todas las prioridades</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="URGENTE">Urgente</SelectItem>
                      <SelectItem value="MUY_URGENTE">Muy Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Expediente, DNI, nombre..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla */}
          <DataTable
            columns={columns}
            data={expedientesFiltrados}
            loading={isLoading}
            pagination={{
              currentPage: page,
              totalPages: expedientesData?.meta?.totalPages || 1,
              pageSize: limit,
              totalItems: expedientesData?.meta?.total || 0,
              onPageChange: setPage,
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {expedienteSeleccionado && (
        <>
          <DetalleExpedienteDialog
            open={detalleOpen}
            onClose={() => {
              setDetalleOpen(false);
              setExpedienteSeleccionado(null);
            }}
            expediente={expedienteSeleccionado}
          />

          <BuscarActaDialog
            open={buscarActaOpen}
            onClose={() => {
              setBuscarActaOpen(false);
              setExpedienteSeleccionado(null);
            }}
            expediente={expedienteSeleccionado}
          />

          <SubirActaDialog
            open={subirActaOpen}
            onClose={() => {
              setSubirActaOpen(false);
              setExpedienteSeleccionado(null);
            }}
            expediente={expedienteSeleccionado}
          />

          {metadataActa && (
            <ProcesarOCRDialog
              open={procesarOCROpen}
              onOpenChange={(open) => {
                setProcesarOCROpen(open);
                if (!open) {
                  setExpedienteSeleccionado(null);
                  setMetadataActa(null);
                }
              }}
              expediente={expedienteSeleccionado}
              metadataActa={metadataActa}
            />
          )}
        </>
      )}
    </div>
  );
}
