import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
const prisma = new PrismaClient();
export class GradosService {
    async list(nivelEducativoId, activoOnly = false) {
        const institucion = await prisma.configuracioninstitucion.findFirst({
            where: { activo: true },
        });
        if (!institucion) {
            throw new Error('No se encontró institución activa');
        }
        const where = {
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
    async getById(id) {
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
    async create(data) {
        const institucion = await prisma.configuracioninstitucion.findFirst({
            where: { activo: true },
        });
        if (!institucion) {
            throw new Error('No se encontró institución activa');
        }
        if (data.nivelEducativoId) {
            const nivelEducativo = await prisma.niveleducativo.findUnique({
                where: { id: data.nivelEducativoId },
            });
            if (!nivelEducativo) {
                throw new Error('Nivel educativo no encontrado');
            }
        }
        const existingGrado = await prisma.grado.findFirst({
            where: {
                institucion_id: institucion.id,
                numero: data.numero,
            },
        });
        if (existingGrado) {
            throw new Error(`Ya existe un grado con el número ${data.numero}`);
        }
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
        const gradoData = {
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
    async update(id, data) {
        const grado = await prisma.grado.findUnique({
            where: { id },
        });
        if (!grado) {
            throw new Error('Grado no encontrado');
        }
        if (data.nivelEducativoId) {
            const nivelEducativo = await prisma.niveleducativo.findUnique({
                where: { id: data.nivelEducativoId },
            });
            if (!nivelEducativo) {
                throw new Error('Nivel educativo no encontrado');
            }
        }
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
        const updateData = {};
        if (data.numero !== undefined)
            updateData.numero = data.numero;
        if (data.nombre)
            updateData.nombre = data.nombre;
        if (data.nombreCorto !== undefined)
            updateData.nombrecorto = data.nombreCorto;
        if (data.orden !== undefined)
            updateData.orden = data.orden;
        if (data.activo !== undefined)
            updateData.activo = data.activo;
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
    async delete(id) {
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
    async getByNumero(numero) {
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
//# sourceMappingURL=grados.service.js.map