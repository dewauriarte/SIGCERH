--
-- DATOS DE EJEMPLO PARA SISTEMA DE LIBROS Y ACTAS
-- Ejecutar después de crear la estructura de la base de datos
--

-- =====================================================
-- PASO 1: Insertar Niveles Educativos
-- =====================================================

INSERT INTO niveleducativo (codigo, nombre, descripcion, orden) VALUES
('INICIAL', 'Educación Inicial', 'Nivel de educación inicial (3-5 años)', 1),
('PRIMARIA', 'Educación Primaria', 'Nivel de educación primaria (1ro-6to)', 2),
('SECUNDARIA', 'Educación Secundaria', 'Nivel de educación secundaria (1ro-5to)', 3);

-- =====================================================
-- PASO 2: Insertar Libros de Actas
-- =====================================================

-- Libro de Primaria 2008-2010
INSERT INTO libro (
    codigo, nombre, descripcion,
    nivel_id, tipo_acta,
    anio_inicio, anio_fin,
    folio_inicio, folio_fin, total_folios,
    ubicacion_fisica, estante, seccion_archivo,
    estado
) VALUES (
    'PRIM-2008-A',
    'Libro de Actas de Primaria 2008-2010 - Tomo A',
    'Actas de evaluación final de primaria del periodo 2008-2010',
    (SELECT id FROM niveleducativo WHERE codigo = 'PRIMARIA'),
    'EVALUACION',
    2008, 2010,
    1, 300, 300,
    'Archivo Central',
    'E-05',
    'HISTORICOS',
    'COMPLETO'
);

-- Libro de Primaria 2010-2012
INSERT INTO libro (
    codigo, nombre, descripcion,
    nivel_id, tipo_acta,
    anio_inicio, anio_fin,
    folio_inicio, folio_fin, total_folios,
    ubicacion_fisica, estante, seccion_archivo,
    estado
) VALUES (
    'PRIM-2010-B',
    'Libro de Actas de Primaria 2010-2012 - Tomo B',
    'Continuación del registro de actas de primaria',
    (SELECT id FROM niveleducativo WHERE codigo = 'PRIMARIA'),
    'EVALUACION',
    2010, 2012,
    301, 600, 300,
    'Archivo Central',
    'E-05',
    'HISTORICOS',
    'ACTIVO'
);

-- Libro de Secundaria 2008-2010
INSERT INTO libro (
    codigo, nombre, descripcion,
    nivel_id, tipo_acta,
    anio_inicio, anio_fin,
    folio_inicio, folio_fin, total_folios,
    ubicacion_fisica, estante, seccion_archivo,
    estado
) VALUES (
    'SEC-2008-A',
    'Libro de Actas de Secundaria 2008-2010 - Tomo A',
    'Registro de actas de evaluación de secundaria',
    (SELECT id FROM niveleducativo WHERE codigo = 'SECUNDARIA'),
    'EVALUACION',
    2008, 2010,
    1, 400, 400,
    'Archivo Central',
    'E-06',
    'HISTORICOS',
    'COMPLETO'
);

-- Libro de Recuperación Primaria
INSERT INTO libro (
    codigo, nombre, descripcion,
    nivel_id, tipo_acta,
    anio_inicio, anio_fin,
    folio_inicio, folio_fin, total_folios,
    ubicacion_fisica, estante, seccion_archivo,
    estado
) VALUES (
    'PRIM-RECUP-2010',
    'Libro de Actas de Recuperación Primaria 2010-2012',
    'Actas de recuperación y subsanación de primaria',
    (SELECT id FROM niveleducativo WHERE codigo = 'PRIMARIA'),
    'RECUPERACION',
    2010, 2012,
    1, 100, 100,
    'Oficina de Coordinación Académica',
    'D-02',
    'ACTIVOS',
    'ACTIVO'
);

-- Libro de Secundaria Actual
INSERT INTO libro (
    codigo, nombre, descripcion,
    nivel_id, tipo_acta,
    anio_inicio, anio_fin,
    folio_inicio, folio_fin, total_folios,
    ubicacion_fisica, estante, seccion_archivo,
    estado
) VALUES (
    'SEC-2023-A',
    'Libro de Actas de Secundaria 2023-2025 - Tomo A',
    'Registro actual de actas de secundaria',
    (SELECT id FROM niveleducativo WHERE codigo = 'SECUNDARIA'),
    'EVALUACION',
    2023, NULL,
    1, 500, 500,
    'Dirección',
    'D-01',
    'ACTIVOS',
    'EN_USO'
);

-- =====================================================
-- PASO 3: Ejemplos de Actas Físicas
-- =====================================================

-- Nota: Aquí insertarías las actas reales después de escanearlas
-- Este es un ejemplo de cómo se vería:

/*
INSERT INTO actafisica (
    libro_id,
    numero,
    folio,
    tipo,
    aniolectivo_id,
    grado_id,
    seccion,
    turno,
    tipoevaluacion,
    fechaemision,
    nombrearchivo,
    urlarchivo,
    hasharchivo,
    tamanoarchivo_kb,
    procesadoconia,
    calidad_ocr,
    confianza_ia,
    estado
) VALUES (
    (SELECT id FROM libro WHERE codigo = 'PRIM-2010-B'),
    'A-2010-1A-001',
    305,  -- Folio 305
    'EVALUACION',
    (SELECT id FROM aniolectivo WHERE anio = 2010),
    (SELECT id FROM grado WHERE numero = 1 AND nivel_id = (SELECT id FROM niveleducativo WHERE codigo = 'PRIMARIA')),
    'A',
    'MAÑANA',
    'FINAL',
    '2010-12-20',
    'acta_2010_1A_folio_305.pdf',
    'https://storage.ejemplo.com/actas/2010/acta_2010_1A_folio_305.pdf',
    '8f9a3d2b1c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    2456,
    true,
    'EXCELENTE',
    95.5,
    'PROCESADA'
);
*/

-- =====================================================
-- CONSULTAS ÚTILES DE EJEMPLO
-- =====================================================

-- Ver todos los libros con sus estadísticas
-- SELECT * FROM v_estadisticas_libros ORDER BY codigo;

-- Ver libros activos disponibles para agregar actas
-- SELECT codigo, nombre, ubicacion_fisica, folios_utilizados, total_folios
-- FROM libro
-- WHERE estado IN ('ACTIVO', 'EN_USO')
-- ORDER BY codigo;

-- Ver actas de un libro específico
-- SELECT * FROM v_actas_completo
-- WHERE libro_codigo = 'PRIM-2010-B'
-- ORDER BY folio;

-- Ver libros que están por completarse (más del 90% de uso)
-- SELECT codigo, nombre, porcentaje_uso, estado
-- FROM v_estadisticas_libros
-- WHERE porcentaje_uso >= 90
-- ORDER BY porcentaje_uso DESC;

-- =====================================================
-- PROCEDIMIENTOS RECOMENDADOS
-- =====================================================

-- 1. Antes de subir un acta, verificar que el libro esté activo
/*
SELECT id, codigo, nombre, estado, folios_utilizados, total_folios
FROM libro
WHERE codigo = 'PRIM-2010-B'
  AND estado IN ('ACTIVO', 'EN_USO');
*/

-- 2. Verificar qué folios están disponibles en un libro
/*
SELECT f.folio_numero
FROM generate_series(301, 600) f(folio_numero)
LEFT JOIN actafisica a ON a.folio = f.folio_numero 
    AND a.libro_id = (SELECT id FROM libro WHERE codigo = 'PRIM-2010-B')
WHERE a.id IS NULL
ORDER BY f.folio_numero
LIMIT 20;
*/

-- 3. Estadísticas de procesamiento de actas por libro
/*
SELECT 
    l.codigo,
    l.nombre,
    COUNT(a.id) as total_actas,
    COUNT(CASE WHEN a.procesadoconia THEN 1 END) as procesadas,
    COUNT(CASE WHEN NOT a.procesadoconia THEN 1 END) as pendientes,
    ROUND(AVG(CASE WHEN a.confianza_ia IS NOT NULL THEN a.confianza_ia END), 2) as confianza_promedio
FROM libro l
LEFT JOIN actafisica a ON l.id = a.libro_id
WHERE l.estado = 'ACTIVO'
GROUP BY l.id, l.codigo, l.nombre
ORDER BY l.codigo;
*/

-- 4. Actualizar estado del libro cuando se complete
/*
UPDATE libro
SET estado = 'COMPLETO'
WHERE id = (SELECT id FROM libro WHERE codigo = 'PRIM-2010-B')
  AND folios_utilizados >= total_folios;
*/

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
1. El campo libro_id en actafisica es OBLIGATORIO
2. No se pueden duplicar folios en el mismo libro
3. Los folios deben estar dentro del rango definido en el libro
4. El sistema actualiza automáticamente el contador folios_utilizados
5. Solo se pueden agregar actas a libros con estado ACTIVO o EN_USO

FLUJO RECOMENDADO:
1. Crear el libro primero
2. Escanear y subir el PDF del acta
3. Registrar el acta indicando libro y folio
4. El sistema valida y actualiza contadores automáticamente
5. Procesar con IA
6. Exportar a Excel si es necesario
*/

-- =====================================================
-- FIN DE DATOS DE EJEMPLO
-- =====================================================

