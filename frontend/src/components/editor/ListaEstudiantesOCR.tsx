/**
 * Componente ListaEstudiantesOCR
 * Lista de tarjetas compactas con estudiantes extraídos por OCR
 * Diseño responsivo optimizado para móviles y tablets
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  Edit2,
  Trash2,
  Plus,
  AlertTriangle,
  User,
  Hash,
  Award,
} from 'lucide-react';
import type {
  EstudianteOCRExtraccion,
  MapeoAreaCurricular,
} from '@/types/normalizacion.types';
import { cn } from '@/lib/utils';

interface ListaEstudiantesOCRProps {
  estudiantes: EstudianteOCRExtraccion[];
  areasDetectadas: string[];
  mapeoAreas?: MapeoAreaCurricular[];
  onEstudiantesChange?: (estudiantes: EstudianteOCRExtraccion[]) => void;
  readOnly?: boolean;
  className?: string;
}

export function ListaEstudiantesOCR({
  estudiantes,
  areasDetectadas,
  mapeoAreas = [],
  onEstudiantesChange,
  readOnly = false,
  className,
}: ListaEstudiantesOCRProps) {
  const [estudianteEditando, setEstudianteEditando] = useState<EstudianteOCRExtraccion | null>(null);
  const [indiceEditando, setIndiceEditando] = useState<number>(-1);

  // Abrir diálogo de edición
  const handleEdit = (estudiante: EstudianteOCRExtraccion, index: number) => {
    setEstudianteEditando({ ...estudiante });
    setIndiceEditando(index);
  };

  // Guardar cambios
  const handleSave = () => {
    if (indiceEditando !== -1 && estudianteEditando && onEstudiantesChange) {
      const nuevosEstudiantes = [...estudiantes];
      nuevosEstudiantes[indiceEditando] = estudianteEditando;
      onEstudiantesChange(nuevosEstudiantes);
      setEstudianteEditando(null);
      setIndiceEditando(-1);
    }
  };

  // Cancelar edición
  const handleCancel = () => {
    setEstudianteEditando(null);
    setIndiceEditando(-1);
  };

  // Eliminar estudiante
  const handleDelete = (index: number) => {
    if (onEstudiantesChange) {
      const nuevosEstudiantes = estudiantes.filter((_, i) => i !== index);
      onEstudiantesChange(nuevosEstudiantes);
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
        sexo: 'M',
        situacionFinal: 'A',
        notas: {},
      };
      onEstudiantesChange([...estudiantes, nuevoEstudiante]);
      setEstudianteEditando(nuevoEstudiante);
      setIndiceEditando(estudiantes.length);
    }
  };

  // Actualizar campo
  const updateField = (field: keyof EstudianteOCRExtraccion, value: any) => {
    if (estudianteEditando) {
      setEstudianteEditando({
        ...estudianteEditando,
        [field]: value,
      });
    }
  };

  // Actualizar nota
  const updateNota = (area: string, valor: string) => {
    if (estudianteEditando) {
      const valorProcesado = valor === '' ? null : isNaN(Number(valor)) ? valor : Number(valor);
      setEstudianteEditando({
        ...estudianteEditando,
        notas: {
          ...estudianteEditando.notas,
          [area]: valorProcesado,
        },
      });
    }
  };

  // Validar nota
  const validarNota = (valor: any): 'valido' | 'invalido' | 'advertencia' => {
    if (valor === null || valor === undefined || valor === '') return 'advertencia';
    if (typeof valor === 'number') {
      return valor >= 0 && valor <= 20 ? 'valido' : 'invalido';
    }
    return ['AD', 'A', 'B', 'C'].includes(String(valor).toUpperCase()) ? 'valido' : 'advertencia';
  };

  // Calcular situación final
  const calcularSituacionFinal = (estudiante: EstudianteOCRExtraccion): string => {
    if (estudiante.situacionFinal) {
      const situaciones: Record<string, string> = {
        'P': 'Promovido',
        'A': 'Aprobado',
        'R': 'Reprobado',
      };
      return situaciones[estudiante.situacionFinal] || estudiante.situacionFinal;
    }
    return 'Sin definir';
  };

  // Contar notas desaprobadas
  const contarDesaprobadas = (notas: Record<string, any>): number => {
    return Object.values(notas).filter(nota => typeof nota === 'number' && nota < 11).length;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Botón Agregar */}
      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={handleAdd} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Estudiante
          </Button>
        </div>
      )}

      {/* Lista de Estudiantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {estudiantes.map((estudiante, index) => {
          const desaprobadas = contarDesaprobadas(estudiante.notas || {});
          const totalNotas = Object.keys(estudiante.notas || {}).length;
          const promedio = totalNotas > 0
            ? Object.values(estudiante.notas || {})
                .filter(n => typeof n === 'number')
                .reduce((sum: number, n) => sum + (n as number), 0) / totalNotas
            : 0;

          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                {/* Cabecera */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      #{estudiante.numero}
                    </Badge>
                    {estudiante.sexo && (
                      <Badge variant="secondary" className="text-xs">
                        {estudiante.sexo}
                      </Badge>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(estudiante, index)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Nombre Completo */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>Estudiante</span>
                  </div>
                  <p className="font-semibold text-sm leading-tight">
                    {[
                      estudiante.apellidoPaterno,
                      estudiante.apellidoMaterno,
                      estudiante.nombres,
                    ]
                      .filter(Boolean)
                      .join(' ') || 'Sin nombre'}
                  </p>
                </div>

                {/* Estadísticas de Notas */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Promedio</p>
                    <p className={cn(
                      'text-lg font-bold',
                      promedio >= 14 ? 'text-green-600' : promedio >= 11 ? 'text-blue-600' : 'text-red-600'
                    )}>
                      {promedio > 0 ? promedio.toFixed(1) : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold text-foreground">{totalNotas}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Desap.</p>
                    <p className={cn(
                      'text-lg font-bold',
                      desaprobadas > 0 ? 'text-red-600' : 'text-green-600'
                    )}>
                      {desaprobadas}
                    </p>
                  </div>
                </div>

                {/* Situación Final */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Situación</span>
                  <Badge
                    variant={
                      estudiante.situacionFinal === 'P' || estudiante.situacionFinal === 'A'
                        ? 'default'
                        : 'destructive'
                    }
                    className="text-xs"
                  >
                    {calcularSituacionFinal(estudiante)}
                  </Badge>
                </div>

                {/* Advertencias */}
                {desaprobadas > 3 && (
                  <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950 p-2 rounded">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Más de 3 áreas desaprobadas</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Diálogo de Edición */}
      <Dialog open={estudianteEditando !== null} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Editar Estudiante #{estudianteEditando?.numero}
            </DialogTitle>
            <DialogDescription>
              Modifique los datos del estudiante y sus notas
            </DialogDescription>
          </DialogHeader>

          {estudianteEditando && (
            <div className="space-y-6">
              {/* Datos Personales */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Datos Personales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apellidoPaterno">Apellido Paterno</Label>
                    <Input
                      id="apellidoPaterno"
                      value={estudianteEditando.apellidoPaterno || ''}
                      onChange={(e) => updateField('apellidoPaterno', e.target.value)}
                      placeholder="Apellido paterno"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidoMaterno">Apellido Materno</Label>
                    <Input
                      id="apellidoMaterno"
                      value={estudianteEditando.apellidoMaterno || ''}
                      onChange={(e) => updateField('apellidoMaterno', e.target.value)}
                      placeholder="Apellido materno"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombres">Nombres</Label>
                    <Input
                      id="nombres"
                      value={estudianteEditando.nombres || ''}
                      onChange={(e) => updateField('nombres', e.target.value)}
                      placeholder="Nombres"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sexo">Sexo</Label>
                    <Select
                      value={estudianteEditando.sexo || 'M'}
                      onValueChange={(value) => updateField('sexo', value)}
                    >
                      <SelectTrigger id="sexo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="situacionFinal">Situación Final</Label>
                    <Select
                      value={estudianteEditando.situacionFinal || 'A'}
                      onValueChange={(value) => updateField('situacionFinal', value)}
                    >
                      <SelectTrigger id="situacionFinal">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P">Promovido</SelectItem>
                        <SelectItem value="A">Aprobado</SelectItem>
                        <SelectItem value="R">Reprobado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Notas por Área Curricular
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {areasDetectadas.map((area, idx) => {
                    const valorNota = estudianteEditando.notas?.[area];
                    const estadoValidacion = validarNota(valorNota);

                    return (
                      <div key={idx} className="space-y-1.5">
                        <Label
                          htmlFor={`nota-${idx}`}
                          className="text-xs line-clamp-2 h-8 flex items-center"
                          title={area}
                        >
                          {area}
                        </Label>
                        <div className="relative">
                          <Input
                            id={`nota-${idx}`}
                            type="text"
                            value={valorNota ?? ''}
                            onChange={(e) => updateNota(area, e.target.value)}
                            placeholder="0-20"
                            className={cn(
                              'text-center font-mono text-sm',
                              estadoValidacion === 'invalido' && 'border-destructive',
                              estadoValidacion === 'advertencia' && 'border-yellow-500',
                              estadoValidacion === 'valido' && 'border-green-500'
                            )}
                          />
                          {estadoValidacion === 'valido' && (
                            <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-green-600" />
                          )}
                          {estadoValidacion === 'invalido' && (
                            <AlertTriangle className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-destructive" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
