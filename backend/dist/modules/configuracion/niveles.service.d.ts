import { CreateNivelData, UpdateNivelData } from './types';
export declare class NivelesService {
    list(activoOnly?: boolean): Promise<{
        id: string;
        nombre: string;
        codigo: string;
        descripcion: string | null;
        orden: number;
        activo: boolean | null;
    }[]>;
    getById(id: string): Promise<{
        id: string;
        nombre: string;
        codigo: string;
        descripcion: string | null;
        orden: number;
        activo: boolean | null;
    }>;
    create(data: CreateNivelData): Promise<{
        id: string;
        nombre: string;
        codigo: string;
        descripcion: string | null;
        orden: number;
        activo: boolean | null;
    }>;
    update(id: string, data: UpdateNivelData): Promise<{
        id: string;
        nombre: string;
        codigo: string;
        descripcion: string | null;
        orden: number;
        activo: boolean | null;
    }>;
    delete(id: string): Promise<void>;
}
export declare const nivelesService: NivelesService;
//# sourceMappingURL=niveles.service.d.ts.map