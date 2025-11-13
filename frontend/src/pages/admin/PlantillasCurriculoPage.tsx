/**
 * Página de Plantillas de Currículo
 * CRÍTICO para OCR - Define el orden de las áreas por grado y año
 */

import { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2, Save, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ============================================================================
// TIPOS
// ============================================================================

interface Area {
  id: string;
  codigo: string;
  nombre: string;
  orden: number;
}

// ============================================================================
// DATOS MOCK (reemplazar con API real)
// ============================================================================

const gradosSecundaria = [
  { value: '1', label: 'Primer Grado' },
  { value: '2', label: 'Segundo Grado' },
  { value: '3', label: 'Tercer Grado' },
  { value: '4', label: 'Cuarto Grado' },
  { value: '5', label: 'Quinto Grado' },
];

const aniosDisponibles = Array.from({ length: 28 }, (_, i) => ({
  value: (1985 + i).toString(),
  label: (1985 + i).toString(),
}));

const areasDisponibles: Area[] = [
  { id: '1', codigo: 'MAT', nombre: 'MATEMÁTICA', orden: 0 },
  { id: '2', codigo: 'COM', nombre: 'COMUNICACIÓN', orden: 0 },
  { id: '3', codigo: 'ING', nombre: 'INGLÉS', orden: 0 },
  { id: '4', codigo: 'ART', nombre: 'ARTE', orden: 0 },
  { id: '5', codigo: 'HGE', nombre: 'HISTORIA, GEOGRAFÍA Y ECONOMÍA', orden: 0 },
  { id: '6', codigo: 'FCC', nombre: 'FORMACIÓN CIUDADANA Y CÍVICA', orden: 0 },
  { id: '7', codigo: 'PFRH', nombre: 'PERSONA, FAMILIA Y RELACIONES HUMANAS', orden: 0 },
  { id: '8', codigo: 'EFI', nombre: 'EDUCACIÓN FÍSICA', orden: 0 },
  { id: '9', codigo: 'ERE', nombre: 'EDUCACIÓN RELIGIOSA', orden: 0 },
  { id: '10', codigo: 'CTA', nombre: 'CIENCIA, TECNOLOGÍA Y AMBIENTE', orden: 0 },
  { id: '11', codigo: 'EPT', nombre: 'EDUCACIÓN PARA EL TRABAJO', orden: 0 },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function PlantillasCurriculoPage() {
  // Estado local
  const [anioSeleccionado, setAnioSeleccionado] = useState('1995');
  const [gradoSeleccionado, setGradoSeleccionado] = useState('5');
  const [areasOrdenadas, setAreasOrdenadas] = useState<Area[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleCargarPlantilla = () => {
    // TODO: Cargar desde API
    // Por ahora usamos datos mock
    const plantillaMock = areasDisponibles.map((area, index) => ({
      ...area,
      orden: index + 1,
    }));
    setAreasOrdenadas(plantillaMock);
    toast.success('Plantilla cargada', {
      description: `Currículo para Quinto Grado - Año ${anioSeleccionado}`,
    });
  };

  const handleAgregarArea = (areaId: string) => {
    const area = areasDisponibles.find((a) => a.id === areaId);
    if (!area) return;

    if (areasOrdenadas.find((a) => a.id === areaId)) {
      toast.error('Área ya agregada', {
        description: 'Esta área ya está en la plantilla.',
      });
      return;
    }

    const nuevaArea = {
      ...area,
      orden: areasOrdenadas.length + 1,
    };

    setAreasOrdenadas([...areasOrdenadas, nuevaArea]);
  };

  const handleEliminarArea = (areaId: string) => {
    const nuevasAreas = areasOrdenadas
      .filter((a) => a.id !== areaId)
      .map((a, index) => ({ ...a, orden: index + 1 }));
    setAreasOrdenadas(nuevasAreas);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(areasOrdenadas);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Actualizar orden
    const areasActualizadas = items.map((item, index) => ({
      ...item,
      orden: index + 1,
    }));

    setAreasOrdenadas(areasActualizadas);
  };

  const handleGuardar = () => {
    if (areasOrdenadas.length === 0) {
      toast.error('Error', {
        description: 'Debes agregar al menos un área.',
      });
      return;
    }

    // TODO: Guardar en API
    toast.success('Plantilla guardada', {
      description: `Currículo configurado para Quinto Grado - Año ${anioSeleccionado}`,
    });
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Plantillas de Currículo
        </h1>
        <p className="text-gray-500 mt-1">
          Configura el orden de las áreas curriculares para cada grado y año lectivo.
          <span className="font-semibold text-orange-600">
            {' '}
            ⚠️ CRÍTICO para el funcionamiento del OCR.
          </span>
        </p>
      </div>

      {/* Alerta Informativa */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertDescription className="text-orange-900">
          <strong>Importante:</strong> El orden de las áreas aquí definido debe
          coincidir exactamente con el orden de las columnas en las actas físicas.
          Esto permite que el OCR mapee correctamente cada nota a su área correspondiente.
        </AlertDescription>
      </Alert>

      {/* Selección de Año y Grado */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Año y Grado</CardTitle>
          <CardDescription>
            Elige el año lectivo y el grado para configurar su currículo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Año Lectivo
              </label>
              <Select value={anioSeleccionado} onValueChange={setAnioSeleccionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aniosDisponibles.map((anio) => (
                    <SelectItem key={anio.value} value={anio.value}>
                      {anio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Grado
              </label>
              <Select value={gradoSeleccionado} onValueChange={setGradoSeleccionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gradosSecundaria.map((grado) => (
                    <SelectItem key={grado.value} value={grado.value}>
                      {grado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleCargarPlantilla} className="w-full">
                Cargar Plantilla
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor de Plantilla */}
      {areasOrdenadas.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Áreas Ordenadas */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Áreas en la Plantilla</CardTitle>
                    <CardDescription>
                      Arrastra para reordenar. El orden define cómo se leen las notas.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {areasOrdenadas.length} áreas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="areas">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {areasOrdenadas.map((area, index) => (
                          <Draggable
                            key={area.id}
                            draggableId={area.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`
                                  flex items-center gap-3 p-4 bg-white border rounded-lg
                                  ${snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'}
                                `}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="h-5 w-5 text-gray-400" />
                                </div>

                                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-700">
                                  {area.orden}
                                </div>

                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {area.nombre}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Código: {area.codigo}
                                  </p>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEliminarArea(area.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                <div className="mt-6 flex gap-3">
                  <Button onClick={handleGuardar} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Plantilla
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? 'Ocultar' : 'Ver'} Preview
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Agregar Áreas */}
            <Card>
              <CardHeader>
                <CardTitle>Agregar Área</CardTitle>
                <CardDescription>
                  Selecciona un área para agregar a la plantilla
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select onValueChange={handleAgregarArea}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un área..." />
                  </SelectTrigger>
                  <SelectContent>
                    {areasDisponibles.map((area) => (
                      <SelectItem
                        key={area.id}
                        value={area.id}
                        disabled={!!areasOrdenadas.find((a) => a.id === area.id)}
                      >
                        {area.nombre} ({area.codigo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    💡 Consejo
                  </h4>
                  <p className="text-xs text-blue-700">
                    El orden de las áreas debe coincidir exactamente con las
                    columnas de notas en el acta física. Primera área = Primera columna.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          {showPreview && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">
                  Preview: Cómo se leerá en el OCR
                </CardTitle>
                <CardDescription>
                  Así es como el OCR interpretará las notas de las actas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2">Columna</th>
                        <th className="text-left pb-2">Área Curricular</th>
                        <th className="text-left pb-2">Código</th>
                      </tr>
                    </thead>
                    <tbody>
                      {areasOrdenadas.map((area) => (
                        <tr key={area.id} className="border-b last:border-0">
                          <td className="py-2 font-mono text-blue-600">
                            Nota {area.orden}
                          </td>
                          <td className="py-2">{area.nombre}</td>
                          <td className="py-2">
                            <Badge variant="secondary">{area.codigo}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Alert className="mt-4">
                  <AlertDescription>
                    <strong>Ejemplo:</strong> Si en el acta la primera nota de un
                    estudiante es 14, esa nota corresponderá a{' '}
                    <strong>{areasOrdenadas[0]?.nombre || 'N/A'}</strong>.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Mensaje si no hay plantilla cargada */}
      {areasOrdenadas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 mb-4">
              <Plus className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay plantilla cargada
            </h3>
            <p className="text-gray-500 mb-4">
              Selecciona un año lectivo y grado, luego haz clic en "Cargar Plantilla"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

