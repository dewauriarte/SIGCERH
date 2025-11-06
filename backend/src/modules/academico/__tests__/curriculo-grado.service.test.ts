/**
 * Tests unitarios para CurriculoGradoService
 * Este es el servicio CRÍTICO para el sistema OCR de certificados
 */

import { CurriculoGradoService } from '../curriculo-grado.service';
import { PrismaClient } from '@prisma/client';

// Mock de Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    configuracioninstitucion: {
      findFirst: jest.fn(),
    },
    grado: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    aniolectivo: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    areacurricular: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    curriculogrado: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
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

describe('CurriculoGradoService', () => {
  let curriculoGradoService: CurriculoGradoService;
  let prisma: any;

  const mockInstitucion = {
    id: 'inst-123',
    nombre: 'IE Test',
    codigomodular: '123456',
    activo: true,
  };

  const mockGrado = {
    id: 'grado-5',
    numero: 5,
    nombre: '5to Secundaria',
    nombrecorto: '5to',
    orden: 5,
    activo: true,
    institucion_id: mockInstitucion.id,
  };

  const mockAnioLectivo = {
    id: 'anio-1990',
    anio: 1990,
    fechainicio: new Date('1990-03-01'),
    fechafin: new Date('1990-12-31'),
    activo: true,
    institucion_id: mockInstitucion.id,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    curriculoGradoService = new CurriculoGradoService();
    prisma = new PrismaClient();
  });

  describe('assignAreasToGrado', () => {
    const mockAreas = [
      {
        id: 'area-1',
        codigo: 'MAT',
        nombre: 'Matemática',
        orden: 1,
        activo: true,
        institucion_id: mockInstitucion.id,
      },
      {
        id: 'area-2',
        codigo: 'COM',
        nombre: 'Comunicación',
        orden: 2,
        activo: true,
        institucion_id: mockInstitucion.id,
      },
    ];

    it('debe asignar áreas a un grado y año', async () => {
      const assignData = {
        gradoId: mockGrado.id,
        anioLectivoId: mockAnioLectivo.id,
        areas: [
          { areaCurricularId: 'area-1', orden: 1 },
          { areaCurricularId: 'area-2', orden: 2 },
        ],
      };

      const mockCreatedCurriculos = [
        {
          id: 'curriculo-1',
          grado_id: mockGrado.id,
          aniolectivo_id: mockAnioLectivo.id,
          area_id: 'area-1',
          orden: 1,
          activo: true,
          areacurricular: mockAreas[0],
        },
        {
          id: 'curriculo-2',
          grado_id: mockGrado.id,
          aniolectivo_id: mockAnioLectivo.id,
          area_id: 'area-2',
          orden: 2,
          activo: true,
          areacurricular: mockAreas[1],
        },
      ];

      (prisma.grado.findUnique as jest.Mock).mockResolvedValue(mockGrado);
      (prisma.aniolectivo.findUnique as jest.Mock).mockResolvedValue(mockAnioLectivo);
      (prisma.areacurricular.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAreas[0])
        .mockResolvedValueOnce(mockAreas[1]);
      (prisma.curriculogrado.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.curriculogrado.create as jest.Mock)
        .mockResolvedValueOnce(mockCreatedCurriculos[0])
        .mockResolvedValueOnce(mockCreatedCurriculos[1]);

      const result = await curriculoGradoService.assignAreasToGrado(assignData);

      expect(result).toHaveLength(2);
      expect(result[0]!.area.codigo).toBe('MAT');
      expect(result[1]!.area.codigo).toBe('COM');
      expect(prisma.curriculogrado.deleteMany).toHaveBeenCalledWith({
        where: {
          grado_id: mockGrado.id,
          aniolectivo_id: mockAnioLectivo.id,
        },
      });
    });

    it('debe lanzar error si el grado no existe', async () => {
      (prisma.grado.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        curriculoGradoService.assignAreasToGrado({
          gradoId: 'inexistente',
          anioLectivoId: mockAnioLectivo.id,
          areas: [],
        })
      ).rejects.toThrow('Grado no encontrado');
    });

    it('debe lanzar error si el año lectivo no existe', async () => {
      (prisma.grado.findUnique as jest.Mock).mockResolvedValue(mockGrado);
      (prisma.aniolectivo.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        curriculoGradoService.assignAreasToGrado({
          gradoId: mockGrado.id,
          anioLectivoId: 'inexistente',
          areas: [],
        })
      ).rejects.toThrow('Año lectivo no encontrado');
    });

    it('debe lanzar error si un área no existe', async () => {
      (prisma.grado.findUnique as jest.Mock).mockResolvedValue(mockGrado);
      (prisma.aniolectivo.findUnique as jest.Mock).mockResolvedValue(mockAnioLectivo);
      (prisma.areacurricular.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        curriculoGradoService.assignAreasToGrado({
          gradoId: mockGrado.id,
          anioLectivoId: mockAnioLectivo.id,
          areas: [{ areaCurricularId: 'area-inexistente', orden: 1 }],
        })
      ).rejects.toThrow('Área curricular area-inexistente no encontrada');
    });

    it('debe lanzar error si un área está inactiva', async () => {
      const areaInactiva = {
        ...mockAreas[0],
        activo: false,
      };

      (prisma.grado.findUnique as jest.Mock).mockResolvedValue(mockGrado);
      (prisma.aniolectivo.findUnique as jest.Mock).mockResolvedValue(mockAnioLectivo);
      (prisma.areacurricular.findUnique as jest.Mock).mockResolvedValue(areaInactiva);

      await expect(
        curriculoGradoService.assignAreasToGrado({
          gradoId: mockGrado.id,
          anioLectivoId: mockAnioLectivo.id,
          areas: [{ areaCurricularId: 'area-1', orden: 1 }],
        })
      ).rejects.toThrow('El área Matemática no está activa');
    });
  });

  describe('getPlantillaByAnioGrado - ⭐ CRÍTICO PARA OCR ⭐', () => {
    const mockAreas = [
      { id: 'area-1', codigo: 'MAT', nombre: 'Matemática', orden: 1, activo: true, institucion_id: mockInstitucion.id },
      { id: 'area-2', codigo: 'COM', nombre: 'Comunicación', orden: 2, activo: true, institucion_id: mockInstitucion.id },
      { id: 'area-3', codigo: 'ING', nombre: 'Inglés', orden: 3, activo: true, institucion_id: mockInstitucion.id },
    ];

    const mockCurriculo = [
      {
        id: 'curriculo-1',
        grado_id: mockGrado.id,
        aniolectivo_id: mockAnioLectivo.id,
        area_id: 'area-1',
        orden: 1,
        activo: true,
        areacurricular: mockAreas[0],
      },
      {
        id: 'curriculo-2',
        grado_id: mockGrado.id,
        aniolectivo_id: mockAnioLectivo.id,
        area_id: 'area-2',
        orden: 2,
        activo: true,
        areacurricular: mockAreas[1],
      },
      {
        id: 'curriculo-3',
        grado_id: mockGrado.id,
        aniolectivo_id: mockAnioLectivo.id,
        area_id: 'area-3',
        orden: 3,
        activo: true,
        areacurricular: mockAreas[2],
      },
    ];

    it('debe retornar la plantilla configurada para un año y grado', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.aniolectivo.findFirst as jest.Mock).mockResolvedValue(mockAnioLectivo);
      (prisma.grado.findFirst as jest.Mock).mockResolvedValue(mockGrado);
      (prisma.curriculogrado.findMany as jest.Mock).mockResolvedValue(mockCurriculo);

      const result = await curriculoGradoService.getPlantillaByAnioGrado(1990, 5);

      expect(result).toHaveLength(3);
      expect(result[0]!.codigo).toBe('MAT');
      expect(result[0]!.nombre).toBe('Matemática');
      expect(result[0]!.orden).toBe(1);
      expect(result[1]!.codigo).toBe('COM');
      expect(result[2]!.codigo).toBe('ING');
    });

    it('debe retornar áreas activas como fallback cuando no hay currículo configurado', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.aniolectivo.findFirst as jest.Mock).mockResolvedValue(mockAnioLectivo);
      (prisma.grado.findFirst as jest.Mock).mockResolvedValue(mockGrado);
      (prisma.curriculogrado.findMany as jest.Mock).mockResolvedValue([]); // Sin currículo
      (prisma.areacurricular.findMany as jest.Mock).mockResolvedValue(mockAreas);

      const result = await curriculoGradoService.getPlantillaByAnioGrado(1990, 5);

      expect(result).toHaveLength(3);
      expect(result[0]!.codigo).toBe('MAT');
      expect(prisma.areacurricular.findMany).toHaveBeenCalledWith({
        where: {
          institucion_id: mockInstitucion.id,
          activo: true,
        },
        orderBy: {
          orden: 'asc',
        },
      });
    });

    it('debe lanzar error si no existe institución activa', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        curriculoGradoService.getPlantillaByAnioGrado(1990, 5)
      ).rejects.toThrow('No se encontró institución activa');
    });

    it('debe lanzar error si el año lectivo no existe', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.aniolectivo.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        curriculoGradoService.getPlantillaByAnioGrado(2050, 5)
      ).rejects.toThrow('Año lectivo 2050 no encontrado');
    });

    it('debe lanzar error si el grado no existe', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.aniolectivo.findFirst as jest.Mock).mockResolvedValue(mockAnioLectivo);
      (prisma.grado.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        curriculoGradoService.getPlantillaByAnioGrado(1990, 99)
      ).rejects.toThrow('Grado 99 no encontrado');
    });
  });

  describe('getByGrado', () => {
    it('debe retornar asignaciones de un grado', async () => {
      const mockAsignaciones = [
        {
          id: 'curriculo-1',
          grado_id: mockGrado.id,
          aniolectivo_id: mockAnioLectivo.id,
          area_id: 'area-1',
          orden: 1,
          activo: true,
          aniolectivo: mockAnioLectivo,
          grado: mockGrado,
          areacurricular: {
            id: 'area-1',
            codigo: 'MAT',
            nombre: 'Matemática',
            orden: 1,
            activo: true,
          },
        },
      ];

      (prisma.curriculogrado.findMany as jest.Mock).mockResolvedValue(mockAsignaciones);

      const result = await curriculoGradoService.getByGrado(mockGrado.id);

      expect(result).toHaveLength(1);
      expect(result[0]!.area.codigo).toBe('MAT');
      expect(result[0]!.grado.numero).toBe(5);
    });

    it('debe filtrar por año lectivo si se proporciona', async () => {
      (prisma.curriculogrado.findMany as jest.Mock).mockResolvedValue([]);

      await curriculoGradoService.getByGrado(mockGrado.id, mockAnioLectivo.id);

      expect(prisma.curriculogrado.findMany).toHaveBeenCalledWith({
        where: {
          grado_id: mockGrado.id,
          aniolectivo_id: mockAnioLectivo.id,
          activo: true,
        },
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });
    });
  });

  describe('updateOrden', () => {
    it('debe actualizar el orden de un área en el currículo', async () => {
      const mockCurriculo = {
        id: 'curriculo-1',
        grado_id: mockGrado.id,
        aniolectivo_id: mockAnioLectivo.id,
        area_id: 'area-1',
        orden: 1,
        activo: true,
      };

      (prisma.curriculogrado.findUnique as jest.Mock).mockResolvedValue(mockCurriculo);
      (prisma.curriculogrado.update as jest.Mock).mockResolvedValue({
        ...mockCurriculo,
        orden: 10,
      });

      await curriculoGradoService.updateOrden('curriculo-1', 10);

      expect(prisma.curriculogrado.update).toHaveBeenCalledWith({
        where: { id: 'curriculo-1' },
        data: { orden: 10 },
      });
    });

    it('debe lanzar error si la asignación no existe', async () => {
      (prisma.curriculogrado.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        curriculoGradoService.updateOrden('inexistente', 10)
      ).rejects.toThrow('Asignación de currículo no encontrada');
    });
  });

  describe('removeArea', () => {
    it('debe desactivar una asignación de área (soft delete)', async () => {
      const mockCurriculo = {
        id: 'curriculo-1',
        grado_id: mockGrado.id,
        aniolectivo_id: mockAnioLectivo.id,
        area_id: 'area-1',
        orden: 1,
        activo: true,
      };

      (prisma.curriculogrado.findUnique as jest.Mock).mockResolvedValue(mockCurriculo);
      (prisma.curriculogrado.update as jest.Mock).mockResolvedValue({
        ...mockCurriculo,
        activo: false,
      });

      await curriculoGradoService.removeArea('curriculo-1');

      expect(prisma.curriculogrado.update).toHaveBeenCalledWith({
        where: { id: 'curriculo-1' },
        data: { activo: false },
      });
    });

    it('debe lanzar error si la asignación no existe', async () => {
      (prisma.curriculogrado.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        curriculoGradoService.removeArea('inexistente')
      ).rejects.toThrow('Asignación de currículo no encontrada');
    });
  });
});
