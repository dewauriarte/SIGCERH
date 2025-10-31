-- ============================================
-- SISTEMA DE CERTIFICADOS - BASE DE DATOS OPTIMIZADA
-- Parte 1: Tablas Principales con Correcciones
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- CONFIGURACIÓN INSTITUCIONAL
-- ============================================

CREATE TABLE ConfiguracionInstitucion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigoModular VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    ugel VARCHAR(100) NOT NULL,
    distrito VARCHAR(100) NOT NULL,
    provincia VARCHAR(100),
    departamento VARCHAR(100),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    logo_url TEXT,
    nombreDirector VARCHAR(255),
    cargoDirector VARCHAR(100) DEFAULT 'Director',
    firma_url TEXT,
    textoLegal TEXT,
    activo BOOLEAN DEFAULT true,
    fechaActualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT solo_una_institucion_activa CHECK (activo = true)
);

-- Índice único para garantizar solo una institución activa
CREATE UNIQUE INDEX idx_unica_institucion_activa 
ON ConfiguracionInstitucion (activo) 
WHERE activo = true;

CREATE TABLE NivelEducativo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL DEFAULT obtener_institucion_sesion(),
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INT NOT NULL,
    activo BOOLEAN DEFAULT true,
    UNIQUE(institucion_id, codigo)
);

-- ============================================
-- ESTUDIANTES
-- ============================================

CREATE TABLE Estudiante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL DEFAULT obtener_institucion_sesion(),
    dni VARCHAR(8) NOT NULL,
    apellidoPaterno VARCHAR(100) NOT NULL,
    apellidoMaterno VARCHAR(100) NOT NULL,
    nombres VARCHAR(150) NOT NULL,
    nombreCompleto VARCHAR(400) GENERATED ALWAYS AS (nombres || ' ' || apellidoPaterno || ' ' || apellidoMaterno) STORED,
    fechaNacimiento DATE NOT NULL,
    lugarNacimiento VARCHAR(150),
    sexo CHAR(1) DEFAULT 'M' CHECK (sexo IN ('M', 'H')),
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    fechaRegistro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institucion_id, dni)
);

-- ============================================
-- AÑOS ACADÉMICOS
-- ============================================

CREATE TABLE AnioLectivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL DEFAULT obtener_institucion_sesion(),
    anio INT NOT NULL,
    fechaInicio DATE NOT NULL,
    fechaFin DATE NOT NULL,
    activo BOOLEAN DEFAULT false,
    observaciones TEXT,
    UNIQUE(institucion_id, anio),
    CHECK (fechaFin > fechaInicio)
);

CREATE TABLE Grado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL DEFAULT obtener_institucion_sesion(),
    nivel_id UUID,
    numero INT NOT NULL CHECK (numero BETWEEN 1 AND 10),
    nombre VARCHAR(50) NOT NULL,
    nombreCorto VARCHAR(20),
    orden INT NOT NULL,
    activo BOOLEAN DEFAULT true,
    UNIQUE(institucion_id, numero)
);

-- Tablas Seccion y Matricula eliminadas - No aplican para sistema de certificados

-- ============================================
-- CURRÍCULO
-- ============================================

CREATE TABLE AreaCurricular (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    orden INT NOT NULL,
    esCompetenciaTransversal BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    UNIQUE(institucion_id, codigo)
);

CREATE TABLE CurriculoGrado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID NOT NULL,
    grado_id UUID NOT NULL,
    anioLectivo_id UUID NOT NULL,
    orden INT NOT NULL,
    activo BOOLEAN DEFAULT true,
    UNIQUE(area_id, grado_id, anioLectivo_id)
);

-- Tablas Periodo, Nota y Subsanacion eliminadas - No aplican para sistema de certificados

CREATE TABLE ActaFisica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(50) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    anioLectivo_id UUID NOT NULL,
    grado_id UUID NOT NULL,
    fechaEmision DATE,
    libro VARCHAR(50),
    folio VARCHAR(50),
    nombreArchivo VARCHAR(255),
    urlArchivo TEXT,
    hashArchivo VARCHAR(64),
    procesadoConIA BOOLEAN DEFAULT false,
    fechaProcesamiento TIMESTAMPTZ,
    datosExtraidosJSON JSONB,
    urlExcelExportado TEXT,
    fechaExportacionExcel TIMESTAMPTZ,
    observaciones TEXT,
    usuarioSubida_id UUID,
    fechaSubida TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(numero, anioLectivo_id)
);
