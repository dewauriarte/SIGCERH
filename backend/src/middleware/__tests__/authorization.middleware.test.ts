/**
 * Tests para middleware de autorización
 */

import { Request, Response, NextFunction } from 'express';
import {
  requireRole,
  requirePermission,
  requireAdmin,
  requireOwnerOrAdmin,
} from '../authorization.middleware';

// Mock logger
jest.mock('@config/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('authorization.middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      user: undefined,
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('requireRole', () => {
    it('debe permitir acceso si el usuario tiene el rol requerido', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        roles: [
          { codigo: 'ADMIN', nombre: 'Administrador', nivel: 10 },
        ],
      };

      const middleware = requireRole(['ADMIN']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('debe permitir acceso si el usuario tiene uno de los roles requeridos', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        roles: [
          { codigo: 'EDITOR', nombre: 'Editor', nivel: 3 },
        ],
      };

      const middleware = requireRole(['ADMIN', 'EDITOR', 'MESA_DE_PARTES']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('debe rechazar acceso si el usuario no tiene el rol requerido', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        roles: [
          { codigo: 'PUBLICO', nombre: 'Público', nivel: 1 },
        ],
      };

      const middleware = requireRole(['ADMIN']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        rolesRequeridos: ['ADMIN'],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar acceso si no hay usuario autenticado', () => {
      mockRequest.user = undefined;

      const middleware = requireRole(['ADMIN']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no autenticado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar usuario con múltiples roles', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        roles: [
          { codigo: 'EDITOR', nombre: 'Editor', nivel: 3 },
          { codigo: 'MESA_DE_PARTES', nombre: 'Mesa de Partes', nivel: 2 },
        ],
      };

      const middleware = requireRole(['ADMIN', 'MESA_DE_PARTES']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('debe permitir acceso si el usuario tiene el permiso requerido', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        permisos: ['USUARIOS_VER', 'USUARIOS_CREAR'],
      };

      const middleware = requirePermission(['USUARIOS_VER']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('debe permitir acceso si el usuario tiene uno de los permisos requeridos', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        permisos: ['CERTIFICADOS_EDITAR'],
      };

      const middleware = requirePermission(['CERTIFICADOS_CREAR', 'CERTIFICADOS_EDITAR']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('debe rechazar acceso si el usuario no tiene el permiso requerido', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        permisos: ['CERTIFICADOS_VER'],
      };

      const middleware = requirePermission(['CERTIFICADOS_FIRMAR']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No tienes los permisos necesarios para esta acción',
        permisosRequeridos: ['CERTIFICADOS_FIRMAR'],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar acceso si no hay usuario autenticado', () => {
      mockRequest.user = undefined;

      const middleware = requirePermission(['USUARIOS_VER']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar usuario sin permisos', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        permisos: [],
      };

      const middleware = requirePermission(['USUARIOS_VER']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('debe permitir acceso a usuarios ADMIN', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'admin',
        roles: [
          { codigo: 'ADMIN', nombre: 'Administrador', nivel: 10 },
        ],
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('debe rechazar acceso a usuarios no ADMIN', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'user',
        roles: [
          { codigo: 'PUBLICO', nombre: 'Público', nivel: 1 },
        ],
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnerOrAdmin', () => {
    it('debe permitir acceso al dueño del recurso', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        roles: [
          { codigo: 'PUBLICO', nombre: 'Público', nivel: 1 },
        ],
      };
      mockRequest.params = { id: 'user-123' };

      const middleware = requireOwnerOrAdmin((req) => req.params.id!);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('debe permitir acceso a usuarios ADMIN aunque no sean dueños', () => {
      mockRequest.user = {
        id: 'admin-456',
        username: 'admin',
        roles: [
          { codigo: 'ADMIN', nombre: 'Administrador', nivel: 10 },
        ],
      };
      mockRequest.params = { id: 'user-123' };

      const middleware = requireOwnerOrAdmin((req) => req.params.id!);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('debe rechazar acceso si no es dueño ni admin', () => {
      mockRequest.user = {
        id: 'user-456',
        username: 'otheruser',
        roles: [
          { codigo: 'PUBLICO', nombre: 'Público', nivel: 1 },
        ],
      };
      mockRequest.params = { id: 'user-123' };

      const middleware = requireOwnerOrAdmin((req) => req.params.id!);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe rechazar acceso si no hay usuario autenticado', () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'user-123' };

      const middleware = requireOwnerOrAdmin((req) => req.params.id!);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar funciones personalizadas para obtener userId', () => {
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        roles: [{ codigo: 'PUBLICO', nombre: 'Público', nivel: 1 }],
      };
      mockRequest.params = { userId: 'user-123' };

      const middleware = requireOwnerOrAdmin((req) => req.params.userId!);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('debe manejar errores inesperados en requireRole', () => {
      mockRequest.user = {
        id: 'user-123',
        roles: null as any, // Simular error
      };

      const middleware = requireRole(['ADMIN']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores inesperados en requirePermission', () => {
      mockRequest.user = {
        id: 'user-123',
        permisos: undefined as any, // Esto resulta en permisos vacíos, no error 500
      };

      const middleware = requirePermission(['USUARIOS_VER']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // El middleware maneja el array vacío/undefined como permisos vacíos y retorna 403
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe manejar errores en requireOwnerOrAdmin', () => {
      mockRequest.user = {
        id: 'user-123',
        roles: null as any, // Simular error
      };

      const middleware = requireOwnerOrAdmin((req) => req.params.id!);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
