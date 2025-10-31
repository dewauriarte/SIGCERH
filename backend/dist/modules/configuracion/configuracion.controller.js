import { configuracionService } from './configuracion.service';
import { fileUploadService } from '@shared/services/file-upload.service';
import { logger } from '@config/logger';
import { UpdateConfiguracionDTO } from './dtos';
export class ConfiguracionController {
    async getInstitucion(_req, res) {
        try {
            const config = await configuracionService.getConfiguracion();
            res.status(200).json({
                success: true,
                message: 'Configuración institucional',
                data: config,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al obtener configuración';
            logger.error('Error en getInstitucion:', error);
            res.status(404).json({
                success: false,
                message,
            });
        }
    }
    async updateInstitucion(req, res) {
        try {
            const data = UpdateConfiguracionDTO.parse(req.body);
            const config = await configuracionService.updateConfiguracion(data);
            res.status(200).json({
                success: true,
                message: 'Configuración actualizada exitosamente',
                data: config,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al actualizar configuración';
            logger.error('Error en updateInstitucion:', error);
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    async uploadLogo(req, res) {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'No se proporcionó ningún archivo',
                });
                return;
            }
            const logoUrl = await fileUploadService.saveLogo(req.file);
            const config = await configuracionService.updateLogo(logoUrl);
            res.status(200).json({
                success: true,
                message: 'Logo subido exitosamente',
                data: config,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al subir logo';
            logger.error('Error en uploadLogo:', error);
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
}
export const configuracionController = new ConfiguracionController();
//# sourceMappingURL=configuracion.controller.js.map