export interface EstudianteCSVRow {
    DNI: string;
    Nombres: string;
    ApellidoPaterno: string;
    ApellidoMaterno: string;
    FechaNacimiento?: string;
    LugarNacimiento?: string;
    Sexo?: string;
    Direccion?: string;
    Telefono?: string;
    Email?: string;
    NombrePadre?: string;
    NombreMadre?: string;
}
export interface ParseCSVResult<T> {
    data: T[];
    errors: Array<{
        row: number;
        message: string;
        data?: any;
    }>;
}
export declare function parseEstudiantesCSV(buffer: Buffer): ParseCSVResult<EstudianteCSVRow>;
export declare function isValidCSVFile(filename: string): boolean;
export declare const MAX_CSV_SIZE: number;
//# sourceMappingURL=csv-parser.d.ts.map