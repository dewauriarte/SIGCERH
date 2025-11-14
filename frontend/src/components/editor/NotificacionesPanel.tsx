/**
 * Panel de Notificaciones para Editor
 * Panel deslizable con lista de notificaciones del usuario
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  BellOff,
  CheckCheck,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Pencil,
} from 'lucide-react';
import { notificacionService, type Notificacion } from '@/services/notificacion.service';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface NotificacionesPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificacionesPanel({ open, onClose }: NotificacionesPanelProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);

  // ============================================================================
  // QUERIES
  // ============================================================================

  const { data: notificacionesData, isLoading } = useQuery({
    queryKey: ['notificaciones', soloNoLeidas],
    queryFn: () => notificacionService.getNotificaciones({ soloNoLeidas }),
    refetchInterval: 30000, // 30 segundos
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const marcarLeidaMutation = useMutation({
    mutationFn: (id: string) => notificacionService.marcarLeida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones-contador'] });
    },
  });

  const marcarTodasLeidasMutation = useMutation({
    mutationFn: () => notificacionService.marcarTodasLeidas(),
    onSuccess: () => {
      toast.success('Todas las notificaciones marcadas como leídas');
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones-contador'] });
    },
    onError: () => {
      toast.error('Error al marcar notificaciones como leídas');
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleNotificacionClick = (notificacion: Notificacion) => {
    // Marcar como leída si no lo está
    if (!notificacion.fechaleido) {
      marcarLeidaMutation.mutate(notificacion.id);
    }

    // Navegar según el tipo de notificación
    switch (notificacion.tipo) {
      case 'EXPEDIENTE_ASIGNADO':
        navigate('/expedientes');
        break;
      case 'ACTA_PROCESADA':
        navigate('/actas-procesadas');
        break;
      case 'EXPEDIENTE_OBSERVADO':
        navigate('/expedientes');
        break;
      case 'TAREA_PENDIENTE':
        navigate('/expedientes');
        break;
      default:
        navigate('/dashboard');
    }

    onClose();
  };

  const getIconoNotificacion = (tipo: string) => {
    switch (tipo) {
      case 'EXPEDIENTE_ASIGNADO':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'ACTA_PROCESADA':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'EXPEDIENTE_OBSERVADO':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'TAREA_PENDIENTE':
        return <Pencil className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getMensajeNotificacion = (notificacion: Notificacion): string => {
    try {
      const mensaje = JSON.parse(notificacion.mensaje);
      return mensaje.mensaje || notificacion.asunto || 'Nueva notificación';
    } catch {
      return notificacion.asunto || 'Nueva notificación';
    }
  };

  const getNombreEstudiante = (notificacion: Notificacion): string => {
    if (!notificacion.solicitud) return '';
    const { nombres, apellidopaterno, apellidomaterno } = notificacion.solicitud.estudiante;
    return `${apellidopaterno} ${apellidomaterno}, ${nombres}`;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 pb-4 border-b space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <SheetTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificaciones
                </SheetTitle>
                <SheetDescription>
                  {notificacionesData?.meta.total || 0} notificaciones
                </SheetDescription>
              </div>
            </div>

            {/* Filtros y acciones */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant={soloNoLeidas ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setSoloNoLeidas(false)}
                >
                  Todas
                </Button>
                <Button
                  variant={soloNoLeidas ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSoloNoLeidas(true)}
                >
                  No leídas
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => marcarTodasLeidasMutation.mutate()}
                disabled={marcarTodasLeidasMutation.isPending || (notificacionesData?.meta.total || 0) === 0}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas
              </Button>
            </div>
          </SheetHeader>

          {/* Lista de Notificaciones */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
                    <p className="text-sm text-muted-foreground">Cargando notificaciones...</p>
                  </div>
                </div>
              ) : (notificacionesData?.data || []).length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No hay notificaciones</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {notificacionesData?.data.map((notificacion) => (
                    <div key={notificacion.id}>
                      <div
                        className={`
                          p-4 rounded-lg border cursor-pointer transition-colors
                          ${
                            notificacion.fechaleido
                              ? 'bg-background hover:bg-muted/50'
                              : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-950/30'
                          }
                        `}
                        onClick={() => handleNotificacionClick(notificacion)}
                      >
                        <div className="flex gap-3">
                          {/* Icono */}
                          <div className="flex-shrink-0 mt-1">
                            {getIconoNotificacion(notificacion.tipo)}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-medium line-clamp-2">
                                {getMensajeNotificacion(notificacion)}
                              </p>
                              {!notificacion.fechaleido && (
                                <Badge variant="secondary" className="flex-shrink-0 bg-blue-500 text-white">
                                  Nueva
                                </Badge>
                              )}
                            </div>

                            {/* Información adicional */}
                            {notificacion.solicitud && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {notificacion.solicitud.numeroexpediente} - {getNombreEstudiante(notificacion)}
                              </p>
                            )}

                            {/* Fecha */}
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notificacion.fechacreacion), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Separator className="my-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
