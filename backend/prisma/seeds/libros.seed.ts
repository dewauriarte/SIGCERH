/**
 * Script de seed para poblar la tabla de libros con datos de ejemplo
 * Ejecutar con: npx ts-node prisma/seeds/libros.seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LIBROS_SEED = [
  {
    codigo: '1',
    descripcion: 'Libro de actas 1985-1990',
    ubicacion_fisica: 'Archivo Central - Estante A - Caja 1',
    anio_inicio: 1985,
    anio_fin: 1990,
    total_folios: 500,
    estado: 'ACTIVO',
    observaciones: 'Libro en buen estado, legible',
  },
  {
    codigo: '2',
    descripcion: 'Libro de actas 1991-1995',
    ubicacion_fisica: 'Archivo Central - Estante A - Caja 2',
    anio_inicio: 1991,
    anio_fin: 1995,
    total_folios: 480,
    estado: 'ACTIVO',
    observaciones: null,
  },
  {
    codigo: '3',
    descripcion: 'Libro de actas 1996-2000',
    ubicacion_fisica: 'Archivo Central - Estante B - Caja 1',
    anio_inicio: 1996,
    anio_fin: 2000,
    total_folios: 520,
    estado: 'ACTIVO',
    observaciones: null,
  },
  {
    codigo: '4',
    descripcion: 'Libro de actas 2001-2005',
    ubicacion_fisica: 'Archivo Central - Estante B - Caja 2',
    anio_inicio: 2001,
    anio_fin: 2005,
    total_folios: 510,
    estado: 'ACTIVO',
    observaciones: null,
  },
  {
    codigo: '5',
    descripcion: 'Libro de actas 2006-2010',
    ubicacion_fisica: 'Archivo Central - Estante C - Caja 1',
    anio_inicio: 2006,
    anio_fin: 2010,
    total_folios: 490,
    estado: 'ACTIVO',
    observaciones: null,
  },
  {
    codigo: '6',
    descripcion: 'Libro de actas 2011-2012',
    ubicacion_fisica: 'Archivo Central - Estante C - Caja 2',
    anio_inicio: 2011,
    anio_fin: 2012,
    total_folios: 200,
    estado: 'ACTIVO',
    observaciones: 'Último libro del periodo físico',
  },
  {
    codigo: 'A',
    descripcion: 'Libro especial A - Subsanación',
    ubicacion_fisica: 'Archivo Especial - Estante 1',
    anio_inicio: 1985,
    anio_fin: 2000,
    total_folios: 150,
    estado: 'ARCHIVADO',
    observaciones: 'Contiene actas de subsanación de varios años',
  },
  {
    codigo: 'B',
    descripcion: 'Libro especial B - Recuperación',
    ubicacion_fisica: 'Archivo Especial - Estante 1',
    anio_inicio: 2000,
    anio_fin: 2012,
    total_folios: 180,
    estado: 'ARCHIVADO',
    observaciones: 'Contiene actas de recuperación pedagógica',
  },
  {
    codigo: 'C',
    descripcion: 'Libro C - Actas especiales',
    ubicacion_fisica: 'Archivo Especial - Estante 2',
    anio_inicio: 1990,
    anio_fin: 2005,
    total_folios: 120,
    estado: 'DETERIORADO',
    observaciones: 'Algunas páginas dañadas, requiere digitalización urgente',
  },
  {
    codigo: '7',
    descripcion: 'Libro temporal 7',
    ubicacion_fisica: 'Depósito temporal',
    anio_inicio: 1988,
    anio_fin: 1992,
    total_folios: 300,
    estado: 'PERDIDO',
    observaciones: 'Libro extraviado en mudanza de 2015, en búsqueda',
  },
];

async function seed() {
  console.log('🌱 Iniciando seed de libros...');

  try {
    // Obtener la primera institución disponible
    const institucion = await prisma.configuracioninstitucion.findFirst();

    if (!institucion) {
      console.error('❌ No se encontró ninguna institución. Ejecuta primero el seed de instituciones.');
      process.exit(1);
    }

    console.log(`📚 Creando libros para institución: ${institucion.nombre}`);

    // Crear libros
    let creados = 0;
    let existentes = 0;

    for (const libroData of LIBROS_SEED) {
      // Verificar si ya existe
      const existing = await prisma.libro.findFirst({
        where: {
          institucion_id: institucion.id,
          codigo: libroData.codigo,
        },
      });

      if (existing) {
        console.log(`⏭️  Libro ${libroData.codigo} ya existe, saltando...`);
        existentes++;
        continue;
      }

      // Crear libro
      await prisma.libro.create({
        data: {
          institucion_id: institucion.id,
          ...libroData,
        },
      });

      creados++;
      console.log(`✅ Libro ${libroData.codigo} - ${libroData.descripcion} creado`);
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Libros creados: ${creados}`);
    console.log(`   ⏭️  Libros existentes: ${existentes}`);
    console.log(`   📚 Total: ${LIBROS_SEED.length}`);
    console.log('\n🎉 Seed de libros completado exitosamente!');
  } catch (error) {
    console.error('❌ Error al crear libros:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar seed
seed()
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

