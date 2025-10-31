export interface AnioLectivo {
    id: string;
    institucionId: string;
    anio: number;
    fechaInicio: Date;
    fechaFin: Date;
    activo: boolean;
    observaciones?: string;
}
export interface CreateAnioLectivoData {
    anio: number;
    fechaInicio?: Date;
    fechaFin?: Date;
}
export interface UpdateAnioLectivoData {
    anio?: number;
    fechaInicio?: Date;
    fechaFin?: Date;
    activo?: boolean;
}
export interface Grado {
    id: string;
    institucionId: string;
    nivelEducativoId?: string;
    numero: number;
    nombre: string;
    nombreCorto?: string;
    orden: number;
    activo: boolean;
}
export interface CreateGradoData {
    nivelEducativoId?: string;
    numero: number;
    nombre: string;
    nombreCorto?: string;
    orden?: number;
}
export interface UpdateGradoData {
    nivelEducativoId?: string;
    numero?: number;
    nombre?: string;
    nombreCorto?: string;
    orden?: number;
    activo?: boolean;
}
export interface AreaCurricular {
    id: string;
    institucionId: string;
    codigo: string;
    nombre: string;
    orden: number;
    esCompetenciaTransversal: boolean;
    activo: boolean;
}
export interface CreateAreaCurricularData {
    codigo: string;
    nombre: string;
    orden?: number;
    esCompetenciaTransversal?: boolean;
}
export interface UpdateAreaCurricularData {
    codigo?: string;
    nombre?: string;
    orden?: number;
    esCompetenciaTransversal?: boolean;
    activo?: boolean;
}
//# sourceMappingURL=types.d.ts.map