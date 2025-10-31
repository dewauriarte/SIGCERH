/**
 * Servicio de usuarios
 * Maneja CRUD de usuarios y asignación de roles
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@modules/auth/utils/bcrypt.utils';
import { logger } from '@config/logger';
import { AuthUser, AuthRole } from '@modules/auth/types';

const prisma = new PrismaClient();

export interface CreateUsuarioData {
  username: string;
  email: string;
  password: string;
  dni?: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  cargo?: string;
  rolesIds?: string[];
  activo?: boolean;
}

export interface UpdateUsuarioData {
  username?: string;
  email?: string;
  password?: string;
  dni?: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  cargo?: string;
  activo?: boolean;
  bloqueado?: boolean;
}

export interface ListUsuariosOptions {
  page?: number;
  limit?: number;
  search?: string;
  activo?: boolean;
  rol?: string;
}

export class UsuariosService {
  /**
   * Listar usuarios con paginación y filtros
   */
  async list(options: ListUsuariosOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      activo,
      rol,
    } = options;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (activo !== undefined) {
      where.activo = activo;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nombres: { contains: search, mode: 'insensitive' } },
        { apellidos: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search } },
      ];
    }

    if (rol) {
      where.usuariorol_usuariorol_usuario_idTousuario = {
        some: {
          activo: true,
          rol: {
            codigo: rol,
          },
        },
      };
    }

    // Contar total
    const total = await prisma.usuario.count({ where });

    // Obtener usuarios
    const usuarios = await prisma.usuario.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        email: true,
        dni: true,
        nombres: true,
        apellidos: true,
        telefono: true,
        cargo: true,
        activo: true,
        bloqueado: true,
        ultimoacceso: true,
        fechacreacion: true,
        usuariorol_usuariorol_usuario_idTousuario: {
          where: { activo: true },
          select: {
            rol: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                nivel: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechacreacion: 'desc',
      },
    });

    // Formatear respuesta
    const items = usuarios.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      dni: u.dni,
      nombres: u.nombres,
      apellidos: u.apellidos,
      telefono: u.telefono,
      cargo: u.cargo,
      activo: u.activo,
      bloqueado: u.bloqueado,
      ultimoAcceso: u.ultimoacceso,
      fechaCreacion: u.fechacreacion,
      roles: u.usuariorol_usuariorol_usuario_idTousuario.map(ur => ur.rol),
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener un usuario por ID
   */
  async getById(id: string): Promise<AuthUser | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        usuariorol_usuariorol_usuario_idTousuario: {
          where: { activo: true },
          include: {
            rol: {
              include: {
                rolpermiso: {
                  include: {
                    permiso: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!usuario) return null;

    return this.buildAuthUser(usuario);
  }

  /**
   * Crear un nuevo usuario
   */
  async create(data: CreateUsuarioData): Promise<AuthUser> {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email },
          ...(data.dni ? [{ dni: data.dni }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === data.username) {
        throw new Error('El nombre de usuario ya está en uso');
      }
      if (existingUser.email === data.email) {
        throw new Error('El correo electrónico ya está registrado');
      }
      if (data.dni && existingUser.dni === data.dni) {
        throw new Error('El DNI ya está registrado');
      }
    }

    // Hash de la contraseña
    const passwordHash = await hashPassword(data.password);

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        username: data.username,
        email: data.email,
        passwordhash: passwordHash,
        dni: data.dni || null,
        nombres: data.nombres || null,
        apellidos: data.apellidos || null,
        telefono: data.telefono || null,
        cargo: data.cargo || null,
        activo: data.activo !== undefined ? data.activo : true,
        cambiarpassword: true,
      },
    });

    // Asignar roles
    if (data.rolesIds && data.rolesIds.length > 0) {
      for (const rolId of data.rolesIds) {
        await prisma.usuariorol.create({
          data: {
            usuario_id: usuario.id,
            rol_id: rolId,
            activo: true,
          },
        });
      }
    } else {
      // Asignar rol PUBLICO por defecto
      const rolPublico = await prisma.rol.findFirst({
        where: { codigo: 'PUBLICO' },
      });
      if (rolPublico) {
        await prisma.usuariorol.create({
          data: {
            usuario_id: usuario.id,
            rol_id: rolPublico.id,
            activo: true,
          },
        });
      }
    }

    logger.info(`Usuario creado: ${usuario.username} (${usuario.email})`);

    // Retornar usuario con roles
    const createdUser = await this.getById(usuario.id);
    if (!createdUser) {
      throw new Error('Error al obtener el usuario creado');
    }

    return createdUser;
  }

  /**
   * Actualizar un usuario
   */
  async update(id: string, data: UpdateUsuarioData): Promise<AuthUser> {
    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar duplicados si se está cambiando username, email o dni
    if (data.username || data.email || data.dni) {
      const existingUser = await prisma.usuario.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(data.username ? [{ username: data.username }] : []),
            ...(data.email ? [{ email: data.email }] : []),
            ...(data.dni ? [{ dni: data.dni }] : []),
          ],
        },
      });

      if (existingUser) {
        if (data.username && existingUser.username === data.username) {
          throw new Error('El nombre de usuario ya está en uso');
        }
        if (data.email && existingUser.email === data.email) {
          throw new Error('El correo electrónico ya está registrado');
        }
        if (data.dni && existingUser.dni === data.dni) {
          throw new Error('El DNI ya está registrado');
        }
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {};

    if (data.username) updateData.username = data.username;
    if (data.email) updateData.email = data.email;
    if (data.dni) updateData.dni = data.dni;
    if (data.nombres) updateData.nombres = data.nombres;
    if (data.apellidos) updateData.apellidos = data.apellidos;
    if (data.telefono) updateData.telefono = data.telefono;
    if (data.cargo) updateData.cargo = data.cargo;
    if (data.activo !== undefined) updateData.activo = data.activo;
    if (data.bloqueado !== undefined) updateData.bloqueado = data.bloqueado;

    // Si hay nueva contraseña, hashearla
    if (data.password) {
      updateData.passwordhash = await hashPassword(data.password);
    }

    updateData.fechaactualizacion = new Date();

    // Actualizar usuario
    await prisma.usuario.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Usuario actualizado: ${usuario.username}`);

    // Retornar usuario actualizado
    const updatedUser = await this.getById(id);
    if (!updatedUser) {
      throw new Error('Error al obtener el usuario actualizado');
    }

    return updatedUser;
  }

  /**
   * Eliminar un usuario (soft delete)
   */
  async delete(id: string): Promise<void> {
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Desactivar usuario en lugar de eliminarlo
    await prisma.usuario.update({
      where: { id },
      data: {
        activo: false,
        fechaactualizacion: new Date(),
      },
    });

    // Desactivar todas las sesiones
    await prisma.sesion.updateMany({
      where: { usuario_id: id },
      data: {
        activa: false,
        fechacierre: new Date(),
      },
    });

    logger.info(`Usuario desactivado: ${usuario.username}`);
  }

  /**
   * Asignar roles a un usuario
   */
  async asignarRoles(userId: string, rolesIds: string[]): Promise<AuthUser> {
    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que los roles existen
    const roles = await prisma.rol.findMany({
      where: { id: { in: rolesIds } },
    });

    if (roles.length !== rolesIds.length) {
      throw new Error('Uno o más roles no existen');
    }

    // Desactivar roles actuales
    await prisma.usuariorol.updateMany({
      where: { usuario_id: userId },
      data: { activo: false },
    });

    // Asignar nuevos roles
    for (const rolId of rolesIds) {
      // Verificar si ya existe la relación
      const existing = await prisma.usuariorol.findUnique({
        where: {
          usuario_id_rol_id: {
            usuario_id: userId,
            rol_id: rolId,
          },
        },
      });

      if (existing) {
        // Reactivar
        await prisma.usuariorol.update({
          where: {
            usuario_id_rol_id: {
              usuario_id: userId,
              rol_id: rolId,
            },
          },
          data: {
            activo: true,
            fechaasignacion: new Date(),
          },
        });
      } else {
        // Crear nuevo
        await prisma.usuariorol.create({
          data: {
            usuario_id: userId,
            rol_id: rolId,
            activo: true,
          },
        });
      }
    }

    logger.info(`Roles asignados al usuario ${usuario.username}: ${roles.map(r => r.codigo).join(', ')}`);

    // Retornar usuario actualizado
    const updatedUser = await this.getById(userId);
    if (!updatedUser) {
      throw new Error('Error al obtener el usuario actualizado');
    }

    return updatedUser;
  }

  /**
   * Construye un objeto AuthUser desde un usuario de Prisma
   */
  private buildAuthUser(usuario: any): AuthUser {
    const roles: AuthRole[] = usuario.usuariorol_usuariorol_usuario_idTousuario.map((ur: any) => ({
      id: ur.rol.id,
      codigo: ur.rol.codigo,
      nombre: ur.rol.nombre,
      nivel: ur.rol.nivel,
      permisos: ur.rol.rolpermiso.map((rp: any) => ({
        id: rp.permiso.id,
        codigo: rp.permiso.codigo,
        nombre: rp.permiso.nombre,
        modulo: rp.permiso.modulo,
      })),
    }));

    // Obtener permisos únicos
    const permisosSet = new Set<string>();
    roles.forEach(rol => {
      rol.permisos.forEach(permiso => {
        permisosSet.add(permiso.codigo);
      });
    });

    return {
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      dni: usuario.dni,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      telefono: usuario.telefono,
      cargo: usuario.cargo,
      activo: usuario.activo,
      roles,
      permisos: Array.from(permisosSet),
    };
  }
}

export const usuariosService = new UsuariosService();

