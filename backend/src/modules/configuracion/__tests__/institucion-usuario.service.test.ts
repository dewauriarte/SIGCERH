/**
 * Tests unitarios para InstitucionUsuarioService
 */

import { InstitucionUsuarioService } from '../institucion-usuario.service';
import { PrismaClient } from '@prisma/client';

// Mock de Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    configuracioninstitucion: {
      findFirst: jest.fn(),
    },
    usuario: {
      findUnique: jest.fn(),
    },
    institucionusuario: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock del logger
jest.mock('@config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('InstitucionUsuarioService', () => {
  let institucionUsuarioService: InstitucionUsuarioService;
  let prisma: any;

  const mockInstitucion = {
    id: 'inst-123',
    nombre: 'IE Test',
    codigomodular: '123456',
    direccion: 'Test',
    telefono: '111111',
    email: 'test@ie.edu',
    logo_url: null,
    activo: true,
    fechaactualizacion: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    institucionUsuarioService = new InstitucionUsuarioService();
    prisma = new PrismaClient();
  });

  describe('listUsuariosInstitucion', () => {
    it('debe listar usuarios asignados a la institución', async () => {
      const mockAsignaciones = [
        {
          id: 'asig-1',
          institucion_id: mockInstitucion.id,
          usuario_id: 'user-1',
          fechaasignacion: new Date('2024-01-01'),
          activo: true,
          usuario_institucionusuario_usuario_idTousuario: {
            id: 'user-1',
            username: 'usuario1',
            email: 'user1@test.com',
            nombres: 'Usuario',
            apellidos: 'Uno',
            dni: '12345678',
            cargo: 'Docente',
            activo: true,
          },
        },
        {
          id: 'asig-2',
          institucion_id: mockInstitucion.id,
          usuario_id: 'user-2',
          fechaasignacion: new Date('2024-01-02'),
          activo: true,
          usuario_institucionusuario_usuario_idTousuario: {
            id: 'user-2',
            username: 'usuario2',
            email: 'user2@test.com',
            nombres: 'Usuario',
            apellidos: 'Dos',
            dni: '87654321',
            cargo: 'Administrativo',
            activo: true,
          },
        },
      ];

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.institucionusuario.findMany as jest.Mock).mockResolvedValue(mockAsignaciones);

      const result = await institucionUsuarioService.listUsuariosInstitucion();

      expect(result).toHaveLength(2);
      expect(result[0]!.usuario.username).toBe('usuario1');
      expect(result[1]!.usuario.username).toBe('usuario2');
      expect(prisma.institucionusuario.findMany).toHaveBeenCalledWith({
        where: {
          institucion_id: mockInstitucion.id,
          activo: true,
        },
        include: {
          usuario_institucionusuario_usuario_idTousuario: {
            select: {
              id: true,
              username: true,
              email: true,
              nombres: true,
              apellidos: true,
              dni: true,
              cargo: true,
              activo: true,
            },
          },
        },
        orderBy: {
          fechaasignacion: 'desc',
        },
      });
    });

    it('debe lanzar error si no existe institución activa', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(institucionUsuarioService.listUsuariosInstitucion()).rejects.toThrow(
        'No se encontró institución activa'
      );
    });

    it('debe retornar array vacío si no hay usuarios asignados', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.institucionusuario.findMany as jest.Mock).mockResolvedValue([]);

      const result = await institucionUsuarioService.listUsuariosInstitucion();

      expect(result).toEqual([]);
    });
  });

  describe('asignarUsuario', () => {
    const mockUsuario = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      passwordhash: 'hash',
      dni: '12345678',
      nombres: 'Test',
      apellidos: 'User',
      telefono: null,
      cargo: 'Docente',
      activo: true,
      bloqueado: false,
      intentosfallidos: 0,
      cambiarpassword: false,
      fechacreacion: new Date(),
      fechaactualizacion: new Date(),
      ultimoacceso: null,
      fechabloqueo: null,
    };

    it('debe asignar un usuario a la institución', async () => {
      const mockAsignacion = {
        id: 'asig-new',
        institucion_id: mockInstitucion.id,
        usuario_id: mockUsuario.id,
        fechaasignacion: new Date(),
        activo: true,
        usuarioasigno_id: null,
      };

      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(mockUsuario);
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.institucionusuario.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.institucionusuario.create as jest.Mock).mockResolvedValue(mockAsignacion);

      const result = await institucionUsuarioService.asignarUsuario(mockUsuario.id);

      expect(result.usuarioId).toBe(mockUsuario.id);
      expect(result.institucionId).toBe(mockInstitucion.id);
      expect(result.activo).toBe(true);
      expect(prisma.institucionusuario.create).toHaveBeenCalledWith({
        data: {
          institucion_id: mockInstitucion.id,
          usuario_id: mockUsuario.id,
          activo: true,
        },
      });
    });

    it('debe lanzar error si el usuario no existe', async () => {
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(institucionUsuarioService.asignarUsuario('inexistente')).rejects.toThrow(
        'Usuario no encontrado'
      );
    });

    it('debe lanzar error si no existe institución activa', async () => {
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(mockUsuario);
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(institucionUsuarioService.asignarUsuario(mockUsuario.id)).rejects.toThrow(
        'No se encontró institución activa'
      );
    });

    it('debe lanzar error si el usuario ya está asignado activamente', async () => {
      const mockExistingAsignacion = {
        id: 'asig-existing',
        institucion_id: mockInstitucion.id,
        usuario_id: mockUsuario.id,
        fechaasignacion: new Date(),
        activo: true,
        usuarioasigno_id: null,
      };

      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(mockUsuario);
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.institucionusuario.findFirst as jest.Mock).mockResolvedValue(mockExistingAsignacion);

      await expect(institucionUsuarioService.asignarUsuario(mockUsuario.id)).rejects.toThrow(
        'El usuario ya está asignado a esta institución'
      );
    });

    it('debe reactivar una asignación inactiva', async () => {
      const mockInactiveAsignacion = {
        id: 'asig-inactive',
        institucion_id: mockInstitucion.id,
        usuario_id: mockUsuario.id,
        fechaasignacion: new Date('2023-01-01'),
        activo: false,
        usuarioasigno_id: null,
      };

      const mockReactivated = {
        ...mockInactiveAsignacion,
        activo: true,
        fechaasignacion: new Date(),
      };

      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(mockUsuario);
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.institucionusuario.findFirst as jest.Mock).mockResolvedValue(mockInactiveAsignacion);
      (prisma.institucionusuario.update as jest.Mock).mockResolvedValue(mockReactivated);

      const result = await institucionUsuarioService.asignarUsuario(mockUsuario.id);

      expect(result.activo).toBe(true);
      expect(prisma.institucionusuario.update).toHaveBeenCalledWith({
        where: { id: mockInactiveAsignacion.id },
        data: {
          activo: true,
          fechaasignacion: expect.any(Date),
        },
      });
    });
  });

  describe('removerUsuario', () => {
    const mockUsuario = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      passwordhash: 'hash',
      dni: '12345678',
      nombres: 'Test',
      apellidos: 'User',
      telefono: null,
      cargo: 'Docente',
      activo: true,
      bloqueado: false,
      intentosfallidos: 0,
      cambiarpassword: false,
      fechacreacion: new Date(),
      fechaactualizacion: new Date(),
      ultimoacceso: null,
      fechabloqueo: null,
    };

    it('debe remover un usuario de la institución', async () => {
      const mockAsignacion = {
        id: 'asig-123',
        institucion_id: mockInstitucion.id,
        usuario_id: mockUsuario.id,
        fechaasignacion: new Date(),
        activo: true,
        usuarioasigno_id: null,
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.institucionusuario.findFirst as jest.Mock).mockResolvedValue(mockAsignacion);
      (prisma.institucionusuario.update as jest.Mock).mockResolvedValue({
        ...mockAsignacion,
        activo: false,
      });
      (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(mockUsuario);

      await institucionUsuarioService.removerUsuario(mockUsuario.id);

      expect(prisma.institucionusuario.update).toHaveBeenCalledWith({
        where: { id: mockAsignacion.id },
        data: { activo: false },
      });
    });

    it('debe lanzar error si no existe institución activa', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(institucionUsuarioService.removerUsuario(mockUsuario.id)).rejects.toThrow(
        'No se encontró institución activa'
      );
    });

    it('debe lanzar error si el usuario no está asignado', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.institucionusuario.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(institucionUsuarioService.removerUsuario(mockUsuario.id)).rejects.toThrow(
        'El usuario no está asignado a esta institución'
      );
    });

    it('debe lanzar error si el usuario ya fue removido', async () => {
      const mockInactiveAsignacion = {
        id: 'asig-123',
        institucion_id: mockInstitucion.id,
        usuario_id: mockUsuario.id,
        fechaasignacion: new Date(),
        activo: false,
        usuarioasigno_id: null,
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.institucionusuario.findFirst as jest.Mock)
        .mockResolvedValueOnce(null); // findFirst busca activo: true

      await expect(institucionUsuarioService.removerUsuario(mockUsuario.id)).rejects.toThrow(
        'El usuario no está asignado a esta institución'
      );
    });
  });
});
