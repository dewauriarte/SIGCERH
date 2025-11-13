/**
 * Página de Auditoría del Sistema
 * Muestra registros de actividad y cambios en el sistema
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  User,
  Calendar,
  Filter,
  Download,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  Shield,
  FileText,
  Settings,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Tipos de eventos de auditoría
const EVENTOS_TIPO = {
  LOGIN: { label: 'Inicio de sesión', icon: User, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  LOGOUT: { label: 'Cierre de sesión', icon: User, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  CREATE: { label: 'Creación', icon: CheckCircle2, color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  UPDATE: { label: 'Actualización', icon: Info, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' },
  DELETE: { label: 'Eliminación', icon: XCircle, color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  ACCESS: { label: 'Acceso', icon: Shield, color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  EXPORT: { label: 'Exportación', icon: Download, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
  CONFIG: { label: 'Configuración', icon: Settings, color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
};

// Datos de ejemplo de auditoría
const DATOS_EJEMPLO = [
  {
    id: 1,
    timestamp: '2024-11-07 10:30:25',
    usuario: 'Juan Pérez',
    rol: 'ADMIN',
    accion: 'CREATE',
    entidad: 'Usuario',
    descripcion: 'Creó usuario "María García"',
    ip: '192.168.1.100',
    resultado: 'success',
  },
  {
    id: 2,
    timestamp: '2024-11-07 10:28:15',
    usuario: 'María García',
    rol: 'EDITOR',
    accion: 'LOGIN',
    entidad: 'Sistema',
    descripcion: 'Inicio de sesión exitoso',
    ip: '192.168.1.105',
    resultado: 'success',
  },
  {
    id: 3,
    timestamp: '2024-11-07 10:25:40',
    usuario: 'Carlos López',
    rol: 'DIRECCION',
    accion: 'UPDATE',
    entidad: 'Certificado',
    descripcion: 'Firmó certificado #1234',
    ip: '192.168.1.110',
    resultado: 'success',
  },
  {
    id: 4,
    timestamp: '2024-11-07 10:20:10',
    usuario: 'Ana Torres',
    rol: 'MESA_DE_PARTES',
    accion: 'DELETE',
    entidad: 'Solicitud',
    descripcion: 'Intentó eliminar solicitud #5678',
    ip: '192.168.1.115',
    resultado: 'error',
  },
  {
    id: 5,
    timestamp: '2024-11-07 10:15:30',
    usuario: 'Juan Pérez',
    rol: 'ADMIN',
    accion: 'CONFIG',
    entidad: 'Sistema',
    descripcion: 'Modificó configuración de notificaciones',
    ip: '192.168.1.100',
    resultado: 'success',
  },
];

export default function AuditoriaPage() {
  const [busqueda, setBusqueda] = useState('');
  const [tipoAccion, setTipoAccion] = useState<string>('ALL');
  const [resultado, setResultado] = useState<string>('ALL');

  // En el futuro, esto se conectará con el backend
  const { data: auditoria, isLoading } = useQuery({
    queryKey: ['auditoria', tipoAccion, resultado, busqueda],
    queryFn: async () => {
      // Simulación de API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return DATOS_EJEMPLO;
    },
  });

  const registros = auditoria || [];

  const getEventoIcon = (accion: string) => {
    const evento = EVENTOS_TIPO[accion as keyof typeof EVENTOS_TIPO];
    if (!evento) return Activity;
    return evento.icon;
  };

  const getEventoColor = (accion: string) => {
    const evento = EVENTOS_TIPO[accion as keyof typeof EVENTOS_TIPO];
    if (!evento) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    return evento.color;
  };

  const getResultadoBadge = (resultado: string) => {
    if (resultado === 'success') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Exitoso
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Error
      </Badge>
    );
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-indigo-600" />
            Auditoría del Sistema
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro de actividades y cambios en el sistema
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Logs
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Los registros de auditoría se almacenan durante 90 días. Los cambios críticos se guardan permanentemente.
        </AlertDescription>
      </Alert>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">En las últimas 4 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">Operaciones exitosas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuario, acción o descripción..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Tipo de Acción */}
            <Select value={tipoAccion} onValueChange={setTipoAccion}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las acciones</SelectItem>
                <SelectItem value="LOGIN">Inicio de sesión</SelectItem>
                <SelectItem value="LOGOUT">Cierre de sesión</SelectItem>
                <SelectItem value="CREATE">Creación</SelectItem>
                <SelectItem value="UPDATE">Actualización</SelectItem>
                <SelectItem value="DELETE">Eliminación</SelectItem>
                <SelectItem value="ACCESS">Acceso</SelectItem>
                <SelectItem value="EXPORT">Exportación</SelectItem>
                <SelectItem value="CONFIG">Configuración</SelectItem>
              </SelectContent>
            </Select>

            {/* Resultado */}
            <Select value={resultado} onValueChange={setResultado}>
              <SelectTrigger>
                <SelectValue placeholder="Resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los resultados</SelectItem>
                <SelectItem value="success">Exitosos</SelectItem>
                <SelectItem value="error">Con errores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Auditoría */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Actividades</CardTitle>
          <CardDescription>Eventos recientes del sistema en orden cronológico</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Activity className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">No se encontraron registros de auditoría</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    registros.map((registro) => {
                      const EventIcon = getEventoIcon(registro.accion);
                      return (
                        <TableRow key={registro.id}>
                          <TableCell className="font-mono text-xs">
                            {registro.timestamp}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{registro.usuario}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {registro.rol}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getEventoColor(registro.accion)}>
                              <EventIcon className="h-3 w-3 mr-1" />
                              {EVENTOS_TIPO[registro.accion as keyof typeof EVENTOS_TIPO]?.label || registro.accion}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{registro.entidad}</TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">
                            {registro.descripcion}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{registro.ip}</TableCell>
                          <TableCell>{getResultadoBadge(registro.resultado)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

