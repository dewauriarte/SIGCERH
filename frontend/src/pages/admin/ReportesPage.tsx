/**
 * Página de Reportes del Sistema
 * Generación y visualización de reportes estadísticos
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  FileCheck,
  CreditCard,
  Clock,
  Filter,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState('mes');
  const [tipoReporte, setTipoReporte] = useState('general');

  // Tipos de reportes disponibles
  const tiposReportes = [
    {
      id: 'solicitudes',
      titulo: 'Solicitudes',
      descripcion: 'Estado de solicitudes de certificados',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
      datos: {
        total: 1234,
        pendientes: 45,
        procesando: 123,
        completadas: 1066,
      },
    },
    {
      id: 'certificados',
      titulo: 'Certificados',
      descripcion: 'Certificados emitidos y validados',
      icon: FileCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-950',
      datos: {
        total: 987,
        emitidos: 850,
        firmados: 820,
        entregados: 780,
      },
    },
    {
      id: 'pagos',
      titulo: 'Pagos',
      descripcion: 'Transacciones y recaudación',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-950',
      datos: {
        total: 'S/ 24,680.00',
        pagados: 890,
        pendientes: 234,
        tasa: '79%',
      },
    },
    {
      id: 'usuarios',
      titulo: 'Usuarios',
      descripcion: 'Actividad y registro de usuarios',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-950',
      datos: {
        total: 156,
        activos: 89,
        nuevos: 12,
        roles: 7,
      },
    },
    {
      id: 'tiempos',
      titulo: 'Tiempos de Proceso',
      descripcion: 'Duración promedio por etapa',
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-950',
      datos: {
        promedio: '3.5 días',
        minimo: '1 día',
        maximo: '7 días',
        objetivo: '4 días',
      },
    },
    {
      id: 'tendencias',
      titulo: 'Tendencias',
      descripcion: 'Análisis de tendencias y proyecciones',
      icon: TrendingUp,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-950',
      datos: {
        crecimiento: '+15%',
        proyeccion: '1,500',
        mes: 'Noviembre',
        variacion: '+12%',
      },
    },
  ];

  const handleExportar = (tipo: string) => {
    alert(`Exportando reporte de ${tipo} (funcionalidad en desarrollo)`);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            Reportes y Estadísticas
          </h1>
          <p className="text-muted-foreground mt-1">
            Análisis y reportes del sistema SIGCERH
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar Todo
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Reporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Período */}
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="semana">Última Semana</SelectItem>
                  <SelectItem value="mes">Último Mes</SelectItem>
                  <SelectItem value="trimestre">Último Trimestre</SelectItem>
                  <SelectItem value="año">Último Año</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Reporte */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Reporte</label>
              <Select value={tipoReporte} onValueChange={setTipoReporte}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="detallado">Detallado</SelectItem>
                  <SelectItem value="comparativo">Comparativo</SelectItem>
                  <SelectItem value="ejecutivo">Ejecutivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Formato de Exportación */}
            <div>
              <label className="text-sm font-medium mb-2 block">Formato de Exportación</label>
              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Los reportes se generan en tiempo real basados en los datos actuales del sistema. 
          Los datos históricos se mantienen por 12 meses.
        </AlertDescription>
      </Alert>

      {/* Resumen Ejecutivo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Ejecutivo - Último Mes</CardTitle>
          <CardDescription>Métricas clave del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Solicitudes Totales</p>
              <p className="text-3xl font-bold">1,234</p>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                +15% vs mes anterior
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tasa de Completado</p>
              <p className="text-3xl font-bold">86%</p>
              <Progress value={86} className="mt-2" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
              <p className="text-3xl font-bold">3.5d</p>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Meta: 4 días
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Recaudación</p>
              <p className="text-3xl font-bold">S/ 24.7K</p>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                +8% vs mes anterior
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipos de Reportes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Reportes Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiposReportes.map((reporte) => {
            const Icon = reporte.icon;
            return (
              <Card key={reporte.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 ${reporte.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${reporte.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{reporte.titulo}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {reporte.descripcion}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Datos del reporte */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {Object.entries(reporte.datos).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <p className="text-xs text-muted-foreground capitalize">{key}</p>
                          <p className="font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Botones de acción */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => alert(`Ver reporte de ${reporte.titulo} (en desarrollo)`)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleExportar(reporte.titulo)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Exportar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Gráficos (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Visualización de Datos
          </CardTitle>
          <CardDescription>Gráficos y tendencias del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center space-y-3">
              <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Gráficos interactivos</p>
              <Badge variant="secondary">Próximamente</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reportes programados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Reportes Programados
              </CardTitle>
              <CardDescription>Generación automática de reportes</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Programar Nuevo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Reporte Mensual de Solicitudes</p>
                  <p className="text-xs text-muted-foreground">Se envía cada 1ro del mes a 08:00 AM</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                Activo
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Reporte Semanal de Pagos</p>
                  <p className="text-xs text-muted-foreground">Se envía cada lunes a 09:00 AM</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                Activo
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Análisis Trimestral</p>
                  <p className="text-xs text-muted-foreground">Se envía cada 3 meses</p>
                </div>
              </div>
              <Badge variant="outline">
                Pausado
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

