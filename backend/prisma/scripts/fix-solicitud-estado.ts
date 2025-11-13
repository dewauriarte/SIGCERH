/**
 * Script para corregir el estado de solicitudes con pagos validados
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../src/config/logger';

const prisma = new PrismaClient();

async function fixSolicitudEstado(numeroSeguimiento: string) {
  console.log(`\n🔧 Corrigiendo estado de ${numeroSeguimiento}...\n`);

  try {
    const solicitud = await prisma.solicitud.findFirst({
      where: { numeroseguimiento: numeroSeguimiento },
      include: { 
        pago: true,
        estudiante: true
      }
    });

    if (!solicitud) {
      console.error(`❌ Solicitud ${numeroSeguimiento} no encontrada`);
      process.exit(1);
    }

    console.log(`📋 Solicitud: ${solicitud.numeroexpediente}`);
    console.log(`   Estado actual: ${solicitud.estado}`);
    console.log(`   Pago ID: ${solicitud.pago_id || 'Sin pago'}`);

    if (solicitud.pago) {
      console.log(`💰 Pago encontrado: ${solicitud.pago.numeroorden}`);
      console.log(`   Estado pago: ${solicitud.pago.estado}`);
      console.log(`   Monto: S/ ${solicitud.pago.monto}`);
    }

    // Si el pago está VALIDADO pero la solicitud no está en LISTO_PARA_OCR
    if (solicitud.pago?.estado === 'VALIDADO' && solicitud.estado !== 'LISTO_PARA_OCR') {
      console.log(`\n⚠️  Inconsistencia detectada:`);
      console.log(`   Pago: VALIDADO`);
      console.log(`   Solicitud: ${solicitud.estado}`);
      console.log(`\n🔄 Actualizando solicitud a LISTO_PARA_OCR...\n`);

      await prisma.solicitud.update({
        where: { id: solicitud.id },
        data: {
          estado: 'LISTO_PARA_OCR',
          fechavalidacionpago: new Date(),
        },
      });

      console.log(`✅ Estado actualizado correctamente a LISTO_PARA_OCR`);
      console.log(`\n📊 Ahora el editor puede subir el acta física\n`);
    } else if (solicitud.estado === 'LISTO_PARA_OCR') {
      console.log(`\n✅ Solicitud ya está en LISTO_PARA_OCR (correcto)\n`);
    } else {
      console.log(`\n⚠️  Estado actual: ${solicitud.estado}`);
      console.log(`   No se realizaron cambios\n`);
    }
  } catch (error: any) {
    logger.error('Error en fixSolicitudEstado:', error);
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const numeroSeguimiento = process.argv[2];

if (!numeroSeguimiento) {
  console.error('Uso: npm run fix:solicitud <numero-seguimiento>');
  console.error('Ejemplo: npm run fix:solicitud S-2025-000009');
  process.exit(1);
}

fixSolicitudEstado(numeroSeguimiento);

