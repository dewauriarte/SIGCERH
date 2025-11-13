/**
 * Viewer de Comprobante de Pago
 * Muestra comprobantes de pago (Yape, Plin, etc.) en un lightbox
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Download, X } from 'lucide-react';
import { pagoService, type Pago } from '@/services/pago.service';
import { toast } from 'sonner';

interface ComprobanteViewerProps {
  open: boolean;
  onClose: () => void;
  pago: Pago;
}

export function ComprobanteViewer({
  open,
  onClose,
  pago,
}: ComprobanteViewerProps) {
  const [zoom, setZoom] = useState(100);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleDescargar = async () => {
    try {
      const url = pagoService.getComprobanteUrl(pago);
      if (!url) {
        toast.error('No se pudo obtener el comprobante');
        return;
      }

      // Abrir en nueva pestaña para descargar
      window.open(url, '_blank');

      toast.success('Descarga iniciada', {
        description: 'El comprobante se abrió en una nueva pestaña',
      });
    } catch (error) {
      toast.error('Error al descargar', {
        description: 'No se pudo descargar el comprobante',
      });
    }
  };

  const comprobanteUrl = pagoService.getComprobanteUrl(pago);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Comprobante de Pago - {pago.codigo}
          </DialogTitle>
          <DialogDescription>
            Método: {pagoService.getMetodoPagoLabel(pago.metodoPago)} | Monto: S/ {pago.monto.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        {/* Controles */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{zoom}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDescargar}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Imagen del Comprobante */}
        <div className="flex items-center justify-center overflow-auto max-h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          {comprobanteUrl ? (
            <img
              src={comprobanteUrl}
              alt="Comprobante de pago"
              style={{ width: `${zoom}%` }}
              className="max-w-full h-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23ddd" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%23999">Comprobante no disponible</text></svg>';
              }}
            />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>No hay comprobante disponible para este pago</p>
            </div>
          )}
        </div>

        {/* Información Adicional */}
        {pago.observaciones && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Observaciones:</h4>
            <p className="text-sm text-muted-foreground">{pago.observaciones}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
