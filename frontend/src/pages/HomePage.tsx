import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useHealthCheck } from '@/hooks/useAuth';

export default function HomePage() {
  const { data: healthData, isLoading, error } = useHealthCheck();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold mb-2">
            Bienvenido a SIGCERH
          </CardTitle>
          <CardDescription className="text-lg">
            Sistema de Gestión de Certificados Históricos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Backend Status */}
          <Card className={healthData ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="font-semibold">
                  {isLoading && "⏳ Verificando backend..."}
                  {error && "⚠️ Backend no disponible"}
                  {healthData && "✅ Backend conectado"}
                </p>
                {healthData && (
                  <p className="text-sm text-muted-foreground">
                    {healthData.message} - Env: {healthData.environment}
                  </p>
                )}
                {error && (
                  <p className="text-sm text-red-600">
                    Asegúrese de que el backend esté corriendo en http://localhost:3000
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Portal oficial para solicitar certificados de estudios históricos (1985-2012)
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/login">Iniciar Sesión</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/dashboard">Dashboard (Protegido)</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">✓</p>
              <p className="text-xs text-muted-foreground mt-1">Vite 6</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">✓</p>
              <p className="text-xs text-muted-foreground mt-1">Zustand</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">✓</p>
              <p className="text-xs text-muted-foreground mt-1">TanStack</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">✓</p>
              <p className="text-xs text-muted-foreground mt-1">Axios</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
