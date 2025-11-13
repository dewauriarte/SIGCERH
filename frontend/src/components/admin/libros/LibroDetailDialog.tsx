/**
 * Dialog para Ver Detalles del Libro de Actas
 * Vista completa con tabs: Información, Actas, Historial
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  MapPin,
  Calendar,
  FileText,
  Info,
  Files,
  History,
  X,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { libroService } from '@/services/libro.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LibroDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  libroId: string | null;
}

const estadoBadgeVariant = (estado: string) => {
  switch (estado) {
    case 'ACTIVO':
      return 'default';
    case 'ARCHIVADO':
      return 'secondary';
    case 'EXTRAVIADO':
      return 'destructive';
    case 'DETERIORADO':
      return 'outline';
    default:
      return 'secondary';
  }
};

export function LibroDetailDialog({ open, onOpenChange, libroId }: LibroDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('info');

  // Cargar datos del libro
  const { data: libroResponse, isLoading } = useQuery({
    queryKey: ['libro', libroId],
    queryFn: () => libroService.getLibro(libroId!),
    enabled: open && !!libroId,
  });

  const libro = libroResponse?.data;

  const handleClose = () => {
    setActiveTab('info');
    onOpenChange(false);
  };

  if (!open || !libroId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Detalles del Libro
              </DialogTitle>
              {libro && (
                <DialogDescription className="mt-2">
                  Código: <span className="font-mono font-semibold">{libro.codigo}</span>
                </DialogDescription>
              )}
            </div>
            {libro && (
              <Badge variant={estadoBadgeVariant(libro.estado)}>
                {libro.estado}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : libro ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Información
              </TabsTrigger>
              <TabsTrigger value="actas" className="flex items-center gap-2">
                <Files className="h-4 w-4" />
                Actas
                {libro._count?.actafisica !== undefined && (
                  <Badge variant="secondary" className="ml-1">
                    {libro._count.actafisica}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="historial" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Historial
              </TabsTrigger>
            </TabsList>

            {/* TAB: Información */}
            <TabsContent value="info" className="space-y-4 mt-4">
              {/* Información Básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Código</p>
                      <p className="font-mono font-semibold">{libro.codigo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estado</p>
                      <Badge variant={estadoBadgeVariant(libro.estado)} className="mt-1">
                        {libro.estado}
                      </Badge>
                    </div>
                  </div>

                  {libro.descripcion && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Descripción</p>
                      <p className="text-sm">{libro.descripcion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ubicación y Detalles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Ubicación y Detalles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {libro.ubicacion_fisica && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Ubicación Física</p>
                        <p className="text-sm flex items-center gap-2 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {libro.ubicacion_fisica}
                        </p>
                      </div>
                    )}

                    {libro.anio_inicio && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Año Inicio</p>
                        <p className="text-sm flex items-center gap-2 mt-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {libro.anio_inicio}
                        </p>
                      </div>
                    )}

                    {libro.anio_fin && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Año Fin</p>
                        <p className="text-sm flex items-center gap-2 mt-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {libro.anio_fin}
                        </p>
                      </div>
                    )}

                    {libro.total_folios && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total de Folios</p>
                        <p className="text-sm flex items-center gap-2 mt-1">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          {libro.total_folios} folios
                        </p>
                      </div>
                    )}

                    {libro._count?.actafisica !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Actas Registradas</p>
                        <p className="text-sm flex items-center gap-2 mt-1">
                          <Files className="h-3.5 w-3.5 text-muted-foreground" />
                          {libro._count.actafisica} actas
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Observaciones */}
              {libro.observaciones && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Observaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{libro.observaciones}</p>
                  </CardContent>
                </Card>
              )}

              {/* Metadatos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    Metadatos del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ID del Sistema</p>
                      <p className="font-mono text-sm">{libro.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
                      <p className="text-sm">
                        {format(new Date(libro.fecha_creacion), "dd/MM/yyyy HH:mm", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estado del Registro</p>
                      <Badge variant={libro.activo ? 'default' : 'secondary'}>
                        {libro.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Actas */}
            <TabsContent value="actas" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Files className="h-4 w-4 text-muted-foreground" />
                      Actas Físicas Registradas
                    </span>
                    {libro._count?.actafisica !== undefined && (
                      <Badge variant="secondary">
                        {libro._count.actafisica} {libro._count.actafisica === 1 ? 'acta' : 'actas'}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {libro._count?.actafisica === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Files className="h-12 w-12 text-muted-foreground/20 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        No hay actas registradas
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Este libro aún no tiene actas físicas asociadas
                      </p>
                      <Button variant="outline" className="mt-4" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Primera Acta
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Resumen de Actas</p>
                          <Badge variant="outline">{libro._count.actafisica} registradas</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Este libro contiene {libro._count.actafisica} acta(s) física(s). 
                          Para ver el listado completo y gestionar las actas, ve a la sección de 
                          <strong className="text-foreground"> Actas Físicas</strong> en el menú principal.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-lg border p-3 text-center">
                          <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{libro._count.actafisica}</p>
                          <p className="text-xs text-muted-foreground">Total Actas</p>
                        </div>
                        <div className="rounded-lg border p-3 text-center">
                          <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold">
                            {libro.anio_inicio && libro.anio_fin 
                              ? `${libro.anio_fin - libro.anio_inicio + 1}`
                              : '-'}
                          </p>
                          <p className="text-xs text-muted-foreground">Años Cubiertos</p>
                        </div>
                        <div className="rounded-lg border p-3 text-center">
                          <MapPin className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                          <p className="text-sm font-bold truncate">
                            {libro.ubicacion_fisica || 'Sin ubicación'}
                          </p>
                          <p className="text-xs text-muted-foreground">Ubicación Física</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Historial */}
            <TabsContent value="historial" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    Historial de Cambios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Registro de creación */}
                    <div className="flex gap-3 pb-3 border-b last:border-0">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Libro creado</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(libro.fecha_creacion), "dd/MM/yyyy HH:mm", { locale: es })}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          El libro <strong className="font-mono">{libro.codigo}</strong> fue registrado en el sistema
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            Estado: {libro.estado}
                          </Badge>
                          {libro.total_folios && (
                            <Badge variant="outline" className="text-xs">
                              {libro.total_folios} folios
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Estado actual */}
                    <div className="flex gap-3 pb-3 border-b last:border-0">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Info className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Estado actual</p>
                          <p className="text-xs text-muted-foreground">Ahora</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          El libro se encuentra en estado <strong>{libro.estado}</strong> con {libro._count?.actafisica || 0} acta(s) registrada(s)
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={libro.activo ? 'default' : 'secondary'} className="text-xs">
                            {libro.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                          {libro._count?.actafisica !== undefined && libro._count.actafisica > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {libro._count.actafisica} actas
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Nota informativa */}
                    <div className="rounded-lg bg-muted/50 p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <History className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">Registro de auditoría</p>
                          <p className="text-xs text-muted-foreground">
                            El sistema registra automáticamente todos los cambios realizados en este libro, 
                            incluyendo modificaciones de estado, actualizaciones de datos y asignación de actas.
                            El historial completo con detalles de usuario y timestamp estará disponible próximamente.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive/20 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No se pudo cargar la información del libro
            </p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
