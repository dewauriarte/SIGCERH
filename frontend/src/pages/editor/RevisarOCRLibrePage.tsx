/**
 * Página para Revisar Resultados de OCR Libre
 * Muestra los datos extraídos por Gemini y permite editar/exportar
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Download, Edit, Users, FileText, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EditarEstudianteOCRDialog } from '@/components/editor/EditarEstudianteOCRDialog';
import { editorService, type EstudianteOCR, type ResultadoOCR } from '@/services/editor.service';

export default function RevisarOCRLibrePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const resultadoOCRInicial = location.state?.resultadoOCR;

  const [resultadoOCR, setResultadoOCR] = useState<ResultadoOCR>(resultadoOCRInicial);
  const [estudiantesEditados, setEstudiantesEditados] = useState<Set<number>>(new Set());
  const [estudianteEditando, setEstudianteEditando] = useState<EstudianteOCR | null>(null);
  const [indiceEditando, setIndiceEditando] = useState<number>(-1);

  // Si no hay totalEstudiantes, calcularlo desde el array
  if (resultadoOCR && !resultadoOCR.totalEstudiantes) {
    resultadoOCR.totalEstudiantes = resultadoOCR.estudiantes?.length || 0;
  }

  if (!resultadoOCR) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            No hay datos de OCR para revisar. Por favor, procesa un acta primero.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/editor/procesar-ocr')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Procesar OCR
        </Button>
      </div>
    );
  }

  // Mutation para guardar en BD
  const guardarMutation = useMutation({
    mutationFn: async () => {
      // Preparar datos para el backend
      const datosParaGuardar = {
        estudiantes: resultadoOCR.estudiantes,
        metadataActa: resultadoOCR.metadataActa,
        confianza: resultadoOCR.confianza,
        procesadoPor: resultadoOCR.procesadoPor,
      };
      
      return editorService.guardarOCRLibre(datosParaGuardar);
    },
    onSuccess: () => {
      toast.success('✅ Datos guardados correctamente en actaFisica');
      // Redirigir a Actas Físicas
      setTimeout(() => {
        navigate('/editor/actas-fisicas');
      }, 1000);
    },
    onError: (error: any) => {
      console.error('Error al guardar:', error);
      toast.error(`Error al guardar: ${error.response?.data?.message || error.message}`);
    },
  });

  const exportarJSON = () => {
    const dataStr = JSON.stringify(resultadoOCR, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `acta_${resultadoOCR.metadataActa.anioLectivo}_${resultadoOCR.metadataActa.grado}_${resultadoOCR.metadataActa.seccion}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exportado a JSON correctamente');
  };

  const exportarCSV = () => {
    // Crear encabezados CSV
    const headers = ['Nº', 'Apellidos y Nombres', 'Sexo', 'Tipo', 'Comportamiento', 'Situación Final', 'Observaciones'];
    const areas = resultadoOCR.metadataActa?.areas || [];
    areas.forEach((area: any) => headers.push(area.nombre));
    
    // Crear filas CSV
    const rows = resultadoOCR.estudiantes.map(est => {
      const row = [
        est.numero,
        `"${est.apellidoPaterno} ${est.apellidoMaterno}, ${est.nombres}"`,
        est.sexo,
        est.tipo,
        est.comportamiento || '-',
        est.situacionFinal,
        `"${est.observaciones || '-'}"`,
      ];
      // Agregar notas
      (Array.isArray(est.notas) ? est.notas : []).forEach((nota: number) => row.push(nota !== null ? nota.toString() : '-'));
      return row.join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    // Agregar BOM UTF-8 para que Excel reconozca tildes y ñ correctamente
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `acta_${resultadoOCR.metadataActa.anioLectivo}_${resultadoOCR.metadataActa.grado}_${resultadoOCR.metadataActa.seccion}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exportado a CSV correctamente');
  };

  const exportarExcel = () => {
    // Crear contenido HTML de tabla para Excel con codificación UTF-8
    const areas = resultadoOCR.metadataActa?.areas || [];
    let html = '<html><head><meta charset="utf-8"></head><body>';
    html += '<table border="1"><thead><tr>';
    html += '<th>Nº</th><th>Apellidos y Nombres</th><th>Sexo</th><th>Tipo</th><th>Comportamiento</th>';
    areas.forEach((area: any) => html += `<th>${area.nombre}</th>`);
    html += '<th>Situación Final</th><th>Observaciones</th></tr></thead><tbody>';
    
    resultadoOCR.estudiantes.forEach(est => {
      html += '<tr>';
      html += `<td>${est.numero}</td>`;
      html += `<td>${est.apellidoPaterno} ${est.apellidoMaterno}, ${est.nombres}</td>`;
      html += `<td>${est.sexo}</td>`;
      html += `<td>${est.tipo}</td>`;
      html += `<td>${est.comportamiento || '-'}</td>`;
      (Array.isArray(est.notas) ? est.notas : []).forEach((nota: number) => html += `<td>${nota !== null ? nota : '-'}</td>`);
      html += `<td>${est.situacionFinal}</td>`;
      html += `<td>${est.observaciones || '-'}</td>`;
      html += '</tr>';
    });
    html += '</tbody></table></body></html>';
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `acta_${resultadoOCR.metadataActa.anioLectivo}_${resultadoOCR.metadataActa.grado}_${resultadoOCR.metadataActa.seccion}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exportado a Excel correctamente');
  };

  const handleEditarEstudiante = (estudiante: EstudianteOCR, indice: number) => {
    // ✅ Convertir notas a array si es objeto (para el modal de edición)
    const estudianteParaEditar = {
      ...estudiante,
      notas: Array.isArray(estudiante.notas)
        ? estudiante.notas
        : estudiante.notasArray || Object.values(estudiante.notas || {}),
    };

    setEstudianteEditando(estudianteParaEditar);
    setIndiceEditando(indice);
  };

  const handleGuardarEstudiante = (estudianteEditado: EstudianteOCR) => {
    // ✅ Sincronizar campos necesarios para visualización
    const estudianteCompleto = {
      ...estudianteEditado,
      // Reconstruir nombreCompleto con los datos actualizados
      nombreCompleto: [
        estudianteEditado.apellidoPaterno || '',
        estudianteEditado.apellidoMaterno || '',
        estudianteEditado.nombres || ''
      ].filter(Boolean).join(' ').trim() || 'Sin nombre',
      // Sincronizar notasArray con notas (para visualización)
      notasArray: Array.isArray(estudianteEditado.notas)
        ? estudianteEditado.notas
        : Object.values(estudianteEditado.notas || {}),
    };

    // Actualizar el estudiante en el resultado OCR
    const nuevosEstudiantes = [...resultadoOCR.estudiantes];
    nuevosEstudiantes[indiceEditando] = estudianteCompleto;

    setResultadoOCR({
      ...resultadoOCR,
      estudiantes: nuevosEstudiantes,
    });

    // Marcar como editado
    setEstudiantesEditados(prev => new Set(prev).add(indiceEditando));

    // Cerrar modal
    setEstudianteEditando(null);
    setIndiceEditando(-1);
  };

  const handleGuardar = () => {
    guardarMutation.mutate();
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => navigate('/editor/procesar-ocr')} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              Resultados del OCR
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Revisa y edita los datos extraídos por Gemini AI
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={exportarJSON} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Exportar JSON</span>
              <span className="sm:hidden">JSON</span>
            </Button>
            <Button variant="outline" onClick={exportarCSV} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button variant="outline" onClick={exportarExcel} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Excel</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <div className="text-3xl font-bold text-purple-600">
                {resultadoOCR.totalEstudiantes}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Estudiantes Detectados</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Brain className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-3xl font-bold text-green-600">
                {resultadoOCR.confianza}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">Confianza IA</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-3xl font-bold text-blue-600">
                {(resultadoOCR.metadataActa as any)?.areas?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Áreas Curriculares</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Edit className="h-8 w-8 mx-auto text-orange-600 mb-2" />
              <div className="text-3xl font-bold text-orange-600">
                {estudiantesEditados.size}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Registros Editados</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información del Acta - Arriba ahora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información del Acta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Año Lectivo</div>
              <div className="text-lg font-semibold">
                {resultadoOCR.metadataActa?.anioLectivo || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Grado</div>
              <div className="text-lg font-semibold">
                {resultadoOCR.metadataActa?.grado || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Sección</div>
              <div className="text-lg font-semibold">
                {resultadoOCR.metadataActa?.seccion || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Turno</div>
              <div className="text-lg font-semibold">
                {resultadoOCR.metadataActa?.turno || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Tipo de Evaluación</div>
              <div className="text-lg font-semibold">
                {resultadoOCR.metadataActa?.tipoEvaluacion || 'N/A'}
              </div>
            </div>
            <div className="col-span-2 md:col-span-5">
              <div className="text-sm font-medium text-muted-foreground mb-2">Colegio de Origen</div>
              <div className="text-base font-medium">
                {resultadoOCR.metadataActa?.colegioOrigen || 'Sin especificar'}
              </div>
            </div>
            {(resultadoOCR.metadataActa as any)?.areas && (resultadoOCR.metadataActa as any).areas.length > 0 && (
              <div className="col-span-2 md:col-span-5">
                <div className="text-sm font-medium text-muted-foreground mb-2">Áreas Curriculares</div>
                <div className="flex flex-wrap gap-1">
                  {(resultadoOCR.metadataActa as any).areas.map((area: any, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {area.nombre || area.codigo}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advertencias */}
      {resultadoOCR.advertencias && resultadoOCR.advertencias.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="text-base text-yellow-800 dark:text-yellow-200">
              ⚠️ Advertencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              {resultadoOCR.advertencias.map((adv: string, idx: number) => (
                <li key={idx} className="text-yellow-700 dark:text-yellow-300">
                  • {adv}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Estudiantes Detectados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estudiantes Detectados ({resultadoOCR.totalEstudiantes})
          </CardTitle>
          <CardDescription>
            Haz clic en "Editar" para corregir los datos de un estudiante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {resultadoOCR.estudiantes?.map((est: any, idx: number) => {
                const promovido = est.situacionFinal === 'P';
                const aprobado = est.situacionFinal === 'A';
                const editado = estudiantesEditados.has(idx);

                return (
                  <Card
                    key={idx}
                    className={`transition-all ${
                      editado ? 'border-blue-300 dark:border-blue-700' : ''
                    }`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        {/* Información del estudiante */}
                        <div className="flex-1 space-y-2 sm:space-y-3">
                          {/* Primera fila: Número, Nombre y Badge de estado */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="font-mono text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1 shrink-0">
                                #{est.numero}
                              </Badge>
                              <span className="font-semibold text-sm sm:text-base break-words">
                                {est.nombreCompleto || 'Sin nombre'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge 
                                variant={promovido ? 'default' : aprobado ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {promovido ? 'PROMOVIDO' : aprobado ? 'APROBADO' : 'REPROBADO'}
                              </Badge>
                              {editado && (
                                <Badge variant="secondary" className="text-xs">
                                  Editado
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Segunda fila: Datos personales - responsive grid */}
                          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Sexo:</span>
                              <span className="text-foreground">{est.sexo ? (est.sexo === 'M' ? 'M' : 'F') : '-'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Tipo:</span>
                              <span className="text-foreground">{est.tipo || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Comp:</span>
                              <span className="font-semibold text-foreground">{est.comportamiento || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Desap:</span>
                              <span className={`font-semibold ${est.asignaturasDesaprobadas > 0 ? 'text-red-600' : 'text-foreground'}`}>
                                {est.asignaturasDesaprobadas ?? 0}
                              </span>
                            </div>
                          </div>

                          {/* Tercera fila: Notas en línea horizontal compacta */}
                          {((est.notasArray && est.notasArray.length > 0) || (est.notas && typeof est.notas === 'object' && Object.keys(est.notas).length > 0)) && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground mr-2">Notas:</span>
                              <div className="inline-flex flex-wrap gap-1">
                                {(() => {
                                  // Usar notasArray si existe, sino convertir notas objeto a array
                                  const notasParaMostrar = est.notasArray || 
                                    (typeof est.notas === 'object' && !Array.isArray(est.notas)
                                      ? Object.values(est.notas)
                                      : est.notas || []);
                                  
                                  return notasParaMostrar.map((nota: number | null, nIdx: number) => (
                                    <Badge
                                      key={nIdx}
                                      variant="outline"
                                      className={`text-xs px-2 ${
                                        nota === null || nota === undefined
                                          ? 'text-gray-400 border-gray-300'
                                          : nota < 11
                                          ? 'text-red-600 border-red-300'
                                          : 'text-green-600 border-green-300'
                                      }`}
                                    >
                                      {nota ?? '-'}
                                    </Badge>
                                  ));
                                })()}
                              </div>
                            </div>
                          )}

                          {/* Observaciones debajo de Notas - siempre mostrar */}
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">Obs:</span>
                            <span className="text-xs text-muted-foreground italic block break-words">
                              {est.observaciones || '-'}
                            </span>
                          </div>
                        </div>

                        {/* Botón Editar - full width en móvil */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditarEstudiante(est, idx)}
                          className="w-full sm:w-auto sm:shrink-0"
                        >
                          <Edit className="h-4 w-4 sm:mr-0 mr-2" />
                          <span className="sm:hidden">Editar</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Resumen y Acciones Finales */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-lg">¿Los datos son correctos?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Revisa todos los estudiantes antes de guardar en la base de datos
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/editor/actas-fisicas')} 
                className="w-full sm:w-auto"
                disabled={guardarMutation.isPending}
              >
                Cancelar
              </Button>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => navigate('/editor/procesar-ocr')} className="w-full sm:w-auto">
                  Procesar Otra Acta
                </Button>
                <Button 
                  onClick={handleGuardar} 
                  size="lg"
                  disabled={guardarMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  <span className="hidden sm:inline">{guardarMutation.isPending ? 'Guardando...' : 'Guardar en Base de Datos'}</span>
                  <span className="sm:hidden">{guardarMutation.isPending ? 'Guardando...' : 'Guardar en BD'}</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edición */}
      {estudianteEditando && (
        <EditarEstudianteOCRDialog
          open={!!estudianteEditando}
          onOpenChange={(open) => {
            if (!open) {
              setEstudianteEditando(null);
              setIndiceEditando(-1);
            }
          }}
          estudiante={estudianteEditando}
          onGuardar={handleGuardarEstudiante}
        />
      )}
    </div>
  );
}

