import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
}

export function TermsDialog({ open, onOpenChange, onAccept }: TermsDialogProps) {
  const handleAccept = () => {
    onAccept?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Términos y Condiciones de Uso</DialogTitle>
          <DialogDescription>
            Por favor, lea cuidadosamente los términos y condiciones antes de continuar
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Declaración Jurada</h3>
              <p className="text-muted-foreground">
                Declaro bajo juramento que toda la información proporcionada en esta solicitud
                es verídica y corresponde a datos reales. Soy consciente de que proporcionar
                información falsa constituye un delito contra la fe pública, sancionado por
                el Código Penal peruano.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Proceso de Solicitud</h3>
              <p className="text-muted-foreground mb-2">
                Entiendo que el proceso de obtención del certificado de estudios históricos
                (período 1985-2012) consta de tres etapas:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
                <li>
                  <strong>Búsqueda (Gratuita):</strong> El equipo de Oficina de Actas buscará
                  el acta física en los archivos históricos.
                </li>
                <li>
                  <strong>Pago (S/ 15.00):</strong> Solo se realizará el pago si el acta es
                  encontrada. No hay costo alguno si no se localiza el documento.
                </li>
                <li>
                  <strong>Emisión:</strong> Tras la validación del pago, se emitirá el
                  certificado digital con firma electrónica.
                </li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Tiempo de Respuesta</h3>
              <p className="text-muted-foreground">
                El proceso de búsqueda del acta física puede tomar entre 3 a 5 días hábiles.
                Una vez encontrada el acta y validado el pago, la emisión del certificado
                tomará entre 5 a 7 días hábiles adicionales. Seré notificado por SMS y/o
                correo electrónico en cada etapa del proceso.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Uso de Datos Personales</h3>
              <p className="text-muted-foreground">
                Autorizo el uso de mis datos personales para los siguientes fines:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Procesamiento de la solicitud de certificado</li>
                <li>Comunicación sobre el estado del trámite</li>
                <li>Validación de identidad</li>
                <li>Emisión del certificado de estudios</li>
                <li>Archivo y resguardo según normativa vigente</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Protección de Datos</h3>
              <p className="text-muted-foreground">
                Sus datos personales serán tratados conforme a la Ley N° 29733, Ley de
                Protección de Datos Personales, y su reglamento. La información proporcionada
                será utilizada exclusivamente para los fines del trámite de certificación y
                no será compartida con terceros sin su consentimiento expreso, salvo
                obligación legal.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Notificaciones</h3>
              <p className="text-muted-foreground">
                Acepto recibir notificaciones sobre el estado de mi trámite a través de:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Mensajes de texto (SMS) al número de celular proporcionado</li>
                <li>Correo electrónico (si fue proporcionado)</li>
                <li>Consulta en línea mediante mi código de seguimiento</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Validez del Certificado</h3>
              <p className="text-muted-foreground">
                El certificado emitido tendrá validez oficial y contará con:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Firma digital del Director Regional</li>
                <li>Código QR de verificación</li>
                <li>Código único de autenticidad</li>
                <li>Validez para todos los trámites educativos y laborales</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Causas de Rechazo</h3>
              <p className="text-muted-foreground">
                La solicitud puede ser rechazada o el acta no encontrada por los siguientes motivos:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Datos incorrectos o inconsistentes</li>
                <li>Nombre de colegio incorrecto o incompleto</li>
                <li>Años de estudio no coinciden con los archivos</li>
                <li>Acta física extraviada o en proceso de reorganización</li>
                <li>Estudiante no aparece en los registros del colegio indicado</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                En estos casos, <strong>no se realizará ningún cobro</strong>.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Delitos Contra la Fe Pública</h3>
              <p className="text-muted-foreground">
                Soy consciente de que la falsificación de documentos, uso de documentos falsos
                y declaración falsa en procedimiento administrativo son delitos tipificados en
                los artículos 427° y 438° del Código Penal, sancionados con pena privativa de
                libertad.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">10. Aceptación</h3>
              <p className="text-muted-foreground">
                Al marcar la casilla de aceptación de términos y condiciones, declaro que:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>He leído y comprendido completamente estos términos</li>
                <li>Acepto todas las condiciones establecidas</li>
                <li>La información proporcionada es verídica</li>
                <li>Autorizo el uso de mis datos para los fines descritos</li>
                <li>Acepto recibir notificaciones del estado del trámite</li>
              </ul>
            </section>

            <section className="pt-4 border-t">
              <p className="text-xs text-muted-foreground italic">
                Última actualización: Noviembre 2025 | SIGCERH - Sistema de Gestión de
                Certificados Históricos
              </p>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {onAccept && (
            <Button onClick={handleAccept}>
              Acepto los Términos y Condiciones
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
