import { Request, Response } from 'express';
export declare class EstudiantesController {
    list(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    search(req: Request, res: Response): Promise<void>;
    importCSV(req: Request, res: Response): Promise<void>;
}
export declare const estudiantesController: EstudiantesController;
//# sourceMappingURL=estudiantes.controller.d.ts.map