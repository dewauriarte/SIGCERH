import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
const prisma = new PrismaClient();
export class CurriculoGradoService {
    async assignAreasToGrado(data) {
        const { gradoId, anioLectivoId, areas } = data;
        const grado = await prisma.grado.findUnique({
            where: { id: gradoId },
        });
        if (!grado) {
            throw new Error('Grado no encontrado');
        }
        const anioLectivo = await prisma.aniolectivo.findUnique({
            where: { id: anioLectivoId },
        });
        if (!anioLectivo) {
            throw new Error('Año lectivo no encontrado');
        }
        for (const area of areas) {
            const areaCurricular = await prisma.areacurricular.findUnique({
                where: { id: area.areaCurricularId },
            });
            if (!areaCurricular) {
                throw new Error(`Área curricular ${area.areaCurricularId} no encontrada`);
            }
            if (!areaCurricular.activo) {
                throw new Error(`El área ${areaCurricular.nombre} no está activa`);
            }
        }
        await prisma.curriculogrado.deleteMany({
            where: {
                grado_id: gradoId,
                aniolectivo_id: anioLectivoId,
            },
        });
        const asignaciones = await Promise.all(areas.map((area) => prisma.curriculogrado.create({
            data: {
                grado_id: gradoId,
                aniolectivo_id: anioLectivoId,
                area_id: area.areaCurricularId,
                orden: area.orden,
                activo: true,
            },
            include: {
                areacurricular: true,
            },
        })));
        logger.info(`Asignadas ${asignaciones.length} áreas al grado ${grado.nombre} para el año ${anioLectivo.anio}`);
        return asignaciones.map((a) => ({
            id: a.id,
            orden: a.orden,
            area: {
                id: a.areacurricular.id,
                codigo: a.areacurricular.codigo,
                nombre: a.areacurricular.nombre,
            },
        }));
    }
    async getPlantillaByAnioGrado(anio, numeroGrado) {
        const institucion = await prisma.configuracioninstitucion.findFirst({
            where: { activo: true },
        });
        if (!institucion) {
            throw new Error('No se encontró institución activa');
        }
        const anioLectivo = await prisma.aniolectivo.findFirst({
            where: {
                institucion_id: institucion.id,
                anio,
            },
        });
        if (!anioLectivo) {
            throw new Error(`Año lectivo ${anio} no encontrado`);
        }
        const grado = await prisma.grado.findFirst({
            where: {
                institucion_id: institucion.id,
                numero: numeroGrado,
            },
        });
        if (!grado) {
            throw new Error(`Grado ${numeroGrado} no encontrado`);
        }
        const curriculo = await prisma.curriculogrado.findMany({
            where: {
                grado_id: grado.id,
                aniolectivo_id: anioLectivo.id,
                activo: true,
            },
            include: {
                areacurricular: true,
            },
            orderBy: {
                orden: 'asc',
            },
        });
        if (curriculo.length === 0) {
            logger.warn(`No hay currículo configurado para grado ${numeroGrado} en ${anio}`);
            const areasVigentes = await prisma.areacurricular.findMany({
                where: {
                    institucion_id: institucion.id,
                    activo: true,
                },
                orderBy: {
                    orden: 'asc',
                },
            });
            return areasVigentes.map((area) => ({
                id: area.id,
                codigo: area.codigo,
                nombre: area.nombre,
                orden: area.orden,
            }));
        }
        return curriculo.map((c) => ({
            id: c.areacurricular.id,
            codigo: c.areacurricular.codigo,
            nombre: c.areacurricular.nombre,
            orden: c.orden,
        }));
    }
    async getByGrado(gradoId, anioLectivoId) {
        const where = {
            grado_id: gradoId,
            activo: true,
        };
        if (anioLectivoId) {
            where.aniolectivo_id = anioLectivoId;
        }
        const asignaciones = await prisma.curriculogrado.findMany({
            where,
            include: {
                areacurricular: true,
                aniolectivo: true,
                grado: true,
            },
            orderBy: [{ aniolectivo: { anio: 'desc' } }, { orden: 'asc' }],
        });
        return asignaciones.map((a) => ({
            id: a.id,
            orden: a.orden,
            activo: a.activo,
            anio: {
                id: a.aniolectivo.id,
                anio: a.aniolectivo.anio,
            },
            grado: {
                id: a.grado.id,
                numero: a.grado.numero,
                nombre: a.grado.nombre,
            },
            area: {
                id: a.areacurricular.id,
                codigo: a.areacurricular.codigo,
                nombre: a.areacurricular.nombre,
            },
        }));
    }
    async updateOrden(curriculoGradoId, nuevoOrden) {
        const curriculo = await prisma.curriculogrado.findUnique({
            where: { id: curriculoGradoId },
        });
        if (!curriculo) {
            throw new Error('Asignación de currículo no encontrada');
        }
        await prisma.curriculogrado.update({
            where: { id: curriculoGradoId },
            data: { orden: nuevoOrden },
        });
        logger.info(`Orden actualizado para currículo ${curriculoGradoId}: ${nuevoOrden}`);
    }
    async removeArea(curriculoGradoId) {
        const curriculo = await prisma.curriculogrado.findUnique({
            where: { id: curriculoGradoId },
        });
        if (!curriculo) {
            throw new Error('Asignación de currículo no encontrada');
        }
        await prisma.curriculogrado.update({
            where: { id: curriculoGradoId },
            data: { activo: false },
        });
        logger.info(`Área removida del currículo: ${curriculoGradoId}`);
    }
}
export const curriculoGradoService = new CurriculoGradoService();
//# sourceMappingURL=curriculo-grado.service.js.map