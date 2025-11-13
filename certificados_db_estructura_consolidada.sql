--
-- PostgreSQL database dump - ESTRUCTURA CONSOLIDADA
-- Base de datos: SIGCERH
-- Fecha de refactorización: 2025-11-12
--

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- =====================================================
-- EXTENSIONES
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';

-- =====================================================
-- FUNCIONES
-- =====================================================

CREATE FUNCTION public.actualizar_fecha_modificacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.fechaActualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.actualizar_fecha_modificacion() OWNER TO postgres;

CREATE FUNCTION public.bloquear_usuario_intentos() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.intentosFallidos >= 5 AND OLD.intentosFallidos < 5 THEN
        NEW.bloqueado := true;
        NEW.fechaBloqueo := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.bloquear_usuario_intentos() OWNER TO postgres;

CREATE FUNCTION public.calcular_edad(fecha_nac date) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(fecha_nac));
END;
$$;

ALTER FUNCTION public.calcular_edad(fecha_nac date) OWNER TO postgres;

CREATE FUNCTION public.calcular_monto_neto_pago() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.comision IS NOT NULL AND NEW.comision > 0 THEN
        NEW.montoNeto := NEW.monto - NEW.comision;
    ELSE
        NEW.montoNeto := NEW.monto;
    END IF;
    
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.calcular_monto_neto_pago() OWNER TO postgres;

CREATE FUNCTION public.generar_codigo_matricula() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    anio_str VARCHAR(4);
    contador INT;
    nuevo_codigo VARCHAR(50);
BEGIN
    IF NEW.codigo IS NULL THEN
        SELECT EXTRACT(YEAR FROM NEW.fechaRegistro)::TEXT INTO anio_str;
        
        SELECT COUNT(*) + 1 INTO contador
        FROM Matricula
        WHERE anioLectivo_id = NEW.anioLectivo_id;
        
        nuevo_codigo := anio_str || '-' || LPAD(contador::TEXT, 5, '0');
        NEW.codigo := nuevo_codigo;
    END IF;
    
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.generar_codigo_matricula() OWNER TO postgres;

CREATE FUNCTION public.generar_numero_expediente() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    anio_str VARCHAR(4);
    contador INT;
    nuevo_expediente VARCHAR(50);
BEGIN
    IF NEW.numeroExpediente IS NULL THEN
        SELECT EXTRACT(YEAR FROM NEW.fechaSolicitud)::TEXT INTO anio_str;
        
        SELECT COUNT(*) + 1 INTO contador
        FROM Solicitud
        WHERE EXTRACT(YEAR FROM fechaSolicitud) = EXTRACT(YEAR FROM NEW.fechaSolicitud);
        
        nuevo_expediente := 'EXP-' || anio_str || '-' || LPAD(contador::TEXT, 6, '0');
        NEW.numeroExpediente := nuevo_expediente;
    END IF;
    
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.generar_numero_expediente() OWNER TO postgres;

CREATE FUNCTION public.generar_numero_orden() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    anio_str VARCHAR(4);
    mes_str VARCHAR(2);
    contador INT;
    nueva_orden VARCHAR(50);
BEGIN
    IF NEW.numeroOrden IS NULL THEN
        SELECT 
            EXTRACT(YEAR FROM NEW.fechaPago)::TEXT,
            LPAD(EXTRACT(MONTH FROM NEW.fechaPago)::TEXT, 2, '0')
        INTO anio_str, mes_str;
        
        SELECT COUNT(*) + 1 INTO contador
        FROM Pago
        WHERE EXTRACT(YEAR FROM fechaPago) = EXTRACT(YEAR FROM NEW.fechaPago)
          AND EXTRACT(MONTH FROM fechaPago) = EXTRACT(MONTH FROM NEW.fechaPago);
        
        nueva_orden := 'ORD-' || anio_str || mes_str || '-' || LPAD(contador::TEXT, 5, '0');
        NEW.numeroOrden := nueva_orden;
    END IF;
    
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.generar_numero_orden() OWNER TO postgres;

CREATE FUNCTION public.incrementar_intentos_notificacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.estado = 'FALLIDO' AND OLD.estado = 'PENDIENTE' THEN
        NEW.intentos := OLD.intentos + 1;
        
        -- Si supera 3 intentos, marcar como ERROR
        IF NEW.intentos >= 3 THEN
            NEW.estado := 'ERROR';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.incrementar_intentos_notificacion() OWNER TO postgres;

CREATE FUNCTION public.limpiar_sesiones_expiradas() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE Sesion
    SET activa = false,
        fechaCierre = CURRENT_TIMESTAMP
    WHERE activa = true
      AND fechaExpiracion < CURRENT_TIMESTAMP;
END;
$$;

ALTER FUNCTION public.limpiar_sesiones_expiradas() OWNER TO postgres;

CREATE FUNCTION public.obtener_institucion_default() RETURNS uuid
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    inst_id UUID;
BEGIN
    -- Retorna la única institución activa
    SELECT id INTO inst_id
    FROM ConfiguracionInstitucion
    WHERE activo = true
    LIMIT 1;
    
    IF inst_id IS NULL THEN
        RAISE EXCEPTION 'No hay ninguna institución configurada. Debe crear una en ConfiguracionInstitucion';
    END IF;
    
    RETURN inst_id;
END;
$$;

ALTER FUNCTION public.obtener_institucion_default() OWNER TO postgres;

CREATE FUNCTION public.obtener_institucion_sesion() RETURNS uuid
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN obtener_institucion_default();
END;
$$;

ALTER FUNCTION public.obtener_institucion_sesion() OWNER TO postgres;

CREATE FUNCTION public.refrescar_estadisticas() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_certificados;
END;
$$;

ALTER FUNCTION public.refrescar_estadisticas() OWNER TO postgres;

CREATE FUNCTION public.registrar_historial_solicitud() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO SolicitudHistorial (
            solicitud_id,
            estadoAnterior,
            estadoNuevo,
            usuario_id
        ) VALUES (
            NEW.id,
            OLD.estado,
            NEW.estado,
            NEW.usuarioSolicitud_id
        );
    END IF;
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.registrar_historial_solicitud() OWNER TO postgres;

CREATE FUNCTION public.validar_capacidad_seccion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    matriculas_actuales INT;
    capacidad_maxima INT;
BEGIN
    IF NEW.seccion_id IS NOT NULL THEN
        SELECT COUNT(*), s.capacidad
        INTO matriculas_actuales, capacidad_maxima
        FROM Matricula m
        JOIN Seccion s ON s.id = NEW.seccion_id
        WHERE m.seccion_id = NEW.seccion_id
          AND m.estado = 'ACTIVO'
        GROUP BY s.capacidad;
        
        IF matriculas_actuales >= capacidad_maxima THEN
            RAISE EXCEPTION 'La sección ha alcanzado su capacidad máxima de % estudiantes', capacidad_maxima;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.validar_capacidad_seccion() OWNER TO postgres;

CREATE FUNCTION public.validar_certificado_activo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    cert_estado VARCHAR(20);
BEGIN
    SELECT estado INTO cert_estado
    FROM Certificado
    WHERE id = NEW.certificado_id;
    
    IF cert_estado = 'ANULADO' THEN
        NEW.resultado := 'CERTIFICADO_ANULADO';
        NEW.detalleResultado := 'El certificado consultado ha sido anulado';
    ELSIF cert_estado IS NULL THEN
        NEW.resultado := 'NO_ENCONTRADO';
        NEW.detalleResultado := 'Código de certificado no encontrado';
    ELSE
        NEW.resultado := 'VALIDO';
        NEW.detalleResultado := 'Certificado válido y activo';
    END IF;
    
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.validar_certificado_activo() OWNER TO postgres;

CREATE FUNCTION public.validar_consistencia_institucion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    anio_inst_id UUID;
    grado_inst_id UUID;
BEGIN
    -- Validar que año lectivo y grado sean de la misma institución
    SELECT institucion_id INTO anio_inst_id FROM AnioLectivo WHERE id = NEW.anioLectivo_id;
    SELECT institucion_id INTO grado_inst_id FROM Grado WHERE id = NEW.grado_id;
    
    IF anio_inst_id != grado_inst_id THEN
        RAISE EXCEPTION 'El año lectivo y grado deben pertenecer a la misma institución';
    END IF;
    
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.validar_consistencia_institucion() OWNER TO postgres;

CREATE FUNCTION public.validar_estudiante_institucion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    estudiante_inst_id UUID;
BEGIN
    SELECT institucion_id INTO estudiante_inst_id
    FROM Estudiante
    WHERE id = NEW.estudiante_id;
    
    IF estudiante_inst_id IS NULL THEN
        RAISE EXCEPTION 'Estudiante no encontrado';
    END IF;
    
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.validar_estudiante_institucion() OWNER TO postgres;

CREATE FUNCTION public.validar_monto_pago_detalle() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    suma_detalles DECIMAL(10,2);
    monto_pago DECIMAL(10,2);
BEGIN
    SELECT SUM(monto) INTO suma_detalles
    FROM PagoDetalle
    WHERE pago_id = NEW.pago_id
      AND id != NEW.id;
    
    SELECT monto INTO monto_pago
    FROM Pago
    WHERE id = NEW.pago_id;
    
    IF (COALESCE(suma_detalles, 0) + NEW.monto) > monto_pago THEN
        RAISE EXCEPTION 'La suma de los detalles de pago (%) excede el monto total del pago (%)', 
            COALESCE(suma_detalles, 0) + NEW.monto, monto_pago;
    END IF;
    
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.validar_monto_pago_detalle() OWNER TO postgres;

CREATE FUNCTION public.actualizar_folios_libro() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Actualizar el contador de folios utilizados del libro
    UPDATE Libro
    SET folios_utilizados = (
        SELECT COUNT(DISTINCT folio)
        FROM ActaFisica
        WHERE libro_id = NEW.libro_id
    ),
    fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = NEW.libro_id;
    
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.actualizar_folios_libro() OWNER TO postgres;
COMMENT ON FUNCTION public.actualizar_folios_libro() IS 'Actualiza automáticamente el contador de folios utilizados cuando se registra una nueva acta';

CREATE FUNCTION public.validar_folio_libro() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    libro_folio_inicio INT;
    libro_folio_fin INT;
    libro_estado VARCHAR(20);
BEGIN
    -- Obtener límites y estado del libro
    SELECT folio_inicio, folio_fin, estado
    INTO libro_folio_inicio, libro_folio_fin, libro_estado
    FROM Libro
    WHERE id = NEW.libro_id;
    
    -- Validar que el libro esté activo
    IF libro_estado NOT IN ('ACTIVO', 'EN_USO') THEN
        RAISE EXCEPTION 'No se pueden agregar actas a un libro con estado: %', libro_estado;
    END IF;
    
    -- Validar rango de folios si está definido
    IF libro_folio_inicio IS NOT NULL AND NEW.folio < libro_folio_inicio THEN
        RAISE EXCEPTION 'El folio % es menor al folio inicial del libro (%)', NEW.folio, libro_folio_inicio;
    END IF;
    
    IF libro_folio_fin IS NOT NULL AND NEW.folio > libro_folio_fin THEN
        RAISE EXCEPTION 'El folio % excede el folio final del libro (%)', NEW.folio, libro_folio_fin;
    END IF;
    
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.validar_folio_libro() OWNER TO postgres;
COMMENT ON FUNCTION public.validar_folio_libro() IS 'Valida que el folio esté dentro del rango válido del libro antes de insertar';

SET default_tablespace = '';
SET default_table_access_method = heap;

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Tabla: configuracioninstitucion
CREATE TABLE public.configuracioninstitucion (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    codigomodular character varying(20) NOT NULL UNIQUE,
    nombre character varying(255) NOT NULL,
    ugel character varying(100) NOT NULL,
    distrito character varying(100) NOT NULL,
    provincia character varying(100),
    departamento character varying(100),
    direccion text,
    telefono character varying(20),
    email character varying(100),
    logo_url text,
    nombredirector character varying(255),
    cargodirector character varying(100) DEFAULT 'Director'::character varying,
    firma_url text,
    textolegal text,
    activo boolean DEFAULT true,
    fechaactualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT solo_una_institucion_activa CHECK ((activo = true))
);

ALTER TABLE public.configuracioninstitucion OWNER TO postgres;
COMMENT ON TABLE public.configuracioninstitucion IS 'Configuración de instituciones educativas (multi-tenant)';

-- Tabla: usuario
CREATE TABLE public.usuario (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    username character varying(50) NOT NULL UNIQUE,
    email character varying(100) NOT NULL UNIQUE,
    passwordhash character varying(255) NOT NULL,
    dni character varying(8) UNIQUE,
    nombres character varying(150),
    apellidos character varying(150),
    telefono character varying(20),
    cargo character varying(100),
    ultimoacceso timestamp with time zone,
    intentosfallidos integer DEFAULT 0,
    bloqueado boolean DEFAULT false,
    fechabloqueo timestamp with time zone,
    activo boolean DEFAULT true,
    cambiarpassword boolean DEFAULT true,
    fechacreacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fechaactualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.usuario OWNER TO postgres;
COMMENT ON TABLE public.usuario IS 'Usuarios del sistema';

-- Tabla: aniolectivo
CREATE TABLE public.aniolectivo (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    anio integer NOT NULL,
    fechainicio date NOT NULL,
    fechafin date NOT NULL,
    activo boolean DEFAULT false,
    observaciones text,
    CONSTRAINT aniolectivo_check CHECK ((fechafin > fechainicio)),
    CONSTRAINT aniolectivo_institucion_id_anio_key UNIQUE (institucion_id, anio),
    CONSTRAINT fk_anio_institucion FOREIGN KEY (institucion_id) 
        REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT
);

ALTER TABLE public.aniolectivo OWNER TO postgres;

-- Tabla: niveleducativo
CREATE TABLE public.niveleducativo (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    orden integer NOT NULL,
    activo boolean DEFAULT true,
    CONSTRAINT niveleducativo_institucion_id_codigo_key UNIQUE (institucion_id, codigo),
    CONSTRAINT fk_nivel_institucion FOREIGN KEY (institucion_id) 
        REFERENCES public.configuracioninstitucion(id) ON DELETE CASCADE
);

ALTER TABLE public.niveleducativo OWNER TO postgres;
COMMENT ON TABLE public.niveleducativo IS 'Niveles educativos por institución (Inicial, Primaria, Secundaria)';

-- Tabla: grado
CREATE TABLE public.grado (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    nivel_id uuid,
    numero integer NOT NULL,
    nombre character varying(50) NOT NULL,
    nombrecorto character varying(20),
    orden integer NOT NULL,
    activo boolean DEFAULT true,
    CONSTRAINT grado_numero_check CHECK (((numero >= 1) AND (numero <= 10))),
    CONSTRAINT grado_institucion_id_nivel_id_numero_key UNIQUE (institucion_id, nivel_id, numero),
    CONSTRAINT fk_grado_institucion FOREIGN KEY (institucion_id) 
        REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT,
    CONSTRAINT fk_grado_nivel FOREIGN KEY (nivel_id) 
        REFERENCES public.niveleducativo(id) ON DELETE SET NULL
);

ALTER TABLE public.grado OWNER TO postgres;

-- Tabla: areacurricular
CREATE TABLE public.areacurricular (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    institucion_id uuid,
    codigo character varying(20) NOT NULL,
    nombre character varying(150) NOT NULL,
    orden integer NOT NULL,
    escompetenciatransversal boolean DEFAULT false,
    activo boolean DEFAULT true,
    CONSTRAINT areacurricular_institucion_id_codigo_key UNIQUE (institucion_id, codigo),
    CONSTRAINT fk_area_institucion FOREIGN KEY (institucion_id) 
        REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT
);

ALTER TABLE public.areacurricular OWNER TO postgres;

-- Tabla: estudiante
CREATE TABLE public.estudiante (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    dni character varying(8) NOT NULL,
    apellidopaterno character varying(100) NOT NULL,
    apellidomaterno character varying(100) NOT NULL,
    nombres character varying(150) NOT NULL,
    nombrecompleto character varying(400) GENERATED ALWAYS AS ((((((nombres)::text || ' '::text) || (apellidopaterno)::text) || ' '::text) || (apellidomaterno)::text)) STORED,
    fechanacimiento date NOT NULL,
    lugarnacimiento character varying(150),
    sexo character(1) DEFAULT 'M'::bpchar,
    email character varying(100),
    telefono character varying(20),
    direccion text,
    observaciones text,
    estado character varying(20) DEFAULT 'ACTIVO'::character varying,
    fecharegistro timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fechaactualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT estudiante_sexo_check CHECK ((sexo = ANY (ARRAY['M'::bpchar, 'H'::bpchar]))),
    CONSTRAINT estudiante_institucion_id_dni_key UNIQUE (institucion_id, dni),
    CONSTRAINT fk_estudiante_institucion FOREIGN KEY (institucion_id) 
        REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT
);

ALTER TABLE public.estudiante OWNER TO postgres;
COMMENT ON TABLE public.estudiante IS 'Registro de estudiantes por institución';
COMMENT ON COLUMN public.estudiante.institucion_id IS 'Institución a la que pertenece el estudiante';
COMMENT ON COLUMN public.estudiante.sexo IS 'M=Mujer, H=Hombre';

-- Tabla: libro
CREATE TABLE public.libro (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    nivel_id uuid,
    codigo character varying(50) NOT NULL,
    nombre character varying(255),
    descripcion text,
    tipo_acta character varying(30),
    anio_inicio integer NOT NULL,
    anio_fin integer,
    folio_inicio integer DEFAULT 1,
    folio_fin integer,
    total_folios integer,
    folios_utilizados integer DEFAULT 0,
    ubicacion_fisica character varying(255),
    estante character varying(50),
    seccion_archivo character varying(50),
    estado character varying(20) DEFAULT 'ACTIVO'::character varying,
    observaciones text,
    fecha_creacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    usuario_registro_id uuid,
    activo boolean DEFAULT true,
    CONSTRAINT libro_institucion_id_codigo_key UNIQUE (institucion_id, codigo),
    CONSTRAINT libro_anios_check CHECK ((anio_fin IS NULL OR anio_fin >= anio_inicio)),
    CONSTRAINT libro_folios_check CHECK ((folio_fin IS NULL OR folio_fin >= folio_inicio)),
    CONSTRAINT libro_folios_utilizados_check CHECK ((folios_utilizados >= 0 AND folios_utilizados <= total_folios)),
    CONSTRAINT fk_libro_institucion FOREIGN KEY (institucion_id) 
        REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT,
    CONSTRAINT fk_libro_nivel FOREIGN KEY (nivel_id) 
        REFERENCES public.niveleducativo(id) ON DELETE SET NULL,
    CONSTRAINT fk_libro_usuario FOREIGN KEY (usuario_registro_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL
);

ALTER TABLE public.libro OWNER TO postgres;
COMMENT ON TABLE public.libro IS 'Inventario de libros físicos de actas (registros históricos 1985-2012 y posteriores)';
COMMENT ON COLUMN public.libro.codigo IS 'Código del libro (ej: LIBRO-001, PRIM-2010-A)';
COMMENT ON COLUMN public.libro.nivel_id IS 'Nivel educativo al que pertenece el libro (Primaria, Secundaria)';
COMMENT ON COLUMN public.libro.tipo_acta IS 'Tipo de actas que contiene (EVALUACION, RECUPERACION, SUBSANACION, etc)';
COMMENT ON COLUMN public.libro.folio_inicio IS 'Número del primer folio del libro';
COMMENT ON COLUMN public.libro.folio_fin IS 'Número del último folio del libro';
COMMENT ON COLUMN public.libro.folios_utilizados IS 'Cantidad de folios que ya tienen actas registradas';
COMMENT ON COLUMN public.libro.ubicacion_fisica IS 'Ubicación física del libro (Ej: Archivo Central, Dirección, Sala X)';
COMMENT ON COLUMN public.libro.estante IS 'Número de estante donde se encuentra';
COMMENT ON COLUMN public.libro.seccion_archivo IS 'Sección del archivo (Ej: HISTORICOS, ACTIVOS)';
COMMENT ON COLUMN public.libro.estado IS 'Estado: ACTIVO, EN_USO, COMPLETO, ARCHIVADO, DETERIORADO, PERDIDO';

-- Tabla: certificado
CREATE TABLE public.certificado (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    codigovirtual character varying(50) NOT NULL UNIQUE,
    numero character varying(50) UNIQUE,
    estudiante_id uuid NOT NULL,
    fechaemision date NOT NULL,
    horaemision time without time zone NOT NULL,
    lugaremision character varying(100) DEFAULT 'PUNO'::character varying,
    gradoscompletados text[],
    situacionfinal character varying(50),
    promediogeneral numeric(4,2),
    urlpdf text,
    hashpdf character varying(64),
    urlqr text,
    observacionretiros text,
    observaciontraslados text,
    observacionsiagie text,
    observacionpruebasubicacion text,
    observacionconvalidacion text,
    observacionotros text,
    ordenmerito integer,
    estado character varying(20) DEFAULT 'EMITIDO'::character varying,
    version integer DEFAULT 1,
    esrectificacion boolean DEFAULT false,
    certificadoanterior_id uuid,
    motivorectificacion text,
    usuarioemision_id uuid,
    fechacreacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    usuarioanulacion_id uuid,
    fechaanulacion timestamp with time zone,
    motivoanulacion text,
    CONSTRAINT certificado_promediogeneral_check CHECK (((promediogeneral IS NULL) OR ((promediogeneral >= (0)::numeric) AND (promediogeneral <= (20)::numeric)))),
    CONSTRAINT fk_certificado_institucion FOREIGN KEY (institucion_id) 
        REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT,
    CONSTRAINT fk_certificado_estudiante FOREIGN KEY (estudiante_id) 
        REFERENCES public.estudiante(id) ON DELETE RESTRICT,
    CONSTRAINT fk_certificado_anterior FOREIGN KEY (certificadoanterior_id) 
        REFERENCES public.certificado(id) ON DELETE SET NULL,
    CONSTRAINT fk_certificado_usuario_emision FOREIGN KEY (usuarioemision_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL,
    CONSTRAINT fk_certificado_usuario_anulacion FOREIGN KEY (usuarioanulacion_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL
);

ALTER TABLE public.certificado OWNER TO postgres;
COMMENT ON TABLE public.certificado IS 'Certificados de estudios emitidos por institución';
COMMENT ON COLUMN public.certificado.codigovirtual IS 'Código único para verificación online';
COMMENT ON COLUMN public.certificado.hashpdf IS 'SHA-256 del PDF para verificación de integridad';

-- Tabla: certificadodetalle
CREATE TABLE public.certificadodetalle (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    certificado_id uuid NOT NULL,
    aniolectivo_id uuid NOT NULL,
    grado_id uuid NOT NULL,
    situacionfinal character varying(50),
    observaciones text,
    orden integer NOT NULL,
    CONSTRAINT certificadodetalle_certificado_id_aniolectivo_id_grado_id_key UNIQUE (certificado_id, aniolectivo_id, grado_id),
    CONSTRAINT fk_certdet_certificado FOREIGN KEY (certificado_id) 
        REFERENCES public.certificado(id) ON DELETE CASCADE,
    CONSTRAINT fk_certdet_anio FOREIGN KEY (aniolectivo_id) 
        REFERENCES public.aniolectivo(id) ON DELETE RESTRICT,
    CONSTRAINT fk_certdet_grado FOREIGN KEY (grado_id) 
        REFERENCES public.grado(id) ON DELETE RESTRICT
);

ALTER TABLE public.certificadodetalle OWNER TO postgres;

-- Tabla: certificadonota
CREATE TABLE public.certificadonota (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    certificadodetalle_id uuid NOT NULL,
    area_id uuid NOT NULL,
    nota integer,
    notaliteral character varying(50),
    esexonerado boolean DEFAULT false,
    orden integer NOT NULL,
    CONSTRAINT certificadonota_nota_check CHECK (((nota >= 0) AND (nota <= 20))),
    CONSTRAINT certificadonota_certificadodetalle_id_area_id_key UNIQUE (certificadodetalle_id, area_id),
    CONSTRAINT fk_certnota_detalle FOREIGN KEY (certificadodetalle_id) 
        REFERENCES public.certificadodetalle(id) ON DELETE CASCADE,
    CONSTRAINT fk_certnota_area FOREIGN KEY (area_id) 
        REFERENCES public.areacurricular(id) ON DELETE RESTRICT
);

ALTER TABLE public.certificadonota OWNER TO postgres;

-- Tabla: curriculogrado
CREATE TABLE public.curriculogrado (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    area_id uuid NOT NULL,
    grado_id uuid NOT NULL,
    aniolectivo_id uuid NOT NULL,
    orden integer NOT NULL,
    activo boolean DEFAULT true,
    CONSTRAINT curriculogrado_area_id_grado_id_aniolectivo_id_key UNIQUE (area_id, grado_id, aniolectivo_id),
    CONSTRAINT fk_curriculo_area FOREIGN KEY (area_id) 
        REFERENCES public.areacurricular(id) ON DELETE RESTRICT,
    CONSTRAINT fk_curriculo_grado FOREIGN KEY (grado_id) 
        REFERENCES public.grado(id) ON DELETE RESTRICT,
    CONSTRAINT fk_curriculo_anio FOREIGN KEY (aniolectivo_id) 
        REFERENCES public.aniolectivo(id) ON DELETE RESTRICT
);

ALTER TABLE public.curriculogrado OWNER TO postgres;

-- Tabla: metodopago
CREATE TABLE public.metodopago (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    institucion_id uuid NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo character varying(30) NOT NULL,
    descripcion text,
    requierevalidacion boolean DEFAULT true,
    comisionporcentaje numeric(5,2),
    comisionfija numeric(10,2),
    activo boolean DEFAULT true,
    configuracion jsonb,
    CONSTRAINT metodopago_institucion_id_codigo_key UNIQUE (institucion_id, codigo),
    CONSTRAINT fk_metodopago_institucion FOREIGN KEY (institucion_id) 
        REFERENCES public.configuracioninstitucion(id) ON DELETE CASCADE
);

ALTER TABLE public.metodopago OWNER TO postgres;
COMMENT ON TABLE public.metodopago IS 'Métodos de pago configurados por institución (Yape, POS, Tarjeta, etc)';

-- Tabla: pasarelapago
CREATE TABLE public.pasarelapago (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    institucion_id uuid NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    merchant_id character varying(100),
    commerce_code character varying(100),
    api_key_encrypted text,
    api_secret_encrypted text,
    webhook_url text,
    webhook_secret text,
    ambiente character varying(20) DEFAULT 'SANDBOX'::character varying,
    activo boolean DEFAULT true,
    configuracion jsonb,
    fechaactualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pasarelapago_institucion_id_codigo_key UNIQUE (institucion_id, codigo),
    CONSTRAINT fk_pasarela_institucion FOREIGN KEY (institucion_id) 
        REFERENCES public.configuracioninstitucion(id) ON DELETE CASCADE
);

ALTER TABLE public.pasarelapago OWNER TO postgres;
COMMENT ON TABLE public.pasarelapago IS 'Configuración de pasarelas de pago (Niubiz, Culqi, MercadoPago)';

-- Tabla: pago
CREATE TABLE public.pago (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    numeroorden character varying(50) NOT NULL UNIQUE,
    numerooperacion character varying(50),
    monto numeric(10,2) NOT NULL,
    moneda character varying(3) DEFAULT 'PEN'::character varying,
    comision numeric(10,2) DEFAULT 0,
    montoneto numeric(10,2),
    metodopago character varying(30),
    entidadbancaria character varying(100),
    referenciapago character varying(100),
    fechapago date NOT NULL,
    horapago time without time zone,
    numerorecibo character varying(50),
    urlcomprobante text,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying,
    conciliado boolean DEFAULT false,
    fechaconciliacion timestamp with time zone,
    usuarioconciliacion_id uuid,
    observaciones text,
    fecharegistro timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pago_monto_check CHECK ((monto > (0)::numeric)),
    CONSTRAINT fk_pago_institucion FOREIGN KEY (institucion_id) 
        REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pago_usuario FOREIGN KEY (usuarioconciliacion_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL
);

ALTER TABLE public.pago OWNER TO postgres;

-- Tabla: pagodetalle
CREATE TABLE public.pagodetalle (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    pago_id uuid NOT NULL,
    metodopago_id uuid NOT NULL,
    monto numeric(10,2) NOT NULL,
    moneda character varying(3) DEFAULT 'PEN'::character varying,
    numerocelular character varying(15),
    nombretitular character varying(200),
    terminal_id character varying(50),
    lote character varying(20),
    trace character varying(20),
    codigoautorizacion character varying(50),
    ultimos4digitos character varying(4),
    tipotarjeta character varying(30),
    cuotas integer DEFAULT 1,
    qr_code text,
    qr_id character varying(100),
    transaction_id character varying(100),
    pasarela character varying(50),
    merchant_id character varying(100),
    commerce_code character varying(50),
    responsejson jsonb,
    fechatransaccion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pagodetalle_monto_check CHECK ((monto > (0)::numeric)),
    CONSTRAINT fk_pagodet_pago FOREIGN KEY (pago_id) 
        REFERENCES public.pago(id) ON DELETE CASCADE,
    CONSTRAINT fk_pagodet_metodo FOREIGN KEY (metodopago_id) 
        REFERENCES public.metodopago(id) ON DELETE RESTRICT
);

ALTER TABLE public.pagodetalle OWNER TO postgres;
COMMENT ON TABLE public.pagodetalle IS 'Detalle de transacciones por método de pago';
COMMENT ON COLUMN public.pagodetalle.numerocelular IS 'Número celular para pagos Yape/Plin';
COMMENT ON COLUMN public.pagodetalle.terminal_id IS 'ID del terminal POS';
COMMENT ON COLUMN public.pagodetalle.transaction_id IS 'ID de transacción de la pasarela';
COMMENT ON COLUMN public.pagodetalle.responsejson IS 'Respuesta completa de la pasarela de pago';

-- Tabla: tiposolicitud
CREATE TABLE public.tiposolicitud (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    requierepago boolean DEFAULT true,
    montobase numeric(10,2),
    tiempoentregadias integer,
    activo boolean DEFAULT true,
    CONSTRAINT tiposolicitud_montobase_check CHECK (((montobase IS NULL) OR (montobase >= (0)::numeric))),
    CONSTRAINT tiposolicitud_institucion_id_codigo_key UNIQUE (institucion_id, codigo),
    CONSTRAINT fk_tiposol_institucion FOREIGN KEY (institucion_id) 
        REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT
);

ALTER TABLE public.tiposolicitud OWNER TO postgres;

-- Tabla: solicitud
CREATE TABLE public.solicitud (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    numeroexpediente character varying(50) UNIQUE,
    estudiante_id uuid NOT NULL,
    tiposolicitud_id uuid NOT NULL,
    modalidadentrega character varying(30),
    direccionentrega text,
    numeroseguimiento character varying(50),
    estado character varying(30) DEFAULT 'REGISTRADA'::character varying,
    prioridad character varying(20) DEFAULT 'NORMAL'::character varying,
    pago_id uuid,
    certificado_id uuid,
    fechasolicitud timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fechavalidacionpago timestamp with time zone,
    fechainicioproceso timestamp with time zone,
    fechageneracioncertificado timestamp with time zone,
    fechafirma timestamp with time zone,
    fechaentrega timestamp with time zone,
    fecharechazo timestamp with time zone,
    motivorechazo text,
    observaciones text,
    usuariosolicitud_id uuid,
    usuariovalidacionpago_id uuid,
    usuariogeneracion_id uuid,
    usuariofirma_id uuid,
    usuarioentrega_id uuid,
    fechaactualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_solicitud_estudiante FOREIGN KEY (estudiante_id) 
        REFERENCES public.estudiante(id) ON DELETE RESTRICT,
    CONSTRAINT fk_solicitud_tipo FOREIGN KEY (tiposolicitud_id) 
        REFERENCES public.tiposolicitud(id) ON DELETE RESTRICT,
    CONSTRAINT fk_solicitud_pago FOREIGN KEY (pago_id) 
        REFERENCES public.pago(id) ON DELETE SET NULL,
    CONSTRAINT fk_solicitud_certificado FOREIGN KEY (certificado_id) 
        REFERENCES public.certificado(id) ON DELETE SET NULL,
    CONSTRAINT fk_solicitud_usuario FOREIGN KEY (usuariosolicitud_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL,
    CONSTRAINT fk_solicitud_validador_pago FOREIGN KEY (usuariovalidacionpago_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL,
    CONSTRAINT fk_solicitud_generador FOREIGN KEY (usuariogeneracion_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL,
    CONSTRAINT fk_solicitud_firmante FOREIGN KEY (usuariofirma_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL,
    CONSTRAINT fk_solicitud_entregador FOREIGN KEY (usuarioentrega_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL
);

ALTER TABLE public.solicitud OWNER TO postgres;
COMMENT ON TABLE public.solicitud IS 'Solicitudes de trámites documentarios';

-- Tabla: actafisica
CREATE TABLE public.actafisica (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    libro_id uuid NOT NULL,
    numero character varying(50) NOT NULL,
    folio integer NOT NULL,
    tipo character varying(30) NOT NULL,
    aniolectivo_id uuid NOT NULL,
    grado_id uuid NOT NULL,
    seccion character varying(10),
    turno character varying(20),
    tipoevaluacion character varying(50),
    fechaemision date,
    nombrearchivo character varying(255),
    urlarchivo text NOT NULL,
    hasharchivo character varying(64),
    tamanoarchivo_kb integer,
    procesadoconia boolean DEFAULT false,
    fechaprocesamiento timestamp with time zone,
    datosextraidosjson jsonb,
    calidad_ocr character varying(20),
    confianza_ia numeric(5,2),
    urlexcelexportado text,
    fechaexportacionexcel timestamp with time zone,
    estado character varying(30) DEFAULT 'DISPONIBLE'::character varying,
    observaciones text,
    solicitud_id uuid,
    usuariosubida_id uuid,
    fechasubida timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    usuarioprocesamiento_id uuid,
    fecha_actualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT actafisica_libro_id_folio_key UNIQUE (libro_id, folio),
    CONSTRAINT actafisica_numero_aniolectivo_id_key UNIQUE (numero, aniolectivo_id),
    CONSTRAINT actafisica_folio_positivo_check CHECK ((folio > 0)),
    CONSTRAINT actafisica_confianza_check CHECK ((confianza_ia IS NULL OR (confianza_ia >= 0 AND confianza_ia <= 100))),
    CONSTRAINT fk_acta_libro FOREIGN KEY (libro_id) 
        REFERENCES public.libro(id) ON DELETE RESTRICT,
    CONSTRAINT fk_acta_anio FOREIGN KEY (aniolectivo_id) 
        REFERENCES public.aniolectivo(id) ON DELETE RESTRICT,
    CONSTRAINT fk_acta_grado FOREIGN KEY (grado_id) 
        REFERENCES public.grado(id) ON DELETE RESTRICT,
    CONSTRAINT fk_acta_solicitud FOREIGN KEY (solicitud_id) 
        REFERENCES public.solicitud(id) ON DELETE SET NULL,
    CONSTRAINT fk_acta_usuario_subida FOREIGN KEY (usuariosubida_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL,
    CONSTRAINT fk_acta_usuario_procesamiento FOREIGN KEY (usuarioprocesamiento_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL
);

ALTER TABLE public.actafisica OWNER TO postgres;
COMMENT ON TABLE public.actafisica IS 'Actas físicas escaneadas y procesadas con IA (OCR) - Vinculadas a libros de actas. La ubicación física está en la tabla libro.';
COMMENT ON COLUMN public.actafisica.libro_id IS 'Libro físico al que pertenece esta acta (OBLIGATORIO)';
COMMENT ON COLUMN public.actafisica.folio IS 'Número de folio dentro del libro físico';
COMMENT ON COLUMN public.actafisica.tipo IS 'Tipo: EVALUACION, RECUPERACION, SUBSANACION, TRASLADO';
COMMENT ON COLUMN public.actafisica.datosextraidosjson IS 'Datos extraídos por Gemini AI en formato JSON';
COMMENT ON COLUMN public.actafisica.calidad_ocr IS 'Calidad del OCR: EXCELENTE, BUENA, REGULAR, MALA';
COMMENT ON COLUMN public.actafisica.confianza_ia IS 'Nivel de confianza de la IA en el procesamiento (0-100%)';
COMMENT ON COLUMN public.actafisica.estado IS 'Estado: DISPONIBLE, EN_USO, PROCESADA, VERIFICADA, ARCHIVADA';

-- Tabla: solicitudhistorial
CREATE TABLE public.solicitudhistorial (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    solicitud_id uuid NOT NULL,
    estadoanterior character varying(30),
    estadonuevo character varying(30) NOT NULL,
    observaciones text,
    usuario_id uuid,
    fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_solhist_solicitud FOREIGN KEY (solicitud_id) 
        REFERENCES public.solicitud(id) ON DELETE CASCADE,
    CONSTRAINT fk_solhist_usuario FOREIGN KEY (usuario_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL
);

ALTER TABLE public.solicitudhistorial OWNER TO postgres;

-- Tabla: conciliacionbancaria
CREATE TABLE public.conciliacionbancaria (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    institucion_id uuid NOT NULL,
    entidadbancaria character varying(100) NOT NULL,
    fechaconciliacion date NOT NULL,
    fechainicio date NOT NULL,
    fechafin date NOT NULL,
    totalregistros integer,
    totalmonto numeric(12,2),
    archivooriginal_url text,
    archivonombre character varying(255),
    estado character varying(30) DEFAULT 'PENDIENTE'::character varying,
    observaciones text,
    usuario_id uuid,
    fechacreacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conciliacion_institucion FOREIGN KEY (institucion_id) 
        REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT,
    CONSTRAINT fk_conciliacion_usuario FOREIGN KEY (usuario_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL
);

ALTER TABLE public.conciliacionbancaria OWNER TO postgres;
COMMENT ON TABLE public.conciliacionbancaria IS 'Proceso de conciliación bancaria';

-- Tabla: conciliaciondetalle
CREATE TABLE public.conciliaciondetalle (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    conciliacion_id uuid NOT NULL,
    pago_id uuid,
    numerooperacion character varying(50),
    fechatransaccion date,
    monto numeric(10,2),
    conciliado boolean DEFAULT false,
    diferencia numeric(10,2),
    observaciones text,
    CONSTRAINT fk_concdet_conciliacion FOREIGN KEY (conciliacion_id) 
        REFERENCES public.conciliacionbancaria(id) ON DELETE CASCADE,
    CONSTRAINT fk_concdet_pago FOREIGN KEY (pago_id) 
        REFERENCES public.pago(id) ON DELETE SET NULL
);

ALTER TABLE public.conciliaciondetalle OWNER TO postgres;

-- Tabla: auditoria
CREATE TABLE public.auditoria (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    entidad character varying(50) NOT NULL,
    entidadid uuid NOT NULL,
    accion character varying(30) NOT NULL,
    datosanteriores jsonb,
    datosnuevos jsonb,
    usuario_id uuid,
    ip character varying(45),
    useragent text,
    fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL
);

ALTER TABLE public.auditoria OWNER TO postgres;
COMMENT ON TABLE public.auditoria IS 'Log de auditoría de todas las operaciones';

-- Tabla: notificacion
CREATE TABLE public.notificacion (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    tipo character varying(30) NOT NULL,
    destinatario character varying(150) NOT NULL,
    asunto character varying(255),
    mensaje text NOT NULL,
    canal character varying(20) NOT NULL,
    solicitud_id uuid,
    certificado_id uuid,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying,
    intentos integer DEFAULT 0,
    fechaenvio timestamp with time zone,
    fechaleido timestamp with time zone,
    error text,
    fechacreacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_solicitud FOREIGN KEY (solicitud_id) 
        REFERENCES public.solicitud(id) ON DELETE SET NULL,
    CONSTRAINT fk_notif_certificado FOREIGN KEY (certificado_id) 
        REFERENCES public.certificado(id) ON DELETE SET NULL
);

ALTER TABLE public.notificacion OWNER TO postgres;

-- Tabla: verificacion
CREATE TABLE public.verificacion (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    codigovirtual character varying(50) NOT NULL,
    certificado_id uuid,
    fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ip character varying(45),
    useragent text,
    ubicacion character varying(255),
    resultado character varying(30) NOT NULL,
    detalleresultado text,
    tipoconsulta character varying(30),
    CONSTRAINT fk_verificacion_certificado FOREIGN KEY (certificado_id) 
        REFERENCES public.certificado(id) ON DELETE SET NULL
);

ALTER TABLE public.verificacion OWNER TO postgres;

-- Tabla: webhookpago
CREATE TABLE public.webhookpago (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    pasarela_id uuid,
    pago_id uuid,
    evento character varying(50) NOT NULL,
    payload jsonb NOT NULL,
    headers jsonb,
    ip character varying(45),
    procesado boolean DEFAULT false,
    fechaprocesamiento timestamp with time zone,
    error text,
    fecharecepcion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_webhook_pasarela FOREIGN KEY (pasarela_id) 
        REFERENCES public.pasarelapago(id) ON DELETE SET NULL,
    CONSTRAINT fk_webhook_pago FOREIGN KEY (pago_id) 
        REFERENCES public.pago(id) ON DELETE SET NULL
);

ALTER TABLE public.webhookpago OWNER TO postgres;
COMMENT ON TABLE public.webhookpago IS 'Log de webhooks recibidos de pasarelas de pago';

-- Tabla: parametro
CREATE TABLE public.parametro (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    codigo character varying(50) NOT NULL UNIQUE,
    nombre character varying(100) NOT NULL,
    valor text NOT NULL,
    tipo character varying(30) NOT NULL,
    descripcion text,
    modificable boolean DEFAULT true,
    fechaactualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    usuarioactualizacion_id uuid,
    CONSTRAINT fk_parametro_usuario FOREIGN KEY (usuarioactualizacion_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL
);

ALTER TABLE public.parametro OWNER TO postgres;

-- Tabla: permiso
CREATE TABLE public.permiso (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    codigo character varying(50) NOT NULL UNIQUE,
    nombre character varying(100) NOT NULL,
    modulo character varying(50) NOT NULL,
    activo boolean DEFAULT true
);

ALTER TABLE public.permiso OWNER TO postgres;

-- Tabla: rol
CREATE TABLE public.rol (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    institucion_id uuid,
    codigo character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    nivel integer NOT NULL,
    activo boolean DEFAULT true,
    CONSTRAINT rol_institucion_id_codigo_key UNIQUE (institucion_id, codigo),
    CONSTRAINT fk_rol_institucion FOREIGN KEY (institucion_id) 
        REFERENCES public.configuracioninstitucion(id) ON DELETE CASCADE
);

ALTER TABLE public.rol OWNER TO postgres;

-- Tabla: rolpermiso
CREATE TABLE public.rolpermiso (
    rol_id uuid NOT NULL,
    permiso_id uuid NOT NULL,
    PRIMARY KEY (rol_id, permiso_id),
    CONSTRAINT fk_rolperm_rol FOREIGN KEY (rol_id) 
        REFERENCES public.rol(id) ON DELETE CASCADE,
    CONSTRAINT fk_rolperm_permiso FOREIGN KEY (permiso_id) 
        REFERENCES public.permiso(id) ON DELETE CASCADE
);

ALTER TABLE public.rolpermiso OWNER TO postgres;

-- Tabla: usuariorol
CREATE TABLE public.usuariorol (
    usuario_id uuid NOT NULL,
    rol_id uuid NOT NULL,
    fechaasignacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    activo boolean DEFAULT true,
    usuarioasigno_id uuid,
    PRIMARY KEY (usuario_id, rol_id),
    CONSTRAINT fk_usurol_usuario FOREIGN KEY (usuario_id) 
        REFERENCES public.usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_usurol_rol FOREIGN KEY (rol_id) 
        REFERENCES public.rol(id) ON DELETE CASCADE,
    CONSTRAINT fk_usurol_asignador FOREIGN KEY (usuarioasigno_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL
);

ALTER TABLE public.usuariorol OWNER TO postgres;

-- Tabla: institucionusuario
CREATE TABLE public.institucionusuario (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    institucion_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    esadministrador boolean DEFAULT false,
    activo boolean DEFAULT true,
    fechaasignacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    usuarioasigno_id uuid,
    CONSTRAINT institucionusuario_institucion_id_usuario_id_key UNIQUE (institucion_id, usuario_id),
    CONSTRAINT fk_instuser_institucion FOREIGN KEY (institucion_id) 
        REFERENCES public.configuracioninstitucion(id) ON DELETE CASCADE,
    CONSTRAINT fk_instuser_usuario FOREIGN KEY (usuario_id) 
        REFERENCES public.usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_instuser_asignador FOREIGN KEY (usuarioasigno_id) 
        REFERENCES public.usuario(id) ON DELETE SET NULL
);

ALTER TABLE public.institucionusuario OWNER TO postgres;
COMMENT ON TABLE public.institucionusuario IS 'Relación entre usuarios e instituciones que administran';

-- Tabla: sesion
CREATE TABLE public.sesion (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    usuario_id uuid NOT NULL,
    token text NOT NULL UNIQUE,
    ip character varying(45),
    useragent text,
    fechainicio timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fechaexpiracion timestamp with time zone NOT NULL,
    fechacierre timestamp with time zone,
    activa boolean DEFAULT true,
    CONSTRAINT sesion_check CHECK ((fechaexpiracion > fechainicio)),
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id) 
        REFERENCES public.usuario(id) ON DELETE CASCADE
);

ALTER TABLE public.sesion OWNER TO postgres;

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índices para actafisica
CREATE INDEX idx_acta_libro ON public.actafisica USING btree (libro_id);
CREATE INDEX idx_acta_libro_folio ON public.actafisica USING btree (libro_id, folio);
CREATE INDEX idx_acta_anio ON public.actafisica USING btree (aniolectivo_id);
CREATE INDEX idx_acta_grado ON public.actafisica USING btree (grado_id);
CREATE INDEX idx_acta_tipo ON public.actafisica USING btree (tipo);
CREATE INDEX idx_acta_estado ON public.actafisica USING btree (estado);
CREATE INDEX idx_acta_numero ON public.actafisica USING btree (numero);
CREATE INDEX idx_acta_hash ON public.actafisica USING btree (hasharchivo);
CREATE INDEX idx_acta_procesado ON public.actafisica USING btree (procesadoconia);
CREATE INDEX idx_acta_solicitud ON public.actafisica USING btree (solicitud_id);
CREATE INDEX idx_acta_json ON public.actafisica USING gin (datosextraidosjson);
CREATE INDEX idx_acta_fechasubida ON public.actafisica USING btree (fechasubida DESC);
CREATE INDEX idx_acta_calidad ON public.actafisica USING btree (calidad_ocr);
CREATE INDEX idx_acta_pendiente_procesar ON public.actafisica USING btree (procesadoconia, fechasubida) WHERE (procesadoconia = false);

-- Índices para aniolectivo
CREATE INDEX idx_anio_inst_activo ON public.aniolectivo USING btree (institucion_id, activo) WHERE (activo = true);
CREATE INDEX idx_anio_inst_anio ON public.aniolectivo USING btree (institucion_id, anio DESC);
CREATE INDEX idx_anio_institucion ON public.aniolectivo USING btree (institucion_id);

-- Índices para areacurricular
CREATE INDEX idx_area_inst_activo ON public.areacurricular USING btree (institucion_id) WHERE (activo = true);
CREATE INDEX idx_area_inst_codigo ON public.areacurricular USING btree (institucion_id, codigo);
CREATE INDEX idx_area_institucion ON public.areacurricular USING btree (institucion_id);
CREATE INDEX idx_area_orden ON public.areacurricular USING btree (orden);

-- Índices para auditoria
CREATE INDEX idx_auditoria_accion ON public.auditoria USING btree (accion);
CREATE INDEX idx_auditoria_entidad ON public.auditoria USING btree (entidad, entidadid);
CREATE INDEX idx_auditoria_fecha ON public.auditoria USING btree (fecha DESC);
CREATE INDEX idx_auditoria_usuario ON public.auditoria USING btree (usuario_id);

-- Índices para certificado
CREATE INDEX idx_certificado_codigovirtual ON public.certificado USING btree (codigovirtual);
CREATE INDEX idx_certificado_estado ON public.certificado USING btree (estado);
CREATE INDEX idx_certificado_estudiante ON public.certificado USING btree (estudiante_id);
CREATE INDEX idx_certificado_estudiante_estado ON public.certificado USING btree (estudiante_id, estado);
CREATE INDEX idx_certificado_fechaemision ON public.certificado USING btree (fechaemision DESC);
CREATE INDEX idx_certificado_institucion ON public.certificado USING btree (institucion_id);
CREATE INDEX idx_certificado_numero ON public.certificado USING btree (numero);

-- Índices para certificadodetalle
CREATE INDEX idx_certdet_anio ON public.certificadodetalle USING btree (aniolectivo_id);
CREATE INDEX idx_certdet_certificado ON public.certificadodetalle USING btree (certificado_id);
CREATE INDEX idx_certdet_grado ON public.certificadodetalle USING btree (grado_id);

-- Índices para certificadonota
CREATE INDEX idx_certnota_area ON public.certificadonota USING btree (area_id);
CREATE INDEX idx_certnota_detalle ON public.certificadonota USING btree (certificadodetalle_id);

-- Índices para conciliacionbancaria
CREATE INDEX idx_conciliacion_banco ON public.conciliacionbancaria USING btree (entidadbancaria);
CREATE INDEX idx_conciliacion_estado ON public.conciliacionbancaria USING btree (estado);
CREATE INDEX idx_conciliacion_fecha ON public.conciliacionbancaria USING btree (fechaconciliacion DESC);
CREATE INDEX idx_conciliacion_institucion ON public.conciliacionbancaria USING btree (institucion_id);

-- Índices para conciliaciondetalle
CREATE INDEX idx_concdet_conciliacion ON public.conciliaciondetalle USING btree (conciliacion_id);
CREATE INDEX idx_concdet_operacion ON public.conciliaciondetalle USING btree (numerooperacion);
CREATE INDEX idx_concdet_pago ON public.conciliaciondetalle USING btree (pago_id);
CREATE INDEX idx_concdet_pendiente ON public.conciliaciondetalle USING btree (conciliado) WHERE (conciliado = false);

-- Índices para configuracioninstitucion
CREATE INDEX idx_institucion_activo ON public.configuracioninstitucion USING btree (activo) WHERE (activo = true);
CREATE INDEX idx_institucion_codigo ON public.configuracioninstitucion USING btree (codigomodular);
CREATE UNIQUE INDEX idx_unica_institucion_activa ON public.configuracioninstitucion USING btree (activo) WHERE (activo = true);

-- Índices para curriculogrado
CREATE INDEX idx_curriculo_anio ON public.curriculogrado USING btree (aniolectivo_id);
CREATE INDEX idx_curriculo_area ON public.curriculogrado USING btree (area_id);
CREATE INDEX idx_curriculo_grado ON public.curriculogrado USING btree (grado_id);

-- Índices para estudiante
CREATE INDEX idx_estudiante_apellidos ON public.estudiante USING btree (apellidopaterno, apellidomaterno);
CREATE INDEX idx_estudiante_estado ON public.estudiante USING btree (estado) WHERE ((estado)::text = 'ACTIVO'::text);
CREATE INDEX idx_estudiante_fechanacimiento ON public.estudiante USING btree (fechanacimiento);
CREATE INDEX idx_estudiante_inst_dni ON public.estudiante USING btree (institucion_id, dni);
CREATE INDEX idx_estudiante_institucion ON public.estudiante USING btree (institucion_id);
CREATE INDEX idx_estudiante_nombrecompleto ON public.estudiante USING gin (nombrecompleto public.gin_trgm_ops);

-- Índices para grado
CREATE INDEX idx_grado_inst_activo ON public.grado USING btree (institucion_id) WHERE (activo = true);
CREATE INDEX idx_grado_institucion ON public.grado USING btree (institucion_id);
CREATE INDEX idx_grado_nivel ON public.grado USING btree (nivel_id);

-- Índices para institucionusuario
CREATE INDEX idx_instuser_activo ON public.institucionusuario USING btree (institucion_id, usuario_id) WHERE (activo = true);
CREATE INDEX idx_instuser_institucion ON public.institucionusuario USING btree (institucion_id);
CREATE INDEX idx_instuser_usuario ON public.institucionusuario USING btree (usuario_id);

-- Índices para libro
CREATE INDEX idx_libro_estado ON public.libro USING btree (estado);
CREATE INDEX idx_libro_institucion ON public.libro USING btree (institucion_id);
CREATE INDEX idx_libro_nivel ON public.libro USING btree (nivel_id);
CREATE INDEX idx_libro_tipo ON public.libro USING btree (tipo_acta);
CREATE INDEX idx_libro_anios ON public.libro USING btree (anio_inicio, anio_fin);
CREATE INDEX idx_libro_codigo ON public.libro USING btree (codigo);
CREATE INDEX idx_libro_activo ON public.libro USING btree (activo) WHERE (activo = true);
CREATE INDEX idx_libro_ubicacion ON public.libro USING btree (ubicacion_fisica);
CREATE INDEX idx_libro_inst_nivel_anio ON public.libro USING btree (institucion_id, nivel_id, anio_inicio DESC);

-- Índices para metodopago
CREATE INDEX idx_metodopago_activo ON public.metodopago USING btree (institucion_id) WHERE (activo = true);
CREATE INDEX idx_metodopago_codigo ON public.metodopago USING btree (institucion_id, codigo);
CREATE INDEX idx_metodopago_institucion ON public.metodopago USING btree (institucion_id);
CREATE INDEX idx_metodopago_tipo ON public.metodopago USING btree (tipo);

-- Índices para niveleducativo
CREATE INDEX idx_nivel_activo ON public.niveleducativo USING btree (activo) WHERE (activo = true);
CREATE INDEX idx_nivel_codigo ON public.niveleducativo USING btree (institucion_id, codigo);
CREATE INDEX idx_nivel_institucion ON public.niveleducativo USING btree (institucion_id);

-- Índices para notificacion
CREATE INDEX idx_notif_canal ON public.notificacion USING btree (canal);
CREATE INDEX idx_notif_certificado ON public.notificacion USING btree (certificado_id);
CREATE INDEX idx_notif_destinatario ON public.notificacion USING btree (destinatario);
CREATE INDEX idx_notif_estado ON public.notificacion USING btree (estado);
CREATE INDEX idx_notif_pendientes ON public.notificacion USING btree (estado, fechacreacion) WHERE ((estado)::text = 'PENDIENTE'::text);
CREATE INDEX idx_notif_solicitud ON public.notificacion USING btree (solicitud_id);

-- Índices para pago
CREATE INDEX idx_pago_conciliado ON public.pago USING btree (conciliado) WHERE (conciliado = false);
CREATE INDEX idx_pago_estado ON public.pago USING btree (estado);
CREATE INDEX idx_pago_inst_fecha ON public.pago USING btree (institucion_id, fechapago DESC);
CREATE INDEX idx_pago_institucion ON public.pago USING btree (institucion_id);
CREATE INDEX idx_pago_numerooperacion ON public.pago USING btree (numerooperacion);
CREATE INDEX idx_pago_numeroorden ON public.pago USING btree (numeroorden);

-- Índices para pagodetalle
CREATE INDEX idx_pagodet_celular ON public.pagodetalle USING btree (numerocelular);
CREATE INDEX idx_pagodet_metodo ON public.pagodetalle USING btree (metodopago_id);
CREATE INDEX idx_pagodet_pago ON public.pagodetalle USING btree (pago_id);
CREATE INDEX idx_pagodet_pasarela ON public.pagodetalle USING btree (pasarela);
CREATE INDEX idx_pagodet_transaction ON public.pagodetalle USING btree (transaction_id);

-- Índices para pasarelapago
CREATE INDEX idx_pasarela_activo ON public.pasarelapago USING btree (institucion_id) WHERE (activo = true);
CREATE INDEX idx_pasarela_codigo ON public.pasarelapago USING btree (institucion_id, codigo);
CREATE INDEX idx_pasarela_institucion ON public.pasarelapago USING btree (institucion_id);

-- Índices para rol
CREATE INDEX idx_rol_activo ON public.rol USING btree (institucion_id) WHERE (activo = true);
CREATE INDEX idx_rol_codigo ON public.rol USING btree (institucion_id, codigo);
CREATE INDEX idx_rol_institucion ON public.rol USING btree (institucion_id);

-- Índices para sesion
CREATE INDEX idx_sesion_activa ON public.sesion USING btree (activa, fechaexpiracion) WHERE (activa = true);
CREATE INDEX idx_sesion_token ON public.sesion USING btree (token);
CREATE INDEX idx_sesion_usuario ON public.sesion USING btree (usuario_id);

-- Índices para solicitud
CREATE INDEX idx_solicitud_certificado ON public.solicitud USING btree (certificado_id);
CREATE INDEX idx_solicitud_estado ON public.solicitud USING btree (estado);
CREATE INDEX idx_solicitud_estudiante ON public.solicitud USING btree (estudiante_id);
CREATE INDEX idx_solicitud_estudiante_estado ON public.solicitud USING btree (estudiante_id, estado);
CREATE INDEX idx_solicitud_fechasolicitud ON public.solicitud USING btree (fechasolicitud DESC);
CREATE INDEX idx_solicitud_numeroexpediente ON public.solicitud USING btree (numeroexpediente);
CREATE INDEX idx_solicitud_pago ON public.solicitud USING btree (pago_id);
CREATE INDEX idx_solicitud_prioridad ON public.solicitud USING btree (prioridad) WHERE ((estado)::text <> ALL ((ARRAY['ENTREGADA'::character varying, 'RECHAZADA'::character varying])::text[]));
CREATE INDEX idx_solicitud_tipo ON public.solicitud USING btree (tiposolicitud_id);

-- Índices para solicitudhistorial
CREATE INDEX idx_solhist_fecha ON public.solicitudhistorial USING btree (fecha DESC);
CREATE INDEX idx_solhist_solicitud ON public.solicitudhistorial USING btree (solicitud_id);

-- Índices para tiposolicitud
CREATE INDEX idx_tiposol_activo ON public.tiposolicitud USING btree (institucion_id) WHERE (activo = true);
CREATE INDEX idx_tiposol_codigo ON public.tiposolicitud USING btree (institucion_id, codigo);
CREATE INDEX idx_tiposol_institucion ON public.tiposolicitud USING btree (institucion_id);

-- Índices para usuario
CREATE INDEX idx_usuario_activo ON public.usuario USING btree (activo) WHERE (activo = true);
CREATE INDEX idx_usuario_bloqueado ON public.usuario USING btree (bloqueado) WHERE (bloqueado = true);
CREATE INDEX idx_usuario_dni ON public.usuario USING btree (dni);
CREATE INDEX idx_usuario_email ON public.usuario USING btree (email);
CREATE INDEX idx_usuario_username ON public.usuario USING btree (username);

-- Índices para usuariorol
CREATE INDEX idx_usurol_activo ON public.usuariorol USING btree (activo) WHERE (activo = true);
CREATE INDEX idx_usurol_rol ON public.usuariorol USING btree (rol_id);
CREATE INDEX idx_usurol_usuario ON public.usuariorol USING btree (usuario_id);

-- Índices para verificacion
CREATE INDEX idx_verificacion_certificado ON public.verificacion USING btree (certificado_id);
CREATE INDEX idx_verificacion_codigo ON public.verificacion USING btree (codigovirtual);
CREATE INDEX idx_verificacion_fecha ON public.verificacion USING btree (fecha DESC);
CREATE INDEX idx_verificacion_ip ON public.verificacion USING btree (ip);
CREATE INDEX idx_verificacion_resultado ON public.verificacion USING btree (resultado);

-- Índices para webhookpago
CREATE INDEX idx_webhook_fecha ON public.webhookpago USING btree (fecharecepcion DESC);
CREATE INDEX idx_webhook_pago ON public.webhookpago USING btree (pago_id);
CREATE INDEX idx_webhook_pasarela ON public.webhookpago USING btree (pasarela_id);
CREATE INDEX idx_webhook_pendiente ON public.webhookpago USING btree (procesado, fecharecepcion) WHERE (procesado = false);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trg_certificado_validar_institucion 
    BEFORE INSERT OR UPDATE ON public.certificado 
    FOR EACH ROW EXECUTE FUNCTION public.validar_estudiante_institucion();

CREATE TRIGGER trg_config_actualizar 
    BEFORE UPDATE ON public.configuracioninstitucion 
    FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();

CREATE TRIGGER trg_estudiante_actualizar 
    BEFORE UPDATE ON public.estudiante 
    FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();

CREATE TRIGGER trg_notificacion_intentos 
    BEFORE UPDATE ON public.notificacion 
    FOR EACH ROW EXECUTE FUNCTION public.incrementar_intentos_notificacion();

CREATE TRIGGER trg_pago_calcular_neto 
    BEFORE INSERT OR UPDATE ON public.pago 
    FOR EACH ROW EXECUTE FUNCTION public.calcular_monto_neto_pago();

CREATE TRIGGER trg_pago_orden 
    BEFORE INSERT ON public.pago 
    FOR EACH ROW EXECUTE FUNCTION public.generar_numero_orden();

CREATE TRIGGER trg_pagodetalle_validar_monto 
    BEFORE INSERT OR UPDATE ON public.pagodetalle 
    FOR EACH ROW EXECUTE FUNCTION public.validar_monto_pago_detalle();

CREATE TRIGGER trg_parametro_actualizar 
    BEFORE UPDATE ON public.parametro 
    FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();

CREATE TRIGGER trg_solicitud_actualizar 
    BEFORE UPDATE ON public.solicitud 
    FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();

CREATE TRIGGER trg_solicitud_expediente 
    BEFORE INSERT ON public.solicitud 
    FOR EACH ROW EXECUTE FUNCTION public.generar_numero_expediente();

CREATE TRIGGER trg_solicitud_historial 
    AFTER UPDATE ON public.solicitud 
    FOR EACH ROW EXECUTE FUNCTION public.registrar_historial_solicitud();

CREATE TRIGGER trg_usuario_actualizar 
    BEFORE UPDATE ON public.usuario 
    FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();

CREATE TRIGGER trg_usuario_bloqueo 
    BEFORE UPDATE ON public.usuario 
    FOR EACH ROW EXECUTE FUNCTION public.bloquear_usuario_intentos();

CREATE TRIGGER trg_verificacion_validar 
    BEFORE INSERT ON public.verificacion 
    FOR EACH ROW EXECUTE FUNCTION public.validar_certificado_activo();

CREATE TRIGGER trg_actafisica_validar_folio 
    BEFORE INSERT OR UPDATE ON public.actafisica 
    FOR EACH ROW EXECUTE FUNCTION public.validar_folio_libro();

CREATE TRIGGER trg_actafisica_actualizar_libro 
    AFTER INSERT OR DELETE ON public.actafisica 
    FOR EACH ROW EXECUTE FUNCTION public.actualizar_folios_libro();

CREATE TRIGGER trg_libro_actualizar 
    BEFORE UPDATE ON public.libro 
    FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();

-- =====================================================
-- VISTA MATERIALIZADA
-- =====================================================

CREATE MATERIALIZED VIEW public.mv_estadisticas_certificados AS
 SELECT institucion_id,
    EXTRACT(year FROM fechaemision) AS anio,
    EXTRACT(month FROM fechaemision) AS mes,
    estado,
    count(*) AS total,
    avg(promediogeneral) AS promedio_general
   FROM public.certificado c
  GROUP BY institucion_id, (EXTRACT(year FROM fechaemision)), (EXTRACT(month FROM fechaemision)), estado
  WITH NO DATA;

ALTER MATERIALIZED VIEW public.mv_estadisticas_certificados OWNER TO postgres;

CREATE INDEX idx_mv_stats_cert_institucion ON public.mv_estadisticas_certificados USING btree (institucion_id);
CREATE UNIQUE INDEX idx_mv_stats_cert_unique ON public.mv_estadisticas_certificados USING btree (institucion_id, anio, mes, estado);

-- Vista para consulta de actas con información de libro
CREATE OR REPLACE VIEW public.v_actas_completo AS
SELECT 
    a.id,
    a.numero,
    a.folio,
    a.tipo,
    a.estado,
    a.fechaemision,
    a.fechasubida,
    a.procesadoconia,
    a.calidad_ocr,
    a.confianza_ia,
    a.urlarchivo,
    -- Información del libro
    l.id AS libro_id,
    l.codigo AS libro_codigo,
    l.nombre AS libro_nombre,
    l.ubicacion_fisica AS libro_ubicacion,
    l.estado AS libro_estado,
    -- Información del año lectivo
    al.anio AS anio,
    -- Información del grado
    g.nombre AS grado_nombre,
    g.numero AS grado_numero,
    -- Información del nivel
    n.nombre AS nivel_nombre,
    -- Información de sección
    a.seccion,
    a.turno,
    -- Información de procesamiento
    a.datosextraidosjson,
    a.observaciones
FROM public.actafisica a
INNER JOIN public.libro l ON a.libro_id = l.id
INNER JOIN public.aniolectivo al ON a.aniolectivo_id = al.id
INNER JOIN public.grado g ON a.grado_id = g.id
LEFT JOIN public.niveleducativo n ON l.nivel_id = n.id;

ALTER VIEW public.v_actas_completo OWNER TO postgres;
COMMENT ON VIEW public.v_actas_completo IS 'Vista consolidada de actas físicas con información de libro, año, grado y nivel';

-- Vista para estadísticas de libros
CREATE OR REPLACE VIEW public.v_estadisticas_libros AS
SELECT 
    l.id,
    l.codigo,
    l.nombre,
    l.tipo_acta,
    l.estado,
    l.anio_inicio,
    l.anio_fin,
    l.total_folios,
    l.folios_utilizados,
    CASE 
        WHEN l.total_folios > 0 THEN ROUND((l.folios_utilizados::numeric / l.total_folios::numeric) * 100, 2)
        ELSE 0
    END AS porcentaje_uso,
    l.ubicacion_fisica,
    n.nombre AS nivel_nombre,
    i.nombre AS institucion_nombre,
    COUNT(a.id) AS total_actas,
    COUNT(CASE WHEN a.procesadoconia = true THEN 1 END) AS actas_procesadas,
    COUNT(CASE WHEN a.procesadoconia = false THEN 1 END) AS actas_pendientes,
    MIN(a.fechasubida) AS primera_acta_fecha,
    MAX(a.fechasubida) AS ultima_acta_fecha
FROM public.libro l
INNER JOIN public.configuracioninstitucion i ON l.institucion_id = i.id
LEFT JOIN public.niveleducativo n ON l.nivel_id = n.id
LEFT JOIN public.actafisica a ON l.id = a.libro_id
GROUP BY 
    l.id, l.codigo, l.nombre, l.tipo_acta, l.estado, 
    l.anio_inicio, l.anio_fin, l.total_folios, l.folios_utilizados,
    l.ubicacion_fisica, n.nombre, i.nombre;

ALTER VIEW public.v_estadisticas_libros OWNER TO postgres;
COMMENT ON VIEW public.v_estadisticas_libros IS 'Estadísticas de uso y estado de libros de actas';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- PostgreSQL database dump complete

