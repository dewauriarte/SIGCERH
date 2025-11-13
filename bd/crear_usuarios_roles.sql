-- ============================================
-- CREAR USUARIOS PARA TODOS LOS ROLES
-- ============================================

-- 1. USUARIO EDITOR
INSERT INTO usuario (username, email, passwordhash, dni, nombres, apellidos, telefono, cargo, activo, cambiarpassword)
VALUES ('editor', 'editor@sigcerh.local', '$ZMOx5Qsjk.37HgNueBAyBuuBhqhyKkpgddjC6xwvN1kBPuftZPkDe', '22222222', 'Editor', 'Actas', '987654322', 'Editor / Oficina de Actas', true, true)
ON CONFLICT (username) DO NOTHING;

-- 2. USUARIO UGEL
INSERT INTO usuario (username, email, passwordhash, dni, nombres, apellidos, telefono, cargo, activo, cambiarpassword)
VALUES ('ugel', 'ugel@sigcerh.local', '$647yVOidaFmK01NN88TkLuUuCjq3Y0bBoD/0BG9Tpzzb.E/eeHY86', '33333333', 'Encargado', 'UGEL', '987654323', 'Encargado UGEL', true, true)
ON CONFLICT (username) DO NOTHING;

-- 3. USUARIO SIAGEC
INSERT INTO usuario (username, email, passwordhash, dni, nombres, apellidos, telefono, cargo, activo, cambiarpassword)
VALUES ('siagec', 'siagec@sigcerh.local', '$nWt1h/T/fkr85pHbnm9Q/e1w4RV2KmIntiHjiZ6VSySh74uHBehaO', '44444444', 'Encargado', 'SIAGEC', '987654324', 'Encargado SIAGEC', true, true)
ON CONFLICT (username) DO NOTHING;

-- 4. USUARIO DIRECCION
INSERT INTO usuario (username, email, passwordhash, dni, nombres, apellidos, telefono, cargo, activo, cambiarpassword)
VALUES ('direccion', 'direccion@sigcerh.local', '$T.oxJeadBroQXFciJ/45Tu5j5F5CcexDMQS3D29hWSS4O70tI6Rd2', '55555555', 'Director', 'Principal', '987654325', 'Director de la Institución', true, true)
ON CONFLICT (username) DO NOTHING;

-- 5. USUARIO PUBLICO
INSERT INTO usuario (username, email, passwordhash, dni, nombres, apellidos, telefono, cargo, activo, cambiarpassword)
VALUES ('publico', 'publico@sigcerh.local', '$.1DH3SWEc0rVjng7gmULr.StcSMyw8AyaIt3CKs1RKwzKs17buBXm', '66666666', 'Usuario', 'Público', '987654326', 'Ciudadano', true, true)
ON CONFLICT (username) DO NOTHING;

-- Asignar roles
DO $$
DECLARE
    v_institucion_id UUID;
    v_editor_id UUID;
    v_ugel_id UUID;
    v_siagec_id UUID;
    v_direccion_id UUID;
    v_publico_id UUID;
    v_rol_editor_id UUID;
    v_rol_ugel_id UUID;
    v_rol_siagec_id UUID;
    v_rol_direccion_id UUID;
    v_rol_publico_id UUID;
BEGIN
    -- Obtener institución
    SELECT id INTO v_institucion_id FROM configuracioninstitucion LIMIT 1;
    
    -- Obtener IDs de usuarios
    SELECT id INTO v_editor_id FROM usuario WHERE username = 'editor';
    SELECT id INTO v_ugel_id FROM usuario WHERE username = 'ugel';
    SELECT id INTO v_siagec_id FROM usuario WHERE username = 'siagec';
    SELECT id INTO v_direccion_id FROM usuario WHERE username = 'direccion';
    SELECT id INTO v_publico_id FROM usuario WHERE username = 'publico';
    
    -- Obtener IDs de roles
    SELECT id INTO v_rol_editor_id FROM rol WHERE codigo = 'EDITOR' LIMIT 1;
    SELECT id INTO v_rol_ugel_id FROM rol WHERE codigo = 'ENCARGADO_UGEL' LIMIT 1;
    SELECT id INTO v_rol_siagec_id FROM rol WHERE codigo = 'ENCARGADO_SIAGEC' LIMIT 1;
    SELECT id INTO v_rol_direccion_id FROM rol WHERE codigo = 'DIRECCION' LIMIT 1;
    SELECT id INTO v_rol_publico_id FROM rol WHERE codigo = 'PUBLICO' LIMIT 1;
    
    -- Asignar roles
    INSERT INTO usuariorol (usuario_id, rol_id, activo) VALUES (v_editor_id, v_rol_editor_id, true) ON CONFLICT DO NOTHING;
    INSERT INTO usuariorol (usuario_id, rol_id, activo) VALUES (v_ugel_id, v_rol_ugel_id, true) ON CONFLICT DO NOTHING;
    INSERT INTO usuariorol (usuario_id, rol_id, activo) VALUES (v_siagec_id, v_rol_siagec_id, true) ON CONFLICT DO NOTHING;
    INSERT INTO usuariorol (usuario_id, rol_id, activo) VALUES (v_direccion_id, v_rol_direccion_id, true) ON CONFLICT DO NOTHING;
    INSERT INTO usuariorol (usuario_id, rol_id, activo) VALUES (v_publico_id, v_rol_publico_id, true) ON CONFLICT DO NOTHING;
    
    -- Asignar a institución
    INSERT INTO institucionusuario (institucion_id, usuario_id, esadministrador, activo) VALUES (v_institucion_id, v_editor_id, false, true) ON CONFLICT DO NOTHING;
    INSERT INTO institucionusuario (institucion_id, usuario_id, esadministrador, activo) VALUES (v_institucion_id, v_ugel_id, false, true) ON CONFLICT DO NOTHING;
    INSERT INTO institucionusuario (institucion_id, usuario_id, esadministrador, activo) VALUES (v_institucion_id, v_siagec_id, false, true) ON CONFLICT DO NOTHING;
    INSERT INTO institucionusuario (institucion_id, usuario_id, esadministrador, activo) VALUES (v_institucion_id, v_direccion_id, false, true) ON CONFLICT DO NOTHING;
    INSERT INTO institucionusuario (institucion_id, usuario_id, esadministrador, activo) VALUES (v_institucion_id, v_publico_id, false, true) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Todos los usuarios creados exitosamente';
END $$;

-- Verificar
SELECT u.username, u.email, r.nombre as rol, u.activo
FROM usuario u
JOIN usuariorol ur ON u.id = ur.usuario_id
JOIN rol r ON ur.rol_id = r.id
WHERE u.username IN ('editor', 'ugel', 'siagec', 'direccion', 'publico')
ORDER BY u.username;
