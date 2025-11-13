import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Users, ArrowRight, ArrowLeft } from 'lucide-react';

export default function TipoPersonaPage() {
  const navigate = useNavigate();
  const [tipoSolicitud, setTipoSolicitud] = useState<'propio' | 'apoderado' | null>(null);

  const handleTipoChange = (value: 'propio' | 'apoderado') => {
    setTipoSolicitud(value);
  };

  const handleContinuar = () => {
    if (tipoSolicitud === 'propio') {
      // Continuar directamente al formulario sin datos de apoderado
      navigate('/solicitar/formulario', {
        state: { esApoderado: false },
      });
    } else if (tipoSolicitud === 'apoderado') {
      // Ir a la página de datos del apoderado
      navigate('/solicitar/apoderado');
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Button>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Solicitar Certificado</h1>
          <p className="text-sm text-muted-foreground">
            Paso 1 de 3: Seleccione quién realiza el trámite
          </p>
        </div>

        {/* Selector de tipo de persona */}
        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">¿Quién realiza el trámite?</CardTitle>
            <CardDescription>
              Seleccione si solicita para usted mismo o como apoderado de otra persona
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={tipoSolicitud || ''} onValueChange={handleTipoChange}>
              <div className="space-y-3">
                {/* Opción 1: A nombre propio */}
                <div
                  className={`relative flex cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-accent/50 ${
                    tipoSolicitud === 'propio'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border'
                  }`}
                  onClick={() => setTipoSolicitud('propio')}
                >
                  <RadioGroupItem value="propio" id="propio" className="mt-0.5" />
                  <label htmlFor="propio" className="ml-3 flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-base">A nombre propio</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Soy el exalumno y solicito mi certificado
                    </p>
                  </label>
                </div>

                {/* Opción 2: Como apoderado */}
                <div
                  className={`relative flex cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-accent/50 ${
                    tipoSolicitud === 'apoderado'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border'
                  }`}
                  onClick={() => setTipoSolicitud('apoderado')}
                >
                  <RadioGroupItem value="apoderado" id="apoderado" className="mt-0.5" />
                  <label htmlFor="apoderado" className="ml-3 flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-base">Como apoderado o familiar</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Solicito para otra persona
                    </p>
                  </label>
                </div>
              </div>
            </RadioGroup>

            {/* Mensaje informativo y botones */}
            {tipoSolicitud && (
              <div className="pt-4 border-t space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  {tipoSolicitud === 'propio'
                    ? 'Continuará al formulario de datos del estudiante'
                    : 'A continuación deberá ingresar sus datos como apoderado antes de completar los datos del estudiante'}
                </p>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => navigate('/')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button onClick={handleContinuar}>
                    Continuar al Formulario
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
