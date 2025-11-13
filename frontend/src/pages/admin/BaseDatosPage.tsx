/**
 * Página de Gestión de Base de Datos
 * Administración y monitoreo de la base de datos del sistema
 */

import { useState } from 'react';
import {
  Database,
  HardDrive,
  Activity,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Play,
  Archive,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function BaseDatosPage() {
  const [loading, setLoading] = useState(false);

  // Datos de ejemplo de las tablas
  const tables = [
    { nombre: 'usuario', registros: 1234, tamano: '2.5 MB', ultimaActualizacion: '2024-11-07 10:30' },
    { nombre: 'solicitud', registros: 5678, tamano: '12.8 MB', ultimaActualizacion: '2024-11-07 10:25' },
    { nombre: 'certificado', registros: 3456, tamano: '8.2 MB', ultimaActualizacion: '2024-11-07 10:20' },
    { nombre: 'pago', registros: 2345, tamano: '4.1 MB', ultimaActualizacion: '2024-11-07 10:15' },
    { nombre: 'expediente', registros: 4567, tamano: '15.6 MB', ultimaActualizacion: '2024-11-07 10:10' },
    { nombre: 'rol', registros: 7, tamano: '0.1 MB', ultimaActualizacion: '2024-11-01 08:00' },
    { nombre: 'permiso', registros: 45, tamano: '0.2 MB', ultimaActualizacion: '2024-11-01 08:00' },
  ];

  const handleBackup = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Backup iniciado (funcionalidad en desarrollo)');
    }, 1000);
  };

  const handleOptimize = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Optimización iniciada (funcionalidad en desarrollo)');
    }, 1000);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-blue-600" />
            Gestión de Base de Datos
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitoreo, backup y administración de la base de datos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBackup} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Backup
          </Button>
          <Button variant="outline" onClick={handleOptimize} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Optimizar
          </Button>
        </div>
      </div>

      {/* Alert de desarrollo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta sección está en desarrollo. Las operaciones críticas de base de datos deben realizarse directamente en el servidor.
        </AlertDescription>
      </Alert>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Activa
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">PostgreSQL 14.5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espacio Usado</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">43.5 MB</div>
            <Progress value={22} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">22% de 200 MB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">17,332</div>
            <p className="text-xs text-muted-foreground mt-2">En 45 tablas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hoy</div>
            <p className="text-xs text-muted-foreground mt-2">07:00 AM</p>
          </CardContent>
        </Card>
      </div>

      {/* Operaciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Operaciones Rápidas
          </CardTitle>
          <CardDescription>Acciones comunes de administración</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Backup */}
            <Card className="border-2 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                    <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Backup Manual</CardTitle>
                    <CardDescription className="text-xs">Crear respaldo completo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" onClick={handleBackup} disabled={loading}>
                  Crear Backup
                </Button>
              </CardContent>
            </Card>

            {/* Restaurar */}
            <Card className="border-2 hover:border-green-400 dark:hover:border-green-600 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                    <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Restaurar</CardTitle>
                    <CardDescription className="text-xs">Desde backup existente</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" disabled>
                  Restaurar DB
                </Button>
              </CardContent>
            </Card>

            {/* Optimizar */}
            <Card className="border-2 hover:border-purple-400 dark:hover:border-purple-600 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Optimizar</CardTitle>
                    <CardDescription className="text-xs">Vacuum y reindex</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" onClick={handleOptimize} disabled={loading}>
                  Optimizar
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Advertencia para operaciones peligrosas */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Advertencia:</strong> Las operaciones de restauración y limpieza pueden afectar la disponibilidad del sistema. 
          Realícelas solo durante ventanas de mantenimiento programado.
        </AlertDescription>
      </Alert>

      {/* Tabla de estadísticas por tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas por Tabla</CardTitle>
          <CardDescription>Información detallada de las tablas principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tabla</TableHead>
                  <TableHead className="text-right">Registros</TableHead>
                  <TableHead className="text-right">Tamaño</TableHead>
                  <TableHead>Última Actualización</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.nombre}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        {table.nombre}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {table.registros.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">{table.tamano}</TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {table.ultimaActualizacion}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" disabled>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Optimizar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Zona peligrosa */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Zona Peligrosa
          </CardTitle>
          <CardDescription>
            Estas operaciones son irreversibles y pueden causar pérdida de datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="destructive" disabled>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Logs Antiguos
            </Button>
            <Button variant="destructive" disabled>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reset de Migraciones
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Estas operaciones están deshabilitadas por seguridad y deben ejecutarse manualmente desde el servidor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

