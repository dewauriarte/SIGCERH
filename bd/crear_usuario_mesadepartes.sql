-- ============================================
-- CREAR USUARIO MESA DE PARTES
-- ============================================

-- 1. Crear el usuario
INSERT INTO usuario (
    username,
    email,
    passwordhash,
    dni,
    nombres,
    apellidos,
    telefono,
    cargo,
    activo,
    cambiarpassword
) VALUES (
    'mesadepartes',
    'mesadepartes@sigcerh.local',
    '$2b$10$Mf8jJ0CIN1F8zb.KAsOfueuE7.Mnkb.9g.2CSx9hjA.oewCTVuic6', -- Password: mesa123
    '11111111',
    'Mesa de',
    'Partes',
    '987654321',
    'Personal de Mesa de Partes',
    true,
    true
) ON CONFLICT (username) DO NOTHING
RETURNING id;

-- 2. Obtener IDs necesarios
DO $$
DECLARE
    v_usuario_id UUID;
    v_rol_id UUID;
    v_institucion_id UUID;
BEGIN
    -- Obtener ID del usuario recién creado o existente
    SELECT id INTO v_usuario_id 
    FROM usuario 
    WHERE username = 'mesadepartes';
    
    -- Obtener ID del rol MESA_DE_PARTES
    SELECT id INTO v_rol_id 
    FROM rol 
    WHERE codigo = 'MESA_DE_PARTES' 
    LIMIT 1;
    
    -- Obtener ID de la institución (la primera)
    SELECT id INTO v_institucion_id 
    FROM configuracioninstitucion 
    LIMIT 1;
    
    -- 3. Asignar rol al usuario
    INSERT INTO usuariorol (usuario_id, rol_id, activo)
    VALUES (v_usuario_id, v_rol_id, true)
    ON CONFLICT (usuario_id, rol_id) DO NOTHING;
    
    -- 4. Asignar a la institución
    INSERT INTO institucionusuario (institucion_id, usuario_id, esadministrador, activo)
    VALUES (v_institucion_id, v_usuario_id, false, true)
    ON CONFLICT (institucion_id, usuario_id) DO NOTHING;
    
    RAISE NOTICE 'Usuario Mesa de Partes creado exitosamente';
END $$;

-- 5. Verificar la creación
SELECT 
    u.username,
    u.email,
    u.nombres,
    u.apellidos,
    r.nombre as rol,
    ci.nombre as institucion
FROM usuario u
JOIN usuariorol ur ON u.id = ur.usuario_id
JOIN rol r ON ur.rol_id = r.id
JOIN institucionusuario iu ON u.id = iu.usuario_id
JOIN configuracioninstitucion ci ON iu.institucion_id = ci.id
WHERE u.username = 'mesadepartes';
