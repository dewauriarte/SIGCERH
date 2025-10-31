import { Request, Response } from 'express';
export declare class GradosController {
    list(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
}
export declare const gradosController: GradosController;
//# sourceMappingURL=grados.controller.d.ts.map