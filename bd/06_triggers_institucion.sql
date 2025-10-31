-- ============================================
-- TRIGGERS PARA AUTO-ASIGNAR institucion_id
-- ============================================
-- Estos triggers asignan automáticamente el institucion_id
-- de la institución activa cuando se insertan registros

-- Función genérica para asignar institucion_id
CREATE OR REPLACE FUNCTION asignar_institucion_id()
RETURNS TRIGGER AS $$
DECLARE
    v_institucion_id UUID;
BEGIN
    -- Si ya tiene institucion_id, no hacer nada
    IF NEW.institucion_id IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Obtener el institucion_id de la institución activa
    SELECT id INTO v_institucion_id
    FROM ConfiguracionInstitucion
    WHERE activo = true
    LIMIT 1;
    
    -- Si no hay institución activa, tomar la primera
    IF v_institucion_id IS NULL THEN
        SELECT id INTO v_institucion_id
        FROM ConfiguracionInstitucion
        ORDER BY fechaActualizacion DESC
        LIMIT 1;
    END IF;
    
    -- Asignar el institucion_id
    NEW.institucion_id := v_institucion_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- APLICAR TRIGGERS A TODAS LAS TABLAS
-- ============================================

-- NivelEducativo
DROP TRIGGER IF EXISTS trigger_asignar_institucion_niveleducativo ON NivelEducativo;
CREATE TRIGGER trigger_asignar_institucion_niveleducativo
    BEFORE INSERT ON NivelEducativo
    FOR EACH ROW
    EXECUTE FUNCTION asignar_institucion_id();

-- Grado
DROP TRIGGER IF EXISTS trigger_asignar_institucion_grado ON Grado;
CREATE TRIGGER trigger_asignar_institucion_grado
    BEFORE INSERT ON Grado
    FOR EACH ROW
    EXECUTE FUNCTION asignar_institucion_id();

-- AnioLectivo
DROP TRIGGER IF EXISTS trigger_asignar_institucion_aniolectivo ON AnioLectivo;
CREATE TRIGGER trigger_asignar_institucion_aniolectivo
    BEFORE INSERT ON AnioLectivo
    FOR EACH ROW
    EXECUTE FUNCTION asignar_institucion_id();

-- AreaCurricular
DROP TRIGGER IF EXISTS trigger_asignar_institucion_areacurricular ON AreaCurricular;
CREATE TRIGGER trigger_asignar_institucion_areacurricular
    BEFORE INSERT ON AreaCurricular
    FOR EACH ROW
    EXECUTE FUNCTION asignar_institucion_id();

-- Seccion
DROP TRIGGER IF EXISTS trigger_asignar_institucion_seccion ON Seccion;
CREATE TRIGGER trigger_asignar_institucion_seccion
    BEFORE INSERT ON Seccion
    FOR EACH ROW
    EXECUTE FUNCTION asignar_institucion_id();

-- Periodo
DROP TRIGGER IF EXISTS trigger_asignar_institucion_periodo ON Periodo;
CREATE TRIGGER trigger_asignar_institucion_periodo
    BEFORE INSERT ON Periodo
    FOR EACH ROW
    EXECUTE FUNCTION asignar_institucion_id();

-- Estudiante
DROP TRIGGER IF EXISTS trigger_asignar_institucion_estudiante ON Estudiante;
CREATE TRIGGER trigger_asignar_institucion_estudiante
    BEFORE INSERT ON Estudiante
    FOR EACH ROW
    EXECUTE FUNCTION asignar_institucion_id();

-- TipoSolicitud
DROP TRIGGER IF EXISTS trigger_asignar_institucion_tiposolicitud ON TipoSolicitud;
CREATE TRIGGER trigger_asignar_institucion_tiposolicitud
    BEFORE INSERT ON TipoSolicitud
    FOR EACH ROW
    EXECUTE FUNCTION asignar_institucion_id();

-- CurriculoGrado
DROP TRIGGER IF EXISTS trigger_asignar_institucion_curriculogrado ON CurriculoGrado;
CREATE TRIGGER trigger_asignar_institucion_curriculogrado
    BEFORE INSERT ON CurriculoGrado
    FOR EACH ROW
    EXECUTE FUNCTION asignar_institucion_id();

-- ============================================
-- ARREGLAR DATOS EXISTENTES
-- ============================================

DO $$
DECLARE
    v_institucion_id UUID;
    v_updated INTEGER := 0;
BEGIN
    -- Obtener el institucion_id activo
    SELECT id INTO v_institucion_id 
    FROM ConfiguracionInstitucion 
    WHERE activo = true 
    LIMIT 1;
    
    IF v_institucion_id IS NULL THEN
        SELECT id INTO v_institucion_id 
        FROM ConfiguracionInstitucion 
        ORDER BY fechaActualizacion DESC
        LIMIT 1;
    END IF;
    
    IF v_institucion_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ninguna institución en ConfiguracionInstitucion';
    END IF;
    
    -- Actualizar todas las tablas con institucion_id null
    UPDATE NivelEducativo SET institucion_id = v_institucion_id WHERE institucion_id IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'NivelEducativo: % registros actualizados', v_updated;
    
    UPDATE Grado SET institucion_id = v_institucion_id WHERE institucion_id IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'Grado: % registros actualizados', v_updated;
    
    UPDATE AnioLectivo SET institucion_id = v_institucion_id WHERE institucion_id IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'AnioLectivo: % registros actualizados', v_updated;
    
    UPDATE AreaCurricular SET institucion_id = v_institucion_id WHERE institucion_id IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'AreaCurricular: % registros actualizados', v_updated;
    
    UPDATE Seccion SET institucion_id = v_institucion_id WHERE institucion_id IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'Seccion: % registros actualizados', v_updated;
    
    UPDATE Periodo SET institucion_id = v_institucion_id WHERE institucion_id IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'Periodo: % registros actualizados', v_updated;
    
    UPDATE Estudiante SET institucion_id = v_institucion_id WHERE institucion_id IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'Estudiante: % registros actualizados', v_updated;
    
    UPDATE TipoSolicitud SET institucion_id = v_institucion_id WHERE institucion_id IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'TipoSolicitud: % registros actualizados', v_updated;
    
    UPDATE CurriculoGrado SET institucion_id = v_institucion_id WHERE institucion_id IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'CurriculoGrado: % registros actualizados', v_updated;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE 'TRIGGERS Y DATOS ACTUALIZADOS CORRECTAMENTE';
    RAISE NOTICE 'institucion_id utilizado: %', v_institucion_id;
    RAISE NOTICE '================================================';
END $$;
