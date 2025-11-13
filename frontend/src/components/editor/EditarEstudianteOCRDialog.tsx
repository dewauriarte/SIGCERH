/**
 * Diálogo para Editar Estudiante Detectado por OCR
 * Fase 6 - Sprint 6
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { EstudianteOCR } from '@/services/editor.service';

interface EditarEstudianteOCRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estudiante: EstudianteOCR;
  onGuardar: (estudianteEditado: EstudianteOCR) => void;
}

const AREAS_CURRICULARES = [
  'Matemática',
  'Comunicación',
  'Inglés',
  'Arte',
  'Historia, Geografía y Economía',
  'Formación Ciudadana y Cívica',
  'Persona, Familia y Relaciones Humanas',
  'Educación Física',
  'Educación Religiosa',
  'Ciencia, Tecnología y Ambiente',
  'Educación para el Trabajo',
  'Tutoría',
];

export function EditarEstudianteOCRDialog({
  open,
  onOpenChange,
  estudiante,
  onGuardar,
}: EditarEstudianteOCRDialogProps) {
  const [formData, setFormData] = useState<EstudianteOCR>(estudiante);
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(estudiante);
  }, [estudiante]);

  const handleNotaChange = (index: number, valor: string) => {
    // Permitir vacío (null) o número válido
    const nota = valor === '' ? null : parseInt(valor);

    if (valor !== '' && (isNaN(nota as number) || (nota as number) < 0 || (nota as number) > 20)) {
      setErrores(prev => ({ ...prev, [`nota_${index}`]: 'Nota debe ser entre 0 y 20' }));
      return;
    }

    setErrores(prev => {
      const newErrores = { ...prev };
      delete newErrores[`nota_${index}`];
      return newErrores;
    });

    const nuevasNotas = [...formData.notas];
    nuevasNotas[index] = nota as number;

    // Recalcular asignaturas desaprobadas (solo contar notas válidas)
    const notasValidas = nuevasNotas.filter(n => n !== null && n !== undefined);
    const desaprobadas = notasValidas.filter(n => n < 11).length;

    // NO recalcular situación automáticamente - respetar lo que dice el acta
    // El usuario puede cambiar manualmente si es necesario

    setFormData(prev => ({
      ...prev,
      notas: nuevasNotas,
      asignaturasDesaprobadas: desaprobadas,
      // Mantener situacionFinal sin cambios
    }));
  };

  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.apellidoPaterno.trim()) {
      nuevosErrores.apellidoPaterno = 'Apellido paterno es requerido';
    }
    if (!formData.apellidoMaterno.trim()) {
      nuevosErrores.apellidoMaterno = 'Apellido materno es requerido';
    }
    if (!formData.nombres.trim()) {
      nuevosErrores.nombres = 'Nombres son requeridos';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = () => {
    if (!validarFormulario()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    onGuardar(formData);
    toast.success('Estudiante actualizado correctamente');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Datos del Estudiante</DialogTitle>
          <DialogDescription>
            Corrige los datos extraídos por OCR si es necesario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Datos Personales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Datos Personales</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="apellidoPaterno">Apellido Paterno *</Label>
                <Input
                  id="apellidoPaterno"
                  value={formData.apellidoPaterno}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidoPaterno: e.target.value }))}
                  className={errores.apellidoPaterno ? 'border-red-500' : ''}
                />
                {errores.apellidoPaterno && (
                  <p className="text-xs text-red-500 mt-1">{errores.apellidoPaterno}</p>
                )}
              </div>

              <div>
                <Label htmlFor="apellidoMaterno">Apellido Materno *</Label>
                <Input
                  id="apellidoMaterno"
                  value={formData.apellidoMaterno}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidoMaterno: e.target.value }))}
                  className={errores.apellidoMaterno ? 'border-red-500' : ''}
                />
                {errores.apellidoMaterno && (
                  <p className="text-xs text-red-500 mt-1">{errores.apellidoMaterno}</p>
                )}
              </div>

              <div>
                <Label htmlFor="nombres">Nombres *</Label>
                <Input
                  id="nombres"
                  value={formData.nombres}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
                  className={errores.nombres ? 'border-red-500' : ''}
                />
                {errores.nombres && (
                  <p className="text-xs text-red-500 mt-1">{errores.nombres}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sexo">Sexo *</Label>
                <Select value={formData.sexo} onValueChange={(value: 'M' | 'F') => setFormData(prev => ({ ...prev, sexo: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value: 'G' | 'P') => setFormData(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G">Gratuito</SelectItem>
                    <SelectItem value="P">Pagante</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="comportamiento">Comportamiento (opcional)</Label>
                <Input
                  id="comportamiento"
                  value={formData.comportamiento || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, comportamiento: e.target.value }))}
                  placeholder="Ej: A, B, C, 18, vacío"
                  maxLength={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Letra (A-D) o número (0-20), o dejar vacío
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notas por Área */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Notas por Área Curricular</h3>
            
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
              {AREAS_CURRICULARES.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Label className="flex-1 text-xs">{area}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.notas[index] ?? ''}
                    onChange={(e) => handleNotaChange(index, e.target.value)}
                    className={`w-16 text-center ${errores[`nota_${index}`] ? 'border-red-500' : ''}`}
                    placeholder="-"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Deja vacío las notas que no apliquen (ej: estudiante retirado)
            </p>
          </div>

          <Separator />

          {/* Situación Final */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Situación Final</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Asignaturas Desaprobadas</Label>
                <Input
                  type="number"
                  value={formData.asignaturasDesaprobadas}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="situacionFinal">Situación Final *</Label>
                <Select 
                  value={formData.situacionFinal} 
                  onValueChange={(value: 'P' | 'A' | 'R') => setFormData(prev => ({ ...prev, situacionFinal: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P">Promovido - Sin desaprobadas (P)</SelectItem>
                    <SelectItem value="A">Aprobado - Con arrastres (A)</SelectItem>
                    <SelectItem value="R">Reprobado / Retirado (R)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  P: Todas las áreas aprobadas | A: Algunas desaprobadas | R: Reprobado o retirado
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleGuardar}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Correcciones
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

