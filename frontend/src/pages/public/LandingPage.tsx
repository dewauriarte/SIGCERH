import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Search,
  CreditCard,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Clock,
  Shield,
  Smartphone,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <FileText className="h-4 w-4" />
              Certificados Históricos
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Certificados de Estudios
              <span className="block text-primary">1985 - 2012</span>
            </h1>

            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Solicita tu certificado de estudios históricos de manera digital, rápida y segura.
              Seguimiento en tiempo real y descarga inmediata una vez emitido.
            </p>

            {/* Botones principales */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="text-lg">
                <Link to="/solicitar">
                  <FileText className="mr-2 h-5 w-5" />
                  Solicitar Certificado
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg">
                <Link to="/seguimiento">
                  <Search className="mr-2 h-5 w-5" />
                  Consultar Estado
                </Link>
              </Button>
            </div>

            {/* Aviso importante */}
            <Alert className="mt-8 text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription>
                El pago de <strong>S/ 15.00</strong> solo se realiza <strong>si encontramos tu acta</strong>.
                La búsqueda es completamente gratuita.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              ¿Cómo funciona?
            </h2>
            <p className="text-lg text-muted-foreground">
              Obtén tu certificado en 3 simples pasos
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 md:grid-cols-3">
              {/* Paso 1 */}
              <Card className="relative">
                <div className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <CardHeader className="pt-8">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Búsqueda Gratuita</CardTitle>
                  <CardDescription>
                    Registra tus datos y los del colegio. Nuestro equipo de Oficina de Actas
                    buscará tu acta física en los archivos históricos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>3-5 días hábiles</span>
                  </div>
                </CardContent>
              </Card>

              {/* Paso 2 */}
              <Card className="relative">
                <div className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <CardHeader className="pt-8">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Pago (Si encontramos el acta)</CardTitle>
                  <CardDescription>
                    Solo si localizamos tu acta, te notificaremos para que realices el pago
                    de S/ 15.00 por Yape, Plin, efectivo o tarjeta.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>S/ 15.00 - Pago único</span>
                  </div>
                </CardContent>
              </Card>

              {/* Paso 3 */}
              <Card className="relative">
                <div className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <CardHeader className="pt-8">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Emisión y Descarga</CardTitle>
                  <CardDescription>
                    Tras validar el pago, procesamos, firmamos digitalmente y te entregamos
                    tu certificado en formato PDF con código QR de verificación.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>5-7 días hábiles</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Requisitos */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Requisitos
            </h2>
            <p className="text-lg text-muted-foreground">
              Ten a la mano la siguiente información antes de iniciar
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Datos del Estudiante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>DNI del estudiante (8 dígitos)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Nombres y apellidos completos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Fecha de nacimiento</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Datos del Colegio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Nombre del colegio (tal como lo recuerdas)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Ubicación (Departamento, Provincia, Distrito)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Último año que cursaste (1985-2012)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Nivel y grados (Primaria/Secundaria)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" />
                    Datos de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Número de celular (obligatorio)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Correo electrónico (opcional)</span>
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Te notificaremos por SMS y/o correo en cada etapa del proceso
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    Si eres Apoderado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Tus datos personales (DNI, nombres)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Carta poder o autorización (PDF/imagen)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Preguntas Frecuentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Resolvemos las dudas más comunes
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <span className="flex items-center gap-2 text-left">
                    <HelpCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    ¿Cuánto cuesta el certificado?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  El costo del certificado es de <strong>S/ 15.00</strong>, pero solo se paga
                  <strong> si encontramos tu acta</strong>. La búsqueda inicial es completamente
                  gratuita. Si no localizamos el acta, no pagas nada.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>
                  <span className="flex items-center gap-2 text-left">
                    <HelpCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    ¿Cuánto tiempo demora el proceso?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  El proceso completo puede tomar entre <strong>8 a 12 días hábiles</strong>:
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Búsqueda del acta: 3-5 días hábiles</li>
                    <li>Emisión tras el pago: 5-7 días hábiles</li>
                  </ul>
                  Te notificaremos por SMS y/o correo en cada etapa.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>
                  <span className="flex items-center gap-2 text-left">
                    <HelpCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    ¿Qué pasa si no encuentran mi acta?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  Si no localizamos tu acta, te notificaremos y el proceso finalizará sin ningún
                  cobro. Esto puede ocurrir si el nombre del colegio es incorrecto, si el acta está
                  extraviada, o si los datos no coinciden con nuestros registros. En estos casos,
                  puedes acercarte presencialmente a la UGEL correspondiente.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>
                  <span className="flex items-center gap-2 text-left">
                    <HelpCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    ¿Cómo puedo pagar?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  Aceptamos múltiples métodos de pago:
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li><strong>Yape/Plin:</strong> Escanea el código QR y sube tu comprobante</li>
                    <li><strong>Efectivo:</strong> Pago en ventanilla de UGEL</li>
                    <li><strong>Tarjeta:</strong> Pago en línea (próximamente)</li>
                    <li><strong>Agente/Bodega:</strong> Con código de pago</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>
                  <span className="flex items-center gap-2 text-left">
                    <HelpCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    ¿El certificado digital tiene validez oficial?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  Sí, el certificado digital tiene <strong>plena validez oficial</strong>. Cuenta con:
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Firma digital del Director Regional</li>
                    <li>Código QR de verificación de autenticidad</li>
                    <li>Código único de registro</li>
                  </ul>
                  Puedes usarlo para cualquier trámite educativo, laboral o personal.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>
                  <span className="flex items-center gap-2 text-left">
                    <HelpCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    ¿Puedo solicitar para otra persona?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  Sí, puedes solicitar como <strong>apoderado o familiar</strong>. En este caso
                  necesitarás:
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Tus datos personales (quien solicita)</li>
                    <li>Datos completos del estudiante</li>
                    <li>Carta poder o autorización (PDF o imagen)</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
}
