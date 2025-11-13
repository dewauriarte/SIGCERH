/**
 * Types para el módulo de Niveles Educativos
 */

export type NivelEducativoBasic = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
};

