import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
const prisma = new PrismaClient();
export class EstudiantesService {
    async list(options = {}) {
        const { page = 1, limit = 10, activo, } = options;
        const skip = (page - 1) * limit;
        const where = {};
        if (activo !== undefined) {
            where.estado = activo ? 'ACTIVO' : 'INACTIVO';
        }
        const institucion = await prisma.configuracioninstitucion.findFirst({
            where: { activo: true },
        });
        if (institucion) {
            where.institucion_id = institucion.id;
        }
        const total = await prisma.estudiante.count({ where });
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
    async getById(id) {
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
    async create(data) {
        const institucion = await prisma.configuracioninstitucion.findFirst({
            where: { activo: true },
        });
        if (!institucion) {
            throw new Error('No se encontró institución activa');
        }
        const existingEstudiante = await prisma.estudiante.findFirst({
            where: {
                institucion_id: institucion.id,
                dni: data.dni,
            },
        });
        if (existingEstudiante) {
            throw new Error(`Ya existe un estudiante con el DNI ${data.dni}`);
        }
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
    async update(id, data) {
        const estudiante = await prisma.estudiante.findUnique({
            where: { id },
        });
        if (!estudiante) {
            throw new Error('Estudiante no encontrado');
        }
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
        const updateData = {};
        if (data.dni)
            updateData.dni = data.dni;
        if (data.nombres)
            updateData.nombres = data.nombres;
        if (data.apellidoPaterno)
            updateData.apellidopaterno = data.apellidoPaterno;
        if (data.apellidoMaterno)
            updateData.apellidomaterno = data.apellidoMaterno;
        if (data.fechaNacimiento)
            updateData.fechanacimiento = data.fechaNacimiento;
        if (data.lugarNacimiento)
            updateData.lugarnacimiento = data.lugarNacimiento;
        if (data.sexo)
            updateData.sexo = data.sexo;
        if (data.direccion)
            updateData.direccion = data.direccion;
        if (data.telefono)
            updateData.telefono = data.telefono;
        if (data.email)
            updateData.email = data.email;
        if (data.activo !== undefined)
            updateData.estado = data.activo ? 'ACTIVO' : 'INACTIVO';
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
    async delete(id) {
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
    async search(options) {
        const { dni, nombre, page = 1, limit = 10, } = options;
        const skip = (page - 1) * limit;
        const institucion = await prisma.configuracioninstitucion.findFirst({
            where: { activo: true },
        });
        const where = {
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
        const total = await prisma.estudiante.count({ where });
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
    async importFromCSV(buffer) {
        const { parseEstudiantesCSV } = await import('@shared/utils/csv-parser');
        const { data: csvData, errors: parseErrors } = parseEstudiantesCSV(buffer);
        const results = {
            total: csvData.length,
            exitosos: 0,
            errores: [],
            duplicados: [],
        };
        const institucion = await prisma.configuracioninstitucion.findFirst({
            where: { activo: true },
        });
        if (!institucion) {
            throw new Error('No se encontró institución activa');
        }
        parseErrors.forEach((err) => {
            results.errores.push({
                fila: err.row,
                dni: err.data?.DNI || 'N/A',
                error: err.message,
            });
        });
        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const filaNumero = i + 2;
            if (!row) {
                continue;
            }
            try {
                if (!row.FechaNacimiento) {
                    throw new Error('Fecha de nacimiento requerida');
                }
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
            }
            catch (error) {
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
//# sourceMappingURL=estudiantes.service.js.map