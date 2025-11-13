/**
 * Script para listar todos los usuarios
 * Uso: npx tsx prisma/scripts/list-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  console.log('📋 Listando usuarios del sistema...\n');
  
  const usuarios = await prisma.usuario.findMany({
    include: {
      usuariorol_usuariorol_usuario_idTousuario: {
        where: { activo: true },
        include: {
          rol: true
        }
      }
    },
    orderBy: { fechacreacion: 'desc' }
  });

  if (usuarios.length === 0) {
    console.log('⚠️  No hay usuarios en el sistema');
    return;
  }

  console.log(`Total de usuarios: ${usuarios.length}\n`);
  console.log('═'.repeat(80));

  usuarios.forEach((usuario, index) => {
    console.log(`\n${index + 1}. 👤 ${usuario.username}`);
    console.log(`   📧 Email: ${usuario.email}`);
    console.log(`   🆔 ID: ${usuario.id}`);
    console.log(`   📝 Nombres: ${usuario.nombres || 'No especificado'}`);
    console.log(`   📝 Apellidos: ${usuario.apellidos || 'No especificado'}`);
    console.log(`   🔑 DNI: ${usuario.dni || 'No especificado'}`);
    console.log(`   ${usuario.activo ? '✅' : '❌'} Activo: ${usuario.activo ? 'Sí' : 'No'}`);
    
    if (usuario.usuariorol_usuariorol_usuario_idTousuario.length > 0) {
      console.log(`   👥 Roles:`);
      usuario.usuariorol_usuariorol_usuario_idTousuario.forEach(ur => {
        console.log(`      - ${ur.rol.nombre} (${ur.rol.codigo})`);
      });
    } else {
      console.log(`   ⚠️  Sin roles asignados`);
    }
  });

  console.log('\n' + '═'.repeat(80));
  console.log('\n💡 Para ver detalles de un usuario específico:');
  console.log('   npx tsx prisma/scripts/check-user.ts <username>');
  console.log('\n💡 Para asignar un rol:');
  console.log('   npx tsx prisma/scripts/assign-role.ts <username> <rol_codigo>');
}

// Ejecutar
listUsers()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
