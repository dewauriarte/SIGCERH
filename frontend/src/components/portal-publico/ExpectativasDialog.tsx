import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Search, CreditCard, FileCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ExpectativasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
}

export function ExpectativasDialog({ open, onOpenChange, onContinue }: ExpectativasDialogProps) {
  const handleContinue = () => {
    onContinue();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <AlertCircle className="h-6 w-6 text-primary" />
            Antes de comenzar
          </DialogTitle>
          <DialogDescription>
            Por favor, lea la siguiente información importante sobre el proceso de solicitud
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mensaje principal */}
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Estimado/a usuario/a,</p>
            <p className="text-muted-foreground">
              Está iniciando una solicitud de certificado para el periodo{' '}
              <strong className="text-foreground">(1985 - 2012)</strong>. El proceso es el siguiente:
            </p>
          </div>

          {/* 3 pasos del proceso */}
          <div className="space-y-4">
            {/* Paso 1: Búsqueda */}
            <Card>
              <CardContent className="flex gap-4 p-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">1. Búsqueda (Gratuita)</h4>
                  <p className="text-sm text-muted-foreground">
                    Registrará sus datos y los del colegio. Nuestro equipo de{' '}
                    <strong className="text-foreground">Oficina de Actas</strong> buscará el acta
                    física en nuestros archivos históricos.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Paso 2: Pago */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex gap-4 p-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">
                    2. Pago (S/ 15.00){' '}
                    <span className="text-sm font-normal text-primary">
                      - Solo si el acta es encontrada
                    </span>
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Solo si</strong> localizamos su acta, le
                    notificaremos para que realice el pago.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Paso 3: Emisión */}
            <Card>
              <CardContent className="flex gap-4 p-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">3. Emisión</h4>
                  <p className="text-sm text-muted-foreground">
                    Tras el pago, validaremos, firmaremos digitalmente y le entregaremos su
                    certificado digital.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recordatorio final */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-center">
              <strong className="text-foreground">Tenga a la mano</strong> los datos del estudiante
              y del colegio antes de continuar.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleContinue}>
            Aceptar y Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
