/**
 * Página ActasEstudiantePage
 * Vista de todas las actas normalizadas de un estudiante
 * Consolidado de notas por año/grado y timeline académico
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  FileText,
  Calendar,
  GraduationCap,
  User,
  Download,
  Loader2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { ConsolidadoNotasCard } from '@/components/estudiantes/ConsolidadoNotasCard';
import { normalizacionService } from '@/services/normalizacion.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ActasEstudiantePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Query: Obtener consolidado de notas
  const {
    data: consolidadoResponse,
    isLoading: isLoadingConsolidado,
    error: errorConsolidado,
  } = useQuery({
    queryKey: ['consolidado-notas', id],
    queryFn: () => normalizacionService.getNotasConsolidadas(id!),
    enabled: !!id,
  });

  const consolidado = consolidadoResponse?.data;

  // Query: Obtener actas del estudiante
  const {
    data: actasResponse,
    isLoading: isLoadingActas,
    error: errorActas,
  } = useQuery({
    queryKey: ['actas-estudiante', id],
    queryFn: () => normalizacionService.getActasEstudiante(id!),
    enabled: !!id,
  });

  const actas = actasResponse?.data || [];

  // Loading state
  if (isLoadingConsolidado || isLoadingActas) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando datos del estudiante...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (errorConsolidado || errorActas || !consolidado) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Error al cargar datos</h2>
          <p className="text-muted-foreground">
            {(errorConsolidado as any)?.message ||
              (errorActas as any)?.message ||
              'No se encontraron datos del estudiante'}
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const { estudiante } = consolidado;

  const handleGenerarCertificado = () => {
    // TODO: Implementar generación de certificado
    alert('Función de generación de certificado en desarrollo');
  };

  const handleExportarPDF = () => {
    // TODO: Implementar exportación a PDF
    alert('Función de exportación a PDF en desarrollo');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold">Actas del Estudiante</h1>
          </div>
          <p className="text-muted-foreground">
            Histórico académico y consolidado de notas
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportarPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={handleGenerarCertificado}>
            <FileText className="h-4 w-4 mr-2" />
            Generar Certificado
          </Button>
        </div>
      </div>

      {/* Info del Estudiante */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Información del Estudiante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nombre Completo</p>
              <p className="font-semibold text-lg">{estudiante.nombreCompleto}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">DNI</p>
              <p className="font-semibold text-lg">{estudiante.dni}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Actas Registradas</p>
              <p className="font-semibold text-lg">{actas.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline de Actas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline de Actas Académicas ({actas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actas.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                No se encontraron actas normalizadas para este estudiante
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {actas.map((acta: any, index: number) => (
                <div key={acta.id} className="relative">
                  {/* Línea vertical del timeline (excepto el último) */}
                  {index < actas.length - 1 && (
                    <div className="absolute left-[15px] top-[40px] bottom-[-16px] w-[2px] bg-border" />
                  )}

                  {/* Card del acta */}
                  <div className="flex gap-4">
                    {/* Indicador circular */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative z-10">
                        <span className="text-xs font-bold text-primary-foreground">
                          {acta.grado.numero}°
                        </span>
                      </div>
                    </div>

                    {/* Contenido */}
                    <Card className="flex-1">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          {/* Header del acta */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">
                                  {acta.anioLectivo.anio}
                                </span>
                                <Separator orientation="vertical" className="h-4" />
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {acta.grado.nombre}
                                </span>
                                {acta.nivel && (
                                  <>
                                    <Separator orientation="vertical" className="h-4" />
                                    <span className="text-sm text-muted-foreground">
                                      {acta.nivel.nombre}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="h-3 w-3" />
                                <span>Acta: {acta.acta.numero}</span>
                                {acta.acta.folio && (
                                  <>
                                    <Separator orientation="vertical" className="h-3" />
                                    <span>Folio: {acta.acta.folio}</span>
                                  </>
                                )}
                                {acta.libro && (
                                  <>
                                    <Separator orientation="vertical" className="h-3" />
                                    <BookOpen className="h-3 w-3" />
                                    <span>{typeof acta.libro === 'object' ? acta.libro.codigo : acta.libro}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {acta.situacionFinal && (
                              <Badge
                                variant={
                                  acta.situacionFinal.includes('APROBADO')
                                    ? 'default'
                                    : 'destructive'
                                }
                                className={cn(
                                  acta.situacionFinal.includes('APROBADO') &&
                                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                )}
                              >
                                {acta.situacionFinal}
                              </Badge>
                            )}
                          </div>

                          <Separator />

                          {/* Resumen de notas */}
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Total Áreas
                              </p>
                              <p className="text-lg font-semibold">
                                {acta.notas.length}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Promedio
                              </p>
                              <p className="text-lg font-semibold">
                                {(() => {
                                  const notasValidas = acta.notas.filter(
                                    (n: any) => typeof n.nota === 'number' && !n.esExonerado
                                  );
                                  if (notasValidas.length === 0) return 'N/A';
                                  const suma = notasValidas.reduce(
                                    (acc: number, n: any) => acc + n.nota,
                                    0
                                  );
                                  return (suma / notasValidas.length).toFixed(2);
                                })()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Registro
                              </p>
                              <p className="text-sm font-medium">
                                {format(
                                  new Date(acta.fechaRegistro),
                                  "dd MMM yyyy",
                                  { locale: es }
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Observaciones */}
                          {acta.observaciones && (
                            <div className="bg-muted/50 rounded p-2">
                              <p className="text-xs text-muted-foreground">
                                Observaciones:
                              </p>
                              <p className="text-sm">{acta.observaciones}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consolidado de Notas */}
      {consolidado && (
        <ConsolidadoNotasCard
          consolidado={consolidado}
          mostrarDetalles={true}
        />
      )}
    </div>
  );
}
