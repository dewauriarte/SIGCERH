import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Copy, Search, Home, Check, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfirmacionPage() {
  const navigate = useNavigate();
  const { codigo } = useParams();
  const location = useLocation();
  const { solicitud } = location.state || {};
  const [copied, setCopied] = useState(false);

  const codigoSolicitud = codigo || solicitud?.codigo || 'S-2025-XXXXXX';

  const handleCopyCodigo = async () => {
    try {
      await navigator.clipboard.writeText(codigoSolicitud);
      setCopied(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar el código');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
        {/* Icono de éxito */}
        <div className="flex justify-center mb-8">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500" />
          </div>
        </div>

      {/* Título */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          ¡Solicitud de Búsqueda Registrada!
        </h1>
        <p className="text-lg text-muted-foreground">
          Su trámite ha sido creado exitosamente
        </p>
      </div>

      {/* Código de seguimiento */}
      <Card className="mb-8">
        <CardHeader className="text-center">
          <CardTitle>Su Código de Seguimiento</CardTitle>
          <CardDescription>
            Guarde este código, lo necesitará para consultar el estado de su trámite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Código destacado */}
          <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 p-6">
            <span className="text-3xl font-bold text-primary font-mono">
              {codigoSolicitud}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyCodigo}
              className="ml-2"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Mensaje de guardado */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Importante:</strong> Guarde este código en un lugar seguro. Lo necesitará
              para consultar el estado de su solicitud en cualquier momento.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Próximo paso */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Próximo Paso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm mb-2">
              Nuestro equipo de <strong>Oficina de Actas</strong> iniciará la búsqueda del acta
              física en nuestros archivos históricos.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Tiempo estimado:</strong> 3-5 días hábiles
            </p>
          </div>

          {/* Datos de contacto */}
          {solicitud?.contacto && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Le notificaremos a:</p>
              <div className="space-y-1">
                {solicitud.contacto.celular && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{solicitud.contacto.celular}</span>
                  </div>
                )}
                {solicitud.contacto.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{solicitud.contacto.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>¿Qué sigue?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <strong>Búsqueda del Acta:</strong> Nuestro equipo buscará su acta en los
                  archivos físicos.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <strong>Notificación:</strong> Si encontramos su acta, le notificaremos para que
                  realice el pago de <strong>S/ 15.00</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <strong>Emisión:</strong> Tras validar el pago, procesaremos y firmaremos
                  digitalmente su certificado.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                4
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <strong>Descarga:</strong> Podrá descargar su certificado en formato PDF con
                  código QR de verificación.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 p-4 mt-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Recuerde:</strong> Solo pagará si encontramos su acta. La búsqueda es
              completamente gratuita.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex-1"
        >
          <Home className="mr-2 h-4 w-4" />
          Volver al Inicio
        </Button>
        <Button
          onClick={() => navigate('/seguimiento', { state: { codigo: codigoSolicitud } })}
          className="flex-1"
        >
          <Search className="mr-2 h-4 w-4" />
          Consultar Estado Ahora
        </Button>
      </div>
      </div>
    </div>
  );
}
