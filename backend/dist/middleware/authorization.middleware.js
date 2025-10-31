import { logger } from '@config/logger';
export const requireRole = (rolesPermitidos) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const rolesUsuario = req.user.roles.map((r) => r.codigo);
            const tieneRol = rolesPermitidos.some(rol => rolesUsuario.includes(rol));
            if (!tieneRol) {
                logger.warn(`Usuario ${req.user.username} intentó acceder sin rol requerido. Roles necesarios: ${rolesPermitidos.join(', ')}`);
                res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para acceder a este recurso',
                    rolesRequeridos: rolesPermitidos,
                });
                return;
            }
            next();
        }
        catch (error) {
            logger.error('Error en middleware de autorización (rol):', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar permisos',
            });
        }
    };
};
export const requirePermission = (permisosRequeridos) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const permisosUsuario = req.user.permisos || [];
            const tienePermiso = permisosRequeridos.some(permiso => permisosUsuario.includes(permiso));
            if (!tienePermiso) {
                logger.warn(`Usuario ${req.user.username} intentó acceder sin permiso requerido. Permisos necesarios: ${permisosRequeridos.join(', ')}`);
                res.status(403).json({
                    success: false,
                    message: 'No tienes los permisos necesarios para esta acción',
                    permisosRequeridos: permisosRequeridos,
                });
                return;
            }
            next();
        }
        catch (error) {
            logger.error('Error en middleware de autorización (permiso):', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar permisos',
            });
        }
    };
};
export const requireAdmin = requireRole(['ADMIN']);
export const requireOwnerOrAdmin = (getUserIdFromRequest) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            const userId = getUserIdFromRequest(req);
            const isOwner = req.user.id === userId;
            const isAdmin = req.user.roles.some((r) => r.codigo === 'ADMIN');
            if (!isOwner && !isAdmin) {
                logger.warn(`Usuario ${req.user.username} intentó acceder a recurso ajeno sin ser admin`);
                res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para acceder a este recurso',
                });
                return;
            }
            next();
        }
        catch (error) {
            logger.error('Error en middleware requireOwnerOrAdmin:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar permisos',
            });
        }
    };
};
//# sourceMappingURL=authorization.middleware.js.map