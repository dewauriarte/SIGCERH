/**
 * Tests unitarios para AreasCurricularesService
 */

import { AreasCurricularesService } from '../areas-curriculares.service';
import { PrismaClient } from '@prisma/client';

// Mock de Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    configuracioninstitucion: {
      findFirst: jest.fn(),
    },
    areacurricular: {
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

describe('AreasCurricularesService', () => {
  let areasCurricularesService: AreasCurricularesService;
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
    areasCurricularesService = new AreasCurricularesService();
    prisma = new PrismaClient();
  });

  describe('list', () => {
    const mockAreas = [
      {
        id: 'area-1',
        codigo: 'MAT',
        nombre: 'Matemática',
        orden: 1,
        escompetenciatransversal: false,
        activo: true,
        institucion_id: mockInstitucion.id,
      },
      {
        id: 'area-2',
        codigo: 'COM',
        nombre: 'Comunicación',
        orden: 2,
        escompetenciatransversal: false,
        activo: true,
        institucion_id: mockInstitucion.id,
      },
      {
        id: 'area-3',
        codigo: 'ING',
        nombre: 'Inglés',
        orden: 3,
        escompetenciatransversal: false,
        activo: false,
        institucion_id: mockInstitucion.id,
      },
    ];

    it('debe listar todas las áreas curriculares', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.areacurricular.findMany as jest.Mock).mockResolvedValue(mockAreas);

      const result = await areasCurricularesService.list();

      expect(result).toHaveLength(3);
      expect(result[0]!.codigo).toBe('MAT');
      expect(result[1]!.codigo).toBe('COM');
    });

    it('debe listar solo áreas activas cuando activoOnly es true', async () => {
      const areasActivas = mockAreas.filter(a => a.activo);
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.areacurricular.findMany as jest.Mock).mockResolvedValue(areasActivas);

      const result = await areasCurricularesService.list(true);

      expect(result).toHaveLength(2);
      expect(result.every(a => a.activo)).toBe(true);
    });

    it('debe lanzar error si no existe institución activa', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(areasCurricularesService.list()).rejects.toThrow(
        'No se encontró institución activa'
      );
    });
  });

  describe('getById', () => {
    it('debe retornar un área curricular por ID', async () => {
      const mockArea = {
        id: 'area-1',
        codigo: 'MAT',
        nombre: 'Matemática',
        orden: 1,
        escompetenciatransversal: false,
        activo: true,
        institucion_id: mockInstitucion.id,
      };

      (prisma.areacurricular.findUnique as jest.Mock).mockResolvedValue(mockArea);

      const result = await areasCurricularesService.getById('area-1');

      expect(result.codigo).toBe('MAT');
      expect(result.nombre).toBe('Matemática');
    });

    it('debe lanzar error si el área no existe', async () => {
      (prisma.areacurricular.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(areasCurricularesService.getById('inexistente')).rejects.toThrow(
        'Área curricular no encontrada'
      );
    });
  });

  describe('create', () => {
    it('debe crear una nueva área curricular', async () => {
      const createData = {
        codigo: 'CTA',
        nombre: 'Ciencia, Tecnología y Ambiente',
        orden: 4,
        esCompetenciaTransversal: false,
      };

      const mockCreated = {
        id: 'area-new',
        codigo: 'CTA',
        nombre: 'Ciencia, Tecnología y Ambiente',
        orden: 4,
        escompetenciatransversal: false,
        activo: true,
        institucion_id: mockInstitucion.id,
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.areacurricular.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.areacurricular.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await areasCurricularesService.create(createData);

      expect(result.codigo).toBe('CTA');
      expect(result.activo).toBe(true);
    });

    it('debe generar orden automático si no se proporciona', async () => {
      const createData = {
        codigo: 'ART',
        nombre: 'Arte',
      };

      const mockCreated = {
        id: 'area-new',
        codigo: 'ART',
        nombre: 'Arte',
        orden: 13,
        escompetenciatransversal: false,
        activo: true,
        institucion_id: mockInstitucion.id,
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.areacurricular.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.areacurricular.aggregate as jest.Mock).mockResolvedValue({ _max: { orden: 12 } });
      (prisma.areacurricular.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await areasCurricularesService.create(createData);

      expect(result.orden).toBe(13);
    });

    it('debe rechazar código duplicado', async () => {
      const createData = {
        codigo: 'MAT',
        nombre: 'Matemática Duplicada',
      };

      const mockExisting = {
        id: 'area-existing',
        codigo: 'MAT',
        nombre: 'Matemática',
        orden: 1,
        escompetenciatransversal: false,
        activo: true,
        institucion_id: mockInstitucion.id,
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.areacurricular.findFirst as jest.Mock).mockResolvedValue(mockExisting);

      await expect(areasCurricularesService.create(createData)).rejects.toThrow(
        'Ya existe un área curricular con el código MAT'
      );
    });

    it('debe crear área como competencia transversal', async () => {
      const createData = {
        codigo: 'TRANS',
        nombre: 'Competencia Transversal',
        orden: 99,
        esCompetenciaTransversal: true,
      };

      const mockCreated = {
        id: 'area-new',
        codigo: 'TRANS',
        nombre: 'Competencia Transversal',
        orden: 99,
        escompetenciatransversal: true,
        activo: true,
        institucion_id: mockInstitucion.id,
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.areacurricular.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.areacurricular.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await areasCurricularesService.create(createData);

      expect(result.esCompetenciaTransversal).toBe(true);
    });
  });

  describe('update', () => {
    const mockExisting = {
      id: 'area-1',
      codigo: 'MAT',
      nombre: 'Matemática',
      orden: 1,
      escompetenciatransversal: false,
      activo: true,
      institucion_id: mockInstitucion.id,
    };

    it('debe actualizar un área curricular', async () => {
      const updateData = {
        nombre: 'Matemáticas',
        orden: 10,
        activo: false,
      };

      const mockUpdated = {
        ...mockExisting,
        nombre: updateData.nombre,
        orden: updateData.orden,
        activo: updateData.activo,
      };

      (prisma.areacurricular.findUnique as jest.Mock).mockResolvedValue(mockExisting);
      (prisma.areacurricular.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await areasCurricularesService.update('area-1', updateData);

      expect(result.nombre).toBe('Matemáticas');
      expect(result.orden).toBe(10);
      expect(result.activo).toBe(false);
    });

    it('debe lanzar error si el área no existe', async () => {
      (prisma.areacurricular.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        areasCurricularesService.update('inexistente', { nombre: 'Test' })
      ).rejects.toThrow('Área curricular no encontrada');
    });

    it('debe rechazar código duplicado al actualizar', async () => {
      const otraArea = {
        id: 'area-2',
        codigo: 'COM',
        nombre: 'Comunicación',
        orden: 2,
        escompetenciatransversal: false,
        activo: true,
        institucion_id: mockInstitucion.id,
      };

      (prisma.areacurricular.findUnique as jest.Mock).mockResolvedValue(mockExisting);
      (prisma.areacurricular.findFirst as jest.Mock).mockResolvedValue(otraArea);

      await expect(
        areasCurricularesService.update('area-1', { codigo: 'COM' })
      ).rejects.toThrow('Ya existe otra área curricular con el código COM');
    });

    it('debe actualizar esCompetenciaTransversal', async () => {
      const updateData = {
        esCompetenciaTransversal: true,
      };

      const mockUpdated = {
        ...mockExisting,
        escompetenciatransversal: true,
      };

      (prisma.areacurricular.findUnique as jest.Mock).mockResolvedValue(mockExisting);
      (prisma.areacurricular.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await areasCurricularesService.update('area-1', updateData);

      expect(result.esCompetenciaTransversal).toBe(true);
    });
  });

  describe('delete', () => {
    it('debe desactivar un área curricular (soft delete)', async () => {
      const mockArea = {
        id: 'area-1',
        codigo: 'MAT',
        nombre: 'Matemática',
        orden: 1,
        escompetenciatransversal: false,
        activo: true,
        institucion_id: mockInstitucion.id,
      };

      (prisma.areacurricular.findUnique as jest.Mock).mockResolvedValue(mockArea);
      (prisma.areacurricular.update as jest.Mock).mockResolvedValue({ ...mockArea, activo: false });

      await areasCurricularesService.delete('area-1');

      expect(prisma.areacurricular.update).toHaveBeenCalledWith({
        where: { id: 'area-1' },
        data: { activo: false },
      });
    });

    it('debe lanzar error si el área no existe', async () => {
      (prisma.areacurricular.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(areasCurricularesService.delete('inexistente')).rejects.toThrow(
        'Área curricular no encontrada'
      );
    });
  });
});
