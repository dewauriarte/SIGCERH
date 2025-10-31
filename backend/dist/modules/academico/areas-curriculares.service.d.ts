import { CreateAreaCurricularData, UpdateAreaCurricularData } from './types';
export declare class AreasCurricularesService {
    list(activoOnly?: boolean): Promise<{
        id: string;
        codigo: string;
        nombre: string;
        orden: number;
        esCompetenciaTransversal: boolean | null;
        activo: boolean | null;
    }[]>;
    getById(id: string): Promise<{
        id: string;
        codigo: string;
        nombre: string;
        orden: number;
        esCompetenciaTransversal: boolean | null;
        activo: boolean | null;
    }>;
    create(data: CreateAreaCurricularData): Promise<{
        id: string;
        codigo: string;
        nombre: string;
        orden: number;
        esCompetenciaTransversal: boolean | null;
        activo: boolean | null;
    }>;
    update(id: string, data: UpdateAreaCurricularData): Promise<{
        id: string;
        codigo: string;
        nombre: string;
        orden: number;
        esCompetenciaTransversal: boolean | null;
        activo: boolean | null;
    }>;
    delete(id: string): Promise<void>;
}
export declare const areasCurricularesService: AreasCurricularesService;
//# sourceMappingURL=areas-curriculares.service.d.ts.map