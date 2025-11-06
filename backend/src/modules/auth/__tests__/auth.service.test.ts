/**
 * Tests unitarios para AuthService
 */

import { AuthService } from '../auth.service';
import { PrismaClient } from '@prisma/client';
import * as bcryptUtils from '../utils/bcrypt.utils';
import * as jwtUtils from '../utils/jwt.utils';

// Mock de Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    usuario: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    usuariorol: {
      create: jest.fn(),
    },
    rol: {
      findFirst: jest.fn(),
    },
    sesion: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock de utilidades
jest.mock('../utils/bcrypt.utils');
jest.mock('../utils/jwt.utils');
jest.mock('@config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: any;

  beforeEach(() => {
    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();

    // Crear instancia del servicio
    authService = new AuthService();
    prisma = new PrismaClient();
  });

  describe('register', () => {
    it('debe registrar un nuevo usuario exitosamente', async () => {
      const registerData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        nombres: 'Test',
        apellidos: 'User',
      };

      const mockRol = { id: 'rol-id-123', codigo: 'PUBLICO' };
      const mockUsuario = {
        id: 'user-id-123',
        username: registerData.username,
        email: registerData.email,
        passwordhash: 'hashed_password',
        activo: true,
      };

      // Configurar mocks
      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(null); // No existe usuario
      (bcryptUtils.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (prisma.usuario.create as jest.Mock).mockResolvedValue(mockUsuario);
      (prisma.rol.findFirst as jest.Mock).mockResolvedValue(mockRol);
      (prisma.usuariorol.create as jest.Mock).mockResolvedValue({});

      // Mock para el login automático
      const mockLoginResponse = {
        user: mockUsuario,
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresIn: '1h',
      };

      // Mock de todo el flujo de login
      (prisma.usuario.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // Primera llamada: usuario no existe
        .mockResolvedValueOnce({ // Segunda llamada: login
          ...mockUsuario,
          bloqueado: false,
          activo: true,
          passwordhash: 'hashed_password',
          usuariorol_usuariorol_usuario_idTousuario: [
            {
              activo: true,
              rol: {
                ...mockRol,
                rolpermiso: [],
              },
            },
          ],
        });

      (bcryptUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access_token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh_token');
      (prisma.usuario.update as jest.Mock).mockResolvedValue(mockUsuario);
      (prisma.sesion.create as jest.Mock).mockResolvedValue({});

      // Ejecutar
      const result = await authService.register(registerData);

      // Verificar
      expect(result).toBeDefined();
      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
      expect(prisma.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            username: registerData.username,
            email: registerData.email,
          }),
        })
      );
    });

    it('debe lanzar error si el username ya existe', async () => {
      const registerData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123',
      };

      const mockExistingUser = {
        id: 'existing-id',
        username: 'existinguser',
        email: 'other@example.com',
      };

      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(mockExistingUser);

      await expect(authService.register(registerData)).rejects.toThrow(
        'El nombre de usuario ya está en uso'
      );
    });

    it('debe lanzar error si el email ya existe', async () => {
      const registerData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
      };

      const mockExistingUser = {
        id: 'existing-id',
        username: 'otheruser',
        email: 'existing@example.com',
      };

      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(mockExistingUser);

      await expect(authService.register(registerData)).rejects.toThrow(
        'El correo electrónico ya está registrado'
      );
    });

    it('debe lanzar error si el DNI ya existe', async () => {
      const registerData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        dni: '12345678',
      };

      const mockExistingUser = {
        id: 'existing-id',
        username: 'otheruser',
        email: 'other@example.com',
        dni: '12345678',
      };

      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(mockExistingUser);

      await expect(authService.register(registerData)).rejects.toThrow(
        'El DNI ya está registrado'
      );
    });
  });

  describe('login', () => {
    it('debe autenticar un usuario correctamente', async () => {
      const loginData = {
        usernameOrEmail: 'testuser',
        password: 'password123',
      };

      const mockUsuario = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        passwordhash: 'hashed_password',
        bloqueado: false,
        activo: true,
        intentosfallidos: 0,
        usuariorol_usuariorol_usuario_idTousuario: [
          {
            activo: true,
            rol: {
              id: 'rol-id',
              codigo: 'PUBLICO',
              nombre: 'Público',
              nivel: 1,
              rolpermiso: [],
            },
          },
        ],
      };

      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(mockUsuario);
      (bcryptUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access_token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh_token');
      (prisma.usuario.update as jest.Mock).mockResolvedValue(mockUsuario);
      (prisma.sesion.create as jest.Mock).mockResolvedValue({});

      const result = await authService.login(loginData);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
      expect(result.user.username).toBe('testuser');
      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-id-123' },
          data: expect.objectContaining({
            intentosfallidos: 0,
          }),
        })
      );
    });

    it('debe lanzar error si el usuario no existe', async () => {
      const loginData = {
        usernameOrEmail: 'noexiste',
        password: 'password123',
      };

      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow('Credenciales inválidas');
    });

    it('debe lanzar error si el usuario está bloqueado', async () => {
      const mockUsuario = {
        id: 'user-id',
        username: 'testuser',
        bloqueado: true,
        activo: true,
        passwordhash: 'hash',
      };

      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(mockUsuario);

      await expect(authService.login({ usernameOrEmail: 'testuser', password: 'pass' }))
        .rejects.toThrow('Usuario bloqueado');
    });

    it('debe lanzar error si el usuario está inactivo', async () => {
      const mockUsuario = {
        id: 'user-id',
        username: 'testuser',
        bloqueado: false,
        activo: false,
        passwordhash: 'hash',
      };

      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(mockUsuario);

      await expect(authService.login({ usernameOrEmail: 'testuser', password: 'pass' }))
        .rejects.toThrow('Usuario inactivo');
    });

    it('debe incrementar intentos fallidos con contraseña incorrecta', async () => {
      const mockUsuario = {
        id: 'user-id',
        username: 'testuser',
        bloqueado: false,
        activo: true,
        intentosfallidos: 2,
        passwordhash: 'hash',
      };

      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(mockUsuario);
      (bcryptUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login({ usernameOrEmail: 'testuser', password: 'wrong' }))
        .rejects.toThrow('Credenciales inválidas');

      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-id' },
          data: expect.objectContaining({
            intentosfallidos: 3,
          }),
        })
      );
    });

    it('debe bloquear usuario después de 5 intentos fallidos', async () => {
      const mockUsuario = {
        id: 'user-id',
        username: 'testuser',
        bloqueado: false,
        activo: true,
        intentosfallidos: 4,
        passwordhash: 'hash',
      };

      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue(mockUsuario);
      (bcryptUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login({ usernameOrEmail: 'testuser', password: 'wrong' }))
        .rejects.toThrow('Credenciales inválidas');

      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-id' },
          data: expect.objectContaining({
            intentosfallidos: 5,
            bloqueado: true,
            fechabloqueo: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('refresh', () => {
    it('debe renovar tokens correctamente', async () => {
      const refreshToken = 'valid_refresh_token';
      const mockSesion = {
        id: 'sesion-id',
        token: refreshToken,
        activa: true,
        fechaexpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        usuario: {
          id: 'user-id',
          username: 'testuser',
          email: 'test@example.com',
          activo: true,
          usuariorol_usuariorol_usuario_idTousuario: [
            {
              activo: true,
              rol: {
                id: 'rol-id',
                codigo: 'PUBLICO',
                nombre: 'Público',
                nivel: 1,
                rolpermiso: [],
              },
            },
          ],
        },
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ sub: 'user-id' });
      (prisma.sesion.findFirst as jest.Mock).mockResolvedValue(mockSesion);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('new_access_token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('new_refresh_token');
      (prisma.sesion.update as jest.Mock).mockResolvedValue({});

      const result = await authService.refresh(refreshToken);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('new_access_token');
      expect(result.refreshToken).toBe('new_refresh_token');
    });

    it('debe lanzar error si el refresh token es inválido', async () => {
      const invalidToken = 'invalid_token';

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token inválido');
      });

      await expect(authService.refresh(invalidToken)).rejects.toThrow(
        'Refresh token inválido o expirado'
      );
    });

    it('debe lanzar error si la sesión no existe', async () => {
      const refreshToken = 'valid_token';

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ sub: 'user-id' });
      (prisma.sesion.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(authService.refresh(refreshToken)).rejects.toThrow(
        'Sesión inválida o expirada'
      );
    });

    it('debe lanzar error si el usuario está inactivo', async () => {
      const refreshToken = 'valid_token';
      const mockSesion = {
        usuario: {
          id: 'user-id',
          activo: false,
        },
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ sub: 'user-id' });
      (prisma.sesion.findFirst as jest.Mock).mockResolvedValue(mockSesion);

      await expect(authService.refresh(refreshToken)).rejects.toThrow('Usuario inactivo');
    });
  });

  describe('logout', () => {
    it('debe cerrar sesión correctamente', async () => {
      const refreshToken = 'valid_refresh_token';

      (prisma.sesion.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await authService.logout(refreshToken);

      expect(prisma.sesion.updateMany).toHaveBeenCalledWith({
        where: { token: refreshToken },
        data: {
          activa: false,
          fechacierre: expect.any(Date),
        },
      });
    });
  });

  describe('getUserById', () => {
    it('debe retornar usuario con roles y permisos', async () => {
      const userId = 'user-id-123';
      const mockUsuario = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        dni: null,
        nombres: 'Test',
        apellidos: 'User',
        telefono: null,
        cargo: null,
        activo: true,
        usuariorol_usuariorol_usuario_idTousuario: [
          {
            activo: true,
            rol: {
              id: 'rol-id',
              codigo: 'ADMIN',
              nombre: 'Administrador',
              nivel: 10,
              rolpermiso: [
                {
                  permiso: {
                    id: 'perm-id',
                    codigo: 'USUARIOS_VER',
                    nombre: 'Ver usuarios',
                    modulo: 'USUARIOS',
                  },
                },
              ],
            },
          },
        ],
      };

      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(mockUsuario);

      const result = await authService.getUserById(userId);

      expect(result).toBeDefined();
      expect(result?.username).toBe('testuser');
      expect(result?.roles).toHaveLength(1);
      expect(result?.roles[0]!.codigo).toBe('ADMIN');
      expect(result?.permisos).toContain('USUARIOS_VER');
    });

    it('debe retornar null si el usuario no existe', async () => {
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.getUserById('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
