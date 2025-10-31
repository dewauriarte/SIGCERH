-- ============================================
-- FUNCIONES REQUERIDAS PARA LAS TABLAS
-- Debe ejecutarse ANTES de crear las tablas
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- FUNCIÓN: Obtener la única institución configurada
CREATE OR REPLACE FUNCTION obtener_institucion_default()
RETURNS UUID AS $$
DECLARE
    inst_id UUID;
BEGIN
    -- Retorna la única institución activa
    -- Si la tabla no existe aún, retorna NULL
    BEGIN
        SELECT id INTO inst_id
        FROM ConfiguracionInstitucion
        WHERE activo = true
        LIMIT 1;
    EXCEPTION
        WHEN undefined_table THEN
            RETURN NULL;
    END;
    
    -- Si no hay institución, retornar NULL (se validará después)
    RETURN inst_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Alias para compatibilidad (usa la misma función)
CREATE OR REPLACE FUNCTION obtener_institucion_sesion()
RETURNS UUID AS $$
BEGIN
    RETURN obtener_institucion_default();
END;
$$ LANGUAGE plpgsql STABLE;
