import { Request, Response, NextFunction } from 'express';
export declare const requireRole: (rolesPermitidos: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requirePermission: (permisosRequeridos: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireOwnerOrAdmin: (getUserIdFromRequest: (req: Request) => string) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authorization.middleware.d.ts.map