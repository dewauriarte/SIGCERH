import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  value: string;
  title?: string;
  description?: string;
  size?: number;
  showDownload?: boolean;
  showCopy?: boolean;
  instructions?: string[];
}

export function QRCodeDisplay({
  value,
  title = 'Código QR de Pago',
  description = 'Escanea este código con tu aplicación',
  size = 200,
  showDownload = true,
  showCopy = true,
  instructions = [],
}: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    try {
      const svg = qrRef.current?.querySelector('svg');
      if (svg) {
        // Convertir SVG a Canvas para descargar como PNG
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const url = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = 'qr-code-pago.png';
          link.href = url;
          link.click();
          toast.success('Código QR descargado');
        };
        
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
      }
    } catch (error) {
      toast.error('Error al descargar el código QR');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar el código');
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code */}
        <div className="flex justify-center" ref={qrRef}>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <QRCodeSVG
              value={value}
              size={size}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>

        {/* Instrucciones */}
        {instructions.length > 0 && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Instrucciones:</p>
            <ol className="list-decimal list-inside space-y-1">
              {instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Acciones */}
        {(showDownload || showCopy) && (
          <div className="flex flex-col sm:flex-row gap-2">
            {showDownload && (
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar QR
              </Button>
            )}
            {showCopy && (
              <Button
                variant="outline"
                onClick={handleCopy}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Código
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Valor del código (opcional, para referencia) */}
        <div className="text-xs text-center text-muted-foreground font-mono break-all">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
