-- ============================================
-- FIX: Cambiar constraint único de Grado
-- De: (institucion_id, numero)
-- A:  (institucion_id, nivel_id, numero)
-- ============================================

-- Eliminar constraint antiguo
ALTER TABLE Grado DROP CONSTRAINT IF EXISTS grado_institucion_id_numero_key;

-- Crear nuevo constraint con nivel_id
ALTER TABLE Grado ADD CONSTRAINT grado_institucion_id_nivel_id_numero_key 
    UNIQUE (institucion_id, nivel_id, numero);

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Constraint de Grado actualizado correctamente: ahora permite el mismo número en diferentes niveles educativos';
END $$;
