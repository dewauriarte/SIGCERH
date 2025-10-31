import { institucionUsuarioService } from './institucion-usuario.service';
import { logger } from '@config/logger';
export class InstitucionUsuarioController {
    async list(_req, res) {
        try {
            const usuarios = await institucionUsuarioService.listUsuariosInstitucion();
            res.status(200).json({
                success: true,
                message: 'Lista de usuarios de la institución',
                data: usuarios,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al obtener usuarios';
            logger.error('Error en list usuarios institución:', error);
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async asignar(req, res) {
        try {
            const usuarioId = req.params.usuarioId;
            const asignacion = await institucionUsuarioService.asignarUsuario(usuarioId);
            res.status(201).json({
                success: true,
                message: 'Usuario asignado exitosamente',
                data: asignacion,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al asignar usuario';
            logger.error('Error en asignar usuario:', error);
            if (message === 'Usuario no encontrado') {
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
    async remover(req, res) {
        try {
            const usuarioId = req.params.usuarioId;
            await institucionUsuarioService.removerUsuario(usuarioId);
            res.status(200).json({
                success: true,
                message: 'Usuario removido exitosamente',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al remover usuario';
            logger.error('Error en remover usuario:', error);
            if (message === 'El usuario no está asignado a esta institución') {
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
export const institucionUsuarioController = new InstitucionUsuarioController();
//# sourceMappingURL=institucion-usuario.controller.js.map