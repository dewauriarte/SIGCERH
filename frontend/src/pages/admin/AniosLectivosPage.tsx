/**
 * Página de Gestión de Años Lectivos (Admin)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { anioLectivoService, type AnioLectivo, type CreateAnioLectivoDTO } from '@/services/anio-lectivo.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Eye, Pencil, Trash2, Calendar, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AniosLectivosPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activoFiltro, setActivoFiltro] = useState<string>('ALL');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAnio, setSelectedAnio] = useState<AnioLectivo | null>(null);

  const [formAnio, setFormAnio] = useState('');
  const [formFechaInicio, setFormFechaInicio] = useState('');
  const [formFechaFin, setFormFechaFin] = useState('');
  const [formActivo, setFormActivo] = useState(false);
  const [formObservaciones, setFormObservaciones] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['anios-lectivos', page, search, activoFiltro],
    queryFn: () =>
      anioLectivoService.getAniosLectivos({
        page,
        limit: 20,
        search: search || undefined,
        activo: activoFiltro && activoFiltro !== 'ALL' ? activoFiltro === 'true' : undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAnioLectivoDTO) => anioLectivoService.createAnioLectivo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anios-lectivos'] });
      setShowCreateDialog(false);
      toast.success('Año lectivo creado exitosamente');
      limpiarFormulario();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear año lectivo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAnioLectivoDTO> }) =>
      anioLectivoService.updateAnioLectivo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anios-lectivos'] });
      setShowEditDialog(false);
      toast.success('Año lectivo actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar año lectivo');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => anioLectivoService.deleteAnioLectivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anios-lectivos'] });
      setShowDeleteDialog(false);
      toast.success('Año lectivo eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar año lectivo');
    },
  });

  const limpiarFormulario = () => {
    setFormAnio('');
    setFormFechaInicio('');
    setFormFechaFin('');
    setFormActivo(false);
    setFormObservaciones('');
  };

  const handleCreate = () => {
    const data: CreateAnioLectivoDTO = {
      anio: parseInt(formAnio),
      fechainicio: formFechaInicio,
      fechafin: formFechaFin,
      activo: formActivo,
      observaciones: formObservaciones || undefined,
    };
    createMutation.mutate(data);
  };

  const handleEdit = () => {
    if (!selectedAnio) return;
    const data: Partial<CreateAnioLectivoDTO> = {
      anio: parseInt(formAnio),
      fechainicio: formFechaInicio,
      fechafin: formFechaFin,
      activo: formActivo,
      observaciones: formObservaciones || undefined,
    };
    updateMutation.mutate({ id: selectedAnio.id, data });
  };

  const openEditDialog = (anio: AnioLectivo) => {
    setSelectedAnio(anio);
    setFormAnio(anio.anio.toString());
    setFormFechaInicio(anio.fechainicio.split('T')[0]);
    setFormFechaFin(anio.fechafin.split('T')[0]);
    setFormActivo(anio.activo);
    setFormObservaciones(anio.observaciones || '');
    setShowEditDialog(true);
  };

  const aniosLectivos = data?.data || [];
  const pagination = data?.pagination;
  const hayActivo = aniosLectivos.some(a => a.activo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            Años Lectivos
          </h1>
          <p className="text-muted-foreground mt-2">Gestión de años lectivos del sistema</p>
        </div>
        <Button onClick={() => { limpiarFormulario(); setShowCreateDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Año Lectivo
        </Button>
      </div>

      {formActivo && hayActivo && showCreateDialog && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Al crear este año como activo, se desactivarán automáticamente los demás años lectivos.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar año..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={activoFiltro} onValueChange={setActivoFiltro}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Año</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead>Fecha Fin</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell>
              </TableRow>
            ) : aniosLectivos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">No se encontraron años lectivos</TableCell>
              </TableRow>
            ) : (
              aniosLectivos.map((anio) => (
                <TableRow key={anio.id}>
                  <TableCell className="font-medium">{anio.anio}</TableCell>
                  <TableCell>{new Date(anio.fechainicio).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(anio.fechafin).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={anio.activo ? 'default' : 'secondary'}>
                      {anio.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{anio.observaciones || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedAnio(anio); setShowDetailDialog(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(anio)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedAnio(anio); setShowDeleteDialog(true); }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.pages} ({pagination.total} registros)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
            <Button variant="outline" onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); setShowEditDialog(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{showCreateDialog ? 'Crear Nuevo Año Lectivo' : 'Editar Año Lectivo'}</DialogTitle>
            <DialogDescription>Complete los campos requeridos (*) para {showCreateDialog ? 'registrar' : 'actualizar'} el año lectivo</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)] pr-2">
            {/* Datos Básicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Datos Básicos</h3>
              
              <div className="space-y-2">
                <Label htmlFor="anio" className="text-sm font-medium">Año <span className="text-red-500">*</span></Label>
                <Input id="anio" type="number" value={formAnio} onChange={(e) => setFormAnio(e.target.value)} min="1985" max="2100" placeholder="2024" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechainicio" className="text-sm font-medium">Fecha Inicio <span className="text-red-500">*</span></Label>
                  <Input id="fechainicio" type="date" value={formFechaInicio} onChange={(e) => setFormFechaInicio(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechafin" className="text-sm font-medium">Fecha Fin <span className="text-red-500">*</span></Label>
                  <Input id="fechafin" type="date" value={formFechaFin} onChange={(e) => setFormFechaFin(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Información Adicional</h3>
              
              <div className="space-y-2">
                <Label htmlFor="observaciones" className="text-sm font-medium">Observaciones</Label>
                <Textarea id="observaciones" value={formObservaciones} onChange={(e) => setFormObservaciones(e.target.value)} rows={3} placeholder="Notas adicionales..." />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="activo" className="text-sm font-medium">Año Activo</Label>
              </div>

              {formActivo && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Solo un año puede estar activo a la vez. Los demás se desactivarán automáticamente.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setShowEditDialog(false); }}>Cancelar</Button>
            <Button onClick={showCreateDialog ? handleCreate : handleEdit} disabled={createMutation.isPending || updateMutation.isPending}>
              {showCreateDialog ? 'Crear' : 'Actualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalles */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detalles del Año Lectivo</DialogTitle>
            <DialogDescription>Información completa del año lectivo</DialogDescription>
          </DialogHeader>
          {selectedAnio && (
            <div className="space-y-6 py-4 overflow-y-auto flex-1 pr-2">
              {/* Datos Básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Datos Básicos</h3>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Año</p>
                  <p className="text-3xl font-bold">{selectedAnio.anio}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Fecha Inicio</p>
                    <p className="text-base">{new Date(selectedAnio.fechainicio).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Fecha Fin</p>
                    <p className="text-base">{new Date(selectedAnio.fechafin).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge variant={selectedAnio.activo ? 'default' : 'secondary'} className="text-sm">
                    {selectedAnio.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              {/* Información Adicional */}
              {(selectedAnio.observaciones || selectedAnio._count) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Información Adicional</h3>
                  
                  {selectedAnio.observaciones && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Observaciones</p>
                      <p className="text-base bg-muted p-3 rounded-md">{selectedAnio.observaciones}</p>
                    </div>
                  )}

                  {selectedAnio._count && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Registros Asociados</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm font-medium text-muted-foreground">Actas Físicas</p>
                          <p className="text-2xl font-bold">{selectedAnio._count.actafisica}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm font-medium text-muted-foreground">Certificados</p>
                          <p className="text-2xl font-bold">{selectedAnio._count.certificadodetalle}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm font-medium text-muted-foreground">Currículos</p>
                          <p className="text-2xl font-bold">{selectedAnio._count.curriculogrado}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Año Lectivo</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar el año {selectedAnio?.anio}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => selectedAnio && deleteMutation.mutate(selectedAnio.id)}
              disabled={deleteMutation.isPending}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

