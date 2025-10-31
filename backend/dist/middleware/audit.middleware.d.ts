import { Request, Response, NextFunction } from 'express';
export declare enum AccionAuditoria {
    CREAR = "CREAR",
    ACTUALIZAR = "ACTUALIZAR",
    ELIMINAR = "ELIMINAR",
    VER = "VER",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    EXPORTAR = "EXPORTAR",
    FIRMAR = "FIRMAR",
    APROBAR = "APROBAR",
    RECHAZAR = "RECHAZAR",
    VALIDAR = "VALIDAR"
}
export declare const registrarAuditoria: (entidad: string, entidadId: string, accion: AccionAuditoria, usuarioId: string | null, datosAnteriores?: any, datosNuevos?: any, ip?: string, userAgent?: string) => Promise<void>;
export declare const auditarAccion: (entidad: string, obtenerEntidadId?: (req: Request) => string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const auditarAutenticacion: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=audit.middleware.d.ts.map