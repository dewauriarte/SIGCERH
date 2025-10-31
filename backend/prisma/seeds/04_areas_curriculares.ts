/**
 * Seed de áreas curriculares históricas
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAreasCurriculares() {
  console.log('🌱 Seeding áreas curriculares...');

  // Obtener institución activa
  const institucion = await prisma.configuracioninstitucion.findFirst({
    where: { activo: true },
  });

  if (!institucion) {
    throw new Error('No se encontró institución activa');
  }

  const areas = [
    { codigo: 'MAT', nombre: 'Matemática', orden: 1 },
    { codigo: 'COM', nombre: 'Comunicación', orden: 2 },
    { codigo: 'ING', nombre: 'Inglés', orden: 3 },
    { codigo: 'CTA', nombre: 'Ciencia, Tecnología y Ambiente', orden: 4 },
    { codigo: 'CCSS', nombre: 'Ciencias Sociales', orden: 5 },
    { codigo: 'EPT', nombre: 'Educación para el Trabajo', orden: 6 },
    { codigo: 'ART', nombre: 'Arte', orden: 7 },
    { codigo: 'EDF', nombre: 'Educación Física', orden: 8 },
    { codigo: 'FCC', nombre: 'Formación Ciudadana y Cívica', orden: 9 },
    { codigo: 'PFRH', nombre: 'Persona, Familia y Relaciones Humanas', orden: 10 },
    { codigo: 'REL', nombre: 'Educación Religiosa', orden: 11 },
    { codigo: 'COMP', nombre: 'Computación e Informática', orden: 12 },
  ];

  let creados = 0;
  for (const areaData of areas) {
    try {
      // Verificar si ya existe
      const existe = await prisma.areacurricular.findFirst({
        where: {
          institucion_id: institucion.id,
          codigo: areaData.codigo,
        },
      });

      if (!existe) {
        await prisma.areacurricular.create({
          data: {
            codigo: areaData.codigo,
            nombre: areaData.nombre,
            orden: areaData.orden,
            escompetenciatransversal: false,
            activo: true,
            configuracioninstitucion: {
              connect: { id: institucion.id },
            },
          },
        });
        creados++;
      }
    } catch (error) {
      console.error(`Error creando área ${areaData.nombre}:`, error);
    }
  }

  console.log(`✅ ${creados} áreas curriculares creadas (de ${areas.length} total)`);
}

