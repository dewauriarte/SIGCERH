/**
 * Dialog para Ver Observaciones de UGEL - Editor
 *
 * Muestra las observaciones detalladas que UGEL ha hecho sobre un certificado.
 * Permite al editor entender qué debe corregir antes de pasar al dialog de corrección.
 */

import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  User,
  Calendar,
  FileText,
  Edit,
} from 'lucide-react';
import { editorService } from '@/services/editor.service';

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
  fechaObservacion: Date | string;
  observadoPor: string;
  diasDesdeObservacion: number;
}

interface VerObservacionDialogProps {
  open: boolean;
  onClose: () => void;
  certificado: CertificadoObservado;
  onCorregir: () => void;
}

export function VerObservacionDialog({
  open,
  onClose,
  certificado,
  onCorregir,
}: VerObservacionDialogProps) {
  // ============================================================================
  // QUERY - OBTENER DETALLES COMPLETOS
  // ============================================================================

  const { data: detalleData, isLoading } = useQuery({
    queryKey: ['observacion-detalle', certificado.id],
    queryFn: () => editorService.getObservacionesCertificado(certificado.id),
    enabled: open,
  });

  const detalle = detalleData?.data;

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatFecha = (fecha: Date | string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUrgenciaBadge = () => {
    const dias = certificado.diasDesdeObservacion;
    if (dias > 7) {
      return <Badge className="bg-red-100 text-red-800">Urgente - Más de 7 días</Badge>;
    } else if (dias > 3) {
      return <Badge className="bg-orange-100 text-orange-800">Prioritario - {dias} días</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Normal - {dias} días</Badge>;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Observaciones de UGEL
          </DialogTitle>
          <DialogDescription>
            Expediente: {certificado.numeroExpediente}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando detalles...</div>
        ) : (
          <div className="space-y-6">
            {/* Alerta de Urgencia */}
            <Alert className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                Este certificado fue observado hace <strong>{certificado.diasDesdeObservacion} días</strong>.
                {certificado.diasDesdeObservacion > 7 && ' Requiere atención urgente.'}
              </AlertDescription>
            </Alert>

            {/* Información del Estudiante */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-primary" />
                  Estudiante
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre completo:</span>
                    <span className="font-medium">
                      {certificado.estudiante.apellidoPaterno}{' '}
                      {certificado.estudiante.apellidoMaterno}, {certificado.estudiante.nombres}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DNI:</span>
                    <span className="font-medium">{certificado.estudiante.numeroDocumento}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información de la Observación */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-primary" />
                  Detalles de la Observación
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Fecha:</span>
                    <span className="font-medium">{formatFecha(certificado.fechaObservacion)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Observado por:</span>
                    <span className="font-medium">{certificado.observadoPor || 'UGEL'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Urgencia:</span>
                    <span>{getUrgenciaBadge()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observaciones Detalladas */}
            <Card className="border-orange-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4 text-orange-600" />
                  Observaciones de UGEL
                </h3>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-md border border-orange-200">
                  <p className="text-sm whitespace-pre-wrap">{detalle?.observaciones || certificado.observaciones}</p>
                </div>
              </CardContent>
            </Card>

            {/* Datos Actuales (si están disponibles) */}
            {detalle?.datosActuales && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Datos Actuales del Certificado</h3>
                  <div className="space-y-2 text-sm">
                    {/* Aquí podrías mostrar los datos actuales del certificado */}
                    <p className="text-muted-foreground text-xs">
                      Revisa estos datos antes de corregir
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instrucciones */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Importante:</strong> Lee cuidadosamente las observaciones antes de realizar
                correcciones. Asegúrate de corregir todos los puntos señalados por UGEL.
              </AlertDescription>
            </Alert>

            <Separator />

            {/* Acciones */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>

              <Button onClick={onCorregir} className="bg-blue-600 hover:bg-blue-700">
                <Edit className="mr-2 h-4 w-4" />
                Corregir Datos
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
