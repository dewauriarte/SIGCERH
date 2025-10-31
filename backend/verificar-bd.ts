/**
 * Script de verificación de base de datos
 * Verifica que los seeds se hayan ejecutado correctamente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarBaseDatos() {
  try {
    console.log('🔍 Verificando base de datos...\n');

    // 1. Verificar Roles
    console.log('📋 Verificando Roles...');
    const roles = await prisma.rol.findMany({
      orderBy: { nivel: 'asc' }
    });
    console.log(`✓ Total roles: ${roles.length}`);
    if (roles.length > 0) {
      roles.forEach(rol => {
        console.log(`  - ${rol.codigo}: ${rol.nombre} (Nivel ${rol.nivel})`);
      });
    } else {
      console.log('  ⚠️  No hay roles en la BD - Seeds no ejecutados');
    }

    // 2. Verificar Usuarios
    console.log('\n👥 Verificando Usuarios...');
    const usuarios = await prisma.usuario.count();
    console.log(`✓ Total usuarios: ${usuarios}`);

    if (usuarios > 0) {
      const admin = await prisma.usuario.findFirst({
        where: { username: 'admin' },
        include: {
          UsuarioRol: {
            include: { rol: true }
          }
        }
      });
      if (admin) {
        console.log(`  ✓ Usuario admin existe (${admin.email})`);
        console.log(`  ✓ Roles asignados: ${admin.UsuarioRol.length}`);
      }
    } else {
      console.log('  ⚠️  No hay usuarios - Seeds no ejecutados');
    }

    // 3. Verificar Configuración
    console.log('\n🏫 Verificando Configuración Institución...');
    const institucion = await prisma.configuracionInstitucion.findFirst();
    if (institucion) {
      console.log(`✓ Institución: ${institucion.nombre}`);
      console.log(`  - Código Modular: ${institucion.codigoModular}`);
      console.log(`  - UGEL: ${institucion.ugel}`);
    } else {
      console.log('  ⚠️  No hay configuración - Seeds no ejecutados');
    }

    // 4. Verificar Niveles Educativos
    console.log('\n📚 Verificando Niveles Educativos...');
    const niveles = await prisma.nivelEducativo.count();
    console.log(`✓ Total niveles: ${niveles}`);

    // 5. Verificar Grados
    console.log('\n📊 Verificando Grados...');
    const grados = await prisma.grado.count();
    console.log(`✓ Total grados: ${grados}`);

    // 6. Verificar Años Lectivos
    console.log('\n📅 Verificando Años Lectivos...');
    const anios = await prisma.anioLectivo.count();
    console.log(`✓ Total años lectivos: ${anios}`);

    // 7. Verificar Áreas Curriculares
    console.log('\n📖 Verificando Áreas Curriculares...');
    const areas = await prisma.areaCurricular.count();
    console.log(`✓ Total áreas curriculares: ${areas}`);

    // 8. Verificar Estudiantes
    console.log('\n🎓 Verificando Estudiantes...');
    const estudiantes = await prisma.estudiante.count();
    console.log(`✓ Total estudiantes: ${estudiantes}`);

    // 9. Verificar Solicitudes
    console.log('\n📝 Verificando Solicitudes...');
    const solicitudes = await prisma.solicitud.count();
    console.log(`✓ Total solicitudes: ${solicitudes}`);

    // Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(50));

    const seedsEjecutados = roles.length >= 7 && usuarios >= 1 && institucion !== null;

    if (seedsEjecutados) {
      console.log('✅ SEEDS EJECUTADOS CORRECTAMENTE');
      console.log('✅ Base de datos tiene datos iniciales');
    } else {
      console.log('⚠️  SEEDS NO EJECUTADOS O INCOMPLETOS');
      console.log('💡 Ejecutar: npm run seed');
    }

    console.log('\n✅ Verificación completada\n');

  } catch (error) {
    console.error('❌ Error al verificar base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarBaseDatos();
