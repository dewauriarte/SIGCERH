export declare enum EstadoCertificado {
    BORRADOR = "BORRADOR",
    EMITIDO = "EMITIDO",
    ANULADO = "ANULADO"
}
export declare enum TipoFirma {
    DIGITAL = "DIGITAL",
    MANUSCRITA = "MANUSCRITA"
}
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
export interface InstitucionData {
    nombre: string;
    codigo?: string;
    direccion?: string;
    ugel?: string;
    region?: string;
    logo?: string;
}
export interface GradoDetalle {
    anio: number;
    grado: string;
    gradoNumero: number;
    nivel: string;
    situacionFinal?: string;
    notas: NotaArea[];
    promedio?: number;
}
export interface NotaArea {
    area: string;
    codigo?: string;
    nota: number | null;
    notaLiteral?: string;
    esExonerado: boolean;
    orden: number;
}
export interface ObservacionesCertificado {
    retiros?: string;
    traslados?: string;
    siagie?: string;
    pruebasUbicacion?: string;
    convalidacion?: string;
    otros?: string;
}
export interface ResultadoPDF {
    urlPdf: string;
    hashPdf: string;
    urlQr: string;
}
export interface FiltrosCertificado {
    estudianteId?: string;
    estado?: EstadoCertificado;
    codigoVirtual?: string;
    numero?: string;
    fechaEmisionDesde?: Date;
    fechaEmisionHasta?: Date;
}
//# sourceMappingURL=types.d.ts.map