/**
 * Seed para roles y permisos del sistema
 * Sistema simplificado con 4 roles
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 4 Roles del sistema (simplificado)
 */
const ROLES = [
  {
    codigo: 'PUBLICO',
    nombre: 'Público',
    descripcion: 'Usuario público que puede solicitar certificados',
    nivel: 1,
  },
  {
    codigo: 'MESA_DE_PARTES',
    nombre: 'Mesa de Partes',
    descripcion: 'Personal de mesa de partes que registra solicitudes',
    nivel: 2,
  },
  {
    codigo: 'EDITOR',
    nombre: 'Editor',
    descripcion: 'Personal que edita y genera certificados (ahora incluye todas las funciones)',
    nivel: 3,
  },
  {
    codigo: 'ADMIN',
    nombre: 'Administrador',
    descripcion: 'Administrador del sistema con todos los permisos',
    nivel: 10,
  },
];

/**
 * Permisos del sistema organizados por módulo
 */
const PERMISOS = [
  // MÓDULO: AUTENTICACIÓN
  { codigo: 'AUTH_LOGIN', nombre: 'Iniciar sesión', modulo: 'AUTH' },
  { codigo: 'AUTH_REGISTER', nombre: 'Registrarse', modulo: 'AUTH' },
  { codigo: 'AUTH_LOGOUT', nombre: 'Cerrar sesión', modulo: 'AUTH' },
  { codigo: 'AUTH_REFRESH', nombre: 'Renovar token', modulo: 'AUTH' },

  // MÓDULO: USUARIOS
  { codigo: 'USUARIOS_VER', nombre: 'Ver usuarios', modulo: 'USUARIOS' },
  { codigo: 'USUARIOS_CREAR', nombre: 'Crear usuarios', modulo: 'USUARIOS' },
  { codigo: 'USUARIOS_EDITAR', nombre: 'Editar usuarios', modulo: 'USUARIOS' },
  { codigo: 'USUARIOS_ELIMINAR', nombre: 'Eliminar usuarios', modulo: 'USUARIOS' },
  { codigo: 'USUARIOS_ASIGNAR_ROLES', nombre: 'Asignar roles', modulo: 'USUARIOS' },

  // MÓDULO: ROLES Y PERMISOS
  { codigo: 'ROLES_VER', nombre: 'Ver roles', modulo: 'ROLES' },
  { codigo: 'ROLES_CREAR', nombre: 'Crear roles', modulo: 'ROLES' },
  { codigo: 'ROLES_EDITAR', nombre: 'Editar roles', modulo: 'ROLES' },
  { codigo: 'ROLES_ELIMINAR', nombre: 'Eliminar roles', modulo: 'ROLES' },
  { codigo: 'PERMISOS_VER', nombre: 'Ver permisos', modulo: 'ROLES' },

  // MÓDULO: SOLICITUDES
  { codigo: 'SOLICITUDES_VER', nombre: 'Ver solicitudes', modulo: 'SOLICITUDES' },
  { codigo: 'SOLICITUDES_CREAR', nombre: 'Crear solicitudes', modulo: 'SOLICITUDES' },
  { codigo: 'SOLICITUDES_EDITAR', nombre: 'Editar solicitudes', modulo: 'SOLICITUDES' },
  { codigo: 'SOLICITUDES_ELIMINAR', nombre: 'Eliminar solicitudes', modulo: 'SOLICITUDES' },
  { codigo: 'SOLICITUDES_DERIVAR', nombre: 'Derivar solicitudes', modulo: 'SOLICITUDES' },
  { codigo: 'SOLICITUDES_BUSCAR', nombre: 'Buscar actas físicas', modulo: 'SOLICITUDES' },
  { codigo: 'SOLICITUDES_GESTIONAR', nombre: 'Gestionar solicitudes', modulo: 'SOLICITUDES' },
  { codigo: 'SOLICITUDES_VALIDAR_PAGO', nombre: 'Validar pagos de solicitudes', modulo: 'SOLICITUDES' },
  { codigo: 'SOLICITUDES_PROCESAR', nombre: 'Procesar solicitudes', modulo: 'SOLICITUDES' },
  { codigo: 'SOLICITUDES_VALIDAR', nombre: 'Validar solicitudes (UGEL)', modulo: 'SOLICITUDES' },
  { codigo: 'SOLICITUDES_REGISTRAR', nombre: 'Registrar en SIAGEC', modulo: 'SOLICITUDES' },
  { codigo: 'SOLICITUDES_FIRMAR', nombre: 'Firmar certificados', modulo: 'SOLICITUDES' },
  { codigo: 'SOLICITUDES_ENTREGAR', nombre: 'Marcar como entregado', modulo: 'SOLICITUDES' },

  // MÓDULO: CERTIFICADOS
  { codigo: 'CERTIFICADOS_VER', nombre: 'Ver certificados', modulo: 'CERTIFICADOS' },
  { codigo: 'CERTIFICADOS_CREAR', nombre: 'Crear certificados', modulo: 'CERTIFICADOS' },
  { codigo: 'CERTIFICADOS_EDITAR', nombre: 'Editar certificados', modulo: 'CERTIFICADOS' },
  { codigo: 'CERTIFICADOS_ELIMINAR', nombre: 'Eliminar certificados', modulo: 'CERTIFICADOS' },
  { codigo: 'CERTIFICADOS_FIRMAR', nombre: 'Firmar certificados', modulo: 'CERTIFICADOS' },
  { codigo: 'CERTIFICADOS_ANULAR', nombre: 'Anular certificados', modulo: 'CERTIFICADOS' },
  { codigo: 'CERTIFICADOS_EXPORTAR', nombre: 'Exportar certificados', modulo: 'CERTIFICADOS' },

  // MÓDULO: ESTUDIANTES
  { codigo: 'ESTUDIANTES_VER', nombre: 'Ver estudiantes', modulo: 'ESTUDIANTES' },
  { codigo: 'ESTUDIANTES_CREAR', nombre: 'Crear estudiantes', modulo: 'ESTUDIANTES' },
  { codigo: 'ESTUDIANTES_EDITAR', nombre: 'Editar estudiantes', modulo: 'ESTUDIANTES' },
  { codigo: 'ESTUDIANTES_ELIMINAR', nombre: 'Eliminar estudiantes', modulo: 'ESTUDIANTES' },

  // MÓDULO: GRADOS
  { codigo: 'GRADOS_VER', nombre: 'Ver grados', modulo: 'GRADOS' },
  { codigo: 'GRADOS_CREAR', nombre: 'Crear grados', modulo: 'GRADOS' },
  { codigo: 'GRADOS_EDITAR', nombre: 'Editar grados', modulo: 'GRADOS' },
  { codigo: 'GRADOS_ELIMINAR', nombre: 'Eliminar grados', modulo: 'GRADOS' },

  // MÓDULO: AÑOS LECTIVOS
  { codigo: 'ANIOS_VER', nombre: 'Ver años lectivos', modulo: 'ANIOS' },
  { codigo: 'ANIOS_CREAR', nombre: 'Crear años lectivos', modulo: 'ANIOS' },
  { codigo: 'ANIOS_EDITAR', nombre: 'Editar años lectivos', modulo: 'ANIOS' },
  { codigo: 'ANIOS_ELIMINAR', nombre: 'Eliminar años lectivos', modulo: 'ANIOS' },

  // MÓDULO: ÁREAS CURRICULARES
  { codigo: 'AREAS_VER', nombre: 'Ver áreas curriculares', modulo: 'AREAS' },
  { codigo: 'AREAS_CREAR', nombre: 'Crear áreas', modulo: 'AREAS' },
  { codigo: 'AREAS_EDITAR', nombre: 'Editar áreas', modulo: 'AREAS' },
  { codigo: 'AREAS_ELIMINAR', nombre: 'Eliminar áreas', modulo: 'AREAS' },

  // MÓDULO: NIVELES EDUCATIVOS
  { codigo: 'NIVELES_VER', nombre: 'Ver niveles educativos', modulo: 'NIVELES' },
  { codigo: 'NIVELES_CREAR', nombre: 'Crear niveles', modulo: 'NIVELES' },
  { codigo: 'NIVELES_EDITAR', nombre: 'Editar niveles', modulo: 'NIVELES' },
  { codigo: 'NIVELES_ELIMINAR', nombre: 'Eliminar niveles', modulo: 'NIVELES' },

  // MÓDULO: ACTAS FÍSICAS
  { codigo: 'ACTAS_VER', nombre: 'Ver actas físicas', modulo: 'ACTAS' },
  { codigo: 'ACTAS_SUBIR', nombre: 'Subir actas físicas', modulo: 'ACTAS' },
  { codigo: 'ACTAS_EDITAR', nombre: 'Editar actas físicas', modulo: 'ACTAS' },
  { codigo: 'ACTAS_ELIMINAR', nombre: 'Eliminar actas físicas', modulo: 'ACTAS' },
  { codigo: 'ACTAS_PROCESAR_OCR', nombre: 'Procesar OCR', modulo: 'ACTAS' },
  { codigo: 'ACTAS_EXPORTAR', nombre: 'Exportar actas', modulo: 'ACTAS' },

  // MÓDULO: PAGOS
  { codigo: 'PAGOS_VER', nombre: 'Ver pagos', modulo: 'PAGOS' },
  { codigo: 'PAGOS_CREAR', nombre: 'Crear orden de pago', modulo: 'PAGOS' },
  { codigo: 'PAGOS_REGISTRAR', nombre: 'Registrar pagos', modulo: 'PAGOS' },
  { codigo: 'PAGOS_VALIDAR', nombre: 'Validar pagos', modulo: 'PAGOS' },
  { codigo: 'PAGOS_EDITAR', nombre: 'Editar configuración de pagos', modulo: 'PAGOS' },
  { codigo: 'PAGOS_CONCILIAR', nombre: 'Conciliar pagos', modulo: 'PAGOS' },

  // MÓDULO: CONFIGURACIÓN
  { codigo: 'CONFIG_VER', nombre: 'Ver configuración', modulo: 'CONFIGURACION' },
  { codigo: 'CONFIG_EDITAR', nombre: 'Editar configuración', modulo: 'CONFIGURACION' },
  { codigo: 'CONFIG_PARAMETROS', nombre: 'Gestionar parámetros', modulo: 'CONFIGURACION' },

  // MÓDULO: AUDITORÍA
  { codigo: 'AUDITORIA_VER', nombre: 'Ver auditoría', modulo: 'AUDITORIA' },
  { codigo: 'AUDITORIA_EXPORTAR', nombre: 'Exportar auditoría', modulo: 'AUDITORIA' },

  // MÓDULO: NOTIFICACIONES
  { codigo: 'NOTIFICACIONES_VER', nombre: 'Ver notificaciones', modulo: 'NOTIFICACIONES' },
  { codigo: 'NOTIFICACIONES_ENVIAR', nombre: 'Enviar notificaciones', modulo: 'NOTIFICACIONES' },
];

/**
 * Asignación de permisos por rol
 */
const ASIGNACION_PERMISOS: Record<string, string[]> = {
  PUBLICO: [
    'AUTH_LOGIN',
    'AUTH_REGISTER',
    'AUTH_LOGOUT',
    'AUTH_REFRESH',
    'SOLICITUDES_VER',
    'SOLICITUDES_CREAR',
    'CERTIFICADOS_VER',
    'NOTIFICACIONES_VER',
  ],
  MESA_DE_PARTES: [
    'AUTH_LOGIN',
    'AUTH_LOGOUT',
    'AUTH_REFRESH',
    'SOLICITUDES_VER',
    'SOLICITUDES_CREAR',
    'SOLICITUDES_EDITAR',
    'SOLICITUDES_DERIVAR',
    'SOLICITUDES_VALIDAR_PAGO',
    'SOLICITUDES_ENTREGAR',
    'ESTUDIANTES_VER',
    'ESTUDIANTES_CREAR',
    'ESTUDIANTES_EDITAR',
    'PAGOS_VER',
    'PAGOS_CREAR',
    'PAGOS_REGISTRAR',
    'PAGOS_VALIDAR',
    'CERTIFICADOS_VER',
    'NOTIFICACIONES_VER',
    'USUARIOS_VER', // Para ver lista de editores al derivar
  ],
  EDITOR: [
    'AUTH_LOGIN',
    'AUTH_LOGOUT',
    'AUTH_REFRESH',
    'SOLICITUDES_VER',
    'SOLICITUDES_EDITAR',
    'SOLICITUDES_BUSCAR',
    'SOLICITUDES_GESTIONAR',
    'SOLICITUDES_PROCESAR',
    'SOLICITUDES_VALIDAR',
    'SOLICITUDES_REGISTRAR',
    'SOLICITUDES_FIRMAR',
    'CERTIFICADOS_VER',
    'CERTIFICADOS_CREAR',
    'CERTIFICADOS_EDITAR',
    'CERTIFICADOS_FIRMAR',
    'CERTIFICADOS_ANULAR',
    'CERTIFICADOS_EXPORTAR',
    'ESTUDIANTES_VER',
    'ESTUDIANTES_CREAR',
    'ESTUDIANTES_EDITAR',
    'GRADOS_VER',
    'GRADOS_CREAR',
    'GRADOS_EDITAR',
    'ANIOS_VER',
    'ANIOS_CREAR',
    'ANIOS_EDITAR',
    'AREAS_VER',
    'AREAS_CREAR',
    'AREAS_EDITAR',
    'NIVELES_VER',
    'NIVELES_CREAR',
    'NIVELES_EDITAR',
    'ACTAS_VER',
    'ACTAS_SUBIR',
    'ACTAS_EDITAR',
    'ACTAS_PROCESAR_OCR',
    'ACTAS_EXPORTAR',
    'PAGOS_VER',
    'CONFIG_VER',
    'AUDITORIA_VER',
    'NOTIFICACIONES_VER',
    'NOTIFICACIONES_ENVIAR',
  ],
  ADMIN: PERMISOS.map(p => p.codigo), // ADMIN tiene todos los permisos
};

async function seed() {
  console.log('🌱 Iniciando seed de roles y permisos...');

  try {
    // Buscar institución activa
    const institucion = await prisma.configuracioninstitucion.findFirst({
      where: { activo: true },
    });

    if (!institucion) {
      console.error('❌ No se encontró institución activa. Creando roles globales sin institución...');
    } else {
      console.log(`📍 Institución activa: ${institucion.nombre}\n`);
    }

    const institucionId = institucion?.id || null;

    // 1. Crear permisos
    console.log('📋 Creando permisos...');
    const permisosCreados: Record<string, string> = {};

    for (const permiso of PERMISOS) {
      const permisoCreado = await prisma.permiso.upsert({
        where: { codigo: permiso.codigo },
        update: { nombre: permiso.nombre, modulo: permiso.modulo },
        create: permiso,
      });
      permisosCreados[permiso.codigo] = permisoCreado.id;
      console.log(`  ✓ ${permiso.codigo}`);
    }

    console.log(`✅ ${PERMISOS.length} permisos creados/actualizados`);

    // 2. Crear roles
    console.log('\n👥 Creando roles...');
    const rolesCreados: Record<string, string> = {};

    for (const rol of ROLES) {
      // Buscar si ya existe el rol
      const rolExistente = await prisma.rol.findFirst({
        where: {
          codigo: rol.codigo,
          institucion_id: institucionId,
        },
      });

      let rolCreado;
      if (rolExistente) {
        // Actualizar
        rolCreado = await prisma.rol.update({
          where: { id: rolExistente.id },
          data: {
            nombre: rol.nombre,
            descripcion: rol.descripcion,
            nivel: rol.nivel,
          },
        });
      } else {
        // Crear
        rolCreado = await prisma.rol.create({
          data: {
            ...rol,
            institucion_id: institucionId,
          },
        });
      }

      rolesCreados[rol.codigo] = rolCreado.id;
      console.log(`  ✓ ${rol.codigo} (Nivel ${rol.nivel})`);
    }

    console.log(`✅ ${ROLES.length} roles creados/actualizados`);

    // 3. Asignar permisos a roles
    console.log('\n🔗 Asignando permisos a roles...');

    for (const [rolCodigo, permisosCodigos] of Object.entries(ASIGNACION_PERMISOS)) {
      const rolId = rolesCreados[rolCodigo];

      // Eliminar asignaciones anteriores
      await prisma.rolpermiso.deleteMany({
        where: { rol_id: rolId },
      });

      // Crear nuevas asignaciones
      for (const permisoCodigo of permisosCodigos) {
        const permisoId = permisosCreados[permisoCodigo];
        if (!permisoId) {
          console.warn(`  ⚠️  Permiso no encontrado: ${permisoCodigo}`);
          continue;
        }

        await prisma.rolpermiso.create({
          data: {
            rol_id: rolId,
            permiso_id: permisoId,
          },
        });
      }

      console.log(`  ✓ ${rolCodigo}: ${permisosCodigos.length} permisos`);
    }

    console.log('\n✅ Seed de roles y permisos completado exitosamente');

    // Mostrar resumen
    console.log('\n📊 RESUMEN:');
    console.log(`  - Permisos: ${PERMISOS.length}`);
    console.log(`  - Roles: ${ROLES.length}`);
    console.log('  - Roles creados:');
    for (const rol of ROLES) {
      const cantidadPermisos = ASIGNACION_PERMISOS[rol.codigo].length;
      console.log(`    • ${rol.nombre} (${rol.codigo}): ${cantidadPermisos} permisos`);
    }

  } catch (error) {
    console.error('❌ Error en seed de roles y permisos:', error);
    throw error;
  }
}

// Exportar función para uso en seed principal
export async function seedRolesYPermisos() {
  return seed();
}

// Ejecutar seed si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
