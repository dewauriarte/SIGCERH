/**
 * Componente ConsolidadoNotasCard
 * Muestra el consolidado de notas de un estudiante organizadas por año/grado
 * Para vista previa de certificado y consultas
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Calendar,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  XCircle,
  FileText,
  BookOpen,
} from 'lucide-react';
import type {
  ConsolidadoNotasCertificado,
  PeriodoAcademico,
} from '@/types/normalizacion.types';
import { cn } from '@/lib/utils';

interface ConsolidadoNotasCardProps {
  consolidado: ConsolidadoNotasCertificado;
  className?: string;
  mostrarDetalles?: boolean;
}

export function ConsolidadoNotasCard({
  consolidado,
  className,
  mostrarDetalles = true,
}: ConsolidadoNotasCardProps) {
  const { estudiante, periodos, estadisticas } = consolidado;

  // Calcular promedio de un período
  const calcularPromedio = (periodo: PeriodoAcademico): number | null => {
    const notasValidas = periodo.notas.filter(
      (n) => n.nota !== null && n.nota !== undefined && !n.esExonerado
    );

    if (notasValidas.length === 0) return null;

    const suma = notasValidas.reduce((acc, n) => acc + (n.nota || 0), 0);
    return Math.round((suma / notasValidas.length) * 100) / 100;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="space-y-4">
          {/* Header del estudiante */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">Consolidado de Notas</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">{estudiante.nombreCompleto}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>DNI: {estudiante.dni}</span>
              </div>
            </div>
          </div>

          {/* Estadísticas generales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Período
              </p>
              <p className="text-lg font-bold">
                {estadisticas.anio_inicio}
                {estadisticas.anio_inicio !== estadisticas.anio_fin &&
                  ` - ${estadisticas.anio_fin}`}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                Grados
              </p>
              <p className="text-lg font-bold">
                {estadisticas.grados_cursados.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {estadisticas.grados_cursados.join(', ')}°
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Promedio General
              </p>
              <p className="text-lg font-bold">
                {estadisticas.promedio_general?.toFixed(2) || 'N/A'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Notas
              </p>
              <p className="text-lg font-bold">{estadisticas.total_notas}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-0.5 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {estadisticas.notas_aprobadas}
                </span>
                <span className="flex items-center gap-0.5 text-red-600">
                  <XCircle className="h-3 w-3" />
                  {estadisticas.notas_desaprobadas}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lista de períodos académicos */}
        {mostrarDetalles ? (
          <Accordion type="multiple" className="w-full">
            {periodos.map((periodo, index) => (
              <AccordionItem key={index} value={`periodo-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-semibold">{periodo.anio}</span>
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        <span>{periodo.grado.nombre}</span>
                      </div>
                      {periodo.nivel && (
                        <>
                          <Separator orientation="vertical" className="h-4" />
                          <span className="text-sm text-muted-foreground">
                            {periodo.nivel.nombre}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {periodo.situacionFinal && (
                        <Badge
                          variant={
                            periodo.situacionFinal.includes('APROBADO')
                              ? 'default'
                              : 'destructive'
                          }
                          className={cn(
                            periodo.situacionFinal.includes('APROBADO') &&
                              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          )}
                        >
                          {periodo.situacionFinal}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        Promedio: {calcularPromedio(periodo)?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {/* Info del acta */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground px-4">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>Acta: {periodo.acta.numero}</span>
                      </div>
                      {periodo.acta.folio && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <span>Folio: {periodo.acta.folio}</span>
                        </>
                      )}
                      {periodo.acta.libro && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            <span>Libro: {typeof periodo.acta.libro === 'object' ? periodo.acta.libro.codigo : periodo.acta.libro}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Tabla de notas */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Área Curricular</TableHead>
                          <TableHead className="text-center w-24">Nota</TableHead>
                          <TableHead className="text-center w-32">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {periodo.notas
                          .sort((a, b) => a.area.orden - b.area.orden)
                          .map((nota, notaIndex) => (
                            <TableRow key={notaIndex}>
                              <TableCell className="text-muted-foreground">
                                {nota.area.orden}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span>{nota.area.nombre}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {nota.area.codigo}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-medium">
                                {nota.esExonerado ? (
                                  <Badge variant="outline">Exonerado</Badge>
                                ) : (
                                  <span
                                    className={cn(
                                      typeof nota.nota === 'number' &&
                                        nota.nota >= 11 &&
                                        'text-green-600',
                                      typeof nota.nota === 'number' &&
                                        nota.nota < 11 &&
                                        'text-red-600'
                                    )}
                                  >
                                    {nota.nota ?? nota.notaLiteral ?? 'N/A'}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {nota.esExonerado ? (
                                  <Badge variant="outline">-</Badge>
                                ) : typeof nota.nota === 'number' ? (
                                  nota.nota >= 11 ? (
                                    <Badge className="bg-green-100 text-green-800">
                                      Aprobado
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive">
                                      Desaprobado
                                    </Badge>
                                  )
                                ) : (
                                  <Badge variant="outline">-</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>

                    {/* Resumen del período */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total áreas:</span>
                          <span className="ml-2 font-semibold">
                            {periodo.notas.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Aprobadas:</span>
                          <span className="ml-2 font-semibold text-green-600">
                            {
                              periodo.notas.filter(
                                (n) =>
                                  typeof n.nota === 'number' &&
                                  n.nota >= 11 &&
                                  !n.esExonerado
                              ).length
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Desaprobadas:</span>
                          <span className="ml-2 font-semibold text-red-600">
                            {
                              periodo.notas.filter(
                                (n) =>
                                  typeof n.nota === 'number' &&
                                  n.nota < 11 &&
                                  !n.esExonerado
                              ).length
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          // Vista resumida (sin detalles)
          <div className="space-y-2">
            {periodos.map((periodo, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{periodo.anio}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-muted-foreground">
                    {periodo.grado.nombre}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {periodo.situacionFinal && (
                    <Badge
                      variant={
                        periodo.situacionFinal.includes('APROBADO')
                          ? 'default'
                          : 'destructive'
                      }
                      className={cn(
                        periodo.situacionFinal.includes('APROBADO') &&
                          'bg-green-100 text-green-800'
                      )}
                    >
                      {periodo.situacionFinal}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {periodo.notas.length} áreas
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
