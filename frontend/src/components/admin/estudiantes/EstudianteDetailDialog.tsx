/**
 * Diálogo para ver detalles de un estudiante
 */

import { useQuery } from '@tanstack/react-query';
import { estudianteService } from '@/services/estudiante.service';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Contact, FileText, GraduationCap, History, Info, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EstudianteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estudianteId: string | null;
}

export function EstudianteDetailDialog({ open, onOpenChange, estudianteId }: EstudianteDetailDialogProps) {
  const { data: estudiante, isLoading } = useQuery({
    queryKey: ['estudiante', estudianteId],
    queryFn: () => estudianteService.getEstudiante(estudianteId!),
    enabled: !!estudianteId && open,
  });

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Cargando</DialogTitle>
            <DialogDescription>
              Cargando información del estudiante...
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!estudiante) return null;

  const edad = estudiante.fechanacimiento 
    ? Math.floor((new Date().getTime() - new Date(estudiante.fechanacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            Detalles del Estudiante
          </DialogTitle>
          <DialogDescription>
            Información completa del estudiante en el sistema
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="informacion" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="informacion">Información</TabsTrigger>
            <TabsTrigger value="academico">Académico</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4 px-1">
            <TabsContent value="informacion" className="space-y-6 mt-0">
              {/* Datos Personales */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">Datos Personales</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">DNI</p>
                      <p className="text-base font-mono font-semibold">{estudiante.dni}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Sexo</p>
                      <Badge variant="outline">{estudiante.sexo === 'M' ? 'Masculino' : 'Femenino'}</Badge>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                      <p className="text-lg font-semibold">{estudiante.nombrecompleto}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</p>
                      <p className="text-base">
                        {format(new Date(estudiante.fechanacimiento), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        {edad && <span className="text-muted-foreground ml-2">({edad} años)</span>}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Lugar de Nacimiento</p>
                      <p className="text-base">
                        {estudiante.lugarnacimiento || <span className="text-muted-foreground italic">No especificado</span>}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Datos de Contacto */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Contact className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-lg">Datos de Contacto</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-base">
                        {estudiante.email || <span className="text-muted-foreground italic">No especificado</span>}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                      <p className="text-base">
                        {estudiante.telefono || <span className="text-muted-foreground italic">No especificado</span>}
                      </p>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                      <p className="text-base">
                        {estudiante.direccion || <span className="text-muted-foreground italic">No especificado</span>}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información Adicional */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-lg">Información Adicional</h3>
                  </div>

                  <div className="space-y-4">
                    {estudiante.observaciones && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Observaciones</p>
                        <p className="text-base bg-muted p-3 rounded-md">{estudiante.observaciones}</p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Estado</p>
                      <Badge
                        variant={
                          estudiante.estado === 'ACTIVO'
                            ? 'default'
                            : estudiante.estado === 'EGRESADO'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {estudiante.estado}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Fecha de Registro</p>
                        <p className="text-base text-muted-foreground">
                          {estudiante.fecharegistro
                            ? format(new Date(estudiante.fecharegistro), "d/MM/yyyy HH:mm", { locale: es })
                            : 'No disponible'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
                        <p className="text-base text-muted-foreground">
                          {estudiante.fechaactualizacion
                            ? format(new Date(estudiante.fechaactualizacion), "d/MM/yyyy HH:mm", { locale: es })
                            : 'No disponible'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academico" className="space-y-6 mt-0">
              {/* Resumen Académico */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Certificados</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                      <div className="rounded-full bg-blue-100 p-3">
                        <GraduationCap className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Solicitudes</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                      <div className="rounded-full bg-green-100 p-3">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Años Cursados</p>
                        <p className="text-2xl font-bold">-</p>
                      </div>
                      <div className="rounded-full bg-purple-100 p-3">
                        <GraduationCap className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Certificados */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">Certificados Emitidos</h3>
                  </div>

                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No se han emitido certificados para este estudiante
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Solicitudes */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-lg">Solicitudes Realizadas</h3>
                  </div>

                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No hay solicitudes registradas para este estudiante
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Información */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Historial Académico Completo
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      El historial académico completo con certificados, solicitudes y años cursados se mostrará aquí cuando estén disponibles en el sistema.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="historial" className="space-y-6 mt-0">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-lg">Historial de Cambios</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Evento: Creación */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-green-100 p-2">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="w-px h-full bg-border mt-2"></div>
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold">Registro Creado</p>
                          <p className="text-xs text-muted-foreground">
                            {estudiante.fecharegistro
                              ? format(new Date(estudiante.fecharegistro), "d MMM yyyy, HH:mm", { locale: es })
                              : 'Fecha no disponible'}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          El estudiante fue registrado en el sistema
                        </p>
                      </div>
                    </div>

                    {/* Evento: Estado Actual */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-blue-100 p-2">
                          <Info className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold">Estado Actual</p>
                          <p className="text-xs text-muted-foreground">
                            {estudiante.fechaactualizacion
                              ? format(new Date(estudiante.fechaactualizacion), "d MMM yyyy, HH:mm", { locale: es })
                              : 'Ahora'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              estudiante.estado === 'ACTIVO'
                                ? 'default'
                                : estudiante.estado === 'EGRESADO'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {estudiante.estado}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Registro de Auditoría Completo
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          El historial detallado de todos los cambios realizados al estudiante se encuentra disponible en el módulo de auditoría del sistema.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
