-- =====================================================
-- Migración 008: Eliminar campos innecesarios de actafisica
-- Fecha: 2025-11-12
-- Descripción: Elimina campos que no corresponden a actas
--              - colegiorigen: es dato del estudiante, no del acta
--              - ubicacionfisica: pertenece al libro, no al acta individual
-- =====================================================

-- Eliminar columna colegiorigen (es dato del estudiante)
ALTER TABLE actafisica DROP COLUMN IF EXISTS colegiorigen;

-- Eliminar columna ubicacionfisica (está en la tabla libro)
ALTER TABLE actafisica DROP COLUMN IF EXISTS ubicacionfisica;

-- Comentario informativo
COMMENT ON TABLE actafisica IS 'Actas físicas escaneadas y procesadas con IA (OCR) - Vinculadas a libros de actas. La ubicación física está en la tabla libro.';
