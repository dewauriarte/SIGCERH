/**
 * Tipos y enums para el módulo de actas físicas
 */

/**
 * Estados de un acta física
 */
export enum EstadoActa {
  DISPONIBLE = 'DISPONIBLE',
  ASIGNADA_BUSQUEDA = 'ASIGNADA_BUSQUEDA',
  ENCONTRADA = 'ENCONTRADA',
  NO_ENCONTRADA = 'NO_ENCONTRADA',
}

/**
 * Tipos de acta
 */
export enum TipoActa {
  CONSOLIDADO = 'CONSOLIDADO',
  TRASLADO = 'TRASLADO',
  SUBSANACION = 'SUBSANACION',
  RECUPERACION = 'RECUPERACION',
}

/**
 * Turnos escolares
 */
export enum Turno {
  MANANA = 'MAÑANA',
  TARDE = 'TARDE',
  NOCHE = 'NOCHE',
}

/**
 * Estructura de datos extraídos por OCR
 */
export interface EstudianteOCR {
  numero: number;
  dni?: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  sexo: 'M' | 'F';
  fechaNacimiento?: string;
  notas: Record<string, number>; // { "MATEMATICA": 14, "COMUNICACION": 15, ... }
  situacionFinal?: string;
}

export interface DatosOCR {
  estudiantes: EstudianteOCR[];
  metadata?: {
    fechaProcesamiento?: string;
    algoritmo?: string;
    confianza?: number;
  };
}

/**
 * Filtros para búsqueda de actas
 */
export interface FiltrosActa {
  estado?: EstadoActa;
  anioLectivoId?: string;
  gradoId?: string;
  procesado?: boolean;
  fechaDesde?: Date;
  fechaHasta?: Date;
  solicitudId?: string;
}

/**
 * Transiciones válidas de estado
 */
export const TRANSICIONES_VALIDAS: Record<EstadoActa, EstadoActa[]> = {
  [EstadoActa.DISPONIBLE]: [EstadoActa.ASIGNADA_BUSQUEDA],
  [EstadoActa.ASIGNADA_BUSQUEDA]: [
    EstadoActa.ENCONTRADA,
    EstadoActa.NO_ENCONTRADA,
  ],
  [EstadoActa.ENCONTRADA]: [], // Estado final procesable
  [EstadoActa.NO_ENCONTRADA]: [EstadoActa.ASIGNADA_BUSQUEDA], // Permitir reintentar búsqueda
};

