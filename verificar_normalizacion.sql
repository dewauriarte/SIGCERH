-- Script para verificar datos de normalización
-- Ejecutar en MSSQL Server Management Studio o Azure Data Studio

-- 1. Ver actas normalizadas
SELECT 
    id,
    numero,
    normalizada,
    fecha_normalizacion,
    estado
FROM actafisica
WHERE normalizada = 1
ORDER BY fecha_normalizacion DESC;

-- 2. Ver estudiantes creados recientemente (últimos 10)
SELECT TOP 10
    id,
    dni,
    apellidopaterno,
    apellidomaterno,
    nombres,
    sexo,
    fecharegistro
FROM estudiante
ORDER BY fecharegistro DESC;

-- 3. Ver vínculos acta-estudiante del acta normalizada (reemplaza el ID)
-- NOTA: Reemplaza 'TU-ACTA-ID' con el ID real del acta
DECLARE @actaId UNIQUEIDENTIFIER = '50abfd51-2178-48a2-aa58-0cdcf9e9c4f1';

SELECT 
    ae.id,
    ae.numero_orden,
    e.dni,
    e.apellidopaterno,
    e.apellidomaterno,
    e.nombres,
    ae.situacion_final
FROM actaestudiante ae
INNER JOIN estudiante e ON ae.estudiante_id = e.id
WHERE ae.acta_id = @actaId
ORDER BY ae.numero_orden;

-- 4. Ver notas de un acta (reemplaza el ID)
SELECT 
    ae.numero_orden,
    e.apellidopaterno + ' ' + e.apellidomaterno + ', ' + e.nombres AS nombre_completo,
    ac.nombre AS area_curricular,
    an.nota,
    an.nota_literal
FROM actaestudiante ae
INNER JOIN estudiante e ON ae.estudiante_id = e.id
INNER JOIN actanota an ON an.acta_estudiante_id = ae.id
INNER JOIN areacurricular ac ON an.area_id = ac.id
WHERE ae.acta_id = @actaId
ORDER BY ae.numero_orden, ac.nombre;

-- 5. Resumen de normalización
SELECT 
    COUNT(DISTINCT ae.estudiante_id) AS total_estudiantes,
    COUNT(DISTINCT ae.id) AS total_vinculos,
    COUNT(an.id) AS total_notas
FROM actaestudiante ae
LEFT JOIN actanota an ON an.acta_estudiante_id = ae.id
WHERE ae.acta_id = @actaId;
