/**
 * Servicio de Estudiantes
 * CRUD completo + validación DNI único
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { CreateEstudianteDTOType, FiltrosEstudianteDTOType, UpdateEstudianteDTOType } from './dtos';

const prisma = new PrismaClient();

export class EstudiantesService {
  /**
   * Crear nuevo estudiante
   */
  async create(data: CreateEstudianteDTOType) {
    // Validar DNI único por institución
    const existente = await prisma.estudiante.findFirst({
      where: {
        dni: data.dni,
      },
    });

    if (existente) {
      throw new Error(`Ya existe un estudiante con el DNI ${data.dni}`);
    }

    const estudiante = await prisma.estudiante.create({
      data: {
        dni: data.dni,
        nombres: data.nombres,
        apellidopaterno: data.apellidoPaterno,
        apellidomaterno: data.apellidoMaterno,
        fechanacimiento: data.fechaNacimiento,
        lugarnacimiento: data.lugarNacimiento,
        sexo: data.sexo,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        observaciones: data.observaciones,
        estado: data.estado,
      },
    });

    logger.info(`Estudiante creado: ${estudiante.dni} - ${estudiante.nombrecompleto}`);
    return estudiante;
  }

  /**
   * Obtener estudiantes con filtros y paginación
   */
  async findAll(filtros: FiltrosEstudianteDTOType = {}, pagination?: { page: number; limit: number }) {
    const where: any = {};

    // Filtro de búsqueda (DNI o nombre)
    if (filtros.search) {
      where.OR = [
        { dni: { contains: filtros.search } },
        { nombrecompleto: { contains: filtros.search, mode: 'insensitive' } },
        { nombres: { contains: filtros.search, mode: 'insensitive' } },
        { apellidopaterno: { contains: filtros.search, mode: 'insensitive' } },
        { apellidomaterno: { contains: filtros.search, mode: 'insensitive' } },
      ];
    }

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    if (filtros.sexo) {
      where.sexo = filtros.sexo;
    }

    // Paginación
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [estudiantes, total] = await Promise.all([
      prisma.estudiante.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          fecharegistro: 'desc',
        },
      }),
      prisma.estudiante.count({ where }),
    ]);

    return {
      estudiantes,
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
   * Obtener estudiante por ID
   */
  async findById(id: string) {
    const estudiante = await prisma.estudiante.findUnique({
      where: { id },
      include: {
        certificado: {
          select: {
            id: true,
            codigovirtual: true,
            numero: true,
            fechaemision: true,
            estado: true,
          },
        },
        solicitud: {
          select: {
            id: true,
            numeroexpediente: true,
            estado: true,
            fechasolicitud: true,
          },
        },
      },
    });

    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

    return estudiante;
  }

  /**
   * Actualizar estudiante
   */
  async update(id: string, data: UpdateEstudianteDTOType) {
    const estudiante = await this.findById(id);

    // Validar DNI único si se está cambiando
    if (data.dni && data.dni !== estudiante.dni) {
      const existente = await prisma.estudiante.findFirst({
        where: {
          dni: data.dni,
          id: { not: id },
        },
      });

      if (existente) {
        throw new Error(`Ya existe un estudiante con el DNI ${data.dni}`);
      }
    }

    const estudianteActualizado = await prisma.estudiante.update({
      where: { id },
      data: {
        dni: data.dni,
        nombres: data.nombres,
        apellidopaterno: data.apellidoPaterno,
        apellidomaterno: data.apellidoMaterno,
        fechanacimiento: data.fechaNacimiento,
        lugarnacimiento: data.lugarNacimiento,
        sexo: data.sexo,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        observaciones: data.observaciones,
        estado: data.estado,
        fechaactualizacion: new Date(),
      },
    });

    logger.info(`Estudiante actualizado: ${estudianteActualizado.dni}`);
    return estudianteActualizado;
  }

  /**
   * Eliminar estudiante (soft delete - cambiar a INACTIVO)
   */
  async delete(id: string) {
    // Verificar si tiene certificados o solicitudes
    const estudiante = await prisma.estudiante.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            certificado: true,
            solicitud: true,
          },
        },
      },
    });

    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

    if (estudiante._count.certificado > 0 || estudiante._count.solicitud > 0) {
      // Soft delete si tiene registros asociados
      await prisma.estudiante.update({
        where: { id },
        data: {
          estado: 'INACTIVO',
          fechaactualizacion: new Date(),
        },
      });
      logger.info(`Estudiante desactivado (soft delete): ${estudiante.dni}`);
    } else {
      // Hard delete si no tiene registros asociados
      await prisma.estudiante.delete({
        where: { id },
      });
      logger.info(`Estudiante eliminado (hard delete): ${estudiante.dni}`);
    }
  }

  /**
   * Obtener estudiantes activos
   */
  async getActivos() {
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        estado: 'ACTIVO',
      },
      orderBy: {
        nombrecompleto: 'asc',
      },
    });

    return estudiantes;
  }
}

export const estudiantesService = new EstudiantesService();
