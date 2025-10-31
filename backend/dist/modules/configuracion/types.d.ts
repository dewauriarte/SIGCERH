export interface ConfiguracionInstitucion {
    id: string;
    nombre: string;
    codigoModular?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    logoUrl?: string;
    activo: boolean;
    fechaCreacion: Date;
    fechaActualizacion?: Date;
}
export interface NivelEducativo {
    id: string;
    nombre: string;
    codigo: string;
    descripcion?: string;
    orden: number;
    activo: boolean;
    fechaCreacion: Date;
    fechaActualizacion?: Date;
}
export interface InstitucionUsuario {
    id: string;
    institucionId: string;
    usuarioId: string;
    fechaAsignacion: Date;
    activo: boolean;
}
export interface UpdateConfiguracionData {
    nombre?: string;
    codigoModular?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    logoUrl?: string;
}
export interface CreateNivelData {
    nombre: string;
    codigo: string;
    descripcion?: string;
    orden?: number;
}
export interface UpdateNivelData {
    nombre?: string;
    codigo?: string;
    descripcion?: string;
    orden?: number;
    activo?: boolean;
}
//# sourceMappingURL=types.d.ts.map