import { authService } from './auth.service';
import { logger } from '@config/logger';
import { RegisterDTO, LoginDTO, RefreshTokenDTO, ForgotPasswordDTO, ResetPasswordDTO, } from './dtos';
export class AuthController {
    async register(req, res) {
        try {
            const data = RegisterDTO.parse(req.body);
            const result = await authService.register(data);
            logger.info(`Nuevo usuario registrado: ${data.username}`);
            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: result,
            });
        }
        catch (error) {
            logger.error('Error en register:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al registrar usuario',
            });
        }
    }
    async login(req, res) {
        try {
            const data = LoginDTO.parse(req.body);
            const ip = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];
            const result = await authService.login(data, ip, userAgent);
            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: result,
            });
        }
        catch (error) {
            logger.error('Error en login:', error);
            res.status(401).json({
                success: false,
                message: error.message || 'Error al iniciar sesión',
            });
        }
    }
    async refresh(req, res) {
        try {
            const data = RefreshTokenDTO.parse(req.body);
            const result = await authService.refresh(data.refreshToken);
            res.status(200).json({
                success: true,
                message: 'Token renovado exitosamente',
                data: result,
            });
        }
        catch (error) {
            logger.error('Error en refresh:', error);
            res.status(401).json({
                success: false,
                message: error.message || 'Error al renovar token',
            });
        }
    }
    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    message: 'Refresh token requerido',
                });
                return;
            }
            await authService.logout(refreshToken);
            res.status(200).json({
                success: true,
                message: 'Logout exitoso',
            });
        }
        catch (error) {
            logger.error('Error en logout:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al cerrar sesión',
            });
        }
    }
    async me(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Información del usuario',
                data: req.user,
            });
        }
        catch (error) {
            logger.error('Error en me:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener información del usuario',
            });
        }
    }
    async forgotPassword(req, res) {
        try {
            const data = ForgotPasswordDTO.parse(req.body);
            const result = await authService.forgotPassword(data.email);
            res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            logger.error('Error en forgotPassword:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar solicitud',
            });
        }
    }
    async resetPassword(req, res) {
        try {
            const data = ResetPasswordDTO.parse(req.body);
            const result = await authService.resetPassword(data.token, data.newPassword);
            res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            logger.error('Error en resetPassword:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al resetear contraseña',
            });
        }
    }
    async changePassword(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Contraseña cambiada exitosamente',
            });
        }
        catch (error) {
            logger.error('Error en changePassword:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar contraseña',
            });
        }
    }
}
export const authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map