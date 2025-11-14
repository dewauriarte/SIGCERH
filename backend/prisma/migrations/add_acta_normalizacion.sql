-- ================================================
-- MIGRACIÓN: Normalización de Actas Físicas
-- Fecha: 2025-11-12
-- ================================================

-- ================================================
-- 1. TABLA: ActaEstudiante (Vínculo Acta-Estudiante)
-- ================================================
CREATE TABLE ActaEstudiante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acta_id UUID NOT NULL,
    estudiante_id UUID NOT NULL,

    -- Datos del estudiante en esta acta
    numero_orden INTEGER NOT NULL,
    situacion_final VARCHAR(50),
    observaciones TEXT,

    -- Auditoría
    fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_actaest_acta FOREIGN KEY (acta_id)
        REFERENCES ActaFisica(id) ON DELETE CASCADE,
    CONSTRAINT fk_actaest_estudiante FOREIGN KEY (estudiante_id)
        REFERENCES Estudiante(id) ON DELETE CASCADE,

    CONSTRAINT uq_actaest_acta_estudiante UNIQUE(acta_id, estudiante_id),
    CONSTRAINT uq_actaest_acta_orden UNIQUE(acta_id, numero_orden),
    CONSTRAINT chk_actaest_orden_positivo CHECK (numero_orden > 0)
);

COMMENT ON TABLE ActaEstudiante IS 'Vínculo entre actas físicas y estudiantes (normalización de JSON OCR)';
COMMENT ON COLUMN ActaEstudiante.numero_orden IS 'Posición del estudiante en el acta (1, 2, 3, ...)';
COMMENT ON COLUMN ActaEstudiante.situacion_final IS 'APROBADO, DESAPROBADO, RETIRADO, TRASLADADO, etc.';

-- ================================================
-- 2. TABLA: ActaNota (Notas normalizadas)
-- ================================================
CREATE TABLE ActaNota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acta_estudiante_id UUID NOT NULL,
    area_id UUID NOT NULL,

    -- Calificación
    nota INTEGER CHECK (nota IS NULL OR (nota >= 0 AND nota <= 20)),
    nota_literal VARCHAR(50),
    es_exonerado BOOLEAN DEFAULT false,

    -- Trazabilidad OCR
    nombre_area_ocr VARCHAR(150),
    confianza_ocr NUMERIC(5,2) CHECK (confianza_ocr IS NULL OR (confianza_ocr >= 0 AND confianza_ocr <= 100)),

    -- Orden
    orden INTEGER NOT NULL,

    -- Auditoría
    fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_actanota_actaestudiante FOREIGN KEY (acta_estudiante_id)
        REFERENCES ActaEstudiante(id) ON DELETE CASCADE,
    CONSTRAINT fk_actanota_area FOREIGN KEY (area_id)
        REFERENCES AreaCurricular(id) ON DELETE RESTRICT,

    CONSTRAINT uq_actanota_actaest_area UNIQUE(acta_estudiante_id, area_id)
);

COMMENT ON TABLE ActaNota IS 'Notas individuales normalizadas extraídas de actas físicas';
COMMENT ON COLUMN ActaNota.nota IS 'Nota numérica (0-20), NULL si no aplica';
COMMENT ON COLUMN ActaNota.nota_literal IS 'Nota literal (ej: "Trece", "AD", "Destacado")';
COMMENT ON COLUMN ActaNota.nombre_area_ocr IS 'Nombre original del área extraído por OCR (trazabilidad)';
COMMENT ON COLUMN ActaNota.confianza_ocr IS 'Nivel de confianza de la IA en esta nota (0-100%)';

-- ================================================
-- 3. ACTUALIZAR ActaFisica (agregar campos de control)
-- ================================================
ALTER TABLE ActaFisica
    ADD COLUMN IF NOT EXISTS normalizada BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS fecha_normalizacion TIMESTAMPTZ;

COMMENT ON COLUMN ActaFisica.normalizada IS 'Indica si el JSON fue normalizado a ActaEstudiante/ActaNota';
COMMENT ON COLUMN ActaFisica.fecha_normalizacion IS 'Fecha en que se normalizó el acta';

-- ================================================
-- 4. ÍNDICES para rendimiento
-- ================================================

-- Índices ActaEstudiante
CREATE INDEX idx_actaest_acta ON ActaEstudiante(acta_id);
CREATE INDEX idx_actaest_estudiante ON ActaEstudiante(estudiante_id);
CREATE INDEX idx_actaest_orden ON ActaEstudiante(acta_id, numero_orden);
CREATE INDEX idx_actaest_situacion ON ActaEstudiante(situacion_final) WHERE situacion_final IS NOT NULL;

-- Índices ActaNota
CREATE INDEX idx_actanota_actaest ON ActaNota(acta_estudiante_id);
CREATE INDEX idx_actanota_area ON ActaNota(area_id);
CREATE INDEX idx_actanota_nota ON ActaNota(nota) WHERE nota IS NOT NULL;
CREATE INDEX idx_actanota_orden ON ActaNota(acta_estudiante_id, orden);

-- Índices ActaFisica (nuevos campos)
CREATE INDEX idx_actafisica_normalizada ON ActaFisica(normalizada) WHERE normalizada = false;
CREATE INDEX idx_actafisica_procesada_no_normalizada ON ActaFisica(procesadoconia, normalizada)
    WHERE procesadoconia = true AND normalizada = false;

-- ================================================
-- 5. VISTAS para consultas frecuentes
-- ================================================

-- Vista: Actas por estudiante con sus notas
CREATE OR REPLACE VIEW v_actas_estudiante AS
SELECT
    e.id AS estudiante_id,
    e.dni,
    e.nombres,
    e.apellidopaterno,
    e.apellidomaterno,
    e.nombrecompleto,

    af.id AS acta_id,
    af.numero AS acta_numero,
    af.folio,
    af.tipo AS acta_tipo,

    l.codigo AS libro_codigo,
    l.nombre AS libro_nombre,

    al.anio,
    g.numero AS grado_numero,
    g.nombre AS grado_nombre,
    n.nombre AS nivel_nombre,

    ae.numero_orden,
    ae.situacion_final,
    ae.fecha_registro,

    af.normalizada,
    af.procesadoconia
FROM ActaEstudiante ae
INNER JOIN ActaFisica af ON ae.acta_id = af.id
INNER JOIN Estudiante e ON ae.estudiante_id = e.id
INNER JOIN AnioLectivo al ON af.aniolectivo_id = al.id
INNER JOIN Grado g ON af.grado_id = g.id
LEFT JOIN NivelEducativo n ON g.nivel_id = n.id
LEFT JOIN Libro l ON af.libro_id = l.id
ORDER BY e.nombrecompleto, al.anio, g.numero;

COMMENT ON VIEW v_actas_estudiante IS 'Consolidado de actas por estudiante con información completa';

-- Vista: Notas consolidadas por estudiante
CREATE OR REPLACE VIEW v_notas_estudiante AS
SELECT
    e.id AS estudiante_id,
    e.dni,
    e.nombrecompleto,

    al.anio,
    g.numero AS grado_numero,
    g.nombre AS grado_nombre,

    ac.codigo AS area_codigo,
    ac.nombre AS area_nombre,
    ac.orden AS area_orden,

    an.nota,
    an.nota_literal,
    an.es_exonerado,

    af.numero AS acta_numero,
    af.folio,
    l.codigo AS libro_codigo,

    ae.situacion_final
FROM ActaNota an
INNER JOIN ActaEstudiante ae ON an.acta_estudiante_id = ae.id
INNER JOIN Estudiante e ON ae.estudiante_id = e.id
INNER JOIN ActaFisica af ON ae.acta_id = af.id
INNER JOIN AnioLectivo al ON af.aniolectivo_id = al.id
INNER JOIN Grado g ON af.grado_id = g.id
INNER JOIN AreaCurricular ac ON an.area_id = ac.id
LEFT JOIN Libro l ON af.libro_id = l.id
ORDER BY e.nombrecompleto, al.anio, g.numero, ac.orden;

COMMENT ON VIEW v_notas_estudiante IS 'Todas las notas de estudiantes extraídas de actas físicas';

-- ================================================
-- 6. FUNCIONES AUXILIARES
-- ================================================

-- Función: Obtener estadísticas de normalización de un acta
CREATE OR REPLACE FUNCTION estadisticas_acta_normalizada(p_acta_id UUID)
RETURNS TABLE (
    total_estudiantes INTEGER,
    total_notas INTEGER,
    notas_por_estudiante NUMERIC,
    areas_registradas INTEGER,
    fecha_normalizacion TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT ae.id)::INTEGER AS total_estudiantes,
        COUNT(an.id)::INTEGER AS total_notas,
        CASE
            WHEN COUNT(DISTINCT ae.id) > 0
            THEN ROUND(COUNT(an.id)::NUMERIC / COUNT(DISTINCT ae.id), 2)
            ELSE 0
        END AS notas_por_estudiante,
        COUNT(DISTINCT an.area_id)::INTEGER AS areas_registradas,
        af.fecha_normalizacion
    FROM ActaFisica af
    LEFT JOIN ActaEstudiante ae ON af.id = ae.acta_id
    LEFT JOIN ActaNota an ON ae.id = an.acta_estudiante_id
    WHERE af.id = p_acta_id
    GROUP BY af.fecha_normalizacion;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION estadisticas_acta_normalizada IS 'Obtiene estadísticas de una acta normalizada';

-- Función: Validar si un estudiante tiene notas en un año/grado específico
CREATE OR REPLACE FUNCTION tiene_notas_en_periodo(
    p_estudiante_id UUID,
    p_anio INTEGER,
    p_grado_numero INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1
        FROM ActaEstudiante ae
        INNER JOIN ActaFisica af ON ae.acta_id = af.id
        INNER JOIN AnioLectivo al ON af.aniolectivo_id = al.id
        INNER JOIN Grado g ON af.grado_id = g.id
        WHERE ae.estudiante_id = p_estudiante_id
          AND al.anio = p_anio
          AND g.numero = p_grado_numero
          AND EXISTS(
              SELECT 1 FROM ActaNota an
              WHERE an.acta_estudiante_id = ae.id
          )
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION tiene_notas_en_periodo IS 'Verifica si un estudiante tiene notas registradas en un año/grado';

-- ================================================
-- 7. TRIGGERS
-- ================================================

-- Trigger: Validar que el acta esté procesada antes de normalizar
CREATE OR REPLACE FUNCTION validar_acta_antes_normalizar()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.normalizada = true AND OLD.normalizada = false THEN
        -- Verificar que esté procesada con OCR
        IF NEW.procesadoconia = false THEN
            RAISE EXCEPTION 'El acta debe estar procesada con OCR antes de normalizar';
        END IF;

        -- Verificar que tenga JSON
        IF NEW.datosextraidosjson IS NULL THEN
            RAISE EXCEPTION 'El acta no tiene datos JSON para normalizar';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actafisica_validar_normalizacion
    BEFORE UPDATE ON ActaFisica
    FOR EACH ROW
    EXECUTE FUNCTION validar_acta_antes_normalizar();

COMMENT ON TRIGGER trg_actafisica_validar_normalizacion ON ActaFisica IS 'Valida que el acta esté procesada antes de marcarla como normalizada';

-- ================================================
-- FIN DE MIGRACIÓN
-- ================================================

-- Verificar tablas creadas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'actaestudiante') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'actanota') THEN
        RAISE NOTICE 'Migración completada exitosamente: ActaEstudiante y ActaNota creadas';
    ELSE
        RAISE EXCEPTION 'Error en la migración: tablas no creadas correctamente';
    END IF;
END $$;
