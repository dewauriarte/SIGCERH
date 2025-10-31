import { Request, Response } from 'express';
export declare class UsuariosController {
    list(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    asignarRoles(req: Request, res: Response): Promise<void>;
}
export declare const usuariosController: UsuariosController;
//# sourceMappingURL=usuarios.controller.d.ts.map