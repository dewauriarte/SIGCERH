/**
 * Script para verificar áreas curriculares existentes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarAreas() {
  console.log('📚 ÁREAS CURRICULARES REGISTRADAS:\n');
  
  const areas = await prisma.areacurricular.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
    select: {
      id: true,
      codigo: true,
      nombre: true,
      orden: true,
      _count: {
        select: {
          notasactas: true
        }
      }
    }
  });

  console.log(`Total: ${areas.length} áreas activas\n`);
  
  areas.forEach((area, i) => {
    console.log(`${i + 1}. [${area.codigo}] ${area.nombre}`);
    console.log(`   Orden: ${area.orden}, Notas: ${area._count.notasactas}\n`);
  });

  // Áreas que aparecen en el OCR pero no están registradas
  console.log('\n⚠️  ÁREAS FALTANTES:\n');
  const areasFaltantes = [
    'HISTORIA, GEOGRAFÍA Y ECONOMÍA',
    'TUTORÍA'
  ];

  areasFaltantes.forEach((nombre, i) => {
    console.log(`${i + 1}. ${nombre} - ❌ NO REGISTRADA`);
  });

  console.log('\n💡 RECOMENDACIÓN: Agregar estas áreas a la base de datos\n');
}

verificarAreas()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
