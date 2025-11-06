/**
 * Tests unitarios para NivelesService
 */

import { NivelesService } from '../niveles.service';
import { PrismaClient } from '@prisma/client';

// Mock de Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    niveleducativo: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
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

describe('NivelesService', () => {
  let nivelesService: NivelesService;
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    nivelesService = new NivelesService();
    prisma = new PrismaClient();
  });

  describe('list', () => {
    const mockNiveles = [
      {
        id: 'nivel-1',
        nombre: 'Inicial',
        codigo: 'INI',
        descripcion: 'Nivel Inicial',
        orden: 1,
        activo: true,
      },
      {
        id: 'nivel-2',
        nombre: 'Primaria',
        codigo: 'PRI',
        descripcion: 'Nivel Primaria',
        orden: 2,
        activo: true,
      },
      {
        id: 'nivel-3',
        nombre: 'Secundaria',
        codigo: 'SEC',
        descripcion: 'Nivel Secundaria',
        orden: 3,
        activo: false,
      },
    ];

    it('debe listar todos los niveles educativos', async () => {
      (prisma.niveleducativo.findMany as jest.Mock).mockResolvedValue(mockNiveles);

      const result = await nivelesService.list();

      expect(result).toHaveLength(3);
      expect(result[0]!.nombre).toBe('Inicial');
      expect(result[1]!.nombre).toBe('Primaria');
      expect(result[2]!.nombre).toBe('Secundaria');
      expect(prisma.niveleducativo.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { orden: 'asc' },
      });
    });

    it('debe listar solo niveles activos cuando activoOnly es true', async () => {
      const nivelesActivos = mockNiveles.filter(n => n.activo);
      (prisma.niveleducativo.findMany as jest.Mock).mockResolvedValue(nivelesActivos);

      const result = await nivelesService.list(true);

      expect(result).toHaveLength(2);
      expect(result.every(n => n.activo)).toBe(true);
      expect(prisma.niveleducativo.findMany).toHaveBeenCalledWith({
        where: { activo: true },
        orderBy: { orden: 'asc' },
      });
    });

    it('debe retornar array vacío si no hay niveles', async () => {
      (prisma.niveleducativo.findMany as jest.Mock).mockResolvedValue([]);

      const result = await nivelesService.list();

      expect(result).toEqual([]);
    });

    it('debe mapear correctamente los campos', async () => {
      (prisma.niveleducativo.findMany as jest.Mock).mockResolvedValue([mockNiveles[0]]);

      const result = await nivelesService.list();

      expect(result[0]).toEqual({
        id: mockNiveles[0]!.id,
        nombre: mockNiveles[0]!.nombre,
        codigo: mockNiveles[0]!.codigo,
        descripcion: mockNiveles[0]!.descripcion,
        orden: mockNiveles[0]!.orden,
        activo: mockNiveles[0]!.activo,
      });
    });
  });

  describe('getById', () => {
    const mockNivel = {
      id: 'nivel-1',
      nombre: 'Inicial',
      codigo: 'INI',
      descripcion: 'Nivel Inicial',
      orden: 1,
      activo: true,
    };

    it('debe retornar un nivel por ID', async () => {
      (prisma.niveleducativo.findUnique as jest.Mock).mockResolvedValue(mockNivel);

      const result = await nivelesService.getById('nivel-1');

      expect(result).toEqual({
        id: mockNivel.id,
        nombre: mockNivel.nombre,
        codigo: mockNivel.codigo,
        descripcion: mockNivel.descripcion,
        orden: mockNivel.orden,
        activo: mockNivel.activo,
      });
      expect(prisma.niveleducativo.findUnique).toHaveBeenCalledWith({
        where: { id: 'nivel-1' },
      });
    });

    it('debe lanzar error si el nivel no existe', async () => {
      (prisma.niveleducativo.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(nivelesService.getById('inexistente')).rejects.toThrow(
        'Nivel educativo no encontrado'
      );
    });
  });

  describe('create', () => {
    it('debe crear un nuevo nivel educativo', async () => {
      const createData = {
        nombre: 'Técnico Productivo',
        codigo: 'TEC',
        descripcion: 'Educación Técnico Productiva',
        orden: 4,
      };

      const mockCreated = {
        id: 'nivel-nuevo',
        ...createData,
        activo: true,
      };

      (prisma.niveleducativo.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.niveleducativo.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await nivelesService.create(createData);

      expect(result.nombre).toBe(createData.nombre);
      expect(result.codigo).toBe(createData.codigo);
      expect(result.orden).toBe(createData.orden);
      expect(result.activo).toBe(true);
      expect(prisma.niveleducativo.create).toHaveBeenCalledWith({
        data: {
          nombre: createData.nombre,
          codigo: createData.codigo,
          descripcion: createData.descripcion,
          orden: createData.orden,
          activo: true,
        },
      });
    });

    it('debe generar orden automático si no se proporciona', async () => {
      const createData = {
        nombre: 'Técnico Productivo',
        codigo: 'TEC',
      };

      const mockCreated = {
        id: 'nivel-nuevo',
        nombre: createData.nombre,
        codigo: createData.codigo,
        descripcion: null,
        orden: 5,
        activo: true,
      };

      (prisma.niveleducativo.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.niveleducativo.aggregate as jest.Mock).mockResolvedValue({
        _max: { orden: 4 },
      });
      (prisma.niveleducativo.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await nivelesService.create(createData);

      expect(result.orden).toBe(5);
      expect(prisma.niveleducativo.aggregate).toHaveBeenCalledWith({
        _max: { orden: true },
      });
    });

    it('debe lanzar error si el código ya existe', async () => {
      const createData = {
        nombre: 'Inicial',
        codigo: 'INI',
      };

      const mockExisting = {
        id: 'nivel-existente',
        nombre: 'Inicial Existente',
        codigo: 'INI',
        descripcion: null,
        orden: 1,
        activo: true,
      };

      (prisma.niveleducativo.findFirst as jest.Mock).mockResolvedValue(mockExisting);

      await expect(nivelesService.create(createData)).rejects.toThrow(
        'Ya existe un nivel educativo con el código INI'
      );
    });

    it('debe manejar orden 0 cuando no hay niveles previos', async () => {
      const createData = {
        nombre: 'Primer Nivel',
        codigo: 'PRI',
      };

      const mockCreated = {
        id: 'nivel-1',
        nombre: createData.nombre,
        codigo: createData.codigo,
        descripcion: null,
        orden: 1,
        activo: true,
      };

      (prisma.niveleducativo.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.niveleducativo.aggregate as jest.Mock).mockResolvedValue({
        _max: { orden: null },
      });
      (prisma.niveleducativo.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await nivelesService.create(createData);

      expect(result.orden).toBe(1);
    });
  });

  describe('update', () => {
    const mockExistingNivel = {
      id: 'nivel-1',
      nombre: 'Inicial',
      codigo: 'INI',
      descripcion: 'Nivel Inicial',
      orden: 1,
      activo: true,
    };

    it('debe actualizar un nivel educativo', async () => {
      const updateData = {
        nombre: 'Inicial Actualizado',
        descripcion: 'Nueva descripción',
      };

      const mockUpdated = {
        ...mockExistingNivel,
        ...updateData,
      };

      (prisma.niveleducativo.findUnique as jest.Mock).mockResolvedValue(mockExistingNivel);
      (prisma.niveleducativo.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await nivelesService.update('nivel-1', updateData);

      expect(result.nombre).toBe(updateData.nombre);
      expect(result.descripcion).toBe(updateData.descripcion);
      expect(prisma.niveleducativo.update).toHaveBeenCalledWith({
        where: { id: 'nivel-1' },
        data: expect.objectContaining(updateData),
      });
    });

    it('debe lanzar error si el nivel no existe', async () => {
      (prisma.niveleducativo.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        nivelesService.update('inexistente', { nombre: 'Test' })
      ).rejects.toThrow('Nivel educativo no encontrado');
    });

    it('debe permitir cambiar el código si no existe otro nivel con ese código', async () => {
      const updateData = {
        codigo: 'INI2',
      };

      const mockUpdated = {
        ...mockExistingNivel,
        codigo: updateData.codigo,
      };

      (prisma.niveleducativo.findUnique as jest.Mock).mockResolvedValue(mockExistingNivel);
      (prisma.niveleducativo.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.niveleducativo.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await nivelesService.update('nivel-1', updateData);

      expect(result.codigo).toBe(updateData.codigo);
    });

    it('debe lanzar error si se intenta cambiar a un código que ya existe', async () => {
      const updateData = {
        codigo: 'PRI',
      };

      const otroNivel = {
        id: 'nivel-2',
        nombre: 'Primaria',
        codigo: 'PRI',
        descripcion: null,
        orden: 2,
        activo: true,
      };

      (prisma.niveleducativo.findUnique as jest.Mock).mockResolvedValue(mockExistingNivel);
      (prisma.niveleducativo.findFirst as jest.Mock).mockResolvedValue(otroNivel);

      await expect(nivelesService.update('nivel-1', updateData)).rejects.toThrow(
        'Ya existe otro nivel educativo con el código PRI'
      );
    });

    it('debe actualizar el estado activo', async () => {
      const updateData = {
        activo: false,
      };

      const mockUpdated = {
        ...mockExistingNivel,
        activo: false,
      };

      (prisma.niveleducativo.findUnique as jest.Mock).mockResolvedValue(mockExistingNivel);
      (prisma.niveleducativo.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await nivelesService.update('nivel-1', updateData);

      expect(result.activo).toBe(false);
    });

    it('debe actualizar el orden', async () => {
      const updateData = {
        orden: 10,
      };

      const mockUpdated = {
        ...mockExistingNivel,
        orden: 10,
      };

      (prisma.niveleducativo.findUnique as jest.Mock).mockResolvedValue(mockExistingNivel);
      (prisma.niveleducativo.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await nivelesService.update('nivel-1', updateData);

      expect(result.orden).toBe(10);
    });
  });

  describe('delete', () => {
    const mockNivel = {
      id: 'nivel-1',
      nombre: 'Inicial',
      codigo: 'INI',
      descripcion: 'Nivel Inicial',
      orden: 1,
      activo: true,
    };

    it('debe desactivar un nivel educativo (soft delete)', async () => {
      (prisma.niveleducativo.findUnique as jest.Mock).mockResolvedValue(mockNivel);
      (prisma.niveleducativo.update as jest.Mock).mockResolvedValue({
        ...mockNivel,
        activo: false,
      });

      await nivelesService.delete('nivel-1');

      expect(prisma.niveleducativo.update).toHaveBeenCalledWith({
        where: { id: 'nivel-1' },
        data: {
          activo: false,
        },
      });
    });

    it('debe lanzar error si el nivel no existe', async () => {
      (prisma.niveleducativo.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(nivelesService.delete('inexistente')).rejects.toThrow(
        'Nivel educativo no encontrado'
      );
    });
  });
});
