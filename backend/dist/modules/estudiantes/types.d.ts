export interface Estudiante {
    id: string;
    institucionId: string;
    dni: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    fechaNacimiento?: Date;
    lugarNacimiento?: string;
    sexo?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    nombrePadre?: string;
    nombreMadre?: string;
    activo: boolean;
    fechaCreacion: Date;
    fechaActualizacion?: Date;
}
export interface CreateEstudianteData {
    dni: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    fechaNacimiento?: Date;
    lugarNacimiento?: string;
    sexo?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    nombrePadre?: string;
    nombreMadre?: string;
}
export interface UpdateEstudianteData {
    dni?: string;
    nombres?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    fechaNacimiento?: Date;
    lugarNacimiento?: string;
    sexo?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    nombrePadre?: string;
    nombreMadre?: string;
    activo?: boolean;
}
export interface SearchEstudianteOptions {
    dni?: string;
    nombre?: string;
    page?: number;
    limit?: number;
}
//# sourceMappingURL=types.d.ts.map