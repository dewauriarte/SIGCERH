/**
 * Servicio de grados
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { CreateGradoData, UpdateGradoData } from './types';

const prisma = new PrismaClient();

export class GradosService {
  /**
   * Listar todos los grados
   */
  async list(nivelEducativoId?: string, activoOnly: boolean = false) {
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

    if (nivelEducativoId) {
      where.nivel_id = nivelEducativoId;
    }

    if (activoOnly) {
      where.activo = true;
    }

    const grados = await prisma.grado.findMany({
      where,
      include: {
        niveleducativo: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
      orderBy: { orden: 'asc' },
    });

    return grados.map(g => ({
      id: g.id,
      numero: g.numero,
      nombre: g.nombre,
      nombreCorto: g.nombrecorto,
      orden: g.orden,
      activo: g.activo,
      nivelEducativo: g.niveleducativo ? {
        id: g.niveleducativo.id,
        codigo: g.niveleducativo.codigo,
        nombre: g.niveleducativo.nombre,
      } : null,
    }));
  }

  /**
   * Obtener un grado por ID
   */
  async getById(id: string) {
    const grado = await prisma.grado.findUnique({
      where: { id },
      include: {
        niveleducativo: true,
      },
    });

    if (!grado) {
      throw new Error('Grado no encontrado');
    }

    return {
      id: grado.id,
      numero: grado.numero,
      nombre: grado.nombre,
      nombreCorto: grado.nombrecorto,
      orden: grado.orden,
      activo: grado.activo,
      nivelEducativo: grado.niveleducativo ? {
        id: grado.niveleducativo.id,
        codigo: grado.niveleducativo.codigo,
        nombre: grado.niveleducativo.nombre,
      } : null,
    };
  }

  /**
   * Crear un nuevo grado
   */
  async create(data: CreateGradoData) {
    // Obtener institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!institucion) {
      throw new Error('No se encontró institución activa');
    }

    // Verificar que el nivel educativo existe (si se proporciona)
    if (data.nivelEducativoId) {
      const nivelEducativo = await prisma.niveleducativo.findUnique({
        where: { id: data.nivelEducativoId },
      });

      if (!nivelEducativo) {
        throw new Error('Nivel educativo no encontrado');
      }
    }

    // Verificar si ya existe un grado con el mismo número
    const existingGrado = await prisma.grado.findFirst({
      where: {
        institucion_id: institucion.id,
        numero: data.numero,
      },
    });

    if (existingGrado) {
      throw new Error(`Ya existe un grado con el número ${data.numero}`);
    }

    // Si no se especifica orden, usar el siguiente disponible
    let orden = data.orden || 0;
    if (!data.orden) {
      const maxOrden = await prisma.grado.aggregate({
        where: {
          institucion_id: institucion.id,
          nivel_id: data.nivelEducativoId || null,
        },
        _max: { orden: true },
      });
      orden = (maxOrden._max.orden || 0) + 1;
    }

    const gradoData: any = {
      numero: data.numero,
      nombre: data.nombre,
      nombrecorto: data.nombreCorto || null,
      orden,
      activo: true,
      configuracioninstitucion: {
        connect: { id: institucion.id },
      },
    };

    if (data.nivelEducativoId) {
      gradoData.niveleducativo = {
        connect: { id: data.nivelEducativoId },
      };
    }

    const grado = await prisma.grado.create({
      data: gradoData,
      include: {
        niveleducativo: true,
      },
    });

    logger.info(`Grado creado: ${grado.nombre} (Número: ${grado.numero})`);

    return {
      id: grado.id,
      numero: grado.numero,
      nombre: grado.nombre,
      nombreCorto: grado.nombrecorto,
      orden: grado.orden,
      activo: grado.activo,
      nivelEducativo: grado.niveleducativo ? {
        id: grado.niveleducativo.id,
        codigo: grado.niveleducativo.codigo,
        nombre: grado.niveleducativo.nombre,
      } : null,
    };
  }

  /**
   * Actualizar un grado
   */
  async update(id: string, data: UpdateGradoData) {
    const grado = await prisma.grado.findUnique({
      where: { id },
    });

    if (!grado) {
      throw new Error('Grado no encontrado');
    }

    // Si se cambia el nivel educativo, verificar que existe
    if (data.nivelEducativoId) {
      const nivelEducativo = await prisma.niveleducativo.findUnique({
        where: { id: data.nivelEducativoId },
      });

      if (!nivelEducativo) {
        throw new Error('Nivel educativo no encontrado');
      }
    }

    // Si se cambia el número, verificar duplicados
    if (data.numero && data.numero !== grado.numero) {
      const existingGrado = await prisma.grado.findFirst({
        where: {
          institucion_id: grado.institucion_id,
          numero: data.numero,
          id: { not: id },
        },
      });

      if (existingGrado) {
        throw new Error(`Ya existe otro grado con el número ${data.numero}`);
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {};

    if (data.numero !== undefined) updateData.numero = data.numero;
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.nombreCorto !== undefined) updateData.nombrecorto = data.nombreCorto;
    if (data.orden !== undefined) updateData.orden = data.orden;
    if (data.activo !== undefined) updateData.activo = data.activo;

    if (data.nivelEducativoId) {
      updateData.niveleducativo = {
        connect: { id: data.nivelEducativoId },
      };
    }

    const updated = await prisma.grado.update({
      where: { id },
      data: updateData,
      include: {
        niveleducativo: true,
      },
    });

    logger.info(`Grado actualizado: ${updated.nombre}`);

    return {
      id: updated.id,
      numero: updated.numero,
      nombre: updated.nombre,
      nombreCorto: updated.nombrecorto,
      orden: updated.orden,
      activo: updated.activo,
      nivelEducativo: updated.niveleducativo ? {
        id: updated.niveleducativo.id,
        codigo: updated.niveleducativo.codigo,
        nombre: updated.niveleducativo.nombre,
      } : null,
    };
  }

  /**
   * Eliminar un grado (soft delete)
   */
  async delete(id: string) {
    const grado = await prisma.grado.findUnique({
      where: { id },
    });

    if (!grado) {
      throw new Error('Grado no encontrado');
    }

    await prisma.grado.update({
      where: { id },
      data: { activo: false },
    });

    logger.info(`Grado desactivado: ${grado.nombre}`);
  }

  /**
   * Obtener grado por número corto (para el OCR)
   */
  async getByNumero(numero: number) {
    // Obtener institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!institucion) {
      throw new Error('No se encontró institución activa');
    }

    const grado = await prisma.grado.findFirst({
      where: {
        institucion_id: institucion.id,
        numero,
      },
    });

    if (!grado) {
      throw new Error(`Grado ${numero} no encontrado`);
    }

    return {
      id: grado.id,
      numero: grado.numero,
      nombre: grado.nombre,
      nombreCorto: grado.nombrecorto,
    };
  }
}

export const gradosService = new GradosService();
