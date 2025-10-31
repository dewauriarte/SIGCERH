import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
const prisma = new PrismaClient();
export class RolesController {
    async list(_req, res) {
        try {
            const roles = await prisma.rol.findMany({
                where: { activo: true },
                include: {
                    rolpermiso: {
                        include: {
                            permiso: {
                                select: {
                                    id: true,
                                    codigo: true,
                                    nombre: true,
                                    modulo: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    nivel: 'desc',
                },
            });
            const data = roles.map(rol => ({
                id: rol.id,
                codigo: rol.codigo,
                nombre: rol.nombre,
                descripcion: rol.descripcion,
                nivel: rol.nivel,
                cantidadPermisos: rol.rolpermiso.length,
                permisos: rol.rolpermiso.map(rp => rp.permiso),
            }));
            res.status(200).json({
                success: true,
                message: 'Lista de roles',
                data,
            });
        }
        catch (error) {
            logger.error('Error en list roles:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener lista de roles',
            });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const rol = await prisma.rol.findUnique({
                where: { id },
                include: {
                    rolpermiso: {
                        include: {
                            permiso: {
                                select: {
                                    id: true,
                                    codigo: true,
                                    nombre: true,
                                    modulo: true,
                                    activo: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!rol) {
                res.status(404).json({
                    success: false,
                    message: 'Rol no encontrado',
                });
                return;
            }
            const data = {
                id: rol.id,
                codigo: rol.codigo,
                nombre: rol.nombre,
                descripcion: rol.descripcion,
                nivel: rol.nivel,
                activo: rol.activo,
                permisos: rol.rolpermiso.map(rp => rp.permiso),
            };
            res.status(200).json({
                success: true,
                message: 'Rol encontrado',
                data,
            });
        }
        catch (error) {
            logger.error('Error en getById rol:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener rol',
            });
        }
    }
    async getPermisos(req, res) {
        try {
            const { id } = req.params;
            const rol = await prisma.rol.findUnique({
                where: { id },
                include: {
                    rolpermiso: {
                        include: {
                            permiso: true,
                        },
                    },
                },
            });
            if (!rol) {
                res.status(404).json({
                    success: false,
                    message: 'Rol no encontrado',
                });
                return;
            }
            const permisosPorModulo = {};
            rol.rolpermiso.forEach(rp => {
                const modulo = rp.permiso.modulo;
                if (!permisosPorModulo[modulo]) {
                    permisosPorModulo[modulo] = [];
                }
                permisosPorModulo[modulo].push({
                    id: rp.permiso.id,
                    codigo: rp.permiso.codigo,
                    nombre: rp.permiso.nombre,
                    activo: rp.permiso.activo,
                });
            });
            res.status(200).json({
                success: true,
                message: `Permisos del rol ${rol.nombre}`,
                data: {
                    rol: {
                        id: rol.id,
                        codigo: rol.codigo,
                        nombre: rol.nombre,
                    },
                    permisosPorModulo,
                    totalPermisos: rol.rolpermiso.length,
                },
            });
        }
        catch (error) {
            logger.error('Error en getPermisos rol:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener permisos del rol',
            });
        }
    }
    async listPermisos(_req, res) {
        try {
            const permisos = await prisma.permiso.findMany({
                where: { activo: true },
                orderBy: [
                    { modulo: 'asc' },
                    { codigo: 'asc' },
                ],
            });
            const permisosPorModulo = {};
            permisos.forEach(permiso => {
                const modulo = permiso.modulo;
                if (!permisosPorModulo[modulo]) {
                    permisosPorModulo[modulo] = [];
                }
                permisosPorModulo[modulo].push({
                    id: permiso.id,
                    codigo: permiso.codigo,
                    nombre: permiso.nombre,
                });
            });
            res.status(200).json({
                success: true,
                message: 'Lista de permisos',
                data: {
                    permisosPorModulo,
                    totalPermisos: permisos.length,
                    modulos: Object.keys(permisosPorModulo),
                },
            });
        }
        catch (error) {
            logger.error('Error en listPermisos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener lista de permisos',
            });
        }
    }
}
export const rolesController = new RolesController();
//# sourceMappingURL=roles.controller.js.map