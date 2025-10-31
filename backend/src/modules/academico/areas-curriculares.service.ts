/**
 * Servicio de áreas curriculares
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { CreateAreaCurricularData, UpdateAreaCurricularData } from './types';

const prisma = new PrismaClient();

export class AreasCurricularesService {
  /**
   * Listar todas las áreas curriculares
   */
  async list(activoOnly: boolean = false) {
    // Obtener institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!institucion) {
      throw new Error('No se encontró institución activa');
    }

    const where: any = {
      institucion_id: institucion.id,
    };

    if (activoOnly) {
      where.activo = true;
    }

    const areas = await prisma.areacurricular.findMany({
      where,
      orderBy: { orden: 'asc' },
    });

    return areas.map(a => ({
      id: a.id,
      codigo: a.codigo,
      nombre: a.nombre,
      orden: a.orden,
      esCompetenciaTransversal: a.escompetenciatransversal,
      activo: a.activo,
    }));
  }

  /**
   * Obtener un área curricular por ID
   */
  async getById(id: string) {
    const area = await prisma.areacurricular.findUnique({
      where: { id },
    });

    if (!area) {
      throw new Error('Área curricular no encontrada');
    }

    return {
      id: area.id,
      codigo: area.codigo,
      nombre: area.nombre,
      orden: area.orden,
      esCompetenciaTransversal: area.escompetenciatransversal,
      activo: area.activo,
    };
  }

  /**
   * Crear una nueva área curricular
   */
  async create(data: CreateAreaCurricularData) {
    // Obtener institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!institucion) {
      throw new Error('No se encontró institución activa');
    }

    // Verificar si ya existe un área con el mismo código
    const existingArea = await prisma.areacurricular.findFirst({
      where: {
        institucion_id: institucion.id,
        codigo: data.codigo,
      },
    });

    if (existingArea) {
      throw new Error(`Ya existe un área curricular con el código ${data.codigo}`);
    }

    // Si no se especifica orden, usar el siguiente disponible
    let orden = data.orden || 0;
    if (!data.orden) {
      const maxOrden = await prisma.areacurricular.aggregate({
        where: {
          institucion_id: institucion.id,
        },
        _max: { orden: true },
      });
      orden = (maxOrden._max.orden || 0) + 1;
    }

    const area = await prisma.areacurricular.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        orden,
        escompetenciatransversal: data.esCompetenciaTransversal || false,
        activo: true,
        configuracioninstitucion: {
          connect: { id: institucion.id },
        },
      },
    });

    logger.info(`Área curricular creada: ${area.nombre} (${area.codigo})`);

    return {
      id: area.id,
      codigo: area.codigo,
      nombre: area.nombre,
      orden: area.orden,
      esCompetenciaTransversal: area.escompetenciatransversal,
      activo: area.activo,
    };
  }

  /**
   * Actualizar un área curricular
   */
  async update(id: string, data: UpdateAreaCurricularData) {
    const area = await prisma.areacurricular.findUnique({
      where: { id },
    });

    if (!area) {
      throw new Error('Área curricular no encontrada');
    }

    // Si se cambia el código, verificar duplicados
    if (data.codigo && data.codigo !== area.codigo) {
      const existingArea = await prisma.areacurricular.findFirst({
        where: {
          institucion_id: area.institucion_id!,
          codigo: data.codigo,
          id: { not: id },
        },
      });

      if (existingArea) {
        throw new Error(`Ya existe otra área curricular con el código ${data.codigo}`);
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {};

    if (data.codigo) updateData.codigo = data.codigo;
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.orden !== undefined) updateData.orden = data.orden;
    if (data.esCompetenciaTransversal !== undefined) updateData.escompetenciatransversal = data.esCompetenciaTransversal;
    if (data.activo !== undefined) updateData.activo = data.activo;

    const updated = await prisma.areacurricular.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Área curricular actualizada: ${updated.nombre}`);

    return {
      id: updated.id,
      codigo: updated.codigo,
      nombre: updated.nombre,
      orden: updated.orden,
      esCompetenciaTransversal: updated.escompetenciatransversal,
      activo: updated.activo,
    };
  }

  /**
   * Eliminar un área curricular (soft delete)
   */
  async delete(id: string) {
    const area = await prisma.areacurricular.findUnique({
      where: { id },
    });

    if (!area) {
      throw new Error('Área curricular no encontrada');
    }

    await prisma.areacurricular.update({
      where: { id },
      data: { activo: false },
    });

    logger.info(`Área curricular desactivada: ${area.nombre}`);
  }
}

export const areasCurricularesService = new AreasCurricularesService();
