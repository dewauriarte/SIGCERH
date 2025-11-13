/**
 * Servicio de niveles educativos
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { CreateNivelData, UpdateNivelData } from './types';

const prisma = new PrismaClient();

export class NivelesService {
  /**
   * Listar todos los niveles educativos
   */
  async list(activoOnly: boolean = false) {
    const where: any = {};
    if (activoOnly) {
      where.activo = true;
    }

    const niveles = await prisma.niveleducativo.findMany({
      where,
      orderBy: { orden: 'asc' },
    });

    return niveles.map(n => ({
      id: n.id,
      nombre: n.nombre,
      codigo: n.codigo,
      descripcion: n.descripcion,
      orden: n.orden,
      activo: n.activo,
    }));
  }

  /**
   * Obtener un nivel educativo por ID
   */
  async getById(id: string) {
    const nivel = await prisma.niveleducativo.findUnique({
      where: { id },
    });

    if (!nivel) {
      throw new Error('Nivel educativo no encontrado');
    }

    return {
      id: nivel.id,
      nombre: nivel.nombre,
      codigo: nivel.codigo,
      descripcion: nivel.descripcion,
      orden: nivel.orden,
      activo: nivel.activo,
    };
  }

  /**
   * Crear un nuevo nivel educativo
   */
  async create(data: CreateNivelData) {
    // Verificar si ya existe un nivel con el mismo código
    const existingNivel = await prisma.niveleducativo.findFirst({
      where: { codigo: data.codigo },
    });

    if (existingNivel) {
      throw new Error(`Ya existe un nivel educativo con el código ${data.codigo}`);
    }

    // Si no se especifica orden, usar el siguiente disponible
    let orden = data.orden || 0;
    if (!data.orden) {
      const maxOrden = await prisma.niveleducativo.aggregate({
        _max: { orden: true },
      });
      orden = (maxOrden._max.orden || 0) + 1;
    }

    const nivel = await prisma.niveleducativo.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        descripcion: data.descripcion || null,
        orden,
        activo: true,
      },
    });

    logger.info(`Nivel educativo creado: ${nivel.nombre} (${nivel.codigo})`);

    return {
      id: nivel.id,
      nombre: nivel.nombre,
      codigo: nivel.codigo,
      descripcion: nivel.descripcion,
      orden: nivel.orden,
      activo: nivel.activo,
    };
  }

  /**
   * Actualizar un nivel educativo
   */
  async update(id: string, data: UpdateNivelData) {
    // Verificar que el nivel existe
    const nivel = await prisma.niveleducativo.findUnique({
      where: { id },
    });

    if (!nivel) {
      throw new Error('Nivel educativo no encontrado');
    }

    // Si se cambia el código, verificar que no exista otro con el mismo código
    if (data.codigo && data.codigo !== nivel.codigo) {
      const existingNivel = await prisma.niveleducativo.findFirst({
        where: {
          codigo: data.codigo,
          id: { not: id },
        },
      });

      if (existingNivel) {
        throw new Error(`Ya existe otro nivel educativo con el código ${data.codigo}`);
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {};

    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.codigo !== undefined) updateData.codigo = data.codigo;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.orden !== undefined) updateData.orden = data.orden;
    if (data.activo !== undefined) updateData.activo = data.activo;

    const updated = await prisma.niveleducativo.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Nivel educativo actualizado: ${updated.nombre}`);

    return {
      id: updated.id,
      nombre: updated.nombre,
      codigo: updated.codigo,
      descripcion: updated.descripcion,
      orden: updated.orden,
      activo: updated.activo,
    };
  }

  /**
   * Eliminar un nivel educativo
   * Verifica que no tenga grados asociados antes de eliminar
   */
  async delete(id: string) {
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

    // Verificar si tiene grados asociados
    if (nivel._count.grado > 0) {
      throw new Error(
        `No se puede eliminar el nivel educativo porque tiene ${nivel._count.grado} grado${
          nivel._count.grado !== 1 ? 's' : ''
        } asociado${nivel._count.grado !== 1 ? 's' : ''}. Elimine primero los grados o reasígnelos a otro nivel.`
      );
    }

    // Eliminar el nivel (hard delete ya que no tiene dependencias)
    await prisma.niveleducativo.delete({
      where: { id },
    });

    logger.info(`Nivel educativo eliminado: ${nivel.nombre}`);
  }
}

export const nivelesService = new NivelesService();

