/**
 * Types para el módulo de Años Lectivos
 */

export type AnioLectivoBasic = {
  id: string;
  anio: number;
  fechainicio: Date;
  fechafin: Date;
  activo: boolean;
  observaciones?: string;
};

