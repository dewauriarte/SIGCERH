import { Request, Response } from 'express';
export declare class RolesController {
    list(_req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    getPermisos(req: Request, res: Response): Promise<void>;
    listPermisos(_req: Request, res: Response): Promise<void>;
}
export declare const rolesController: RolesController;
//# sourceMappingURL=roles.controller.d.ts.map