/**
 * Script para simular que un pago ha sido validado
 * Cambia el estado de ACTA_ENCONTRADA_PENDIENTE_PAGO a un estado temporal
 * que permite subir el acta (en producción sería después de validar pago)
 * 
 * Uso: npx tsx prisma/scripts/simular-pago.ts <numero-expediente>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simularPago() {
  const numeroExpediente = process.argv[2];

  if (!numeroExpediente) {
    console.error('❌ Debes proporcionar un número de expediente');
    console.log('Uso: npx tsx prisma/scripts/simular-pago.ts <numero-expediente>');
    console.log('Ejemplo: npx tsx prisma/scripts/simular-pago.ts EXP-2025-000001');
    process.exit(1);
  }

  try {
    console.log(`🔍 Buscando expediente: ${numeroExpediente}...\n`);

    const solicitud = await prisma.solicitud.findFirst({
      where: {
        numeroexpediente: numeroExpediente,
      },
    });

    if (!solicitud) {
      console.error(`❌ No se encontró el expediente: ${numeroExpediente}`);
      process.exit(1);
    }

    console.log(`✅ Expediente encontrado: ${solicitud.numeroexpediente}`);
    console.log(`   Estado actual: ${solicitud.estado}\n`);

    if (solicitud.estado !== 'ACTA_ENCONTRADA_PENDIENTE_PAGO') {
      console.error(`❌ El expediente debe estar en estado ACTA_ENCONTRADA_PENDIENTE_PAGO`);
      console.log(`   Estado actual: ${solicitud.estado}`);
      process.exit(1);
    }

    // Actualizar estado a "LISTO_PARA_OCR" (temporal mientras implementamos tabla de pagos)
    await prisma.solicitud.update({
      where: { id: solicitud.id },
      data: {
        estado: 'LISTO_PARA_OCR',
        fechaactualizacion: new Date(),
      },
    });

    console.log('✅ ¡Pago simulado correctamente!');
    console.log(`   Nuevo estado: LISTO_PARA_OCR`);
    console.log(`\n💡 Ahora puedes subir el acta física desde el dashboard del editor\n`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

simularPago();

