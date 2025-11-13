/**
 * Servicio de Años Lectivos
 * CRUD completo + validación año único y solo uno activo
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { CreateAnioLectivoDTOType, FiltrosAnioLectivoDTOType, UpdateAnioLectivoDTOType } from './dtos';

const prisma = new PrismaClient();

export class AniosLectivosService {
  /**
   * Crear nuevo año lectivo
   */
  async create(data: CreateAnioLectivoDTOType) {
    // Validar año único por institución
    const existente = await prisma.aniolectivo.findFirst({
      where: {
        anio: data.anio,
      },
    });

    if (existente) {
      throw new Error(`Ya existe un año lectivo para el año ${data.anio}`);
    }

    // Si se va a crear como activo, desactivar los demás
    if (data.activo) {
      await prisma.aniolectivo.updateMany({
        where: {
          activo: true,
        },
        data: {
          activo: false,
        },
      });
      logger.info('Años lectivos anteriores desactivados');
    }

    const anioLectivo = await prisma.aniolectivo.create({
      data: {
        anio: data.anio,
        fechainicio: data.fechainicio,
        fechafin: data.fechafin,
        activo: data.activo,
        observaciones: data.observaciones,
      },
    });

    logger.info(`Año lectivo creado: ${anioLectivo.anio}`);
    return anioLectivo;
  }

  /**
   * Obtener años lectivos con filtros y paginación
   */
  async findAll(filtros: FiltrosAnioLectivoDTOType = {}, pagination?: { page: number; limit: number }) {
    const where: any = {};

    // Filtro de búsqueda
    if (filtros.search) {
      where.OR = [
        { anio: { equals: parseInt(filtros.search) || 0 } },
        { observaciones: { contains: filtros.search, mode: 'insensitive' } },
      ];
    }

    if (filtros.activo !== undefined) {
      where.activo = filtros.activo;
    }

    // Paginación
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [aniosLectivos, total] = await Promise.all([
      prisma.aniolectivo.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              actafisica: true,
              certificadodetalle: true,
              curriculogrado: true,
            },
          },
        },
        orderBy: {
          anio: 'desc',
        },
      }),
      prisma.aniolectivo.count({ where }),
    ]);

    return {
      aniosLectivos,
      pagination: pagination
        ? {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          }
        : undefined,
    };
  }

  /**
   * Obtener año lectivo por ID
   */
  async findById(id: string) {
    const anioLectivo = await prisma.aniolectivo.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            actafisica: true,
            certificadodetalle: true,
            curriculogrado: true,
          },
        },
      },
    });

    if (!anioLectivo) {
      throw new Error('Año lectivo no encontrado');
    }

    return anioLectivo;
  }

  /**
   * Actualizar año lectivo
   */
  async update(id: string, data: UpdateAnioLectivoDTOType) {
    const anioLectivo = await this.findById(id);

    // Validar año único si se está cambiando
    if (data.anio && data.anio !== anioLectivo.anio) {
      const existente = await prisma.aniolectivo.findFirst({
        where: {
          anio: data.anio,
          id: { not: id },
        },
      });

      if (existente) {
        throw new Error(`Ya existe un año lectivo para el año ${data.anio}`);
      }
    }

    // Si se va a activar este año, desactivar los demás
    if (data.activo === true && !anioLectivo.activo) {
      await prisma.aniolectivo.updateMany({
        where: {
          activo: true,
          id: { not: id },
        },
        data: {
          activo: false,
        },
      });
      logger.info('Otros años lectivos desactivados');
    }

    const anioLectivoActualizado = await prisma.aniolectivo.update({
      where: { id },
      data: {
        anio: data.anio,
        fechainicio: data.fechainicio,
        fechafin: data.fechafin,
        activo: data.activo,
        observaciones: data.observaciones,
      },
    });

    logger.info(`Año lectivo actualizado: ${anioLectivoActualizado.anio}`);
    return anioLectivoActualizado;
  }

  /**
   * Eliminar año lectivo (soft delete si tiene registros)
   */
  async delete(id: string) {
    // Verificar si tiene registros asociados
    const anioLectivo = await prisma.aniolectivo.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            actafisica: true,
            certificadodetalle: true,
            curriculogrado: true,
          },
        },
      },
    });

    if (!anioLectivo) {
      throw new Error('Año lectivo no encontrado');
    }

    const totalRegistros =
      anioLectivo._count.actafisica + anioLectivo._count.certificadodetalle + anioLectivo._count.curriculogrado;

    if (totalRegistros > 0) {
      // Soft delete
      await prisma.aniolectivo.update({
        where: { id },
        data: { activo: false },
      });
      logger.info(`Año lectivo desactivado (soft delete): ${anioLectivo.anio}`);
    } else {
      // Hard delete
      await prisma.aniolectivo.delete({
        where: { id },
      });
      logger.info(`Año lectivo eliminado (hard delete): ${anioLectivo.anio}`);
    }
  }

  /**
   * Obtener años lectivos activos
   */
  async getActivos() {
    const aniosLectivos = await prisma.aniolectivo.findMany({
      where: {
        activo: true,
      },
      orderBy: {
        anio: 'desc',
      },
    });

    return aniosLectivos;
  }

  /**
   * Obtener año lectivo actual (el que está activo)
   */
  async getActual() {
    const anioLectivo = await prisma.aniolectivo.findFirst({
      where: {
        activo: true,
      },
      orderBy: {
        anio: 'desc',
      },
    });

    return anioLectivo;
  }
}

export const aniosLectivosService = new AniosLectivosService();

