import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { QRCodeDisplay } from '@/components/portal-publico/QRCodeDisplay';
import { FileUpload } from '@/components/custom/FileUpload';
import { LoadingSpinner } from '@/components/custom/LoadingSpinner';
import { pagoService } from '@/services/pago.service';
import type { QRCodeData } from '@/services/pago.service';
import { solicitudService } from '@/services/solicitud.service';
import {
  CreditCard,
  Smartphone,
  Banknote,
  Store,
  ArrowLeft,
  AlertCircle,
  MapPin,
  Clock,
  CheckCircle2,
  Upload,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PagoPage() {
  const { solicitudId } = useParams();
  const navigate = useNavigate();
  const [selectedMetodo, setSelectedMetodo] = useState<string>('yape');
  const [comprobante, setComprobante] = useState<File | null>(null);

  // Obtener datos de la solicitud
  const { data: solicitud, isLoading: loadingSolicitud } = useQuery({
    queryKey: ['solicitud', solicitudId],
    queryFn: () => solicitudService.obtenerPorId(solicitudId!),
    enabled: !!solicitudId,
  });

  // Obtener o generar QR para Yape/Plin
  const { data: qrData, isLoading: loadingQR } = useQuery<QRCodeData>({
    queryKey: ['pago-qr', solicitudId],
    queryFn: async () => {
      // Primero generar la orden de pago
      const pago = await pagoService.generarOrden(solicitudId!, 'YAPE');
      // Luego obtener el QR
      return pagoService.obtenerQR(pago.id);
    },
    enabled: !!solicitudId && selectedMetodo === 'yape',
  });

  // Mutation para subir comprobante
  const subirComprobanteMutation = useMutation({
    mutationFn: async ({ pagoId, file }: { pagoId: string; file: File }) => {
      return pagoService.subirComprobante(pagoId, file);
    },
    onSuccess: () => {
      toast.success('Comprobante enviado exitosamente');
      toast.info('Mesa de Partes validará su pago en 24 horas');
      navigate(`/seguimiento`, {
        state: { codigo: solicitud?.codigo },
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al subir el comprobante');
    },
  });

  const handleSubirComprobante = async () => {
    if (!comprobante) {
      toast.error('Por favor, seleccione un comprobante');
      return;
    }

    // En producción, aquí deberías tener el pagoId real
    const pagoId = 'pago-id-temporal';
    subirComprobanteMutation.mutate({ pagoId, file: comprobante });
  };

  if (loadingSolicitud) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Solicitud no encontrada</h2>
        <Button onClick={() => navigate('/')}>Volver al inicio</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/seguimiento')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Seguimiento
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Pago de Certificado</h1>
        <p className="text-muted-foreground">
          Solicitud: <strong>{solicitud.codigo}</strong>
        </p>
      </div>

      {/* Resumen del pago */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Resumen del Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Certificado de Estudios</p>
              <p className="font-medium">
                {solicitud.estudiante.nombres} {solicitud.estudiante.apellidoPaterno}
              </p>
              <p className="text-sm text-muted-foreground">
                {solicitud.datosAcademicos.nombreColegio}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Monto total</p>
              <p className="text-3xl font-bold text-primary">S/ 15.00</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métodos de pago */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccione el Método de Pago</CardTitle>
          <CardDescription>Elija cómo desea realizar el pago del certificado</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedMetodo} onValueChange={setSelectedMetodo}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="yape" className="gap-2">
                <Smartphone className="h-4 w-4" />
                Yape/Plin
              </TabsTrigger>
              <TabsTrigger value="efectivo" className="gap-2">
                <Banknote className="h-4 w-4" />
                Efectivo
              </TabsTrigger>
              <TabsTrigger value="tarjeta" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Tarjeta
              </TabsTrigger>
              <TabsTrigger value="agente" className="gap-2">
                <Store className="h-4 w-4" />
                Agente
              </TabsTrigger>
            </TabsList>

            {/* Yape/Plin */}
            <TabsContent value="yape" className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h3 className="font-semibold mb-2">Pago con Yape o Plin</h3>
                <p className="text-sm text-muted-foreground">
                  Escanea el código QR desde tu aplicación y sube el comprobante
                </p>
              </div>

              {loadingQR ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : qrData ? (
                <QRCodeDisplay
                  value={qrData.qrCode}
                  title="Código QR para Pago"
                  description="Escanea con tu app de Yape o Plin"
                  instructions={qrData.instrucciones}
                  size={250}
                />
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Error al generar el código QR
                </p>
              )}

              {/* Subir comprobante */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Subir Comprobante de Pago</h4>
                  <FileUpload
                    onFileSelect={setComprobante}
                    accept={{ 'image/*': ['.jpg', '.jpeg', '.png'], 'application/pdf': ['.pdf'] }}
                    maxSize={5 * 1024 * 1024}
                    label="Captura de pantalla o PDF del comprobante"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Formato: JPG, PNG o PDF. Máximo 5MB
                  </p>
                </div>

                <Button
                  onClick={handleSubirComprobante}
                  disabled={!comprobante || subirComprobanteMutation.isPending}
                  className="w-full"
                >
                  {subirComprobanteMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Enviar Comprobante
                    </>
                  )}
                </Button>

                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">
                    <CheckCircle2 className="inline h-4 w-4 mr-1 text-green-600" />
                    Mesa de Partes validará su pago en <strong>24 horas</strong>. Le notificaremos
                    por SMS/correo.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Efectivo */}
            <TabsContent value="efectivo" className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h3 className="font-semibold mb-2">Pago en Efectivo</h3>
                <p className="text-sm text-muted-foreground">
                  Acérquese a la ventanilla de la UGEL con su código de solicitud
                </p>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold">Dirección</p>
                      <p className="text-sm text-muted-foreground">
                        UGEL XX - Oficina de Mesa de Partes
                        <br />
                        Av. Ejemplo 123, Distrito, Ciudad
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold">Horario de Atención</p>
                      <p className="text-sm text-muted-foreground">
                        Lunes a Viernes: 8:30 AM - 4:30 PM
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Banknote className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold">Monto a Pagar</p>
                      <p className="text-2xl font-bold text-primary">S/ 15.00</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
                    <p className="text-sm font-medium mb-2">¿Qué llevar?</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Su código de solicitud: <strong>{solicitud.codigo}</strong></li>
                      <li>• DNI original</li>
                      <li>• Efectivo exacto (S/ 15.00)</li>
                    </ul>
                  </div>

                  <Button className="w-full" variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Orden de Pago
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tarjeta */}
            <TabsContent value="tarjeta" className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-6 text-center">
                <Badge variant="outline" className="mb-4">
                  Próximamente
                </Badge>
                <h3 className="font-semibold mb-2">Pago con Tarjeta</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Esta opción estará disponible próximamente. Por ahora, puede usar Yape/Plin o
                  pagar en efectivo.
                </p>
                <Button variant="outline" onClick={() => setSelectedMetodo('yape')}>
                  Usar Yape/Plin
                </Button>
              </div>
            </TabsContent>

            {/* Agente/Bodega */}
            <TabsContent value="agente" className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h3 className="font-semibold mb-2">Pago en Agente o Bodega</h3>
                <p className="text-sm text-muted-foreground">
                  Genera un código único para pagar en bodegas o agentes afiliados
                </p>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-lg bg-muted p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Su código de pago</p>
                    <p className="text-3xl font-bold font-mono">PAGO-{solicitud.codigo.slice(-6)}</p>
                    <Button variant="ghost" size="sm" className="mt-2">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Copiar Código
                    </Button>
                  </div>

                  <div>
                    <p className="font-medium mb-2">Agentes Afiliados:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Kasnet</li>
                      <li>• Western Union</li>
                      <li>• Bodegas autorizadas</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm">
                      <strong>Instrucciones:</strong>
                      <ol className="mt-2 space-y-1 list-decimal list-inside">
                        <li>Acérquese al agente afiliado</li>
                        <li>Indique que desea hacer un pago con código</li>
                        <li>Proporcione el código: <strong>PAGO-{solicitud.codigo.slice(-6)}</strong></li>
                        <li>Realice el pago de S/ 15.00</li>
                        <li>Guarde su voucher</li>
                      </ol>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
