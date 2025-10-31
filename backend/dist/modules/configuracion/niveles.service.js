import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
const prisma = new PrismaClient();
export class NivelesService {
    async list(activoOnly = false) {
        const where = {};
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
    async getById(id) {
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
    async create(data) {
        const existingNivel = await prisma.niveleducativo.findFirst({
            where: { codigo: data.codigo },
        });
        if (existingNivel) {
            throw new Error(`Ya existe un nivel educativo con el código ${data.codigo}`);
        }
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
    async update(id, data) {
        const nivel = await prisma.niveleducativo.findUnique({
            where: { id },
        });
        if (!nivel) {
            throw new Error('Nivel educativo no encontrado');
        }
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
        const updateData = {};
        if (data.nombre !== undefined)
            updateData.nombre = data.nombre;
        if (data.codigo !== undefined)
            updateData.codigo = data.codigo;
        if (data.descripcion !== undefined)
            updateData.descripcion = data.descripcion;
        if (data.orden !== undefined)
            updateData.orden = data.orden;
        if (data.activo !== undefined)
            updateData.activo = data.activo;
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
    async delete(id) {
        const nivel = await prisma.niveleducativo.findUnique({
            where: { id },
        });
        if (!nivel) {
            throw new Error('Nivel educativo no encontrado');
        }
        await prisma.niveleducativo.update({
            where: { id },
            data: {
                activo: false,
            },
        });
        logger.info(`Nivel educativo desactivado: ${nivel.nombre}`);
    }
}
export const nivelesService = new NivelesService();
//# sourceMappingURL=niveles.service.js.map