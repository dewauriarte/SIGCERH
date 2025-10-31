/**
 * Servicio de currículo por grado (mapeo área-grado-año)
 * Este servicio es CRÍTICO para el sistema OCR de certificados
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';

const prisma = new PrismaClient();

interface AssignAreasToGradoData {
  gradoId: string;
  anioLectivoId: string;
  areas: {
    areaCurricularId: string;
    orden: number;
  }[];
}

interface PlantillaArea {
  id: string;
  codigo: string;
  nombre: string;
  orden: number;
}

export class CurriculoGradoService {
  /**
   * Asignar áreas curriculares a un grado y año específico
   * Este mapeo es fundamental para el OCR
   */
  async assignAreasToGrado(data: AssignAreasToGradoData) {
    const { gradoId, anioLectivoId, areas } = data;

    // Verificar que el grado existe
    const grado = await prisma.grado.findUnique({
      where: { id: gradoId },
    });

    if (!grado) {
      throw new Error('Grado no encontrado');
    }

    // Verificar que el año lectivo existe
    const anioLectivo = await prisma.aniolectivo.findUnique({
      where: { id: anioLectivoId },
    });

    if (!anioLectivo) {
      throw new Error('Año lectivo no encontrado');
    }

    // Verificar que todas las áreas existen
    for (const area of areas) {
      const areaCurricular = await prisma.areacurricular.findUnique({
        where: { id: area.areaCurricularId },
      });

      if (!areaCurricular) {
        throw new Error(`Área curricular ${area.areaCurricularId} no encontrada`);
      }

      // Validar que el área está activa
      if (!areaCurricular.activo) {
        throw new Error(
          `El área ${areaCurricular.nombre} no está activa`
        );
      }

      // Nota: La validación de época inicio/fin no está implementada en el schema
      // Si se necesita, agregar campos epocainicio y epocafin a areacurricular
    }

    // Eliminar asignaciones existentes para este grado y año
    await prisma.curriculogrado.deleteMany({
      where: {
        grado_id: gradoId,
        aniolectivo_id: anioLectivoId,
      },
    });

    // Crear las nuevas asignaciones
    const asignaciones = await Promise.all(
      areas.map((area) =>
        prisma.curriculogrado.create({
          data: {
            grado_id: gradoId,
            aniolectivo_id: anioLectivoId,
            area_id: area.areaCurricularId,
            orden: area.orden,
            activo: true,
          },
          include: {
            areacurricular: true,
          },
        })
      )
    );

    logger.info(
      `Asignadas ${asignaciones.length} áreas al grado ${grado.nombre} para el año ${anioLectivo.anio}`
    );

    return asignaciones.map((a) => ({
      id: a.id,
      orden: a.orden,
      area: {
        id: a.areacurricular.id,
        codigo: a.areacurricular.codigo,
        nombre: a.areacurricular.nombre,
      },
    }));
  }

  /**
   * ⭐ ENDPOINT CRÍTICO PARA OCR ⭐
   * Obtener la plantilla de áreas para un grado y año específico
   * Esto permite al OCR saber qué áreas debe buscar en un certificado histórico
   * 
   * Ejemplo: GET /api/curriculo/plantilla?anio=1990&grado=5
   */
  async getPlantillaByAnioGrado(anio: number, numeroGrado: number): Promise<PlantillaArea[]> {
    // Obtener institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!institucion) {
      throw new Error('No se encontró institución activa');
    }

    // Buscar el año lectivo
    const anioLectivo = await prisma.aniolectivo.findFirst({
      where: {
        institucion_id: institucion.id,
        anio,
      },
    });

    if (!anioLectivo) {
      throw new Error(`Año lectivo ${anio} no encontrado`);
    }

    // Buscar el grado por número
    const grado = await prisma.grado.findFirst({
      where: {
        institucion_id: institucion.id,
        numero: numeroGrado,
      },
    });

    if (!grado) {
      throw new Error(`Grado ${numeroGrado} no encontrado`);
    }

    // Obtener el currículo configurado para este grado y año
    const curriculo = await prisma.curriculogrado.findMany({
      where: {
        grado_id: grado.id,
        aniolectivo_id: anioLectivo.id,
        activo: true,
      },
      include: {
        areacurricular: true,
      },
      orderBy: {
        orden: 'asc',
      },
    });

    if (curriculo.length === 0) {
      logger.warn(`No hay currículo configurado para grado ${numeroGrado} en ${anio}`);
      
      // Fallback: Devolver todas las áreas activas
      const areasVigentes = await prisma.areacurricular.findMany({
        where: {
          institucion_id: institucion.id,
          activo: true,
        },
        orderBy: {
          orden: 'asc',
        },
      });

      return areasVigentes.map((area) => ({
        id: area.id,
        codigo: area.codigo,
        nombre: area.nombre,
        orden: area.orden,
      }));
    }

    // Retornar la plantilla configurada
    return curriculo.map((c) => ({
      id: c.areacurricular.id,
      codigo: c.areacurricular.codigo,
      nombre: c.areacurricular.nombre,
      orden: c.orden,
    }));
  }

  /**
   * Obtener todas las asignaciones de un grado específico
   */
  async getByGrado(gradoId: string, anioLectivoId?: string) {
    const where: any = {
      grado_id: gradoId,
      activo: true,
    };

    if (anioLectivoId) {
      where.aniolectivo_id = anioLectivoId;
    }

    const asignaciones = await prisma.curriculogrado.findMany({
      where,
      include: {
        areacurricular: true,
        aniolectivo: true,
        grado: true,
      },
      orderBy: [{ aniolectivo: { anio: 'desc' } }, { orden: 'asc' }],
    });

    return asignaciones.map((a) => ({
      id: a.id,
      orden: a.orden,
      activo: a.activo,
      anio: {
        id: a.aniolectivo.id,
        anio: a.aniolectivo.anio,
      },
      grado: {
        id: a.grado.id,
        numero: a.grado.numero,
        nombre: a.grado.nombre,
      },
      area: {
        id: a.areacurricular.id,
        codigo: a.areacurricular.codigo,
        nombre: a.areacurricular.nombre,
      },
    }));
  }

  /**
   * Actualizar el orden de un área en el currículo
   */
  async updateOrden(curriculoGradoId: string, nuevoOrden: number) {
    const curriculo = await prisma.curriculogrado.findUnique({
      where: { id: curriculoGradoId },
    });

    if (!curriculo) {
      throw new Error('Asignación de currículo no encontrada');
    }

    await prisma.curriculogrado.update({
      where: { id: curriculoGradoId },
      data: { orden: nuevoOrden },
    });

    logger.info(`Orden actualizado para currículo ${curriculoGradoId}: ${nuevoOrden}`);
  }

  /**
   * Eliminar una asignación de área-grado-año
   */
  async removeArea(curriculoGradoId: string) {
    const curriculo = await prisma.curriculogrado.findUnique({
      where: { id: curriculoGradoId },
    });

    if (!curriculo) {
      throw new Error('Asignación de currículo no encontrada');
    }

    await prisma.curriculogrado.update({
      where: { id: curriculoGradoId },
      data: { activo: false },
    });

    logger.info(`Área removida del currículo: ${curriculoGradoId}`);
  }
}

export const curriculoGradoService = new CurriculoGradoService();

