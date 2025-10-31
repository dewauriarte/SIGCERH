/**
 * Seed de años lectivos históricos (1985-2012)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAniosLectivos() {
  console.log('🌱 Seeding años lectivos (1985-2012)...');

  // Obtener institución activa
  const institucion = await prisma.configuracioninstitucion.findFirst({
    where: { activo: true },
  });

  if (!institucion) {
    throw new Error('No se encontró institución activa');
  }

  // Crear años del 1985 al 2012
  const anios = [];
  for (let year = 1985; year <= 2012; year++) {
    anios.push({
      anio: year,
      fechainicio: new Date(`${year}-03-01`),
      fechafin: new Date(`${year}-12-31`),
      activo: true,
      configuracioninstitucion: {
        connect: { id: institucion.id },
      },
    });
  }

  // Insertar en batch
  let creados = 0;
  for (const anioData of anios) {
    try {
      // Verificar si ya existe
      const existe = await prisma.aniolectivo.findFirst({
        where: {
          institucion_id: institucion.id,
          anio: anioData.anio,
        },
      });

      if (!existe) {
        await prisma.aniolectivo.create({
          data: anioData,
        });
        creados++;
      }
    } catch (error) {
      console.error(`Error creando año ${anioData.anio}:`, error);
    }
  }

  console.log(`✅ ${creados} años lectivos creados (de ${anios.length} total)`);
}

