/**
 * Dialog para Corregir Datos de Certificado Observado - Editor
 *
 * Permite al editor corregir los datos del certificado según las observaciones de UGEL.
 * Incluye validaciones y reenvío automático a UGEL después de guardar.
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertTriangle,
  User,
  BookOpen,
  Send,
} from 'lucide-react';
import { editorService } from '@/services/editor.service';
import { toast } from 'sonner';

interface CertificadoObservado {
  id: string;
  numeroExpediente: string;
  estudiante: {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    numeroDocumento: string;
  };
  observaciones: string;
}

interface CorregirDatosDialogProps {
  open: boolean;
  onClose: () => void;
  certificado: CertificadoObservado;
  onSuccess: () => void;
}

export function CorregirDatosDialog({
  open,
  onClose,
  certificado,
  onSuccess,
}: CorregirDatosDialogProps) {
  // ============================================================================
  // ESTADO LOCAL
  // ============================================================================

  const [nombres, setNombres] = useState(certificado.estudiante.nombres);
  const [apellidoPaterno, setApellidoPaterno] = useState(certificado.estudiante.apellidoPaterno);
  const [apellidoMaterno, setApellidoMaterno] = useState(certificado.estudiante.apellidoMaterno);
  const [notas, setNotas] = useState<{ [codigo: string]: number }>({});
  const [observacionesCorreccion, setObservacionesCorreccion] = useState('');

  // Resetear cuando cambia el certificado
  useEffect(() => {
    setNombres(certificado.estudiante.nombres);
    setApellidoPaterno(certificado.estudiante.apellidoPaterno);
    setApellidoMaterno(certificado.estudiante.apellidoMaterno);
    setNotas({});
    setObservacionesCorreccion('');
  }, [certificado]);

  // ============================================================================
  // QUERY - OBTENER DATOS ACTUALES
  // ============================================================================

  const { data: detalleData } = useQuery({
    queryKey: ['certificado-detalle', certificado.id],
    queryFn: () => editorService.getObservacionesCertificado(certificado.id),
    enabled: open,
  });

  const datosActuales = detalleData?.data?.datosActuales;

  // ============================================================================
  // MUTATION - CORREGIR Y REENVIAR
  // ============================================================================

  const corregirMutation = useMutation({
    mutationFn: async () => {
      if (!nombres.trim() || !apellidoPaterno.trim() || !apellidoMaterno.trim()) {
        throw new Error('Los nombres y apellidos son obligatorios');
      }

      // Paso 1: Corregir datos
      await editorService.corregirCertificado(certificado.id, {
        nombres: nombres.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        notas: Object.keys(notas).length > 0 ? notas : undefined,
        observaciones: observacionesCorreccion.trim() || undefined,
      });

      // Paso 2: Reenviar a UGEL
      return editorService.reenviarAUgel(certificado.id);
    },
    onSuccess: () => {
      toast.success('Certificado corregido y reenviado a UGEL', {
        description: 'UGEL revisará las correcciones realizadas',
      });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al corregir certificado');
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleNotaChange = (codigo: string, valor: string) => {
    const nota = parseFloat(valor);
    if (!isNaN(nota) && nota >= 0 && nota <= 20) {
      setNotas((prev) => ({ ...prev, [codigo]: nota }));
    } else if (valor === '') {
      setNotas((prev) => {
        const nuevo = { ...prev };
        delete nuevo[codigo];
        return nuevo;
      });
    }
  };

  const handleSubmit = async () => {
    await corregirMutation.mutateAsync();
  };

  const canSubmit =
    nombres.trim() &&
    apellidoPaterno.trim() &&
    apellidoMaterno.trim() &&
    !corregirMutation.isPending;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            Corregir Datos del Certificado
          </DialogTitle>
          <DialogDescription>
            Expediente: {certificado.numeroExpediente}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recordatorio de Observaciones */}
          <Alert className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <strong>Observaciones de UGEL:</strong>
              <p className="mt-2 text-sm">{certificado.observaciones}</p>
            </AlertDescription>
          </Alert>

          {/* Datos Personales */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Datos Personales
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apellidoPaterno">
                  Apellido Paterno <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="apellidoPaterno"
                  value={apellidoPaterno}
                  onChange={(e) => setApellidoPaterno(e.target.value)}
                  placeholder="Apellido paterno"
                  maxLength={100}
                  disabled={corregirMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellidoMaterno">
                  Apellido Materno <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="apellidoMaterno"
                  value={apellidoMaterno}
                  onChange={(e) => setApellidoMaterno(e.target.value)}
                  placeholder="Apellido materno"
                  maxLength={100}
                  disabled={corregirMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombres">
                Nombres <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                placeholder="Nombres completos"
                maxLength={100}
                disabled={corregirMutation.isPending}
              />
            </div>
          </div>

          <Separator />

          {/* Corrección de Notas (opcional) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Corrección de Notas (Opcional)
              </h3>
              <Badge variant="secondary">Solo si UGEL lo solicitó</Badge>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Solo corrige las notas si UGEL específicamente lo solicitó en sus observaciones.
                Deja en blanco las notas que no requieren cambios.
              </AlertDescription>
            </Alert>

            <div className="grid gap-3 md:grid-cols-2">
              {/* Ejemplo de áreas - en producción vendría del backend */}
              {['MAT', 'COM', 'ING', 'CTA', 'HGE', 'EPT'].map((codigo) => (
                <div key={codigo} className="space-y-1">
                  <Label htmlFor={`nota-${codigo}`} className="text-xs">
                    {codigo}
                  </Label>
                  <Input
                    id={`nota-${codigo}`}
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={notas[codigo] || ''}
                    onChange={(e) => handleNotaChange(codigo, e.target.value)}
                    placeholder="0-20"
                    className="h-9"
                    disabled={corregirMutation.isPending}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Observaciones de la Corrección */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones de la Corrección</Label>
            <Textarea
              id="observaciones"
              value={observacionesCorreccion}
              onChange={(e) => setObservacionesCorreccion(e.target.value)}
              placeholder="Describe los cambios realizados (opcional)"
              rows={3}
              maxLength={500}
              disabled={corregirMutation.isPending}
            />
            <p className="text-xs text-muted-foreground text-right">
              {observacionesCorreccion.length}/500
            </p>
          </div>

          {/* Información Importante */}
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs">
              <strong>Después de guardar:</strong> El certificado será automáticamente reenviado a
              UGEL para su revisión. UGEL verificará las correcciones realizadas.
            </AlertDescription>
          </Alert>

          <Separator />

          {/* Acciones */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">*</span> Campos obligatorios
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={corregirMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="mr-2 h-4 w-4" />
                {corregirMutation.isPending ? 'Guardando...' : 'Guardar y Reenviar a UGEL'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
