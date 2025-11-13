/**
 * Script de prueba para sistema de vinculación de estudiantes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function probarVinculacion() {
  console.log('🧪 PROBANDO SISTEMA DE VINCULACIÓN DE ESTUDIANTES\n');
  console.log('='.repeat(60));

  // 1. Buscar un estudiante con actas
  console.log('\n📋 1. BUSCANDO ESTUDIANTE CON ACTAS...');
  
  const estudiante = await prisma.estudiante.findFirst({
    where: {
      actas_normalizadas: {
        some: {}
      }
    },
    include: {
      _count: {
        select: {
          actas_normalizadas: true
        }
      }
    }
  });

  if (!estudiante) {
    console.log('❌ No se encontró ningún estudiante con actas normalizadas');
    return;
  }

  const nombreCompleto = `${estudiante.apellidopaterno} ${estudiante.apellidomaterno} ${estudiante.nombres}`;
  console.log(`\n✅ Estudiante encontrado:`);
  console.log(`   DNI: ${estudiante.dni} ${estudiante.dni.startsWith('T') ? '(TEMPORAL)' : '(REAL)'}`);
  console.log(`   Nombre: ${nombreCompleto}`);
  console.log(`   Total actas: ${estudiante._count.actas_normalizadas}`);

  // 2. Obtener todas sus actas agrupadas
  console.log('\n📚 2. OBTENIENDO ACTAS CONSOLIDADAS...');
  
  const vinculos = await prisma.actaestudiante.findMany({
    where: {
      estudiante_id: estudiante.id
    },
    include: {
      actafisica: {
        include: {
          grado: true,
          aniolectivo: true
        }
      },
      notas: {
        include: {
          areacurricular: true
        }
      }
    }
  });

  if (vinculos.length === 0) {
    console.log('⚠️ El estudiante no tiene actas vinculadas');
    return;
  }

  console.log(`\n✅ ${vinculos.length} acta(s) encontrada(s):\n`);

  const actasPorGrado: Record<number, any> = {};
  
  for (const vinculo of vinculos) {
    const grado = vinculo.actafisica.grado.numero;
    const promedio = vinculo.notas.length > 0
      ? vinculo.notas.reduce((sum, n) => sum + (n.nota || 0), 0) / vinculo.notas.length
      : 0;

    actasPorGrado[grado] = {
      grado: vinculo.actafisica.grado.nombre,
      anio: vinculo.actafisica.aniolectivo.anio,
      situacion: vinculo.situacion_final,
      promedio: Math.round(promedio * 100) / 100,
      areas: vinculo.notas.length
    };

    console.log(`   ${grado}° ${vinculo.actafisica.grado.nombre} - Año ${vinculo.actafisica.aniolectivo.anio}`);
    console.log(`      Situación: ${vinculo.situacion_final}, Promedio: ${Math.round(promedio * 100) / 100}, Áreas: ${vinculo.notas.length}`);
  }

  // 3. Verificar grados completos
  console.log('\n🎯 3. ANÁLISIS DE GRADOS:\n');
  
  const todosLosGrados = [1, 2, 3, 4, 5];
  const gradosCompletos = Object.keys(actasPorGrado).map(Number).sort();
  const gradosFaltantes = todosLosGrados.filter(g => !gradosCompletos.includes(g));

  console.log(`   ✅ Grados completos: ${gradosCompletos.join(', ')}`);
  console.log(`   ⏳ Grados faltantes: ${gradosFaltantes.length > 0 ? gradosFaltantes.join(', ') : 'Ninguno (¡Certificado completo!)'}`);

  // 4. Determinar si puede generar certificado
  console.log('\n📜 4. ESTADO PARA CERTIFICADO:\n');
  
  const puedeGenerar = vinculos.length > 0;
  const dniTemporal = estudiante.dni.startsWith('T');
  
  console.log(`   Puede generar certificado: ${puedeGenerar ? '✅ SÍ' : '❌ NO'}`);
  console.log(`   DNI temporal: ${dniTemporal ? '⚠️ SÍ (completar DNI real recomendado)' : '✅ NO'}`);
  console.log(`   Actas vinculadas: ${vinculos.length}/5 grados`);

  if (puedeGenerar && !dniTemporal && gradosFaltantes.length === 0) {
    console.log('\n🎉 ¡ESTUDIANTE LISTO PARA CERTIFICADO COMPLETO!');
  } else if (puedeGenerar) {
    console.log('\n⚠️  Estudiante puede generar certificado parcial');
    if (dniTemporal) {
      console.log('   💡 Recomendación: Completar DNI real para certificado oficial');
    }
    if (gradosFaltantes.length > 0) {
      console.log(`   💡 Faltan normalizar actas de: ${gradosFaltantes.join(', ')}° grado`);
    }
  }

  // 5. Buscar estudiantes duplicados por nombre
  console.log('\n🔍 5. VERIFICANDO DUPLICADOS POR NOMBRE...\n');
  
  const duplicados = await prisma.estudiante.findMany({
    where: {
      nombres: estudiante.nombres,
      apellidopaterno: estudiante.apellidopaterno,
      apellidomaterno: estudiante.apellidomaterno,
      id: { not: estudiante.id }
    },
    include: {
      _count: {
        select: {
          actas_normalizadas: true
        }
      }
    }
  });

  if (duplicados.length > 0) {
    console.log(`   ⚠️ Se encontraron ${duplicados.length} duplicado(s) con el mismo nombre:`);
    duplicados.forEach((dup, i) => {
      console.log(`\n   ${i + 1}. DNI: ${dup.dni}, Actas: ${dup._count.actas_normalizadas}`);
      console.log(`      💡 Considerar fusionar con actualizar-dni endpoint`);
    });
  } else {
    console.log(`   ✅ No se encontraron duplicados`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ PRUEBA COMPLETADA\n');
}

probarVinculacion()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
