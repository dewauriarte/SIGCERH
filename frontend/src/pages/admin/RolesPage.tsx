/**
 * Página de Gestión de Roles y Permisos
 */

import { useQuery } from '@tanstack/react-query';
import { Shield, Users, Key, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { adminService } from '@/services/admin.service';
import { useNavigate } from 'react-router-dom';

export default function RolesPage() {
  const navigate = useNavigate();
  
  const { data: rolesResponse, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => adminService.getRoles(),
  });

  const roles = rolesResponse?.data || [];

  // Función para obtener el color del rol según su nivel
  const getRolColor = (nivel: number) => {
    if (nivel >= 10) return 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
    if (nivel >= 5) return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
    if (nivel >= 3) return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
    return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-purple-600" />
            Gestión de Roles
          </h1>
          <p className="text-muted-foreground mt-1">
            Roles y permisos del sistema
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard/usuarios')}>
          <Users className="h-4 w-4 mr-2" />
          Ver Usuarios
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Los roles se gestionan a nivel de base de datos. Esta vista es de solo lectura.
        </AlertDescription>
      </Alert>

      {/* Lista de Roles */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((rol) => (
            <Card key={rol.id} className="hover:shadow-lg transition-shadow border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      {rol.nombre}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {rol.descripcion || 'Sin descripción'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Código */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Código</span>
                  <Badge variant="secondary" className={getRolColor(rol.nivel)}>
                    {rol.codigo}
                  </Badge>
                </div>

                {/* Nivel */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Nivel</span>
                  <Badge variant="outline" className="font-bold">
                    {rol.nivel}
                  </Badge>
                </div>

                <Separator />

                {/* Permisos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Permisos
                    </span>
                    <Badge variant="secondary">
                      {(rol as any).permisos?.length || 0}
                    </Badge>
                  </div>

                  {/* Link a usuarios */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => navigate(`/dashboard/usuarios?rol=${rol.codigo}`)}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Ver usuarios
                    </span>
                    <span className="text-xs text-muted-foreground">→</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {roles.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No se encontraron roles</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

