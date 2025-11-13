/**
 * Script de prueba para generar certificado completo desde actas
 *
 * Ejecutar: npx tsx test_generar_certificado.ts
 */

import { PrismaClient } from '@prisma/client';
import { certificadoService } from './src/modules/certificados/certificado.service';
import { actasEstudianteService } from './src/modules/estudiantes/actas.service';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================================');
  console.log('PRUEBA DE GENERACIÓN DE CERTIFICADO COMPLETO');
  console.log('================================================================================\n');

  try {
    // 1. Buscar un estudiante con actas
    console.log('📋 Paso 1: Buscar estudiante con actas normalizadas');
    console.log('--------------------------------------------------------------------------------');

    const estudiantes = await prisma.estudiante.findMany({
      where: {
        actas_normalizadas: {
          some: {},
        },
      },
      include: {
        actas_normalizadas: {
          include: {
            actafisica: {
              include: {
                grado: true,
              },
            },
          },
        },
      },
      take: 1,
    });

    if (estudiantes.length === 0) {
      console.log('❌ No se encontraron estudiantes con actas normalizadas');
      console.log('\n💡 Primero debes normalizar actas usando el sistema de normalización');
      return;
    }

    const estudiante = estudiantes[0];
    const gradosStr = estudiante.actas_normalizadas
      .map((a) => a.actafisica.grado.numero)
      .sort()
      .join(', ');

    console.log(`✅ Estudiante encontrado:`);
    console.log(`   ID: ${estudiante.id}`);
    console.log(`   DNI: ${estudiante.dni}`);
    console.log(`   Nombre: ${estudiante.apellidopaterno} ${estudiante.apellidomaterno} ${estudiante.nombres}`);
    console.log(`   Total Actas: ${estudiante.actas_normalizadas.length}`);
    console.log(`   Grados: ${gradosStr}\n`);

    // 2. Verificar actas disponibles
    console.log('📊 Paso 2: Verificar actas disponibles para certificado');
    console.log('--------------------------------------------------------------------------------');

    const datosActas = await actasEstudianteService.obtenerActasParaCertificado(estudiante.id);

    console.log(`Total de actas: ${datosActas.total_actas}`);
    console.log(`Grados completos: ${datosActas.grados_completos.join(', ')}`);
    console.log(`Grados faltantes: ${datosActas.grados_faltantes.join(', ')}`);
    console.log(`Puede generar certificado: ${datosActas.puede_generar_certificado ? '✅ SÍ' : '❌ NO'}`);

    if (datosActas.estudiante.tiene_dni_temporal) {
      console.log(`⚠️  ADVERTENCIA: Estudiante tiene DNI temporal: ${datosActas.estudiante.dni}`);
    }

    console.log('');

    // Mostrar resumen de actas
    for (const [grado, acta] of Object.entries(datosActas.actas_por_grado)) {
      console.log(`  📄 ${acta.grado} (${acta.anio_lectivo})`);
      console.log(`     Promedio: ${acta.promedio.toFixed(2)}`);
      console.log(`     Situación: ${acta.situacion_final}`);
      console.log(`     Áreas: ${acta.notas.length}`);
      console.log('');
    }

    if (!datosActas.puede_generar_certificado) {
      console.log('❌ No se puede generar certificado para este estudiante');
      return;
    }

    // 3. Generar certificado SIN PDF (más rápido para pruebas)
    console.log('🔨 Paso 3: Generar certificado (sin PDF)');
    console.log('--------------------------------------------------------------------------------');

    const usuarioTest = await prisma.usuario.findFirst({
      where: { activo: true },
    });

    if (!usuarioTest) {
      console.log('❌ No se encontró un usuario activo');
      return;
    }

    const inicio = Date.now();

    const resultado = await certificadoService.generarCertificadoCompleto(
      estudiante.id,
      usuarioTest.id,
      {
        lugarEmision: 'PUNO',
        observaciones: {
          otros: 'Certificado generado automáticamente desde actas normalizadas',
        },
        generarPDF: false, // Desactivar PDF para prueba rápida
      }
    );

    const duracion = Date.now() - inicio;

    console.log(`✅ Certificado generado exitosamente en ${duracion}ms`);
    console.log('');
    console.log(`📄 Detalles del certificado:`);
    console.log(`   ID: ${resultado.certificado.id}`);
    console.log(`   Código Virtual: ${resultado.codigoVirtual}`);
    console.log(`   Promedio General: ${resultado.promedio.toFixed(2)}`);
    console.log(`   Situación Final: ${resultado.certificado.situacionfinal}`);
    console.log(`   Estado: ${resultado.estado}`);
    console.log(`   Grados Procesados: ${resultado.gradosProcesados}`);
    console.log(`   Total Notas: ${resultado.totalNotas}`);
    console.log('');

    // 4. Verificar registros creados en la BD
    console.log('🔍 Paso 4: Verificar registros en la base de datos');
    console.log('--------------------------------------------------------------------------------');

    const certificadoBD = await prisma.certificado.findUnique({
      where: { id: resultado.certificado.id },
      include: {
        certificadodetalle: {
          include: {
            certificadonota: true,
          },
        },
      },
    });

    if (certificadoBD) {
      console.log(`✅ Certificado guardado en BD:`);
      console.log(`   - ${certificadoBD.certificadodetalle.length} detalles de grados`);

      let totalNotas = 0;
      for (const detalle of certificadoBD.certificadodetalle) {
        console.log(`   - Grado: ${detalle.orden}° → ${detalle.certificadonota.length} notas`);
        totalNotas += detalle.certificadonota.length;
      }

      console.log(`   - Total de notas en BD: ${totalNotas}`);
      console.log('');
    }

    // 5. Opcionalmente generar PDF
    console.log('📄 Paso 5: ¿Generar PDF? (opcional)');
    console.log('--------------------------------------------------------------------------------');
    console.log('Para generar el PDF, ejecuta:');
    console.log('');
    console.log(`  const { pdfService } = require('./src/modules/certificados/pdf.service');`);
    console.log(`  await pdfService.generarPDF('${resultado.certificado.id}');`);
    console.log('');

    // Resumen final
    console.log('================================================================================');
    console.log('✅ PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('================================================================================');
    console.log('');
    console.log('📊 RESUMEN:');
    console.log(`   ✓ Estudiante: ${datosActas.estudiante.nombre_completo}`);
    console.log(`   ✓ DNI: ${datosActas.estudiante.dni}`);
    console.log(`   ✓ Actas procesadas: ${datosActas.total_actas}`);
    console.log(`   ✓ Certificado ID: ${resultado.certificado.id}`);
    console.log(`   ✓ Código Virtual: ${resultado.codigoVirtual}`);
    console.log(`   ✓ Promedio: ${resultado.promedio.toFixed(2)}`);
    console.log(`   ✓ Grados: ${datosActas.grados_completos.join(', ')}`);
    console.log('');
    console.log('🎉 El sistema de generación de certificados está funcionando correctamente!');
    console.log('');

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error('');
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
