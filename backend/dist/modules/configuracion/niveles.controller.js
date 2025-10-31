import { nivelesService } from './niveles.service';
import { logger } from '@config/logger';
import { CreateNivelDTO, UpdateNivelDTO } from './dtos';
export class NivelesController {
    async list(req, res) {
        try {
            const activoOnly = req.query.activo === 'true';
            const niveles = await nivelesService.list(activoOnly);
            res.status(200).json({
                success: true,
                message: 'Lista de niveles educativos',
                data: niveles,
            });
        }
        catch (error) {
            logger.error('Error en list niveles:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener lista de niveles',
            });
        }
    }
    async getById(req, res) {
        try {
            const id = req.params.id;
            const nivel = await nivelesService.getById(id);
            res.status(200).json({
                success: true,
                message: 'Nivel educativo encontrado',
                data: nivel,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al obtener nivel';
            logger.error('Error en getById nivel:', error);
            if (message === 'Nivel educativo no encontrado') {
                res.status(404).json({
                    success: false,
                    message,
                });
                return;
            }
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async create(req, res) {
        try {
            const data = CreateNivelDTO.parse(req.body);
            const nivel = await nivelesService.create(data);
            res.status(201).json({
                success: true,
                message: 'Nivel educativo creado exitosamente',
                data: nivel,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al crear nivel';
            logger.error('Error en create nivel:', error);
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    async update(req, res) {
        try {
            const id = req.params.id;
            const data = UpdateNivelDTO.parse(req.body);
            const nivel = await nivelesService.update(id, data);
            res.status(200).json({
                success: true,
                message: 'Nivel educativo actualizado exitosamente',
                data: nivel,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al actualizar nivel';
            logger.error('Error en update nivel:', error);
            if (message === 'Nivel educativo no encontrado') {
                res.status(404).json({
                    success: false,
                    message,
                });
                return;
            }
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    async delete(req, res) {
        try {
            const id = req.params.id;
            await nivelesService.delete(id);
            res.status(200).json({
                success: true,
                message: 'Nivel educativo eliminado exitosamente',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al eliminar nivel';
            logger.error('Error en delete nivel:', error);
            if (message === 'Nivel educativo no encontrado') {
                res.status(404).json({
                    success: false,
                    message,
                });
                return;
            }
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
}
export const nivelesController = new NivelesController();
//# sourceMappingURL=niveles.controller.js.map