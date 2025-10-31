import { estudiantesService } from './estudiantes.service';
import { logger } from '@config/logger';
import { CreateEstudianteDTO, UpdateEstudianteDTO, SearchEstudianteQueryDTO } from './dtos';
export class EstudiantesController {
    async list(req, res) {
        try {
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const activo = req.query.activo === 'true' ? true : req.query.activo === 'false' ? false : undefined;
            const result = await estudiantesService.list({ page, limit, activo });
            res.status(200).json({
                success: true,
                message: 'Lista de estudiantes',
                data: result.items,
                pagination: result.pagination,
            });
        }
        catch (error) {
            logger.error('Error en list estudiantes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener lista de estudiantes',
            });
        }
    }
    async getById(req, res) {
        try {
            const id = req.params.id;
            const estudiante = await estudiantesService.getById(id);
            res.status(200).json({
                success: true,
                message: 'Estudiante encontrado',
                data: estudiante,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al obtener estudiante';
            logger.error('Error en getById estudiante:', error);
            if (message === 'Estudiante no encontrado') {
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
            const data = CreateEstudianteDTO.parse(req.body);
            const estudiante = await estudiantesService.create(data);
            res.status(201).json({
                success: true,
                message: 'Estudiante creado exitosamente',
                data: estudiante,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al crear estudiante';
            logger.error('Error en create estudiante:', error);
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    async update(req, res) {
        try {
            const id = req.params.id;
            const data = UpdateEstudianteDTO.parse(req.body);
            const estudiante = await estudiantesService.update(id, data);
            res.status(200).json({
                success: true,
                message: 'Estudiante actualizado exitosamente',
                data: estudiante,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al actualizar estudiante';
            logger.error('Error en update estudiante:', error);
            if (message === 'Estudiante no encontrado') {
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
            await estudiantesService.delete(id);
            res.status(200).json({
                success: true,
                message: 'Estudiante eliminado exitosamente',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al eliminar estudiante';
            logger.error('Error en delete estudiante:', error);
            if (message === 'Estudiante no encontrado') {
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
    async search(req, res) {
        try {
            const query = SearchEstudianteQueryDTO.parse(req.query);
            const result = await estudiantesService.search(query);
            res.status(200).json({
                success: true,
                message: 'Resultados de búsqueda',
                data: result.items,
                pagination: result.pagination,
            });
        }
        catch (error) {
            logger.error('Error en search estudiantes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar estudiantes',
            });
        }
    }
    async importCSV(req, res) {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'No se proporcionó un archivo CSV',
                });
                return;
            }
            if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
                res.status(400).json({
                    success: false,
                    message: 'El archivo debe ser un CSV',
                });
                return;
            }
            const results = await estudiantesService.importFromCSV(req.file.buffer);
            res.status(200).json({
                success: true,
                message: 'Importación completada',
                data: results,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al importar CSV';
            logger.error('Error en importCSV:', error);
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
}
export const estudiantesController = new EstudiantesController();
//# sourceMappingURL=estudiantes.controller.js.map