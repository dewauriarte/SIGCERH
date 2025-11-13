import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/custom/LoadingSpinner';
import { ubicacionService } from '@/services/ubicacion.service';

interface UbicacionSelectorProps {
  value: {
    departamento: string;
    provincia: string;
    distrito: string;
  };
  onChange: (ubicacion: { departamento: string; provincia: string; distrito: string }) => void;
  error?: {
    departamento?: string;
    provincia?: string;
    distrito?: string;
  };
}

export function UbicacionSelector({ value, onChange, error }: UbicacionSelectorProps) {

  // Consultar departamentos
  const {
    data: departamentos = [],
    isLoading: loadingDepartamentos,
  } = useQuery({
    queryKey: ['departamentos'],
    queryFn: () => ubicacionService.obtenerDepartamentos(),
  });

  // Consultar provincias (solo si hay departamento seleccionado)
  const {
    data: provincias = [],
    isLoading: loadingProvincias,
  } = useQuery({
    queryKey: ['provincias', value.departamento],
    queryFn: () => ubicacionService.obtenerProvincias(value.departamento),
    enabled: !!value.departamento,
  });

  // Consultar distritos (solo si hay provincia seleccionada)
  const {
    data: distritos = [],
    isLoading: loadingDistritos,
  } = useQuery({
    queryKey: ['distritos', value.provincia],
    queryFn: () => ubicacionService.obtenerDistritos(value.provincia),
    enabled: !!value.provincia,
  });

  // Resetear provincia si el departamento cambia y la provincia ya no es válida
  useEffect(() => {
    if (value.provincia && provincias.length > 0) {
      const provinciaExiste = provincias.some(p => p.id === value.provincia);
      if (!provinciaExiste && !loadingProvincias) {
        onChange({
          departamento: value.departamento,
          provincia: '',
          distrito: '',
        });
      }
    }
  }, [provincias, value.provincia, value.departamento, loadingProvincias]);

  // Resetear distrito si la provincia cambia y el distrito ya no es válido
  useEffect(() => {
    if (value.distrito && distritos.length > 0) {
      const distritoExiste = distritos.some(d => d.id === value.distrito);
      if (!distritoExiste && !loadingDistritos) {
        onChange({
          departamento: value.departamento,
          provincia: value.provincia,
          distrito: '',
        });
      }
    }
  }, [distritos, value.distrito, value.provincia, value.departamento, loadingDistritos]);

  const handleDepartamentoChange = (departamentoId: string) => {
    // Al cambiar departamento, resetear provincia y distrito
    onChange({
      departamento: departamentoId,
      provincia: '',
      distrito: '',
    });
  };

  const handleProvinciaChange = (provinciaId: string) => {
    // Al cambiar provincia, resetear distrito
    onChange({
      departamento: value.departamento,
      provincia: provinciaId,
      distrito: '',
    });
  };

  const handleDistritoChange = (distritoId: string) => {
    onChange({
      departamento: value.departamento,
      provincia: value.provincia,
      distrito: distritoId,
    });
  };

  // Obtener nombres para mostrar en los selects
  const departamentoSeleccionado = departamentos.find(d => d.id === value.departamento);
  const provinciaSeleccionada = provincias.find(p => p.id === value.provincia);
  const distritoSeleccionado = distritos.find(d => d.id === value.distrito);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Departamento */}
      <div className="space-y-2">
        <Label htmlFor="departamento">
          Departamento <span className="text-destructive">*</span>
        </Label>
        <Select
          value={value.departamento || ''}
          onValueChange={handleDepartamentoChange}
          disabled={loadingDepartamentos}
        >
          <SelectTrigger id="departamento" className={error?.departamento ? 'border-destructive' : ''}>
            <SelectValue placeholder="Seleccione...">
              {departamentoSeleccionado ? departamentoSeleccionado.nombre : 'Seleccione...'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[300px] overflow-y-auto">
            {loadingDepartamentos ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              departamentos.map((dep) => (
                <SelectItem key={dep.id} value={dep.id}>
                  {dep.nombre}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {error?.departamento && (
          <p className="text-sm text-destructive">{error.departamento}</p>
        )}
      </div>

      {/* Provincia */}
      <div className="space-y-2">
        <Label htmlFor="provincia">
          Provincia <span className="text-destructive">*</span>
        </Label>
        <Select
          value={value.provincia || ''}
          onValueChange={handleProvinciaChange}
          disabled={!value.departamento || loadingProvincias}
        >
          <SelectTrigger id="provincia" className={error?.provincia ? 'border-destructive' : ''}>
            <SelectValue>
              {!value.departamento
                ? 'Primero seleccione departamento'
                : provinciaSeleccionada
                ? provinciaSeleccionada.nombre
                : 'Seleccione...'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[300px] overflow-y-auto">
            {loadingProvincias ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : provincias.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No hay provincias disponibles
              </div>
            ) : (
              provincias.map((prov) => (
                <SelectItem key={prov.id} value={prov.id}>
                  {prov.nombre}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {error?.provincia && (
          <p className="text-sm text-destructive">{error.provincia}</p>
        )}
      </div>

      {/* Distrito */}
      <div className="space-y-2">
        <Label htmlFor="distrito">
          Distrito <span className="text-destructive">*</span>
        </Label>
        <Select
          value={value.distrito || ''}
          onValueChange={handleDistritoChange}
          disabled={!value.provincia || loadingDistritos}
        >
          <SelectTrigger id="distrito" className={error?.distrito ? 'border-destructive' : ''}>
            <SelectValue>
              {!value.provincia
                ? 'Primero seleccione provincia'
                : distritoSeleccionado
                ? distritoSeleccionado.nombre
                : 'Seleccione...'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[300px] overflow-y-auto">
            {loadingDistritos ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : distritos.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No hay distritos disponibles
              </div>
            ) : (
              distritos.map((dist) => (
                <SelectItem key={dist.id} value={dist.id}>
                  {dist.nombre}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {error?.distrito && (
          <p className="text-sm text-destructive">{error.distrito}</p>
        )}
      </div>
    </div>
  );
}
