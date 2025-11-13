/**
 * Servicio de Grados
 * CRUD completo + validación número único por institución
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { CreateGradoDTOType, FiltrosGradoDTOType, UpdateGradoDTOType } from './dtos';

const prisma = new PrismaClient();

export class GradosService {
  /**
   * Crear nuevo grado
   */
  async create(data: CreateGradoDTOType) {
    // Validar número único por nivel educativo
    const existente = await prisma.grado.findFirst({
      where: {
        numero: data.numero,
        nivel_id: data.nivelId,
      },
    });

    if (existente) {
      throw new Error(`Ya existe un grado con el número ${data.numero} en este nivel educativo`);
    }

    const grado = await prisma.grado.create({
      data: {
        numero: data.numero,
        nombre: data.nombre,
        nombrecorto: data.nombrecorto,
        nivel_id: data.nivelId,
        orden: data.orden ?? data.numero, // Si no se especifica, orden = numero
        activo: data.activo,
      },
      include: {
        niveleducativo: true,
      },
    });

    logger.info(`Grado creado: ${grado.numero} - ${grado.nombre}`);
    return grado;
  }

  /**
   * Obtener grados con filtros y paginación
   */
  async findAll(filtros: FiltrosGradoDTOType = {}, pagination?: { page: number; limit: number }) {
    const where: any = {};

    // Filtro de búsqueda
    if (filtros.search) {
      where.OR = [
        { nombre: { contains: filtros.search, mode: 'insensitive' } },
        { nombrecorto: { contains: filtros.search, mode: 'insensitive' } },
      ];
    }

    if (filtros.nivelId) {
      where.nivel_id = filtros.nivelId;
    }

    if (filtros.activo !== undefined) {
      where.activo = filtros.activo;
    }

    // Paginación
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [grados, total] = await Promise.all([
      prisma.grado.findMany({
        where,
        skip,
        take: limit,
        include: {
          niveleducativo: true,
          _count: {
            select: {
              actafisica: true,
              certificadodetalle: true,
            },
          },
        },
        orderBy: {
          orden: 'asc',
        },
      }),
      prisma.grado.count({ where }),
    ]);

    return {
      grados,
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
   * Obtener grado por ID
   */
  async findById(id: string) {
    const grado = await prisma.grado.findUnique({
      where: { id },
      include: {
        niveleducativo: true,
        _count: {
          select: {
            actafisica: true,
            certificadodetalle: true,
            curriculogrado: true,
          },
        },
      },
    });

    if (!grado) {
      throw new Error('Grado no encontrado');
    }

    return grado;
  }

  /**
   * Actualizar grado
   */
  async update(id: string, data: UpdateGradoDTOType) {
    const grado = await this.findById(id);

    // Validar número único por nivel educativo si se está cambiando el número o el nivel
    if ((data.numero && data.numero !== grado.numero) || (data.nivelId && data.nivelId !== grado.nivel_id)) {
      const numeroFinal = data.numero ?? grado.numero;
      const nivelIdFinal = data.nivelId ?? grado.nivel_id;
      
      const existente = await prisma.grado.findFirst({
        where: {
          numero: numeroFinal,
          nivel_id: nivelIdFinal,
          id: { not: id },
        },
      });

      if (existente) {
        throw new Error(`Ya existe un grado con el número ${numeroFinal} en este nivel educativo`);
      }
    }

    // Construir data solo con campos que vienen definidos
    const updateData: any = {};
    if (data.numero !== undefined) updateData.numero = data.numero;
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.nombrecorto !== undefined) updateData.nombrecorto = data.nombrecorto;
    if (data.nivelId !== undefined) updateData.nivel_id = data.nivelId;
    if (data.orden !== undefined) updateData.orden = data.orden;
    if (data.activo !== undefined) updateData.activo = data.activo;

    const gradoActualizado = await prisma.grado.update({
      where: { id },
      data: updateData,
      include: {
        niveleducativo: true,
      },
    });

    logger.info(`Grado actualizado: ${gradoActualizado.numero} - ${gradoActualizado.nombre}`);
    return gradoActualizado;
  }

  /**
   * Eliminar grado (soft delete)
   */
  async delete(id: string) {
    // Verificar si tiene registros asociados
    const grado = await prisma.grado.findUnique({
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

    if (!grado) {
      throw new Error('Grado no encontrado');
    }

    const totalRegistros = grado._count.actafisica + grado._count.certificadodetalle + grado._count.curriculogrado;

    if (totalRegistros > 0) {
      // Soft delete
      await prisma.grado.update({
        where: { id },
        data: { activo: false },
      });
      logger.info(`Grado desactivado (soft delete): ${grado.numero}`);
    } else {
      // Hard delete
      await prisma.grado.delete({
        where: { id },
      });
      logger.info(`Grado eliminado (hard delete): ${grado.numero}`);
    }
  }

  /**
   * Obtener grados activos
   */
  async getActivos() {
    const grados = await prisma.grado.findMany({
      where: {
        activo: true,
      },
      include: {
        niveleducativo: true,
      },
      orderBy: {
        orden: 'asc',
      },
    });

    return grados;
  }
}

export const gradosService = new GradosService();

