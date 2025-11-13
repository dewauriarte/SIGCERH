/**
 * Dialog mejorado para Registrar Pago en Efectivo
 * Permite buscar por número de expediente y subir comprobante
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/custom/LoadingSpinner';
import { 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Receipt,
  Search,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { pagoService } from '@/services/pago.service';
import { mesaPartesService } from '@/services/mesa-partes.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RegistrarPagoEfectivoDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  numeroExpedienteProp?: string; // Número de expediente si se conoce
}

export function RegistrarPagoEfectivoDialog({
  open,
  onClose,
  onSuccess,
  numeroExpedienteProp,
}: RegistrarPagoEfectivoDialogProps) {
  const queryClient = useQueryClient();
  
  // Estados del formulario
  const [numeroExpediente, setNumeroExpediente] = useState(numeroExpedienteProp || '');
  const [solicitudEncontrada, setSolicitudEncontrada] = useState<any>(null);
  const [buscandoSolicitud, setBuscandoSolicitud] = useState(false);
  const [numeroRecibo, setNumeroRecibo] = useState('');
  const [monto, setMonto] = useState('15.00');
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);

  // Limpiar formulario cuando se abre
  useEffect(() => {
    if (open) {
      setNumeroExpediente(numeroExpedienteProp || '');
      setSolicitudEncontrada(null);
      setNumeroRecibo('');
      setMonto('15.00');
      setFechaPago(new Date().toISOString().split('T')[0]);
      setObservaciones('');
      setComprobanteFile(null);
      setComprobantePreview(null);
      
      // Si viene con expediente, buscar automáticamente
      if (numeroExpedienteProp) {
        buscarSolicitud(numeroExpedienteProp);
      }
    }
  }, [open, numeroExpedienteProp]);

  // Buscar solicitud por número de expediente
  const buscarSolicitud = async (expediente: string) => {
    if (!expediente.trim()) return;
    
    setBuscandoSolicitud(true);
    setSolicitudEncontrada(null);
    
    try {
      // Buscar en la lista de solicitudes
      const response = await mesaPartesService.getSolicitudes(
        { numeroExpediente: expediente.trim() },
        { page: 1, limit: 1 }
      );
      
      if (response.data && response.data.length > 0) {
        setSolicitudEncontrada(response.data[0]);
        toast.success('Solicitud encontrada', {
          description: `${response.data[0].estudiante?.apellidoPaterno} ${response.data[0].estudiante?.nombres}`,
        });
      } else {
        toast.error('No encontrado', {
          description: 'No se encontró una solicitud con ese número de expediente',
        });
      }
    } catch (error) {
      toast.error('Error al buscar', {
        description: 'No se pudo buscar la solicitud',
      });
    } finally {
      setBuscandoSolicitud(false);
    }
  };

  // Manejar subida de comprobante
  const handleComprobanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Tipo de archivo inválido', {
        description: 'Solo se permiten imágenes (JPG, PNG, etc.)',
      });
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Archivo muy grande', {
        description: 'El archivo no debe superar los 5MB',
      });
      return;
    }

    setComprobanteFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setComprobantePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Quitar comprobante
  const handleRemoveComprobante = () => {
    setComprobanteFile(null);
    setComprobantePreview(null);
  };

  // Registrar pago
  const registrarMutation = useMutation({
    mutationFn: async () => {
      // Validaciones
      if (!solicitudEncontrada) {
        throw new Error('Debe buscar y seleccionar una solicitud primero');
      }
      if (!numeroRecibo.trim()) {
        throw new Error('Número de recibo es requerido');
      }
      if (parseFloat(monto) <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      // Convertir comprobante a base64 si existe
      let comprobanteBase64 = undefined;
      if (comprobanteFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(comprobanteFile);
        });
        comprobanteBase64 = await base64Promise;
      }

      return pagoService.registrarEfectivo({
        solicitudId: solicitudEncontrada.id,
        numeroRecibo,
        monto: parseFloat(monto),
        fechaPago,
        observaciones: observaciones || undefined,
        comprobanteBase64,
      });
    },
    onSuccess: () => {
      toast.success('✅ Pago registrado', {
        description: 'El pago en efectivo ha sido registrado y validado automáticamente',
      });

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['pagos'] });
      queryClient.invalidateQueries({ queryKey: ['pagos-stats'] });
      queryClient.invalidateQueries({ queryKey: ['mesa-partes-solicitudes'] });
      queryClient.invalidateQueries({ queryKey: ['mesa-partes-stats'] });

      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error('❌ Error al registrar pago', {
        description: error.response?.data?.message || error.message || 'No se pudo registrar el pago',
      });
    },
  });

  const handleRegistrar = () => {
    // Validación de fecha
    const fechaSeleccionada = new Date(fechaPago);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada > hoy) {
      toast.error('Fecha inválida', {
        description: 'La fecha de pago no puede ser futura',
      });
      return;
    }

    registrarMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Registrar Pago en Efectivo
          </DialogTitle>
          <DialogDescription>
            Busca la solicitud y registra el pago realizado en efectivo
          </DialogDescription>
        </DialogHeader>

        {/* Content con scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Alerta Informativa */}
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
              El pago en efectivo se validará automáticamente al registrarlo
            </AlertDescription>
          </Alert>

          {/* Buscar Solicitud */}
          <div className="space-y-2">
            <Label htmlFor="numero-expediente" className="font-semibold">
              Número de Expediente *
            </Label>
            <div className="flex gap-2">
              <Input
                id="numero-expediente"
                value={numeroExpediente}
                onChange={(e) => setNumeroExpediente(e.target.value.toUpperCase())}
                placeholder="EXP-2025-000001"
                className="font-mono flex-1"
                disabled={!!numeroExpedienteProp}
                onKeyPress={(e) => e.key === 'Enter' && buscarSolicitud(numeroExpediente)}
              />
              <Button
                onClick={() => buscarSolicitud(numeroExpediente)}
                disabled={buscandoSolicitud || !numeroExpediente.trim()}
                size="default"
              >
                {buscandoSolicitud ? (
                  <LoadingSpinner className="h-4 w-4" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ingrese el número de expediente y presione buscar o Enter
            </p>
          </div>

          {/* Solicitud Encontrada */}
          {solicitudEncontrada && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Solicitud Encontrada</p>
                  <p className="text-sm mt-1">
                    <span className="font-mono">{solicitudEncontrada.numeroexpediente}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {solicitudEncontrada.estudiante?.apellidoPaterno} {solicitudEncontrada.estudiante?.apellidoMaterno}, {solicitudEncontrada.estudiante?.nombres}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    DNI: {solicitudEncontrada.estudiante?.numeroDocumento}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Campos deshabilitados si no hay solicitud */}
          <div className={cn(
            "space-y-4",
            !solicitudEncontrada && "opacity-50 pointer-events-none"
          )}>
            {/* Número de Recibo */}
            <div className="space-y-2">
              <Label htmlFor="numero-recibo" className="font-semibold">
                Número de Recibo *
              </Label>
              <div className="flex gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground mt-3 shrink-0" />
                <Input
                  id="numero-recibo"
                  value={numeroRecibo}
                  onChange={(e) => setNumeroRecibo(e.target.value.toUpperCase())}
                  placeholder="REC-2025-0001"
                  className="flex-1 font-mono"
                />
              </div>
            </div>

            {/* Monto y Fecha en Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Monto */}
              <div className="space-y-2">
                <Label htmlFor="monto" className="font-semibold">
                  Monto (S/) *
                </Label>
                <Input
                  id="monto"
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  step="0.01"
                  min="0"
                  className="font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Estándar: S/ 15.00
                </p>
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <Label htmlFor="fecha-pago" className="font-semibold">
                  Fecha de Pago *
                </Label>
                <Input
                  id="fecha-pago"
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  No puede ser futura
                </p>
              </div>
            </div>

            {/* Subir Comprobante/Ticket */}
            <div className="space-y-2">
              <Label className="font-semibold">
                Comprobante/Ticket (Opcional)
              </Label>
              
              {!comprobantePreview ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-primary/50 transition-colors">
                  <label htmlFor="comprobante-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Click para subir imagen
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG (máx. 5MB)
                        </p>
                      </div>
                    </div>
                    <input
                      id="comprobante-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleComprobanteChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="relative border rounded-lg overflow-hidden">
                  <img
                    src={comprobantePreview}
                    alt="Preview comprobante"
                    className="w-full h-48 object-contain bg-gray-50 dark:bg-gray-900"
                  />
                  <button
                    onClick={handleRemoveComprobante}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="p-2 bg-muted/50 text-xs flex items-center gap-2">
                    <ImageIcon className="h-3 w-3" />
                    <span className="truncate">{comprobanteFile?.name}</span>
                    <span className="text-muted-foreground ml-auto">
                      {((comprobanteFile?.size || 0) / 1024).toFixed(0)} KB
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones">
                Observaciones (Opcional)
              </Label>
              <Textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Información adicional sobre el pago..."
                rows={3}
                className="resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {observaciones.length}/500 caracteres
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/20 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={registrarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleRegistrar}
            disabled={!solicitudEncontrada || registrarMutation.isPending}
          >
            {registrarMutation.isPending ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Registrando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Registrar Pago
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
