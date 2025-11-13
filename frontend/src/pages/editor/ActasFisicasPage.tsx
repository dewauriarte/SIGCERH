/**
 * Página de Gestión de Actas Físicas
 * Lista, búsqueda y filtrado de todas las actas del sistema
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  FileQuestion,
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Brain,
  Users,
  BookOpen,
  Inbox,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { actaService } from '@/services/acta.service';
import { libroService } from '@/services/libro.service';
import { gradoService, type Grado } from '@/services/grado.service';
import { anioLectivoService, type AnioLectivo } from '@/services/anioLectivo.service';
import { toast } from 'sonner';
import { MoreHorizontal } from 'lucide-react';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ActasFisicasPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estado local
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [procesadoFiltro, setProcesadoFiltro] = useState<string>('ALL');
  const [libroTab, setLibroTab] = useState<string>('ALL');
  const [filtroAnioLectivoId, setFiltroAnioLectivoId] = useState<string>('ALL');
  const [filtroGradoId, setFiltroGradoId] = useState<string>('ALL');
  
  // Estados para modales
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedActa, setSelectedActa] = useState<any | null>(null);

  // Estados para formulario de edición
  const [editLibroId, setEditLibroId] = useState<string>('');
  const [editFolio, setEditFolio] = useState<string>('');
  const [editTurno, setEditTurno] = useState<string>('');
  const [editTipoEvaluacion, setEditTipoEvaluacion] = useState<string>('');
  const [editObservaciones, setEditObservaciones] = useState<string>('');
  const [editAnioLectivoId, setEditAnioLectivoId] = useState<string>('');
  const [editGradoId, setEditGradoId] = useState<string>('');
  const [editSeccion, setEditSeccion] = useState<string>('');

  // Estados para formulario de crear
  const [searchAnio, setSearchAnio] = useState<string>('');
  const [searchAnioEdit, setSearchAnioEdit] = useState<string>('');
  const [createAnioLectivoId, setCreateAnioLectivoId] = useState<string>('');
  const [createGradoId, setCreateGradoId] = useState<string>('');
  const [createSeccion, setCreateSeccion] = useState<string>('');
  const [createTurno, setCreateTurno] = useState<string>('MAÑANA');
  const [createTipoEvaluacion, setCreateTipoEvaluacion] = useState<string>('FINAL');
  const [createLibroId, setCreateLibroId] = useState<string>('');
  const [createFolio, setCreateFolio] = useState<string>('');
  const [createObservaciones, setCreateObservaciones] = useState<string>('');

  // Efecto para inicializar el formulario cuando se selecciona un acta
  useEffect(() => {
    if (selectedActa && showEditDialog) {
      setEditLibroId(selectedActa.libro?.id || '');
      setEditFolio(selectedActa.folio || '');
      setEditTurno(selectedActa.turno || 'MAÑANA');
      setEditTipoEvaluacion(selectedActa.tipoevaluacion || 'FINAL');
      setEditObservaciones(selectedActa.observaciones || '');
      setEditAnioLectivoId(selectedActa.aniolectivo?.id || '');
      setEditGradoId(selectedActa.grado?.id || '');
      setEditSeccion(selectedActa.seccion || '');
    }
  }, [selectedActa, showEditDialog]);

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  const { data: actasResponse, isLoading } = useQuery({
    queryKey: ['actas-fisicas', page, search, procesadoFiltro, libroTab, filtroAnioLectivoId, filtroGradoId],
    queryFn: () => {
      // Construir params solo con valores que no sean "ALL"
      const params: any = {
        page,
        limit: 20,
      };
      
      // Solo agregar filtro de estado OCR si no es "ALL"
      if (procesadoFiltro !== 'ALL') {
        params.estadoOCR = procesadoFiltro;
      }

      // Solo agregar filtro de libro si no es "ALL"
      if (libroTab !== 'ALL') {
        params.libroId = libroTab;
      }

      // Solo agregar filtro de año lectivo si no es "ALL"
      if (filtroAnioLectivoId !== 'ALL') {
        params.anioLectivoId = filtroAnioLectivoId;
      }

      // Solo agregar filtro de grado si no es "ALL"
      if (filtroGradoId !== 'ALL') {
        params.gradoId = filtroGradoId;
      }
      
      return actaService.getActas(params);
    },
  });

  // Query para libros activos
  const { data: librosData } = useQuery({
    queryKey: ['libros-activos'],
    queryFn: () => libroService.getLibrosActivos(),
  });

  // Query para grados activos
  const { data: gradosData } = useQuery({
    queryKey: ['grados-activos'],
    queryFn: async () => {
      const response = await gradoService.getGradosActivos();
      return response.data;
    },
  });

  // Query para años lectivos - TODOS los años, no solo activos
  const { data: aniosLectivosData } = useQuery({
    queryKey: ['anios-lectivos-todos'],
    queryFn: async () => {
      const response = await anioLectivoService.getAniosLectivos({ limit: 100 });
      return response.data;
    },
  });

  // Mutación para actualizar acta
  const updateActaMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      return actaService.updateActaFisica(data.id, data.updates);
    },
    onSuccess: () => {
      toast.success('✅ Acta actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['actas-fisicas'] });
      setShowEditDialog(false);
      setSelectedActa(null);
    },
    onError: (error: any) => {
      toast.error(`❌ Error al actualizar: ${error.response?.data?.message || error.message}`);
    },
  });

  // Mutación para eliminar acta
  const deleteMutation = useMutation({
    mutationFn: (id: string) => actaService.deleteActa(id),
    onSuccess: () => {
      toast.success('✅ Acta eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['actas-fisicas'] });
      setShowDeleteDialog(false);
      setSelectedActa(null);
    },
    onError: (error: any) => {
      toast.error(`❌ Error al eliminar: ${error.response?.data?.message || error.message}`);
    },
  });

  // Mutación para crear acta
  const createActaMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/actas', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear acta');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('✅ Acta creada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['actas-fisicas'] });
      setShowCreateDialog(false);
      // Limpiar formulario
      setCreateAnioLectivoId('');
      setCreateGradoId('');
      setCreateSeccion('');
      setCreateTurno('MAÑANA');
      setCreateTipoEvaluacion('FINAL');
      setCreateLibroId('');
      setCreateFolio('');
      setCreateObservaciones('');
    },
    onError: (error: any) => {
      toast.error(`❌ Error al crear acta: ${error.message}`);
    },
  });

  // Reset page cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [search, procesadoFiltro, libroTab, filtroAnioLectivoId, filtroGradoId]);

  const actas = actasResponse?.data || [];
  const pagination = actasResponse?.pagination;
  const libros = librosData?.data || [];
  const grados = gradosData || [];
  const aniosLectivos = aniosLectivosData || [];

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  // Función para manejar la actualización del acta
  const handleUpdateActa = () => {
    if (!selectedActa) return;

    const updates = {
      anioLectivoId: editAnioLectivoId || undefined,
      gradoId: editGradoId || undefined,
      seccion: editSeccion || undefined,
      libroId: editLibroId || undefined,
      folio: editFolio || undefined,
      turno: editTurno,
      tipoEvaluacion: editTipoEvaluacion,
      observaciones: editObservaciones || undefined,
    };

    updateActaMutation.mutate({ id: selectedActa.id, updates });
  };

  // Función para manejar la creación del acta
  const handleCreateActa = () => {
    // Validaciones
    if (!createAnioLectivoId) {
      toast.error('Debe seleccionar un año lectivo');
      return;
    }
    if (!createGradoId) {
      toast.error('Debe seleccionar un grado');
      return;
    }
    if (!createSeccion.trim()) {
      toast.error('La sección es obligatoria');
      return;
    }

    // Obtener archivo
    const fileInput = document.getElementById('archivo') as HTMLInputElement;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast.error('Debe seleccionar un archivo');
      return;
    }

    const archivo = fileInput.files[0];

    // Validar tamaño (10MB)
    if (archivo.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar 10MB');
      return;
    }

    // Crear FormData
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('anioLectivoId', createAnioLectivoId);
    formData.append('gradoId', createGradoId);
    formData.append('seccion', createSeccion);
    formData.append('turno', createTurno);
    formData.append('tipoEvaluacion', createTipoEvaluacion);
    formData.append('tipo', 'FINAL'); // Tipo de acta
    formData.append('numero', `ACTA-${Date.now()}`); // Número temporal

    if (createLibroId) formData.append('libroId', createLibroId);
    if (createFolio) formData.append('folio', createFolio);
    if (createObservaciones) formData.append('observaciones', createObservaciones);

    createActaMutation.mutate(formData);
  };

  // Helper para estado OCR (basado en procesadoconia booleano)
  const getEstadoOCRBadge = (procesado?: boolean) => {
    if (procesado) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Procesado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>
    );
  };

  // Helper para estado del acta
  const getEstadoBadge = (estado?: string | null) => {
    if (!estado) return <Badge variant="secondary">Sin estado</Badge>;
    
    const badges: Record<string, { variant: any; color: string }> = {
      DISPONIBLE: { variant: 'secondary', color: '' },
      ASIGNADA_BUSQUEDA: { variant: 'default', color: 'bg-blue-600' },
      ENCONTRADA: { variant: 'default', color: 'bg-green-600' },
      NO_ENCONTRADA: { variant: 'destructive', color: '' },
    };

    const badge = badges[estado] || { variant: 'secondary', color: '' };

    return (
      <Badge variant={badge.variant} className={badge.color}>
        {estado}
      </Badge>
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Actas Físicas
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestión de actas físicas digitalizadas (1985-2012)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/editor/procesar-ocr')}>
            <Brain className="h-4 w-4 mr-2" />
            Procesar OCR
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Subir Acta
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, año, grado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={procesadoFiltro} onValueChange={setProcesadoFiltro}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Estado OCR" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="PENDIENTE">Pendiente</SelectItem>
              <SelectItem value="PROCESANDO">Procesando</SelectItem>
              <SelectItem value="COMPLETADO">Completado</SelectItem>
              <SelectItem value="ERROR">Con Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Filtros adicionales: Año Lectivo y Grado */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={filtroAnioLectivoId} onValueChange={setFiltroAnioLectivoId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Año Lectivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los años</SelectItem>
              {aniosLectivos.map((anio: AnioLectivo) => (
                <SelectItem key={anio.id} value={anio.id}>
                  {anio.anio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filtroGradoId} onValueChange={setFiltroGradoId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Grado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los grados</SelectItem>
              {grados.map((grado: Grado) => (
                <SelectItem key={grado.id} value={grado.id}>
                  {grado.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filtroAnioLectivoId !== 'ALL' || filtroGradoId !== 'ALL') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setFiltroAnioLectivoId('ALL');
                setFiltroGradoId('ALL');
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      {pagination && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{pagination.total}</div>
              <p className="text-xs text-muted-foreground">Total actas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {actas.filter(a => a.procesadoconia).length}
              </div>
              <p className="text-xs text-muted-foreground">Procesadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {actas.filter(a => !a.procesadoconia).length}
              </div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {actas.reduce((sum, a) => {
                  const datos = a.datosextraidosjson 
                    ? (typeof a.datosextraidosjson === 'string' ? JSON.parse(a.datosextraidosjson) : a.datosextraidosjson)
                    : null;
                  return sum + (datos?.estudiantes?.length || 0);
                }, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Estudiantes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de Actas con Tabs por Libro */}
      <Card>
        <CardHeader>
          <CardTitle>Actas Registradas</CardTitle>
          <CardDescription>
            {pagination?.total || 0} actas en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={libroTab} onValueChange={setLibroTab} className="w-full">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-transparent p-0 mb-6">
              <TabsTrigger value="ALL" className="gap-2">
                <Inbox className="h-4 w-4" />
                Todos los Libros
              </TabsTrigger>
              {librosData?.data?.map((libro: any) => (
                <TabsTrigger key={libro.id} value={libro.id} className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  {libro.codigo} - {libro.niveleducativo?.nombre || ''} {libro.descripcion ? `- ${libro.descripcion}` : ''}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Contenido único - el filtrado se hace en la query */}
            <div className="mt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Información</TableHead>
                      <TableHead>Estado OCR</TableHead>
                      <TableHead>Estudiantes</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell>
                  </TableRow>
                ) : actas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No se encontraron actas</h3>
                      <p className="text-muted-foreground mb-4">Intenta con otros filtros o sube una nueva acta.</p>
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Subir Primera Acta
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  actas.map((acta: any) => {
                    const datosOCR = acta.datosextraidosjson 
                      ? (typeof acta.datosextraidosjson === 'string' ? JSON.parse(acta.datosextraidosjson) : acta.datosextraidosjson)
                      : null;
                    const numEstudiantes = datosOCR?.estudiantes?.length || 0;
                    
                    return (
                      <TableRow key={acta.id}>
                        {/* Número */}
                        <TableCell>
                          <div className="font-mono font-medium">{acta.numero}</div>
                          {acta.tipo && (
                            <Badge variant="outline" className="text-xs mt-1">{acta.tipo}</Badge>
                          )}
                        </TableCell>

                        {/* Información */}
                        <TableCell>
                          <div>
                            <p className="font-medium">{acta.aniolectivo?.anio || 'N/A'} - {acta.grado?.nombre || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">
                              Sección: {acta.seccion || 'N/A'} • {acta.libro?.codigo || 'N/A'}/{acta.folio || '-'}
                            </p>
                          </div>
                        </TableCell>

                        {/* Estado OCR */}
                        <TableCell>{getEstadoOCRBadge(acta.procesadoconia)}</TableCell>

                        {/* Estudiantes */}
                        <TableCell>
                          {numEstudiantes > 0 ? (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold text-blue-600">{numEstudiantes}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Fecha */}
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {acta.fechasubida ? format(new Date(acta.fechasubida), 'dd/MM/yy', { locale: es }) : '-'}
                          </span>
                        </TableCell>

                        {/* Acciones */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {acta.datosextraidosjson && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const datosOCR = typeof acta.datosextraidosjson === 'string'
                                    ? JSON.parse(acta.datosextraidosjson)
                                    : acta.datosextraidosjson;
                                  
                                  // Transformar del formato de normalización al formato ResultadoOCR
                                  const resultadoOCR = {
                                    totalEstudiantes: datosOCR.metadata?.total_estudiantes || datosOCR.estudiantes?.length || 0,
                                    estudiantes: (datosOCR.estudiantes || []).map((est: any) => {
                                      // Construir nombreCompleto
                                      const nombreCompleto = [
                                        est.apellido_paterno || est.apellidoPaterno || '',
                                        est.apellido_materno || est.apellidoMaterno || '',
                                        est.nombres || ''
                                      ].filter(Boolean).join(' ').trim() || 'Sin nombre';

                                      // Convertir notas a array SOLO para visualización (mantener objeto original)
                                      let notasArray: number[] = [];
                                      if (est.notas) {
                                        if (Array.isArray(est.notas)) {
                                          notasArray = est.notas;
                                        } else if (typeof est.notas === 'object') {
                                          // Es un objeto, extraer valores ordenados
                                          notasArray = Object.values(est.notas) as number[];
                                        }
                                      }

                                      return {
                                        numero: est.numero,
                                        codigo: est.codigo || '',
                                        tipo: est.tipo || 'G',
                                        apellidoPaterno: est.apellido_paterno || est.apellidoPaterno || '',
                                        apellidoMaterno: est.apellido_materno || est.apellidoMaterno || '',
                                        nombres: est.nombres || '',
                                        nombreCompleto,
                                        sexo: est.sexo || 'M',
                                        notas: est.notas || [],
                                        notasArray, // Array para visualización
                                        comportamiento: est.comportamiento || '',
                                        asignaturasDesaprobadas: est.asignaturasDesaprobadas || est.asignaturas_desaprobadas || 0,
                                        situacionFinal: est.situacionFinal || est.situacion_final || 'P',
                                        observaciones: est.observaciones || '',
                                      };
                                    }),
                                    metadataActa: {
                                      anioLectivo: acta.aniolectivo?.anio || 0,
                                      grado: acta.grado?.nombre || 'N/A',
                                      seccion: acta.seccion || 'N/A',
                                      turno: acta.turno || 'N/A',
                                      tipoEvaluacion: acta.tipoevaluacion || 'N/A',
                                      colegioOrigen: acta.colegio_origen || 'Sin especificar',
                                      areas: datosOCR.metadata?.areas_detectadas?.map((nombre: string, index: number) => ({
                                        posicion: index + 1,
                                        nombre,
                                        codigo: nombre.substring(0, 3).toUpperCase()
                                      })) || []
                                    },
                                    confianza: datosOCR.metadata?.confianza_promedio || 95,
                                    advertencias: datosOCR.metadata?.advertencias || [],
                                    procesadoCon: datosOCR.metadata?.modelo_ia || 'Gemini',
                                    tiempoProcesamientoMs: 0
                                  };
                                  
                                  navigate('/editor/revisar-ocr-libre', { state: { resultadoOCR, acta } });
                                }}
                                title="Ver datos extraídos"
                              >
                                <Brain className="h-4 w-4 text-purple-600" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedActa(acta); setShowDetailDialog(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedActa(acta); setShowEditDialog(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedActa(acta); setShowDeleteDialog(true); }}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {pagination.totalPages} ({pagination.total} registros)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Crear/Subir Acta */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Acta Física</DialogTitle>
            <DialogDescription>
              Registra un acta física en formato PDF o imagen para procesarla con OCR
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Año Lectivo */}
            <div className="space-y-2">
              <Label htmlFor="anio">Año Lectivo *</Label>
              <Select value={createAnioLectivoId} onValueChange={setCreateAnioLectivoId}>
                <SelectTrigger id="anio">
                  <SelectValue placeholder="Seleccionar año lectivo" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {aniosLectivos.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No hay años lectivos disponibles
                    </div>
                  ) : (
                    [...aniosLectivos]
                      .sort((a, b) => b.anio - a.anio)
                      .map((anio: AnioLectivo) => (
                        <SelectItem key={anio.id} value={anio.id}>
                          {anio.anio}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Grado y Sección */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grado">Grado *</Label>
                <Select value={createGradoId} onValueChange={setCreateGradoId}>
                  <SelectTrigger id="grado">
                    <SelectValue placeholder="Seleccionar grado" />
                  </SelectTrigger>
                  <SelectContent>
                    {grados.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No hay grados disponibles
                      </div>
                    ) : (
                      grados.map((grado: Grado) => (
                        <SelectItem key={grado.id} value={grado.id}>
                          {grado.nombre} {grado.niveleducativo ? `(${grado.niveleducativo.nombre})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {grados.length} grado(s) disponible(s)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seccion">Sección *</Label>
                <Input 
                  id="seccion" 
                  value={createSeccion}
                  onChange={(e) => setCreateSeccion(e.target.value)}
                  placeholder="Ej: A" 
                  maxLength={10}
                />
              </div>
            </div>

            {/* Libro y Folio */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="libro">Libro</Label>
                <Select value={createLibroId} onValueChange={setCreateLibroId}>
                  <SelectTrigger id="libro">
                    <SelectValue placeholder="Seleccionar libro" />
                  </SelectTrigger>
                  <SelectContent>
                    {libros.map((libro) => (
                      <SelectItem key={libro.id} value={libro.id}>
                        {libro.codigo} - {libro.descripcion || 'Sin descripción'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="folio">Folio</Label>
                <Input 
                  id="folio" 
                  value={createFolio}
                  onChange={(e) => setCreateFolio(e.target.value)}
                  placeholder="Ej: 45, 123" 
                  maxLength={50} 
                />
              </div>
            </div>

            {/* Turno */}
            <div className="space-y-2">
              <Label htmlFor="turno">Turno *</Label>
              <Select value={createTurno} onValueChange={setCreateTurno}>
                <SelectTrigger id="turno">
                  <SelectValue placeholder="Seleccionar turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAÑANA">Mañana</SelectItem>
                  <SelectItem value="TARDE">Tarde</SelectItem>
                  <SelectItem value="NOCHE">Noche</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo Evaluación */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Evaluación *</Label>
              <Select value={createTipoEvaluacion} onValueChange={setCreateTipoEvaluacion}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FINAL">Final</SelectItem>
                  <SelectItem value="RECUPERACION">Recuperación</SelectItem>
                  <SelectItem value="SUBSANACION">Subsanación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estado Físico - ELIMINADO porque no existe en la BD */}

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Input 
                id="observaciones"
                value={createObservaciones}
                onChange={(e) => setCreateObservaciones(e.target.value)}
                placeholder="Comentarios adicionales (opcional)" 
              />
            </div>

            <Separator />

            {/* Archivo */}
            <div className="space-y-2">
              <Label htmlFor="archivo">Archivo Escaneado (PDF o Imagen)</Label>
              <Input id="archivo" type="file" accept=".pdf,image/*" />
              <p className="text-xs text-muted-foreground">
                Formatos soportados: PDF, JPG, PNG. Tamaño máximo: 10MB. El archivo se procesará automáticamente con OCR.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
              disabled={createActaMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateActa}
              disabled={createActaMutation.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              {createActaMutation.isPending ? 'Subiendo...' : 'Subir Acta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Ver Detalles */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Acta Física</DialogTitle>
            <DialogDescription>
              Información completa del acta - Año {selectedActa?.aniolectivo?.anio || 'N/A'}
            </DialogDescription>
          </DialogHeader>
          {selectedActa && (
            <div className="space-y-4 py-4">
              {/* Información Básica */}
              <div>
                <h3 className="font-semibold mb-3">Información Básica</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Número de Acta</Label>
                    <p className="font-medium">{selectedActa.numero || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Año Lectivo</Label>
                    <p className="font-medium">{selectedActa.aniolectivo?.anio || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Grado</Label>
                    <p className="font-medium">{selectedActa.grado?.nombre || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Sección</Label>
                    <p className="font-medium">{selectedActa.seccion || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Turno</Label>
                    <p className="font-medium">{selectedActa.turno || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tipo de Evaluación</Label>
                    <Badge variant="secondary">{selectedActa.tipoevaluacion || selectedActa.tipo || 'N/A'}</Badge>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Colegio de Origen</Label>
                    <p className="font-medium text-sm">{selectedActa.colegiorigen || 'No especificado'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Estado y Procesamiento */}
              <div>
                <h3 className="font-semibold mb-3">Estado y Procesamiento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Estado del Acta</Label>
                    <div className="mt-1">{getEstadoBadge(selectedActa.estado)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estado OCR</Label>
                    <div className="mt-1">{getEstadoOCRBadge(selectedActa.procesadoconia)}</div>
                  </div>
                  {selectedActa.fechaprocesamiento && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Fecha de Procesamiento</Label>
                      <p className="font-medium text-sm">
                        {format(new Date(selectedActa.fechaprocesamiento), 'PPP', { locale: es })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Datos Extraídos por OCR/IA */}
              {selectedActa.datosextraidosjson && (() => {
                const datosOCR = typeof selectedActa.datosextraidosjson === 'string'
                  ? JSON.parse(selectedActa.datosextraidosjson)
                  : selectedActa.datosextraidosjson;
                
                return (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      Datos Extraídos por IA
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      {datosOCR.estudiantes && (
                        <div>
                          <Label className="text-muted-foreground">Estudiantes Detectados</Label>
                          <p className="font-bold text-lg text-blue-600">
                            {datosOCR.estudiantes.length}
                          </p>
                        </div>
                      )}
                      {datosOCR.confianza && (
                        <div>
                          <Label className="text-muted-foreground">Confianza de la IA</Label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${datosOCR.confianza}%` }}
                              />
                            </div>
                            <span className="font-bold text-sm">
                              {datosOCR.confianza}%
                            </span>
                          </div>
                        </div>
                      )}
                      {datosOCR.procesadoCon && (
                        <div>
                          <Label className="text-muted-foreground">Procesado con</Label>
                          <Badge variant="outline" className="mt-1">
                            {datosOCR.procesadoCon}
                          </Badge>
                        </div>
                      )}
                      {datosOCR.metadataActa && datosOCR.metadataActa.areas && (
                        <div className="mt-3 pt-3 border-t">
                          <Label className="text-muted-foreground block mb-2">Áreas Curriculares</Label>
                          <div className="flex flex-wrap gap-1">
                            {datosOCR.metadataActa.areas.map((area: any, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {area.nombre || area.codigo}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
                );
              })()}

              <Separator />

              {/* Libro y Folio */}
              <div>
                <h3 className="font-semibold mb-3">Libro y Folio</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Libro</Label>
                    <p className="font-medium font-mono">{selectedActa.libro?.codigo || 'N/A'} - {selectedActa.libro?.descripcion || ''}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Folio</Label>
                    <p className="font-medium font-mono">{selectedActa.folio || 'No especificado'}</p>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {selectedActa.observaciones && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Observaciones</Label>
                    <p className="text-sm mt-1">{selectedActa.observaciones}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Información de Auditoría */}
              <div>
                <h3 className="font-semibold mb-3">Información del Sistema</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Fecha de Subida</Label>
                    <p className="font-medium">
                      {selectedActa.fechasubida
                        ? format(new Date(selectedActa.fechasubida), 'PPP', { locale: es })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Subido Por</Label>
                    <p className="font-medium">
                      {selectedActa.usuario
                        ? `${selectedActa.usuario.nombres} ${selectedActa.usuario.apellidos}`
                        : 'Sistema'}
                    </p>
                  </div>
                  {selectedActa.fechaactualizacion && (
                    <div>
                      <Label className="text-muted-foreground">Última Actualización</Label>
                      <p className="font-medium">
                        {format(new Date(selectedActa.fechaactualizacion), 'PPP', { locale: es })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Archivo */}
              {selectedActa.urlarchivo && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Archivo Escaneado</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedActa.urlarchivo, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Archivo
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {selectedActa.nombrearchivo || 'archivo.pdf'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDetailDialog(false);
                setSelectedActa(null);
              }}
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setShowDetailDialog(false);
                setShowEditDialog(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Acta */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Acta Física</DialogTitle>
            <DialogDescription>
              Modifica los datos del acta - Año {selectedActa?.aniolectivo?.anio || 'N/A'}
            </DialogDescription>
          </DialogHeader>
          {selectedActa && (
            <div className="space-y-4 py-4">
              {/* Año Lectivo */}
              <div className="space-y-2">
                <Label htmlFor="edit-anio">Año Lectivo</Label>
                <Select value={editAnioLectivoId} onValueChange={setEditAnioLectivoId}>
                  <SelectTrigger id="edit-anio">
                    <SelectValue placeholder="Seleccionar año lectivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {aniosLectivos.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No hay años lectivos disponibles
                      </div>
                    ) : (
                      aniosLectivos.map((anio: AnioLectivo) => (
                        <SelectItem key={anio.id} value={anio.id}>
                          {anio.anio}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Grado y Sección */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-grado">Grado</Label>
                  <Select value={editGradoId} onValueChange={setEditGradoId}>
                    <SelectTrigger id="edit-grado">
                      <SelectValue placeholder="Seleccionar grado" />
                    </SelectTrigger>
                    <SelectContent>
                      {grados.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No hay grados disponibles
                        </div>
                      ) : (
                        grados.map((grado: Grado) => (
                          <SelectItem key={grado.id} value={grado.id}>
                            {grado.nombre} {grado.niveleducativo ? `(${grado.niveleducativo.nombre})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-seccion">Sección</Label>
                  <Input 
                    id="edit-seccion" 
                    value={editSeccion}
                    onChange={(e) => setEditSeccion(e.target.value)}
                    placeholder="Ej: A" 
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Libro y Folio */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-libro">Libro</Label>
                  <Select value={editLibroId} onValueChange={setEditLibroId}>
                    <SelectTrigger id="edit-libro">
                      <SelectValue placeholder="Seleccionar libro" />
                    </SelectTrigger>
                    <SelectContent>
                      {libros.map((libro) => (
                        <SelectItem key={libro.id} value={libro.id}>
                          {libro.codigo} - {libro.descripcion || 'Sin descripción'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-folio">Folio</Label>
                  <Input 
                    id="edit-folio" 
                    value={editFolio} 
                    onChange={(e) => setEditFolio(e.target.value)}
                    placeholder="Ej: 45, 123" 
                    maxLength={50}
                  />
                </div>
              </div>

              {/* Turno */}
              <div className="space-y-2">
                <Label htmlFor="edit-turno">Turno</Label>
                <Select value={editTurno} onValueChange={setEditTurno}>
                  <SelectTrigger id="edit-turno">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAÑANA">Mañana</SelectItem>
                    <SelectItem value="TARDE">Tarde</SelectItem>
                    <SelectItem value="NOCHE">Noche</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo Evaluación */}
              <div className="space-y-2">
                <Label htmlFor="edit-tipo">Tipo de Evaluación</Label>
                <Select value={editTipoEvaluacion} onValueChange={setEditTipoEvaluacion}>
                  <SelectTrigger id="edit-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FINAL">Final</SelectItem>
                    <SelectItem value="RECUPERACION">Recuperación</SelectItem>
                    <SelectItem value="SUBSANACION">Subsanación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label htmlFor="edit-observaciones">Observaciones</Label>
                <Input 
                  id="edit-observaciones" 
                  value={editObservaciones} 
                  onChange={(e) => setEditObservaciones(e.target.value)}
                  placeholder="Comentarios adicionales" 
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedActa(null);
              }}
              disabled={updateActaMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateActa}
              disabled={updateActaMutation.isPending}
            >
              {updateActaMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Eliminación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente el acta del sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="space-y-2">
                <p className="font-semibold">
                  ¿Estás seguro de eliminar esta acta?
                </p>
                {selectedActa && (
                  <div className="space-y-1 text-sm">
                    <p><strong>Número:</strong> {selectedActa.numero}</p>
                    <p><strong>Año:</strong> {selectedActa.aniolectivo?.anio || 'N/A'}</p>
                    <p><strong>Grado:</strong> {selectedActa.grado?.nombre}</p>
                    <p><strong>Nivel:</strong> {selectedActa.grado?.niveleducativo?.nombre || 'N/A'}</p>
                    <p><strong>Libro:</strong> {selectedActa.libro?.codigo} - {selectedActa.libro?.descripcion}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-3">
                  Esta acción es permanente y no se puede deshacer. 
                  El archivo PDF y todos los datos procesados serán eliminados.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedActa(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedActa) {
                  deleteMutation.mutate(selectedActa.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Acta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

