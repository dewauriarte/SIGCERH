import { Request, Response } from 'express';
export declare class CurriculoController {
    assignAreasToGrado(req: Request, res: Response): Promise<void>;
    getPlantilla(req: Request, res: Response): Promise<void>;
    getByGrado(req: Request, res: Response): Promise<void>;
    updateOrden(req: Request, res: Response): Promise<void>;
    removeArea(req: Request, res: Response): Promise<void>;
}
export declare const curriculoController: CurriculoController;
//# sourceMappingURL=curriculo.controller.d.ts.map