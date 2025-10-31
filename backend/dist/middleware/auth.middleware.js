import { verifyToken } from '@modules/auth/utils/jwt.utils';
import { authService } from '@modules/auth/auth.service';
import { logger } from '@config/logger';
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({
                success: false,
                message: 'Token de autenticación no proporcionado',
            });
            return;
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            res.status(401).json({
                success: false,
                message: 'Formato de token inválido. Use: Bearer TOKEN',
            });
            return;
        }
        const token = parts[1];
        let payload;
        try {
            payload = verifyToken(token);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Token inválido';
            res.status(401).json({
                success: false,
                message,
            });
            return;
        }
        if (!payload.sub) {
            res.status(401).json({
                success: false,
                message: 'Token inválido: falta identificador de usuario',
            });
            return;
        }
        const userId = payload.sub;
        const user = await authService.getUserById(userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Usuario no encontrado',
            });
            return;
        }
        if (!user.activo) {
            res.status(403).json({
                success: false,
                message: 'Usuario inactivo',
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        logger.error('Error en middleware de autenticación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar autenticación',
        });
    }
};
export const authenticateOptional = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            next();
            return;
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            next();
            return;
        }
        const token = parts[1];
        try {
            const payload = verifyToken(token);
            if (payload.sub) {
                const userId = payload.sub;
                const user = await authService.getUserById(userId);
                if (user && user.activo) {
                    req.user = user;
                }
            }
        }
        catch {
        }
        next();
    }
    catch (error) {
        logger.error('Error en middleware de autenticación opcional:', error);
        next();
    }
};
//# sourceMappingURL=auth.middleware.js.map