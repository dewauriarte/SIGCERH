/**
 * Página de Historial Académico del Estudiante
 * Muestra todas las actas agrupadas por grado con opción de completar DNI
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { estudianteService } from '@/services/estudiante.service';
import { certificadoService, type CertificadoGenerado } from '@/services/certificado.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ArrowLeft, BookOpen, CheckCircle, Edit, FileText, User, XCircle, Award, Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function HistorialAcademicoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados para el diálogo de actualizar DNI
  const [showDNIDialog, setShowDNIDialog] = useState(false);
  const [nuevoDNI, setNuevoDNI] = useState('');
  const [fusionarDuplicado, setFusionarDuplicado] = useState(false);

  // Estados para el diálogo de generar certificado
  const [showCertificadoDialog, setShowCertificadoDialog] = useState(false);
  const [lugarEmision, setLugarEmision] = useState('PUNO');
  const [observaciones, setObservaciones] = useState('');
  const [certificadoGenerado, setCertificadoGenerado] = useState<CertificadoGenerado | null>(null);
  const [showResultadoDialog, setShowResultadoDialog] = useState(false);

  // Query para obtener las actas del estudiante
  const { data, isLoading, error } = useQuery({
    queryKey: ['estudiante-actas', id],
    queryFn: () => estudianteService.getActasParaCertificado(id!),
    enabled: !!id,
  });

  // Mutation para actualizar DNI
  const updateDNIMutation = useMutation({
    mutationFn: ({ nuevoDNI, fusionar }: { nuevoDNI: string; fusionar: boolean }) =>
      estudianteService.actualizarDNI(id!, { nuevoDNI, fusionarDuplicado: fusionar }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estudiante-actas', id] });
      setShowDNIDialog(false);
      setNuevoDNI('');
      setFusionarDuplicado(false);
      toast.success('DNI actualizado exitosamente', { duration: 3000 });
    },
    onError: (error: unknown) => {
      console.error('Error al actualizar DNI:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Error al actualizar DNI';
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  // Mutation para generar certificado
  const generarCertificadoMutation = useMutation({
    mutationFn: () => certificadoService.generar({
      estudianteId: id!,
      lugarEmision,
      generarPDF: true,
      observaciones: observaciones ? { otros: observaciones } : undefined,
    }),
    onSuccess: (response) => {
      setCertificadoGenerado(response.data);
      setShowCertificadoDialog(false);
      setShowResultadoDialog(true);
      toast.success('Certificado generado exitosamente', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['estudiante-actas', id] });
    },
    onError: (error: unknown) => {
      console.error('Error al generar certificado:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Error al generar certificado';
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const handleActualizarDNI = () => {
    if (!nuevoDNI.trim()) {
      toast.error('Debe ingresar un DNI válido');
      return;
    }

    if (!/^\d{8}$/.test(nuevoDNI)) {
      toast.error('El DNI debe tener exactamente 8 dígitos numéricos');
      return;
    }

    updateDNIMutation.mutate({ nuevoDNI, fusionar: fusionarDuplicado });
  };

  const handleGenerarCertificado = () => {
    if (!lugarEmision.trim()) {
      toast.error('Debe ingresar el lugar de emisión');
      return;
    }

    generarCertificadoMutation.mutate();
  };

  const handleDescargarPDF = async () => {
    if (!certificadoGenerado?.certificado?.id) return;

    try {
      const blob = await certificadoService.descargar(certificadoGenerado.certificado.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificado_${certificadoGenerado.codigoVirtual}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Certificado descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando historial académico...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Error al cargar datos
            </CardTitle>
            <CardDescription>
              No se pudo cargar el historial académico del estudiante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/admin/estudiantes')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Estudiantes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const actasData = data.data;
  const { estudiante, actas_por_grado, grados_completos, grados_faltantes, puede_generar_certificado } = actasData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/estudiantes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              Historial Académico
            </h1>
            <p className="text-muted-foreground mt-1">{estudiante.nombre_completo}</p>
          </div>
        </div>

        {/* Botón Generar Certificado */}
        {puede_generar_certificado && (
          <Button
            size="lg"
            onClick={() => setShowCertificadoDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Award className="h-5 w-5 mr-2" />
            Generar Certificado
          </Button>
        )}
      </div>

      {/* Información del Estudiante */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información del Estudiante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">DNI</Label>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-lg font-mono font-medium">{estudiante.dni}</p>
                {estudiante.tiene_dni_temporal && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    Temporal
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Nombre Completo</Label>
              <p className="text-lg font-medium mt-1">{estudiante.nombre_completo}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Estado de Certificación</Label>
              <div className="flex items-center gap-2 mt-1">
                {puede_generar_certificado ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Puede generar certificado
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Faltan grados
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {estudiante.tiene_dni_temporal && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900">DNI Temporal Detectado</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Este estudiante tiene un DNI temporal. Se recomienda completar el DNI real para generar certificados oficiales.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDNIDialog(true)}
                    className="mt-3 border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Completar DNI Real
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen de Grados */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Grados</CardTitle>
          <CardDescription>
            Total de actas encontradas: {Object.keys(actas_por_grado).length} de 5 grados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((grado) => {
              const tieneActa = grados_completos.includes(grado);
              const actaGrado = actas_por_grado[grado.toString()];
              return (
                <div
                  key={grado}
                  className={`p-4 rounded-lg border-2 text-center ${
                    tieneActa
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="text-2xl font-bold">{grado}°</div>
                  <div className="text-xs mt-1">
                    {tieneActa ? (
                      <span className="text-green-700 font-medium">Completo</span>
                    ) : (
                      <span className="text-gray-500">Faltante</span>
                    )}
                  </div>
                  {tieneActa && actaGrado && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Promedio: {actaGrado.promedio.toFixed(1)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actas por Grado */}
      {Object.entries(actas_por_grado)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([grado, acta]) => (
          <Card key={grado}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {acta.grado}
                  </CardTitle>
                  <CardDescription>
                    Año Académico: {acta.anio_lectivo} | Promedio: {acta.promedio.toFixed(2)}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {acta.notas.length} áreas
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Área Curricular</TableHead>
                    <TableHead className="text-right">Calificación</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acta.notas
                    .sort((a, b) => (a.area || '').localeCompare(b.area || ''))
                    .map((nota, index) => (
                      <TableRow key={`${nota.codigo_area}-${index}`}>
                        <TableCell className="font-medium">
                          {nota.area}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono font-bold text-lg">
                            {nota.nota !== null ? nota.nota : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {nota.nota !== null && nota.nota >= 11 ? (
                            <Badge variant="default" className="bg-green-600">Aprobado</Badge>
                          ) : nota.nota !== null ? (
                            <Badge variant="destructive">Desaprobado</Badge>
                          ) : (
                            <Badge variant="outline">Sin nota</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <div className="mt-4 p-3 bg-gray-50 rounded-md flex items-center justify-between">
                <span className="font-medium">Promedio del Grado:</span>
                <span className="text-2xl font-bold text-blue-600">{acta.promedio.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        ))}

      {/* Grados Faltantes */}
      {grados_faltantes.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Grados Faltantes
            </CardTitle>
            <CardDescription>
              No se encontraron actas para los siguientes grados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {grados_faltantes.map((grado) => (
                <Badge key={grado} variant="outline" className="text-yellow-700 border-yellow-400">
                  {grado}° Grado
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Para generar un certificado completo, es necesario tener las actas de todos los grados (1° a 5°).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Diálogo para Actualizar DNI */}
      <Dialog open={showDNIDialog} onOpenChange={setShowDNIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completar DNI Real</DialogTitle>
            <DialogDescription>
              Ingrese el DNI real del estudiante {estudiante.nombre_completo}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dni-actual">DNI Actual (Temporal)</Label>
              <Input
                id="dni-actual"
                value={estudiante.dni}
                disabled
                className="font-mono bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dni-nuevo">Nuevo DNI (8 dígitos)</Label>
              <Input
                id="dni-nuevo"
                value={nuevoDNI}
                onChange={(e) => setNuevoDNI(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="12345678"
                maxLength={8}
                className="font-mono"
              />
              {nuevoDNI && !/^\d{8}$/.test(nuevoDNI) && (
                <p className="text-sm text-red-600">El DNI debe tener exactamente 8 dígitos</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fusionar"
                checked={fusionarDuplicado}
                onCheckedChange={(checked) => setFusionarDuplicado(checked as boolean)}
              />
              <Label htmlFor="fusionar" className="text-sm cursor-pointer">
                Fusionar con estudiante existente si el DNI ya existe
              </Label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Si marca la opción de fusionar y ya existe un estudiante con este DNI,
                todas las actas del estudiante temporal se vincularán al estudiante con DNI real.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDNIDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleActualizarDNI}
              disabled={!nuevoDNI || !/^\d{8}$/.test(nuevoDNI) || updateDNIMutation.isPending}
            >
              {updateDNIMutation.isPending ? 'Actualizando...' : 'Actualizar DNI'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Generar Certificado */}
      <Dialog open={showCertificadoDialog} onOpenChange={setShowCertificadoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-green-600" />
              Generar Certificado de Estudios
            </DialogTitle>
            <DialogDescription>
              Se generará un certificado oficial en formato PDF con todas las actas del estudiante
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Resumen del estudiante */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm text-gray-700">Datos del Estudiante</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nombre:</span>
                  <p className="font-medium">{estudiante.nombre_completo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">DNI:</span>
                  <p className="font-medium font-mono">{estudiante.dni}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Grados completos:</span>
                  <p className="font-medium">{grados_completos.join(', ')}° Grado</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total actas:</span>
                  <p className="font-medium">{Object.keys(actas_por_grado).length}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Configuración del certificado */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lugar-emision">Lugar de Emisión *</Label>
                <Input
                  id="lugar-emision"
                  value={lugarEmision}
                  onChange={(e) => setLugarEmision(e.target.value)}
                  placeholder="PUNO"
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Ciudad o localidad donde se emite el certificado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
                <Textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ingrese observaciones adicionales para el certificado..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            {estudiante.tiene_dni_temporal && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">DNI Temporal Detectado</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      El certificado se generará con el DNI temporal. Se recomienda completar
                      el DNI real antes de la emisión oficial.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCertificadoDialog(false)}
              disabled={generarCertificadoMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerarCertificado}
              disabled={!lugarEmision.trim() || generarCertificadoMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {generarCertificadoMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generando...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Generar Certificado
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Resultado */}
      <Dialog open={showResultadoDialog} onOpenChange={setShowResultadoDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Certificado Generado Exitosamente
            </DialogTitle>
            <DialogDescription>
              El certificado ha sido generado correctamente y está listo para descargar
            </DialogDescription>
          </DialogHeader>

          {certificadoGenerado && (
            <div className="space-y-6 py-4">
              {/* Información del certificado */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-sm">Código Virtual</h4>
                  </div>
                  <p className="text-2xl font-bold font-mono text-blue-600">
                    {certificadoGenerado.codigoVirtual}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Código único de verificación
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-sm">Promedio General</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {certificadoGenerado.promedio.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {certificadoGenerado.certificado.situacionfinal}
                  </p>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-3">Estadísticas del Certificado</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Grados Procesados</p>
                    <p className="text-lg font-bold">{certificadoGenerado.gradosProcesados}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total de Notas</p>
                    <p className="text-lg font-bold">{certificadoGenerado.totalNotas}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <Badge className="bg-green-600">{certificadoGenerado.estado}</Badge>
                  </div>
                </div>
              </div>

              {/* Información del PDF */}
              {certificadoGenerado.pdf && (
                <div className="border-t pt-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">PDF Generado</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Hash SHA-256: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{certificadoGenerado.pdf.hashPdf.substring(0, 16)}...</code>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Acciones */}
              <div className="space-y-3">
                <Button
                  onClick={handleDescargarPDF}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Descargar Certificado PDF
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResultadoDialog(false);
                      setCertificadoGenerado(null);
                    }}
                  >
                    Cerrar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/admin/estudiantes')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a Estudiantes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
