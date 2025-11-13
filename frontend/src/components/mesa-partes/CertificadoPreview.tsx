/**
 * Preview de Certificado
 * Muestra una vista previa del certificado PDF antes de la entrega
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, Eye, QrCode, FileCheck } from 'lucide-react';
import { type Solicitud } from '@/services/mesa-partes.service';
import { toast } from 'sonner';

interface CertificadoPreviewProps {
  open: boolean;
  onClose: () => void;
  solicitud: Solicitud;
}

export function CertificadoPreview({
  open,
  onClose,
  solicitud,
}: CertificadoPreviewProps) {
  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDescargar = () => {
    if (!solicitud.certificado?.id) {
      toast.error('Error', {
        description: 'No se pudo obtener el certificado',
      });
      return;
    }

    const url = `/api/certificados/${solicitud.certificado.id}/descargar`;
    window.open(url, '_blank');

    toast.success('Descarga iniciada', {
      description: 'El certificado se está descargando',
    });
  };

  const handleImprimir = () => {
    if (!solicitud.certificado?.id) {
      toast.error('Error', {
        description: 'No se pudo obtener el certificado',
      });
      return;
    }

    const url = `/api/certificados/${solicitud.certificado.id}/descargar`;

    // Abrir en nueva ventana para imprimir
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const getNombreCompleto = () => {
    if (!solicitud.estudiante) return 'N/A';
    const { nombres, apellidoPaterno, apellidoMaterno } = solicitud.estudiante;
    return `${apellidoPaterno} ${apellidoMaterno}, ${nombres}`;
  };

  const certificadoUrl = solicitud.certificado?.id
    ? `/api/certificados/${solicitud.certificado.id}/preview`
    : null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Preview del Certificado
          </DialogTitle>
          <DialogDescription>
            Exp. {solicitud.numeroexpediente} - {getNombreCompleto()}
          </DialogDescription>
        </DialogHeader>

        {/* Información del Certificado */}
        <div className="border-b pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Estudiante</p>
              <p className="font-medium">{getNombreCompleto()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">DNI</p>
              <p className="font-mono">{solicitud.estudiante?.numeroDocumento || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Código Verificación</p>
              <p className="font-mono text-xs">{solicitud.certificado?.codigoVerificacion || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Estado</p>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Certificado Emitido
              </Badge>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              El certificado incluye código QR de verificación
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImprimir}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDescargar}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        </div>

        {/* Preview del PDF */}
        <div className="flex items-center justify-center overflow-auto max-h-[500px] bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          {certificadoUrl ? (
            <iframe
              src={certificadoUrl}
              title="Preview del Certificado"
              className="w-full h-[500px] border-0"
              onError={() => {
                toast.error('Error al cargar preview', {
                  description: 'No se pudo mostrar la vista previa del certificado',
                });
              }}
            />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-2">No hay preview disponible</p>
              <Button
                variant="outline"
                onClick={handleDescargar}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Certificado
              </Button>
            </div>
          )}
        </div>

        {/* Información Adicional */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border p-3">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Código QR
              </h4>
              <p className="text-muted-foreground text-xs">
                El certificado incluye un código QR que puede ser escaneado para verificar su autenticidad en línea.
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Firma Digital
              </h4>
              <p className="text-muted-foreground text-xs">
                El documento cuenta con firma digital de la Dirección y sello oficial.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
