/**
 * Script para verificar datos normalizados en la base de datos
 * Ejecutar con: npx tsx verificar_datos.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarDatos() {
  console.log('🔍 VERIFICANDO DATOS NORMALIZADOS\n');
  console.log('='.repeat(60));

  // 1. Actas normalizadas
  console.log('\n📋 1. ACTAS NORMALIZADAS:');
  const actasNormalizadas = await prisma.actafisica.findMany({
    where: { normalizada: true },
    select: {
      id: true,
      numero: true,
      aniolectivo: {
        select: { anio: true }
      },
      grado: {
        select: {
          nombre: true,
          niveleducativo: { select: { nombre: true } }
        }
      },
      libro: {
        select: { codigo: true }
      },
      fecha_normalizacion: true
    },
    orderBy: { fecha_normalizacion: 'desc' },
    take: 5
  });

  console.log(`Total: ${actasNormalizadas.length} actas normalizadas\n`);
  actasNormalizadas.forEach((acta, i) => {
    const nivel = acta.grado.niveleducativo?.nombre || 'N/A';
    console.log(`${i + 1}. ${acta.numero} - ${nivel} ${acta.grado.nombre}`);
    console.log(`   Año: ${acta.aniolectivo.anio}, Libro: ${acta.libro?.codigo || 'N/A'}`);
    console.log(`   Normalizada: ${acta.fecha_normalizacion?.toLocaleDateString()}\n`);
  });

  // 2. Estudiantes creados recientemente
  console.log('\n👥 2. ESTUDIANTES RECIENTES (últimos 20):');
  const estudiantes = await prisma.estudiante.findMany({
    orderBy: { id: 'desc' },
    take: 20,
    select: {
      id: true,
      dni: true,
      nombres: true,
      apellidopaterno: true,
      apellidomaterno: true,
      _count: {
        select: {
          actas_normalizadas: true
        }
      }
    }
  });

  console.log(`Total: ${estudiantes.length} estudiantes\n`);
  estudiantes.forEach((est, i) => {
    const nombreCompleto = `${est.apellidopaterno} ${est.apellidomaterno} ${est.nombres}`;
    console.log(`${i + 1}. ${est.dni} - ${nombreCompleto}`);
    console.log(`   Actas asociadas: ${est._count.actas_normalizadas}\n`);
  });

  // 3. Vínculos actaestudiante del acta más reciente
  const actaReciente = actasNormalizadas[0];
  if (actaReciente) {
    console.log(`\n🔗 3. VÍNCULOS ACTA-ESTUDIANTE (${actaReciente.numero}):`);
    const vinculos = await prisma.actaestudiante.findMany({
      where: { acta_id: actaReciente.id },
      select: {
        id: true,
        estudiante: {
          select: {
            dni: true,
            nombres: true,
            apellidopaterno: true,
            apellidomaterno: true
          }
        },
        situacion_final: true,
        _count: {
          select: {
            notas: true
          }
        }
      }
    });

    console.log(`Total: ${vinculos.length} vínculos\n`);
    vinculos.forEach((v, i) => {
      const nombreCompleto = `${v.estudiante.apellidopaterno} ${v.estudiante.apellidomaterno} ${v.estudiante.nombres}`;
      console.log(`${i + 1}. ${v.estudiante.dni} - ${nombreCompleto}`);
      console.log(`   Situación: ${v.situacion_final}, Notas: ${v._count.notas}\n`);
    });

    // 4. Notas del primer estudiante
    if (vinculos.length > 0) {
      const primerVinculo = vinculos[0];
      const nombreCompleto = `${primerVinculo.estudiante.apellidopaterno} ${primerVinculo.estudiante.apellidomaterno} ${primerVinculo.estudiante.nombres}`;
      console.log(`\n📊 4. NOTAS DE ${nombreCompleto}:`);
      const notas = await prisma.actanota.findMany({
        where: { acta_estudiante_id: primerVinculo.id },
        select: {
          areacurricular: {
            select: { nombre: true }
          },
          nota: true
        },
        orderBy: {
          areacurricular: { nombre: 'asc' }
        }
      });

      console.log(`Total: ${notas.length} notas\n`);
      notas.forEach((nota, i) => {
        const aprobado = (nota.nota && nota.nota >= 11) ? '✅' : '❌';
        console.log(`${i + 1}. ${nota.areacurricular.nombre}: ${nota.nota || 'N/A'} ${aprobado}`);
      });
    }
  }

  // 5. Estadísticas generales
  console.log('\n📈 5. ESTADÍSTICAS GENERALES:');
  const [totalEstudiantes, totalVinculos, totalNotas, totalActasNorm] = await Promise.all([
    prisma.estudiante.count(),
    prisma.actaestudiante.count(),
    prisma.actanota.count(),
    prisma.actafisica.count({ where: { normalizada: true } })
  ]);

  console.log(`Total estudiantes: ${totalEstudiantes}`);
  console.log(`Total actas normalizadas: ${totalActasNorm}`);
  console.log(`Total vínculos acta-estudiante: ${totalVinculos}`);
  console.log(`Total notas registradas: ${totalNotas}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ VERIFICACIÓN COMPLETADA\n');
}

// Ejecutar verificación
verificarDatos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
