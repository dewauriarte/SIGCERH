interface AssignAreasToGradoData {
    gradoId: string;
    anioLectivoId: string;
    areas: {
        areaCurricularId: string;
        orden: number;
    }[];
}
interface PlantillaArea {
    id: string;
    codigo: string;
    nombre: string;
    orden: number;
}
export declare class CurriculoGradoService {
    assignAreasToGrado(data: AssignAreasToGradoData): Promise<{
        id: string;
        orden: number;
        area: {
            id: string;
            codigo: string;
            nombre: string;
        };
    }[]>;
    getPlantillaByAnioGrado(anio: number, numeroGrado: number): Promise<PlantillaArea[]>;
    getByGrado(gradoId: string, anioLectivoId?: string): Promise<{
        id: string;
        orden: number;
        activo: boolean | null;
        anio: {
            id: string;
            anio: number;
        };
        grado: {
            id: string;
            numero: number;
            nombre: string;
        };
        area: {
            id: string;
            codigo: string;
            nombre: string;
        };
    }[]>;
    updateOrden(curriculoGradoId: string, nuevoOrden: number): Promise<void>;
    removeArea(curriculoGradoId: string): Promise<void>;
}
export declare const curriculoGradoService: CurriculoGradoService;
export {};
//# sourceMappingURL=curriculo-grado.service.d.ts.map