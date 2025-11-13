/**
 * Página de Configuración del Sistema
 */

import { Settings, Building2, FileText, Bell, Shield, AlertCircle, Database, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function ConfiguracionPage() {
  const navigate = useNavigate();
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-orange-600" />
          Configuración del Sistema
        </h1>
        <p className="text-muted-foreground mt-1">
          Administra la configuración general del sistema SIGCERH
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta sección está en desarrollo. Por ahora, la configuración se realiza a nivel de base de datos.
        </AlertDescription>
      </Alert>

      {/* Secciones de Configuración */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Institución */}
        <Card className="hover:shadow-lg transition-shadow border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                Disponible
              </Badge>
            </div>
            <CardTitle className="mt-4">Institución</CardTitle>
            <CardDescription>
              Datos de la institución educativa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Nombre y código modular</li>
              <li>• Dirección y contacto</li>
              <li>• Logo institucional</li>
              <li>• Datos del director</li>
            </ul>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => navigate('/dashboard/configuracion/institucion')}
            >
              Configurar
            </Button>
          </CardContent>
        </Card>

        {/* Certificados */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <Badge variant="secondary">Próximamente</Badge>
            </div>
            <CardTitle className="mt-4">Certificados</CardTitle>
            <CardDescription>
              Plantillas y formato de certificados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Diseño de certificado</li>
              <li>• Texto legal</li>
              <li>• Firma digital</li>
              <li>• Código QR</li>
            </ul>
            <Button className="w-full mt-4" variant="outline" disabled>
              Configurar
            </Button>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <Badge variant="secondary">Próximamente</Badge>
            </div>
            <CardTitle className="mt-4">Notificaciones</CardTitle>
            <CardDescription>
              Configuración de notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Email SMTP</li>
              <li>• Plantillas de correo</li>
              <li>• SMS (Twilio)</li>
              <li>• Notificaciones push</li>
            </ul>
            <Button className="w-full mt-4" variant="outline" disabled>
              Configurar
            </Button>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-orange-100 dark:bg-orange-950 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <Badge variant="secondary">Próximamente</Badge>
            </div>
            <CardTitle className="mt-4">Seguridad</CardTitle>
            <CardDescription>
              Políticas de seguridad del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Políticas de contraseña</li>
              <li>• Sesiones y JWT</li>
              <li>• Rate limiting</li>
              <li>• Auditoría</li>
            </ul>
            <Button className="w-full mt-4" variant="outline" disabled>
              Configurar
            </Button>
          </CardContent>
        </Card>

        {/* Sistema */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <Badge variant="secondary">Próximamente</Badge>
            </div>
            <CardTitle className="mt-4">Sistema</CardTitle>
            <CardDescription>
              Configuración general del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Modo mantenimiento</li>
              <li>• Caché</li>
              <li>• Logs</li>
              <li>• Backups</li>
            </ul>
            <Button className="w-full mt-4" variant="outline" disabled>
              Configurar
            </Button>
          </CardContent>
        </Card>

        {/* Base de Datos */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <Badge variant="secondary">Próximamente</Badge>
            </div>
            <CardTitle className="mt-4">Base de Datos</CardTitle>
            <CardDescription>
              Gestión de la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Migraciones</li>
              <li>• Optimización</li>
              <li>• Backup/Restore</li>
              <li>• Estadísticas</li>
            </ul>
            <Button className="w-full mt-4" variant="outline" disabled>
              Configurar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

