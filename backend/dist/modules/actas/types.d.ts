export declare enum EstadoActa {
    DISPONIBLE = "DISPONIBLE",
    ASIGNADA_BUSQUEDA = "ASIGNADA_BUSQUEDA",
    ENCONTRADA = "ENCONTRADA",
    NO_ENCONTRADA = "NO_ENCONTRADA"
}
export declare enum TipoActa {
    CONSOLIDADO = "CONSOLIDADO",
    TRASLADO = "TRASLADO",
    SUBSANACION = "SUBSANACION",
    RECUPERACION = "RECUPERACION"
}
export declare enum Turno {
    MANANA = "MA\u00D1ANA",
    TARDE = "TARDE",
    NOCHE = "NOCHE"
}
export interface EstudianteOCR {
    numero: number;
    dni?: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    nombres: string;
    sexo: 'M' | 'F';
    fechaNacimiento?: string;
    notas: Record<string, number>;
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
export interface FiltrosActa {
    estado?: EstadoActa;
    anioLectivoId?: string;
    gradoId?: string;
    procesado?: boolean;
    fechaDesde?: Date;
    fechaHasta?: Date;
    solicitudId?: string;
}
export declare const TRANSICIONES_VALIDAS: Record<EstadoActa, EstadoActa[]>;
//# sourceMappingURL=types.d.ts.map