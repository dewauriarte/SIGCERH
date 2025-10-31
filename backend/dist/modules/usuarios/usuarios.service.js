import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@modules/auth/utils/bcrypt.utils';
import { logger } from '@config/logger';
const prisma = new PrismaClient();
export class UsuariosService {
    async list(options = {}) {
        const { page = 1, limit = 10, search, activo, rol, } = options;
        const skip = (page - 1) * limit;
        const where = {};
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
        const total = await prisma.usuario.count({ where });
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
    async getById(id) {
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
        if (!usuario)
            return null;
        return this.buildAuthUser(usuario);
    }
    async create(data) {
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
        const passwordHash = await hashPassword(data.password);
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
        }
        else {
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
        const createdUser = await this.getById(usuario.id);
        if (!createdUser) {
            throw new Error('Error al obtener el usuario creado');
        }
        return createdUser;
    }
    async update(id, data) {
        const usuario = await prisma.usuario.findUnique({ where: { id } });
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
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
        const updateData = {};
        if (data.username)
            updateData.username = data.username;
        if (data.email)
            updateData.email = data.email;
        if (data.dni)
            updateData.dni = data.dni;
        if (data.nombres)
            updateData.nombres = data.nombres;
        if (data.apellidos)
            updateData.apellidos = data.apellidos;
        if (data.telefono)
            updateData.telefono = data.telefono;
        if (data.cargo)
            updateData.cargo = data.cargo;
        if (data.activo !== undefined)
            updateData.activo = data.activo;
        if (data.bloqueado !== undefined)
            updateData.bloqueado = data.bloqueado;
        if (data.password) {
            updateData.passwordhash = await hashPassword(data.password);
        }
        updateData.fechaactualizacion = new Date();
        await prisma.usuario.update({
            where: { id },
            data: updateData,
        });
        logger.info(`Usuario actualizado: ${usuario.username}`);
        const updatedUser = await this.getById(id);
        if (!updatedUser) {
            throw new Error('Error al obtener el usuario actualizado');
        }
        return updatedUser;
    }
    async delete(id) {
        const usuario = await prisma.usuario.findUnique({ where: { id } });
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        await prisma.usuario.update({
            where: { id },
            data: {
                activo: false,
                fechaactualizacion: new Date(),
            },
        });
        await prisma.sesion.updateMany({
            where: { usuario_id: id },
            data: {
                activa: false,
                fechacierre: new Date(),
            },
        });
        logger.info(`Usuario desactivado: ${usuario.username}`);
    }
    async asignarRoles(userId, rolesIds) {
        const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        const roles = await prisma.rol.findMany({
            where: { id: { in: rolesIds } },
        });
        if (roles.length !== rolesIds.length) {
            throw new Error('Uno o más roles no existen');
        }
        await prisma.usuariorol.updateMany({
            where: { usuario_id: userId },
            data: { activo: false },
        });
        for (const rolId of rolesIds) {
            const existing = await prisma.usuariorol.findUnique({
                where: {
                    usuario_id_rol_id: {
                        usuario_id: userId,
                        rol_id: rolId,
                    },
                },
            });
            if (existing) {
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
            }
            else {
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
        const updatedUser = await this.getById(userId);
        if (!updatedUser) {
            throw new Error('Error al obtener el usuario actualizado');
        }
        return updatedUser;
    }
    buildAuthUser(usuario) {
        const roles = usuario.usuariorol_usuariorol_usuario_idTousuario.map((ur) => ({
            id: ur.rol.id,
            codigo: ur.rol.codigo,
            nombre: ur.rol.nombre,
            nivel: ur.rol.nivel,
            permisos: ur.rol.rolpermiso.map((rp) => ({
                id: rp.permiso.id,
                codigo: rp.permiso.codigo,
                nombre: rp.permiso.nombre,
                modulo: rp.permiso.modulo,
            })),
        }));
        const permisosSet = new Set();
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
//# sourceMappingURL=usuarios.service.js.map