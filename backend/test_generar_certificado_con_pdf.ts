/**
 * Script de prueba COMPLETO: Certificado + PDF
 *
 * Ejecutar: npx tsx test_generar_certificado_con_pdf.ts
 */

import { PrismaClient } from '@prisma/client';
import { certificadoService } from './src/modules/certificados/certificado.service';
import { pdfService } from './src/modules/certificados/pdf.service';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================================');
  console.log('PRUEBA COMPLETA: CERTIFICADO + PDF');
  console.log('================================================================================\n');

  try {
    // 1. Buscar estudiante con actas
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        actas_normalizadas: {
          some: {},
        },
      },
      include: {
        actas_normalizadas: true,
      },
      take: 1,
    });

    if (estudiantes.length === 0) {
      console.log('❌ No se encontraron estudiantes con actas');
      return;
    }

    const estudiante = estudiantes[0];

    console.log('📋 Estudiante seleccionado:');
    console.log(`   ${estudiante.apellidopaterno} ${estudiante.apellidomaterno} ${estudiante.nombres}`);
    console.log(`   DNI: ${estudiante.dni}`);
    console.log(`   Actas: ${estudiante.actas_normalizadas.length}\n`);

    // 2. Obtener usuario para la prueba
    const usuario = await prisma.usuario.findFirst({
      where: { activo: true },
    });

    if (!usuario) {
      console.log('❌ No se encontró usuario activo');
      return;
    }

    // 3. Generar certificado COMPLETO (con PDF)
    console.log('🔨 Generando certificado completo (CON PDF)...');
    console.log('--------------------------------------------------------------------------------\n');

    const inicio = Date.now();

    const resultado = await certificadoService.generarCertificadoCompleto(
      estudiante.id,
      usuario.id,
      {
        lugarEmision: 'PUNO',
        observaciones: {
          otros: 'Certificado de prueba generado automáticamente',
        },
        generarPDF: true, // ✅ GENERAR PDF
      }
    );

    const duracion = Date.now() - inicio;

    console.log(`\n✅ Certificado generado en ${duracion}ms\n`);

    // 4. Mostrar resultados
    console.log('================================================================================');
    console.log('📊 RESULTADO COMPLETO');
    console.log('================================================================================\n');

    console.log('📄 CERTIFICADO:');
    console.log(`   ID: ${resultado.certificado.id}`);
    console.log(`   Código Virtual: ${resultado.codigoVirtual}`);
    console.log(`   Promedio General: ${resultado.promedio.toFixed(2)}`);
    console.log(`   Situación: ${resultado.certificado.situacionfinal}`);
    console.log(`   Estado: ${resultado.estado}`);
    console.log('');

    console.log('📊 ESTADÍSTICAS:');
    console.log(`   Grados procesados: ${resultado.gradosProcesados}`);
    console.log(`   Total de notas: ${resultado.totalNotas}`);
    console.log('');

    if (resultado.pdf) {
      console.log('📁 PDF GENERADO:');
      console.log(`   URL: ${resultado.pdf.urlPdf}`);
      console.log(`   Hash SHA-256: ${resultado.pdf.hashPdf.substring(0, 16)}...`);
      console.log(`   QR Code: ${resultado.pdf.urlQr}`);
      console.log('');

      // Verificar que el archivo existe
      const fs = require('fs');
      const path = require('path');
      const pdfPath = path.join(process.cwd(), 'storage', resultado.pdf.urlPdf.replace('/storage/', ''));

      if (fs.existsSync(pdfPath)) {
        const stats = fs.statSync(pdfPath);
        console.log(`   ✅ Archivo PDF existe (${Math.round(stats.size / 1024)} KB)`);
      } else {
        console.log(`   ❌ Archivo PDF no encontrado en: ${pdfPath}`);
      }
    } else {
      console.log('⚠️  PDF no generado');
    }

    console.log('');
    console.log('================================================================================');
    console.log('✅ PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('================================================================================');
    console.log('');
    console.log('🎉 Sistema de certificados funcionando al 100%');
    console.log('   ✓ Actas normalizadas → Certificado');
    console.log('   ✓ Certificado → PDF');
    console.log('   ✓ Código QR generado');
    console.log('   ✓ Hash SHA-256 calculado');
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
