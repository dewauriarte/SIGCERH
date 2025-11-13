-- =====================================================
-- Migración 009: Agregar permiso ACTAS_ELIMINAR al rol EDITOR
-- Fecha: 2025-11-12
-- Descripción: Permite al rol EDITOR eliminar actas físicas
-- =====================================================

DO $$
DECLARE
    v_permiso_id UUID;
    v_rol_id UUID;
BEGIN
    -- Obtener ID del permiso ACTAS_ELIMINAR
    SELECT id INTO v_permiso_id FROM permiso WHERE codigo = 'ACTAS_ELIMINAR' LIMIT 1;
    
    -- Obtener ID del rol EDITOR
    SELECT id INTO v_rol_id FROM rol WHERE codigo = 'EDITOR' LIMIT 1;
    
    -- Verificar que ambos existan
    IF v_permiso_id IS NULL THEN
        RAISE NOTICE 'Permiso ACTAS_ELIMINAR no encontrado';
    ELSIF v_rol_id IS NULL THEN
        RAISE NOTICE 'Rol EDITOR no encontrado';
    ELSE
        -- Agregar el permiso al rol si no existe
        INSERT INTO rolpermiso (rol_id, permiso_id)
        VALUES (v_rol_id, v_permiso_id)
        ON CONFLICT (rol_id, permiso_id) DO NOTHING;
        
        RAISE NOTICE 'Permiso ACTAS_ELIMINAR agregado al rol EDITOR';
    END IF;
END $$;
