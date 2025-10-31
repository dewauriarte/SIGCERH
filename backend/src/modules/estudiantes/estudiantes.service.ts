/**
 * Servicio de estudiantes
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { CreateEstudianteData, UpdateEstudianteData, SearchEstudianteOptions } from './types';

const prisma = new PrismaClient();

export class EstudiantesService {
  /**
   * Listar estudiantes con paginación y filtros
   */
  async list(options: { page?: number; limit?: number; activo?: boolean } = {}) {
    const {
      page = 1,
      limit = 10,
      activo,
    } = options;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (activo !== undefined) {
      where.estado = activo ? 'ACTIVO' : 'INACTIVO';
    }

    // Obtener institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (institucion) {
      where.institucion_id = institucion.id;
    }

    // Contar total
    const total = await prisma.estudiante.count({ where });

    // Obtener estudiantes
    const estudiantes = await prisma.estudiante.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        apellidopaterno: 'asc',
      },
    });

    return {
      items: estudiantes.map(e => ({
        id: e.id,
        dni: e.dni,
        nombres: e.nombres,
        apellidoPaterno: e.apellidopaterno,
        apellidoMaterno: e.apellidomaterno,
        fechaNacimiento: e.fechanacimiento,
        lugarNacimiento: e.lugarnacimiento,
        sexo: e.sexo,
        direccion: e.direccion,
        telefono: e.telefono,
        email: e.email,
        estado: e.estado,
        fechaRegistro: e.fecharegistro,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener un estudiante por ID
   */
  async getById(id: string) {
    const estudiante = await prisma.estudiante.findUnique({
      where: { id },
    });

    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

    return {
      id: estudiante.id,
      dni: estudiante.dni,
      nombres: estudiante.nombres,
      apellidoPaterno: estudiante.apellidopaterno,
      apellidoMaterno: estudiante.apellidomaterno,
      fechaNacimiento: estudiante.fechanacimiento,
      lugarNacimiento: estudiante.lugarnacimiento,
      sexo: estudiante.sexo,
      direccion: estudiante.direccion,
      telefono: estudiante.telefono,
      email: estudiante.email,
      estado: estudiante.estado,
      fechaRegistro: estudiante.fecharegistro,
    };
  }

  /**
   * Crear un nuevo estudiante
   */
  async create(data: CreateEstudianteData) {
    // Obtener institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!institucion) {
      throw new Error('No se encontró institución activa');
    }

    // Verificar si ya existe un estudiante con el mismo DNI
    const existingEstudiante = await prisma.estudiante.findFirst({
      where: {
        institucion_id: institucion.id,
        dni: data.dni,
      },
    });

    if (existingEstudiante) {
      throw new Error(`Ya existe un estudiante con el DNI ${data.dni}`);
    }

    // Validar que la fecha de nacimiento esté presente
    if (!data.fechaNacimiento) {
      throw new Error('La fecha de nacimiento es requerida');
    }

    const estudiante = await prisma.estudiante.create({
      data: {
        institucion_id: institucion.id,
        dni: data.dni,
        nombres: data.nombres,
        apellidopaterno: data.apellidoPaterno,
        apellidomaterno: data.apellidoMaterno,
        fechanacimiento: new Date(data.fechaNacimiento),
        lugarnacimiento: data.lugarNacimiento || null,
        sexo: data.sexo || null,
        direccion: data.direccion || null,
        telefono: data.telefono || null,
        email: data.email || null,
        estado: 'ACTIVO',
      },
    });

    logger.info(`Estudiante creado: ${estudiante.nombres} ${estudiante.apellidopaterno} (DNI: ${estudiante.dni})`);

    return {
      id: estudiante.id,
      dni: estudiante.dni,
      nombres: estudiante.nombres,
      apellidoPaterno: estudiante.apellidopaterno,
      apellidoMaterno: estudiante.apellidomaterno,
      fechaNacimiento: estudiante.fechanacimiento,
      lugarNacimiento: estudiante.lugarnacimiento,
      sexo: estudiante.sexo,
      direccion: estudiante.direccion,
      telefono: estudiante.telefono,
      email: estudiante.email,
      estado: estudiante.estado,
      fechaRegistro: estudiante.fecharegistro,
    };
  }

  /**
   * Actualizar un estudiante
   */
  async update(id: string, data: UpdateEstudianteData) {
    const estudiante = await prisma.estudiante.findUnique({
      where: { id },
    });

    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

    // Si se cambia el DNI, verificar duplicados
    if (data.dni && data.dni !== estudiante.dni) {
      const existingEstudiante = await prisma.estudiante.findFirst({
        where: {
          institucion_id: estudiante.institucion_id,
          dni: data.dni,
          id: { not: id },
        },
      });

      if (existingEstudiante) {
        throw new Error(`Ya existe otro estudiante con el DNI ${data.dni}`);
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {};

    if (data.dni) updateData.dni = data.dni;
    if (data.nombres) updateData.nombres = data.nombres;
    if (data.apellidoPaterno) updateData.apellidopaterno = data.apellidoPaterno;
    if (data.apellidoMaterno) updateData.apellidomaterno = data.apellidoMaterno;
    if (data.fechaNacimiento) updateData.fechanacimiento = data.fechaNacimiento;
    if (data.lugarNacimiento) updateData.lugarnacimiento = data.lugarNacimiento;
    if (data.sexo) updateData.sexo = data.sexo;
    if (data.direccion) updateData.direccion = data.direccion;
    if (data.telefono) updateData.telefono = data.telefono;
    if (data.email) updateData.email = data.email;
    if (data.activo !== undefined) updateData.estado = data.activo ? 'ACTIVO' : 'INACTIVO';

    const updated = await prisma.estudiante.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Estudiante actualizado: ${updated.nombres} ${updated.apellidopaterno} (DNI: ${updated.dni})`);

    return {
      id: updated.id,
      dni: updated.dni,
      nombres: updated.nombres,
      apellidoPaterno: updated.apellidopaterno,
      apellidoMaterno: updated.apellidomaterno,
      fechaNacimiento: updated.fechanacimiento,
      lugarNacimiento: updated.lugarnacimiento,
      sexo: updated.sexo,
      direccion: updated.direccion,
      telefono: updated.telefono,
      email: updated.email,
      estado: updated.estado,
      fechaRegistro: updated.fecharegistro,
    };
  }

  /**
   * Eliminar un estudiante (soft delete)
   */
  async delete(id: string) {
    const estudiante = await prisma.estudiante.findUnique({
      where: { id },
    });

    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

    await prisma.estudiante.update({
      where: { id },
      data: { estado: 'INACTIVO' },
    });

    logger.info(`Estudiante desactivado: ${estudiante.nombres} ${estudiante.apellidopaterno} (DNI: ${estudiante.dni})`);
  }

  /**
   * Búsqueda avanzada de estudiantes
   */
  async search(options: SearchEstudianteOptions) {
    const {
      dni,
      nombre,
      page = 1,
      limit = 10,
    } = options;

    const skip = (page - 1) * limit;

    // Obtener institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    // Construir filtros
    const where: any = {
      activo: true,
    };

    if (institucion) {
      where.institucion_id = institucion.id;
    }

    if (dni) {
      where.dni = { contains: dni };
    }

    if (nombre) {
      where.OR = [
        { nombres: { contains: nombre, mode: 'insensitive' } },
        { apellidopaterno: { contains: nombre, mode: 'insensitive' } },
        { apellidomaterno: { contains: nombre, mode: 'insensitive' } },
      ];
    }

    // Contar total
    const total = await prisma.estudiante.count({ where });

    // Obtener estudiantes
    const estudiantes = await prisma.estudiante.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { apellidopaterno: 'asc' },
        { apellidomaterno: 'asc' },
        { nombres: 'asc' },
      ],
    });

    return {
      items: estudiantes.map(e => ({
        id: e.id,
        dni: e.dni,
        nombres: e.nombres,
        apellidoPaterno: e.apellidopaterno,
        apellidoMaterno: e.apellidomaterno,
        nombreCompleto: `${e.apellidopaterno} ${e.apellidomaterno}, ${e.nombres}`,
        fechaNacimiento: e.fechanacimiento,
        sexo: e.sexo,
        estado: e.estado,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Importar estudiantes desde archivo CSV
   */
  async importFromCSV(buffer: Buffer) {
    const { parseEstudiantesCSV } = await import('@shared/utils/csv-parser');
    
    // Parsear CSV
    const { data: csvData, errors: parseErrors } = parseEstudiantesCSV(buffer);

    const results = {
      total: csvData.length,
      exitosos: 0,
      errores: [] as Array<{ fila: number; dni: string; error: string }>,
      duplicados: [] as Array<{ fila: number; dni: string }>,
    };

    // Obtener institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!institucion) {
      throw new Error('No se encontró institución activa');
    }

    // Agregar errores de parseo
    parseErrors.forEach((err) => {
      results.errores.push({
        fila: err.row,
        dni: err.data?.DNI || 'N/A',
        error: err.message,
      });
    });

    // Procesar cada estudiante válido
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const filaNumero = i + 2; // +2 porque empezamos en 1 y la primera es header

      // Verificar que row no sea undefined
      if (!row) {
        continue;
      }

      try {
        // Validar datos requeridos
        if (!row.FechaNacimiento) {
          throw new Error('Fecha de nacimiento requerida');
        }

        // Verificar si ya existe
        const existingEstudiante = await prisma.estudiante.findFirst({
          where: {
            institucion_id: institucion.id,
            dni: row.DNI,
          },
        });

        if (existingEstudiante) {
          results.duplicados.push({
            fila: filaNumero,
            dni: row.DNI,
          });
          continue;
        }

        // Crear estudiante
        await prisma.estudiante.create({
          data: {
            institucion_id: institucion.id,
            dni: row.DNI,
            nombres: row.Nombres,
            apellidopaterno: row.ApellidoPaterno,
            apellidomaterno: row.ApellidoMaterno,
            fechanacimiento: new Date(row.FechaNacimiento),
            lugarnacimiento: row.LugarNacimiento || null,
            sexo: row.Sexo || null,
            direccion: row.Direccion || null,
            telefono: row.Telefono || null,
            email: row.Email || null,
            estado: 'ACTIVO',
          },
        });

        results.exitosos++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        results.errores.push({
          fila: filaNumero,
          dni: row.DNI,
          error: message,
        });
      }
    }

    logger.info(`Importación CSV completada: ${results.exitosos}/${results.total} exitosos`);

    return results;
  }
}

export const estudiantesService = new EstudiantesService();

