/**
 * Componente ValidadorNotasOCR
 * Muestra errores, advertencias y estadísticas de validación de datos OCR
 * Actualización en tiempo real durante la edición
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  TrendingUp,
  Users,
  FileText,
  Target,
} from 'lucide-react';
import type {
  ResultadoValidacionOCR,
  ErrorValidacionOCR,
  AdvertenciaValidacionOCR,
} from '@/types/normalizacion.types';
import { cn } from '@/lib/utils';

interface ValidadorNotasOCRProps {
  validacion?: ResultadoValidacionOCR;
  isLoading?: boolean;
  className?: string;
}

export function ValidadorNotasOCR({
  validacion,
  isLoading,
  className,
}: ValidadorNotasOCRProps) {
  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Validación de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Validando datos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validacion) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Validación de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-muted-foreground">
              No hay datos para validar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { valido, errores, advertencias, estadisticas } = validacion;

  // Calcular progreso de calidad
  const calcularCalidadDatos = () => {
    const {
      total_estudiantes,
      estudiantes_con_dni,
      total_notas,
      notas_faltantes,
      areas_mapeadas,
      areas_detectadas,
    } = estadisticas;

    let puntos = 0;
    let maxPuntos = 0;

    // DNIs completos (30%)
    if (total_estudiantes > 0) {
      puntos += (estudiantes_con_dni / total_estudiantes) * 30;
      maxPuntos += 30;
    }

    // Notas completas (30%)
    if (total_notas > 0) {
      puntos += ((total_notas - notas_faltantes) / total_notas) * 30;
      maxPuntos += 30;
    }

    // Áreas mapeadas (40%)
    if (areas_detectadas > 0) {
      puntos += (areas_mapeadas / areas_detectadas) * 40;
      maxPuntos += 40;
    }

    return maxPuntos > 0 ? Math.round((puntos / maxPuntos) * 100) : 0;
  };

  const calidadDatos = calcularCalidadDatos();

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Validación de Datos
          </CardTitle>
          <Badge
            variant={valido ? 'default' : 'destructive'}
            className={cn(
              'font-semibold',
              valido &&
                'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            )}
          >
            {valido ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Válido
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Con errores
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Estadísticas Generales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Estudiantes
            </p>
            <p className="text-2xl font-bold">{estadisticas.total_estudiantes}</p>
            <p className="text-xs text-muted-foreground">
              {estadisticas.estudiantes_con_dni} con DNI
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Notas
            </p>
            <p className="text-2xl font-bold">{estadisticas.total_notas}</p>
            <p className="text-xs text-muted-foreground">
              {estadisticas.notas_faltantes} faltantes
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Áreas
            </p>
            <p className="text-2xl font-bold">{estadisticas.areas_detectadas}</p>
            <p className="text-xs text-muted-foreground">
              {estadisticas.areas_mapeadas} mapeadas
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Calidad
            </p>
            <p className="text-2xl font-bold">{calidadDatos}%</p>
            <p className="text-xs text-muted-foreground">de los datos</p>
          </div>
        </div>

        {/* Barra de Progreso de Calidad */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Calidad de los datos</span>
            <span className="font-medium">{calidadDatos}%</span>
          </div>
          <Progress
            value={calidadDatos}
            className={cn(
              'h-2',
              calidadDatos >= 80 && 'bg-green-200 dark:bg-green-900/20',
              calidadDatos >= 50 &&
                calidadDatos < 80 &&
                'bg-yellow-200 dark:bg-yellow-900/20',
              calidadDatos < 50 && 'bg-red-200 dark:bg-red-900/20'
            )}
          />
        </div>

        <Separator />

        {/* Errores */}
        {errores.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <h4 className="font-semibold text-sm">
                Errores ({errores.length})
              </h4>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {errores.map((error, index) => (
                <ErrorItem key={index} error={error} />
              ))}
            </div>
          </div>
        )}

        {/* Advertencias */}
        {advertencias.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <h4 className="font-semibold text-sm">
                Advertencias ({advertencias.length})
              </h4>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {advertencias.map((advertencia, index) => (
                <AdvertenciaItem key={index} advertencia={advertencia} />
              ))}
            </div>
          </div>
        )}

        {/* Sin problemas */}
        {errores.length === 0 && advertencias.length === 0 && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Datos válidos</AlertTitle>
            <AlertDescription>
              Todos los datos han sido validados correctamente. Puede proceder a
              normalizar el acta.
            </AlertDescription>
          </Alert>
        )}

        {/* Información de mapeo de áreas */}
        {validacion.mapeoAreas &&
          validacion.mapeoAreas.areasNoMapeadas.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Áreas no mapeadas</AlertTitle>
              <AlertDescription className="mt-2 space-y-1">
                <p className="text-sm">
                  Las siguientes áreas no pudieron ser mapeadas automáticamente:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {validacion.mapeoAreas.areasNoMapeadas.map((area, index) => (
                    <li key={index} className="text-muted-foreground">
                      {area}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  Se requerirá mapeo manual en la tabla de estudiantes.
                </p>
              </AlertDescription>
            </Alert>
          )}
      </CardContent>
    </Card>
  );
}

// Componente para mostrar un error individual
function ErrorItem({ error }: { error: ErrorValidacionOCR }) {
  return (
    <Alert variant="destructive" className="py-2">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">
            {error.estudiante.nombre || `Estudiante #${error.estudiante.numero}`}
            {error.area && ` - ${error.area}`}
          </p>
          <Badge variant="outline" className="text-xs">
            {error.tipo.replace(/_/g, ' ')}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{error.detalle}</p>
        {error.sugerencia && (
          <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            {error.sugerencia}
          </p>
        )}
      </div>
    </Alert>
  );
}

// Componente para mostrar una advertencia individual
function AdvertenciaItem({
  advertencia,
}: {
  advertencia: AdvertenciaValidacionOCR;
}) {
  // Protección contra datos undefined
  const nombreEstudiante = advertencia?.estudiante?.nombre || `Estudiante #${advertencia?.estudiante?.numero || '?'}`;
  const area = advertencia?.area;
  const tipo = advertencia?.tipo || 'ADVERTENCIA';
  const detalle = advertencia?.detalle || 'Sin detalles';

  return (
    <Alert className="py-2 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">
            {nombreEstudiante}
            {area && ` - ${area}`}
          </p>
          <Badge variant="outline" className="text-xs bg-yellow-100">
            {tipo.replace(/_/g, ' ')}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{detalle}</p>
      </div>
    </Alert>
  );
}
