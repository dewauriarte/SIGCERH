/**
 * Dashboard Específico para Mesa de Partes
 * Estadísticas, gráficos y acciones rápidas
 */

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/custom/PageHeader';
import { StatsCard } from '@/components/custom/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  CreditCard,
  FileCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  DollarSign,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { mesaPartesService } from '@/services/mesa-partes.service';
import { pagoService } from '@/services/pago.service';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function DashboardMesaDePartesPage() {
  const navigate = useNavigate();

  // ============================================================================
  // QUERIES
  // ============================================================================

  // Estadísticas principales
  const { data: estadisticas, isLoading: loadingEstadisticas, error: errorEstadisticas } = useQuery({
    queryKey: ['mesa-partes-estadisticas'],
    queryFn: () => mesaPartesService.getEstadisticas(),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
    staleTime: 60 * 1000, // 1 minuto
  });

  const { data: pagosStats } = useQuery({
    queryKey: ['pagos-stats'],
    queryFn: () => pagoService.getEstadisticas(),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
    staleTime: 60 * 1000, // 1 minuto
  });

  const { data: solicitudesSemana } = useQuery({
    queryKey: ['solicitudes-semana'],
    queryFn: () => mesaPartesService.getSolicitudesUltimaSemana(),
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const { data: actividadReciente } = useQuery({
    queryKey: ['actividad-reciente'],
    queryFn: () => mesaPartesService.getActividadReciente(10),
    refetchInterval: 2 * 60 * 1000, // 2 minutos
    staleTime: 60 * 1000, // 1 minuto
  });

  // Datos para gráficos
  const solicitudesPorDia = solicitudesSemana?.data || [];

  // ============================================================================
  // ACCIONES RÁPIDAS
  // ============================================================================

  const accionesRapidas = [
    {
      titulo: 'Gestionar Solicitudes',
      descripcion: 'Ver y derivar solicitudes pendientes',
      icono: ClipboardList,
      ruta: '/solicitudes',
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      count: estadisticas?.data?.pendientesDerivacion || 0,
    },
    {
      titulo: 'Validar Pagos',
      descripcion: 'Aprobar pagos en efectivo y digitales',
      icono: CreditCard,
      ruta: '/pagos',
      color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      count: pagosStats?.pendientesValidacion || 0,
    },
    {
      titulo: 'Entregas',
      descripcion: 'Certificados listos para entregar',
      icono: Package,
      ruta: '/entregas',
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      count: estadisticas?.data?.listasEntrega || 0,
    },
  ];

  // Actividad reciente viene del backend
  const actividades = actividadReciente?.data || [];

  const getIconoActividad = (tipo: string) => {
    switch (tipo) {
      case 'solicitud':
        return <ClipboardList className="h-4 w-4" />;
      case 'pago':
        return <DollarSign className="h-4 w-4" />;
      case 'entrega':
        return <Package className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getColorActividad = (tipo: string) => {
    switch (tipo) {
      case 'solicitud':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pago':
        return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'entrega':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatTiempoTranscurrido = (fecha: Date) => {
    const minutos = Math.floor((Date.now() - fecha.getTime()) / (1000 * 60));
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard - Mesa de Partes"
        description="Panel de control y estadísticas en tiempo real"
      />

      {/* Estadísticas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Solicitudes Pendientes"
          value={estadisticas?.data?.pendientesDerivacion || 0}
          description="Por derivar a Editor"
          icon={ClipboardList}
          className="border-blue-200 dark:border-blue-900"
        />

        <StatsCard
          title="Pagos por Validar"
          value={pagosStats?.pendientesValidacion || 0}
          description="Efectivo y digitales"
          icon={CreditCard}
          className="border-orange-200 dark:border-orange-900"
        />

        <StatsCard
          title="Listos para Entrega"
          value={estadisticas?.data?.listasEntrega || 0}
          description="Certificados emitidos"
          icon={FileCheck}
          className="border-green-200 dark:border-green-900"
        />

        <StatsCard
          title="Entregados Hoy"
          value={estadisticas?.data?.entregadosHoy || 0}
          description="Completados"
          icon={CheckCircle2}
          className="border-purple-200 dark:border-purple-900"
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Solicitudes por Día */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Solicitudes - Última Semana
            </CardTitle>
            <CardDescription>
              Solicitudes y pagos procesados por día
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={solicitudesPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="solicitudes"
                  stroke="#3b82f6"
                  name="Solicitudes"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="pagos"
                  stroke="#10b981"
                  name="Pagos"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pagos por Día */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Pagos Validados - Última Semana
            </CardTitle>
            <CardDescription>
              Comparativa de validaciones por día
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={solicitudesPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pagos" fill="#10b981" name="Pagos Validados" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Accede directamente a las secciones principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {accionesRapidas.map((accion, index) => {
              const Icono = accion.icono;
              return (
                <Card
                  key={index}
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
                  onClick={() => navigate(accion.ruta)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${accion.color}`}>
                            <Icono className="h-5 w-5" />
                          </div>
                          {accion.count > 0 && (
                            <Badge variant="destructive">{accion.count}</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold mb-1">{accion.titulo}</h3>
                        <p className="text-sm text-muted-foreground">
                          {accion.descripcion}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actividad Reciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Actividad Reciente
          </CardTitle>
          <CardDescription>
            Últimas acciones realizadas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actividades.map((actividad: any) => (
              <div
                key={actividad.id}
                className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className={`p-2 rounded-full ${getColorActividad(actividad.tipo)}`}>
                  {getIconoActividad(actividad.tipo)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{actividad.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTiempoTranscurrido(new Date(actividad.fecha))}
                  </p>
                </div>
                <Badge variant="outline">{actividad.estado}</Badge>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              Ver Todas las Actividades
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
