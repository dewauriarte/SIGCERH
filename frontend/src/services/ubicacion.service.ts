import { apiClient } from '@/lib/apiClient';

// ============================
// TIPOS Y INTERFACES
// ============================

export interface Departamento {
  id: string;
  nombre: string;
}

export interface Provincia {
  id: string;
  nombre: string;
  departamento_id?: string;
}

export interface Distrito {
  id: string;
  nombre: string;
  provincia_id?: string;
}

// ============================
// DATOS ESTÁTICOS (FALLBACK)
// ============================

const DEPARTAMENTOS_PERU = [
  { id: '01', nombre: 'Amazonas' },
  { id: '02', nombre: 'Áncash' },
  { id: '03', nombre: 'Apurímac' },
  { id: '04', nombre: 'Arequipa' },
  { id: '05', nombre: 'Ayacucho' },
  { id: '06', nombre: 'Cajamarca' },
  { id: '07', nombre: 'Callao' },
  { id: '08', nombre: 'Cusco' },
  { id: '09', nombre: 'Huancavelica' },
  { id: '10', nombre: 'Huánuco' },
  { id: '11', nombre: 'Ica' },
  { id: '12', nombre: 'Junín' },
  { id: '13', nombre: 'La Libertad' },
  { id: '14', nombre: 'Lambayeque' },
  { id: '15', nombre: 'Lima' },
  { id: '16', nombre: 'Loreto' },
  { id: '17', nombre: 'Madre de Dios' },
  { id: '18', nombre: 'Moquegua' },
  { id: '19', nombre: 'Pasco' },
  { id: '20', nombre: 'Piura' },
  { id: '21', nombre: 'Puno' },
  { id: '22', nombre: 'San Martín' },
  { id: '23', nombre: 'Tacna' },
  { id: '24', nombre: 'Tumbes' },
  { id: '25', nombre: 'Ucayali' },
];

// ============================
// SERVICIO
// ============================

export const ubicacionService = {
  /**
   * Obtener todos los departamentos
   */
  async obtenerDepartamentos(): Promise<Departamento[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: Departamento[] }>('/ubicacion/departamentos');
      return response.data.data;
    } catch (error) {
      // Fallback a datos estáticos si el endpoint no existe
      console.warn('Usando datos estáticos de departamentos', error);
      return DEPARTAMENTOS_PERU;
    }
  },

  /**
   * Obtener provincias de un departamento
   */
  async obtenerProvincias(departamentoId: string): Promise<Provincia[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: Provincia[] }>(
        `/ubicacion/provincias/${departamentoId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener provincias:', error);
      return [];
    }
  },

  /**
   * Obtener distritos de una provincia
   */
  async obtenerDistritos(provinciaId: string): Promise<Distrito[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: Distrito[] }>(
        `/ubicacion/distritos/${provinciaId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener distritos:', error);
      return [];
    }
  },
};
