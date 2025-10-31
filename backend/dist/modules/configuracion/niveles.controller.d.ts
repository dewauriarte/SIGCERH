import { Request, Response } from 'express';
export declare class NivelesController {
    list(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
}
export declare const nivelesController: NivelesController;
//# sourceMappingURL=niveles.controller.d.ts.map