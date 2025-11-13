/**
 * Script de Migración Masiva de Actas Físicas
 *
 * Uso:
 *   npm run migrate:actas -- --file actas.json
 *
 * Formato del archivo JSON:
 * [
 *   {
 *     "numero": "001",
 *     "anio": 1985,
 *     "grado": 5,
 *     "seccion": "A",
 *     "turno": "MAÑANA",
 *     "archivo": "C:/ruta/a/ACTA_001_1985.pdf"
 *   }
 * ]
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileUploadService } from '../src/shared/services/file-upload.service';

const prisma = new PrismaClient();

interface ActaParaMigrar {
  numero: string;
  anio: number;
  grado: number;
  seccion?: string;
  turno?: 'MAÑANA' | 'TARDE' | 'NOCHE';
  tipo?: 'CONSOLIDADO' | 'TRASLADO' | 'SUBSANACION' | 'RECUPERACION';
  archivo: string;
  libro?: string;
  folio?: string;
  tipoEvaluacion?: string;
  colegioOrigen?: string;
  ubicacionFisica?: string;
  observaciones?: string;
}

interface ResultadoMigracion {
  exitosas: number;
  fallidas: number;
  duplicadas: number;
  errores: Array<{
    acta: ActaParaMigrar;
    error: string;
  }>;
}

const BATCH_SIZE = 50; // Procesar 50 actas por lote
const USUARIO_SISTEMA_ID = 'SISTEMA_MIGRACION'; // Usuario ficticio para migración

/**
 * Validar configuración previa
 */
async function validarPreMigracion(): Promise<boolean> {
  console.log('🔍 Validando configuración previa...\n');

  try {
    // 1. Verificar conexión a BD
    await prisma.$connect();
    console.log('✅ Conexión a base de datos OK');

    // 2. Verificar que existen años lectivos
    const aniosCount = await prisma.aniolectivo.count({
      where: {
        anio: { gte: 1985, lte: 2012 }
      }
    });

    if (aniosCount < 5) {
      console.error(`❌ Faltan años lectivos. Solo hay ${aniosCount} configurados entre 1985-2012`);
      return false;
    }
    console.log(`✅ Años lectivos configurados: ${aniosCount}`);

    // 3. Verificar que existen grados
    const gradosCount = await prisma.grado.count();
    if (gradosCount === 0) {
      console.error('❌ No hay grados configurados');
      return false;
    }
    console.log(`✅ Grados configurados: ${gradosCount}`);

    // 4. Verificar directorio de almacenamiento
    const dirActas = path.join(process.cwd(), 'storage', 'actas');
    if (!fs.existsSync(dirActas)) {
      fs.mkdirSync(dirActas, { recursive: true });
    }
    console.log('✅ Directorio de almacenamiento listo');

    console.log('\n✅ Validación completada. Sistema listo para migración.\n');
    return true;
  } catch (error: any) {
    console.error('❌ Error en validación:', error.message);
    return false;
  }
}

/**
 * Migrar una acta individual
 */
async function migrarActa(acta: ActaParaMigrar): Promise<void> {
  // 1. Buscar año lectivo
  const anioLectivo = await prisma.aniolectivo.findFirst({
    where: { anio: acta.anio }
  });

  if (!anioLectivo) {
    throw new Error(`Año lectivo ${acta.anio} no encontrado`);
  }

  // 2. Buscar grado
  const grado = await prisma.grado.findFirst({
    where: { numero: acta.grado }
  });

  if (!grado) {
    throw new Error(`Grado ${acta.grado} no encontrado`);
  }

  // 3. Verificar que el archivo existe
  if (!fs.existsSync(acta.archivo)) {
    throw new Error(`Archivo no encontrado: ${acta.archivo}`);
  }

  // 4. Leer y procesar archivo
  const archivoBuffer = fs.readFileSync(acta.archivo);
  const mockFile = {
    buffer: archivoBuffer,
    originalname: path.basename(acta.archivo),
    mimetype: acta.archivo.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
    size: archivoBuffer.length
  } as Express.Multer.File;

  const uploadedFile = await fileUploadService.saveActa(mockFile, {
    numero: acta.numero,
    anio: acta.anio
  });

  // 5. Verificar duplicados
  const existe = await prisma.actafisica.findFirst({
    where: {
      OR: [
        { hasharchivo: uploadedFile.hash },
        {
          numero: acta.numero,
          aniolectivo_id: anioLectivo.id
        }
      ]
    }
  });

  if (existe) {
    throw new Error('DUPLICADO');
  }

  // 6. Crear acta
  await prisma.actafisica.create({
    data: {
      numero: acta.numero,
      tipo: acta.tipo || 'CONSOLIDADO',
      aniolectivo_id: anioLectivo.id,
      grado_id: grado.id,
      seccion: acta.seccion,
      turno: acta.turno,
      libro: acta.libro,
      folio: acta.folio,
      tipoevaluacion: acta.tipoEvaluacion,
      colegiorigen: acta.colegioOrigen,
      ubicacionfisica: acta.ubicacionFisica,
      nombrearchivo: uploadedFile.filename,
      urlarchivo: uploadedFile.url,
      hasharchivo: uploadedFile.hash,
      estado: 'DISPONIBLE',
      observaciones: acta.observaciones || 'Migración masiva',
      usuariosubida_id: USUARIO_SISTEMA_ID,
    }
  });
}

/**
 * Migrar actas de forma masiva
 */
async function migrarActasMasivamente(actas: ActaParaMigrar[]): Promise<ResultadoMigracion> {
  console.log(`\n🚀 Iniciando migración de ${actas.length} actas...\n`);

  const resultado: ResultadoMigracion = {
    exitosas: 0,
    fallidas: 0,
    duplicadas: 0,
    errores: []
  };

  const inicio = Date.now();

  // Procesar en lotes
  for (let i = 0; i < actas.length; i += BATCH_SIZE) {
    const lote = actas.slice(i, i + BATCH_SIZE);
    const loteNumero = Math.floor(i / BATCH_SIZE) + 1;
    const totalLotes = Math.ceil(actas.length / BATCH_SIZE);

    console.log(`📦 Procesando lote ${loteNumero}/${totalLotes} (${lote.length} actas)...`);

    // Procesar lote en paralelo
    const resultados = await Promise.allSettled(
      lote.map(acta => migrarActa(acta))
    );

    resultados.forEach((res, idx) => {
      const acta = lote[idx]!;

      if (res.status === 'fulfilled') {
        resultado.exitosas++;
        process.stdout.write('.');
      } else {
        const error = res.reason;

        if (error.message === 'DUPLICADO') {
          resultado.duplicadas++;
          process.stdout.write('D');
        } else {
          resultado.fallidas++;
          process.stdout.write('X');
          resultado.errores.push({
            acta,
            error: error.message
          });
        }
      }
    });

    console.log(` ${lote.length}/${actas.length} completadas`);

    // Pequeña pausa entre lotes
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const duracion = ((Date.now() - inicio) / 1000).toFixed(2);

  console.log(`\n\n✅ Migración completada en ${duracion}s:`);
  console.log(`   - Exitosas: ${resultado.exitosas}`);
  console.log(`   - Duplicadas: ${resultado.duplicadas} (saltadas)`);
  console.log(`   - Fallidas: ${resultado.fallidas}`);
  console.log(`   - Tiempo promedio: ${(parseFloat(duracion) / actas.length).toFixed(3)}s/acta`);

  return resultado;
}

/**
 * Main
 */
async function main() {
  try {
    // Obtener archivo desde argumentos
    const args = process.argv.slice(2);
    const fileIndex = args.indexOf('--file');

    if (fileIndex === -1 || !args[fileIndex + 1]) {
      console.error('❌ Uso: npm run migrate:actas -- --file <archivo.json>');
      process.exit(1);
    }

    const archivoPath = args[fileIndex + 1]!;

    if (!fs.existsSync(archivoPath)) {
      console.error(`❌ Archivo no encontrado: ${archivoPath}`);
      process.exit(1);
    }

    // Leer archivo de actas
    const actasJSON = fs.readFileSync(archivoPath, 'utf-8');
    const actas: ActaParaMigrar[] = JSON.parse(actasJSON);

    console.log(`📄 Archivo cargado: ${actas.length} actas para migrar`);

    // Validar pre-migración
    const validacionOk = await validarPreMigracion();
    if (!validacionOk) {
      console.error('\n❌ La validación falló. Corrija los errores antes de continuar.');
      process.exit(1);
    }

    // Ejecutar migración
    const resultado = await migrarActasMasivamente(actas);

    // Guardar errores en archivo si hay
    if (resultado.errores.length > 0) {
      const errorFile = `migracion-errores-${Date.now()}.json`;
      fs.writeFileSync(
        errorFile,
        JSON.stringify(resultado.errores, null, 2)
      );
      console.log(`\n⚠️  Errores guardados en: ${errorFile}`);
    }

    // Estadísticas finales
    console.log('\n📊 Estadísticas finales:');
    const statsActuales = await prisma.actafisica.count();
    console.log(`   Total de actas en sistema: ${statsActuales}`);

    process.exit(resultado.fallidas > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('\n💥 Error fatal en migración:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
main();
