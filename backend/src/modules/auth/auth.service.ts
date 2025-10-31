/**
 * Servicio de autenticación
 * Maneja registro, login, refresh tokens, logout
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from './utils/bcrypt.utils';
import { generateAccessToken, generateRefreshToken, verifyToken } from './utils/jwt.utils';
import { logger } from '@config/logger';
import { config } from '@config/env';
import {
  AuthUser,
  LoginResponse,
  RefreshTokenResponse,
  RegisterData,
  LoginData,
  AuthRole,
} from './types';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Registra un nuevo usuario
   */
  async register(data: RegisterData): Promise<LoginResponse> {
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
        activo: true,
        cambiarpassword: false,
      },
    });

    // Asignar roles (si se proporcionaron, sino asignar rol PUBLICO por defecto)
    const rolesIds = data.rolesIds && data.rolesIds.length > 0
      ? data.rolesIds
      : await this.getPublicoRoleId();

    for (const rolId of rolesIds) {
      await prisma.usuariorol.create({
        data: {
          usuario_id: usuario.id,
          rol_id: rolId,
          activo: true,
        },
      });
    }

    logger.info(`Usuario registrado: ${usuario.username} (${usuario.email})`);

    // Hacer login automáticamente
    return this.login({
      usernameOrEmail: usuario.username,
      password: data.password,
    });
  }

  /**
   * Login de usuario
   */
  async login(data: LoginData, ip?: string, userAgent?: string): Promise<LoginResponse> {
    // Buscar usuario por username o email
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: data.usernameOrEmail },
          { email: data.usernameOrEmail },
        ],
      },
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

    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar si el usuario está bloqueado
    if (usuario.bloqueado) {
      throw new Error('Usuario bloqueado. Contacte al administrador.');
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      throw new Error('Usuario inactivo. Contacte al administrador.');
    }

    // Verificar contraseña
    const passwordMatch = await comparePassword(data.password, usuario.passwordhash);

    if (!passwordMatch) {
      // Incrementar intentos fallidos
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          intentosfallidos: (usuario.intentosfallidos || 0) + 1,
          bloqueado: (usuario.intentosfallidos || 0) + 1 >= 5,
          fechabloqueo: (usuario.intentosfallidos || 0) + 1 >= 5 ? new Date() : null,
        },
      });

      throw new Error('Credenciales inválidas');
    }

    // Resetear intentos fallidos en login exitoso
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentosfallidos: 0,
        ultimoacceso: new Date(),
      },
    });

    // Construir AuthUser con roles y permisos
    const authUser = this.buildAuthUser(usuario);

    // Generar tokens
    const accessToken = generateAccessToken({
      sub: usuario.id,
      username: usuario.username,
      email: usuario.email,
      roles: authUser.roles.map(r => r.codigo),
      permisos: authUser.permisos,
    });

    const refreshToken = generateRefreshToken(usuario.id);

    // Guardar refresh token en sesión
    const expiraEn = this.calcularExpiracion(config.security.jwt.refreshExpiresIn);
    await prisma.sesion.create({
      data: {
        usuario_id: usuario.id,
        token: refreshToken,
        ip: ip || null,
        useragent: userAgent || null,
        fechaexpiracion: expiraEn,
        activa: true,
      },
    });

    logger.info(`Login exitoso: ${usuario.username}`);

    return {
      user: authUser,
      accessToken,
      refreshToken,
      expiresIn: config.security.jwt.expiresIn,
    };
  }

  /**
   * Refresh token
   */
  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    // Verificar token
    try {
      verifyToken(refreshToken);
    } catch (error) {
      throw new Error('Refresh token inválido o expirado');
    }

    // Buscar sesión activa
    const sesion = await prisma.sesion.findFirst({
      where: {
        token: refreshToken,
        activa: true,
        fechaexpiracion: {
          gte: new Date(),
        },
      },
      include: {
        usuario: {
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
        },
      },
    });

    if (!sesion) {
      throw new Error('Sesión inválida o expirada');
    }

    if (!sesion.usuario.activo) {
      throw new Error('Usuario inactivo');
    }

    // Construir AuthUser
    const authUser = this.buildAuthUser(sesion.usuario);

    // Generar nuevos tokens
    const newAccessToken = generateAccessToken({
      sub: sesion.usuario.id,
      username: sesion.usuario.username,
      email: sesion.usuario.email,
      roles: authUser.roles.map(r => r.codigo),
      permisos: authUser.permisos,
    });

    const newRefreshToken = generateRefreshToken(sesion.usuario.id);

    // Actualizar sesión con nuevo refresh token
    const nuevaExpiracion = this.calcularExpiracion(config.security.jwt.refreshExpiresIn);
    await prisma.sesion.update({
      where: { id: sesion.id },
      data: {
        token: newRefreshToken,
        fechaexpiracion: nuevaExpiracion,
      },
    });

    logger.info(`Refresh token exitoso: ${sesion.usuario.username}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: config.security.jwt.expiresIn,
    };
  }

  /**
   * Logout
   */
  async logout(refreshToken: string): Promise<void> {
    // Marcar sesión como inactiva
    await prisma.sesion.updateMany({
      where: { token: refreshToken },
      data: {
        activa: false,
        fechacierre: new Date(),
      },
    });

    logger.info('Logout exitoso');
  }

  /**
   * Olvidé mi contraseña
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      // Por seguridad, no revelamos si el email existe
      return { message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña' };
    }

    // TODO: Generar token de recuperación y enviar email
    // Por ahora, solo logueamos
    logger.info(`Solicitud de recuperación de contraseña: ${email}`);

    return { message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña' };
  }

  /**
   * Resetear contraseña
   */
  async resetPassword(_token: string, _newPassword: string): Promise<{ message: string }> {
    // TODO: Implementar lógica de reset password con token temporal
    // Por ahora, retornamos mensaje genérico
    logger.info('Solicitud de reseteo de contraseña');

    return { message: 'Contraseña reseteada exitosamente' };
  }

  /**
   * Obtener usuario por ID con roles y permisos
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
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

  /**
   * Obtiene el ID del rol PUBLICO
   */
  private async getPublicoRoleId(): Promise<string[]> {
    const rol = await prisma.rol.findFirst({
      where: { codigo: 'PUBLICO' },
    });

    if (!rol) {
      throw new Error('Rol PUBLICO no encontrado en la base de datos');
    }

    return [rol.id];
  }

  /**
   * Calcula la fecha de expiración desde una cadena como "7d", "1h"
   */
  private calcularExpiracion(duracion: string): Date {
    const numero = parseInt(duracion);
    const unidad = duracion.slice(-1);

    const ahora = new Date();
    
    switch (unidad) {
      case 'd':
        ahora.setDate(ahora.getDate() + numero);
        break;
      case 'h':
        ahora.setHours(ahora.getHours() + numero);
        break;
      case 'm':
        ahora.setMinutes(ahora.getMinutes() + numero);
        break;
      default:
        ahora.setHours(ahora.getHours() + 1); // 1 hora por defecto
    }

    return ahora;
  }
}

export const authService = new AuthService();

