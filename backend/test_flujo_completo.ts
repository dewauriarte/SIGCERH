/**
 * Script de Prueba: Flujo Completo de Vinculación de Estudiantes
 * 
 * Este script demuestra el flujo completo:
 * 1. Buscar estudiante por nombre
 * 2. Obtener todas sus actas agrupadas por grado
 * 3. Verificar si puede generar certificado
 * 4. (Opcional) Actualizar DNI temporal a real
 */

import { PrismaClient } from '@prisma/client';
import { actasEstudianteService } from './src/modules/estudiantes/actas.service';

const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(80));
  console.log('PRUEBA DE FLUJO COMPLETO - SISTEMA DE CERTIFICADOS');
  console.log('='.repeat(80));
  console.log();

  try {
    // 1. Buscar estudiante por nombre
    console.log('📋 Paso 1: Buscar estudiante por nombre');
    console.log('-'.repeat(80));
    
    const apellidoPaterno = 'BUSTINCIO';
    const apellidoMaterno = 'RIQUELME';
    const nombres = 'OPTACIANO';
    
    console.log(`Buscando: "${apellidoPaterno} ${apellidoMaterno}, ${nombres}"`);
    
    const resultados = await actasEstudianteService.buscarPorNombre(apellidoPaterno, apellidoMaterno, nombres);
    
    if (resultados.length === 0) {
      console.log('❌ No se encontraron estudiantes con ese nombre');
      return;
    }
    
    console.log(`✅ Estudiantes encontrados: ${resultados.length}`);
    console.log();
    
    for (const est of resultados) {
      console.log(`  📌 ID: ${est.id}`);
      console.log(`     DNI: ${est.dni}`);
      console.log(`     Nombre: ${est.nombre_completo}`);
      console.log(`     Total Actas: ${est.total_actas}`);
      console.log(`     Grados: ${est.grados.join(', ')}`);
      console.log();
    }
    
    const estudiante = resultados[0];
    
    // 2. Obtener actas para certificado
    console.log('📚 Paso 2: Obtener historial académico completo');
    console.log('-'.repeat(80));
    
    const historial = await actasEstudianteService.obtenerActasParaCertificado(estudiante.id);
    
    console.log(`Estudiante: ${historial.estudiante.nombre_completo}`);
    console.log(`DNI: ${historial.estudiante.dni} ${historial.estudiante.tiene_dni_temporal ? '(TEMPORAL)' : '(REAL)'}`);
    console.log(`Total de actas: ${Object.keys(historial.actas_por_grado).length}`);
    console.log();
    
    // 3. Mostrar resumen por grado
    console.log('📊 Paso 3: Resumen por grado');
    console.log('-'.repeat(80));
    
    console.log(`Grados completos: ${historial.grados_completos.join(', ')}`);
    console.log(`Grados faltantes: ${historial.grados_faltantes.join(', ') || 'Ninguno'}`);
    console.log(`Puede generar certificado: ${historial.puede_generar_certificado ? '✅ SÍ' : '❌ NO'}`);
    console.log();
    
    // 4. Detalle de cada grado
    console.log('📖 Paso 4: Detalle de actas por grado');
    console.log('-'.repeat(80));
    
    const gradosOrdenados = Object.entries(historial.actas_por_grado)
      .sort(([a], [b]) => parseInt(a) - parseInt(b));
    
    for (const [grado, acta] of gradosOrdenados) {
      console.log();
      console.log(`  🎓 ${grado}° GRADO - Año ${acta.anio_lectivo}`);
      console.log(`     Promedio General: ${acta.promedio.toFixed(2)}`);
      console.log(`     Áreas Curriculares: ${acta.notas.length}`);
      console.log(`     Situación Final: ${acta.situacion_final}`);
      console.log();
      
      // Mostrar notas ordenadas por nombre de área
      const notasOrdenadas = [...acta.notas]
        .sort((a, b) => (a.area || '').localeCompare(b.area || ''));
      
      for (const nota of notasOrdenadas) {
        const notaValor = nota.nota ?? 0;
        const estado = notaValor >= 11 ? '✅' : '❌';
        const notaTexto = nota.nota !== null ? notaValor.toString() : 'N/A';
        console.log(`     ${estado} ${(nota.area || 'Sin área').padEnd(35)} ${notaTexto.padStart(4)}`);
      }
    }
    
    console.log();
    console.log('='.repeat(80));
    
    // 5. Verificar si necesita actualizar DNI
    if (historial.estudiante.tiene_dni_temporal) {
      console.log();
      console.log('⚠️  ACCIÓN REQUERIDA');
      console.log('-'.repeat(80));
      console.log('Este estudiante tiene un DNI temporal.');
      console.log('Para generar un certificado oficial, complete el DNI real usando:');
      console.log();
      console.log(`  PUT /api/estudiantes/${estudiante.id}/actualizar-dni`);
      console.log('  Body: { "nuevoDNI": "12345678", "fusionarDuplicado": false }');
      console.log();
    } else {
      console.log();
      console.log('✅ El estudiante tiene DNI real y puede generar certificado oficial');
      console.log();
    }
    
    // 6. Resumen final
    console.log('📋 RESUMEN FINAL');
    console.log('-'.repeat(80));
    console.log(`✓ Estudiante encontrado: ${historial.estudiante.nombre_completo}`);
    console.log(`✓ DNI: ${historial.estudiante.dni} (${historial.estudiante.tiene_dni_temporal ? 'Temporal' : 'Real'})`);
    console.log(`✓ Grados registrados: ${historial.grados_completos.length} de 5`);
    console.log(`✓ Total de áreas evaluadas: ${Object.values(historial.actas_por_grado).reduce((sum, acta) => sum + acta.notas.length, 0)}`);
    console.log(`✓ Estado de certificación: ${historial.puede_generar_certificado ? 'LISTO PARA CERTIFICAR' : 'FALTAN GRADOS'}`);
    console.log();
    console.log('='.repeat(80));
    console.log('✅ Prueba completada exitosamente');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
