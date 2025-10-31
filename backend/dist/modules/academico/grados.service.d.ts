import { CreateGradoData, UpdateGradoData } from './types';
export declare class GradosService {
    list(nivelEducativoId?: string, activoOnly?: boolean): Promise<{
        id: string;
        numero: number;
        nombre: string;
        nombreCorto: string | null;
        orden: number;
        activo: boolean | null;
        nivelEducativo: {
            id: string;
            codigo: string;
            nombre: string;
        } | null;
    }[]>;
    getById(id: string): Promise<{
        id: string;
        numero: number;
        nombre: string;
        nombreCorto: string | null;
        orden: number;
        activo: boolean | null;
        nivelEducativo: {
            id: string;
            codigo: string;
            nombre: string;
        } | null;
    }>;
    create(data: CreateGradoData): Promise<{
        id: string;
        numero: number;
        nombre: string;
        nombreCorto: string | null;
        orden: number;
        activo: boolean | null;
        nivelEducativo: {
            id: string;
            codigo: string;
            nombre: string;
        } | null;
    }>;
    update(id: string, data: UpdateGradoData): Promise<{
        id: string;
        numero: number;
        nombre: string;
        nombreCorto: string | null;
        orden: number;
        activo: boolean | null;
        nivelEducativo: {
            id: string;
            codigo: string;
            nombre: string;
        } | null;
    }>;
    delete(id: string): Promise<void>;
    getByNumero(numero: number): Promise<{
        id: string;
        numero: number;
        nombre: string;
        nombreCorto: string | null;
    }>;
}
export declare const gradosService: GradosService;
//# sourceMappingURL=grados.service.d.ts.map