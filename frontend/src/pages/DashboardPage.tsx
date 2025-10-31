import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bienvenido, {user?.nombre || 'Usuario'}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="font-semibold">✅ authStore funcionando correctamente</p>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>• Email: {user?.email}</p>
                <p>• Rol: {user?.rol}</p>
                <p>• ID: {user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes</CardTitle>
              <CardDescription>Pendientes de proceso</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">24</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Certificados</CardTitle>
              <CardDescription>Emitidos este mes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">156</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Pagos</CardTitle>
              <CardDescription>Por validar</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">8</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
