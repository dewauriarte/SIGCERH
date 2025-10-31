/**
 * Controlador de usuarios
 * Maneja las peticiones HTTP del módulo de usuarios
 */

import { Request, Response } from 'express';
import { usuariosService } from './usuarios.service';
import { logger } from '@config/logger';
import {
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  AsignarRolesDTO,
} from './dtos';

export class UsuariosController {
  /**
   * GET /api/usuarios
   * Listar usuarios con paginación y filtros
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      // Query params ya están validados por middleware
      const options = req.query as any;

      const result = await usuariosService.list(options);

      res.status(200).json({
        success: true,
        message: 'Lista de usuarios',
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error: unknown) {
      logger.error('Error en list usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener lista de usuarios',
      });
    }
  }

  /**
   * GET /api/usuarios/:id
   * Obtener un usuario por ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!; // Ya validado por la ruta

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
    } catch (error: unknown) {
      logger.error('Error en getById usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuario',
      });
    }
  }

  /**
   * POST /api/usuarios
   * Crear un nuevo usuario
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      // Body ya está validado por middleware
      const data = CreateUsuarioDTO.parse(req.body);

      const usuario = await usuariosService.create(data);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: usuario,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al crear usuario';
      logger.error('Error en create usuario:', error);
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  /**
   * PUT /api/usuarios/:id
   * Actualizar un usuario
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!; // Ya validado por la ruta

      // Body ya está validado por middleware
      const data = UpdateUsuarioDTO.parse(req.body);

      const usuario = await usuariosService.update(id, data);

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuario,
      });
    } catch (error: unknown) {
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

  /**
   * DELETE /api/usuarios/:id
   * Eliminar un usuario (soft delete)
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!; // Ya validado por la ruta

      await usuariosService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente',
      });
    } catch (error: unknown) {
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

  /**
   * POST /api/usuarios/:id/roles
   * Asignar roles a un usuario
   */
  async asignarRoles(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id!; // Ya validado por la ruta

      // Body ya está validado por middleware
      const data = AsignarRolesDTO.parse(req.body);

      const usuario = await usuariosService.asignarRoles(id, data.rolesIds);

      res.status(200).json({
        success: true,
        message: 'Roles asignados exitosamente',
        data: usuario,
      });
    } catch (error: unknown) {
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

