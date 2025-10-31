/**
 * Seed de grados de secundaria (1ro-5to)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedGrados() {
  console.log('🌱 Seeding grados de secundaria...');

  // Obtener institución activa
  const institucion = await prisma.configuracioninstitucion.findFirst({
    where: { activo: true },
  });

  if (!institucion) {
    throw new Error('No se encontró institución activa');
  }

  const grados = [
    { numero: 1, nombre: 'Primer Grado', nombreCorto: '1RO', orden: 1 },
    { numero: 2, nombre: 'Segundo Grado', nombreCorto: '2DO', orden: 2 },
    { numero: 3, nombre: 'Tercer Grado', nombreCorto: '3RO', orden: 3 },
    { numero: 4, nombre: 'Cuarto Grado', nombreCorto: '4TO', orden: 4 },
    { numero: 5, nombre: 'Quinto Grado', nombreCorto: '5TO', orden: 5 },
  ];

  let creados = 0;
  for (const gradoData of grados) {
    try {
      // Verificar si ya existe
      const existe = await prisma.grado.findFirst({
        where: {
          institucion_id: institucion.id,
          numero: gradoData.numero,
        },
      });

      if (!existe) {
        await prisma.grado.create({
          data: {
            numero: gradoData.numero,
            nombre: gradoData.nombre,
            nombrecorto: gradoData.nombreCorto,
            orden: gradoData.orden,
            activo: true,
            configuracioninstitucion: {
              connect: { id: institucion.id },
            },
          },
        });
        creados++;
      }
    } catch (error) {
      console.error(`Error creando grado ${gradoData.nombre}:`, error);
    }
  }

  console.log(`✅ ${creados} grados creados (de ${grados.length} total)`);
}

