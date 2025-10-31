/**
 * Servicio de configuración institucional
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { UpdateConfiguracionData } from './types';

const prisma = new PrismaClient();

export class ConfiguracionService {
  /**
   * Obtener la configuración institucional activa
   */
  async getConfiguracion() {
    const config = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
      orderBy: { fechaactualizacion: 'desc' },
    });

    if (!config) {
      throw new Error('No se encontró configuración institucional activa');
    }

    return {
      id: config.id,
      nombre: config.nombre,
      codigoModular: config.codigomodular,
      direccion: config.direccion,
      telefono: config.telefono,
      email: config.email,
      logoUrl: config.logo_url,
      activo: config.activo,
      fechaActualizacion: config.fechaactualizacion,
    };
  }

  /**
   * Actualizar la configuración institucional
   */
  async updateConfiguracion(data: UpdateConfiguracionData) {
    // Obtener la configuración activa
    const config = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!config) {
      throw new Error('No se encontró configuración institucional activa');
    }

    // Preparar datos para actualizar
    const updateData: any = {
      fechaactualizacion: new Date(),
    };

    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.codigoModular !== undefined) updateData.codigomodular = data.codigoModular;
    if (data.direccion !== undefined) updateData.direccion = data.direccion;
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.logoUrl !== undefined) updateData.logourl = data.logoUrl;

    // Actualizar
    const updated = await prisma.configuracioninstitucion.update({
      where: { id: config.id },
      data: updateData,
    });

    logger.info(`Configuración institucional actualizada: ${updated.nombre}`);

    return {
      id: updated.id,
      nombre: updated.nombre,
      codigoModular: updated.codigomodular,
      direccion: updated.direccion,
      telefono: updated.telefono,
      email: updated.email,
      logoUrl: updated.logo_url,
      activo: updated.activo,
      fechaActualizacion: updated.fechaactualizacion,
    };
  }

  /**
   * Actualizar solo el logo de la institución
   */
  async updateLogo(logoUrl: string) {
    const config = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!config) {
      throw new Error('No se encontró configuración institucional activa');
    }

    const updated = await prisma.configuracioninstitucion.update({
      where: { id: config.id },
      data: {
        logo_url: logoUrl,
        fechaactualizacion: new Date(),
      },
    });

    logger.info(`Logo institucional actualizado: ${logoUrl}`);

    return {
      id: updated.id,
      logoUrl: updated.logo_url,
      fechaActualizacion: updated.fechaactualizacion,
    };
  }
}

export const configuracionService = new ConfiguracionService();

