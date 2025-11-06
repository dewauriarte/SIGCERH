/**
 * Tests unitarios para AniosLectivosService
 */

import { AniosLectivosService } from '../anios-lectivos.service';
import { PrismaClient } from '@prisma/client';

// Mock de Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    configuracioninstitucion: {
      findFirst: jest.fn(),
    },
    aniolectivo: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
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

describe('AniosLectivosService', () => {
  let aniosLectivosService: AniosLectivosService;
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
    aniosLectivosService = new AniosLectivosService();
    prisma = new PrismaClient();
  });

  describe('list', () => {
    it('debe listar todos los años lectivos', async () => {
      const mockAnios = [
        {
          id: 'anio-1',
          anio: 2012,
          fechainicio: new Date('2012-03-01'),
          fechafin: new Date('2012-12-31'),
          activo: true,
          observaciones: null,
          institucion_id: mockInstitucion.id,
        },
        {
          id: 'anio-2',
          anio: 1990,
          fechainicio: new Date('1990-03-01'),
          fechafin: new Date('1990-12-31'),
          activo: true,
          observaciones: null,
          institucion_id: mockInstitucion.id,
        },
      ];

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.aniolectivo.findMany as jest.Mock).mockResolvedValue(mockAnios);

      const result = await aniosLectivosService.list();

      expect(result).toHaveLength(2);
      expect(result[0]!.anio).toBe(2012);
      expect(result[1]!.anio).toBe(1990);
      expect(prisma.aniolectivo.findMany).toHaveBeenCalledWith({
        where: { institucion_id: mockInstitucion.id },
        orderBy: { anio: 'desc' },
      });
    });

    it('debe listar solo años lectivos activos cuando activoOnly es true', async () => {
      const mockAniosActivos = [
        {
          id: 'anio-1',
          anio: 2012,
          fechainicio: new Date('2012-03-01'),
          fechafin: new Date('2012-12-31'),
          activo: true,
          observaciones: null,
          institucion_id: mockInstitucion.id,
        },
      ];

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.aniolectivo.findMany as jest.Mock).mockResolvedValue(mockAniosActivos);

      const result = await aniosLectivosService.list(true);

      expect(result).toHaveLength(1);
      expect(prisma.aniolectivo.findMany).toHaveBeenCalledWith({
        where: {
          institucion_id: mockInstitucion.id,
          activo: true,
        },
        orderBy: { anio: 'desc' },
      });
    });

    it('debe lanzar error si no existe institución activa', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(aniosLectivosService.list()).rejects.toThrow(
        'No se encontró institución activa'
      );
    });
  });

  describe('getById', () => {
    it('debe retornar un año lectivo por ID', async () => {
      const mockAnio = {
        id: 'anio-1',
        anio: 1995,
        fechainicio: new Date('1995-03-01'),
        fechafin: new Date('1995-12-31'),
        activo: true,
        observaciones: 'Año histórico',
        institucion_id: mockInstitucion.id,
      };

      (prisma.aniolectivo.findUnique as jest.Mock).mockResolvedValue(mockAnio);

      const result = await aniosLectivosService.getById('anio-1');

      expect(result.anio).toBe(1995);
      expect(result.observaciones).toBe('Año histórico');
    });

    it('debe lanzar error si el año lectivo no existe', async () => {
      (prisma.aniolectivo.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(aniosLectivosService.getById('inexistente')).rejects.toThrow(
        'Año lectivo no encontrado'
      );
    });
  });

  describe('create', () => {
    it('debe crear un nuevo año lectivo', async () => {
      const createData = {
        anio: 1990,
        fechaInicio: new Date('1990-03-01'),
        fechaFin: new Date('1990-12-31'),
      };

      const mockCreated = {
        id: 'anio-new',
        anio: 1990,
        fechainicio: createData.fechaInicio,
        fechafin: createData.fechaFin,
        activo: true,
        observaciones: null,
        institucion_id: mockInstitucion.id,
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.aniolectivo.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.aniolectivo.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await aniosLectivosService.create(createData);

      expect(result.anio).toBe(1990);
      expect(result.activo).toBe(true);
    });

    it('debe crear año con fechas por defecto si no se proporcionan', async () => {
      const createData = {
        anio: 2000,
      };

      const mockCreated = {
        id: 'anio-new',
        anio: 2000,
        fechainicio: new Date('2000-03-01'),
        fechafin: new Date('2000-12-31'),
        activo: true,
        observaciones: null,
        institucion_id: mockInstitucion.id,
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.aniolectivo.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.aniolectivo.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await aniosLectivosService.create(createData);

      expect(result.anio).toBe(2000);
      expect(prisma.aniolectivo.create).toHaveBeenCalled();
    });

    it('debe rechazar año menor a 1985', async () => {
      const createData = {
        anio: 1984,
      };

      await expect(aniosLectivosService.create(createData)).rejects.toThrow(
        'El año debe estar en el rango 1985-2012'
      );
    });

    it('debe rechazar año mayor a 2012', async () => {
      const createData = {
        anio: 2013,
      };

      await expect(aniosLectivosService.create(createData)).rejects.toThrow(
        'El año debe estar en el rango 1985-2012'
      );
    });

    it('debe rechazar año duplicado', async () => {
      const createData = {
        anio: 1990,
      };

      const mockExisting = {
        id: 'anio-existing',
        anio: 1990,
        fechainicio: new Date('1990-03-01'),
        fechafin: new Date('1990-12-31'),
        activo: true,
        observaciones: null,
        institucion_id: mockInstitucion.id,
      };

      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(mockInstitucion);
      (prisma.aniolectivo.findFirst as jest.Mock).mockResolvedValue(mockExisting);

      await expect(aniosLectivosService.create(createData)).rejects.toThrow(
        'El año lectivo 1990 ya existe'
      );
    });

    it('debe lanzar error si no existe institución activa', async () => {
      (prisma.configuracioninstitucion.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(aniosLectivosService.create({ anio: 1990 })).rejects.toThrow(
        'No se encontró institución activa'
      );
    });
  });

  describe('update', () => {
    const mockExisting = {
      id: 'anio-1',
      anio: 1995,
      fechainicio: new Date('1995-03-01'),
      fechafin: new Date('1995-12-31'),
      activo: true,
      observaciones: null,
      institucion_id: mockInstitucion.id,
    };

    it('debe actualizar un año lectivo', async () => {
      const updateData = {
        fechaInicio: new Date('1995-02-15'),
        activo: false,
      };

      const mockUpdated = {
        ...mockExisting,
        fechainicio: updateData.fechaInicio,
        activo: updateData.activo,
      };

      (prisma.aniolectivo.findUnique as jest.Mock).mockResolvedValue(mockExisting);
      (prisma.aniolectivo.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await aniosLectivosService.update('anio-1', updateData);

      expect(result.activo).toBe(false);
    });

    it('debe lanzar error si el año lectivo no existe', async () => {
      (prisma.aniolectivo.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        aniosLectivosService.update('inexistente', { anio: 2000 })
      ).rejects.toThrow('Año lectivo no encontrado');
    });

    it('debe validar rango al cambiar el año', async () => {
      (prisma.aniolectivo.findUnique as jest.Mock).mockResolvedValue(mockExisting);

      await expect(
        aniosLectivosService.update('anio-1', { anio: 2020 })
      ).rejects.toThrow('El año debe estar en el rango 1985-2012');
    });

    it('debe rechazar año duplicado al actualizar', async () => {
      const otroAnio = {
        id: 'anio-2',
        anio: 2000,
        fechainicio: new Date('2000-03-01'),
        fechafin: new Date('2000-12-31'),
        activo: true,
        observaciones: null,
        institucion_id: mockInstitucion.id,
      };

      (prisma.aniolectivo.findUnique as jest.Mock).mockResolvedValue(mockExisting);
      (prisma.aniolectivo.findFirst as jest.Mock).mockResolvedValue(otroAnio);

      await expect(
        aniosLectivosService.update('anio-1', { anio: 2000 })
      ).rejects.toThrow('Ya existe otro año lectivo con el año 2000');
    });
  });

  describe('delete', () => {
    it('debe desactivar un año lectivo (soft delete)', async () => {
      const mockAnio = {
        id: 'anio-1',
        anio: 1995,
        fechainicio: new Date('1995-03-01'),
        fechafin: new Date('1995-12-31'),
        activo: true,
        observaciones: null,
        institucion_id: mockInstitucion.id,
      };

      (prisma.aniolectivo.findUnique as jest.Mock).mockResolvedValue(mockAnio);
      (prisma.aniolectivo.update as jest.Mock).mockResolvedValue({ ...mockAnio, activo: false });

      await aniosLectivosService.delete('anio-1');

      expect(prisma.aniolectivo.update).toHaveBeenCalledWith({
        where: { id: 'anio-1' },
        data: { activo: false },
      });
    });

    it('debe lanzar error si el año lectivo no existe', async () => {
      (prisma.aniolectivo.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(aniosLectivosService.delete('inexistente')).rejects.toThrow(
        'Año lectivo no encontrado'
      );
    });
  });
});
