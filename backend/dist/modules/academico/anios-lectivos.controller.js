import { aniosLectivosService } from './anios-lectivos.service';
import { logger } from '@config/logger';
import { CreateAnioLectivoDTO, UpdateAnioLectivoDTO } from './dtos';
export class AniosLectivosController {
    async list(req, res) {
        try {
            const activoOnly = req.query.activo === 'true';
            const anios = await aniosLectivosService.list(activoOnly);
            res.status(200).json({
                success: true,
                message: 'Lista de años lectivos',
                data: anios,
            });
        }
        catch (error) {
            logger.error('Error en list años lectivos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener lista de años lectivos',
            });
        }
    }
    async getById(req, res) {
        try {
            const id = req.params.id;
            const anio = await aniosLectivosService.getById(id);
            res.status(200).json({
                success: true,
                message: 'Año lectivo encontrado',
                data: anio,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al obtener año lectivo';
            logger.error('Error en getById año lectivo:', error);
            if (message === 'Año lectivo no encontrado') {
                res.status(404).json({ success: false, message });
                return;
            }
            res.status(500).json({ success: false, message });
        }
    }
    async create(req, res) {
        try {
            const data = CreateAnioLectivoDTO.parse(req.body);
            const anio = await aniosLectivosService.create(data);
            res.status(201).json({
                success: true,
                message: 'Año lectivo creado exitosamente',
                data: anio,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al crear año lectivo';
            logger.error('Error en create año lectivo:', error);
            res.status(400).json({ success: false, message });
        }
    }
    async update(req, res) {
        try {
            const id = req.params.id;
            const data = UpdateAnioLectivoDTO.parse(req.body);
            const anio = await aniosLectivosService.update(id, data);
            res.status(200).json({
                success: true,
                message: 'Año lectivo actualizado exitosamente',
                data: anio,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al actualizar año lectivo';
            logger.error('Error en update año lectivo:', error);
            if (message === 'Año lectivo no encontrado') {
                res.status(404).json({ success: false, message });
                return;
            }
            res.status(400).json({ success: false, message });
        }
    }
    async delete(req, res) {
        try {
            const id = req.params.id;
            await aniosLectivosService.delete(id);
            res.status(200).json({
                success: true,
                message: 'Año lectivo eliminado exitosamente',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al eliminar año lectivo';
            logger.error('Error en delete año lectivo:', error);
            if (message === 'Año lectivo no encontrado') {
                res.status(404).json({ success: false, message });
                return;
            }
            res.status(500).json({ success: false, message });
        }
    }
}
export const aniosLectivosController = new AniosLectivosController();
//# sourceMappingURL=anios-lectivos.controller.js.map