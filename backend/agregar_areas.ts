/**
 * Script para agregar áreas curriculares faltantes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function agregarAreasFaltantes() {
  console.log('➕ AGREGANDO ÁREAS CURRICULARES FALTANTES\n');
  
  const areasFaltantes = [
    {
      codigo: 'HGE',
      nombre: 'HISTORIA, GEOGRAFÍA Y ECONOMÍA',
      orden: 14,
      escompetenciatransversal: false,
      activo: true
    },
    {
      codigo: 'TUT',
      nombre: 'TUTORÍA',
      orden: 15,
      escompetenciatransversal: true, // Tutoría es una competencia transversal
      activo: true
    }
  ];

  for (const area of areasFaltantes) {
    try {
      // Verificar si ya existe
      const existe = await prisma.areacurricular.findFirst({
        where: {
          OR: [
            { codigo: area.codigo },
            { nombre: area.nombre }
          ]
        }
      });

      if (existe) {
        console.log(`⚠️  ${area.nombre} ya existe (${existe.codigo})`);
        continue;
      }

      // Crear nueva área
      const nueva = await prisma.areacurricular.create({
        data: {
          codigo: area.codigo,
          nombre: area.nombre,
          orden: area.orden,
          escompetenciatransversal: area.escompetenciatransversal,
          activo: area.activo,
          institucion_id: null // Será global (null) o puedes asignar una institución específica
        }
      });

      console.log(`✅ ${nueva.nombre} creada exitosamente (${nueva.codigo})`);
    } catch (error: any) {
      console.error(`❌ Error al crear ${area.nombre}:`, error.message);
    }
  }

  console.log('\n✅ PROCESO COMPLETADO\n');

  // Mostrar todas las áreas actualizadas
  const todasLasAreas = await prisma.areacurricular.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
    select: {
      codigo: true,
      nombre: true,
      orden: true
    }
  });

  console.log('📚 ÁREAS CURRICULARES ACTUALIZADAS:\n');
  todasLasAreas.forEach((area, i) => {
    console.log(`${i + 1}. [${area.codigo}] ${area.nombre} (orden: ${area.orden})`);
  });
}

agregarAreasFaltantes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
