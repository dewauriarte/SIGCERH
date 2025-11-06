/**
 * Tests unitarios para ConfiguracionService
 */

import { ConfiguracionService } from '../configuracion.service';
import { PrismaClient } from '@prisma/client';

// Mock de Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    configuracioninstitucion: {
      findFirst: jest.fn(),
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

describe('ConfiguracionService', () => {
  let configuracionService: ConfiguracionService;
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    configuracionService = new ConfiguracionService();
    prisma = new PrismaClient();
  });

  describe('getConfiguracion', () => {
    it('debe retornar la configuración activa', async () => {
      const mockConfig = {
        id: 'config-id-123',
        nombre: 'Institución Educativa Test',
        codigomodular: '123456',
        direccion: 'Av. Test 123',
        telefono: '987654321',
        email: 'test@ie.edu',
        logo_url: 'https://example.com/logo.png',
        activo: true,
        fechaactualizacion: new Date('2024-01-01'),
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockConfig);

      const result = await configuracionService.getConfiguracion();

      expect(result).toBeDefined();
      expect(result.id).toBe(mockConfig.id);
      expect(result.nombre).toBe(mockConfig.nombre);
      expect(result.codigoModular).toBe(mockConfig.codigomodular);
      expect(result.direccion).toBe(mockConfig.direccion);
      expect(result.telefono).toBe(mockConfig.telefono);
      expect(result.email).toBe(mockConfig.email);
      expect(result.logoUrl).toBe(mockConfig.logo_url);
      expect(result.activo).toBe(true);
      expect(prisma.configuracioninstitucion.findFirst).toHaveBeenCalledWith({
        where: { activo: true },
        orderBy: { fechaactualizacion: 'desc' },
      });
    });

    it('debe lanzar error si no existe configuración activa', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(configuracionService.getConfiguracion()).rejects.toThrow(
        'No se encontró configuración institucional activa'
      );
    });
  });

  describe('updateConfiguracion', () => {
    const mockExistingConfig = {
      id: 'config-id-123',
      nombre: 'Institución Vieja',
      codigomodular: '123456',
      direccion: 'Dirección Vieja',
      telefono: '111111111',
      email: 'viejo@ie.edu',
      logo_url: null,
      activo: true,
      fechaactualizacion: new Date('2024-01-01'),
    };

    it('debe actualizar la configuración correctamente', async () => {
      const updateData = {
        nombre: 'Institución Nueva',
        direccion: 'Dirección Nueva',
        telefono: '999999999',
      };

      const mockUpdated = {
        ...mockExistingConfig,
        ...updateData,
        fechaactualizacion: new Date(),
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockExistingConfig);
      (prisma.configuracioninstitucion.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await configuracionService.updateConfiguracion(updateData);

      expect(result.nombre).toBe(updateData.nombre);
      expect(result.direccion).toBe(updateData.direccion);
      expect(result.telefono).toBe(updateData.telefono);
      expect(prisma.configuracioninstitucion.update).toHaveBeenCalledWith({
        where: { id: mockExistingConfig.id },
        data: expect.objectContaining({
          nombre: updateData.nombre,
          direccion: updateData.direccion,
          telefono: updateData.telefono,
          fechaactualizacion: expect.any(Date),
        }),
      });
    });

    it('debe actualizar solo los campos proporcionados', async () => {
      const updateData = {
        nombre: 'Solo Nombre Nuevo',
      };

      const mockUpdated = {
        ...mockExistingConfig,
        nombre: updateData.nombre,
        fechaactualizacion: new Date(),
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockExistingConfig);
      (prisma.configuracioninstitucion.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await configuracionService.updateConfiguracion(updateData);

      expect(result.nombre).toBe(updateData.nombre);
      // Los demás campos deben mantenerse del mock
      expect(prisma.configuracioninstitucion.update).toHaveBeenCalledWith({
        where: { id: mockExistingConfig.id },
        data: expect.objectContaining({
          nombre: updateData.nombre,
        }),
      });
    });

    it('debe actualizar el email', async () => {
      const updateData = {
        email: 'nuevo@ie.edu',
      };

      const mockUpdated = {
        ...mockExistingConfig,
        email: updateData.email,
        fechaactualizacion: new Date(),
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockExistingConfig);
      (prisma.configuracioninstitucion.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await configuracionService.updateConfiguracion(updateData);

      expect(result.email).toBe(updateData.email);
    });

    it('debe lanzar error si no existe configuración activa', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        configuracionService.updateConfiguracion({ nombre: 'Test' })
      ).rejects.toThrow('No se encontró configuración institucional activa');
    });

    it('debe actualizar todos los campos incluyendo código modular', async () => {
      const updateData = {
        nombre: 'Nueva Institución',
        codigoModular: '999999',
        direccion: 'Nueva Dirección',
        telefono: '888888888',
        email: 'nueva@ie.edu',
        logoUrl: 'https://example.com/nuevo-logo.png',
      };

      const mockUpdated = {
        id: mockExistingConfig.id,
        nombre: updateData.nombre,
        codigomodular: updateData.codigoModular,
        direccion: updateData.direccion,
        telefono: updateData.telefono,
        email: updateData.email,
        logo_url: updateData.logoUrl,
        activo: true,
        fechaactualizacion: new Date(),
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockExistingConfig);
      (prisma.configuracioninstitucion.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await configuracionService.updateConfiguracion(updateData);

      expect(result.codigoModular).toBe(updateData.codigoModular);
      expect(result.logoUrl).toBe(updateData.logoUrl);
    });
  });

  describe('updateLogo', () => {
    const mockConfig = {
      id: 'config-id-123',
      nombre: 'Institución Test',
      codigomodular: '123456',
      direccion: 'Test',
      telefono: '111111111',
      email: 'test@ie.edu',
      logo_url: null,
      activo: true,
      fechaactualizacion: new Date('2024-01-01'),
    };

    it('debe actualizar el logo correctamente', async () => {
      const newLogoUrl = 'https://example.com/logo-nuevo.png';

      const mockUpdated = {
        ...mockConfig,
        logo_url: newLogoUrl,
        fechaactualizacion: new Date(),
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockConfig);
      (prisma.configuracioninstitucion.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await configuracionService.updateLogo(newLogoUrl);

      expect(result.logoUrl).toBe(newLogoUrl);
      expect(result.id).toBe(mockConfig.id);
      expect(prisma.configuracioninstitucion.update).toHaveBeenCalledWith({
        where: { id: mockConfig.id },
        data: {
          logo_url: newLogoUrl,
          fechaactualizacion: expect.any(Date),
        },
      });
    });

    it('debe lanzar error si no existe configuración activa', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        configuracionService.updateLogo('https://example.com/logo.png')
      ).rejects.toThrow('No se encontró configuración institucional activa');
    });

    it('debe actualizar el logo incluso si ya existe uno', async () => {
      const oldLogoUrl = 'https://example.com/logo-viejo.png';
      const newLogoUrl = 'https://example.com/logo-nuevo.png';

      const mockConfigWithLogo = {
        ...mockConfig,
        logo_url: oldLogoUrl,
      };

      const mockUpdated = {
        ...mockConfigWithLogo,
        logo_url: newLogoUrl,
        fechaactualizacion: new Date(),
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockConfigWithLogo);
      (prisma.configuracioninstitucion.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await configuracionService.updateLogo(newLogoUrl);

      expect(result.logoUrl).toBe(newLogoUrl);
      expect(result.logoUrl).not.toBe(oldLogoUrl);
    });
  });
});
