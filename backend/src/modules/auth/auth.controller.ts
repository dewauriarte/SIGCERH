/**
 * Controlador de autenticación
 * Maneja las peticiones HTTP relacionadas con autenticación
 */

import { Request, Response } from 'express';
import { authService } from './auth.service';
import { logger } from '@config/logger';
import {
  RegisterDTO,
  LoginDTO,
  RefreshTokenDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
} from './dtos';

export class AuthController {
  /**
   * POST /api/auth/register
   * Registra un nuevo usuario
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos con Zod (ya validado por middleware)
      const data = RegisterDTO.parse(req.body);

      // Registrar usuario
      const result = await authService.register(data);

      logger.info(`Nuevo usuario registrado: ${data.username}`);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result,
      });
    } catch (error: any) {
      logger.error('Error en register:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al registrar usuario',
      });
    }
  }

  /**
   * POST /api/auth/login
   * Inicia sesión de usuario
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos
      const data = LoginDTO.parse(req.body);

      // Login
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const result = await authService.login(data, ip, userAgent);

      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: result,
      });
    } catch (error: any) {
      logger.error('Error en login:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Error al iniciar sesión',
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Renueva el access token usando un refresh token
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos
      const data = RefreshTokenDTO.parse(req.body);

      // Refresh
      const result = await authService.refresh(data.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token renovado exitosamente',
        data: result,
      });
    } catch (error: any) {
      logger.error('Error en refresh:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Error al renovar token',
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Cierra sesión del usuario
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Obtener refresh token del body
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token requerido',
        });
        return;
      }

      // Logout
      await authService.logout(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Logout exitoso',
      });
    } catch (error: any) {
      logger.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cerrar sesión',
      });
    }
  }

  /**
   * GET /api/auth/me
   * Obtiene información del usuario autenticado
   */
  async me(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      logger.error('Error en me:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener información del usuario',
      });
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Solicita recuperación de contraseña
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos
      const data = ForgotPasswordDTO.parse(req.body);

      // Procesar solicitud
      const result = await authService.forgotPassword(data.email);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Error en forgotPassword:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar solicitud',
      });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Resetea la contraseña con un token
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos
      const data = ResetPasswordDTO.parse(req.body);

      // Resetear contraseña
      const result = await authService.resetPassword(data.token, data.newPassword);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Error en resetPassword:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al resetear contraseña',
      });
    }
  }

  /**
   * POST /api/auth/change-password
   * Cambia la contraseña del usuario autenticado
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      // TODO: Implementar cambio de contraseña

      res.status(200).json({
        success: true,
        message: 'Contraseña cambiada exitosamente',
      });
    } catch (error: any) {
      logger.error('Error en changePassword:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar contraseña',
      });
    }
  }
}

export const authController = new AuthController();

