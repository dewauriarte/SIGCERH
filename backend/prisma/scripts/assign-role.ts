/**
 * Script para asignar rol a un usuario
 * Uso: npx tsx prisma/scripts/assign-role.ts <username> <rol_codigo>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignRole(username: string, rolCodigo: string) {
  console.log(`🔍 Buscando usuario: ${username}`);
  
  // Buscar usuario
  const usuario = await prisma.usuario.findFirst({
    where: { username },
    include: {
      usuariorol_usuariorol_usuario_idTousuario: {
        include: { rol: true }
      }
    }
  });

  if (!usuario) {
    console.error(`❌ Usuario '${username}' no encontrado`);
    process.exit(1);
  }

  console.log(`✅ Usuario encontrado: ${usuario.nombres || usuario.username}`);
  console.log(`📧 Email: ${usuario.email}`);
  console.log(`👥 Roles actuales:`);
  usuario.usuariorol_usuariorol_usuario_idTousuario.forEach(ur => {
    console.log(`  - ${ur.rol.nombre} (${ur.rol.codigo})`);
  });

  // Buscar rol
  console.log(`\n🔍 Buscando rol: ${rolCodigo}`);
  const rol = await prisma.rol.findFirst({
    where: { codigo: rolCodigo },
    include: {
      rolpermiso: {
        include: { permiso: true }
      }
    }
  });

  if (!rol) {
    console.error(`❌ Rol '${rolCodigo}' no encontrado`);
    process.exit(1);
  }

  console.log(`✅ Rol encontrado: ${rol.nombre}`);
  console.log(`🔐 Permisos: ${rol.rolpermiso.length}`);

  // Verificar si ya tiene el rol
  const yaTieneRol = usuario.usuariorol_usuariorol_usuario_idTousuario.some(
    ur => ur.rol_id === rol.id
  );

  if (yaTieneRol) {
    console.log(`\n⚠️  El usuario ya tiene el rol ${rol.nombre}`);
    process.exit(0);
  }

  // Asignar rol
  console.log(`\n➕ Asignando rol ${rol.nombre} al usuario ${usuario.username}...`);
  await prisma.usuariorol.create({
    data: {
      usuario_id: usuario.id,
      rol_id: rol.id,
      activo: true,
    }
  });

  console.log(`✅ Rol asignado exitosamente`);
  console.log(`\n👤 Roles finales del usuario:`);
  
  const usuarioActualizado = await prisma.usuario.findUnique({
    where: { id: usuario.id },
    include: {
      usuariorol_usuariorol_usuario_idTousuario: {
        include: { rol: true }
      }
    }
  });

  usuarioActualizado?.usuariorol_usuariorol_usuario_idTousuario.forEach(ur => {
    console.log(`  - ${ur.rol.nombre} (${ur.rol.codigo})`);
  });

  console.log(`\n⚠️  IMPORTANTE: El usuario debe hacer logout y volver a hacer login para que los cambios tomen efecto.`);
}

// Obtener argumentos
const username = process.argv[2];
const rolCodigo = process.argv[3];

if (!username || !rolCodigo) {
  console.error('❌ Error: Faltan argumentos');
  console.log('Uso: npx tsx prisma/scripts/assign-role.ts <username> <rol_codigo>');
  console.log('\nRoles disponibles:');
  console.log('  - PUBLICO');
  console.log('  - MESA_DE_PARTES');
  console.log('  - EDITOR');
  console.log('  - ENCARGADO_UGEL');
  console.log('  - ENCARGADO_SIAGEC');
  console.log('  - DIRECCION');
  console.log('  - ADMIN');
  process.exit(1);
}

// Ejecutar
assignRole(username, rolCodigo)
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
