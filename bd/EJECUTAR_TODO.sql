-- ============================================
-- SCRIPT CONSOLIDADO - EJECUTAR TODO
-- Base de Datos Optimizada Completa
-- ============================================
-- 
-- Este archivo consolida todos los scripts en uno solo.
-- Puedes ejecutarlo completo con:
-- psql -U postgres -d certificados_db -f EJECUTAR_TODO.sql
-- 
-- O copiarlo completo en pgAdmin Query Tool
-- ============================================

\echo '================================================'
\echo 'INICIANDO MIGRACIÓN DE BASE DE DATOS'
\echo '================================================'

-- Extensiones necesarias
\echo 'Instalando extensiones...'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\echo 'Extensiones instaladas ✓'

-- ============================================
-- PARTE 1: TABLAS PRINCIPALES
-- ============================================
\echo '================================================'
\echo 'Creando tablas principales...'
\echo '================================================'

\i '01_schema_optimizado.sql'
\echo 'Tablas principales creadas ✓'

-- ============================================
-- PARTE 2: CERTIFICADOS Y USUARIOS
-- ============================================
\echo '================================================'
\echo 'Creando tablas de certificados y usuarios...'
\echo '================================================'

\i '02_certificados_usuarios.sql'
\echo 'Tablas de certificados y usuarios creadas ✓'

-- ============================================
-- PARTE 3: FOREIGN KEYS
-- ============================================
\echo '================================================'
\echo 'Configurando relaciones (Foreign Keys)...'
\echo '================================================'

\i '03_foreign_keys.sql'
\echo 'Relaciones configuradas ✓'

-- ============================================
-- PARTE 4: ÍNDICES
-- ============================================
\echo '================================================'
\echo 'Creando índices de performance...'
\echo '================================================'

\i '04_indices.sql'
\echo 'Índices creados ✓'

-- ============================================
-- PARTE 5: TRIGGERS Y FUNCIONES
-- ============================================
\echo '================================================'
\echo 'Configurando triggers y funciones...'
\echo '================================================'

\i '05_triggers_funciones.sql'
\echo 'Triggers y funciones configurados ✓'

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
\echo '================================================'
\echo 'VERIFICACIÓN DE INSTALACIÓN'
\echo '================================================'

\echo 'Contando tablas...'
SELECT COUNT(*) as total_tablas FROM information_schema.tables WHERE table_schema = 'public';

\echo 'Contando índices...'
SELECT COUNT(*) as total_indices FROM pg_indexes WHERE schemaname = 'public';

\echo 'Listando triggers...'
SELECT COUNT(*) as total_triggers FROM information_schema.triggers WHERE trigger_schema = 'public';

\echo '================================================'
\echo 'MIGRACIÓN COMPLETADA EXITOSAMENTE ✓'
\echo '================================================'
\echo ''
\echo 'Próximos pasos:'
\echo '1. Ejecutar: npx prisma db pull'
\echo '2. Ejecutar: npx prisma generate'
\echo '3. Ejecutar: npx prisma studio (opcional)'
\echo ''
\echo 'Base de datos lista para Prisma!'
\echo '================================================'
