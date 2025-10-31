import { CreateAnioLectivoData, UpdateAnioLectivoData } from './types';
export declare class AniosLectivosService {
    list(activoOnly?: boolean): Promise<{
        id: string;
        anio: number;
        fechaInicio: Date;
        fechaFin: Date;
        activo: boolean | null;
        observaciones: string | null;
    }[]>;
    getById(id: string): Promise<{
        id: string;
        anio: number;
        fechaInicio: Date;
        fechaFin: Date;
        activo: boolean | null;
        observaciones: string | null;
    }>;
    create(data: CreateAnioLectivoData): Promise<{
        id: string;
        anio: number;
        fechaInicio: Date;
        fechaFin: Date;
        activo: boolean | null;
        observaciones: string | null;
    }>;
    update(id: string, data: UpdateAnioLectivoData): Promise<{
        id: string;
        anio: number;
        fechaInicio: Date;
        fechaFin: Date;
        activo: boolean | null;
        observaciones: string | null;
    }>;
    delete(id: string): Promise<void>;
}
export declare const aniosLectivosService: AniosLectivosService;
//# sourceMappingURL=anios-lectivos.service.d.ts.map