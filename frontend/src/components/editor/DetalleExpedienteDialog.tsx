/**
 * Dialog de Detalle de Expediente - Editor
 *
 * Muestra información completa del expediente y estudiante.
 * Solo lectura, para consulta rápida antes de realizar acciones.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  User,
  GraduationCap,
  Calendar,
  FileText,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { type ExpedienteAsignado, type EstadoBusqueda } from '@/services/editor.service';

interface DetalleExpedienteDialogProps {
  open: boolean;
  onClose: () => void;
  expediente: ExpedienteAsignado;
}

export function DetalleExpedienteDialog({
  open,
  onClose,
  expediente,
}: DetalleExpedienteDialogProps) {
  // ============================================================================
  // HELPERS
  // ============================================================================

  const getEstadoBadge = (estado: EstadoBusqueda) => {
    const config: Record<string, { label: string; className: string }> = {
      PENDIENTE_BUSQUEDA: { label: 'Pendiente Búsqueda', className: 'bg-gray-100 text-gray-800' },
      EN_BUSQUEDA: { label: 'En Búsqueda', className: 'bg-blue-100 text-blue-800' },
      ACTA_ENCONTRADA: { label: 'Acta Encontrada', className: 'bg-green-100 text-green-800' },
      ACTA_NO_ENCONTRADA: { label: 'No Encontrada', className: 'bg-red-100 text-red-800' },
      ESPERANDO_PAGO: { label: 'Esperando Pago', className: 'bg-yellow-100 text-yellow-800' },
      LISTO_PARA_OCR: { label: 'Listo para OCR', className: 'bg-purple-100 text-purple-800' },
      DERIVADO_A_EDITOR: { label: 'Derivado a Editor', className: 'bg-gray-100 text-gray-800' },
      ACTA_ENCONTRADA_PENDIENTE_PAGO: { label: 'Encontrada - Pendiente Pago', className: 'bg-green-100 text-green-800' },
      REGISTRADA: { label: 'Registrada', className: 'bg-blue-100 text-blue-800' },
    };

    const badge = config[estado] || { label: estado, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const getPrioridadBadge = (prioridad: 'NORMAL' | 'URGENTE' | 'MUY_URGENTE') => {
    const config = {
      NORMAL: { label: 'Normal', className: 'bg-blue-100 text-blue-800' },
      URGENTE: { label: 'Urgente', className: 'bg-orange-100 text-orange-800' },
      MUY_URGENTE: { label: 'Muy Urgente', className: 'bg-red-100 text-red-800' },
    }[prioridad];

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatFecha = (fecha: Date | string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detalle del Expediente
          </DialogTitle>
          <DialogDescription>
            Información completa del expediente {expediente.numeroExpediente}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Expediente */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{expediente.numeroExpediente}</h3>
                  <p className="text-sm text-muted-foreground">
                    Asignado el {formatFecha(expediente.fechaAsignacion)}
                  </p>
                </div>
                <div className="text-right space-y-2">
                  {getEstadoBadge(expediente.estadoBusqueda)}
                  {getPrioridadBadge(expediente.prioridad)}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Días desde asignación</p>
                    <p className={`font-semibold ${expediente.diasDesdeAsignacion > 7 ? 'text-orange-600' : ''}`}>
                      {expediente.diasDesdeAsignacion} días
                    </p>
                  </div>
                </div>

                {expediente.diasDesdeAsignacion > 7 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <p className="text-xs text-orange-600">Requiere atención prioritaria</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Datos del Estudiante */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-primary" />
                Datos del Estudiante
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Apellido Paterno</p>
                    <p className="font-medium">{expediente.estudiante.apellidoPaterno}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Apellido Materno</p>
                    <p className="font-medium">{expediente.estudiante.apellidoMaterno}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Nombres</p>
                  <p className="font-medium">{expediente.estudiante.nombres}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Número de Documento</p>
                    <p className="font-medium">{expediente.estudiante.numeroDocumento}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ID Estudiante</p>
                    <p className="font-mono text-sm text-muted-foreground">
                      {expediente.estudiante.id}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos Académicos */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <GraduationCap className="h-4 w-4 text-primary" />
                Datos Académicos
              </h3>

              <div className="space-y-3">
                {expediente.datosAcademicos ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Año Lectivo</p>
                        <p className="font-medium">{expediente.datosAcademicos.anioLectivo || 'No especificado'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Grado</p>
                        <p className="font-medium">{expediente.datosAcademicos.grado || 'No especificado'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Colegio de Origen</p>
                      <p className="font-medium">{expediente.datosAcademicos.colegioOrigen || 'No especificado'}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No hay datos académicos disponibles
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información de Búsqueda */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-primary" />
                Estado de Búsqueda
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado actual:</span>
                  <span>{getEstadoBadge(expediente.estadoBusqueda)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prioridad:</span>
                  <span>{getPrioridadBadge(expediente.prioridad)}</span>
                </div>

                {expediente.estadoBusqueda === 'PENDIENTE_BUSQUEDA' && (
                  <p className="text-xs text-muted-foreground mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200">
                    Este expediente está pendiente de búsqueda. Utiliza el botón "Buscar Acta" para
                    iniciar la búsqueda del acta física.
                  </p>
                )}

                {expediente.estadoBusqueda === 'LISTO_PARA_OCR' && (
                  <p className="text-xs text-muted-foreground mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200">
                    El acta ha sido encontrada y el pago validado. Puedes proceder a subir el acta
                    para procesamiento OCR.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
