/**
 * Tests para middleware de autenticación
 */

import { Request, Response, NextFunction } from 'express';
import { authenticate, authenticateOptional } from '../auth.middleware';
import * as jwtUtils from '@modules/auth/utils/jwt.utils';
import * as authService from '@modules/auth/auth.service';

// Mocks
jest.mock('@modules/auth/utils/jwt.utils');
jest.mock('@modules/auth/auth.service');
jest.mock('@config/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('auth.middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('debe autenticar usuario con token válido', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        activo: true,
        roles: [],
        permisos: [],
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ sub: 'user-123' });
      (authService.authService.getUserById as jest.Mock) = jest.fn().mockResolvedValue(mockUser);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('debe rechazar request sin header de autorización', async () => {
      mockRequest.headers = {};

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token de autenticación no proporcionado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar header de autorización con formato incorrecto', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Formato de token inválido. Use: Bearer TOKEN',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar token sin prefijo Bearer', async () => {
      mockRequest.headers = {
        authorization: 'just_token',
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar token inválido', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token inválido');
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar si el usuario no existe', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ sub: 'user-123' });
      (authService.authService.getUserById as jest.Mock) = jest.fn().mockResolvedValue(null);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no encontrado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar si el usuario está inactivo', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        activo: false,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ sub: 'user-123' });
      (authService.authService.getUserById as jest.Mock) = jest.fn().mockResolvedValue(mockUser);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario inactivo',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores del servidor', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Error inesperado');
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authenticateOptional', () => {
    it('debe agregar usuario si el token es válido', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        activo: true,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ sub: 'user-123' });
      (authService.authService.getUserById as jest.Mock) = jest.fn().mockResolvedValue(mockUser);

      await authenticateOptional(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe continuar sin usuario si no hay header de autorización', async () => {
      mockRequest.headers = {};

      await authenticateOptional(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe continuar sin usuario si el token es inválido', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token inválido');
      });

      await authenticateOptional(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe continuar sin usuario si el usuario está inactivo', async () => {
      const mockUser = {
        id: 'user-123',
        activo: false,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ sub: 'user-123' });
      (authService.authService.getUserById as jest.Mock) = jest.fn().mockResolvedValue(mockUser);

      await authenticateOptional(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('debe continuar sin usuario si hay un error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Error inesperado');
      });

      await authenticateOptional(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
