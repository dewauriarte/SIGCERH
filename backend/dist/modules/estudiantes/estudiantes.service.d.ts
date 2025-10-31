import { CreateEstudianteData, UpdateEstudianteData, SearchEstudianteOptions } from './types';
export declare class EstudiantesService {
    list(options?: {
        page?: number;
        limit?: number;
        activo?: boolean;
    }): Promise<{
        items: {
            id: string;
            dni: string;
            nombres: string;
            apellidoPaterno: string;
            apellidoMaterno: string;
            fechaNacimiento: Date;
            lugarNacimiento: string | null;
            sexo: string | null;
            direccion: string | null;
            telefono: string | null;
            email: string | null;
            estado: string | null;
            fechaRegistro: Date | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getById(id: string): Promise<{
        id: string;
        dni: string;
        nombres: string;
        apellidoPaterno: string;
        apellidoMaterno: string;
        fechaNacimiento: Date;
        lugarNacimiento: string | null;
        sexo: string | null;
        direccion: string | null;
        telefono: string | null;
        email: string | null;
        estado: string | null;
        fechaRegistro: Date | null;
    }>;
    create(data: CreateEstudianteData): Promise<{
        id: string;
        dni: string;
        nombres: string;
        apellidoPaterno: string;
        apellidoMaterno: string;
        fechaNacimiento: Date;
        lugarNacimiento: string | null;
        sexo: string | null;
        direccion: string | null;
        telefono: string | null;
        email: string | null;
        estado: string | null;
        fechaRegistro: Date | null;
    }>;
    update(id: string, data: UpdateEstudianteData): Promise<{
        id: string;
        dni: string;
        nombres: string;
        apellidoPaterno: string;
        apellidoMaterno: string;
        fechaNacimiento: Date;
        lugarNacimiento: string | null;
        sexo: string | null;
        direccion: string | null;
        telefono: string | null;
        email: string | null;
        estado: string | null;
        fechaRegistro: Date | null;
    }>;
    delete(id: string): Promise<void>;
    search(options: SearchEstudianteOptions): Promise<{
        items: {
            id: string;
            dni: string;
            nombres: string;
            apellidoPaterno: string;
            apellidoMaterno: string;
            nombreCompleto: string;
            fechaNacimiento: Date;
            sexo: string | null;
            estado: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    importFromCSV(buffer: Buffer): Promise<{
        total: number;
        exitosos: number;
        errores: Array<{
            fila: number;
            dni: string;
            error: string;
        }>;
        duplicados: Array<{
            fila: number;
            dni: string;
        }>;
    }>;
}
export declare const estudiantesService: EstudiantesService;
//# sourceMappingURL=estudiantes.service.d.ts.map