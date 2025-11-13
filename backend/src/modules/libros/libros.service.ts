/**
 * Servicio de Libros de Actas Físicas
 * Gestión de inventario de libros físicos
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import {
  CreateLibroDTOType,
  UpdateLibroDTOType,
  FiltrosLibroDTOType,
} from './dtos';
import { EstadoLibro } from './types';

const prisma = new PrismaClient();

export class LibrosService {
  /**
   * Crear un nuevo libro
   */
  async create(data: CreateLibroDTOType, institucionId: string) {
    // Verificar que no exista un libro con el mismo código en la institución
    const libroExistente = await prisma.libro.findFirst({
      where: {
        institucion_id: institucionId,
        codigo: data.codigo,
      },
    });

    if (libroExistente) {
      throw new Error(
        `Ya existe un libro con el código "${data.codigo}" en esta institución`
      );
    }

    // Validar que anio_fin sea mayor o igual a anio_inicio si ambos están presentes
    if (data.anio_inicio && data.anio_fin && data.anio_fin < data.anio_inicio) {
      throw new Error('El año de fin debe ser mayor o igual al año de inicio');
    }

    const libro = await prisma.libro.create({
      data: {
        institucion_id: institucionId,
        nivel_id: data.nivel_id,
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo_acta: data.tipo_acta,
        anio_inicio: data.anio_inicio,
        anio_fin: data.anio_fin,
        folio_inicio: data.folio_inicio,
        folio_fin: data.folio_fin,
        total_folios: data.total_folios,
        ubicacion_fisica: data.ubicacion_fisica,
        estante: data.estante,
        seccion_archivo: data.seccion_archivo,
        estado: data.estado || EstadoLibro.ACTIVO,
        observaciones: data.observaciones,
      },
    });

    logger.info(`Libro creado: ${libro.codigo} (${libro.id})`);

    return libro;
  }

  /**
   * Listar libros con filtros y paginación
   */
  async findAll(
    filtros: FiltrosLibroDTOType = {},
    pagination?: { page: number; limit: number }
  ) {
    const { search, estado, activo } = filtros;

    const where: any = {};

    // Filtro de búsqueda por código o descripción
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro por estado
    if (estado) {
      where.estado = estado;
    }

    // Filtro por activo
    if (activo !== undefined) {
      where.activo = activo;
    }

    // Paginación
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [libros, total] = await Promise.all([
      prisma.libro.findMany({
        where,
        include: {
          niveleducativo: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
            },
          },
          _count: {
            select: { actafisica: true },
          },
        },
        orderBy: [{ codigo: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.libro.count({ where }),
    ]);

    return {
      data: libros,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener un libro por ID
   */
  async findById(id: string) {
    const libro = await prisma.libro.findUnique({
      where: { id },
      include: {
        niveleducativo: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
        _count: {
          select: { actafisica: true },
        },
      },
    });

    if (!libro) {
      throw new Error('Libro no encontrado');
    }

    return libro;
  }

  /**
   * Actualizar un libro
   */
  async update(id: string, data: UpdateLibroDTOType) {
    // Verificar que el libro existe
    const libroExistente = await prisma.libro.findUnique({
      where: { id },
    });

    if (!libroExistente) {
      throw new Error('Libro no encontrado');
    }

    // Si se está actualizando el código, verificar que no exista otro con el mismo
    if (data.codigo && data.codigo !== libroExistente.codigo) {
      const libroDuplicado = await prisma.libro.findFirst({
        where: {
          institucion_id: libroExistente.institucion_id,
          codigo: data.codigo,
          id: { not: id },
        },
      });

      if (libroDuplicado) {
        throw new Error(
          `Ya existe otro libro con el código "${data.codigo}" en esta institución`
        );
      }
    }

    // Validar años si se están actualizando
    const anioInicio = data.anio_inicio ?? libroExistente.anio_inicio;
    const anioFin = data.anio_fin ?? libroExistente.anio_fin;

    if (anioInicio && anioFin && anioFin < anioInicio) {
      throw new Error('El año de fin debe ser mayor o igual al año de inicio');
    }

    const libro = await prisma.libro.update({
      where: { id },
      data: {
        nivel_id: data.nivel_id,
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo_acta: data.tipo_acta,
        anio_inicio: data.anio_inicio,
        anio_fin: data.anio_fin,
        folio_inicio: data.folio_inicio,
        folio_fin: data.folio_fin,
        total_folios: data.total_folios,
        ubicacion_fisica: data.ubicacion_fisica,
        estante: data.estante,
        seccion_archivo: data.seccion_archivo,
        estado: data.estado,
        observaciones: data.observaciones,
      },
      include: {
        niveleducativo: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
        _count: {
          select: { actafisica: true },
        },
      },
    });

    logger.info(`Libro actualizado: ${libro.codigo} (${libro.id})`);

    return libro;
  }

  /**
   * Eliminar un libro (soft delete)
   */
  async delete(id: string) {
    // Verificar que el libro existe
    const libro = await prisma.libro.findUnique({
      where: { id },
      include: {
        _count: {
          select: { actafisica: true },
        },
      },
    });

    if (!libro) {
      throw new Error('Libro no encontrado');
    }

    // No permitir eliminar si tiene actas asignadas
    if (libro._count.actafisica > 0) {
      throw new Error(
        `No se puede eliminar el libro "${libro.codigo}" porque tiene ${libro._count.actafisica} acta(s) asignada(s)`
      );
    }

    // Soft delete: marcar como inactivo
    await prisma.libro.update({
      where: { id },
      data: { activo: false },
    });

    logger.info(`Libro eliminado (soft delete): ${libro.codigo} (${libro.id})`);

    return { message: 'Libro eliminado correctamente' };
  }

  /**
   * Obtener libros activos para dropdowns
   */
  async getLibrosActivos(institucionId: string) {
    const libros = await prisma.libro.findMany({
      where: {
        institucion_id: institucionId,
        activo: true,
        estado: EstadoLibro.ACTIVO,
      },
      select: {
        id: true,
        codigo: true,
        descripcion: true,
        ubicacion_fisica: true,
        anio_inicio: true,
        anio_fin: true,
        total_folios: true,
        niveleducativo: {
          select: {
            id: true,
            nombre: true,
          }
        }
      },
      orderBy: { codigo: 'asc' },
    });

    return libros;
  }
}

export const librosService = new LibrosService();

