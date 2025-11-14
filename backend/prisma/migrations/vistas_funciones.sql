-- ================================================
-- VISTAS Y FUNCIONES para Normalización de Actas
-- ================================================

-- Vista: Actas por estudiante con información completa
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
FROM actaestudiante ae
INNER JOIN actafisica af ON ae.acta_id = af.id
INNER JOIN estudiante e ON ae.estudiante_id = e.id
INNER JOIN aniolectivo al ON af.aniolectivo_id = al.id
INNER JOIN grado g ON af.grado_id = g.id
LEFT JOIN niveleducativo n ON g.nivel_id = n.id
LEFT JOIN libro l ON af.libro_id = l.id
ORDER BY e.nombrecompleto, al.anio, g.numero;

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
FROM actanota an
INNER JOIN actaestudiante ae ON an.acta_estudiante_id = ae.id
INNER JOIN estudiante e ON ae.estudiante_id = e.id
INNER JOIN actafisica af ON ae.acta_id = af.id
INNER JOIN aniolectivo al ON af.aniolectivo_id = al.id
INNER JOIN grado g ON af.grado_id = g.id
INNER JOIN areacurricular ac ON an.area_id = ac.id
LEFT JOIN libro l ON af.libro_id = l.id
ORDER BY e.nombrecompleto, al.anio, g.numero, ac.orden;

-- Función: Estadísticas de acta normalizada
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
    FROM actafisica af
    LEFT JOIN actaestudiante ae ON af.id = ae.acta_id
    LEFT JOIN actanota an ON ae.id = an.acta_estudiante_id
    WHERE af.id = p_acta_id
    GROUP BY af.fecha_normalizacion;
END;
$$ LANGUAGE plpgsql;

-- Función: Validar si estudiante tiene notas en periodo
CREATE OR REPLACE FUNCTION tiene_notas_en_periodo(
    p_estudiante_id UUID,
    p_anio INTEGER,
    p_grado_numero INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1
        FROM actaestudiante ae
        INNER JOIN actafisica af ON ae.acta_id = af.id
        INNER JOIN aniolectivo al ON af.aniolectivo_id = al.id
        INNER JOIN grado g ON af.grado_id = g.id
        WHERE ae.estudiante_id = p_estudiante_id
          AND al.anio = p_anio
          AND g.numero = p_grado_numero
          AND EXISTS(
              SELECT 1 FROM actanota an
              WHERE an.acta_estudiante_id = ae.id
          )
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger: Validar acta antes de normalizar
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

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trg_actafisica_validar_normalizacion ON actafisica;
CREATE TRIGGER trg_actafisica_validar_normalizacion
    BEFORE UPDATE ON actafisica
    FOR EACH ROW
    EXECUTE FUNCTION validar_acta_antes_normalizar();
