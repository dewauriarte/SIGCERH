/**
 * Types y Enums para el módulo de Grados
 */

// No necesitamos enums especiales para grados, solo tipos básicos
export type GradoBasic = {
  id: string;
  numero: number;
  nombre: string;
  nombrecorto?: string;
  orden: number;
  activo: boolean;
};

