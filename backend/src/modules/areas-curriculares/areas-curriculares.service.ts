/**
 * Servicio de Áreas Curriculares
 * CRUD completo + validación código único
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { CreateAreaCurricularDTOType, FiltrosAreaCurricularDTOType, UpdateAreaCurricularDTOType } from './dtos';

const prisma = new PrismaClient();

export class AreasCurricularesService {
  /**
   * Crear nueva área curricular
   */
  async create(data: CreateAreaCurricularDTOType) {
    // Validar código único por institución
    const existente = await prisma.areacurricular.findFirst({
      where: {
        codigo: data.codigo,
      },
    });

    if (existente) {
      throw new Error(`Ya existe un área curricular con el código ${data.codigo}`);
    }

    const area = await prisma.areacurricular.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        orden: data.orden,
        escompetenciatransversal: data.escompetenciatransversal,
        activo: data.activo,
      },
    });

    logger.info(`Área curricular creada: ${area.codigo} - ${area.nombre}`);
    return area;
  }

  /**
   * Obtener áreas curriculares con filtros y paginación
   */
  async findAll(filtros: FiltrosAreaCurricularDTOType = {}, pagination?: { page: number; limit: number }) {
    const where: any = {};

    // Filtro de búsqueda
    if (filtros.search) {
      where.OR = [
        { codigo: { contains: filtros.search, mode: 'insensitive' } },
        { nombre: { contains: filtros.search, mode: 'insensitive' } },
      ];
    }

    if (filtros.escompetenciatransversal !== undefined) {
      where.escompetenciatransversal = filtros.escompetenciatransversal;
    }

    if (filtros.activo !== undefined) {
      where.activo = filtros.activo;
    }

    // Paginación
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [areas, total] = await Promise.all([
      prisma.areacurricular.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              certificadonota: true,
              curriculogrado: true,
            },
          },
        },
        orderBy: {
          orden: 'asc',
        },
      }),
      prisma.areacurricular.count({ where }),
    ]);

    return {
      areas,
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
   * Obtener área curricular por ID
   */
  async findById(id: string) {
    const area = await prisma.areacurricular.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            certificadonota: true,
            curriculogrado: true,
          },
        },
      },
    });

    if (!area) {
      throw new Error('Área curricular no encontrada');
    }

    return area;
  }

  /**
   * Actualizar área curricular
   */
  async update(id: string, data: UpdateAreaCurricularDTOType) {
    const area = await this.findById(id);

    // Validar código único si se está cambiando
    if (data.codigo && data.codigo !== area.codigo) {
      const existente = await prisma.areacurricular.findFirst({
        where: {
          codigo: data.codigo,
          id: { not: id },
        },
      });

      if (existente) {
        throw new Error(`Ya existe un área curricular con el código ${data.codigo}`);
      }
    }

    // Construir data solo con campos que vienen definidos
    const updateData: any = {};
    if (data.codigo !== undefined) updateData.codigo = data.codigo;
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.orden !== undefined) updateData.orden = data.orden;
    if (data.escompetenciatransversal !== undefined) updateData.escompetenciatransversal = data.escompetenciatransversal;
    if (data.activo !== undefined) updateData.activo = data.activo;

    const areaActualizada = await prisma.areacurricular.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Área curricular actualizada: ${areaActualizada.codigo} - ${areaActualizada.nombre}`);
    return areaActualizada;
  }

  /**
   * Eliminar área curricular (soft delete)
   */
  async delete(id: string) {
    // Verificar si tiene registros asociados
    const area = await prisma.areacurricular.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            certificadonota: true,
            curriculogrado: true,
          },
        },
      },
    });

    if (!area) {
      throw new Error('Área curricular no encontrada');
    }

    const totalRegistros = area._count.certificadonota + area._count.curriculogrado;

    if (totalRegistros > 0) {
      // Soft delete
      await prisma.areacurricular.update({
        where: { id },
        data: { activo: false },
      });
      logger.info(`Área curricular desactivada (soft delete): ${area.codigo}`);
    } else {
      // Hard delete
      await prisma.areacurricular.delete({
        where: { id },
      });
      logger.info(`Área curricular eliminada (hard delete): ${area.codigo}`);
    }
  }

  /**
   * Obtener áreas curriculares activas
   */
  async getActivas() {
    const areas = await prisma.areacurricular.findMany({
      where: {
        activo: true,
      },
      orderBy: {
        orden: 'asc',
      },
    });

    return areas;
  }
}

export const areasCurricularesService = new AreasCurricularesService();

