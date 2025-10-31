/**
 * Script principal de seeds
 * Ejecuta todos los seeds en orden
 */

import { PrismaClient } from '@prisma/client';
import { seedAniosLectivos } from './02_anios_lectivos';
import { seedGrados } from './03_grados';
import { seedAreasCurriculares } from './04_areas_curriculares';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding de base de datos...\n');

  try {
    // Verificar que existe institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!institucion) {
      console.error('❌ No se encontró institución activa. Ejecuta primero el seed de institución.');
      process.exit(1);
    }

    console.log(`📍 Institución activa: ${institucion.nombre}\n`);

    // Ejecutar seeds en orden
    await seedAniosLectivos();
    await seedGrados();
    await seedAreasCurriculares();

    console.log('\n✅ Seeding completado exitosamente!');
  } catch (error) {
    console.error('\n❌ Error durante el seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

