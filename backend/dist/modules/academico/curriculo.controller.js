import { curriculoGradoService } from './curriculo-grado.service';
import { logger } from '@config/logger';
import { z } from 'zod';
const AssignAreasSchema = z.object({
    gradoId: z.string().uuid(),
    anioLectivoId: z.string().uuid(),
    areas: z.array(z.object({
        areaCurricularId: z.string().uuid(),
        orden: z.number().int().min(1),
    })),
});
export class CurriculoController {
    async assignAreasToGrado(req, res) {
        try {
            const data = AssignAreasSchema.parse(req.body);
            const result = await curriculoGradoService.assignAreasToGrado(data);
            res.status(200).json({
                success: true,
                message: 'Áreas asignadas al grado exitosamente',
                data: result,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al asignar áreas';
            logger.error('Error en assignAreasToGrado:', error);
            res.status(400).json({ success: false, message });
        }
    }
    async getPlantilla(req, res) {
        try {
            const anio = req.query.anio ? parseInt(req.query.anio) : undefined;
            const numeroGrado = req.query.grado ? parseInt(req.query.grado) : undefined;
            if (!anio || !numeroGrado) {
                res.status(400).json({
                    success: false,
                    message: 'Se requieren los parámetros "anio" y "grado"',
                });
                return;
            }
            if (anio < 1985 || anio > 2012) {
                res.status(400).json({
                    success: false,
                    message: 'El año debe estar en el rango 1985-2012',
                });
                return;
            }
            if (numeroGrado < 1 || numeroGrado > 7) {
                res.status(400).json({
                    success: false,
                    message: 'El grado debe estar en el rango 1-7',
                });
                return;
            }
            const plantilla = await curriculoGradoService.getPlantillaByAnioGrado(anio, numeroGrado);
            res.status(200).json({
                success: true,
                message: 'Plantilla de currículo',
                data: {
                    anio,
                    grado: numeroGrado,
                    areas: plantilla,
                },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al obtener plantilla';
            logger.error('Error en getPlantilla:', error);
            if (message.includes('no encontrado')) {
                res.status(404).json({ success: false, message });
                return;
            }
            res.status(500).json({ success: false, message });
        }
    }
    async getByGrado(req, res) {
        try {
            const gradoId = req.params.gradoId;
            const anioLectivoId = req.query.anioLectivoId;
            const asignaciones = await curriculoGradoService.getByGrado(gradoId, anioLectivoId);
            res.status(200).json({
                success: true,
                message: 'Asignaciones de currículo',
                data: asignaciones,
            });
        }
        catch (error) {
            logger.error('Error en getByGrado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener asignaciones',
            });
        }
    }
    async updateOrden(req, res) {
        try {
            const id = req.params.id;
            const { orden } = req.body;
            if (typeof orden !== 'number' || orden < 1) {
                res.status(400).json({
                    success: false,
                    message: 'El orden debe ser un número mayor a 0',
                });
                return;
            }
            await curriculoGradoService.updateOrden(id, orden);
            res.status(200).json({
                success: true,
                message: 'Orden actualizado exitosamente',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al actualizar orden';
            logger.error('Error en updateOrden:', error);
            if (message.includes('no encontrada')) {
                res.status(404).json({ success: false, message });
                return;
            }
            res.status(500).json({ success: false, message });
        }
    }
    async removeArea(req, res) {
        try {
            const id = req.params.id;
            await curriculoGradoService.removeArea(id);
            res.status(200).json({
                success: true,
                message: 'Área removida del currículo exitosamente',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al remover área';
            logger.error('Error en removeArea:', error);
            if (message.includes('no encontrada')) {
                res.status(404).json({ success: false, message });
                return;
            }
            res.status(500).json({ success: false, message });
        }
    }
}
export const curriculoController = new CurriculoController();
//# sourceMappingURL=curriculo.controller.js.map