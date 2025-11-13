-- MIGRACIÓN INCREMENTAL: Actualizar tablas libro y actafisica
-- Fecha: 2025-11-12
-- EJECUTAR CON CUIDADO - Revisar antes de aplicar

BEGIN;

-- =====================================================
-- PASO 1: Actualizar tabla LIBRO
-- =====================================================

-- Agregar nuevas columnas a libro (si no existen)
ALTER TABLE libro ADD COLUMN IF NOT EXISTS nivel_id UUID;
ALTER TABLE libro ADD COLUMN IF NOT EXISTS nombre VARCHAR(255);
ALTER TABLE libro ADD COLUMN IF NOT EXISTS tipo_acta VARCHAR(30);
ALTER TABLE libro ADD COLUMN IF NOT EXISTS folio_inicio INTEGER DEFAULT 1;
ALTER TABLE libro ADD COLUMN IF NOT EXISTS folio_fin INTEGER;
ALTER TABLE libro ADD COLUMN IF NOT EXISTS folios_utilizados INTEGER DEFAULT 0;
ALTER TABLE libro ADD COLUMN IF NOT EXISTS estante VARCHAR(50);
ALTER TABLE libro ADD COLUMN IF NOT EXISTS seccion_archivo VARCHAR(50);
ALTER TABLE libro ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE libro ADD COLUMN IF NOT EXISTS usuario_registro_id UUID;

-- Modificar columnas existentes
ALTER TABLE libro ALTER COLUMN descripcion TYPE TEXT;
ALTER TABLE libro ALTER COLUMN anio_inicio SET NOT NULL;

-- Agregar foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_libro_nivel'
    ) THEN
        ALTER TABLE libro 
        ADD CONSTRAINT fk_libro_nivel 
        FOREIGN KEY (nivel_id) 
        REFERENCES niveleducativo(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_libro_usuario'
    ) THEN
        ALTER TABLE libro 
        ADD CONSTRAINT fk_libro_usuario 
        FOREIGN KEY (usuario_registro_id) 
        REFERENCES usuario(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Agregar índices nuevos
CREATE INDEX IF NOT EXISTS idx_libro_nivel ON libro(nivel_id);
CREATE INDEX IF NOT EXISTS idx_libro_tipo ON libro(tipo_acta);
CREATE INDEX IF NOT EXISTS idx_libro_anios ON libro(anio_inicio, anio_fin);
CREATE INDEX IF NOT EXISTS idx_libro_codigo ON libro(codigo);
CREATE INDEX IF NOT EXISTS idx_libro_activo ON libro(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_libro_ubicacion ON libro(ubicacion_fisica);
CREATE INDEX IF NOT EXISTS idx_libro_inst_nivel_anio ON libro(institucion_id, nivel_id, anio_inicio DESC);

-- =====================================================
-- PASO 2: Actualizar tabla ACTAFISICA
-- =====================================================

-- IMPORTANTE: Verificar que NO haya actas sin libro_id antes de hacer NOT NULL
-- SELECT COUNT(*) FROM actafisica WHERE libro_id IS NULL;

-- Agregar nuevas columnas
ALTER TABLE actafisica ADD COLUMN IF NOT EXISTS tamanoarchivo_kb INTEGER;
ALTER TABLE actafisica ADD COLUMN IF NOT EXISTS calidad_ocr VARCHAR(20);
ALTER TABLE actafisica ADD COLUMN IF NOT EXISTS confianza_ia NUMERIC(5,2);
ALTER TABLE actafisica ADD COLUMN IF NOT EXISTS usuarioprocesamiento_id UUID;
ALTER TABLE actafisica ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Convertir folio de VARCHAR a INTEGER (solo si todos los valores son numéricos)
-- PRIMERO CREAR UNA COLUMNA TEMPORAL
ALTER TABLE actafisica ADD COLUMN IF NOT EXISTS folio_temp INTEGER;

-- Copiar valores numéricos (los no numéricos quedarán NULL)
UPDATE actafisica 
SET folio_temp = CASE 
    WHEN folio ~ '^[0-9]+$' THEN folio::INTEGER 
    ELSE NULL 
END
WHERE folio IS NOT NULL;

-- Si todo salió bien, renombrar columnas
-- ALTER TABLE actafisica DROP COLUMN folio;
-- ALTER TABLE actafisica RENAME COLUMN folio_temp TO folio;

-- NOTA: Por seguridad, NO ejecutamos el DROP automáticamente
-- Revisar primero: SELECT id, folio, folio_temp FROM actafisica WHERE folio_temp IS NULL;

-- Eliminar columna redundante
-- ALTER TABLE actafisica DROP COLUMN IF EXISTS ubicacionfisica;

-- Hacer libro_id NOT NULL (solo si todas las actas tienen libro_id)
-- ALTER TABLE actafisica ALTER COLUMN libro_id SET NOT NULL;

-- Hacer urlarchivo NOT NULL si aplica
-- ALTER TABLE actafisica ALTER COLUMN urlarchivo SET NOT NULL;

-- Agregar constraint único libro_id + folio (comentado por seguridad)
-- ALTER TABLE actafisica ADD CONSTRAINT actafisica_libro_id_folio_key UNIQUE (libro_id, folio);

-- Agregar foreign key para usuario procesamiento
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_acta_usuario_procesamiento'
    ) THEN
        ALTER TABLE actafisica 
        ADD CONSTRAINT fk_acta_usuario_procesamiento 
        FOREIGN KEY (usuarioprocesamiento_id) 
        REFERENCES usuario(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Agregar índices nuevos
CREATE INDEX IF NOT EXISTS idx_acta_libro_folio ON actafisica(libro_id, folio_temp);
CREATE INDEX IF NOT EXISTS idx_acta_tipo ON actafisica(tipo);
CREATE INDEX IF NOT EXISTS idx_acta_fechasubida ON actafisica(fechasubida DESC);
CREATE INDEX IF NOT EXISTS idx_acta_calidad ON actafisica(calidad_ocr);
CREATE INDEX IF NOT EXISTS idx_acta_pendiente_procesar ON actafisica(procesadoconia, fechasubida) WHERE procesadoconia = false;

-- =====================================================
-- PASO 3: Actualizar estados válidos
-- =====================================================

-- Agregar nuevos estados de libro si es necesario
-- UPDATE libro SET estado = 'ACTIVO' WHERE estado NOT IN ('ACTIVO', 'EN_USO', 'COMPLETO', 'ARCHIVADO', 'DETERIORADO', 'PERDIDO');

COMMIT;

-- =====================================================
-- VERIFICACIONES POST-MIGRACIÓN
-- =====================================================

-- Verificar libros actualizados
SELECT 
    COUNT(*) as total_libros,
    COUNT(nivel_id) as con_nivel,
    COUNT(nombre) as con_nombre,
    COUNT(tipo_acta) as con_tipo
FROM libro;

-- Verificar actas con folio convertido
SELECT 
    COUNT(*) as total_actas,
    COUNT(folio_temp) as folios_convertidos,
    COUNT(CASE WHEN folio IS NOT NULL AND folio_temp IS NULL THEN 1 END) as folios_no_convertidos
FROM actafisica;

-- Ver actas sin libro_id (deben ser 0 para hacer NOT NULL)
SELECT COUNT(*) as actas_sin_libro FROM actafisica WHERE libro_id IS NULL;

