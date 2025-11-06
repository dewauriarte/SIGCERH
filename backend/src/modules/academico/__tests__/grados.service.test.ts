/**
 * Tests unitarios para GradosService
 */

import { GradosService } from '../grados.service';
import { PrismaClient } from '@prisma/client';

// Mock de Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    configuracioninstitucion: {
      findFirst: jest.fn(),
    },
    niveleducativo: {
      findUnique: jest.fn(),
    },
    grado: {
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

describe('GradosService', () => {
  let gradosService: GradosService;
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

  const mockNivelSecundaria = {
    id: 'nivel-sec',
    codigo: 'SEC',
    nombre: 'Secundaria',
    descripcion: 'Nivel Secundaria',
    orden: 3,
    activo: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    gradosService = new GradosService();
    prisma = new PrismaClient();
  });

  describe('list', () => {
    const mockGrados = [
      {
        id: 'grado-1',
        numero: 1,
        nombre: '1ro Secundaria',
        nombrecorto: '1ro',
        orden: 1,
        activo: true,
        institucion_id: mockInstitucion.id,
        nivel_id: mockNivelSecundaria.id,
        niveleducativo: mockNivelSecundaria,
      },
      {
        id: 'grado-2',
        numero: 5,
        nombre: '5to Secundaria',
        nombrecorto: '5to',
        orden: 5,
        activo: true,
        institucion_id: mockInstitucion.id,
        nivel_id: mockNivelSecundaria.id,
        niveleducativo: mockNivelSecundaria,
      },
    ];

    it('debe listar todos los grados', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.grado.findMany as jest.Mock).mockResolvedValue(mockGrados);

      const result = await gradosService.list();

      expect(result).toHaveLength(2);
      expect(result[0]!.numero).toBe(1);
      expect(result[1]!.numero).toBe(5);
    });

    it('debe filtrar por nivel educativo', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.grado.findMany as jest.Mock).mockResolvedValue(mockGrados);

      await gradosService.list(mockNivelSecundaria.id);

      expect(prisma.grado.findMany).toHaveBeenCalledWith({
        where: {
          institucion_id: mockInstitucion.id,
          nivel_id: mockNivelSecundaria.id,
        },
        include: {
          niveleducativo: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
            },
          },
        },
        orderBy: { orden: 'asc' },
      });
    });

    it('debe listar solo grados activos cuando activoOnly es true', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.grado.findMany as jest.Mock).mockResolvedValue([mockGrados[0]]);

      await gradosService.list(undefined, true);

      expect(prisma.grado.findMany).toHaveBeenCalledWith({
        where: {
          institucion_id: mockInstitucion.id,
          activo: true,
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });

    it('debe lanzar error si no existe institución activa', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(gradosService.list()).rejects.toThrow(
        'No se encontró institución activa'
      );
    });
  });

  describe('getById', () => {
    it('debe retornar un grado por ID', async () => {
      const mockGrado = {
        id: 'grado-1',
        numero: 3,
        nombre: '3ro Secundaria',
        nombrecorto: '3ro',
        orden: 3,
        activo: true,
        institucion_id: mockInstitucion.id,
        nivel_id: mockNivelSecundaria.id,
        niveleducativo: mockNivelSecundaria,
      };

      (prisma.grado.findUnique as jest.Mock).mockResolvedValue(mockGrado);

      const result = await gradosService.getById('grado-1');

      expect(result.numero).toBe(3);
      expect(result.nombre).toBe('3ro Secundaria');
      expect(result.nivelEducativo?.codigo).toBe('SEC');
    });

    it('debe lanzar error si el grado no existe', async () => {
      (prisma.grado.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(gradosService.getById('inexistente')).rejects.toThrow(
        'Grado no encontrado'
      );
    });
  });

  describe('create', () => {
    it('debe crear un nuevo grado', async () => {
      const createData = {
        numero: 4,
        nombre: '4to Secundaria',
        nombreCorto: '4to',
        orden: 4,
        nivelEducativoId: mockNivelSecundaria.id,
      };

      const mockCreated = {
        id: 'grado-new',
        numero: 4,
        nombre: '4to Secundaria',
        nombrecorto: '4to',
        orden: 4,
        activo: true,
        institucion_id: mockInstitucion.id,
        nivel_id: mockNivelSecundaria.id,
        niveleducativo: mockNivelSecundaria,
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.niveleducativo.findUnique as jest.Mock).mockResolvedValue(mockNivelSecundaria);
      (prisma.grado.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.grado.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await gradosService.create(createData);

      expect(result.numero).toBe(4);
      expect(result.activo).toBe(true);
    });

    it('debe generar orden automático si no se proporciona', async () => {
      const createData = {
        numero: 2,
        nombre: '2do Secundaria',
        nombreCorto: '2do',
        nivelEducativoId: mockNivelSecundaria.id,
      };

      const mockCreated = {
        id: 'grado-new',
        numero: 2,
        nombre: '2do Secundaria',
        nombrecorto: '2do',
        orden: 6,
        activo: true,
        institucion_id: mockInstitucion.id,
        nivel_id: mockNivelSecundaria.id,
        niveleducativo: mockNivelSecundaria,
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.niveleducativo.findUnique as jest.Mock).mockResolvedValue(mockNivelSecundaria);
      (prisma.grado.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.grado.aggregate as jest.Mock).mockResolvedValue({ _max: { orden: 5 } });
      (prisma.grado.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await gradosService.create(createData);

      expect(result.orden).toBe(6);
    });

    it('debe rechazar grado duplicado', async () => {
      const createData = {
        numero: 1,
        nombre: '1ro Secundaria',
      };

      const mockExisting = {
        id: 'grado-existing',
        numero: 1,
        nombre: '1ro Secundaria',
        nombrecorto: '1ro',
        orden: 1,
        activo: true,
        institucion_id: mockInstitucion.id,
        nivel_id: null,
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.grado.findFirst as jest.Mock).mockResolvedValue(mockExisting);

      await expect(gradosService.create(createData)).rejects.toThrow(
        'Ya existe un grado con el número 1'
      );
    });

    it('debe lanzar error si el nivel educativo no existe', async () => {
      const createData = {
        numero: 1,
        nombre: '1ro Secundaria',
        nivelEducativoId: 'nivel-inexistente',
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.niveleducativo.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(gradosService.create(createData)).rejects.toThrow(
        'Nivel educativo no encontrado'
      );
    });
  });

  describe('update', () => {
    const mockExisting = {
      id: 'grado-1',
      numero: 3,
      nombre: '3ro Secundaria',
      nombrecorto: '3ro',
      orden: 3,
      activo: true,
      institucion_id: mockInstitucion.id,
      nivel_id: mockNivelSecundaria.id,
    };

    it('debe actualizar un grado', async () => {
      const updateData = {
        nombre: '3er Secundaria',
        activo: false,
      };

      const mockUpdated = {
        ...mockExisting,
        nombre: updateData.nombre,
        activo: updateData.activo,
        niveleducativo: mockNivelSecundaria,
      };

      (prisma.grado.findUnique as jest.Mock).mockResolvedValue(mockExisting);
      (prisma.grado.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await gradosService.update('grado-1', updateData);

      expect(result.nombre).toBe('3er Secundaria');
      expect(result.activo).toBe(false);
    });

    it('debe lanzar error si el grado no existe', async () => {
      (prisma.grado.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        gradosService.update('inexistente', { nombre: 'Test' })
      ).rejects.toThrow('Grado no encontrado');
    });

    it('debe rechazar número duplicado al actualizar', async () => {
      const otroGrado = {
        id: 'grado-2',
        numero: 5,
        nombre: '5to Secundaria',
        nombrecorto: '5to',
        orden: 5,
        activo: true,
        institucion_id: mockInstitucion.id,
        nivel_id: mockNivelSecundaria.id,
      };

      (prisma.grado.findUnique as jest.Mock).mockResolvedValue(mockExisting);
      (prisma.grado.findFirst as jest.Mock).mockResolvedValue(otroGrado);

      await expect(
        gradosService.update('grado-1', { numero: 5 })
      ).rejects.toThrow('Ya existe otro grado con el número 5');
    });
  });

  describe('delete', () => {
    it('debe desactivar un grado (soft delete)', async () => {
      const mockGrado = {
        id: 'grado-1',
        numero: 3,
        nombre: '3ro Secundaria',
        nombrecorto: '3ro',
        orden: 3,
        activo: true,
        institucion_id: mockInstitucion.id,
        nivel_id: mockNivelSecundaria.id,
      };

      (prisma.grado.findUnique as jest.Mock).mockResolvedValue(mockGrado);
      (prisma.grado.update as jest.Mock).mockResolvedValue({ ...mockGrado, activo: false });

      await gradosService.delete('grado-1');

      expect(prisma.grado.update).toHaveBeenCalledWith({
        where: { id: 'grado-1' },
        data: { activo: false },
      });
    });

    it('debe lanzar error si el grado no existe', async () => {
      (prisma.grado.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(gradosService.delete('inexistente')).rejects.toThrow(
        'Grado no encontrado'
      );
    });
  });

  describe('getByNumero', () => {
    it('debe retornar un grado por número', async () => {
      const mockGrado = {
        id: 'grado-5',
        numero: 5,
        nombre: '5to Secundaria',
        nombrecorto: '5to',
        orden: 5,
        activo: true,
        institucion_id: mockInstitucion.id,
        nivel_id: mockNivelSecundaria.id,
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.grado.findFirst as jest.Mock).mockResolvedValue(mockGrado);

      const result = await gradosService.getByNumero(5);

      expect(result.numero).toBe(5);
      expect(result.nombreCorto).toBe('5to');
    });

    it('debe lanzar error si el grado no existe', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.grado.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(gradosService.getByNumero(99)).rejects.toThrow(
        'Grado 99 no encontrado'
      );
    });
  });
});
