/**
 * Componente TablaEstudiantesOCR
 * Tabla editable de estudiantes extraídos por OCR con sus notas
 * Permite correcciones inline antes de normalizar
 */

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Save,
  X,
  Trash2,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import type {
  EstudianteOCRExtraccion,
  MapeoAreaCurricular,
} from '@/types/normalizacion.types';
import { cn } from '@/lib/utils';

interface TablaEstudiantesOCRProps {
  estudiantes: EstudianteOCRExtraccion[];
  areasDetectadas: string[];
  mapeoAreas?: MapeoAreaCurricular[];
  onEstudiantesChange?: (estudiantes: EstudianteOCRExtraccion[]) => void;
  readOnly?: boolean;
  className?: string;
}

export function TablaEstudiantesOCR({
  estudiantes,
  areasDetectadas,
  mapeoAreas = [],
  onEstudiantesChange,
  readOnly = false,
  className,
}: TablaEstudiantesOCRProps) {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<EstudianteOCRExtraccion | null>(
    null
  );

  // Iniciar edición de una fila
  const handleEdit = (index: number) => {
    setEditingRow(index);
    setEditingData({ ...estudiantes[index] });
  };

  // Cancelar edición
  const handleCancel = () => {
    setEditingRow(null);
    setEditingData(null);
  };

  // Guardar cambios
  const handleSave = () => {
    if (editingRow !== null && editingData && onEstudiantesChange) {
      const newEstudiantes = [...estudiantes];
      newEstudiantes[editingRow] = editingData;
      onEstudiantesChange(newEstudiantes);
      setEditingRow(null);
      setEditingData(null);
    }
  };

  // Eliminar estudiante
  const handleDelete = (index: number) => {
    if (onEstudiantesChange) {
      const newEstudiantes = estudiantes.filter((_, i) => i !== index);
      onEstudiantesChange(newEstudiantes);
    }
  };

  // Agregar nuevo estudiante
  const handleAdd = () => {
    if (onEstudiantesChange) {
      const nuevoEstudiante: EstudianteOCRExtraccion = {
        numero: estudiantes.length + 1,
        apellidoPaterno: '',
        apellidoMaterno: '',
        nombres: '',
        notas: {},
      };
      onEstudiantesChange([...estudiantes, nuevoEstudiante]);
      setEditingRow(estudiantes.length);
      setEditingData(nuevoEstudiante);
    }
  };

  // Actualizar campo de estudiante en edición
  const updateEditingField = (field: keyof EstudianteOCRExtraccion, value: any) => {
    if (editingData) {
      setEditingData({
        ...editingData,
        [field]: value,
      });
    }
  };

  // Actualizar nota en edición
  const updateEditingNota = (area: string, valor: string) => {
    if (editingData) {
      const valorProcesado = valor === '' ? null : isNaN(Number(valor)) ? valor : Number(valor);
      setEditingData({
        ...editingData,
        notas: {
          ...editingData.notas,
          [area]: valorProcesado,
        },
      });
    }
  };

  // Obtener info de mapeo de un área
  const getMapeoInfo = (area: string): MapeoAreaCurricular | undefined => {
    return mapeoAreas.find((m) => m.nombre_ocr === area);
  };

  // Validar nota
  const validarNota = (valor: any): 'valido' | 'invalido' | 'advertencia' => {
    if (valor === null || valor === undefined || valor === '') return 'advertencia';
    if (typeof valor === 'number') {
      return valor >= 0 && valor <= 20 ? 'valido' : 'invalido';
    }
    // Notas literales (AD, A, B, C)
    return ['AD', 'A', 'B', 'C'].includes(String(valor).toUpperCase())
      ? 'valido'
      : 'advertencia';
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {estudiantes.length} estudiante{estudiantes.length !== 1 ? 's' : ''}
          </div>
          <Button onClick={handleAdd} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Estudiante
          </Button>
        </div>
      )}

      {/* Tabla */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-24">DNI</TableHead>
              <TableHead className="min-w-[150px]">Apellido Paterno</TableHead>
              <TableHead className="min-w-[150px]">Apellido Materno</TableHead>
              <TableHead className="min-w-[150px]">Nombres</TableHead>
              <TableHead className="w-16">Sexo</TableHead>

              {/* Columnas dinámicas de áreas */}
              {areasDetectadas.map((area) => {
                const mapeo = getMapeoInfo(area);
                return (
                  <TableHead key={area} className="w-24 text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs truncate max-w-[80px]">
                              {area}
                            </span>
                            {mapeo && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] px-1 py-0',
                                  mapeo.metodo === 'exacto' &&
                                    'bg-green-100 text-green-800',
                                  mapeo.metodo === 'aproximado' &&
                                    'bg-yellow-100 text-yellow-800',
                                  mapeo.metodo === 'manual' &&
                                    'bg-blue-100 text-blue-800'
                                )}
                              >
                                {mapeo.metodo === 'exacto' && '✓'}
                                {mapeo.metodo === 'aproximado' && '~'}
                                {mapeo.metodo === 'manual' && '✎'}
                              </Badge>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-semibold">{area}</p>
                            {mapeo && (
                              <>
                                <p className="text-xs">
                                  Mapeado a: {mapeo.area_nombre}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Método: {mapeo.metodo} (
                                  {mapeo.confianza}% confianza)
                                </p>
                              </>
                            )}
                            {!mapeo && (
                              <p className="text-xs text-destructive">
                                No mapeado
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                );
              })}

              <TableHead className="w-32">Situación Final</TableHead>
              {!readOnly && <TableHead className="w-24 text-center">Acciones</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {estudiantes.map((estudiante, index) => {
              const isEditing = editingRow === index;
              const currentData = isEditing ? editingData! : estudiante;

              return (
                <TableRow key={index} className={cn(isEditing && 'bg-muted/50')}>
                  {/* Número */}
                  <TableCell className="font-medium">{estudiante.numero}</TableCell>

                  {/* DNI */}
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={currentData.dni || ''}
                        onChange={(e) => updateEditingField('dni', e.target.value)}
                        placeholder="DNI"
                        className="h-8 text-sm"
                        maxLength={8}
                      />
                    ) : (
                      <span className={cn(!estudiante.dni && 'text-muted-foreground')}>
                        {estudiante.dni || 'Sin DNI'}
                      </span>
                    )}
                  </TableCell>

                  {/* Apellido Paterno */}
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={currentData.apellidoPaterno}
                        onChange={(e) =>
                          updateEditingField('apellidoPaterno', e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    ) : (
                      estudiante.apellidoPaterno
                    )}
                  </TableCell>

                  {/* Apellido Materno */}
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={currentData.apellidoMaterno}
                        onChange={(e) =>
                          updateEditingField('apellidoMaterno', e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    ) : (
                      estudiante.apellidoMaterno
                    )}
                  </TableCell>

                  {/* Nombres */}
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={currentData.nombres}
                        onChange={(e) =>
                          updateEditingField('nombres', e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    ) : (
                      estudiante.nombres
                    )}
                  </TableCell>

                  {/* Sexo */}
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={currentData.sexo || ''}
                        onChange={(e) => updateEditingField('sexo', e.target.value)}
                        placeholder="M/H"
                        className="h-8 text-sm text-center"
                        maxLength={1}
                      />
                    ) : (
                      estudiante.sexo
                    )}
                  </TableCell>

                  {/* Notas (columnas dinámicas) */}
                  {areasDetectadas.map((area) => {
                    const nota = estudiante.notas[area];
                    const estadoValidacion = validarNota(nota);

                    return (
                      <TableCell key={area} className="text-center">
                        {isEditing ? (
                          <Input
                            value={
                              currentData.notas[area] === null ||
                              currentData.notas[area] === undefined
                                ? ''
                                : currentData.notas[area]
                            }
                            onChange={(e) => updateEditingNota(area, e.target.value)}
                            placeholder="0-20"
                            className="h-8 text-sm text-center"
                          />
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <span
                              className={cn(
                                estadoValidacion === 'invalido' && 'text-destructive',
                                estadoValidacion === 'advertencia' &&
                                  'text-muted-foreground'
                              )}
                            >
                              {nota ?? '-'}
                            </span>
                            {estadoValidacion === 'invalido' && (
                              <AlertCircle className="h-3 w-3 text-destructive" />
                            )}
                            {estadoValidacion === 'advertencia' && nota && (
                              <AlertTriangle className="h-3 w-3 text-yellow-600" />
                            )}
                            {estadoValidacion === 'valido' && (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                        )}
                      </TableCell>
                    );
                  })}

                  {/* Situación Final */}
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={currentData.situacionFinal || ''}
                        onChange={(e) =>
                          updateEditingField('situacionFinal', e.target.value)
                        }
                        placeholder="APROBADO"
                        className="h-8 text-sm"
                      />
                    ) : (
                      estudiante.situacionFinal
                    )}
                  </TableCell>

                  {/* Acciones */}
                  {!readOnly && (
                    <TableCell>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSave}
                            className="h-8 w-8 p-0"
                          >
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Leyenda de badges de mapeo */}
      {mapeoAreas.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Mapeo de áreas:</span>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              ✓
            </Badge>
            <span>Exacto</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              ~
            </Badge>
            <span>Aproximado</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              ✎
            </Badge>
            <span>Manual</span>
          </div>
        </div>
      )}
    </div>
  );
}
