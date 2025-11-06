import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-2xl space-y-10 px-6 sm:px-8 py-12">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black dark:bg-white/90">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-white dark:text-black"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-black dark:text-white">SIGCERH</span>
        </div>

        {/* Main Card */}
        <Card className="backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center space-y-2 pb-6 pt-8">
            <CardTitle className="text-4xl font-bold mb-2">
              Bienvenido a SIGCERH
            </CardTitle>
            <CardDescription className="text-lg">
              Sistema de Gestión de Certificados Históricos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-10 px-6 sm:px-10">

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
                <p className="text-2xl font-bold">✓</p>
                <p className="text-xs text-muted-foreground mt-1">Vite 6</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">✓</p>
                <p className="text-xs text-muted-foreground mt-1">Zustand</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">✓</p>
                <p className="text-xs text-muted-foreground mt-1">TanStack</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">✓</p>
                <p className="text-xs text-muted-foreground mt-1">Axios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <p className="px-8 text-center text-xs text-muted-foreground">
          Al continuar, aceptas nuestros{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
            términos de servicio
          </a>{" "}
          y{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
            política de privacidad
          </a>
          .
        </p>
      </div>
    </div>
  );
}
