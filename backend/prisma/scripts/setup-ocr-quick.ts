/**
 * Script rápido para preparar expedientes OCR
 * Toma solicitudes existentes y las convierte a LISTO_PARA_OCR con acta subida
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupOCRQuick() {
  console.log('🧪 Preparando expedientes para OCR\n');

  try {
    // Buscar solicitudes en EN_BUSQUEDA del editor
    const solicitudes = await prisma.solicitud.findMany({
      where: {
        estado: 'EN_BUSQUEDA',
      },
      take: 3,
      include: {
        estudiante: true,
      },
    });

    if (solicitudes.length === 0) {
      console.error('❌ No hay solicitudes en EN_BUSQUEDA');
      console.log('💡 Ejecuta primero: npm run setup:editor\n');
      process.exit(1);
    }

    console.log(`✅ Encontradas ${solicitudes.length} solicitudes en EN_BUSQUEDA\n`);

    // Convertir cada una a LISTO_PARA_OCR
    for (const solicitud of solicitudes) {
      console.log(`📝 Procesando: ${solicitud.numeroexpediente}`);

      // Crear pago validado
      const numeroOrden = `ORD-${solicitud.numeroexpediente}`;
      const numeroRecibo = `REC-${solicitud.numeroexpediente}`;

      const pago = await prisma.pago.create({
        data: {
          numeroorden: numeroOrden,
          institucion_id: solicitud.institucion_id,
          monto: 15.0,
          metodopago: 'EFECTIVO',
          numerorecibo: numeroRecibo,
          fechapago: new Date(),
          horapago: new Date(),
          estado: 'VALIDADO',
          conciliado: true,
          fechaconciliacion: new Date(),
          usuarioconciliacion_id: solicitud.usuariogeneracion_id,
          observaciones: `Pago de prueba OCR - ${solicitud.numeroexpediente}`,
        },
      });

      console.log(`   💰 Pago creado: ${pago.numeroorden}`);

      // Actualizar solicitud: agregar metadata del acta y vincular pago
      const metadataActa = {
        actaFisica: {
          fechaSubida: new Date(),
          anioLectivo: solicitud.ultimoaniocursado || 1995,
          grado: solicitud.ultimogradocursado || 'Quinto Grado',
          seccion: 'A',
          turno: 'MAÑANA',
          tipoEvaluacion: 'FINAL',
          ubicacionFisica: `Archivo-${solicitud.ultimoaniocursado}-${solicitud.ultimogradocursado}-A`,
          colegioOrigen: solicitud.colegioprocedencia || 'I.E. Prueba',
          archivoUrl: null,
        },
      };

      await prisma.solicitud.update({
        where: { id: solicitud.id },
        data: {
          estado: 'LISTO_PARA_OCR',
          pago_id: pago.id,
          fechavalidacionpago: new Date(),
          usuariovalidacionpago_id: solicitud.usuariogeneracion_id,
          observaciones: JSON.stringify(metadataActa),
        },
      });

      console.log(`   ✅ Solicitud actualizada a LISTO_PARA_OCR con metadata\n`);
    }

    console.log('✅ ¡Datos de prueba OCR listos!\n');
    console.log('📋 Resumen:');
    console.log(`   - ${solicitudes.length} expedientes en LISTO_PARA_OCR`);
    console.log('   - Todos con acta subida (metadata)');
    console.log('   - Todos con pago validado\n');
    console.log('🧪 Ahora puedes probar:');
    console.log('   1. Ir a Dashboard Editor → Expedientes Asignados');
    console.log('   2. Click en tab "Listo para OCR"');
    console.log('   3. Click en el icono 🧠 (cerebro morado)');
    console.log('   4. Click "🤖 PROCESAR CON IA/OCR"\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupOCRQuick();

