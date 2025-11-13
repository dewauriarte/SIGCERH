/**
 * Servicio de Niveles Educativos
 * CRUD completo + validación código único
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { CreateNivelEducativoDTOType, FiltrosNivelEducativoDTOType, UpdateNivelEducativoDTOType } from './dtos';

const prisma = new PrismaClient();

export class NivelesEducativosService {
  /**
   * Crear nuevo nivel educativo
   */
  async create(data: CreateNivelEducativoDTOType) {
    // Validar código único por institución
    const existente = await prisma.niveleducativo.findFirst({
      where: {
        codigo: data.codigo,
      },
    });

    if (existente) {
      throw new Error(`Ya existe un nivel educativo con el código ${data.codigo}`);
    }

    const nivel = await prisma.niveleducativo.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        orden: data.orden,
        activo: data.activo,
      },
    });

    logger.info(`Nivel educativo creado: ${nivel.codigo} - ${nivel.nombre}`);
    return nivel;
  }

  /**
   * Obtener niveles educativos con filtros y paginación
   */
  async findAll(filtros: FiltrosNivelEducativoDTOType = {}, pagination?: { page: number; limit: number }) {
    const where: any = {};

    // Filtro de búsqueda
    if (filtros.search) {
      where.OR = [
        { codigo: { contains: filtros.search, mode: 'insensitive' } },
        { nombre: { contains: filtros.search, mode: 'insensitive' } },
        { descripcion: { contains: filtros.search, mode: 'insensitive' } },
      ];
    }

    if (filtros.activo !== undefined) {
      where.activo = filtros.activo;
    }

    // Paginación
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [niveles, total] = await Promise.all([
      prisma.niveleducativo.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              grado: true,
            },
          },
        },
        orderBy: {
          orden: 'asc',
        },
      }),
      prisma.niveleducativo.count({ where }),
    ]);

    return {
      niveles,
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
   * Obtener nivel educativo por ID
   */
  async findById(id: string) {
    const nivel = await prisma.niveleducativo.findUnique({
      where: { id },
      include: {
        grado: {
          where: {
            activo: true,
          },
          select: {
            id: true,
            numero: true,
            nombre: true,
            nombrecorto: true,
            activo: true,
          },
          orderBy: {
            orden: 'asc',
          },
        },
        _count: {
          select: {
            grado: true,
          },
        },
      },
    });

    if (!nivel) {
      throw new Error('Nivel educativo no encontrado');
    }

    return nivel;
  }

  /**
   * Actualizar nivel educativo
   */
  async update(id: string, data: UpdateNivelEducativoDTOType) {
    const nivel = await this.findById(id);

    // Validar código único si se está cambiando
    if (data.codigo && data.codigo !== nivel.codigo) {
      const existente = await prisma.niveleducativo.findFirst({
        where: {
          codigo: data.codigo,
          id: { not: id },
        },
      });

      if (existente) {
        throw new Error(`Ya existe un nivel educativo con el código ${data.codigo}`);
      }
    }

    const nivelActualizado = await prisma.niveleducativo.update({
      where: { id },
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        orden: data.orden,
        activo: data.activo,
      },
      include: {
        grado: true,
      },
    });

    logger.info(`Nivel educativo actualizado: ${nivelActualizado.codigo} - ${nivelActualizado.nombre}`);
    return nivelActualizado;
  }

  /**
   * Eliminar nivel educativo (soft delete)
   */
  async delete(id: string) {
    // Verificar si tiene grados asociados
    const nivel = await prisma.niveleducativo.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            grado: true,
          },
        },
      },
    });

    if (!nivel) {
      throw new Error('Nivel educativo no encontrado');
    }

    if (nivel._count.grado > 0) {
      // Soft delete si tiene grados asociados
      await prisma.niveleducativo.update({
        where: { id },
        data: { activo: false },
      });
      logger.info(`Nivel educativo desactivado (soft delete): ${nivel.codigo}`);
    } else {
      // Hard delete si no tiene grados
      await prisma.niveleducativo.delete({
        where: { id },
      });
      logger.info(`Nivel educativo eliminado (hard delete): ${nivel.codigo}`);
    }
  }

  /**
   * Obtener niveles educativos activos
   */
  async getActivos() {
    const niveles = await prisma.niveleducativo.findMany({
      where: {
        activo: true,
      },
      orderBy: {
        orden: 'asc',
      },
    });

    return niveles;
  }
}

export const nivelesEducativosService = new NivelesEducativosService();

