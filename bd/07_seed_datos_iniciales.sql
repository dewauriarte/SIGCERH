-- ============================================
-- SEED INICIAL - DATOS BÁSICOS DEL SISTEMA
-- Script corregido con nombres exactos de columnas
-- ============================================

\echo '================================================'
\echo 'INSERTANDO DATOS INICIALES'
\echo '================================================'

-- 1. Configuración Institucional
\echo 'Creando institución...'
INSERT INTO configuracioninstitucion (
    id, codigomodular, nombre, ugel, distrito, departamento, direccion, telefono, email, 
    nombredirector, cargodirector, textolegal, activo
) VALUES (
    uuid_generate_v4(), 
    '0000000',
    'Institución Educativa Ejemplo',
    'UGEL PUNO',
    'Puno',
    'Puno',
    'Av. Educación #123',
    '(051) 123456',
    'contacto@ie-ejemplo.edu.pe',
    'Director(a) del Sistema',
    'Director',
    'El presente certificado es válido siempre que pueda ser verificado en nuestro sistema digital.',
    true
);

\echo '✓ Institución creada'

-- 2. Niveles Educativos
\echo 'Creando niveles educativos...'
INSERT INTO niveleducativo (codigo, nombre, descripcion, orden, activo) VALUES
('INICIAL', 'Educación Inicial', 'Nivel educativo para niños de 3 a 5 años', 1, true),
('PRIMARIA', 'Educación Primaria', 'Nivel educativo de 1° a 6° grado', 2, true),
('SECUNDARIA', 'Educación Secundaria', 'Nivel educativo de 1° a 5° año', 3, true);

\echo '✓ Niveles educativos creados'

-- 3. Roles del Sistema (4 roles - simplificado)
\echo 'Creando roles del sistema...'
INSERT INTO rol (codigo, nombre, descripcion, nivel, activo) VALUES
('ADMIN', 'Administrador', 'Control total del sistema', 100, true),
('EDITOR', 'Editor', 'Procesa OCR, busca actas y emite certificados', 60, true),
('MESA_DE_PARTES', 'Mesa de Partes', 'Recibe y valida solicitudes', 50, true),
('PUBLICO', 'Público', 'Usuario que solicita certificados', 10, true);

\echo '✓ Roles creados'

-- 4. Permisos Básicos
\echo 'Creando permisos...'
INSERT INTO permiso (codigo, nombre, modulo, activo) VALUES
('SOL_CREAR', 'Crear Solicitud', 'solicitudes', true),
('SOL_VER', 'Ver Solicitudes', 'solicitudes', true),
('SOL_EDITAR', 'Editar Solicitud', 'solicitudes', true),
('CERT_VER', 'Ver Certificados', 'certificados', true),
('CERT_GENERAR', 'Generar Certificado', 'certificados', true),
('CERT_FIRMAR', 'Firmar Certificado', 'certificados', true),
('PAGO_VER', 'Ver Pagos', 'pagos', true),
('PAGO_VALIDAR', 'Validar Pago', 'pagos', true),
('USER_VER', 'Ver Usuarios', 'usuarios', true),
('USER_CREAR', 'Crear Usuario', 'usuarios', true),
('CONFIG_VER', 'Ver Configuración', 'configuracion', true),
('CONFIG_EDITAR', 'Editar Configuración', 'configuracion', true);

\echo '✓ Permisos creados'

-- 5. Asignar Permisos a Roles
\echo 'Asignando permisos a roles...'

-- ADMIN: Todos los permisos
INSERT INTO rolpermiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r CROSS JOIN permiso p WHERE r.codigo = 'ADMIN';

-- MESA_DE_PARTES
INSERT INTO rolpermiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r CROSS JOIN permiso p
WHERE r.codigo = 'MESA_DE_PARTES' AND p.codigo IN ('SOL_VER', 'SOL_EDITAR', 'PAGO_VER', 'PAGO_VALIDAR');

-- EDITOR (ahora con permisos extendidos)
INSERT INTO rolpermiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r CROSS JOIN permiso p
WHERE r.codigo = 'EDITOR' AND p.codigo IN ('SOL_VER', 'SOL_EDITAR', 'CERT_VER', 'CERT_GENERAR', 'CERT_FIRMAR', 'CONFIG_VER');

-- PUBLICO
INSERT INTO rolpermiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r CROSS JOIN permiso p
WHERE r.codigo = 'PUBLICO' AND p.codigo IN ('SOL_CREAR', 'SOL_VER');

\echo '✓ Permisos asignados'

-- 6. Tipos de Solicitud
\echo 'Creando tipos de solicitud...'
INSERT INTO tiposolicitud (codigo, nombre, descripcion, montobase, tiempoentregadias, activo) VALUES
('CERT_ESTUDIOS', 'Certificado de Estudios', 'Certificado oficial de estudios completos', 50.00, 7, true),
('CERT_DUP', 'Duplicado de Certificado', 'Duplicado por pérdida o deterioro', 60.00, 5, true),
('CONST_ESTUDIOS', 'Constancia de Estudios', 'Constancia simple de estudios', 30.00, 3, true);

\echo '✓ Tipos de solicitud creados'

-- 7. Métodos de Pago
\echo 'Creando métodos de pago...'

-- Obtener institucion_id
DO $$
DECLARE
    v_institucion_id UUID;
BEGIN
    SELECT id INTO v_institucion_id FROM configuracioninstitucion LIMIT 1;
    
    INSERT INTO metodopago (institucion_id, codigo, nombre, tipo, requierevalidacion, activo) VALUES
    (v_institucion_id, 'EFECTIVO', 'Efectivo', 'MANUAL', true, true),
    (v_institucion_id, 'YAPE', 'Yape', 'MANUAL', true, true),
    (v_institucion_id, 'PLIN', 'Plin', 'MANUAL', true, true),
    (v_institucion_id, 'TRANSFERENCIA', 'Transferencia Bancaria', 'MANUAL', true, true);
END $$;

\echo '✓ Métodos de pago creados'

-- 8. Usuario Administrador
\echo 'Creando usuario administrador...'
-- Contraseña: admin123 (hash bcrypt)
INSERT INTO usuario (username, email, passwordhash, dni, nombres, apellidos, cargo, activo, cambiarpassword)
VALUES ('admin', 'admin@sigcerh.local', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWu', '00000000', 'Administrador', 'del Sistema', 'Administrador General', true, true);

-- Asignar rol ADMIN
INSERT INTO usuariorol (usuario_id, rol_id, fechaasignacion)
SELECT u.id, r.id, CURRENT_TIMESTAMP FROM usuario u CROSS JOIN rol r
WHERE u.username = 'admin' AND r.codigo = 'ADMIN';

-- Asignar institución al administrador
INSERT INTO institucionusuario (usuario_id, institucion_id, esadministrador, fechaasignacion)
SELECT u.id, i.id, true, CURRENT_TIMESTAMP 
FROM usuario u CROSS JOIN configuracioninstitucion i
WHERE u.username = 'admin';

\echo '✓ Usuario administrador creado'

-- 9. Parámetros del Sistema
\echo 'Creando parámetros del sistema...'
INSERT INTO parametro (codigo, nombre, valor, tipo, descripcion, modificable) VALUES
('PAGOS_ACTIVOS', 'Sistema de pagos activo', 'true', 'BOOLEAN', 'Activa o desactiva el sistema de pagos', true),
('PAGO_CONDICIONAL', 'Pago solo si encuentra acta', 'true', 'BOOLEAN', 'Solo cobrar si se encuentra el acta física', true),
('NOTIF_EMAIL', 'Notificaciones por email', 'true', 'BOOLEAN', 'Enviar notificaciones por correo electrónico', true),
('OCR_MODO', 'Modo OCR', 'DUAL', 'STRING', 'Modo de procesamiento OCR: GEMINI, TESSERACT o DUAL', true),
('TIEMPO_POLLING', 'Polling frontend (ms)', '30000', 'NUMBER', 'Tiempo de actualización automática en el frontend', true);

\echo '✓ Parámetros creados'

-- Verificación Final
\echo '================================================'
\echo 'VERIFICACIÓN DE DATOS INSERTADOS'
\echo '================================================'
SELECT 'Instituciones' as tabla, COUNT(*)::text as total FROM configuracioninstitucion
UNION ALL SELECT 'Niveles Educativos', COUNT(*)::text FROM niveleducativo
UNION ALL SELECT 'Roles', COUNT(*)::text FROM rol
UNION ALL SELECT 'Permisos', COUNT(*)::text FROM permiso
UNION ALL SELECT 'RolPermiso', COUNT(*)::text FROM rolpermiso
UNION ALL SELECT 'Usuarios', COUNT(*)::text FROM usuario
UNION ALL SELECT 'UsuarioRol', COUNT(*)::text FROM usuariorol
UNION ALL SELECT 'InstitucionUsuario', COUNT(*)::text FROM institucionusuario
UNION ALL SELECT 'Tipos Solicitud', COUNT(*)::text FROM tiposolicitud
UNION ALL SELECT 'Métodos Pago', COUNT(*)::text FROM metodopago
UNION ALL SELECT 'Parámetros', COUNT(*)::text FROM parametro;

\echo '================================================'
\echo 'BASE DE DATOS LISTA PARA USAR ✓'
\echo '================================================'
\echo ''
\echo 'CREDENCIALES DE ACCESO:'
\echo '  Usuario: admin'
\echo '  Email: admin@sigcerh.local'
\echo '  Contraseña: admin123'
\echo ''
\echo '⚠️  IMPORTANTE: Cambiar contraseña en producción'
\echo ''
\echo 'Próximos pasos:'
\echo '  1. Configurar Backend (Node.js + Prisma)'
\echo '  2. Ejecutar: npx prisma db pull'
\echo '  3. Ejecutar: npx prisma generate'
\echo '================================================'

