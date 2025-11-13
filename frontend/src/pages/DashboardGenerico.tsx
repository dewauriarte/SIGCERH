/**
 * Dashboard Genérico
 * Usado temporalmente para roles sin dashboard específico
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { ClipboardList, FileText, CreditCard, TrendingUp, Users, Clock, CheckCircle2, AlertCircle, FolderSearch } from 'lucide-react';
import { PageHeader, StatsCard, StatusBadge } from '@/components/custom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DashboardGenericoProps {
  roleName: string;
}

export default function DashboardGenerico({ roleName }: DashboardGenericoProps) {
  const { user } = useAuthStore();
  const { isPublico, isMesaDePartes, isEditor, isEncargadoUgel, isAdmin } = useRole();

  return (
    <div className="space-y-6">
      {/* Header con componente personalizado */}
      <PageHeader
        title={`Bienvenido, ${user?.nombres || user?.username || 'Usuario'}`}
        description={`Panel de control - ${roleName}`}
        actions={
          <>
            {isPublico && (
              <Button>
                <ClipboardList className="mr-2 h-4 w-4" />
                Nueva Solicitud
              </Button>
            )}
            {(isMesaDePartes || isAdmin) && (
              <Button variant="outline">
                Ver Todas las Solicitudes
              </Button>
            )}
          </>
        }
      />

      {/* User Info Card */}
      <Card className="bg-gradient-to-r from-primary-blue-50 to-indigo-50 dark:from-primary-blue-950/20 dark:to-indigo-950/20 border-primary-blue-200 dark:border-primary-blue-900">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Información del Usuario
            </p>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>• Email: {user?.email}</p>
              <div className="flex items-center gap-2">
                <span>• Rol:</span>
                <Badge variant="outline">{roleName}</Badge>
              </div>
              <p>• ID: {user?.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid usando StatsCard custom */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Solicitudes Pendientes"
          value={24}
          description="Esperando procesamiento"
          icon={ClipboardList}
        />

        <StatsCard
          title="Certificados Emitidos"
          value={156}
          description="Este mes"
          icon={FileText}
          trend={{ value: '+12%', isPositive: true }}
        />

        <StatsCard
          title="Pagos Pendientes"
          value={8}
          description="Por validar"
          icon={CreditCard}
        />

        <StatsCard
          title="Tasa de Aprobación"
          value="94.5%"
          icon={TrendingUp}
          trend={{ value: '+2.5%', isPositive: true }}
          className="bg-success-green-50 dark:bg-success-green-950/10 border-success-green-200 dark:border-success-green-900"
        />

        <StatsCard
          title="Tiempo Promedio"
          value="2.3 días"
          description="Para procesar solicitudes"
          icon={Clock}
        />

        {(isAdmin || isMesaDePartes) && (
          <StatsCard
            title="Total Usuarios"
            value={342}
            description="Registrados en el sistema"
            icon={Users}
          />
        )}
      </div>

      {/* Estadísticas específicas por rol */}
      {isEditor && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Actas por Buscar"
            value={15}
            description="Pendientes de localización"
            icon={FolderSearch}
            className="border-warning-orange-200 dark:border-warning-orange-900"
          />
          <StatsCard
            title="En Procesamiento OCR"
            value={8}
            description="Digitalizando"
            icon={FileText}
          />
          <StatsCard
            title="Borradores Listos"
            value={12}
            description="Para enviar a UGEL"
            icon={CheckCircle2}
          />
        </div>
      )}

      {isEncargadoUgel && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Pendientes de Validar"
            value={18}
            description="Esperando revisión"
            icon={AlertCircle}
            className="border-warning-orange-200 dark:border-warning-orange-900"
          />
          <StatsCard
            title="Validados Hoy"
            value={9}
            description="Aprobados"
            icon={CheckCircle2}
          />
          <StatsCard
            title="Observados"
            value={3}
            description="Con correcciones"
            icon={AlertCircle}
          />
        </div>
      )}

      {/* Recent Activity con StatusBadge */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>
            Últimas acciones realizadas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium">Certificado #1234 emitido</p>
                <p className="text-xs text-muted-foreground">Hace 2 horas</p>
              </div>
              <StatusBadge status="CERTIFICADO_EMITIDO" />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium">Pago validado</p>
                <p className="text-xs text-muted-foreground">Hace 5 horas</p>
              </div>
              <StatusBadge status="PAGO_VALIDADO" />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                <ClipboardList className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium">Nueva solicitud recibida</p>
                <p className="text-xs text-muted-foreground">Hace 1 día</p>
              </div>
              <StatusBadge status="EN_BUSQUEDA" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
