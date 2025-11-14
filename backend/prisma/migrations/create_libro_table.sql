-- Migration: Create libro table and update actafisica
-- Created: 2025-11-10
-- Description: Adds libro table for physical book inventory management and updates actafisica to use libro_id FK

-- Create libro table
CREATE TABLE IF NOT EXISTS "libro" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "institucion_id" UUID NOT NULL DEFAULT obtener_institucion_sesion(),
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),
    "ubicacion_fisica" VARCHAR(255),
    "anio_inicio" INTEGER,
    "anio_fin" INTEGER,
    "total_folios" INTEGER,
    "estado" VARCHAR(20) DEFAULT 'ACTIVO',
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMPTZ(6) DEFAULT NOW(),
    "activo" BOOLEAN DEFAULT TRUE,
    
    -- Foreign key
    CONSTRAINT "fk_libro_institucion" FOREIGN KEY ("institucion_id") 
        REFERENCES "configuracioninstitucion"("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
    
    -- Unique constraint
    CONSTRAINT "libro_institucion_id_codigo_key" UNIQUE ("institucion_id", "codigo")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_libro_institucion" ON "libro"("institucion_id");
CREATE INDEX IF NOT EXISTS "idx_libro_estado" ON "libro"("estado");

-- Add libro_id column to actafisica (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'actafisica' AND column_name = 'libro_id'
    ) THEN
        ALTER TABLE "actafisica" ADD COLUMN "libro_id" UUID;
    END IF;
END $$;

-- Add foreign key constraint to actafisica
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_acta_libro'
    ) THEN
        ALTER TABLE "actafisica" 
        ADD CONSTRAINT "fk_acta_libro" FOREIGN KEY ("libro_id") 
        REFERENCES "libro"("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
    END IF;
END $$;

-- Create index on actafisica.libro_id
CREATE INDEX IF NOT EXISTS "idx_acta_libro" ON "actafisica"("libro_id");

-- Optional: Drop old libro column (if it exists as VARCHAR)
-- Uncomment the following lines if you want to remove the old libro column
-- ALTER TABLE "actafisica" DROP COLUMN IF EXISTS "libro";

COMMENT ON TABLE "libro" IS 'Inventario de libros físicos de actas (1985-2012)';
COMMENT ON COLUMN "libro"."codigo" IS 'Código del libro (ej: 1, 2, 3A)';
COMMENT ON COLUMN "libro"."estado" IS 'Estado: ACTIVO, ARCHIVADO, DETERIORADO, PERDIDO';

