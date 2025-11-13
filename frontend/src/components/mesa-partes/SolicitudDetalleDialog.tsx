/**
 * Dialog mejorado para mostrar detalles completos de una solicitud
 * Incluye parseo de JSON de observaciones, datos de apoderado, archivos, etc.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/custom/StatusBadge';
import {
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Download,
  GraduationCap,
  Calendar,
  Shield,
} from 'lucide-react';
import type { Solicitud } from '@/services/mesa-partes.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SolicitudDetalleDialogProps {
  open: boolean;
  onClose: () => void;
  solicitud: Solicitud;
}

// Tipos para el JSON de observaciones
interface DatosAcademicos {
  departamento: string;
  provincia: string;
  distrito: string;
  nombreColegio: string;
  ultimoAnioCursado: number;
  nivel: string;
}

interface DatosContacto {
  celular: string;
  email?: string;
}

interface DatosApoderado {
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  relacionConEstudiante: string;
  cartaPoderUrl?: string;
}

interface ObservacionesJSON {
  datosAcademicos?: DatosAcademicos;
  contacto?: DatosContacto;
  motivoSolicitud?: string;
  esApoderado?: boolean;
  datosApoderado?: DatosApoderado;
}

export function SolicitudDetalleDialog({
  open,
  onClose,
  solicitud,
}: SolicitudDetalleDialogProps) {
  
  // Intentar parsear observaciones como JSON
  const getObservacionesParsed = (): ObservacionesJSON | null => {
    if (!solicitud.observaciones) return null;
    
    try {
      return JSON.parse(solicitud.observaciones) as ObservacionesJSON;
    } catch {
      return null;
    }
  };

  const observacionesParsed = getObservacionesParsed();

  const formatFecha = (fecha: Date | string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return 'N/A';
    }
  };

  const getNombreCompleto = () => {
    if (!solicitud.estudiante) return 'N/A';
    const { nombres, apellidoPaterno, apellidoMaterno } = solicitud.estudiante;
    return `${apellidoPaterno} ${apellidoMaterno}, ${nombres}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-background to-muted/20 shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl">
                Solicitud #{solicitud.numeroexpediente}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={solicitud.estado as any} />
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {solicitud.numeroseguimiento}
                </span>
              </div>
            </div>
            <Badge variant="outline" className="mt-1 shrink-0">
              {solicitud.prioridad}
            </Badge>
          </div>
        </DialogHeader>

        {/* Content con scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
          
          {/* Estudiante */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Estudiante</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Nombre Completo</p>
                <p className="font-medium">{getNombreCompleto()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">DNI</p>
                <p className="font-mono">{solicitud.estudiante?.numeroDocumento || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Editor Asignado (si existe) */}
          {solicitud.editor && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-sm">Editor Asignado</h4>
              </div>
              <div>
                <p className="font-medium">{solicitud.editor.nombres} {solicitud.editor.apellidos}</p>
                <p className="text-sm text-muted-foreground">{solicitud.editor.email}</p>
              </div>
            </div>
          )}

          {/* Datos Académicos (si existen en observaciones JSON) */}
          {observacionesParsed?.datosAcademicos && (
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h4 className="font-semibold text-sm">Datos Académicos</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Institución Educativa</p>
                  <p className="text-sm font-medium">{observacionesParsed.datosAcademicos.nombreColegio}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nivel</p>
                  <p className="text-sm font-medium">{observacionesParsed.datosAcademicos.nivel}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Último Año Cursado</p>
                  <p className="text-sm font-medium">{observacionesParsed.datosAcademicos.ultimoAnioCursado}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ubigeo</p>
                  <p className="text-sm font-mono">
                    {observacionesParsed.datosAcademicos.distrito}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Datos de Contacto */}
          {observacionesParsed?.contacto && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h4 className="font-semibold text-sm">Datos de Contacto</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{observacionesParsed.contacto.celular}</span>
                </div>
                {observacionesParsed.contacto.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{observacionesParsed.contacto.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Datos de Apoderado (si existe) */}
          {observacionesParsed?.esApoderado && observacionesParsed?.datosApoderado && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h4 className="font-semibold text-sm">Datos del Apoderado</h4>
                <Badge variant="secondary" className="ml-auto">
                  {observacionesParsed.datosApoderado.relacionConEstudiante}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Nombre Completo</p>
                  <p className="text-sm font-medium">
                    {observacionesParsed.datosApoderado.apellidoPaterno} {' '}
                    {observacionesParsed.datosApoderado.apellidoMaterno}, {' '}
                    {observacionesParsed.datosApoderado.nombres}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{observacionesParsed.datosApoderado.tipoDocumento}</p>
                  <p className="text-sm font-mono">{observacionesParsed.datosApoderado.numeroDocumento}</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded text-xs">
                  ⚠️ Solicitud realizada por apoderado - Verificar carta poder
                </div>
                {observacionesParsed.datosApoderado.cartaPoderUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const url = `http://localhost:3000${observacionesParsed.datosApoderado!.cartaPoderUrl}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Ver Carta Poder
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Motivo de Solicitud */}
          {observacionesParsed?.motivoSolicitud && (
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Motivo de Solicitud</h4>
              </div>
              <p className="text-sm">{observacionesParsed.motivoSolicitud}</p>
            </div>
          )}

          {/* Observaciones en texto (si no es JSON o hay texto adicional) */}
          {solicitud.observaciones && !observacionesParsed && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h4 className="font-semibold text-sm">Observaciones</h4>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">
                {solicitud.observaciones}
              </p>
            </div>
          )}

          {/* Fechas */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">Fechas</h4>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Fecha de Solicitud</p>
                <p className="font-medium">{formatFecha(solicitud.fechasolicitud)}</p>
              </div>
              {solicitud.fechaactualizacion && (
                <div>
                  <p className="text-muted-foreground text-xs">Última Actualización</p>
                  <p className="font-medium">{formatFecha(solicitud.fechaactualizacion)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pago (si existe) */}
          {solicitud.pago && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Información de Pago</h4>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto:</span>
                  <span className="font-medium">S/ {solicitud.pago.monto?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge variant="outline">{solicitud.pago.estado}</Badge>
                </div>
                {solicitud.pago.metodopago && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método:</span>
                    <span>{solicitud.pago.metodopago}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Certificado (si existe) */}
          {solicitud.certificado && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Certificado</h4>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Código Virtual:</span>
                  <span className="font-mono">{solicitud.certificado.codigovirtual}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge variant="outline">{solicitud.certificado.estado}</Badge>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/20 flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

