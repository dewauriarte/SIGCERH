/**
 * Página NormalizarActasPage
 * Lista de actas procesadas con OCR pendientes de normalizar
 * Filtros por estado, año lectivo, grado y estadísticas
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  TrendingUp,
  Users,
  Database,
  Eye,
  Edit,
  Loader2,
} from 'lucide-react';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { actaService } from '@/services/acta.service';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NormalizarActasPage() {
  const navigate = useNavigate();

  const [filtros, setFiltros] = useState({
    buscar: '',
    estadoNormalizacion: 'todos', // todos | pendientes | normalizadas
    anioLectivo: 'todos',
    page: 1,
    limit: 20,
  });

  // Query: Obtener actas
  const { data: actasResponse, isLoading } = useQuery({
    queryKey: ['actas-normalizacion', filtros],
    queryFn: () =>
      actaService.getActas({
        page: filtros.page,
        limit: filtros.limit,
        procesadoconia: true, // Solo actas procesadas con OCR
        ...(filtros.anioLectivo !== 'todos' && { anioLectivo: Number(filtros.anioLectivo) }),
      }),
  });

  const actas = actasResponse?.data || [];
  const pagination = actasResponse?.pagination;

  // Helper: Validar si el acta tiene datos OCR válidos
  const tieneOCRValido = (acta: any): boolean => {
    if (!acta.datosextraidosjson) return false;
    if (!acta.datosextraidosjson.estudiantes) return false;
    if (!Array.isArray(acta.datosextraidosjson.estudiantes)) return false;
    if (acta.datosextraidosjson.estudiantes.length === 0) return false;
    return true;
  };

  // Filtrar actas con OCR válido
  const actasConOCRValido = actas.filter((acta: any) => tieneOCRValido(acta));
  const actasSinOCRValido = actas.filter((acta: any) => !tieneOCRValido(acta));

  // Calcular estadísticas locales (solo actas con OCR válido)
  const calcularEstadisticas = () => {
    const total = actasConOCRValido.length;
    const normalizadas = actasConOCRValido.filter((a: any) => a.normalizada).length;
    const pendientes = total - normalizadas;

    return {
      total,
      normalizadas,
      pendientes,
      porcentajeCompletado: total > 0 ? Math.round((normalizadas / total) * 100) : 0,
    };
  };

  const stats = calcularEstadisticas();

  // Filtrar actas localmente (solo las que tienen OCR válido)
  const actasFiltradas = actasConOCRValido.filter((acta: any) => {
    // Filtro de búsqueda
    if (filtros.buscar) {
      const searchTerm = filtros.buscar.toLowerCase();
      const matchNumero = acta.numero?.toLowerCase().includes(searchTerm);
      const matchLibro = acta.libro?.toLowerCase().includes(searchTerm);
      if (!matchNumero && !matchLibro) return false;
    }

    // Filtro de estado de normalización
    if (filtros.estadoNormalizacion === 'pendientes' && acta.normalizada) {
      return false;
    }
    if (filtros.estadoNormalizacion === 'normalizadas' && !acta.normalizada) {
      return false;
    }

    return true;
  });

  const handleVerActa = (actaId: string) => {
    navigate(`/editor/normalizar-actas/${actaId}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          Normalizar Actas
        </h1>
        <p className="text-muted-foreground">
          Valide y normalice datos extraídos por OCR para generar certificados
        </p>
      </div>

      {/* Alerta: Actas sin OCR válido */}
      {actasSinOCRValido.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-3 flex-1">
                <div>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                    ⚠️ {actasSinOCRValido.length} acta{actasSinOCRValido.length !== 1 ? 's' : ''} con problemas de OCR
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    {actasSinOCRValido.length === 1 ? 'Esta acta está marcada' : 'Estas actas están marcadas'} como procesada
                    {actasSinOCRValido.length !== 1 ? 's' : ''} pero {actasSinOCRValido.length === 1 ? 'no tiene' : 'no tienen'} datos JSON válidos.
                    {actasSinOCRValido.length === 1 ? ' Necesita' : ' Necesitan'} ser reprocesada{actasSinOCRValido.length !== 1 ? 's' : ''} con OCR.
                  </p>
                </div>

                {/* Lista de actas afectadas */}
                <details className="text-sm">
                  <summary className="cursor-pointer text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 font-medium">
                    Ver actas afectadas ({actasSinOCRValido.length})
                  </summary>
                  <div className="mt-2 pl-4 space-y-1">
                    {actasSinOCRValido.slice(0, 10).map((acta: any) => (
                      <div key={acta.id} className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        <span className="font-mono text-xs">{acta.numero}</span>
                        {acta.aniolectivo && (
                          <span className="text-xs">- {acta.aniolectivo.anio}</span>
                        )}
                        {acta.grado && (
                          <span className="text-xs">- {acta.grado.nombre}</span>
                        )}
                      </div>
                    ))}
                    {actasSinOCRValido.length > 10 && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 italic">
                        ... y {actasSinOCRValido.length - 10} más
                      </p>
                    )}
                  </div>
                </details>

                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate('/editor/procesar-ocr')}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Procesar Actas con OCR
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Total Procesadas
              </p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Pendientes
              </p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.pendientes}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Normalizadas
              </p>
              <p className="text-3xl font-bold text-green-600">
                {stats.normalizadas}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Progreso
              </p>
              <p className="text-3xl font-bold">{stats.porcentajeCompletado}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número de acta, libro..."
                  value={filtros.buscar}
                  onChange={(e) =>
                    setFiltros({ ...filtros, buscar: e.target.value })
                  }
                  className="pl-9"
                />
              </div>
            </div>

            {/* Estado de Normalización */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select
                value={filtros.estadoNormalizacion}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, estadoNormalizacion: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="pendientes">Pendientes</SelectItem>
                  <SelectItem value="normalizadas">Normalizadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Año Lectivo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Año Lectivo</label>
              <Select
                value={filtros.anioLectivo}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, anioLectivo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los años" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los años</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Actas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Actas Procesadas ({actasFiltradas.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : actasFiltradas.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-2">
                <p className="text-lg font-semibold">No hay actas listas para normalizar</p>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {actasSinOCRValido.length > 0
                    ? `Las ${actasSinOCRValido.length} actas marcadas como procesadas necesitan ser reprocesadas con OCR.`
                    : 'No se encontraron actas procesadas con OCR. Procese primero algunas actas desde "Procesar OCR".'}
                </p>
              </div>
              <Button
                onClick={() => navigate('/editor/procesar-ocr')}
                className="mx-auto"
              >
                Ir a Procesar OCR
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Año Lectivo</TableHead>
                    <TableHead>Grado</TableHead>
                    <TableHead>Libro/Folio</TableHead>
                    <TableHead className="text-center">Estudiantes</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead>Fecha Procesamiento</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actasFiltradas.map((acta: any) => (
                    <TableRow key={acta.id}>
                      <TableCell className="font-medium">{acta.numero}</TableCell>

                      <TableCell>{acta.aniolectivo?.anio || 'N/A'}</TableCell>

                      <TableCell>{acta.grado?.nombre || 'N/A'}</TableCell>

                      <TableCell>
                        {acta.libro && acta.folio ? (
                          <span>
                            {typeof acta.libro === 'object' ? acta.libro.codigo : acta.libro} / {acta.folio}
                          </span>
                        ) : acta.libro ? (
                          <span>{typeof acta.libro === 'object' ? acta.libro.codigo : acta.libro}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" />
                          {acta.datosextraidosjson?.estudiantes?.length || 0}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        {acta.normalizada ? (
                          <Badge className="bg-green-100 text-green-800 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Normalizada
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {acta.fechaprocesamiento ? (
                          <span className="text-sm text-muted-foreground">
                            {format(
                              new Date(acta.fechaprocesamiento),
                              "dd 'de' MMM, yyyy",
                              { locale: es }
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {acta.normalizada ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleVerActa(acta.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleVerActa(acta.id)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Validar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} -{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} actas
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setFiltros({ ...filtros, page: filtros.page - 1 })
                  }
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setFiltros({ ...filtros, page: filtros.page + 1 })
                  }
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
