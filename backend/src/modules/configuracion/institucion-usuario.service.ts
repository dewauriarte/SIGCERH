/**
 * Servicio de asignación de usuarios a institución
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';

const prisma = new PrismaClient();

export class InstitucionUsuarioService {
  /**
   * Listar usuarios asignados a la institución
   */
  async listUsuariosInstitucion() {
    // Obtener la institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!institucion) {
      throw new Error('No se encontró institución activa');
    }

    const asignaciones = await prisma.institucionusuario.findMany({
      where: {
        institucion_id: institucion.id,
        activo: true,
      },
      include: {
        usuario_institucionusuario_usuario_idTousuario: {
          select: {
            id: true,
            username: true,
            email: true,
            nombres: true,
            apellidos: true,
            dni: true,
            cargo: true,
            activo: true,
          },
        },
      },
      orderBy: {
        fechaasignacion: 'desc',
      },
    });

    return asignaciones.map(a => ({
      id: a.id,
      fechaAsignacion: a.fechaasignacion,
      usuario: {
        id: a.usuario_institucionusuario_usuario_idTousuario.id,
        username: a.usuario_institucionusuario_usuario_idTousuario.username,
        email: a.usuario_institucionusuario_usuario_idTousuario.email,
        nombres: a.usuario_institucionusuario_usuario_idTousuario.nombres,
        apellidos: a.usuario_institucionusuario_usuario_idTousuario.apellidos,
        dni: a.usuario_institucionusuario_usuario_idTousuario.dni,
        cargo: a.usuario_institucionusuario_usuario_idTousuario.cargo,
        activo: a.usuario_institucionusuario_usuario_idTousuario.activo,
      },
    }));
  }

  /**
   * Asignar un usuario a la institución
   */
  async asignarUsuario(usuarioId: string) {
    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener la institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!institucion) {
      throw new Error('No se encontró institución activa');
    }

    // Verificar si ya está asignado
    const existingAsignacion = await prisma.institucionusuario.findFirst({
      where: {
        institucion_id: institucion.id,
        usuario_id: usuarioId,
      },
    });

    if (existingAsignacion) {
      if (existingAsignacion.activo) {
        throw new Error('El usuario ya está asignado a esta institución');
      } else {
        // Reactivar la asignación
        const updated = await prisma.institucionusuario.update({
          where: { id: existingAsignacion.id },
          data: {
            activo: true,
            fechaasignacion: new Date(),
          },
        });

        logger.info(`Usuario ${usuario.username} reasignado a institución ${institucion.nombre}`);

        return {
          id: updated.id,
          institucionId: updated.institucion_id,
          usuarioId: updated.usuario_id,
          fechaAsignacion: updated.fechaasignacion,
          activo: updated.activo,
        };
      }
    }

    // Crear nueva asignación
    const asignacion = await prisma.institucionusuario.create({
      data: {
        institucion_id: institucion.id,
        usuario_id: usuarioId,
        activo: true,
      },
    });

    logger.info(`Usuario ${usuario.username} asignado a institución ${institucion.nombre}`);

    return {
      id: asignacion.id,
      institucionId: asignacion.institucion_id,
      usuarioId: asignacion.usuario_id,
      fechaAsignacion: asignacion.fechaasignacion,
      activo: asignacion.activo,
    };
  }

  /**
   * Remover un usuario de la institución
   */
  async removerUsuario(usuarioId: string) {
    // Obtener la institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!institucion) {
      throw new Error('No se encontró institución activa');
    }

    // Buscar la asignación
    const asignacion = await prisma.institucionusuario.findFirst({
      where: {
        institucion_id: institucion.id,
        usuario_id: usuarioId,
        activo: true,
      },
    });

    if (!asignacion) {
      throw new Error('El usuario no está asignado a esta institución');
    }

    // Desactivar la asignación
    await prisma.institucionusuario.update({
      where: { id: asignacion.id },
      data: { activo: false },
    });

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    logger.info(`Usuario ${usuario?.username} removido de institución ${institucion.nombre}`);
  }
}

export const institucionUsuarioService = new InstitucionUsuarioService();

