/**
 * Modal de Edición de Estudiante - Editor
 *
 * Permite editar los datos de un estudiante extraídos por OCR:
 * - Nombres y apellidos
 * - Notas por cada área curricular
 * - Estado (APROBADO, DESAPROBADO, RETIRADO)
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  User,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { type AreaCurricular } from '@/services/editor.service';

interface EstudianteOCR {
  id: string;
  orden: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  notas: { [areaCodigo: string]: number };
  promedio: number;
  estado: 'APROBADO' | 'DESAPROBADO' | 'RETIRADO';
  confianzaOCR: number;
}

interface StudentEditModalProps {
  open: boolean;
  onClose: () => void;
  estudiante: EstudianteOCR;
  areasCurriculares: AreaCurricular[];
  onSave: (estudiante: EstudianteOCR) => void;
}

export function StudentEditModal({
  open,
  onClose,
  estudiante,
  areasCurriculares,
  onSave,
}: StudentEditModalProps) {
  // ============================================================================
  // ESTADO LOCAL
  // ============================================================================

  const [nombres, setNombres] = useState(estudiante.nombres);
  const [apellidoPaterno, setApellidoPaterno] = useState(estudiante.apellidoPaterno);
  const [apellidoMaterno, setApellidoMaterno] = useState(estudiante.apellidoMaterno);
  const [notas, setNotas] = useState<{ [areaCodigo: string]: number }>(estudiante.notas);
  const [estado, setEstado] = useState<'APROBADO' | 'DESAPROBADO' | 'RETIRADO'>(estudiante.estado);

  // Reiniciar estado cuando cambie el estudiante
  useEffect(() => {
    setNombres(estudiante.nombres);
    setApellidoPaterno(estudiante.apellidoPaterno);
    setApellidoMaterno(estudiante.apellidoMaterno);
    setNotas(estudiante.notas);
    setEstado(estudiante.estado);
  }, [estudiante]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const calcularPromedio = () => {
    const notasArray = Object.values(notas);
    if (notasArray.length === 0) return 0;
    const suma = notasArray.reduce((acc, nota) => acc + nota, 0);
    return suma / notasArray.length;
  };

  const handleNotaChange = (areaCodigo: string, valor: string) => {
    const nota = parseFloat(valor);
    if (!isNaN(nota) && nota >= 0 && nota <= 20) {
      setNotas((prev) => ({ ...prev, [areaCodigo]: nota }));
    }
  };

  const handleSave = () => {
    const promedio = calcularPromedio();

    const estudianteActualizado: EstudianteOCR = {
      ...estudiante,
      nombres: nombres.trim(),
      apellidoPaterno: apellidoPaterno.trim(),
      apellidoMaterno: apellidoMaterno.trim(),
      notas,
      promedio,
      estado,
    };

    onSave(estudianteActualizado);
  };

  const canSave =
    nombres.trim() &&
    apellidoPaterno.trim() &&
    apellidoMaterno.trim() &&
    Object.keys(notas).length > 0;

  const promedio = calcularPromedio();

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Editar Estudiante #{estudiante.orden}
          </DialogTitle>
          <DialogDescription>
            Revisa y corrige los datos extraídos por OCR
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Confianza OCR */}
          <Alert
            className={
              estudiante.confianzaOCR >= 90
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200'
                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200'
            }
          >
            {estudiante.confianzaOCR >= 90 ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            )}
            <AlertDescription>
              Confianza OCR: <strong>{estudiante.confianzaOCR}%</strong>
              {estudiante.confianzaOCR < 90 && ' - Se recomienda verificar los datos cuidadosamente'}
            </AlertDescription>
          </Alert>

          {/* Datos Personales */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Datos Personales
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apellidoPaterno">
                  Apellido Paterno <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="apellidoPaterno"
                  value={apellidoPaterno}
                  onChange={(e) => setApellidoPaterno(e.target.value)}
                  placeholder="Apellido paterno"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellidoMaterno">
                  Apellido Materno <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="apellidoMaterno"
                  value={apellidoMaterno}
                  onChange={(e) => setApellidoMaterno(e.target.value)}
                  placeholder="Apellido materno"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombres">
                Nombres <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                placeholder="Nombres completos"
                maxLength={100}
              />
            </div>
          </div>

          <Separator />

          {/* Notas por Área Curricular */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Notas por Área Curricular
              </h3>
              <Badge variant={promedio >= 11 ? 'default' : 'destructive'}>
                Promedio: {promedio.toFixed(1)}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {areasCurriculares.map((area) => (
                <div key={area.codigo} className="space-y-1">
                  <Label htmlFor={`nota-${area.codigo}`} className="text-xs">
                    {area.posicion}. {area.nombre}
                  </Label>
                  <Input
                    id={`nota-${area.codigo}`}
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={notas[area.codigo] || ''}
                    onChange={(e) => handleNotaChange(area.codigo, e.target.value)}
                    placeholder="0-20"
                    className="h-9"
                  />
                </div>
              ))}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Las notas deben estar entre 0 y 20. El promedio se calcula automáticamente.
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          {/* Estado Final */}
          <div className="space-y-2">
            <Label htmlFor="estado">Estado Final</Label>
            <Select value={estado} onValueChange={(v: any) => setEstado(v)}>
              <SelectTrigger id="estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APROBADO">Aprobado</SelectItem>
                <SelectItem value="DESAPROBADO">Desaprobado</SelectItem>
                <SelectItem value="RETIRADO">Retirado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Acciones */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">*</span> Campos obligatorios
            </p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!canSave}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
