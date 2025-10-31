/**
 * Servicio de años lectivos
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { CreateAnioLectivoData, UpdateAnioLectivoData } from './types';

const prisma = new PrismaClient();

export class AniosLectivosService {
  /**
   * Listar todos los años lectivos
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

    const anios = await prisma.aniolectivo.findMany({
      where,
      orderBy: { anio: 'desc' },
    });

    return anios.map(a => ({
      id: a.id,
      anio: a.anio,
      fechaInicio: a.fechainicio,
      fechaFin: a.fechafin,
      activo: a.activo,
      observaciones: a.observaciones,
    }));
  }

  /**
   * Obtener un año lectivo por ID
   */
  async getById(id: string) {
    const anio = await prisma.aniolectivo.findUnique({
      where: { id },
    });

    if (!anio) {
      throw new Error('Año lectivo no encontrado');
    }

    return {
      id: anio.id,
      anio: anio.anio,
      fechaInicio: anio.fechainicio,
      fechaFin: anio.fechafin,
      activo: anio.activo,
      observaciones: anio.observaciones,
    };
  }

  /**
   * Crear un nuevo año lectivo
   */
  async create(data: CreateAnioLectivoData) {
    // Validar rango histórico
    if (data.anio < 1985 || data.anio > 2012) {
      throw new Error('El año debe estar en el rango 1985-2012');
    }

    // Obtener institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!institucion) {
      throw new Error('No se encontró institución activa');
    }

    // Verificar si ya existe el año
    const existingAnio = await prisma.aniolectivo.findFirst({
      where: {
        institucion_id: institucion.id,
        anio: data.anio,
      },
    });

    if (existingAnio) {
      throw new Error(`El año lectivo ${data.anio} ya existe`);
    }

    // Fechas por defecto si no se proporcionan
    const fechaInicio = data.fechaInicio || new Date(`${data.anio}-03-01`);
    const fechaFin = data.fechaFin || new Date(`${data.anio}-12-31`);

    const anio = await prisma.aniolectivo.create({
      data: {
        anio: data.anio,
        fechainicio: fechaInicio,
        fechafin: fechaFin,
        activo: true,
        configuracioninstitucion: {
          connect: { id: institucion.id },
        },
      },
    });

    logger.info(`Año lectivo creado: ${anio.anio}`);

    return {
      id: anio.id,
      anio: anio.anio,
      fechaInicio: anio.fechainicio,
      fechaFin: anio.fechafin,
      activo: anio.activo,
      observaciones: anio.observaciones,
    };
  }

  /**
   * Actualizar un año lectivo
   */
  async update(id: string, data: UpdateAnioLectivoData) {
    const anio = await prisma.aniolectivo.findUnique({
      where: { id },
    });

    if (!anio) {
      throw new Error('Año lectivo no encontrado');
    }

    // Validar rango si se cambia el año
    if (data.anio && (data.anio < 1985 || data.anio > 2012)) {
      throw new Error('El año debe estar en el rango 1985-2012');
    }

    // Si se cambia el año, verificar duplicados
    if (data.anio && data.anio !== anio.anio) {
      const existingAnio = await prisma.aniolectivo.findFirst({
        where: {
          institucion_id: anio.institucion_id,
          anio: data.anio,
          id: { not: id },
        },
      });

      if (existingAnio) {
        throw new Error(`Ya existe otro año lectivo con el año ${data.anio}`);
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {};

    if (data.anio !== undefined) updateData.anio = data.anio;
    if (data.fechaInicio !== undefined) updateData.fechainicio = data.fechaInicio;
    if (data.fechaFin !== undefined) updateData.fechafin = data.fechaFin;
    if (data.activo !== undefined) updateData.activo = data.activo;

    const updated = await prisma.aniolectivo.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Año lectivo actualizado: ${updated.anio}`);

    return {
      id: updated.id,
      anio: updated.anio,
      fechaInicio: updated.fechainicio,
      fechaFin: updated.fechafin,
      activo: updated.activo,
      observaciones: updated.observaciones,
    };
  }

  /**
   * Eliminar un año lectivo (soft delete)
   */
  async delete(id: string) {
    const anio = await prisma.aniolectivo.findUnique({
      where: { id },
    });

    if (!anio) {
      throw new Error('Año lectivo no encontrado');
    }

    await prisma.aniolectivo.update({
      where: { id },
      data: { activo: false },
    });

    logger.info(`Año lectivo desactivado: ${anio.anio}`);
  }
}

export const aniosLectivosService = new AniosLectivosService();

