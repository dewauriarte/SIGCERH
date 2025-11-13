/**
 * Types para el proceso de normalización de actas físicas
 * JSON flexible → Validación → Normalización en BD
 */

// ================================================
// DATOS EXTRAÍDOS POR IA/OCR (JSON Flexible)
// ================================================

/**
 * Estructura de datos extraídos por IA (JSON flexible)
 * Puede variar según el año y tipo de acta
 */
export interface DatosOCRExtraccion {
  estudiantes: EstudianteOCRExtraccion[];
  metadata: MetadataOCR;
}

export interface EstudianteOCRExtraccion {
  numero: number;                          // Orden en el acta
  dni?: string;                            // Puede no estar visible
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  sexo?: 'M' | 'H';
  fechaNacimiento?: string;                // Puede no estar visible
  situacionFinal?: string;                 // APROBADO, DESAPROBADO, etc.
  observaciones?: string;

  // ⚠️ IMPORTANTE: Notas son un objeto dinámico (áreas varían)
  notas: Record<string, number | string | null>;  // "MATEMATICA": 15, "COMUNICACION": "AD", etc.
}

export interface MetadataOCR {
  total_estudiantes: number;
  confianza_promedio: number;              // 0-100
  areas_detectadas: string[];
  procesado_en: string;                    // ISO datetime
  modelo_ia?: string;                      // "gemini-1.5-pro", etc.
  advertencias?: string[];
}

// ================================================
// CORRECCIONES MANUALES
// ================================================

export type TipoCorreccionOCR =
  | 'estudiante_campo'                     // Corregir campo de estudiante
  | 'estudiante_agregar'                   // Agregar estudiante faltante
  | 'estudiante_eliminar'                  // Eliminar estudiante duplicado
  | 'nota_valor'                           // Corregir valor de nota
  | 'nota_agregar'                         // Agregar nota faltante
  | 'area_mapear';                         // Mapear área no reconocida

export interface CorreccionOCR {
  tipo: TipoCorreccionOCR;
  indexEstudiante: number;                 // Índice en el array de estudiantes
  campo?: string;                          // Campo a corregir
  valorAnterior?: any;
  valorNuevo?: any;
  razon?: string;                          // Motivo de la corrección
}

// ================================================
// VALIDACIÓN PRE-NORMALIZACIÓN
// ================================================

export interface ResultadoValidacionOCR {
  valido: boolean;
  errores: ErrorValidacionOCR[];
  advertencias: AdvertenciaValidacionOCR[];
  estadisticas: EstadisticasValidacion;
}

export interface ErrorValidacionOCR {
  tipo: 'estudiante_sin_dni' | 'estudiante_sin_nombre' | 'nota_invalida' | 'area_no_encontrada' | 'duplicado';
  estudiante: {
    numero: number;
    nombre?: string;
  };
  area?: string;
  detalle: string;
  sugerencia?: string;
}

export interface AdvertenciaValidacionOCR {
  tipo: 'dni_temporal' | 'area_aproximada' | 'nota_faltante';
  estudiante: {
    numero: number;
    nombre: string;
  };
  area?: string;
  detalle: string;
}

export interface EstadisticasValidacion {
  total_estudiantes: number;
  estudiantes_con_dni: number;
  estudiantes_sin_dni: number;
  total_notas: number;
  notas_numericas: number;
  notas_literales: number;
  notas_faltantes: number;
  areas_detectadas: number;
  areas_mapeadas: number;
  areas_no_mapeadas: number;
}

// ================================================
// MAPEO DE ÁREAS CURRICULARES
// ================================================

export interface MapeoAreaCurricular {
  nombre_ocr: string;                      // Nombre extraído por OCR
  area_id: string;                         // ID del área en BD
  area_nombre: string;                     // Nombre oficial
  area_codigo: string;                     // Código oficial
  confianza: number;                       // 0-100 (confianza del mapeo)
  metodo: 'exacto' | 'aproximado' | 'manual';
}

export interface ResultadoMapeoAreas {
  mapeosExitosos: MapeoAreaCurricular[];
  areasNoMapeadas: string[];
  sugerencias: SugerenciaMapeo[];
}

export interface SugerenciaMapeo {
  nombre_ocr: string;
  candidatos: Array<{
    area_id: string;
    area_nombre: string;
    similitud: number;                     // 0-100
  }>;
}

// ================================================
// NORMALIZACIÓN (Resultado)
// ================================================

export interface ResultadoNormalizacion {
  success: boolean;
  mensaje: string;
  acta: {
    id: string;
    numero: string;
    normalizada: boolean;
    fecha_normalizacion?: Date;
  };
  estadisticas: EstadisticasNormalizacion;
  errores?: ErrorNormalizacion[];
}

export interface EstadisticasNormalizacion {
  estudiantes_procesados: number;
  estudiantes_creados: number;             // Nuevos en la BD
  estudiantes_existentes: number;          // Ya estaban en BD
  vinculos_creados: number;                // ActaEstudiante
  notas_creadas: number;                   // ActaNota
  tiempo_procesamiento_ms: number;
}

export interface ErrorNormalizacion {
  estudiante: {
    numero: number;
    nombre: string;
    dni?: string;
  };
  fase: 'busqueda_estudiante' | 'creacion_estudiante' | 'vinculo_acta' | 'creacion_notas';
  error: string;
  stack?: string;
}

// ================================================
// CONSULTAS (Actas Normalizadas)
// ================================================

export interface ActaEstudianteDetalle {
  id: string;
  acta: {
    id: string;
    numero: string;
    folio?: number;
    tipo: string;
    fechaEmision?: Date;
  };
  libro?: {
    codigo: string;
    nombre: string;
    ubicacion: string;
  };
  anioLectivo: {
    anio: number;
  };
  grado: {
    numero: number;
    nombre: string;
  };
  nivel?: {
    nombre: string;
  };
  numeroOrden: number;
  situacionFinal?: string;
  observaciones?: string;
  notas: NotaDetalle[];
  fechaRegistro: Date;
}

export interface NotaDetalle {
  id: string;
  area: {
    id: string;
    codigo: string;
    nombre: string;
    orden: number;
  };
  nota?: number;
  notaLiteral?: string;
  esExonerado: boolean;
  nombreAreaOCR?: string;                  // Nombre original de OCR
  confianzaOCR?: number;
  orden: number;
}

// ================================================
// CONSOLIDADO PARA CERTIFICADO
// ================================================

export interface ConsolidadoNotasCertificado {
  estudiante: {
    id: string;
    dni: string;
    nombreCompleto: string;
  };
  periodos: PeriodoAcademico[];
  estadisticas: EstadisticasConsolidado;
}

export interface PeriodoAcademico {
  anio: number;
  grado: {
    numero: number;
    nombre: string;
  };
  nivel?: {
    nombre: string;
  };
  situacionFinal?: string;
  notas: NotaConsolidada[];
  acta: {
    numero: string;
    folio?: number;
    libro?: string;
  };
}

export interface NotaConsolidada {
  area: {
    codigo: string;
    nombre: string;
    orden: number;
  };
  nota?: number;
  notaLiteral?: string;
  esExonerado: boolean;
}

export interface EstadisticasConsolidado {
  total_periodos: number;
  anio_inicio: number;
  anio_fin: number;
  grados_cursados: number[];
  promedio_general?: number;
  total_notas: number;
  notas_aprobadas: number;
  notas_desaprobadas: number;
}

// ================================================
// ESTADOS DEL FLUJO
// ================================================

export enum EstadoProcesamientoActa {
  SUBIDA = 'SUBIDA',                       // Archivo subido, sin procesar
  PROCESANDO_OCR = 'PROCESANDO_OCR',       // IA procesando
  PROCESADA_OCR = 'PROCESADA_OCR',         // JSON extraído, pendiente validación
  VALIDADA = 'VALIDADA',                   // JSON validado por humano
  NORMALIZANDO = 'NORMALIZANDO',           // Insertando en BD
  NORMALIZADA = 'NORMALIZADA',             // Completamente normalizada
  ERROR_OCR = 'ERROR_OCR',                 // Error en procesamiento IA
  ERROR_NORMALIZACION = 'ERROR_NORMALIZACION' // Error al normalizar
}

// ================================================
// CONFIGURACIÓN DE NORMALIZACIÓN
// ================================================

export interface ConfiguracionNormalizacion {
  // Validación
  requerir_dni: boolean;                   // ¿Es obligatorio el DNI?
  permitir_dni_temporal: boolean;          // ¿Generar DNI temporal?
  validar_areas_estricto: boolean;         // ¿Rechazar si área no existe?

  // Mapeo de áreas
  umbral_similitud_areas: number;          // 0-100 (mínimo para mapeo aproximado)
  permitir_mapeo_manual: boolean;

  // Duplicados
  estrategia_duplicados: 'actualizar' | 'saltar' | 'error';
  campos_match_estudiante: Array<'dni' | 'nombre_completo' | 'nombre_apellidos'>;

  // Transaccionalidad
  modo_transaccion: 'todo_o_nada' | 'mejor_esfuerzo';
  rollback_on_error: boolean;

  // Auditoría
  guardar_json_original: boolean;          // Siempre true recomendado
  registrar_correcciones: boolean;
}

export const CONFIGURACION_DEFAULT: ConfiguracionNormalizacion = {
  requerir_dni: false,
  permitir_dni_temporal: true,
  validar_areas_estricto: false,
  umbral_similitud_areas: 70,
  permitir_mapeo_manual: true,
  estrategia_duplicados: 'saltar',
  campos_match_estudiante: ['dni', 'nombre_completo'],
  modo_transaccion: 'mejor_esfuerzo',
  rollback_on_error: false,
  guardar_json_original: true,
  registrar_correcciones: true
};
