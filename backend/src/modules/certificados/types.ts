/**
 * Tipos, enums e interfaces para el módulo de certificados
 * Sistema de Certificados Históricos 1985-2012
 */

/**
 * Estados del certificado
 */
export enum EstadoCertificado {
  BORRADOR = 'BORRADOR',
  EMITIDO = 'EMITIDO',
  ANULADO = 'ANULADO',
}

/**
 * Tipos de firma
 */
export enum TipoFirma {
  DIGITAL = 'DIGITAL',
  MANUSCRITA = 'MANUSCRITA',
}

/**
 * Datos completos del certificado para generación de PDF
 */
export interface DatosCertificado {
  certificadoId: string;
  codigoVirtual: string;
  numero?: string;
  estudiante: EstudianteData;
  institucion: InstitucionData;
  grados: GradoDetalle[];
  promedio: number;
  situacionFinal: string;
  fechaEmision: Date;
  lugarEmision: string;
  observaciones?: ObservacionesCertificado;
}

/**
 * Datos del estudiante
 */
export interface EstudianteData {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  fechaNacimiento: Date;
  lugarNacimiento?: string;
  sexo?: string;
}

/**
 * Datos de la institución
 */
export interface InstitucionData {
  nombre: string;
  codigo?: string;
  direccion?: string;
  ugel?: string;
  region?: string;
  logo?: string;
}

/**
 * Detalle de un grado (año lectivo)
 */
export interface GradoDetalle {
  anio: number;
  grado: string;
  gradoNumero: number;
  nivel: string;
  situacionFinal?: string;
  notas: NotaArea[];
  promedio?: number;
}

/**
 * Nota de un área curricular
 */
export interface NotaArea {
  area: string;
  codigo?: string;
  nota: number | null;
  notaLiteral?: string;
  esExonerado: boolean;
  orden: number;
}

/**
 * Observaciones del certificado
 */
export interface ObservacionesCertificado {
  retiros?: string;
  traslados?: string;
  siagie?: string;
  pruebasUbicacion?: string;
  convalidacion?: string;
  otros?: string;
}

/**
 * Resultado de generación de PDF
 */
export interface ResultadoPDF {
  urlPdf: string;
  hashPdf: string;
  urlQr: string;
}

/**
 * Filtros para búsqueda de certificados
 */
export interface FiltrosCertificado {
  estudianteId?: string;
  estado?: EstadoCertificado;
  codigoVirtual?: string;
  numero?: string;
  fechaEmisionDesde?: Date;
  fechaEmisionHasta?: Date;
}

