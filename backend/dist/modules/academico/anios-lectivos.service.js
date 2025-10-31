import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
const prisma = new PrismaClient();
export class AniosLectivosService {
    async list(activoOnly = false) {
        const institucion = await prisma.configuracioninstitucion.findFirst({
            where: { activo: true },
        });
        if (!institucion) {
            throw new Error('No se encontró institución activa');
        }
        const where = {
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
    async getById(id) {
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
    async create(data) {
        if (data.anio < 1985 || data.anio > 2012) {
            throw new Error('El año debe estar en el rango 1985-2012');
        }
        const institucion = await prisma.configuracioninstitucion.findFirst({
            where: { activo: true },
        });
        if (!institucion) {
            throw new Error('No se encontró institución activa');
        }
        const existingAnio = await prisma.aniolectivo.findFirst({
            where: {
                institucion_id: institucion.id,
                anio: data.anio,
            },
        });
        if (existingAnio) {
            throw new Error(`El año lectivo ${data.anio} ya existe`);
        }
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
    async update(id, data) {
        const anio = await prisma.aniolectivo.findUnique({
            where: { id },
        });
        if (!anio) {
            throw new Error('Año lectivo no encontrado');
        }
        if (data.anio && (data.anio < 1985 || data.anio > 2012)) {
            throw new Error('El año debe estar en el rango 1985-2012');
        }
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
        const updateData = {};
        if (data.anio !== undefined)
            updateData.anio = data.anio;
        if (data.fechaInicio !== undefined)
            updateData.fechainicio = data.fechaInicio;
        if (data.fechaFin !== undefined)
            updateData.fechafin = data.fechaFin;
        if (data.activo !== undefined)
            updateData.activo = data.activo;
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
    async delete(id) {
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
//# sourceMappingURL=anios-lectivos.service.js.map