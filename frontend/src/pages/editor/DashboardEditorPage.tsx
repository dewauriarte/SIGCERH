/**
 * Dashboard Específico para Editor / Oficina de Actas
 *
 * Muestra información relevante del flujo de trabajo del Editor:
 * - Expedientes asignados para búsqueda
 * - Actas encontradas y procesadas
 * - Estado del procesamiento OCR
 * - Certificados enviados a UGEL
 * - Progreso del día
 * - Lista de expedientes urgentes
 *
 * Actualización en tiempo real cada 30 segundos
 */

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/custom/PageHeader';
import { StatsCard } from '@/components/custom/StatsCard';
import { LoadingSpinner } from '@/components/custom/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FolderSearch,
  FileCheck,
  FileScan,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Package,
  Brain,
  Upload,
  BookOpen,
  Users,
  Calendar,
} from 'lucide-react';
import { editorService } from '@/services/editor.service';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
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

export default function DashboardEditorPage() {
  const navigate = useNavigate();

  // ==========================================================================
  // QUERIES - Estadísticas en tiempo real
  // ==========================================================================

  const { data: estadisticasResponse, isLoading: isLoadingEstadisticas } = useQuery({
    queryKey: ['editor-stats-dashboard'],
    queryFn: () => editorService.getEstadisticas(),
    refetchInterval: 30000,
  });

  const { data: expedientesResponse, isLoading: isLoadingExpedientes } = useQuery({
    queryKey: ['editor-expedientes-urgentes'],
    queryFn: () => editorService.getExpedientesAsignados({ page: 1, limit: 5 }),
    refetchInterval: 30000,
  });

  const { data: rendimientoSemanalResponse } = useQuery({
    queryKey: ['editor-rendimiento-semanal'],
    queryFn: async () => {
      // Obtener estadísticas de los últimos 7 días
      const hoy = new Date();
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const datos = [];
      
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - i);
        const dia = diasSemana[fecha.getDay()];
        
        // Por ahora usamos datos simulados, en producción se obtendrían del backend
        datos.push({
          dia,
          actas: Math.floor(Math.random() * 15),
          certificados: Math.floor(Math.random() * 12),
        });
      }
      
      return datos;
    },
    refetchInterval: 60000, // Actualizar cada minuto
  });

  // Extraer datos de las respuestas
  const statsData = estadisticasResponse?.data || {
    expedientesAsignados: 0,
    actasEncontradasHoy: 0,
    procesadasConOCR: 0,
    enviadasAUgel: 0,
    observadosPorUgel: 0,
  };

  // Debug: Mostrar datos en consola
  console.log('Estadísticas Editor:', statsData);
  console.log('Respuesta completa:', estadisticasResponse);

  const expedientesUrgentes = expedientesResponse?.data || [];

  // Calcular progreso del día basado en actas encontradas
  const objetivo = 10; // Meta diaria
  const completado = statsData.actasEncontradasHoy;
  const progressData = {
    meta: Math.min(Math.round((completado / objetivo) * 100), 100),
    objetivo,
    completado,
  };

  // Datos del gráfico semanal
  const progressoSemanal = rendimientoSemanalResponse || [
    { dia: 'Lun', actas: 0, certificados: 0 },
    { dia: 'Mar', actas: 0, certificados: 0 },
    { dia: 'Mié', actas: 0, certificados: 0 },
    { dia: 'Jue', actas: 0, certificados: 0 },
    { dia: 'Vie', actas: 0, certificados: 0 },
    { dia: 'Sáb', actas: 0, certificados: 0 },
    { dia: 'Dom', actas: 0, certificados: 0 },
  ];

  // ==========================================================================
  // ACCIONES RÁPIDAS
  // ==========================================================================

  const accionesRapidas = [
    {
      titulo: 'Expedientes Asignados',
      descripcion: 'Ver expedientes para búsqueda de actas',
      icono: FolderSearch,
      ruta: '/expedientes',
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      count: statsData.expedientesAsignados,
    },
    {
      titulo: 'Procesar con OCR (Gemini AI)',
      descripcion: 'Extraer datos de actas con inteligencia artificial',
      icono: Brain,
      ruta: '/editor/procesar-ocr',
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      count: 0, // TODO: Agregar contador de expedientes LISTO_PARA_OCR
      highlight: true,
    },
    {
      titulo: 'Estudiantes',
      descripcion: 'Gestionar base de datos de estudiantes',
      icono: Users,
      ruta: '/dashboard/estudiantes',
      color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
      count: 0, // TODO: Agregar contador de estudiantes
    },
    {
      titulo: 'Libros de Actas',
      descripcion: 'Organizar libros de actas físicas',
      icono: BookOpen,
      ruta: '/dashboard/libros',
      color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      count: 0, // TODO: Agregar contador de libros registrados
    },
    {
      titulo: 'Años Lectivos',
      descripcion: 'Configurar años académicos',
      icono: Calendar,
      ruta: '/dashboard/anios-lectivos',
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
      count: 0, // TODO: Agregar contador de años lectivos
    },
    {
      titulo: 'Áreas Curriculares',
      descripcion: 'Gestionar áreas de estudio',
      icono: BookOpen,
      ruta: '/dashboard/areas-curriculares',
      color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400',
      count: 0, // TODO: Agregar contador de áreas
    },
  ];

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const getPrioridadBadge = (prioridad: string) => {
    const config = {
      NORMAL: { label: 'Normal', className: 'bg-blue-100 text-blue-800' },
      URGENTE: { label: 'Urgente', className: 'bg-orange-100 text-orange-800' },
      MUY_URGENTE: { label: 'Muy Urgente', className: 'bg-red-100 text-red-800' },
    }[prioridad] || { label: prioridad, className: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // Show loading state
  if (isLoadingEstadisticas) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard - Oficina de Actas"
        description="Panel de control del Editor - Búsqueda y procesamiento de actas"
      />

      {/* Estadísticas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Expedientes Asignados"
          value={statsData.expedientesAsignados}
          description="Para búsqueda de acta"
          icon={FolderSearch}
          className="border-blue-200 dark:border-blue-900"
        />

        <StatsCard
          title="Actas Encontradas Hoy"
          value={statsData.actasEncontradasHoy}
          description="Búsquedas exitosas"
          icon={FileCheck}
          className="border-green-200 dark:border-green-900"
        />

        <StatsCard
          title="En Búsqueda"
          value={statsData.expedientesAsignados - statsData.actasEncontradasHoy}
          description="Búsqueda activa"
          icon={FileScan}
          className="border-purple-200 dark:border-purple-900"
        />

        <StatsCard
          title="Urgentes"
          value={expedientesUrgentes.filter(e => e.prioridad === 'MUY_URGENTE' || e.prioridad === 'URGENTE').length}
          description="Requieren atención"
          icon={AlertTriangle}
          className="border-red-200 dark:border-red-900"
        />
      </div>

      {/* Progreso del Día y Gráfico */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Progreso del Día */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Progreso del Día
            </CardTitle>
            <CardDescription>
              Meta diaria: {progressData.objetivo} actas procesadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completado</span>
                <span className="font-semibold">
                  {progressData.completado} / {progressData.objetivo}
                </span>
              </div>
              <Progress value={progressData.meta} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                {progressData.meta}% del objetivo alcanzado
              </p>
            </div>

            {/* Mini Estadísticas */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Completadas
                </div>
                <p className="text-2xl font-bold">{progressData.completado}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Pendientes
                </div>
                <p className="text-2xl font-bold">
                  {progressData.objetivo - progressData.completado}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Semanal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Rendimiento Semanal
            </CardTitle>
            <CardDescription>
              Actas procesadas y certificados generados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={progressoSemanal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actas"
                  stroke="#8b5cf6"
                  name="Actas Procesadas"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="certificados"
                  stroke="#10b981"
                  name="Certificados"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Accede directamente a la gestión de expedientes y actas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accionesRapidas.map((accion, index) => {
              const Icono = accion.icono;
              return (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    accion.highlight 
                      ? 'border-purple-300 dark:border-purple-700 hover:border-purple-500' 
                      : 'hover:border-primary'
                  }`}
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
                            <Badge variant="secondary">{accion.count}</Badge>
                          )}
                          {accion.highlight && (
                            <Badge className="bg-purple-600 text-white">Nuevo</Badge>
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

      {/* Expedientes Urgentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Expedientes Urgentes
          </CardTitle>
          <CardDescription>
            Expedientes con mayor tiempo de espera
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingExpedientes ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : expedientesUrgentes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay expedientes urgentes en este momento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expedientesUrgentes.map((expediente) => (
                <div
                  key={expediente.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => navigate(`/expedientes/${expediente.id}`)}
                >
                  <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
                    <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-sm">{expediente.numeroExpediente}</p>
                    <p className="text-xs text-muted-foreground">
                      {expediente.estudiante.apellidoPaterno} {expediente.estudiante.apellidoMaterno}, {expediente.estudiante.nombres}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-orange-600">
                      {expediente.diasDesdeAsignacion} días
                    </p>
                    <p className="text-xs text-muted-foreground">desde asignación</p>
                  </div>

                  {getPrioridadBadge(expediente.prioridad)}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" onClick={() => navigate('/expedientes')}>
              Ver Todos los Expedientes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
