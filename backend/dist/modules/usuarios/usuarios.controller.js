import { usuariosService } from './usuarios.service';
import { logger } from '@config/logger';
import { CreateUsuarioDTO, UpdateUsuarioDTO, AsignarRolesDTO, } from './dtos';
export class UsuariosController {
    async list(req, res) {
        try {
            const options = req.query;
            const result = await usuariosService.list(options);
            res.status(200).json({
                success: true,
                message: 'Lista de usuarios',
                data: result.items,
                pagination: result.pagination,
            });
        }
        catch (error) {
            logger.error('Error en list usuarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener lista de usuarios',
            });
        }
    }
    async getById(req, res) {
        try {
            const id = req.params.id;
            const usuario = await usuariosService.getById(id);
            if (!usuario) {
                res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Usuario encontrado',
                data: usuario,
            });
        }
        catch (error) {
            logger.error('Error en getById usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuario',
            });
        }
    }
    async create(req, res) {
        try {
            const data = CreateUsuarioDTO.parse(req.body);
            const usuario = await usuariosService.create(data);
            res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente',
                data: usuario,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al crear usuario';
            logger.error('Error en create usuario:', error);
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    async update(req, res) {
        try {
            const id = req.params.id;
            const data = UpdateUsuarioDTO.parse(req.body);
            const usuario = await usuariosService.update(id, data);
            res.status(200).json({
                success: true,
                message: 'Usuario actualizado exitosamente',
                data: usuario,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al actualizar usuario';
            logger.error('Error en update usuario:', error);
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
    async delete(req, res) {
        try {
            const id = req.params.id;
            await usuariosService.delete(id);
            res.status(200).json({
                success: true,
                message: 'Usuario eliminado exitosamente',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al eliminar usuario';
            logger.error('Error en delete usuario:', error);
            if (message === 'Usuario no encontrado') {
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
    async asignarRoles(req, res) {
        try {
            const id = req.params.id;
            const data = AsignarRolesDTO.parse(req.body);
            const usuario = await usuariosService.asignarRoles(id, data.rolesIds);
            res.status(200).json({
                success: true,
                message: 'Roles asignados exitosamente',
                data: usuario,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error al asignar roles';
            logger.error('Error en asignarRoles:', error);
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
}
export const usuariosController = new UsuariosController();
//# sourceMappingURL=usuarios.controller.js.map