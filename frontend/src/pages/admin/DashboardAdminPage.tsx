/**
 * Dashboard Principal del Administrador
 * Métricas globales, gráficos y actividad del sistema
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { adminService } from '@/services/admin.service';

// ============================================================================
// COLORES PARA GRÁ FICOS
// ============================================================================

const COLORS = {
  primary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function DashboardAdminPage() {
  const navigate = useNavigate();

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  const { data: estadisticasResponse, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-estadisticas'],
    queryFn: () => adminService.getEstadisticas(),
    refetchInterval: 30000, // 30 segundos
  });

  const { data: solicitudesMesResponse, isLoading: isLoadingSolicitudes } = useQuery({
    queryKey: ['admin-solicitudes-mes'],
    queryFn: () => adminService.getSolicitudesPorMes(),
  });

  const { data: certificadosColegioResponse, isLoading: isLoadingCertificados } = useQuery({
    queryKey: ['admin-certificados-colegio'],
    queryFn: () => adminService.getCertificadosPorColegio(),
  });

  // Extraer datos
  const stats = estadisticasResponse?.data || {
    usuarios: { total: 0, activos: 0, bloqueados: 0, nuevosMesActual: 0 },
    solicitudes: { total: 0, pendientes: 0, procesadas: 0, mesActual: 0 },
    certificados: { total: 0, emitidos: 0, digitales: 0, mesActual: 0 },
    sistema: { espacioUsado: '0 MB', tiempoPromedioEmision: 0, tasaExito: 0, ultimaActualizacion: new Date() },
  };

  const solicitudesMes = solicitudesMesResponse?.data || [];
  const certificadosColegio = (certificadosColegioResponse?.data || []).slice(0, 10);

  // Datos para gráfico de pie (estados de solicitudes)
  const estadosSolicitudes = [
    { name: 'Aprobadas', value: stats.solicitudes.procesadas, color: COLORS.success },
    { name: 'Pendientes', value: stats.solicitudes.pendientes, color: COLORS.warning },
    { name: 'Rechazadas', value: stats.solicitudes.total - stats.solicitudes.procesadas - stats.solicitudes.pendientes, color: COLORS.danger },
  ];

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isLoadingStats) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Dashboard Administrativo</h1>
          <p className="text-muted-foreground mt-1">
            Vista general del sistema SIGCERH
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/reportes')}>
          <FileText className="h-4 w-4 mr-2" />
          Ver Reportes
        </Button>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Usuarios */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuarios Totales
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold dark:text-white">
              {stats.usuarios.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.usuarios.activos} activos · {stats.usuarios.bloqueados} bloqueados
            </p>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                +{stats.usuarios.nuevosMesActual} este mes
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Solicitudes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solicitudes
            </CardTitle>
            <FileText className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold dark:text-white">
              {stats.solicitudes.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.solicitudes.pendientes} pendientes · {stats.solicitudes.procesadas} procesadas
            </p>
            <div className="flex items-center mt-2">
              <Activity className="h-4 w-4 text-purple-600 mr-1" />
              <span className="text-sm text-purple-600 font-medium">
                {stats.solicitudes.mesActual} este mes
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Certificados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Certificados Emitidos
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold dark:text-white">
              {stats.certificados.emitidos.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.certificados.digitales} digitales · {stats.certificados.total - stats.certificados.digitales} físicos
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                {stats.certificados.mesActual} este mes
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Rendimiento del Sistema */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Éxito
            </CardTitle>
            <Activity className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold dark:text-white">
              {stats.sistema.tasaExito.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.sistema.tiempoPromedioEmision} días promedio de emisión
            </p>
            <div className="flex items-center mt-2">
              <Clock className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-xs text-muted-foreground">
                Espacio: {stats.sistema.espacioUsado}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solicitudes por Mes */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes por Mes</CardTitle>
            <CardDescription>Últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSolicitudes ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={solicitudesMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    name="Total"
                    dot={{ fill: COLORS.primary, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="aprobadas"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    name="Aprobadas"
                    dot={{ fill: COLORS.success, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rechazadas"
                    stroke={COLORS.danger}
                    strokeWidth={2}
                    name="Rechazadas"
                    dot={{ fill: COLORS.danger, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Estados de Solicitudes */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Solicitudes</CardTitle>
            <CardDescription>Por estado actual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={estadosSolicitudes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }: any) =>
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {estadosSolicitudes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 Colegios */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 Colegios por Certificados Emitidos</CardTitle>
            <CardDescription>Instituciones con más certificados</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCertificados ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={certificadosColegio}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="colegio"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    stroke="#6b7280"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="total" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/dashboard/usuarios')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold dark:text-white">Gestionar Usuarios</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ver, crear y editar usuarios
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/dashboard/configuracion')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-purple-600" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold dark:text-white">Configuración</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Sistema e institución
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/dashboard/reportes/auditoria')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold dark:text-white">Auditoría</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Logs del sistema
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/dashboard/reportes')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold dark:text-white">Reportes</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Generar y exportar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Última Actualización</p>
              <p className="text-lg font-semibold dark:text-white mt-1">
                {format(new Date(stats.sistema.ultimaActualizacion), 'PPP', { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Espacio Usado</p>
              <p className="text-lg font-semibold dark:text-white mt-1">
                {stats.sistema.espacioUsado}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tiempo Promedio Emisión</p>
              <p className="text-lg font-semibold dark:text-white mt-1">
                {stats.sistema.tiempoPromedioEmision} días
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
              <p className="text-lg font-semibold text-green-600 mt-1">
                {stats.sistema.tasaExito.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

