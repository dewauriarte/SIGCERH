/**
 * Servicio de Administración
 * Lógica de negocio para gestión de usuarios, roles y estadísticas
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '@config/logger';

const prisma = new PrismaClient();

interface CreateUsuarioDTO {
  username: string;
  email: string;
  password: string;
  dni?: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  cargo?: string;
  roles: string[]; // Array de códigos de rol
}

interface UpdateUsuarioDTO {
  email?: string;
  dni?: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  cargo?: string;
  activo?: boolean;
  roles?: string[];
}

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  rol?: string;
  activo?: boolean;
}

export class AdminService {
  /**
   * Obtener estadísticas generales del sistema
   */
  async getEstadisticas() {
    // Usuarios
    const totalUsuarios = await prisma.usuario.count();
    const usuariosActivos = await prisma.usuario.count({ where: { activo: true } });
    const usuariosBloqueados = await prisma.usuario.count({ where: { bloqueado: true } });
    
    const primerDiaMes = new Date();
    primerDiaMes.setDate(1);
    primerDiaMes.setHours(0, 0, 0, 0);
    
    const usuariosNuevosMes = await prisma.usuario.count({
      where: {
        fechacreacion: {
          gte: primerDiaMes,
        },
      },
    });

    // Solicitudes
    const totalSolicitudes = await prisma.solicitud.count();
    const solicitudesPendientes = await prisma.solicitud.count({
      where: {
        estado: {
          notIn: ['COMPLETADO', 'RECHAZADO'],
        },
      },
    });
    const solicitudesProcesadas = await prisma.solicitud.count({
      where: {
        estado: 'COMPLETADO',
      },
    });
    const solicitudesMesActual = await prisma.solicitud.count({
      where: {
        fechasolicitud: {
          gte: primerDiaMes,
        },
      },
    });

    // Certificados
    const totalCertificados = await prisma.certificado.count();
    const certificadosEmitidos = await prisma.certificado.count({
      where: {
        estado: 'EMITIDO',
      },
    });
    // Count solicitudes with digital delivery (since tipoentrega is in solicitud table)
    const certificadosDigitales = await prisma.solicitud.count({
      where: {
        modalidadentrega: 'DIGITAL',
        certificado_id: { not: null }, // Only count if certificate was generated
      },
    });
    const certificadosMesActual = await prisma.certificado.count({
      where: {
        fechaemision: {
          gte: primerDiaMes,
        },
      },
    });

    // Sistema
    const tasaExito = totalSolicitudes > 0 
      ? (solicitudesProcesadas / totalSolicitudes) * 100 
      : 0;

    // Calcular tiempo promedio de emisión (simplificado)
    const tiempoPromedio = 3; // TODO: Calcular real basado en fechas

    return {
      usuarios: {
        total: totalUsuarios,
        activos: usuariosActivos,
        bloqueados: usuariosBloqueados,
        nuevosMesActual: usuariosNuevosMes,
      },
      solicitudes: {
        total: totalSolicitudes,
        pendientes: solicitudesPendientes,
        procesadas: solicitudesProcesadas,
        mesActual: solicitudesMesActual,
      },
      certificados: {
        total: totalCertificados,
        emitidos: certificadosEmitidos,
        digitales: certificadosDigitales,
        mesActual: certificadosMesActual,
      },
      sistema: {
        espacioUsado: '2.5 GB', // TODO: Calcular real
        tiempoPromedioEmision: tiempoPromedio,
        tasaExito: tasaExito,
        ultimaActualizacion: new Date(),
      },
    };
  }

  /**
   * Obtener solicitudes por mes (últimos 12 meses)
   */
  async getSolicitudesPorMes() {
    const haceUnAno = new Date();
    haceUnAno.setFullYear(haceUnAno.getFullYear() - 1);

    const solicitudes = await prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR(fechasolicitud, 'Mon') as mes,
        TO_CHAR(fechasolicitud, 'YYYY-MM') as fecha_ordenar,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE estado = 'COMPLETADO') as aprobadas,
        COUNT(*) FILTER (WHERE estado = 'RECHAZADO') as rechazadas
      FROM solicitud
      WHERE fechasolicitud >= ${haceUnAno}
      GROUP BY TO_CHAR(fechasolicitud, 'Mon'), TO_CHAR(fechasolicitud, 'YYYY-MM')
      ORDER BY fecha_ordenar DESC
      LIMIT 12
    `;

    return solicitudes.map(s => ({
      mes: s.mes,
      total: Number(s.total),
      aprobadas: Number(s.aprobadas),
      rechazadas: Number(s.rechazadas),
    })).reverse();
  }

  /**
   * Obtener certificados por colegio (Top 10)
   */
  async getCertificadosPorColegio() {
    const datos = await prisma.$queryRaw<any[]>`
      SELECT 
        ci.nombreinstitucion as colegio,
        COUNT(c.id) as total
      FROM certificado c
      INNER JOIN solicitud s ON c.solicitud_id = s.id
      INNER JOIN configuracioninstitucion ci ON s.institucion_id = ci.id
      WHERE c.estado = 'EMITIDO'
      GROUP BY ci.nombreinstitucion
      ORDER BY total DESC
      LIMIT 10
    `;

    return datos.map(d => ({
      colegio: d.colegio,
      total: Number(d.total),
    }));
  }

  /**
   * Obtener lista paginada de usuarios
   */
  async getUsuarios(params: PaginationParams) {
    const { page, limit, search, rol, activo } = params;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nombres: { contains: search, mode: 'insensitive' } },
        { apellidos: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search } },
      ];
    }

    if (activo !== undefined) {
      where.activo = activo;
    }

    // Filtro por rol (necesita join)
    let usuarios;
    let total;

    if (rol) {
      // Query con filtro de rol
      usuarios = await prisma.usuario.findMany({
        where: {
          ...where,
          usuariorol_usuariorol_usuario_idTousuario: {
            some: {
              activo: true,
              rol: {
                codigo: rol,
              },
            },
          },
        },
        include: {
          usuariorol_usuariorol_usuario_idTousuario: {
            where: {
              activo: true,
            },
            include: {
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
        orderBy: { fechacreacion: 'desc' },
        skip,
        take: limit,
      });

      total = await prisma.usuario.count({
        where: {
          ...where,
          usuariorol_usuariorol_usuario_idTousuario: {
            some: {
              activo: true,
              rol: {
                codigo: rol,
              },
            },
          },
        },
      });
    } else {
      // Query sin filtro de rol
      usuarios = await prisma.usuario.findMany({
        where,
        include: {
          usuariorol_usuariorol_usuario_idTousuario: {
            where: {
              activo: true,
            },
            include: {
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
        orderBy: { fechacreacion: 'desc' },
        skip,
        take: limit,
      });

      total = await prisma.usuario.count({ where });
    }

    // Transformar datos
    const usuariosFormateados = usuarios.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      dni: u.dni,
      nombres: u.nombres,
      apellidos: u.apellidos || '',
      telefono: u.telefono,
      cargo: u.cargo,
      activo: u.activo,
      bloqueado: u.bloqueado,
      ultimoAcceso: u.ultimoacceso,
      fechaCreacion: u.fechacreacion,
      roles: u.usuariorol_usuariorol_usuario_idTousuario.map(ur => ({
        id: ur.rol.id,
        codigo: ur.rol.codigo,
        nombre: ur.rol.nombre,
        nivel: ur.rol.nivel,
      })),
    }));

    return {
      usuarios: usuariosFormateados,
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
  async getUsuarioById(id: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        usuariorol_usuariorol_usuario_idTousuario: {
          where: {
            activo: true,
          },
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

    if (!usuario) {
      return null;
    }

    return {
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      dni: usuario.dni,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos || '',
      telefono: usuario.telefono,
      cargo: usuario.cargo,
      activo: usuario.activo,
      bloqueado: usuario.bloqueado,
      ultimoAcceso: usuario.ultimoacceso,
      fechaCreacion: usuario.fechacreacion,
      roles: usuario.usuariorol_usuariorol_usuario_idTousuario.map(ur => ({
        id: ur.rol.id,
        codigo: ur.rol.codigo,
        nombre: ur.rol.nombre,
        nivel: ur.rol.nivel,
        permisos: ur.rol.rolpermiso.map(pr => ({
          id: pr.permiso.id,
          codigo: pr.permiso.codigo,
          nombre: pr.permiso.nombre,
          modulo: pr.permiso.modulo,
        })),
      })),
    };
  }

  /**
   * Crear un nuevo usuario
   */
  async crearUsuario(data: CreateUsuarioDTO, adminId: string) {
    // Verificar si ya existe un usuario con ese username o email
    const existeUsuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email },
        ],
      },
    });

    if (existeUsuario) {
      throw new Error('Ya existe un usuario con ese username o email');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Obtener IDs de roles
    const roles = await prisma.rol.findMany({
      where: {
        codigo: {
          in: data.roles,
        },
      },
    });

    if (roles.length === 0) {
      throw new Error('No se encontraron roles válidos');
    }

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        username: data.username,
        email: data.email,
        passwordhash: hashedPassword,
        dni: data.dni || null,
        nombres: data.nombres,
        apellidos: data.apellidos,
        telefono: data.telefono || null,
        cargo: data.cargo || null,
        activo: true,
        bloqueado: false,
        cambiarpassword: true,
        usuariorol_usuariorol_usuario_idTousuario: {
          create: roles.map(rol => ({
            rol_id: rol.id,
          })),
        },
      },
      include: {
        usuariorol_usuariorol_usuario_idTousuario: {
          include: {
            rol: true,
          },
        },
      },
    });

    logger.info(`✅ Usuario creado: ${usuario.username} por admin ${adminId}`);

    return {
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
    };
  }

  /**
   * Actualizar un usuario
   */
  async actualizarUsuario(id: string, data: UpdateUsuarioDTO) {
    const updateData: any = {};

    if (data.email) updateData.email = data.email;
    if (data.dni !== undefined) updateData.dni = data.dni;
    if (data.nombres) updateData.nombres = data.nombres;
    if (data.apellidos) updateData.apellidos = data.apellidos;
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.cargo !== undefined) updateData.cargo = data.cargo;
    if (data.activo !== undefined) updateData.activo = data.activo;

    // Actualizar usuario
    const usuario = await prisma.usuario.update({
      where: { id },
      data: updateData,
    });

    // Actualizar roles si se proporcionaron
    if (data.roles && data.roles.length > 0) {
      // Eliminar roles actuales
      await prisma.usuariorol.deleteMany({
        where: { usuario_id: id },
      });

      // Obtener IDs de nuevos roles
      const roles = await prisma.rol.findMany({
        where: {
          codigo: {
            in: data.roles,
          },
        },
      });

      // Crear nuevas relaciones
      await prisma.usuariorol.createMany({
        data: roles.map(rol => ({
          usuario_id: id,
          rol_id: rol.id,
        })),
      });
    }

    logger.info(`✅ Usuario actualizado: ${usuario.username}`);

    return {
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
    };
  }

  /**
   * Desactivar un usuario
   */
  async desactivarUsuario(id: string) {
    await prisma.usuario.update({
      where: { id },
      data: { activo: false },
    });

    logger.info(`Usuario desactivado: ${id}`);
  }

  /**
   * Activar un usuario
   */
  async activarUsuario(id: string) {
    await prisma.usuario.update({
      where: { id },
      data: { activo: true },
    });

    logger.info(`Usuario activado: ${id}`);
  }

  /**
   * Bloquear un usuario
   */
  async bloquearUsuario(id: string) {
    await prisma.usuario.update({
      where: { id },
      data: { bloqueado: true },
    });

    logger.info(`Usuario bloqueado: ${id}`);
  }

  /**
   * Desbloquear un usuario
   */
  async desbloquearUsuario(id: string) {
    await prisma.usuario.update({
      where: { id },
      data: { bloqueado: false },
    });

    logger.info(`Usuario desbloqueado: ${id}`);
  }

  /**
   * Eliminar un usuario permanentemente
   */
  async eliminarUsuario(id: string) {
    // Eliminar relaciones primero
    await prisma.usuariorol.deleteMany({
      where: { usuario_id: id },
    });

    // Eliminar usuario
    await prisma.usuario.delete({
      where: { id },
    });

    logger.info(`Usuario eliminado permanentemente: ${id}`);
  }

  /**
   * Resetear contraseña de un usuario
   */
  async resetearPassword(id: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.usuario.update({
      where: { id },
      data: {
        password: hashedPassword,
        cambiarpasswordprimerinicio: true,
      },
    });

    logger.info(`Contraseña reseteada para usuario: ${id}`);
  }

  /**
   * Obtener todos los roles disponibles
   */
  async getRoles() {
    const roles = await prisma.rol.findMany({
      where: { activo: true },
      orderBy: { nivel: 'desc' },
      include: {
        rolpermiso: {
          include: {
            permiso: true,
          },
        },
      },
    });

    // Formatear respuesta con permisos activos únicamente
    return roles.map(rol => ({
      id: rol.id,
      codigo: rol.codigo,
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      nivel: rol.nivel,
      permisos: rol.rolpermiso
        .filter(rp => rp.permiso && rp.permiso.activo)
        .map(rp => ({
          id: rp.permiso.id,
          codigo: rp.permiso.codigo,
          nombre: rp.permiso.nombre,
          descripcion: rp.permiso.descripcion,
          modulo: rp.permiso.modulo,
        })),
    }));
  }
}

export const adminService = new AdminService();

