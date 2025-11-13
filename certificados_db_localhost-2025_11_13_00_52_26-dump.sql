--
-- PostgreSQL database dump
--

\restrict thI6PsNGn38fzVwLwo9EMokmCB6ogUppNgdx6NviS1kDumOHU4XFguNwKGVygq0

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: actualizar_fecha_modificacion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_fecha_modificacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.fechaActualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_fecha_modificacion() OWNER TO postgres;

--
-- Name: bloquear_usuario_intentos(); Type: FUNCTION; Schema: public; Owner: postgres
--

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

--
-- Name: calcular_edad(date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_edad(fecha_nac date) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(fecha_nac));
END;
$$;


ALTER FUNCTION public.calcular_edad(fecha_nac date) OWNER TO postgres;

--
-- Name: calcular_monto_neto_pago(); Type: FUNCTION; Schema: public; Owner: postgres
--

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

--
-- Name: estadisticas_acta_normalizada(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.estadisticas_acta_normalizada(p_acta_id uuid) RETURNS TABLE(total_estudiantes integer, total_notas integer, notas_por_estudiante numeric, areas_registradas integer, fecha_normalizacion timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.estadisticas_acta_normalizada(p_acta_id uuid) OWNER TO postgres;

--
-- Name: generar_codigo_matricula(); Type: FUNCTION; Schema: public; Owner: postgres
--

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

--
-- Name: generar_numero_expediente(); Type: FUNCTION; Schema: public; Owner: postgres
--

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

--
-- Name: generar_numero_orden(); Type: FUNCTION; Schema: public; Owner: postgres
--

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

--
-- Name: incrementar_intentos_notificacion(); Type: FUNCTION; Schema: public; Owner: postgres
--

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

--
-- Name: limpiar_sesiones_expiradas(); Type: FUNCTION; Schema: public; Owner: postgres
--

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

--
-- Name: obtener_institucion_default(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.obtener_institucion_default() RETURNS uuid
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    inst_id UUID;
BEGIN
    -- Retorna la Ãºnica instituciÃ³n activa
    SELECT id INTO inst_id
    FROM ConfiguracionInstitucion
    WHERE activo = true
    LIMIT 1;
    
    IF inst_id IS NULL THEN
        RAISE EXCEPTION 'No hay ninguna instituciÃ³n configurada. Debe crear una en ConfiguracionInstitucion';
    END IF;
    
    RETURN inst_id;
END;
$$;


ALTER FUNCTION public.obtener_institucion_default() OWNER TO postgres;

--
-- Name: obtener_institucion_sesion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.obtener_institucion_sesion() RETURNS uuid
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN obtener_institucion_default();
END;
$$;


ALTER FUNCTION public.obtener_institucion_sesion() OWNER TO postgres;

--
-- Name: refrescar_estadisticas(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.refrescar_estadisticas() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_certificados;
END;
$$;


ALTER FUNCTION public.refrescar_estadisticas() OWNER TO postgres;

--
-- Name: registrar_historial_solicitud(); Type: FUNCTION; Schema: public; Owner: postgres
--

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

--
-- Name: tiene_notas_en_periodo(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.tiene_notas_en_periodo(p_estudiante_id uuid, p_anio integer, p_grado_numero integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.tiene_notas_en_periodo(p_estudiante_id uuid, p_anio integer, p_grado_numero integer) OWNER TO postgres;

--
-- Name: validar_acta_antes_normalizar(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_acta_antes_normalizar() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.validar_acta_antes_normalizar() OWNER TO postgres;

--
-- Name: validar_capacidad_seccion(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
            RAISE EXCEPTION 'La secciÃ³n ha alcanzado su capacidad mÃ¡xima de % estudiantes', capacidad_maxima;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validar_capacidad_seccion() OWNER TO postgres;

--
-- Name: validar_certificado_activo(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
        NEW.detalleResultado := 'CÃ³digo de certificado no encontrado';
    ELSE
        NEW.resultado := 'VALIDO';
        NEW.detalleResultado := 'Certificado vÃ¡lido y activo';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validar_certificado_activo() OWNER TO postgres;

--
-- Name: validar_consistencia_institucion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_consistencia_institucion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    anio_inst_id UUID;
    grado_inst_id UUID;
BEGIN
    -- Validar que aÃ±o lectivo y grado sean de la misma instituciÃ³n
    SELECT institucion_id INTO anio_inst_id FROM AnioLectivo WHERE id = NEW.anioLectivo_id;
    SELECT institucion_id INTO grado_inst_id FROM Grado WHERE id = NEW.grado_id;
    
    IF anio_inst_id != grado_inst_id THEN
        RAISE EXCEPTION 'El aÃ±o lectivo y grado deben pertenecer a la misma instituciÃ³n';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validar_consistencia_institucion() OWNER TO postgres;

--
-- Name: validar_estudiante_institucion(); Type: FUNCTION; Schema: public; Owner: postgres
--

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

--
-- Name: validar_monto_pago_detalle(); Type: FUNCTION; Schema: public; Owner: postgres
--

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actaestudiante; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actaestudiante (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    acta_id uuid NOT NULL,
    estudiante_id uuid NOT NULL,
    numero_orden integer NOT NULL,
    situacion_final character varying(50),
    observaciones text,
    fecha_registro timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.actaestudiante OWNER TO postgres;

--
-- Name: actafisica; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actafisica (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero character varying(50) NOT NULL,
    tipo character varying(30) NOT NULL,
    aniolectivo_id uuid NOT NULL,
    grado_id uuid NOT NULL,
    fechaemision date,
    folio character varying(50),
    nombrearchivo character varying(255),
    urlarchivo text,
    hasharchivo character varying(64),
    procesadoconia boolean DEFAULT false,
    fechaprocesamiento timestamp with time zone,
    datosextraidosjson jsonb,
    urlexcelexportado text,
    fechaexportacionexcel timestamp with time zone,
    observaciones text,
    usuariosubida_id uuid,
    fechasubida timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(30) DEFAULT 'DISPONIBLE'::character varying,
    seccion character varying(10),
    solicitud_id uuid,
    tipoevaluacion character varying(50),
    turno character varying(20),
    libro_id uuid,
    tamanoarchivo_kb integer,
    calidad_ocr character varying(20),
    confianza_ia numeric(5,2),
    fecha_normalizacion timestamp(6) with time zone,
    normalizada boolean DEFAULT false
);


ALTER TABLE public.actafisica OWNER TO postgres;

--
-- Name: TABLE actafisica; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.actafisica IS 'Actas fÃ­sicas escaneadas y procesadas con IA (OCR) - Vinculadas a libros de actas. La ubicaciÃ³n fÃ­sica estÃ¡ en la tabla libro.';


--
-- Name: COLUMN actafisica.datosextraidosjson; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actafisica.datosextraidosjson IS 'Datos extraÃ­dos por Gemini AI en formato JSON';


--
-- Name: actanota; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actanota (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    acta_estudiante_id uuid NOT NULL,
    area_id uuid NOT NULL,
    nota integer,
    nota_literal character varying(50),
    es_exonerado boolean DEFAULT false,
    nombre_area_ocr character varying(150),
    confianza_ocr numeric(5,2),
    orden integer NOT NULL,
    fecha_registro timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.actanota OWNER TO postgres;

--
-- Name: aniolectivo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aniolectivo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    anio integer NOT NULL,
    fechainicio date NOT NULL,
    fechafin date NOT NULL,
    activo boolean DEFAULT false,
    observaciones text,
    CONSTRAINT aniolectivo_check CHECK ((fechafin > fechainicio))
);


ALTER TABLE public.aniolectivo OWNER TO postgres;

--
-- Name: areacurricular; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.areacurricular (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institucion_id uuid,
    codigo character varying(20) NOT NULL,
    nombre character varying(150) NOT NULL,
    orden integer NOT NULL,
    escompetenciatransversal boolean DEFAULT false,
    activo boolean DEFAULT true
);


ALTER TABLE public.areacurricular OWNER TO postgres;

--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditoria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entidad character varying(50) NOT NULL,
    entidadid uuid NOT NULL,
    accion character varying(30) NOT NULL,
    datosanteriores jsonb,
    datosnuevos jsonb,
    usuario_id uuid,
    ip character varying(45),
    useragent text,
    fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.auditoria OWNER TO postgres;

--
-- Name: TABLE auditoria; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.auditoria IS 'Log de auditorÃ­a de todas las operaciones';


--
-- Name: certificado; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.certificado (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    codigovirtual character varying(50) NOT NULL,
    numero character varying(50),
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
    CONSTRAINT certificado_promediogeneral_check CHECK (((promediogeneral IS NULL) OR ((promediogeneral >= (0)::numeric) AND (promediogeneral <= (20)::numeric))))
);


ALTER TABLE public.certificado OWNER TO postgres;

--
-- Name: TABLE certificado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.certificado IS 'Certificados de estudios emitidos por instituciÃ³n';


--
-- Name: COLUMN certificado.codigovirtual; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.certificado.codigovirtual IS 'CÃ³digo Ãºnico para verificaciÃ³n online';


--
-- Name: COLUMN certificado.hashpdf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.certificado.hashpdf IS 'SHA-256 del PDF para verificaciÃ³n de integridad';


--
-- Name: certificadodetalle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.certificadodetalle (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    certificado_id uuid NOT NULL,
    aniolectivo_id uuid NOT NULL,
    grado_id uuid NOT NULL,
    situacionfinal character varying(50),
    observaciones text,
    orden integer NOT NULL
);


ALTER TABLE public.certificadodetalle OWNER TO postgres;

--
-- Name: certificadonota; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.certificadonota (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    certificadodetalle_id uuid NOT NULL,
    area_id uuid NOT NULL,
    nota integer,
    notaliteral character varying(50),
    esexonerado boolean DEFAULT false,
    orden integer NOT NULL,
    CONSTRAINT certificadonota_nota_check CHECK (((nota >= 0) AND (nota <= 20)))
);


ALTER TABLE public.certificadonota OWNER TO postgres;

--
-- Name: conciliacionbancaria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conciliacionbancaria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    fechacreacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.conciliacionbancaria OWNER TO postgres;

--
-- Name: TABLE conciliacionbancaria; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.conciliacionbancaria IS 'Proceso de conciliaciÃ³n bancaria';


--
-- Name: conciliaciondetalle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conciliaciondetalle (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conciliacion_id uuid NOT NULL,
    pago_id uuid,
    numerooperacion character varying(50),
    fechatransaccion date,
    monto numeric(10,2),
    conciliado boolean DEFAULT false,
    diferencia numeric(10,2),
    observaciones text
);


ALTER TABLE public.conciliaciondetalle OWNER TO postgres;

--
-- Name: configuracioninstitucion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configuracioninstitucion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigomodular character varying(20) NOT NULL,
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

--
-- Name: TABLE configuracioninstitucion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.configuracioninstitucion IS 'ConfiguraciÃ³n de instituciones educativas (multi-tenant)';


--
-- Name: curriculogrado; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.curriculogrado (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    area_id uuid NOT NULL,
    grado_id uuid NOT NULL,
    aniolectivo_id uuid NOT NULL,
    orden integer NOT NULL,
    activo boolean DEFAULT true
);


ALTER TABLE public.curriculogrado OWNER TO postgres;

--
-- Name: estudiante; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.estudiante (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    CONSTRAINT estudiante_sexo_check CHECK ((sexo = ANY (ARRAY['M'::bpchar, 'H'::bpchar])))
);


ALTER TABLE public.estudiante OWNER TO postgres;

--
-- Name: TABLE estudiante; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.estudiante IS 'Registro de estudiantes por instituciÃ³n';


--
-- Name: COLUMN estudiante.institucion_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.estudiante.institucion_id IS 'InstituciÃ³n a la que pertenece el estudiante';


--
-- Name: COLUMN estudiante.sexo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.estudiante.sexo IS 'M=Mujer, H=Hombre';


--
-- Name: grado; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grado (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    nivel_id uuid,
    numero integer NOT NULL,
    nombre character varying(50) NOT NULL,
    nombrecorto character varying(20),
    orden integer NOT NULL,
    activo boolean DEFAULT true,
    CONSTRAINT grado_numero_check CHECK (((numero >= 1) AND (numero <= 10)))
);


ALTER TABLE public.grado OWNER TO postgres;

--
-- Name: institucionusuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.institucionusuario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institucion_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    esadministrador boolean DEFAULT false,
    activo boolean DEFAULT true,
    fechaasignacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    usuarioasigno_id uuid
);


ALTER TABLE public.institucionusuario OWNER TO postgres;

--
-- Name: TABLE institucionusuario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.institucionusuario IS 'RelaciÃ³n entre usuarios e instituciones que administran';


--
-- Name: libro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.libro (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    codigo character varying(50) NOT NULL,
    descripcion character varying(255),
    ubicacion_fisica character varying(255),
    anio_inicio integer,
    anio_fin integer,
    total_folios integer,
    estado character varying(20) DEFAULT 'ACTIVO'::character varying,
    observaciones text,
    fecha_creacion timestamp(6) with time zone DEFAULT now(),
    activo boolean DEFAULT true,
    nivel_id uuid,
    nombre character varying(255),
    tipo_acta character varying(30),
    folio_inicio integer DEFAULT 1,
    folio_fin integer,
    folios_utilizados integer DEFAULT 0,
    estante character varying(50),
    seccion_archivo character varying(50)
);


ALTER TABLE public.libro OWNER TO postgres;

--
-- Name: TABLE libro; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.libro IS 'Inventario de libros físicos de actas (1985-2012)';


--
-- Name: COLUMN libro.codigo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.libro.codigo IS 'Código del libro (ej: 1, 2, 3A)';


--
-- Name: COLUMN libro.estado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.libro.estado IS 'Estado: ACTIVO, ARCHIVADO, DETERIORADO, PERDIDO';


--
-- Name: metodopago; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metodopago (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institucion_id uuid NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo character varying(30) NOT NULL,
    descripcion text,
    requierevalidacion boolean DEFAULT true,
    comisionporcentaje numeric(5,2),
    comisionfija numeric(10,2),
    activo boolean DEFAULT true,
    configuracion jsonb
);


ALTER TABLE public.metodopago OWNER TO postgres;

--
-- Name: TABLE metodopago; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.metodopago IS 'MÃ©todos de pago configurados por instituciÃ³n (Yape, POS, Tarjeta, etc)';


--
-- Name: mv_estadisticas_certificados; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

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

--
-- Name: niveleducativo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.niveleducativo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    orden integer NOT NULL,
    activo boolean DEFAULT true
);


ALTER TABLE public.niveleducativo OWNER TO postgres;

--
-- Name: TABLE niveleducativo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.niveleducativo IS 'Niveles educativos por instituciÃ³n (Inicial, Primaria, Secundaria)';


--
-- Name: notificacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificacion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    fechacreacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notificacion OWNER TO postgres;

--
-- Name: pago; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pago (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    numeroorden character varying(50) NOT NULL,
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
    CONSTRAINT pago_monto_check CHECK ((monto > (0)::numeric))
);


ALTER TABLE public.pago OWNER TO postgres;

--
-- Name: pagodetalle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pagodetalle (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    CONSTRAINT pagodetalle_monto_check CHECK ((monto > (0)::numeric))
);


ALTER TABLE public.pagodetalle OWNER TO postgres;

--
-- Name: TABLE pagodetalle; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pagodetalle IS 'Detalle de transacciones por mÃ©todo de pago';


--
-- Name: COLUMN pagodetalle.numerocelular; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagodetalle.numerocelular IS 'NÃºmero celular para pagos Yape/Plin';


--
-- Name: COLUMN pagodetalle.terminal_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagodetalle.terminal_id IS 'ID del terminal POS';


--
-- Name: COLUMN pagodetalle.transaction_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagodetalle.transaction_id IS 'ID de transacciÃ³n de la pasarela';


--
-- Name: COLUMN pagodetalle.responsejson; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagodetalle.responsejson IS 'Respuesta completa de la pasarela de pago';


--
-- Name: parametro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parametro (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(50) NOT NULL,
    nombre character varying(100) NOT NULL,
    valor text NOT NULL,
    tipo character varying(30) NOT NULL,
    descripcion text,
    modificable boolean DEFAULT true,
    fechaactualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    usuarioactualizacion_id uuid
);


ALTER TABLE public.parametro OWNER TO postgres;

--
-- Name: pasarelapago; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pasarelapago (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    fechaactualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pasarelapago OWNER TO postgres;

--
-- Name: TABLE pasarelapago; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pasarelapago IS 'ConfiguraciÃ³n de pasarelas de pago (Niubiz, Culqi, MercadoPago)';


--
-- Name: permiso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permiso (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(50) NOT NULL,
    nombre character varying(100) NOT NULL,
    modulo character varying(50) NOT NULL,
    activo boolean DEFAULT true
);


ALTER TABLE public.permiso OWNER TO postgres;

--
-- Name: rol; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rol (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institucion_id uuid,
    codigo character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    nivel integer NOT NULL,
    activo boolean DEFAULT true
);


ALTER TABLE public.rol OWNER TO postgres;

--
-- Name: rolpermiso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rolpermiso (
    rol_id uuid NOT NULL,
    permiso_id uuid NOT NULL
);


ALTER TABLE public.rolpermiso OWNER TO postgres;

--
-- Name: sesion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sesion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    token text NOT NULL,
    ip character varying(45),
    useragent text,
    fechainicio timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fechaexpiracion timestamp with time zone NOT NULL,
    fechacierre timestamp with time zone,
    activa boolean DEFAULT true,
    CONSTRAINT sesion_check CHECK ((fechaexpiracion > fechainicio))
);


ALTER TABLE public.sesion OWNER TO postgres;

--
-- Name: solicitud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitud (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numeroexpediente character varying(50),
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
    fechaactualizacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.solicitud OWNER TO postgres;

--
-- Name: TABLE solicitud; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.solicitud IS 'Solicitudes de trÃ¡mites documentarios';


--
-- Name: solicitudhistorial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitudhistorial (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    solicitud_id uuid NOT NULL,
    estadoanterior character varying(30),
    estadonuevo character varying(30) NOT NULL,
    observaciones text,
    usuario_id uuid,
    fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.solicitudhistorial OWNER TO postgres;

--
-- Name: tiposolicitud; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tiposolicitud (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institucion_id uuid DEFAULT public.obtener_institucion_sesion() NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    requierepago boolean DEFAULT true,
    montobase numeric(10,2),
    tiempoentregadias integer,
    activo boolean DEFAULT true,
    CONSTRAINT tiposolicitud_montobase_check CHECK (((montobase IS NULL) OR (montobase >= (0)::numeric)))
);


ALTER TABLE public.tiposolicitud OWNER TO postgres;

--
-- Name: usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    passwordhash character varying(255) NOT NULL,
    dni character varying(8),
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

--
-- Name: TABLE usuario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.usuario IS 'Usuarios del sistema';


--
-- Name: usuariorol; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuariorol (
    usuario_id uuid NOT NULL,
    rol_id uuid NOT NULL,
    fechaasignacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    activo boolean DEFAULT true,
    usuarioasigno_id uuid
);


ALTER TABLE public.usuariorol OWNER TO postgres;

--
-- Name: v_actas_estudiante; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_actas_estudiante AS
 SELECT e.id AS estudiante_id,
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
   FROM ((((((public.actaestudiante ae
     JOIN public.actafisica af ON ((ae.acta_id = af.id)))
     JOIN public.estudiante e ON ((ae.estudiante_id = e.id)))
     JOIN public.aniolectivo al ON ((af.aniolectivo_id = al.id)))
     JOIN public.grado g ON ((af.grado_id = g.id)))
     LEFT JOIN public.niveleducativo n ON ((g.nivel_id = n.id)))
     LEFT JOIN public.libro l ON ((af.libro_id = l.id)))
  ORDER BY e.nombrecompleto, al.anio, g.numero;


ALTER VIEW public.v_actas_estudiante OWNER TO postgres;

--
-- Name: v_notas_estudiante; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_notas_estudiante AS
 SELECT e.id AS estudiante_id,
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
   FROM (((((((public.actanota an
     JOIN public.actaestudiante ae ON ((an.acta_estudiante_id = ae.id)))
     JOIN public.estudiante e ON ((ae.estudiante_id = e.id)))
     JOIN public.actafisica af ON ((ae.acta_id = af.id)))
     JOIN public.aniolectivo al ON ((af.aniolectivo_id = al.id)))
     JOIN public.grado g ON ((af.grado_id = g.id)))
     JOIN public.areacurricular ac ON ((an.area_id = ac.id)))
     LEFT JOIN public.libro l ON ((af.libro_id = l.id)))
  ORDER BY e.nombrecompleto, al.anio, g.numero, ac.orden;


ALTER VIEW public.v_notas_estudiante OWNER TO postgres;

--
-- Name: verificacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verificacion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigovirtual character varying(50) NOT NULL,
    certificado_id uuid,
    fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ip character varying(45),
    useragent text,
    ubicacion character varying(255),
    resultado character varying(30) NOT NULL,
    detalleresultado text,
    tipoconsulta character varying(30)
);


ALTER TABLE public.verificacion OWNER TO postgres;

--
-- Name: webhookpago; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhookpago (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pasarela_id uuid,
    pago_id uuid,
    evento character varying(50) NOT NULL,
    payload jsonb NOT NULL,
    headers jsonb,
    ip character varying(45),
    procesado boolean DEFAULT false,
    fechaprocesamiento timestamp with time zone,
    error text,
    fecharecepcion timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.webhookpago OWNER TO postgres;

--
-- Name: TABLE webhookpago; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.webhookpago IS 'Log de webhooks recibidos de pasarelas de pago';


--
-- Data for Name: actaestudiante; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actaestudiante (id, acta_id, estudiante_id, numero_orden, situacion_final, observaciones, fecha_registro) FROM stdin;
\.


--
-- Data for Name: actafisica; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actafisica (id, numero, tipo, aniolectivo_id, grado_id, fechaemision, folio, nombrearchivo, urlarchivo, hasharchivo, procesadoconia, fechaprocesamiento, datosextraidosjson, urlexcelexportado, fechaexportacionexcel, observaciones, usuariosubida_id, fechasubida, estado, seccion, solicitud_id, tipoevaluacion, turno, libro_id, tamanoarchivo_kb, calidad_ocr, confianza_ia, fecha_normalizacion, normalizada) FROM stdin;
f46730d3-93c4-4198-8990-4c3e0504cbd4	OCR-LIBRE-20251113045933	OCR_LIBRE	e0ac2d1e-0b62-433d-919b-ca87899bc3e5	c2b3d6ff-c0ce-4932-ac72-5a3f8a48d7d1	\N	5	\N	\N	\N	t	2025-11-12 23:59:33.334-05	{"metadata": {"modelo_ia": "Gemini", "advertencias": [], "procesado_en": "2025-11-13T04:59:33.334Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 30, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 16, "TUTORÍA": 11, "MATEMÁTICA": 15, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 17, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 1, "nombres": "JESÚS", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 15, "TUTORÍA": 17, "MATEMÁTICA": 14, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 18}, "numero": 2, "nombres": "DANTE", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "ALOSILLA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 15, "TUTORÍA": 16, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 3, "nombres": "JOSÉ LUIS", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "COACALLA", "apellidoPaterno": "ANGLES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 14, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 4, "nombres": "JULIÁN", "comportamiento": "13", "situacionFinal": "P", "apellidoMaterno": "ARCATA", "apellidoPaterno": "AQUINO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 15, "TUTORÍA": 15, "MATEMÁTICA": 15, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 5, "nombres": "JESÚS YAMES", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "AYLLON", "apellidoPaterno": "ARAUJO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 15, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 17, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 6, "nombres": "ALEXIS", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "PEREZ", "apellidoPaterno": "ARIAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 7, "nombres": "MIGUEL GABINO", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "ASCARRUNZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 16, "EDUCACIÓN PARA EL TRABAJO": 8, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 8, "nombres": "MARCO ANTONIO", "comportamiento": "16", "situacionFinal": "R", "apellidoMaterno": "PAREDES", "apellidoPaterno": "ATENCIO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 10, "MATEMÁTICA": 15, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 5, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 9, "nombres": "JAVIER", "comportamiento": "13", "situacionFinal": "R", "apellidoMaterno": "VALENCIA", "apellidoPaterno": "AZA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 14, "TUTORÍA": 10, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 9}, "numero": 10, "nombres": "PEDRO", "comportamiento": "14", "situacionFinal": "R", "apellidoMaterno": "PACHARI", "apellidoPaterno": "BARREDA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 11, "TUTORÍA": 14, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 11, "nombres": "LUIS ABRAHAM", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "CANAZA", "apellidoPaterno": "BELTRAN", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 12, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 9, "EDUCACIÓN RELIGIOSA": 17, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 12, "nombres": "ANIBAL AMÉRICO", "comportamiento": "10", "situacionFinal": "R", "apellidoMaterno": "CASTAÑON", "apellidoPaterno": "BELTRAN", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 14, "TUTORÍA": 15, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 13, "nombres": "JAVIER", "comportamiento": "13", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "COLQUE", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 14, "nombres": "JOHNNY WALKER", "comportamiento": "12", "situacionFinal": "P", "apellidoMaterno": "CAHUI", "apellidoPaterno": "COPARI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 11, "TUTORÍA": 15, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 15, "nombres": "JUAN CARLOS", "comportamiento": "13", "situacionFinal": "P", "apellidoMaterno": "CRUZ", "apellidoPaterno": "CUTIPA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 16, "nombres": "JOSÉ ARTURO", "comportamiento": "13", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "CHAIÑA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 13, "TUTORÍA": 10, "MATEMÁTICA": 13, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 17, "nombres": "WILLSON RAYMUNDO", "comportamiento": "12", "situacionFinal": "R", "apellidoMaterno": "ARIAS", "apellidoPaterno": "CHAMBI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 16, "TUTORÍA": 17, "MATEMÁTICA": 16, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 17, "EDUCACIÓN PARA EL TRABAJO": 17, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 18}, "numero": 18, "nombres": "ALFREDO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "TAVERA", "apellidoPaterno": "ENRIQUEZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 14, "TUTORÍA": 15, "MATEMÁTICA": 15, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 19, "nombres": "CÉSAR AUGUSTO", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "BUSTINZA", "apellidoPaterno": "FLORES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 13, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 20, "nombres": "ELVER IHONY", "comportamiento": "11", "situacionFinal": "P", "apellidoMaterno": "TICONA", "apellidoPaterno": "FLORES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 11, "TUTORÍA": 10, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 21, "nombres": "MAGÉN LUIS", "comportamiento": "12", "situacionFinal": "R", "apellidoMaterno": "QUISPE", "apellidoPaterno": "GARCIA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": 13, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 22, "nombres": "WILBER RENÉ", "observaciones": "Nota 'EXO' en la 4ta columna", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "YUCRA", "apellidoPaterno": "GUERRA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 9, "TUTORÍA": 11, "MATEMÁTICA": 8, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 23, "nombres": "EDGAR RUBÉN", "comportamiento": "12", "situacionFinal": "R", "apellidoMaterno": "BELTRAN", "apellidoPaterno": "LOPE", "asignaturasDesaprobadas": 3}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 24, "nombres": "ABILIO", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "ALAVE", "apellidoPaterno": "MAMANI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 16, "TUTORÍA": 15, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 25, "nombres": "MARCO ANTONIO", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "CASTRO", "apellidoPaterno": "NEIRA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 12, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 17, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 26, "nombres": "PERCY CONCEPCIÓN", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "PORTUGAL", "apellidoPaterno": "PEREZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 16, "MATEMÁTICA": 15, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 27, "nombres": "SAMUEL GUIDO", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "QUISPE", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 14, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 28, "nombres": "LUIS ARTURO", "comportamiento": "09", "situacionFinal": "R", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "RAMOS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 17, "TUTORÍA": 13, "MATEMÁTICA": 15, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 18, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 29, "nombres": "JUAN TOMÁS", "observaciones": "CORREGIDO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "SOPLIN", "apellidoPaterno": "RIVERA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 11, "TUTORÍA": 15, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 30, "nombres": "ETLIO", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "OVIEDO", "apellidoPaterno": "ROJAS", "asignaturasDesaprobadas": 0}]}	\N	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-12 23:59:33.334-05	PROCESADO_OCR	A	\N	FINAL	MAÑANA	6522aa18-0437-48b6-b351-46c39be2b408	\N	\N	\N	\N	f
f8b4d31e-ea4c-4873-971f-a2fc78a59cf7	OCR-LIBRE-20251113050834	OCR_LIBRE	5eabc565-4cde-4bff-b394-3d3e85bbe2a7	4238b5f2-31c1-438b-891e-6ff1c5752503	\N	4	\N	\N	\N	t	2025-11-13 00:08:34.196-05	{"metadata": {"modelo_ia": "Gemini", "advertencias": [], "procesado_en": "2025-11-13T05:08:34.196Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 36, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 17, "TUTORÍA": null, "MATEMÁTICA": 20, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 16, "EDUCACIÓN PARA EL TRABAJO": 18, "FORMACIÓN CIUDADANA Y CÍVICA": 17, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 16, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 1, "nombres": "JESÚS", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 19, "INGLÉS": 15, "TUTORÍA": 16, "MATEMÁTICA": 18, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 16, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 17, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 2, "nombres": "DANTE", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "ALOSILLA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 18, "INGLÉS": 14, "TUTORÍA": 15, "MATEMÁTICA": 18, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 3, "nombres": "JOSÉ LUIS", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "COACALLA", "apellidoPaterno": "ANGLES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 14, "MATEMÁTICA": 15, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 17, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 4, "nombres": "JULIÁN", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "ARCATA", "apellidoPaterno": "AQUINO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 15, "TUTORÍA": 13, "MATEMÁTICA": 17, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 5, "nombres": "JESÚS YAMES", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "AYLLON", "apellidoPaterno": "ARAUJO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 19, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 17, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 18}, "numero": 6, "nombres": "ALEXIS", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "PEREZ", "apellidoPaterno": "ARIAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 15, "TUTORÍA": 14, "MATEMÁTICA": 16, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 7, "nombres": "MIGUEL GABINO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "ASCARRUNZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 14, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 8, "nombres": "MARCO ANTONIO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "PAREDES", "apellidoPaterno": "ATENCIO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 18, "INGLÉS": 16, "TUTORÍA": 15, "MATEMÁTICA": 19, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 17, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 19, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 9, "nombres": "JAVIER", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "VALENCIA", "apellidoPaterno": "AZA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 17, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 10, "nombres": "PEDRO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "PACHARI", "apellidoPaterno": "BARRREDA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 15, "TUTORÍA": 12, "MATEMÁTICA": 15, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 11, "nombres": "LUIS ABRAHAM", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "CANAZA", "apellidoPaterno": "BELTRAN", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 12, "TUTORÍA": 14, "MATEMÁTICA": 17, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 16, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 12, "nombres": "ANIBAL AMÉRICO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CASTAÑON", "apellidoPaterno": "BELTRAN", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 14, "TUTORÍA": 10, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 13, "nombres": "EDUARDO ARTURO", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "ROMERO", "apellidoPaterno": "CABALLERO", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 18, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 17, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 8, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 14, "nombres": "JAVIER", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "COLQUE", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 15, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 15, "nombres": "JOHNNY WALKER", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "CAHUI", "apellidoPaterno": "COPARI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 14, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 16, "nombres": "JOSÉ ARTURO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "CHAIÑA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 15, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 17, "nombres": "WILLSON RAYMUNDO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "ARIAS", "apellidoPaterno": "CHAMBI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 19, "INGLÉS": 15, "TUTORÍA": 16, "MATEMÁTICA": 19, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 16, "EDUCACIÓN PARA EL TRABAJO": 17, "FORMACIÓN CIUDADANA Y CÍVICA": 17, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 17, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 17, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 18, "nombres": "ALFREDO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "TAVERA", "apellidoPaterno": "ENRIQUEZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 18, "INGLÉS": 14, "TUTORÍA": 16, "MATEMÁTICA": 17, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 16, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 19, "nombres": "CÉSAR AUGUSTO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "BUSTINZA", "apellidoPaterno": "FLORES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 20, "nombres": "ELVER IHONY", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "TICONA", "apellidoPaterno": "FLORES", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 15, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 21, "nombres": "MAGÉN LUIS", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "QUISPE", "apellidoPaterno": "GARCIA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": null, "TUTORÍA": 12, "MATEMÁTICA": 15, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 22, "nombres": "WILBER RENÉ", "observaciones": "EXO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "YUCRA", "apellidoPaterno": "GUERRA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 23, "nombres": "EDGAR RUBÉN", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "BELTRAN", "apellidoPaterno": "LOPE", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 19, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 15, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 24, "nombres": "ABILIO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "ALAVE", "apellidoPaterno": "MAMANI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 15, "TUTORÍA": 13, "MATEMÁTICA": 17, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 25, "nombres": "MARCO ANTONIO", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "CASTRO", "apellidoPaterno": "NEIRA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 18, "INGLÉS": 13, "TUTORÍA": 14, "MATEMÁTICA": 17, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 16, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 17, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 26, "nombres": "PERCY CONCEPCIÓN", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "PORTUGAL", "apellidoPaterno": "PEREZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 16, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 27, "nombres": "SAMUEL GUIDO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "QUISPE", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 13, "TUTORÍA": 11, "MATEMÁTICA": 14, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 8, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 28, "nombres": "JAVIER", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "MAQUERA", "apellidoPaterno": "QUISPE", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 8, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 29, "nombres": "LUIS ARTURO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "RAMOS", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 19, "INGLÉS": 16, "TUTORÍA": 17, "MATEMÁTICA": 19, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 16, "EDUCACIÓN PARA EL TRABAJO": 18, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 18, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 30, "nombres": "JUAN TOMÁS", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "SOPLIN", "apellidoPaterno": "RIVERA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 19, "INGLÉS": 14, "TUTORÍA": 15, "MATEMÁTICA": 15, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 31, "nombres": "ETLIO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "OVIEDO", "apellidoPaterno": "ROJAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 18, "INGLÉS": 13, "TUTORÍA": 14, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 17, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 32, "nombres": "PERCY GENARO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "RAMOS", "apellidoPaterno": "ROJAS", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 13, "TUTORÍA": 15, "MATEMÁTICA": 15, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 33, "nombres": "FEIFER", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "COPA", "apellidoPaterno": "RUELAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 34, "nombres": "LUIS EDGAR", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "SUCAPUCA", "apellidoPaterno": "SUCAPUCA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 18, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 15, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 35, "nombres": "JILVER JESÚS", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "NUÑEZ", "apellidoPaterno": "VILCA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 16, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 17, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 36, "nombres": "HENRY FRANKLIN", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "AGUILAR", "apellidoPaterno": "YANQUE", "asignaturasDesaprobadas": 0}]}	\N	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-13 00:08:34.196-05	PROCESADO_OCR	A	\N	FINAL	MAÑANA	6522aa18-0437-48b6-b351-46c39be2b408	\N	\N	\N	\N	f
ead07fea-4bdb-4b47-8ddd-1258f620793d	OCR-LIBRE-20251113051105	OCR_LIBRE	b42b090c-d11d-42b7-ae8b-8e4eee152d85	5e355c2f-794b-43cd-919e-a6fcfb1f4769	\N	3	\N	\N	\N	t	2025-11-13 00:11:05.66-05	{"metadata": {"modelo_ia": "Gemini", "advertencias": [], "procesado_en": "2025-11-13T05:11:05.660Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 30, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 11, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 1, "nombres": "EDGAR WALTER", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 12, "MATEMÁTICA": 13, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 2, "nombres": "BELCHER", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "CRUZ", "apellidoPaterno": "ASQUI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 14, "MATEMÁTICA": 14, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 3, "nombres": "CLAUDIO EUDIS", "comportamiento": "19", "situacionFinal": "P", "apellidoMaterno": "DIAZ", "apellidoPaterno": "BELLIDO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 10, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 4, "nombres": "OPTACIANO", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 5, "nombres": "EDGAR", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 6, "nombres": "MIJAIL IGOR", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 7, "nombres": "RUDY AURELIO", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "PEREZ", "apellidoPaterno": "FLORES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 8, "nombres": "JESÚS", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "PALOMINO", "apellidoPaterno": "FUENTES", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 13, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 9, "nombres": "ALFONSO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 13, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 10, "nombres": "ADOLFO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 13, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 11, "nombres": "OSCAR RUBÉN", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 12, "nombres": "DAVID", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 14, "MATEMÁTICA": 12, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 13, "nombres": "FABIO DAVID", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "SALAS", "apellidoPaterno": "IGLESIAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 10, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 9, "EDUCACIÓN RELIGIOSA": 8, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 9}, "numero": 14, "nombres": "RONALD CARLOS", "comportamiento": "17", "situacionFinal": "R", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "LLANQUE", "asignaturasDesaprobadas": 8}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 14, "TUTORÍA": 17, "MATEMÁTICA": 14, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 15, "nombres": "JORGE", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "RAMOS", "apellidoPaterno": "MAQUERA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 16, "nombres": "RUBÉN", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "NENA", "apellidoPaterno": "MENDOZA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 15, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 17, "nombres": "HERMES DOUGLAS", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "AQUINO", "apellidoPaterno": "MIRAVAL", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 18, "nombres": "FACTOR VÍCTOR", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "PONCE", "apellidoPaterno": "NINA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 10, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 19, "nombres": "JAVIER", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "TARQUI", "apellidoPaterno": "PERCCA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 15, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 20, "nombres": "ROMEL", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "QUISPE", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 21, "nombres": "GERBAULT", "comportamiento": "19", "situacionFinal": "P", "apellidoMaterno": "CONDORI", "apellidoPaterno": "RAMOS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 22, "nombres": "JOSÉ LUIS", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "ATENCIO", "apellidoPaterno": "RONQUILLO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 23, "nombres": "GLOBER", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "ORTEGAL", "apellidoPaterno": "SOTO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 10, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 24, "nombres": "JAIME", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "VARGAS", "apellidoPaterno": "TIPULA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 13, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 25, "nombres": "CÉSAR LUCIO", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "VALDIVIA", "apellidoPaterno": "TOVAR", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 13, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 26, "nombres": "WILLIAM EFRAÍN", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "TITO", "apellidoPaterno": "VALERO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 14, "TUTORÍA": 16, "MATEMÁTICA": 16, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 18}, "numero": 27, "nombres": "JUAN WASHINGTON", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "VARGAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 13, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 28, "nombres": "RONMEL ISAAC", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "CHARAJA", "apellidoPaterno": "VARGAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 16, "MATEMÁTICA": 12, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 29, "nombres": "FÉLIX", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "COILA", "apellidoPaterno": "YANQUI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 14, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 30, "nombres": "JULIAN EDGAR", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "CHOQUE", "apellidoPaterno": "ZAPANA", "asignaturasDesaprobadas": 0}]}	\N	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-13 00:11:05.66-05	PROCESADO_OCR	A	\N	FINAL	MAÑANA	6522aa18-0437-48b6-b351-46c39be2b408	\N	\N	\N	\N	f
2970fc9f-58bb-446b-9745-295f7ba1d715	OCR-LIBRE-20251113051931	OCR_LIBRE	e0ac2d1e-0b62-433d-919b-ca87899bc3e5	c2b3d6ff-c0ce-4932-ac72-5a3f8a48d7d1	\N	\N	\N	\N	\N	t	2025-11-13 00:19:31.482-05	{"metadata": {"modelo_ia": "Gemini", "advertencias": [], "procesado_en": "2025-11-13T05:19:31.482Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 30, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 11, "TUTORÍA": 16, "MATEMÁTICA": 17, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 16, "EDUCACIÓN PARA EL TRABAJO": 17, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 1, "nombres": "EDGAR WALTER", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 2, "nombres": "DANTE", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "ALOSILLA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 3, "nombres": "JOSÉ LUIS", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "COACALLA", "apellidoPaterno": "ANGLES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 4, "nombres": "JULIÁN", "comportamiento": "13", "situacionFinal": "P", "apellidoMaterno": "ARCATA", "apellidoPaterno": "AQUINO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 5, "nombres": "JESÚS YAMES", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "AYLLON", "apellidoPaterno": "ARAUJO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 6, "nombres": "ALEXIS", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "PEREZ", "apellidoPaterno": "ARIAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 7, "nombres": "MIGUEL GABINO", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "ASCARRUNZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 8, "nombres": "MARCO ANTONIO", "comportamiento": "16", "situacionFinal": "R", "apellidoMaterno": "PAREDES", "apellidoPaterno": "ATENCIO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 9, "nombres": "JAVIER", "comportamiento": "13", "situacionFinal": "R", "apellidoMaterno": "VALENCIA", "apellidoPaterno": "AZA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 10, "nombres": "PEDRO", "comportamiento": "14", "situacionFinal": "R", "apellidoMaterno": "PACHARI", "apellidoPaterno": "BARREDA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 11, "nombres": "LUIS ABRAHAM", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "CANAZA", "apellidoPaterno": "BELTRAN", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 12, "nombres": "ANIBAL AMÉRICO", "comportamiento": "10", "situacionFinal": "R", "apellidoMaterno": "CASTAÑON", "apellidoPaterno": "BELTRAN", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 13, "nombres": "JAVIER", "comportamiento": "13", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "COLQUE", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 14, "nombres": "JOHNNY WALKER", "comportamiento": "12", "situacionFinal": "P", "apellidoMaterno": "CAHUI", "apellidoPaterno": "COPARI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 15, "nombres": "JUAN CARLOS", "comportamiento": "13", "situacionFinal": "P", "apellidoMaterno": "CRUZ", "apellidoPaterno": "CUTIPA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 16, "nombres": "JOSÉ ARTURO", "comportamiento": "13", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "CHAIÑA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 17, "nombres": "WILLSON RAYMUNDO", "comportamiento": "12", "situacionFinal": "R", "apellidoMaterno": "ARIAS", "apellidoPaterno": "CHAMBI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 18, "nombres": "ALFREDO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "TAVERA", "apellidoPaterno": "ENRIQUEZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 19, "nombres": "CÉSAR AUGUSTO", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "BUSTINZA", "apellidoPaterno": "FLORES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 20, "nombres": "ELVER IHONY", "comportamiento": "11", "situacionFinal": "P", "apellidoMaterno": "TICONA", "apellidoPaterno": "FLORES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 21, "nombres": "MAGÉN LUIS", "comportamiento": "12", "situacionFinal": "R", "apellidoMaterno": "QUISPE", "apellidoPaterno": "GARCIA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 22, "nombres": "WILBER RENÉ", "observaciones": "Nota 'EXO' en la 4ta columna", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "YUCRA", "apellidoPaterno": "GUERRA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 23, "nombres": "EDGAR RUBÉN", "comportamiento": "12", "situacionFinal": "R", "apellidoMaterno": "BELTRAN", "apellidoPaterno": "LOPE", "asignaturasDesaprobadas": 3}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 24, "nombres": "ABILIO", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "ALAVE", "apellidoPaterno": "MAMANI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 25, "nombres": "MARCO ANTONIO", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "CASTRO", "apellidoPaterno": "NEIRA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 26, "nombres": "PERCY CONCEPCIÓN", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "PORTUGAL", "apellidoPaterno": "PEREZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 27, "nombres": "SAMUEL GUIDO", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "QUISPE", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 28, "nombres": "LUIS ARTURO", "comportamiento": "09", "situacionFinal": "R", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "RAMOS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 29, "nombres": "JUAN TOMÁS", "observaciones": "CORREGIDO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "SOPLIN", "apellidoPaterno": "RIVERA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 30, "nombres": "ETLIO", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "OVIEDO", "apellidoPaterno": "ROJAS", "asignaturasDesaprobadas": 0}]}	\N	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-13 00:19:31.482-05	PROCESADO_OCR	A	\N	FINAL	MAÑANA	\N	\N	\N	\N	\N	f
72356452-40c2-4bf5-966a-a81539c0616c	OCR-LIBRE-20251113051955	OCR_LIBRE	5eabc565-4cde-4bff-b394-3d3e85bbe2a7	4238b5f2-31c1-438b-891e-6ff1c5752503	\N	\N	\N	\N	\N	t	2025-11-13 00:19:55.857-05	{"metadata": {"modelo_ia": "Gemini", "advertencias": [], "procesado_en": "2025-11-13T05:19:55.857Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 36, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "tipo": "G", "notas": {"ARTE": 20, "INGLÉS": null, "TUTORÍA": 15, "MATEMÁTICA": 16, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 18, "EDUCACIÓN RELIGIOSA": 17, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 16, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 1, "nombres": "EDGAR WALTER", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 2, "nombres": "DANTE", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "ALOSILLA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 3, "nombres": "JOSÉ LUIS", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "COACALLA", "apellidoPaterno": "ANGLES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 4, "nombres": "JULIÁN", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "ARCATA", "apellidoPaterno": "AQUINO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 5, "nombres": "JESÚS YAMES", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "AYLLON", "apellidoPaterno": "ARAUJO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 6, "nombres": "ALEXIS", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "PEREZ", "apellidoPaterno": "ARIAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 7, "nombres": "MIGUEL GABINO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "ASCARRUNZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 8, "nombres": "MARCO ANTONIO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "PAREDES", "apellidoPaterno": "ATENCIO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 9, "nombres": "JAVIER", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "VALENCIA", "apellidoPaterno": "AZA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 10, "nombres": "PEDRO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "PACHARI", "apellidoPaterno": "BARRREDA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 11, "nombres": "LUIS ABRAHAM", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "CANAZA", "apellidoPaterno": "BELTRAN", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 12, "nombres": "ANIBAL AMÉRICO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CASTAÑON", "apellidoPaterno": "BELTRAN", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 13, "nombres": "EDUARDO ARTURO", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "ROMERO", "apellidoPaterno": "CABALLERO", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 14, "nombres": "JAVIER", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "COLQUE", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 15, "nombres": "JOHNNY WALKER", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "CAHUI", "apellidoPaterno": "COPARI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 16, "nombres": "JOSÉ ARTURO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "CHAIÑA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 17, "nombres": "WILLSON RAYMUNDO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "ARIAS", "apellidoPaterno": "CHAMBI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 18, "nombres": "ALFREDO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "TAVERA", "apellidoPaterno": "ENRIQUEZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 19, "nombres": "CÉSAR AUGUSTO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "BUSTINZA", "apellidoPaterno": "FLORES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 20, "nombres": "ELVER IHONY", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "TICONA", "apellidoPaterno": "FLORES", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 21, "nombres": "MAGÉN LUIS", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "QUISPE", "apellidoPaterno": "GARCIA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 22, "nombres": "WILBER RENÉ", "observaciones": "EXO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "YUCRA", "apellidoPaterno": "GUERRA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 23, "nombres": "EDGAR RUBÉN", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "BELTRAN", "apellidoPaterno": "LOPE", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 24, "nombres": "ABILIO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "ALAVE", "apellidoPaterno": "MAMANI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 25, "nombres": "MARCO ANTONIO", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "CASTRO", "apellidoPaterno": "NEIRA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 26, "nombres": "PERCY CONCEPCIÓN", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "PORTUGAL", "apellidoPaterno": "PEREZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 27, "nombres": "SAMUEL GUIDO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "QUISPE", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 28, "nombres": "JAVIER", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "MAQUERA", "apellidoPaterno": "QUISPE", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 29, "nombres": "LUIS ARTURO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "RAMOS", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 30, "nombres": "JUAN TOMÁS", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "SOPLIN", "apellidoPaterno": "RIVERA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 31, "nombres": "ETLIO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "OVIEDO", "apellidoPaterno": "ROJAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 32, "nombres": "PERCY GENARO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "RAMOS", "apellidoPaterno": "ROJAS", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 33, "nombres": "FEIFER", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "COPA", "apellidoPaterno": "RUELAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 34, "nombres": "LUIS EDGAR", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "SUCAPUCA", "apellidoPaterno": "SUCAPUCA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 35, "nombres": "JILVER JESÚS", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "NUÑEZ", "apellidoPaterno": "VILCA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 36, "nombres": "HENRY FRANKLIN", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "AGUILAR", "apellidoPaterno": "YANQUE", "asignaturasDesaprobadas": 0}]}	\N	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-13 00:19:55.857-05	PROCESADO_OCR	A	\N	FINAL	MAÑANA	\N	\N	\N	\N	\N	f
3542ad15-89dd-4243-b2f6-0719d0a87d1c	OCR-LIBRE-20251113052018	OCR_LIBRE	4800a722-34ad-4686-97bf-0b5cb443b078	b267eca3-a39b-4a26-a73f-da759d3247d2	\N	\N	\N	\N	\N	t	2025-11-13 00:20:18.517-05	{"metadata": {"modelo_ia": "Gemini", "advertencias": [], "procesado_en": "2025-11-13T05:20:18.516Z", "areas_detectadas": ["ARTE", "INGLÉS", "TUTORÍA", "MATEMÁTICA", "COMUNICACIÓN", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "EDUCACIÓN PARA EL TRABAJO", "FORMACIÓN CIUDADANA Y CÍVICA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "PERSONA, FAMILIA Y RELACIONES HUMANAS"], "total_estudiantes": 32, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 14, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 1, "nombres": "EDGAR WALTER", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 2, "nombres": "DOMINGO DAVID", "observaciones": "Retir. por 30% Inasist. Injust. 04-07-85", "comportamiento": "None", "situacionFinal": "R", "apellidoMaterno": "PARISACA", "apellidoPaterno": "APAZA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 15, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 3, "nombres": "BELCHER", "observaciones": "Rectif de Nombre Napoleon", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CRUZ", "apellidoPaterno": "ASQUI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 4, "nombres": "OPTACIANO", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 5, "nombres": "FELIPE JESÚS", "comportamiento": "16", "situacionFinal": "R", "apellidoMaterno": "MAMANI", "apellidoPaterno": "CAHUI", "asignaturasDesaprobadas": 4}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 9, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 6, "nombres": "EDGAR", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 7, "nombres": "RUFFO HÉCTOR", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "FLORES", "apellidoPaterno": "CALLO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 8, "nombres": "AGUSTÍN RENEÉ", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "QUISPE", "apellidoPaterno": "CUNO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 9, "MATEMÁTICA": 8, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 9, "nombres": "HUGO ALEJANDRO", "comportamiento": "15", "situacionFinal": "R", "apellidoMaterno": "CHAYÑA", "apellidoPaterno": "CHAYÑA", "asignaturasDesaprobadas": 6}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 10, "nombres": "VÍCTOR RAÚL", "observaciones": "Retir. por 30% Inasist. Injust. 30-10-85", "comportamiento": "None", "situacionFinal": "R", "apellidoMaterno": "SERRANO", "apellidoPaterno": "CHOQUECOTA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 11, "nombres": "MIJAIL YGOR", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 12, "nombres": "JUAN ANTONIO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "DEL PINO", "apellidoPaterno": "GUTIERREZ", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 13, "nombres": "ALFONSO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 14, "nombres": "ADOLFO", "comportamiento": "19", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 14, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 15, "nombres": "OSCAR RUBÉN", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 16, "nombres": "DAVID", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 9, "MATEMÁTICA": 10, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 17, "nombres": "JAIME CONSTANTINO", "comportamiento": "16", "situacionFinal": "R", "apellidoMaterno": "CORNEJO", "apellidoPaterno": "LUCANA", "asignaturasDesaprobadas": 6}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 18, "nombres": "JOSÉ LUIS", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "RIVAS", "apellidoPaterno": "LLANOS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 19, "nombres": "JORGE", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "RAMOS", "apellidoPaterno": "MAQUERA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 20, "nombres": "MARIO", "comportamiento": "15", "situacionFinal": "A", "apellidoMaterno": "MACHACA", "apellidoPaterno": "MENDIZABAL", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 21, "nombres": "RUBÉN", "comportamiento": "15", "situacionFinal": "A", "apellidoMaterno": "NENA", "apellidoPaterno": "MENDOZA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 10, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 22, "nombres": "HERMES DOUGLAS", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "AQUINO", "apellidoPaterno": "MIRAVAL", "asignaturasDesaprobadas": 3}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 10, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 23, "nombres": "LIBORIO TEÓFILO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "CARRASCO", "apellidoPaterno": "PACHAPUMA", "asignaturasDesaprobadas": 3}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 24, "nombres": "JOSÉ LUIS", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "ATENCIO", "apellidoPaterno": "RONQUILLO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 25, "nombres": "JAIME", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "VARGAS", "apellidoPaterno": "TIPULA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 17, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 26, "nombres": "WILLIAM EFRAÍN", "comportamiento": "15", "situacionFinal": "A", "apellidoMaterno": "TITO", "apellidoPaterno": "VALERO", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 15, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 18, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 27, "nombres": "JUAN WASHINGTON", "comportamiento": "19", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "VARGAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 28, "nombres": "RONMEL ISAAC", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "CHARAJA", "apellidoPaterno": "VARGAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 10, "INGLÉS": 11, "TUTORÍA": 10, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 9, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 29, "nombres": "JUAN", "observaciones": "Transf. a... Carlos... 0.11.86", "comportamiento": "17", "situacionFinal": "R", "apellidoMaterno": "APAZA", "apellidoPaterno": "VILCA", "asignaturasDesaprobadas": 7}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 16, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 30, "nombres": "RONALD AGUSTIN", "observaciones": "Carlos Humberto O.M. 86", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "YANQUI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 31, "nombres": "JULIAN EDGAR", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "CHOQUE", "apellidoPaterno": "ZAPANA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 32, "nombres": "ADOLFO", "observaciones": "Retir. por 30% Inasist. Injust. 04-07-85", "comportamiento": "None", "situacionFinal": "R", "apellidoMaterno": "PEREZ", "apellidoPaterno": "ZARATE", "asignaturasDesaprobadas": 0}]}	\N	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-13 00:20:18.517-05	PROCESADO_OCR	A	\N	FINAL	MAÑANA	\N	\N	\N	\N	\N	f
fee8187e-e941-4c4f-bc25-21a795f3e3da	OCR-LIBRE-20251113051618	OCR_LIBRE	74a5ab00-d6b1-4b7b-9b57-d026e194ae07	f8148f80-3bed-4f19-9a3b-fca1d4af32c5	\N	2	\N	\N	\N	t	2025-11-13 00:16:18.426-05	{"metadata": {"modelo_ia": "Gemini", "advertencias": [], "procesado_en": "2025-11-13T05:16:18.426Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 30, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "tipo": "G", "notas": {"ARTE": 10, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 6, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 1, "nombres": "EDGAR WALTER", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR", "asignaturasDesaprobadas": 3}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 2, "nombres": "BELCHER", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "CRUZ", "apellidoPaterno": "ASQUI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 8, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 3, "nombres": "OPTACIANO", "comportamiento": "14", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO", "asignaturasDesaprobadas": 3}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 13, "TUTORÍA": 11, "MATEMÁTICA": 9, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 4, "nombres": "EDGAR", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 5, "nombres": "RUFFO HÉCTOR", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "FLORES", "apellidoPaterno": "CALLO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 6, "nombres": "MIJAIL YGOR", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 10, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 7, "nombres": "JESÚS", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "PALOMINO", "apellidoPaterno": "FUENTES", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 10, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 9, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 8, "nombres": "JUAN ANTONIO", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "DEL PINO", "apellidoPaterno": "GUTIERREZ", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 9, "nombres": "ALFONSO", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 10, "nombres": "ADOLFO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 11, "nombres": "OSCAR RUBÉN", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 12, "nombres": "DAVID", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 13, "nombres": "FABIO DAVID", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "SALAS", "apellidoPaterno": "IGLESIAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 10, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 14, "nombres": "JOSÉ LUIS", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "RIVAS", "apellidoPaterno": "LLANOS", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 9, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 15, "nombres": "RONALD CARLOS", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "LLANQUE", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 15, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 16, "nombres": "JORGE", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "RAMOS", "apellidoPaterno": "MAQUERA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 8, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 8, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 7, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 9, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 17, "nombres": "DAVID", "comportamiento": "15", "situacionFinal": "R", "apellidoMaterno": "ZAPANA", "apellidoPaterno": "MAYTA", "asignaturasDesaprobadas": 4}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 18, "nombres": "MARIO", "observaciones": "Retirado por motivos familiares 29.09.86", "comportamiento": "None", "situacionFinal": "R", "apellidoMaterno": "MACHACA", "apellidoPaterno": "MENDIZABAL", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 8, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 19, "nombres": "RUBEN", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "NENA", "apellidoPaterno": "MENDOZA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 12, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 20, "nombres": "HERMES DOUGLAS", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "AQUINO", "apellidoPaterno": "MIRAVAL", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 21, "nombres": "FACTOR VICTOR", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "PONCE", "apellidoPaterno": "NINA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 22, "nombres": "JOSÉ LUIS", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "ATENCIO", "apellidoPaterno": "RONQUILLO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 23, "nombres": "GLOBER", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "ORTEGAL", "apellidoPaterno": "SOTO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 24, "nombres": "JAIME", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "VARGAS", "apellidoPaterno": "TIPULA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 10, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 25, "nombres": "CÉSAR LUCIO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "VALDIVIA", "apellidoPaterno": "TOVAR", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 26, "nombres": "WILLIAM EFRAÍN", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "TITO", "apellidoPaterno": "VALERO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 15, "TUTORÍA": 13, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 18, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 27, "nombres": "JUAN WASHINGTON", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "VARGAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 14, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 28, "nombres": "RONMEL ISAAC", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CHARAJA", "apellidoPaterno": "VARGAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 13, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 29, "nombres": "JUSTO GERMÁN", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CONTRERAS", "apellidoPaterno": "VERASTEGUI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 9, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 30, "nombres": "JULIÁN EDGAR", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "CHOQUE", "apellidoPaterno": "ZAPANA", "asignaturasDesaprobadas": 2}]}	\N	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-13 00:16:18.426-05	PROCESADO_OCR	A	\N	FINAL	MAÑANA	6522aa18-0437-48b6-b351-46c39be2b408	\N	\N	\N	\N	f
63eb1a53-1f45-429a-bf21-964fb465f24b	OCR-LIBRE-20251113051848	OCR_LIBRE	4800a722-34ad-4686-97bf-0b5cb443b078	b267eca3-a39b-4a26-a73f-da759d3247d2	\N	2	\N	\N	\N	t	2025-11-13 00:18:48.535-05	{"metadata": {"modelo_ia": "Gemini", "advertencias": [], "procesado_en": "2025-11-13T05:18:48.535Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 32, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 14, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 1, "nombres": "EDGAR WALTER", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 2, "nombres": "DOMINGO DAVID", "observaciones": "Retir. por 30% Inasist. Injust. 04-07-85", "comportamiento": "None", "situacionFinal": "R", "apellidoMaterno": "PARISACA", "apellidoPaterno": "APAZA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 15, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 3, "nombres": "BELCHER", "observaciones": "Rectif de Nombre Napoleon", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CRUZ", "apellidoPaterno": "ASQUI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 4, "nombres": "OPTACIANO", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 5, "nombres": "FELIPE JESÚS", "comportamiento": "16", "situacionFinal": "R", "apellidoMaterno": "MAMANI", "apellidoPaterno": "CAHUI", "asignaturasDesaprobadas": 4}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 9, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 6, "nombres": "EDGAR", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 7, "nombres": "RUFFO HÉCTOR", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "FLORES", "apellidoPaterno": "CALLO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 8, "nombres": "AGUSTÍN RENEÉ", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "QUISPE", "apellidoPaterno": "CUNO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 9, "MATEMÁTICA": 8, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 9, "nombres": "HUGO ALEJANDRO", "comportamiento": "15", "situacionFinal": "R", "apellidoMaterno": "CHAYÑA", "apellidoPaterno": "CHAYÑA", "asignaturasDesaprobadas": 6}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 10, "nombres": "VÍCTOR RAÚL", "observaciones": "Retir. por 30% Inasist. Injust. 30-10-85", "comportamiento": "None", "situacionFinal": "R", "apellidoMaterno": "SERRANO", "apellidoPaterno": "CHOQUECOTA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 11, "nombres": "MIJAIL YGOR", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 12, "nombres": "JUAN ANTONIO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "DEL PINO", "apellidoPaterno": "GUTIERREZ", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 13, "nombres": "ALFONSO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 14, "nombres": "ADOLFO", "comportamiento": "19", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 14, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 15, "nombres": "OSCAR RUBÉN", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 16, "nombres": "DAVID", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 9, "MATEMÁTICA": 10, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 17, "nombres": "JAIME CONSTANTINO", "comportamiento": "16", "situacionFinal": "R", "apellidoMaterno": "CORNEJO", "apellidoPaterno": "LUCANA", "asignaturasDesaprobadas": 6}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 18, "nombres": "JOSÉ LUIS", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "RIVAS", "apellidoPaterno": "LLANOS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 19, "nombres": "JORGE", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "RAMOS", "apellidoPaterno": "MAQUERA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 20, "nombres": "MARIO", "comportamiento": "15", "situacionFinal": "A", "apellidoMaterno": "MACHACA", "apellidoPaterno": "MENDIZABAL", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 21, "nombres": "RUBÉN", "comportamiento": "15", "situacionFinal": "A", "apellidoMaterno": "NENA", "apellidoPaterno": "MENDOZA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 10, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 22, "nombres": "HERMES DOUGLAS", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "AQUINO", "apellidoPaterno": "MIRAVAL", "asignaturasDesaprobadas": 3}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 10, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 23, "nombres": "LIBORIO TEÓFILO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "CARRASCO", "apellidoPaterno": "PACHAPUMA", "asignaturasDesaprobadas": 3}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 24, "nombres": "JOSÉ LUIS", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "ATENCIO", "apellidoPaterno": "RONQUILLO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 25, "nombres": "JAIME", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "VARGAS", "apellidoPaterno": "TIPULA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 17, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 26, "nombres": "WILLIAM EFRAÍN", "comportamiento": "15", "situacionFinal": "A", "apellidoMaterno": "TITO", "apellidoPaterno": "VALERO", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 15, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 18, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 27, "nombres": "JUAN WASHINGTON", "comportamiento": "19", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "VARGAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 28, "nombres": "RONMEL ISAAC", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "CHARAJA", "apellidoPaterno": "VARGAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 10, "INGLÉS": 11, "TUTORÍA": 10, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 9, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 29, "nombres": "JUAN", "observaciones": "Transf. a... Carlos... 0.11.86", "comportamiento": "17", "situacionFinal": "R", "apellidoMaterno": "APAZA", "apellidoPaterno": "VILCA", "asignaturasDesaprobadas": 7}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 16, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 30, "nombres": "RONALD AGUSTIN", "observaciones": "Carlos Humberto O.M. 86", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "YANQUI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 31, "nombres": "JULIAN EDGAR", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "CHOQUE", "apellidoPaterno": "ZAPANA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 32, "nombres": "ADOLFO", "observaciones": "Retir. por 30% Inasist. Injust. 04-07-85", "comportamiento": "None", "situacionFinal": "R", "apellidoMaterno": "PEREZ", "apellidoPaterno": "ZARATE", "asignaturasDesaprobadas": 0}]}	\N	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-13 00:18:48.535-05	PROCESADO_OCR	A	\N	FINAL	MAÑANA	6522aa18-0437-48b6-b351-46c39be2b408	\N	\N	\N	\N	f
\.


--
-- Data for Name: actanota; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actanota (id, acta_estudiante_id, area_id, nota, nota_literal, es_exonerado, nombre_area_ocr, confianza_ocr, orden, fecha_registro) FROM stdin;
\.


--
-- Data for Name: aniolectivo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.aniolectivo (id, institucion_id, anio, fechainicio, fechafin, activo, observaciones) FROM stdin;
4800a722-34ad-4686-97bf-0b5cb443b078	51e3415d-775e-436b-bfe0-3a21eee4de32	1985	1985-03-01	1985-12-31	f	\N
74a5ab00-d6b1-4b7b-9b57-d026e194ae07	51e3415d-775e-436b-bfe0-3a21eee4de32	1986	1986-03-01	1986-12-31	f	\N
b42b090c-d11d-42b7-ae8b-8e4eee152d85	51e3415d-775e-436b-bfe0-3a21eee4de32	1987	1987-03-01	1987-12-31	f	\N
5eabc565-4cde-4bff-b394-3d3e85bbe2a7	51e3415d-775e-436b-bfe0-3a21eee4de32	1988	1988-03-01	1988-12-31	f	\N
e0ac2d1e-0b62-433d-919b-ca87899bc3e5	51e3415d-775e-436b-bfe0-3a21eee4de32	1989	1989-03-01	1989-12-31	f	\N
79431908-88a5-4163-bf38-2893f0246981	51e3415d-775e-436b-bfe0-3a21eee4de32	1990	1990-03-01	1990-12-31	f	\N
f5138997-e44a-4e95-b176-415c7bb0742d	51e3415d-775e-436b-bfe0-3a21eee4de32	1991	1991-03-01	1991-12-31	f	\N
71fba18f-5d58-4f77-96ca-c6d1c4a8ce5c	51e3415d-775e-436b-bfe0-3a21eee4de32	1992	1992-03-01	1992-12-31	f	\N
447940e1-aca9-48bd-8305-f91387820854	51e3415d-775e-436b-bfe0-3a21eee4de32	1993	1993-03-01	1993-12-31	f	\N
14c331ef-f0ab-488e-8d9b-524ec579c967	51e3415d-775e-436b-bfe0-3a21eee4de32	1994	1994-03-01	1994-12-31	f	\N
1276f874-1743-46a7-a208-e86064dc88f9	51e3415d-775e-436b-bfe0-3a21eee4de32	1995	1995-03-01	1995-12-31	f	\N
91df88f7-9b8d-4d4e-ac52-b63679c27e98	51e3415d-775e-436b-bfe0-3a21eee4de32	1996	1996-03-01	1996-12-31	f	\N
6d515a37-0a05-47b9-81a2-dc4e3cdf4324	51e3415d-775e-436b-bfe0-3a21eee4de32	1997	1997-03-01	1997-12-31	f	\N
1d7706f2-2671-4fcf-a53b-77c6389fd707	51e3415d-775e-436b-bfe0-3a21eee4de32	1998	1998-03-01	1998-12-31	f	\N
23e7abfe-b558-4210-bf7e-4134f5b6fc8d	51e3415d-775e-436b-bfe0-3a21eee4de32	1999	1999-03-01	1999-12-31	f	\N
66fb16b7-c529-4ba4-a18e-9a6bf936b0b6	51e3415d-775e-436b-bfe0-3a21eee4de32	2000	2000-03-01	2000-12-31	f	\N
4aec7dfb-ae52-46fa-85fa-ebd7f4496a11	51e3415d-775e-436b-bfe0-3a21eee4de32	2001	2001-03-01	2001-12-31	f	\N
a2a0c1a9-a7c5-47c1-8930-f165aaccce72	51e3415d-775e-436b-bfe0-3a21eee4de32	2002	2002-03-01	2002-12-31	f	\N
1bd24cd2-b9e8-4bdb-9ee8-473344b856c1	51e3415d-775e-436b-bfe0-3a21eee4de32	2003	2003-03-01	2003-12-31	f	\N
8fae027e-613d-4575-8943-670e2531e391	51e3415d-775e-436b-bfe0-3a21eee4de32	2004	2004-03-01	2004-12-31	f	\N
f2ddff9d-85a7-4433-9e55-0c69d6bbf924	51e3415d-775e-436b-bfe0-3a21eee4de32	2005	2005-03-01	2005-12-31	f	\N
af53f253-08cf-411d-b136-e9c26aca2098	51e3415d-775e-436b-bfe0-3a21eee4de32	2006	2006-03-01	2006-12-31	f	\N
436301cd-dbea-487c-b455-32c23093ba81	51e3415d-775e-436b-bfe0-3a21eee4de32	2007	2007-03-01	2007-12-31	f	\N
7ca7bec9-1c89-4127-aba3-aa667de313ff	51e3415d-775e-436b-bfe0-3a21eee4de32	2008	2008-03-01	2008-12-31	f	\N
60c4eb35-4f1b-4fad-88dd-e2089837b14b	51e3415d-775e-436b-bfe0-3a21eee4de32	2010	2010-03-01	2010-12-31	f	\N
a4428656-3705-4886-a5c5-2ecdfa33b854	51e3415d-775e-436b-bfe0-3a21eee4de32	2011	2011-03-01	2011-12-31	f	\N
ad1ebff9-1f31-4534-b4c7-a85d68448547	51e3415d-775e-436b-bfe0-3a21eee4de32	2009	2009-03-01	2009-12-31	f	\N
18c2ba5e-c02d-4e36-911f-99a1fb08ae2c	51e3415d-775e-436b-bfe0-3a21eee4de32	2012	2012-03-01	2012-12-31	t	\N
\.


--
-- Data for Name: areacurricular; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.areacurricular (id, institucion_id, codigo, nombre, orden, escompetenciatransversal, activo) FROM stdin;
c978abd4-9ae6-45dc-8c52-671c5b7151a2	51e3415d-775e-436b-bfe0-3a21eee4de32	COM	Comunicación	1	f	t
024dc30a-3b11-4cb6-8d38-ea3b709103c5	51e3415d-775e-436b-bfe0-3a21eee4de32	CTA	Ciencia, Tecnología y Ambiente	4	f	t
3950b64a-dca1-4951-8d2b-edd4aa04167e	51e3415d-775e-436b-bfe0-3a21eee4de32	CCSS	Ciencias Sociales	5	f	t
f4650e7a-2c25-45ce-8d57-172e5c60c821	51e3415d-775e-436b-bfe0-3a21eee4de32	EPT	Educación para el Trabajo	6	f	t
e5efbb75-2c3e-47ec-b22b-1cd6ae64c3ca	51e3415d-775e-436b-bfe0-3a21eee4de32	ART	Arte	7	f	t
63ff6462-36de-4e4f-bc71-0d0cf40ea3b0	51e3415d-775e-436b-bfe0-3a21eee4de32	EDF	Educación Física	8	f	t
b018b101-c930-415a-a180-b86bc14f3931	51e3415d-775e-436b-bfe0-3a21eee4de32	PFRH	Persona, Familia y Relaciones Humanas	9	f	t
a771170e-ee4e-4a98-acc9-8f0149fc95f8	51e3415d-775e-436b-bfe0-3a21eee4de32	FCC	Formación Ciudadana y Cívica	10	f	t
b8481131-2790-4afc-a611-a6e9f0764f4d	51e3415d-775e-436b-bfe0-3a21eee4de32	REL	Educación Religiosa	12	f	t
ba728450-2203-4799-94a3-3917c07fcc7b	\N	FIS	MATEMATICA	13	f	t
6b157324-935b-4188-9c16-e39d911bcbe5	51e3415d-775e-436b-bfe0-3a21eee4de32	MAT	Matemática	2	f	t
3ae8fbf2-4c56-4fc3-a7be-85e192e25b14	51e3415d-775e-436b-bfe0-3a21eee4de32	COMP	Computación e Informática	11	f	t
d1ebfe0e-3f47-44a9-a36c-7d0ad2f737be	51e3415d-775e-436b-bfe0-3a21eee4de32	ING	Inglés	3	f	t
c042093d-bb03-41a7-9f83-0a5efcb4a542	\N	HGE	HISTORIA, GEOGRAFÍA Y ECONOMÍA	14	f	t
7906d48c-9dca-43f3-b66f-1c8e747b127c	\N	TUT	TUTORÍA	15	t	t
\.


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria (id, entidad, entidadid, accion, datosanteriores, datosnuevos, usuario_id, ip, useragent, fecha) FROM stdin;
33dda3a2-ecc3-4efd-97a7-1f26353653a8	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:23:22.992-05
8aac2b41-5f94-4f40-b3b8-cef0541395ed	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:31:08.693-05
1035e985-eff4-4f18-b40a-b26639437894	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:31:38.487-05
d2edffac-24e3-4126-adf4-87033fc2bbba	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:31:53.234-05
42b41c08-fa51-4257-9703-c6d10fef8e2c	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:34:09.388-05
45d8cec5-370b-4041-904d-88f465f453c5	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:34:42.082-05
6b506c2c-da59-4910-8ded-0c884c5a2f1f	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:34:55.517-05
867b58ef-116f-4202-b8e9-c2f2513521d5	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:37:34.393-05
76e8f0af-1509-4eb9-a6eb-9b364bfb6a9c	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:42:38.657-05
0acc97e4-0dfd-44b4-b6d4-64f81720a090	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:42:55.609-05
1c5bcdac-fcf3-400b-bb90-df785c782aa6	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:43:06.764-05
1dbf0103-c9c0-40c4-a809-3e50d4132f6b	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:43:19.003-05
dbdfadfa-fe48-44d5-9fcb-4e9aabf0fc45	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:43:40.219-05
3d604b9d-c303-4f1e-ba70-b9ab72c0a526	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:43:49.677-05
416a5085-2c74-4ba5-aad3-12be8e213ed5	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:44:33.797-05
90e01756-0e25-4b9f-a1fa-224a8f4f05b7	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:44:57.116-05
76e66c50-15f1-41b2-a73f-f7d7fa3987f7	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:46:33.469-05
4fbf9abe-d945-40cd-bff1-d48e60069782	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:48:11.376-05
41284b4c-a310-4a35-b57b-95cd31b9f1cf	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:48:34.109-05
1c1b1013-58cc-47db-9744-e66b8dfdb824	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:49:32.736-05
6a6ba9d4-ba5c-4b57-adff-939aa1c3c495	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:49:59.734-05
f875c7bf-df7a-4a29-a58d-7970fec648a0	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:50:15.452-05
3a4e5921-2656-4535-9ce1-3ff5de751eff	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:50:25.655-05
7477b512-208c-445d-833f-abc97c2d50fb	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:51:02.139-05
e48c9b3b-6ba7-4093-86e9-c8475a175642	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:51:17.024-05
6397b865-ad36-461b-b764-ef695ba00f5b	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:53:09.828-05
2224fb15-76cb-4b7e-ba94-14c2d97395ae	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:53:52.92-05
4797cf05-56a1-4064-bc37-40a74b4ded35	sesion	509f1fc1-b892-4a60-8cea-e6f84cdcede9	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:00:39.994-05
bad09c2c-81ce-4f7a-bc40-cbb8d117565c	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:54:03.461-05
d258771e-0b50-4e9b-a1a9-627ecb361a0e	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:54:30.401-05
2d08ed40-d3e9-45e9-b387-f0cdb1e2e447	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:54:53.625-05
6b1fd028-dd12-4d65-919e-901d75c5e469	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:56:21.743-05
e8d3be28-6b34-440f-a062-a0c00a239dbf	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:56:43.971-05
10711b32-2de6-4b16-a5b5-3ff8d415adb3	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:56:56.738-05
18be8765-f13e-4059-9ea0-e80474ece5d9	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:57:43.053-05
024186e1-06cb-49b6-9770-1b4bf60cddc5	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:59:27.807-05
fa648873-8c43-4e58-8e52-a785c084ad1f	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 14:00:24.205-05
f3d7f25c-3882-4d6a-88da-1bb1c78cd043	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 14:00:51.453-05
8537635c-026a-4876-b31d-a008cdde1017	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 14:01:18.727-05
3490e9c2-4d10-4057-aefb-8d918deba3d1	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 14:01:32.725-05
9fd78c4c-125b-4142-8a54-83e55a48119b	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 14:02:41.951-05
a45c5d1f-6816-4133-b970-692cb5c38c60	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 14:02:55.597-05
bf113c29-3016-49c8-89ed-3b138f15908b	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 14:12:51.142-05
737b5476-cb46-4516-a747-eebdf7ada82e	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 14:13:01.168-05
5abb27ca-2efa-48e3-ac08-2424b0acfa72	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 14:13:21.322-05
96fd8725-f2bf-4d61-962c-1f351e949252	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 17:39:33.213-05
0972249a-258f-4167-8acb-c9f20699426a	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 17:40:01.604-05
a365383a-6e7b-4781-95ce-41fefde8b760	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 18:32:05.086-05
c15bb50a-02ae-4590-a89d-430837938a81	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 21:28:01.465-05
f087a1b9-65c6-4ef5-956c-0c9f6a468a77	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 22:42:56.095-05
9b11afce-ce93-45a1-9ce5-4e4d8aca2df2	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 00:48:26.995-05
363eaeb8-c236-43cf-9936-1f70364c027c	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 04:17:17.213-05
b2787456-7f3f-4591-9d97-58c086e9a068	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 05:00:02.946-05
c4014568-b3a0-4fb2-ac01-1a3eeed91297	sesion	de88f859-320c-4dc7-9c1f-27575ae27db8	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 05:42:28.134-05
10e7a764-dbb3-476b-a80d-fd4a25126235	sesion	3a214809-dbd1-4f03-a826-b6492479ea70	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 05:45:09.262-05
44966100-7f61-4f4f-9d46-b909f595e6d3	sesion	88e5dcae-9d9e-46c4-8a38-840630fe2a67	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 05:47:24.975-05
dd578832-a36a-428d-8428-7e6da38ce180	sesion	a28765c5-66d9-49bd-ad14-9db4b05c394b	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 05:51:44.956-05
5b7f4ff2-6403-47e6-8952-e25f44b21d83	sesion	bf96584b-9aaa-4e6b-bb81-62cd0125642a	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 05:54:23.699-05
64536dab-48d8-4377-a57b-a2f55595802e	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 05:54:55.912-05
c2ff1607-7f02-4c2b-b8db-cffba5d674f8	sesion	6e9fe827-566b-412c-a8e5-622601444ed0	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 05:58:39.361-05
26f3e361-e9d7-4759-972c-ab90a5a8f77b	sesion	4d037560-c048-4d5c-a815-01f5ea20ab1a	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 06:06:45.638-05
3ab5d03c-aded-46b2-a311-b8158d647007	sesion	88fd1f5d-ff22-4461-a656-d4de981243ee	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 07:32:25.956-05
e24f06b9-2920-4575-9359-0da5b458f808	sesion	e62114db-dc4b-463e-a815-95ba70ef13a6	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:55:06.111-05
3bd2aee0-72e7-4b22-9dd4-756e2ff16dc1	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:25:51.464-05
69dc34ad-e803-4e9d-aec8-346116f545cf	sesion	98f9ef80-a39f-4e26-9a44-020b3dd614d1	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 09:38:30.76-05
00e68ee7-cb9d-4bba-8e4c-e6f197e5f9bc	sesion	2634abd2-9ca0-4892-8c50-8a679e16b62c	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 10:05:54.3-05
241ae03b-c093-4263-8f4a-5b0fb59752f5	solicitud	8646423a-c656-4b12-ac2c-bf5220dd75c2	CREAR	null	{"id": "8646423a-c656-4b12-ac2c-bf5220dd75c2", "pago": null, "estado": "ACTA_ENCONTRADA_PENDIENTE_PAGO", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "0242c567-bea8-44e2-bb3f-87a5784a60a8", "dni": "65565465", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "Edard", "telefono": "967876867", "direccion": null, "fecharegistro": "2025-11-07T13:25:20.868Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "Edard FVFG Michael", "apellidomaterno": "Michael", "apellidopaterno": "FVFG", "fechanacimiento": "2012-12-12T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T13:25:20.868Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "0242c567-bea8-44e2-bb3f-87a5784a60a8", "motivorechazo": null, "observaciones": "Acta encontrada en: estaante 4", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T13:25:20.885Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000004", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000004", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T16:06:46.830Z", "fechainicioproceso": "2025-11-07T15:50:23.346Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:06:47.071-05
8eed394e-77e7-49c3-b3ff-7e539824d7e5	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:08:17.484-05
a9c222aa-f674-46a1-9674-44c57f7318bc	sesion	012a8a5d-8151-49fa-a466-e51f937b8987	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:08:34.865-05
9d9195b5-7e1e-4bc5-bb73-37f69273bddc	sesion	c8825f52-ea16-4ef7-837c-97c41d436a34	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:12:47.305-05
cc06a547-df48-406a-aa9d-3b09869f2d41	solicitud	a13d3682-c315-4a60-8373-41c5b896e91f	CREAR	null	{"id": "a13d3682-c315-4a60-8373-41c5b896e91f", "pago": null, "estado": "EN_BUSQUEDA", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "db66c575-12cc-483c-9443-71dabb750e2d", "dni": "99988999", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "EDWARD RODRIGO", "telefono": "988777878", "direccion": null, "fecharegistro": "2025-11-07T06:47:24.708Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "EDWARD RODRIGO OO URIARTE ANCCOTA", "apellidomaterno": "URIARTE ANCCOTA", "apellidopaterno": "OO", "fechanacimiento": "2012-12-14T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T06:47:24.708Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "db66c575-12cc-483c-9443-71dabb750e2d", "motivorechazo": null, "observaciones": "Editor ha iniciado la búsqueda del acta física", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T06:47:24.747Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000002", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000002", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T16:12:56.961Z", "fechainicioproceso": "2025-11-07T15:50:23.346Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:12:57.015-05
c0b0f0ce-9112-4e6a-be30-619cd13e485d	solicitud	a13d3682-c315-4a60-8373-41c5b896e91f	CREAR	null	{"id": "a13d3682-c315-4a60-8373-41c5b896e91f", "pago": null, "estado": "ACTA_ENCONTRADA_PENDIENTE_PAGO", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "db66c575-12cc-483c-9443-71dabb750e2d", "dni": "99988999", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "EDWARD RODRIGO", "telefono": "988777878", "direccion": null, "fecharegistro": "2025-11-07T06:47:24.708Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "EDWARD RODRIGO OO URIARTE ANCCOTA", "apellidomaterno": "URIARTE ANCCOTA", "apellidopaterno": "OO", "fechanacimiento": "2012-12-14T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T06:47:24.708Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "db66c575-12cc-483c-9443-71dabb750e2d", "motivorechazo": null, "observaciones": "Acta encontrada en: estaante 4", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T06:47:24.747Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000002", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000002", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T16:14:20.612Z", "fechainicioproceso": "2025-11-07T15:50:23.346Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:14:20.681-05
0074219a-7eda-44a6-a99a-1c2145942996	solicitud	a3bef359-b056-4e07-a052-8930ee6915f3	CREAR	null	{"confianza": 95, "estudiantes": [{"sexo": "F", "tipo": "P", "notas": [17, 15, 17, 10, 17, 13, 11, 15, 16, 19, 14, 20], "codigo": "EST-1995-0001", "numero": 1, "nombres": "Carlos Alberto", "observaciones": "1 asignaturas desaprobadas", "comportamiento": "A", "situacionFinal": "D", "apellidoMaterno": "Flores", "apellidoPaterno": "García", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "P", "notas": [10, 20, 12, 19, 12, 13, 12, 17, 12, 15, 19, 13], "codigo": "EST-1995-0002", "numero": 2, "nombres": "José Luis", "observaciones": "1 asignaturas desaprobadas", "comportamiento": "C", "situacionFinal": "D", "apellidoMaterno": "Torres", "apellidoPaterno": "Flores", "asignaturasDesaprobadas": 1}, {"sexo": "F", "tipo": "P", "notas": [20, 19, 18, 20, 12, 19, 11, 20, 14, 13, 17, 12], "codigo": "EST-1995-0003", "numero": 3, "nombres": "Rosa María", "comportamiento": "B", "situacionFinal": "A", "apellidoMaterno": "García", "apellidoPaterno": "Sánchez", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "P", "notas": [17, 19, 20, 17, 15, 16, 20, 17, 13, 17, 16, 15], "codigo": "EST-1995-0004", "numero": 4, "nombres": "Juan Carlos", "comportamiento": "C", "situacionFinal": "A", "apellidoMaterno": "García", "apellidoPaterno": "Torres", "asignaturasDesaprobadas": 0}, {"sexo": "F", "tipo": "G", "notas": [11, 11, 14, 19, 13, 18, 15, 10, 10, 13, 10, 16], "codigo": "EST-1995-0005", "numero": 5, "nombres": "Carmen Lucía", "observaciones": "3 asignaturas desaprobadas", "comportamiento": "B", "situacionFinal": "D", "apellidoMaterno": "Pérez", "apellidoPaterno": "Martínez", "asignaturasDesaprobadas": 3}, {"sexo": "F", "tipo": "G", "notas": [16, 16, 15, 20, 17, 18, 12, 12, 20, 13, 14, 11], "codigo": "EST-1995-0006", "numero": 6, "nombres": "José Luis", "comportamiento": "B", "situacionFinal": "A", "apellidoMaterno": "Martínez", "apellidoPaterno": "Martínez", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": [16, 15, 14, 10, 16, 13, 15, 20, 10, 18, 13, 16], "codigo": "EST-1995-0007", "numero": 7, "nombres": "María Elena", "observaciones": "2 asignaturas desaprobadas", "comportamiento": "C", "situacionFinal": "D", "apellidoMaterno": "Ramírez", "apellidoPaterno": "Torres", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "P", "notas": [20, 15, 19, 15, 13, 14, 14, 14, 20, 13, 11, 14], "codigo": "EST-1995-0008", "numero": 8, "nombres": "María Elena", "comportamiento": "C", "situacionFinal": "A", "apellidoMaterno": "González", "apellidoPaterno": "García", "asignaturasDesaprobadas": 0}, {"sexo": "F", "tipo": "P", "notas": [12, 14, 15, 13, 15, 10, 12, 12, 17, 10, 19, 13], "codigo": "EST-1995-0009", "numero": 9, "nombres": "Pedro Miguel", "observaciones": "2 asignaturas desaprobadas", "comportamiento": "B", "situacionFinal": "D", "apellidoMaterno": "Rodríguez", "apellidoPaterno": "Flores", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": [15, 15, 20, 14, 18, 14, 18, 12, 13, 19, 13, 15], "codigo": "EST-1995-0010", "numero": 10, "nombres": "José Luis", "comportamiento": "B", "situacionFinal": "A", "apellidoMaterno": "Martínez", "apellidoPaterno": "Flores", "asignaturasDesaprobadas": 0}, {"sexo": "F", "tipo": "P", "notas": [10, 13, 18, 16, 13, 20, 15, 12, 12, 15, 19, 19], "codigo": "EST-1995-0011", "numero": 11, "nombres": "Luis Fernando", "observaciones": "1 asignaturas desaprobadas", "comportamiento": "A", "situacionFinal": "D", "apellidoMaterno": "Ramírez", "apellidoPaterno": "Ramírez", "asignaturasDesaprobadas": 1}, {"sexo": "F", "tipo": "G", "notas": [10, 16, 19, 16, 19, 14, 12, 11, 15, 15, 14, 17], "codigo": "EST-1995-0012", "numero": 12, "nombres": "Julia Isabel", "observaciones": "1 asignaturas desaprobadas", "comportamiento": "A", "situacionFinal": "D", "apellidoMaterno": "López", "apellidoPaterno": "Ramírez", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": [15, 11, 11, 17, 12, 17, 18, 12, 15, 10, 14, 17], "codigo": "EST-1995-0013", "numero": 13, "nombres": "Julia Isabel", "observaciones": "1 asignaturas desaprobadas", "comportamiento": "A", "situacionFinal": "D", "apellidoMaterno": "Pérez", "apellidoPaterno": "González", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "P", "notas": [10, 11, 19, 12, 20, 13, 13, 12, 11, 19, 13, 20], "codigo": "EST-1995-0014", "numero": 14, "nombres": "Carmen Lucía", "observaciones": "1 asignaturas desaprobadas", "comportamiento": "B", "situacionFinal": "D", "apellidoMaterno": "Ramírez", "apellidoPaterno": "López", "asignaturasDesaprobadas": 1}, {"sexo": "F", "tipo": "G", "notas": [17, 10, 18, 13, 18, 19, 17, 17, 17, 18, 17, 18], "codigo": "EST-1995-0015", "numero": 15, "nombres": "María Elena", "observaciones": "1 asignaturas desaprobadas", "comportamiento": "C", "situacionFinal": "D", "apellidoMaterno": "Ramírez", "apellidoPaterno": "López", "asignaturasDesaprobadas": 1}, {"sexo": "F", "tipo": "P", "notas": [17, 10, 15, 10, 19, 18, 20, 12, 16, 13, 18, 13], "codigo": "EST-1995-0016", "numero": 16, "nombres": "Pedro Miguel", "observaciones": "2 asignaturas desaprobadas", "comportamiento": "A", "situacionFinal": "D", "apellidoMaterno": "Ramírez", "apellidoPaterno": "Pérez", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": [10, 12, 10, 15, 15, 11, 10, 17, 11, 15, 20, 13], "codigo": "EST-1995-0017", "numero": 17, "nombres": "Pedro Miguel", "observaciones": "3 asignaturas desaprobadas", "comportamiento": "A", "situacionFinal": "D", "apellidoMaterno": "Pérez", "apellidoPaterno": "Torres", "asignaturasDesaprobadas": 3}, {"sexo": "F", "tipo": "G", "notas": [10, 10, 19, 16, 14, 14, 20, 10, 20, 10, 18, 20], "codigo": "EST-1995-0018", "numero": 18, "nombres": "Julia Isabel", "observaciones": "4 asignaturas desaprobadas", "comportamiento": "C", "situacionFinal": "R", "apellidoMaterno": "Martínez", "apellidoPaterno": "Rodríguez", "asignaturasDesaprobadas": 4}, {"sexo": "M", "tipo": "P", "notas": [14, 15, 12, 15, 18, 15, 13, 15, 12, 18, 12, 15], "codigo": "EST-1995-0019", "numero": 19, "nombres": "Carlos Alberto", "comportamiento": "C", "situacionFinal": "A", "apellidoMaterno": "Sánchez", "apellidoPaterno": "Flores", "asignaturasDesaprobadas": 0}, {"sexo": "F", "tipo": "G", "notas": [10, 14, 13, 12, 11, 12, 17, 15, 14, 14, 12, 17], "codigo": "EST-1995-0020", "numero": 20, "nombres": "Ana Patricia", "observaciones": "1 asignaturas desaprobadas", "comportamiento": "B", "situacionFinal": "D", "apellidoMaterno": "Martínez", "apellidoPaterno": "García", "asignaturasDesaprobadas": 1}, {"sexo": "F", "tipo": "P", "notas": [11, 16, 20, 18, 13, 11, 10, 12, 16, 19, 20, 10], "codigo": "EST-1995-0021", "numero": 21, "nombres": "Ana Patricia", "observaciones": "2 asignaturas desaprobadas", "comportamiento": "A", "situacionFinal": "D", "apellidoMaterno": "Martínez", "apellidoPaterno": "Martínez", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": [15, 11, 11, 18, 12, 10, 14, 11, 18, 10, 10, 10], "codigo": "EST-1995-0022", "numero": 22, "nombres": "Pedro Miguel", "observaciones": "4 asignaturas desaprobadas", "comportamiento": "A", "situacionFinal": "R", "apellidoMaterno": "García", "apellidoPaterno": "López", "asignaturasDesaprobadas": 4}, {"sexo": "M", "tipo": "G", "notas": [12, 19, 20, 19, 20, 16, 12, 12, 18, 18, 12, 13], "codigo": "EST-1995-0023", "numero": 23, "nombres": "Julia Isabel", "comportamiento": "C", "situacionFinal": "A", "apellidoMaterno": "García", "apellidoPaterno": "Rodríguez", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": [19, 10, 17, 15, 10, 13, 11, 13, 16, 16, 15, 15], "codigo": "EST-1995-0024", "numero": 24, "nombres": "Rosa María", "observaciones": "2 asignaturas desaprobadas", "comportamiento": "C", "situacionFinal": "D", "apellidoMaterno": "Sánchez", "apellidoPaterno": "Pérez", "asignaturasDesaprobadas": 2}], "advertencias": [], "metadataActa": {"grado": "Quinto Grado", "turno": "MAÑANA", "seccion": "A", "anioLectivo": 1995, "colegioOrigen": "I.E. Prueba", "tipoEvaluacion": "FINAL"}, "totalEstudiantes": 24}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 13:50:35.91-05
53bbcbf2-5745-464a-a8e6-896ffa2296c7	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 09:37:11.098-05
76bfb0a3-1e28-4500-8337-2ae24a6b8ca6	solicitud	c8fb92c5-4227-447c-b5bb-778e6d2083d0	CREAR	null	{"id": "c8fb92c5-4227-447c-b5bb-778e6d2083d0", "pago": null, "estado": "EN_BUSQUEDA", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "2551e254-de04-43d2-85f4-9db0f2967d0d", "dni": "88878797", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "EDWARD RODRIGO", "telefono": "989989989", "direccion": null, "fecharegistro": "2025-11-07T06:38:48.486Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "EDWARD RODRIGO GGJGHJGHJ URIARTE ANCCOTA", "apellidomaterno": "URIARTE ANCCOTA", "apellidopaterno": "GGJGHJGHJ", "fechanacimiento": "2012-12-20T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T06:38:48.486Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "2551e254-de04-43d2-85f4-9db0f2967d0d", "motivorechazo": null, "observaciones": "Editor ha iniciado la búsqueda del acta física", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T06:40:11.039Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000001", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000001", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T16:18:50.816Z", "fechainicioproceso": "2025-11-07T15:50:23.346Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:18:50.875-05
7565d593-7b5f-495c-8d89-fd95814a248f	solicitud	bad399b0-2427-49f5-bc70-f996f5d59702	CREAR	null	{"id": "bad399b0-2427-49f5-bc70-f996f5d59702", "pago": null, "estado": "EN_BUSQUEDA", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "89452da3-386f-43a2-894f-5c2677318857", "dni": "67676767", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "Edard", "telefono": "996967969", "direccion": null, "fecharegistro": "2025-11-07T13:35:31.009Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "Edard GFHGFH Michael", "apellidomaterno": "Michael", "apellidopaterno": "GFHGFH", "fechanacimiento": "2012-12-26T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T13:35:31.009Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "89452da3-386f-43a2-894f-5c2677318857", "motivorechazo": null, "observaciones": "Editor ha iniciado la búsqueda del acta física", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T13:35:31.039Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000005", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000005", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T16:19:03.733Z", "fechainicioproceso": "2025-11-07T15:50:23.346Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:19:03.763-05
7a381c16-25dd-4706-b780-2203b9fbe454	solicitud	bad399b0-2427-49f5-bc70-f996f5d59702	CREAR	null	{"id": "bad399b0-2427-49f5-bc70-f996f5d59702", "pago": null, "estado": "ACTA_NO_ENCONTRADA", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "89452da3-386f-43a2-894f-5c2677318857", "dni": "67676767", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "Edard", "telefono": "996967969", "direccion": null, "fecharegistro": "2025-11-07T13:35:31.009Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "Edard GFHGFH Michael", "apellidomaterno": "Michael", "apellidopaterno": "GFHGFH", "fechanacimiento": "2012-12-26T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T13:35:31.009Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": "2025-11-07T16:20:18.024Z", "estudiante_id": "89452da3-386f-43a2-894f-5c2677318857", "motivorechazo": "Acta física no encontrada en archivo", "observaciones": "Acta no encontrada. Motivo: no se ecnontro", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T13:35:31.039Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000005", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000005", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T16:20:18.027Z", "fechainicioproceso": "2025-11-07T15:50:23.346Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:20:18.18-05
b200f5a0-9728-4e91-bfd5-5c82610123c4	solicitud	c8fb92c5-4227-447c-b5bb-778e6d2083d0	CREAR	null	{"id": "c8fb92c5-4227-447c-b5bb-778e6d2083d0", "pago": null, "estado": "ACTA_NO_ENCONTRADA", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "2551e254-de04-43d2-85f4-9db0f2967d0d", "dni": "88878797", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "EDWARD RODRIGO", "telefono": "989989989", "direccion": null, "fecharegistro": "2025-11-07T06:38:48.486Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "EDWARD RODRIGO GGJGHJGHJ URIARTE ANCCOTA", "apellidomaterno": "URIARTE ANCCOTA", "apellidopaterno": "GGJGHJGHJ", "fechanacimiento": "2012-12-20T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T06:38:48.486Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": "2025-11-07T16:21:29.900Z", "estudiante_id": "2551e254-de04-43d2-85f4-9db0f2967d0d", "motivorechazo": "Acta física no encontrada en archivo", "observaciones": "Acta no encontrada. Motivo: no se encontro", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T06:40:11.039Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000001", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000001", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T16:21:29.903Z", "fechainicioproceso": "2025-11-07T15:50:23.346Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:21:30.14-05
273a422b-0ca8-4d43-9548-ad033ee2117b	solicitud	f7ad112b-4ab4-4caf-acfd-b7c99573f1db	CREAR	null	{"id": "f7ad112b-4ab4-4caf-acfd-b7c99573f1db", "pago": null, "estado": "EN_BUSQUEDA", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "f0059948-7954-4ed8-bc16-d65664781e71", "dni": "55474554", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "Edard", "telefono": "976996956", "direccion": null, "fecharegistro": "2025-11-07T13:47:28.812Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "Edard fdf Michael", "apellidomaterno": "Michael", "apellidopaterno": "fdf", "fechanacimiento": "2012-12-06T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T13:47:28.812Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "f0059948-7954-4ed8-bc16-d65664781e71", "motivorechazo": null, "observaciones": "Editor ha iniciado la búsqueda del acta física", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T13:47:28.832Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000006", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000006", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T16:37:53.056Z", "fechainicioproceso": "2025-11-07T16:37:31.242Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:37:53.186-05
be06e977-e5fc-4490-84ed-2eb1dd4e153a	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 14:07:32.532-05
afa5c471-ff5a-4c77-a66c-d8166214cc2f	sesion	8c910c50-3759-4c0c-aa45-4868eb7d9dc6	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 14:07:44.01-05
08970a5c-7f67-46b9-8977-ecf9cc11cc16	sesion	6c1b0358-c5fe-49cf-86b1-49dd0a33a0ec	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 14:09:56.709-05
0d1126b0-3012-47ca-b553-26c08e1ee53a	solicitud	a243802d-0c0f-4a06-a509-ae242ad08775	CREAR	null	{"id": "a243802d-0c0f-4a06-a509-ae242ad08775", "pago": null, "estado": "EN_BUSQUEDA", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "3d54c7bf-2840-44c0-a19f-e9642427c331", "dni": "54654655", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "FGDF", "telefono": "967858865", "direccion": null, "fecharegistro": "2025-11-07T13:55:46.180Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "FGDF FTYT FTYRT", "apellidomaterno": "FTYRT", "apellidopaterno": "FTYT", "fechanacimiento": "2012-12-14T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T13:55:46.180Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "3d54c7bf-2840-44c0-a19f-e9642427c331", "motivorechazo": null, "observaciones": "Editor ha iniciado la búsqueda del acta física", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T13:55:46.219Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000007", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000007", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T16:38:10.721Z", "fechainicioproceso": "2025-11-07T16:37:31.237Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:38:10.749-05
55ca9ab9-be2c-433d-9c81-46f8f6d81424	solicitud	982e2774-101e-4650-9f48-4d35c26fc278	CREAR	null	{"id": "982e2774-101e-4650-9f48-4d35c26fc278", "pago": null, "estado": "ACTA_ENCONTRADA_PENDIENTE_PAGO", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "7ee515b9-4934-4a83-b2ee-a7dadde3d5fb", "dni": "76766575", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "fghddf", "telefono": "987976979", "direccion": null, "fecharegistro": "2025-11-07T14:38:15.765Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "fghddf fgdfgd Michael", "apellidomaterno": "Michael", "apellidopaterno": "fgdfgd", "fechanacimiento": "2012-12-12T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T14:38:15.765Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "7ee515b9-4934-4a83-b2ee-a7dadde3d5fb", "motivorechazo": null, "observaciones": "{\\"datosAcademicos\\":{\\"departamento\\":\\"20\\",\\"provincia\\":\\"2001\\",\\"distrito\\":\\"200101\\",\\"nombreColegio\\":\\"dsgsdgsd\\",\\"ultimoAnioCursado\\":1997,\\"nivel\\":\\"SECUNDARIA\\"},\\"contacto\\":{\\"celular\\":\\"987976979\\",\\"email\\":null},\\"motivoSolicitud\\":\\"TRAMITE_LABORAL\\",\\"esApoderado\\":false,\\"datosApoderado\\":null}", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T14:38:15.784Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000008", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000008", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T16:41:19.298Z", "fechainicioproceso": "2025-11-07T16:37:31.203Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:41:19.619-05
33504782-dddc-4788-b117-d4645d8cb923	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:41:31.884-05
37c6b048-28a8-4f44-bdf5-c877801915ee	sesion	e44bcef9-cd3d-467c-beaf-18ff0e4e5609	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:41:45.106-05
f1f3192c-c240-4015-9972-615abc5a4535	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:17:19.828-05
953c103c-b0cc-498c-8240-c55f42a8a19b	sesion	f238e509-cabe-42c7-b843-ec4db73ec399	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:17:57.159-05
9e38ac2a-2bb3-4bee-9e0f-9378e77d2f0f	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:18:27.315-05
33e14ae1-8611-4fbb-afc3-f183d8166287	sesion	58089d82-e457-4a76-b571-61c7731d7c5e	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:18:34.129-05
b0f4d48f-c98b-42e5-beb9-08096f479bd3	sesion	15a12912-706f-4df4-bc37-ebe819e55bfc	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:23:45.287-05
2b70fd60-1b61-4350-b1b9-181e75527e3b	solicitud	cfb3fdbf-0abc-4c95-95cd-3d087c8e034b	CREAR	null	{"id": "cfb3fdbf-0abc-4c95-95cd-3d087c8e034b", "pago": null, "estado": "EN_BUSQUEDA", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "514e0b37-4d14-4f8f-b47e-ab99321fc3c9", "dni": "67657567", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "Edard", "telefono": "998909098", "direccion": null, "fecharegistro": "2025-11-07T17:22:09.629Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "Edard fgfdg Michael", "apellidomaterno": "Michael", "apellidopaterno": "fgfdg", "fechanacimiento": "2012-12-21T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T17:22:09.629Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "514e0b37-4d14-4f8f-b47e-ab99321fc3c9", "motivorechazo": null, "observaciones": "{\\"datosAcademicos\\":{\\"departamento\\":\\"02\\",\\"provincia\\":\\"0216\\",\\"distrito\\":\\"021604\\",\\"nombreColegio\\":\\"vcvdvdssvdd\\",\\"ultimoAnioCursado\\":1995,\\"nivel\\":\\"SECUNDARIA\\"},\\"contacto\\":{\\"celular\\":\\"998909098\\",\\"email\\":null},\\"motivoSolicitud\\":\\"CONTINUIDAD_ESTUDIOS\\",\\"esApoderado\\":false,\\"datosApoderado\\":null}", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T17:22:09.659Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000009", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000009", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T17:23:56.678Z", "fechainicioproceso": "2025-11-07T17:23:30.063Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:23:56.698-05
923cc1d7-e49b-4c7a-b74f-149ec735941c	solicitud	cfb3fdbf-0abc-4c95-95cd-3d087c8e034b	CREAR	null	{"id": "cfb3fdbf-0abc-4c95-95cd-3d087c8e034b", "pago": null, "estado": "ACTA_ENCONTRADA_PENDIENTE_PAGO", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "514e0b37-4d14-4f8f-b47e-ab99321fc3c9", "dni": "67657567", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "Edard", "telefono": "998909098", "direccion": null, "fecharegistro": "2025-11-07T17:22:09.629Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "Edard fgfdg Michael", "apellidomaterno": "Michael", "apellidopaterno": "fgfdg", "fechanacimiento": "2012-12-21T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T17:22:09.629Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "514e0b37-4d14-4f8f-b47e-ab99321fc3c9", "motivorechazo": null, "observaciones": "{\\"datosAcademicos\\":{\\"departamento\\":\\"02\\",\\"provincia\\":\\"0216\\",\\"distrito\\":\\"021604\\",\\"nombreColegio\\":\\"vcvdvdssvdd\\",\\"ultimoAnioCursado\\":1995,\\"nivel\\":\\"SECUNDARIA\\"},\\"contacto\\":{\\"celular\\":\\"998909098\\",\\"email\\":null},\\"motivoSolicitud\\":\\"CONTINUIDAD_ESTUDIOS\\",\\"esApoderado\\":false,\\"datosApoderado\\":null}", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T17:22:09.659Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000009", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000009", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T17:25:12.158Z", "fechainicioproceso": "2025-11-07T17:23:30.063Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:25:12.35-05
bf28d76e-4106-4a62-8dc9-2b4eaec506f1	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:25:20.548-05
31e19da8-d60b-4093-9e1c-ed904ea123a6	sesion	5ae98759-e248-4596-a015-c7a8c51e53f1	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:25:29.627-05
9288f610-4258-47a0-9532-c8aa6e28c299	sesion	9ede0188-0ddc-43d1-aeb9-2d4ba4b35a5b	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:43:12.626-05
52c32fd6-46e1-43ab-a262-ceeebb93193b	sesion	b6cd89cd-2734-403c-a123-61a5bc4ab8fb	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:26:15.142-05
000fa510-dd63-401b-aa52-a18514833703	sesion	54802fee-d983-4337-83a1-34d7d2f0f7e1	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:31:48.724-05
9aef2257-7e27-4b76-bc3e-c1d917389543	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:37:15.652-05
a1f42432-eb12-4538-bf47-fa10fced91df	sesion	4786ea67-a8bc-4d38-944c-eaed88c2df05	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:37:49.943-05
6745ce4a-5844-4c9d-b74c-8ac2fafb62e4	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:43:49.125-05
3ae16fc8-fff7-4490-bb5d-8d38be36a45e	sesion	125a4dff-6470-4228-b518-9590d93a4530	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:44:09.91-05
7aa278bf-1784-42d5-bfe5-3c8e6332252a	sesion	999d654b-ab7b-4813-ba61-b12582e50ac7	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 18:04:54.814-05
155ab2cc-9341-4182-9cb3-4f478270cdb0	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 18:05:02.565-05
cf7afd86-b5a1-4469-b82d-3ff568e0b167	sesion	0d145008-9d0a-469f-b1a9-0181d0671c25	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 18:05:07.967-05
12848d9c-6851-43e1-a33b-0e69c1de132c	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 18:20:31.401-05
1bc5552c-b26a-4c14-a319-5b26055326ee	sesion	84b1cd12-62b4-4359-8590-17415daeb31e	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 18:20:45.99-05
ccca34a9-189b-4e7a-a921-7abc0247fed9	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 19:50:21.942-05
1a1cf355-f66c-45c9-b3d8-a2a59a427c3f	sesion	0e2f17d0-9fbf-4195-94cd-7fa1c4dcf395	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 19:52:20.349-05
8070108e-9f93-4b31-b17b-f95d18485b9a	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 19:53:03.921-05
a42b7c9c-232e-408c-998e-5c1c81029a05	sesion	1e5c90f6-2503-4367-95ea-672bada7231f	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 19:53:11.447-05
9b288234-7bdb-4f97-9127-8ee3c0106037	sesion	1d5406e0-50b5-4644-9b88-353898bc65dc	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-09 20:10:14.33-05
3bd4e0b2-2c33-4514-97ce-3bb14c111120	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-09 20:21:44.063-05
89c0b8c3-26db-4473-8e65-8127d718c8c8	sesion	3a599a4c-3c9b-4bff-b8dc-a1c4c144e5c0	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-09 20:21:52.633-05
40078fdb-e7a2-4405-850c-c7b3549c66c3	actafisica	c85ca9af-55b6-48cf-91b1-7b44c2614339	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "tipoEvaluacion": "FINAL", "ubicacionFisica": "Archivo Central - Estante A - Caja 2."}	{"id": "c85ca9af-55b6-48cf-91b1-7b44c2614339", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "anio_fin": 1990, "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1"}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251107221315", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-07T22:13:15.647Z", "hasharchivo": null, "colegiorigen": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": "Archivo Central - Estante A - Caja 2.", "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,11,10,15,15,12,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,10,15,16,11,12,11,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":null,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"Sin especificar\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-07T22:13:15.647Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-07T22:13:15.647Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-09 20:41:14.584-05
f3698a96-948d-4d35-b364-f08dc2b0fabc	actafisica	0255cdce-f6f2-4d7d-976f-d65d7602c9e2	ACTUALIZAR	{"turno": "MAÑANA", "tipoEvaluacion": "FINAL"}	{"id": "0255cdce-f6f2-4d7d-976f-d65d7602c9e2", "tipo": "OCR_LIBRE", "folio": null, "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": null, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251107221309", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": null, "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-07T22:13:09.586Z", "hasharchivo": null, "colegiorigen": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,11,10,15,15,12,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,10,15,16,11,12,11,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":null,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"Sin especificar\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-07T22:13:09.586Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-07T22:13:09.586Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-09 20:41:36.617-05
d8d5bf6d-319c-45b6-bbec-870545bbcf17	actafisica	0255cdce-f6f2-4d7d-976f-d65d7602c9e2	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "tipoEvaluacion": "FINAL"}	{"id": "0255cdce-f6f2-4d7d-976f-d65d7602c9e2", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "anio_fin": 1990, "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1"}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251107221309", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-07T22:13:09.586Z", "hasharchivo": null, "colegiorigen": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,11,10,15,15,12,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,10,15,16,11,12,11,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":null,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"Sin especificar\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-07T22:13:09.586Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-07T22:13:09.586Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-09 20:41:47.335-05
32f093b2-d1c1-49fc-8035-4b669e6d32a4	actafisica	0255cdce-f6f2-4d7d-976f-d65d7602c9e2	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "estadoFisico": "BUENO", "colegioOrigen": ".", "observaciones": ".", "tipoEvaluacion": "FINAL", "ubicacionFisica": "Archivo Central - Estante A - Caja 2."}	{"id": "0255cdce-f6f2-4d7d-976f-d65d7602c9e2", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "anio_fin": 1990, "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1"}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251107221309", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-07T22:13:09.586Z", "hasharchivo": null, "colegiorigen": ".", "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": ".", "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": "Archivo Central - Estante A - Caja 2.", "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,11,10,15,15,12,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,10,15,16,11,12,11,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":null,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"Sin especificar\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-07T22:13:09.586Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-07T22:13:09.586Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-09 20:42:01.784-05
97f7874c-0c45-4391-a755-aafe57730acf	actafisica	0255cdce-f6f2-4d7d-976f-d65d7602c9e2	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "estadoFisico": "EXCELENTE", "observaciones": ".", "tipoEvaluacion": "FINAL", "ubicacionFisica": "Archivo Central - Estante A - Caja 2."}	{"id": "0255cdce-f6f2-4d7d-976f-d65d7602c9e2", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "anio_fin": 1990, "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1"}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251107221309", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-07T22:13:09.586Z", "hasharchivo": null, "colegiorigen": ".", "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": ".", "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": "Archivo Central - Estante A - Caja 2.", "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,11,10,15,15,12,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,10,15,16,11,12,11,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":null,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"Sin especificar\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-07T22:13:09.586Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-07T22:13:09.586Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-09 20:42:15.031-05
5759c24b-88d6-4aa1-bd1b-eb6e78a74397	actafisica	0255cdce-f6f2-4d7d-976f-d65d7602c9e2	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "colegioOrigen": ".", "observaciones": ".", "tipoEvaluacion": "FINAL", "ubicacionFisica": "Archivo Central - Estante A - Caja 2."}	{"id": "0255cdce-f6f2-4d7d-976f-d65d7602c9e2", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "anio_fin": 1990, "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1"}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251107221309", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-07T22:13:09.586Z", "hasharchivo": null, "colegiorigen": ".", "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": ".", "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": "Archivo Central - Estante A - Caja 2.", "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,11,10,15,15,12,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,10,15,16,11,12,11,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":null,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"Sin especificar\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-07T22:13:09.586Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-07T22:13:09.586Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-09 20:42:23.865-05
f71836c4-d224-4a28-afdd-129ea3d0d392	actafisica	0255cdce-f6f2-4d7d-976f-d65d7602c9e2	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "colegioOrigen": ".", "observaciones": ".", "tipoEvaluacion": "FINAL", "ubicacionFisica": "Archivo Central - Estante A - Caja 2."}	{"id": "0255cdce-f6f2-4d7d-976f-d65d7602c9e2", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "anio_fin": 1990, "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1"}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251107221309", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-07T22:13:09.586Z", "hasharchivo": null, "colegiorigen": ".", "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": ".", "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": "Archivo Central - Estante A - Caja 2.", "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,11,10,15,15,12,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,10,15,16,11,12,11,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":null,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"Sin especificar\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-07T22:13:09.586Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-07T22:13:09.586Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-09 20:46:06.426-05
6d14d4d8-9391-48b2-bd5c-348fe582acf4	sesion	b0ce2dee-5788-43cc-a414-81f859f0c6bf	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 18:04:46.751-05
ac57be7a-1726-4553-bfd5-43c4303185be	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 07:53:33.264-05
47fbad8e-26de-4fb9-ac0f-c5c8f4dff804	actafisica	0255cdce-f6f2-4d7d-976f-d65d7602c9e2	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "colegioOrigen": ".", "observaciones": ".", "tipoEvaluacion": "FINAL", "ubicacionFisica": "Archivo Central - Estante A - Caja 2."}	{"id": "0255cdce-f6f2-4d7d-976f-d65d7602c9e2", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "anio_fin": 1990, "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1"}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251107221309", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-07T22:13:09.586Z", "hasharchivo": null, "colegiorigen": ".", "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": ".", "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": "Archivo Central - Estante A - Caja 2.", "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,11,10,15,15,12,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,10,15,16,11,12,11,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":null,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"Sin especificar\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-07T22:13:09.586Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-07T22:13:09.586Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-09 20:46:25.26-05
4e908589-b075-4fd4-b62d-10dd65cecb20	actafisica	0255cdce-f6f2-4d7d-976f-d65d7602c9e2	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "colegioOrigen": ".", "observaciones": ".", "tipoEvaluacion": "FINAL", "ubicacionFisica": "Archivo Central - Estante A - Caja 2."}	{"id": "0255cdce-f6f2-4d7d-976f-d65d7602c9e2", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "anio_fin": 1990, "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1"}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251107221309", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-07T22:13:09.586Z", "hasharchivo": null, "colegiorigen": ".", "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": ".", "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": "Archivo Central - Estante A - Caja 2.", "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,11,10,15,15,12,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,10,15,16,11,12,11,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":null,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"Sin especificar\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-07T22:13:09.586Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-07T22:13:09.586Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-09 20:46:33.206-05
020b3de2-6bd1-4051-8471-98e9b4003c8c	actafisica	c85ca9af-55b6-48cf-91b1-7b44c2614339	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "colegioOrigen": ".", "tipoEvaluacion": "FINAL", "ubicacionFisica": "Archivo Central - Estante A - Caja 2."}	{"id": "c85ca9af-55b6-48cf-91b1-7b44c2614339", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "anio_fin": 1990, "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1"}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251107221315", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-07T22:13:15.647Z", "hasharchivo": null, "colegiorigen": ".", "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": "Archivo Central - Estante A - Caja 2.", "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,11,10,15,15,12,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,10,15,16,11,12,11,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":null,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"Sin especificar\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-07T22:13:15.647Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-07T22:13:15.647Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-09 20:47:10.99-05
47f5da7f-e4b7-4421-90c9-f553e006da45	actafisica	c85ca9af-55b6-48cf-91b1-7b44c2614339	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "colegioOrigen": ".", "tipoEvaluacion": "FINAL", "ubicacionFisica": "Archivo Central - Estante A - Caja 2."}	{"id": "c85ca9af-55b6-48cf-91b1-7b44c2614339", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "anio_fin": 1990, "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1"}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251107221315", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-07T22:13:15.647Z", "hasharchivo": null, "colegiorigen": ".", "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": "Archivo Central - Estante A - Caja 2.", "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,11,10,15,15,12,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,10,15,16,11,12,11,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":null,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"Sin especificar\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-07T22:13:15.647Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-07T22:13:15.647Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-09 20:52:54.869-05
f605b9e1-9477-4570-aee4-fd8bec75e5aa	actafisica	c85ca9af-55b6-48cf-91b1-7b44c2614339	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "colegioOrigen": ".", "tipoEvaluacion": "FINAL", "ubicacionFisica": "Archivo Central - Estante A - Caja 2."}	{"id": "c85ca9af-55b6-48cf-91b1-7b44c2614339", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "anio_fin": 1990, "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1"}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251107221315", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-07T22:13:15.647Z", "hasharchivo": null, "colegiorigen": ".", "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": "Archivo Central - Estante A - Caja 2.", "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,11,10,15,15,12,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,10,15,16,11,12,11,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":null,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"Sin especificar\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-07T22:13:15.647Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-07T22:13:15.647Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-09 20:55:14.198-05
24950de4-6496-4979-98b7-416a850a676e	actafisica	c85ca9af-55b6-48cf-91b1-7b44c2614339	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "libroId": "cd21550c-b652-4be8-a820-83ff6680c6cf", "colegioOrigen": ".", "tipoEvaluacion": "FINAL", "ubicacionFisica": "Archivo Central - Estante A - Caja 2."}	{"id": "c85ca9af-55b6-48cf-91b1-7b44c2614339", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "cd21550c-b652-4be8-a820-83ff6680c6cf", "activo": true, "codigo": "2", "estado": "ACTIVO", "anio_fin": 1995, "anio_inicio": 1991, "descripcion": "Libro de actas 1991-1995", "total_folios": 480, "observaciones": "", "fecha_creacion": "2025-11-10T01:15:57.150Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 2."}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251107221315", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "cd21550c-b652-4be8-a820-83ff6680c6cf", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-07T22:13:15.647Z", "hasharchivo": null, "colegiorigen": ".", "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": "Archivo Central - Estante A - Caja 2.", "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,11,10,15,15,12,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,10,15,16,11,12,11,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":null,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"Sin especificar\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-07T22:13:15.647Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-07T22:13:15.647Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-09 21:01:20.602-05
a1554f78-d2aa-46f9-b760-be5a10fe285a	actafisica	0255cdce-f6f2-4d7d-976f-d65d7602c9e2	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "colegioOrigen": ".", "observaciones": ".", "tipoEvaluacion": "FINAL", "ubicacionFisica": "Archivo Central - Estante A - Caja 2."}	{"id": "0255cdce-f6f2-4d7d-976f-d65d7602c9e2", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "anio_fin": 1990, "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1"}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251107221309", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-07T22:13:09.586Z", "hasharchivo": null, "colegiorigen": ".", "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": ".", "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": "Archivo Central - Estante A - Caja 2.", "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,11,10,15,15,12,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,10,15,16,11,12,11,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":null,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"Sin especificar\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-07T22:13:09.586Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-07T22:13:09.586Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-09 21:01:26.413-05
58f2197b-e8bd-482a-b73f-f3643e308ce1	actafisica	d5f26eda-c41c-4083-943b-82b750628a17	ACTUALIZAR	{"folio": "1", "turno": "TARDE", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "colegioOrigen": ".", "tipoEvaluacion": "FINAL", "ubicacionFisica": "Archivo Central - Estante A - Caja 2."}	{"id": "d5f26eda-c41c-4083-943b-82b750628a17", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": null, "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "anio_fin": 1990, "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1"}, "turno": "TARDE", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251110051116", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-10T05:11:16.829Z", "hasharchivo": null, "colegiorigen": ".", "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": "Archivo Central - Estante A - Caja 2.", "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,13,11,10,15,15,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,12,10,15,16,11,12,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":2025,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"No especificado\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"FINAL\\",\\"turno\\":\\"TARDE\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-10T05:11:16.829Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-10T05:11:16.829Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-10 00:18:37.318-05
4126e81c-7890-44ca-8001-bc170b68aa39	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-10 00:26:29.862-05
4a4519de-c7f9-4448-9f85-3402643d216c	sesion	256a4873-c592-419c-a167-06a4c62aaadc	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-10 00:26:37.431-05
63a2a539-798d-4dfb-8004-49a5cadba5ce	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-10 11:04:33.418-05
3434b431-ece4-4ccf-918e-236e55c2604e	sesion	a2319045-c52a-416a-a5f4-d60a5c2ab2f2	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-10 11:04:41.044-05
2d5f0742-98be-4043-9a43-bbc0e6f455db	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-10 17:32:30.028-05
db23178e-c420-4de2-8956-00a9465e5004	sesion	56e39805-9a4c-45be-90a4-e12a0c0251ef	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-10 22:52:16.552-05
e2c54377-c0bd-4301-950d-016a1daa388e	usuario	b2a4c63b-c401-49f6-8dca-e56b86aa7b7f	CREAR	null	{"id": "b2a4c63b-c401-49f6-8dca-e56b86aa7b7f", "dni": "12345678", "cargo": "Editor", "email": "editor@test.com", "roles": [{"id": "b7db07f2-911e-4266-944f-bab290f299b6", "nivel": 3, "codigo": "EDITOR", "nombre": "Editor", "permisos": [{"id": "023dff69-b5fb-490a-bf29-718bffd8d1c2", "codigo": "SOLICITUDES_VER", "modulo": "SOLICITUDES", "nombre": "Ver solicitudes"}, {"id": "09f72675-1acf-49e3-b760-a5abeba5141e", "codigo": "ACTAS_EXPORTAR", "modulo": "ACTAS", "nombre": "Exportar actas"}, {"id": "0bb1a087-48d8-4558-acef-c6493e03b820", "codigo": "AREAS_EDITAR", "modulo": "AREAS", "nombre": "Editar áreas"}, {"id": "121ce9a9-b0fc-4aae-8410-ae2b76583ea3", "codigo": "CERTIFICADOS_CREAR", "modulo": "CERTIFICADOS", "nombre": "Crear certificados"}, {"id": "2c1fbbf8-6449-4b42-9a91-40ca1c78c848", "codigo": "NIVELES_VER", "modulo": "NIVELES", "nombre": "Ver niveles educativos"}, {"id": "2f77e12b-af1a-47a9-b62b-6aff4d1bb277", "codigo": "ACTAS_VER", "modulo": "ACTAS", "nombre": "Ver actas físicas"}, {"id": "324d992f-836a-442d-a006-7e83ff929040", "codigo": "GRADOS_EDITAR", "modulo": "GRADOS", "nombre": "Editar grados"}, {"id": "373960e5-3a30-47d0-a3a4-0700c99ca736", "codigo": "ACTAS_EDITAR", "modulo": "ACTAS", "nombre": "Editar actas físicas"}, {"id": "3a263122-252b-4e00-8a4b-e089f158ba65", "codigo": "NIVELES_CREAR", "modulo": "NIVELES", "nombre": "Crear niveles"}, {"id": "4315a4c1-a2e7-43b8-b01f-c91534a7a552", "codigo": "AUTH_REFRESH", "modulo": "AUTH", "nombre": "Renovar token"}, {"id": "515dc723-213f-4412-8010-7ba17c277f49", "codigo": "AREAS_VER", "modulo": "AREAS", "nombre": "Ver áreas curriculares"}, {"id": "546f8384-25aa-4f42-9973-95b286fe39bc", "codigo": "SOLICITUDES_PROCESAR", "modulo": "SOLICITUDES", "nombre": "Procesar solicitudes"}, {"id": "727061fc-433a-4f13-a259-116c8b728ba3", "codigo": "CERTIFICADOS_VER", "modulo": "CERTIFICADOS", "nombre": "Ver certificados"}, {"id": "730e1785-bc51-4f90-b277-a3b4f18d429a", "codigo": "SOLICITUDES_EDITAR", "modulo": "SOLICITUDES", "nombre": "Editar solicitudes"}, {"id": "7ac196ef-bc52-4cc5-bef7-bcb5080cd824", "codigo": "AUTH_LOGOUT", "modulo": "AUTH", "nombre": "Cerrar sesión"}, {"id": "87178d4e-93f6-4456-80b5-b2723917701f", "codigo": "NIVELES_EDITAR", "modulo": "NIVELES", "nombre": "Editar niveles"}, {"id": "88fe8462-d786-4773-8d4e-b644967b5f5b", "codigo": "ESTUDIANTES_EDITAR", "modulo": "ESTUDIANTES", "nombre": "Editar estudiantes"}, {"id": "8f968910-2a82-4e20-8a44-6975df1ce6da", "codigo": "ANIOS_VER", "modulo": "ANIOS", "nombre": "Ver años lectivos"}, {"id": "9517a57a-b8c6-461e-b85b-6cc23ae331d0", "codigo": "ANIOS_CREAR", "modulo": "ANIOS", "nombre": "Crear años lectivos"}, {"id": "9ebaefda-e1d6-4e67-821c-e86cda440505", "codigo": "SOLICITUDES_BUSCAR", "modulo": "SOLICITUDES", "nombre": "Buscar actas físicas"}, {"id": "a02faf67-ffa1-4ca7-872b-76ad91220331", "codigo": "GRADOS_VER", "modulo": "GRADOS", "nombre": "Ver grados"}, {"id": "a7b2f88e-76ee-4787-8b47-38697aaf5928", "codigo": "GRADOS_CREAR", "modulo": "GRADOS", "nombre": "Crear grados"}, {"id": "b970eff9-178c-4fbd-b683-fba92bd6f11e", "codigo": "SOLICITUDES_GESTIONAR", "modulo": "SOLICITUDES", "nombre": "Gestionar solicitudes"}, {"id": "babbb549-2156-444f-8888-000f1151753b", "codigo": "CERTIFICADOS_EXPORTAR", "modulo": "CERTIFICADOS", "nombre": "Exportar certificados"}, {"id": "be22ea9d-1d77-40bf-8f93-d7aad2b9c0f9", "codigo": "ANIOS_EDITAR", "modulo": "ANIOS", "nombre": "Editar años lectivos"}, {"id": "d4e8499a-a4ae-4660-bd61-0661f31c0c32", "codigo": "ESTUDIANTES_CREAR", "modulo": "ESTUDIANTES", "nombre": "Crear estudiantes"}, {"id": "e8f16323-04be-45fc-99a7-0b3d69099a93", "codigo": "AUTH_LOGIN", "modulo": "AUTH", "nombre": "Iniciar sesión"}, {"id": "eaa01141-77df-4d3f-ab18-d87d0db0f0c2", "codigo": "ACTAS_PROCESAR_OCR", "modulo": "ACTAS", "nombre": "Procesar OCR"}, {"id": "ecd4471f-63a9-457a-b54e-e25aae806ecc", "codigo": "AREAS_CREAR", "modulo": "AREAS", "nombre": "Crear áreas"}, {"id": "ef8360d0-ec30-4bed-87df-efe0006d11d0", "codigo": "NOTIFICACIONES_VER", "modulo": "NOTIFICACIONES", "nombre": "Ver notificaciones"}, {"id": "f3b72ab4-0f88-4b7e-9b90-a33382b01949", "codigo": "ACTAS_SUBIR", "modulo": "ACTAS", "nombre": "Subir actas físicas"}, {"id": "f4674967-ce64-48e1-97fa-60f9a56d521b", "codigo": "CERTIFICADOS_EDITAR", "modulo": "CERTIFICADOS", "nombre": "Editar certificados"}, {"id": "fc3dcfff-5909-431b-8dac-712b038788af", "codigo": "ESTUDIANTES_VER", "modulo": "ESTUDIANTES", "nombre": "Ver estudiantes"}]}], "activo": true, "nombres": "Editor", "permisos": ["SOLICITUDES_VER", "ACTAS_EXPORTAR", "AREAS_EDITAR", "CERTIFICADOS_CREAR", "NIVELES_VER", "ACTAS_VER", "GRADOS_EDITAR", "ACTAS_EDITAR", "NIVELES_CREAR", "AUTH_REFRESH", "AREAS_VER", "SOLICITUDES_PROCESAR", "CERTIFICADOS_VER", "SOLICITUDES_EDITAR", "AUTH_LOGOUT", "NIVELES_EDITAR", "ESTUDIANTES_EDITAR", "ANIOS_VER", "ANIOS_CREAR", "SOLICITUDES_BUSCAR", "GRADOS_VER", "GRADOS_CREAR", "SOLICITUDES_GESTIONAR", "CERTIFICADOS_EXPORTAR", "ANIOS_EDITAR", "ESTUDIANTES_CREAR", "AUTH_LOGIN", "ACTAS_PROCESAR_OCR", "AREAS_CREAR", "NOTIFICACIONES_VER", "ACTAS_SUBIR", "CERTIFICADOS_EDITAR", "ESTUDIANTES_VER"], "telefono": "987654321", "username": "editor_test", "apellidos": "Prueba"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 08:04:13.464-05
fa2e3fe7-c298-4e07-a32b-97a2d0a69ca4	usuario	b2a4c63b-c401-49f6-8dca-e56b86aa7b7f	CREAR	null	{"id": "b2a4c63b-c401-49f6-8dca-e56b86aa7b7f", "dni": "12345678", "cargo": "Editor", "email": "editor@test.com", "roles": [{"id": "f1c3a727-c1cd-4506-9df5-063faee768d9", "nivel": 2, "codigo": "MESA_DE_PARTES", "nombre": "Mesa de Partes", "permisos": [{"id": "023dff69-b5fb-490a-bf29-718bffd8d1c2", "codigo": "SOLICITUDES_VER", "modulo": "SOLICITUDES", "nombre": "Ver solicitudes"}, {"id": "09d69f96-a640-4b02-b872-f520f06f32ce", "codigo": "SOLICITUDES_ENTREGAR", "modulo": "SOLICITUDES", "nombre": "Marcar como entregado"}, {"id": "1da438a1-68c9-4311-831a-e11c229a800d", "codigo": "PAGOS_CREAR", "modulo": "PAGOS", "nombre": "Crear orden de pago"}, {"id": "4315a4c1-a2e7-43b8-b01f-c91534a7a552", "codigo": "AUTH_REFRESH", "modulo": "AUTH", "nombre": "Renovar token"}, {"id": "4b42a4da-d124-4982-8933-a3876613bbab", "codigo": "USUARIOS_VER", "modulo": "USUARIOS", "nombre": "Ver usuarios"}, {"id": "559d6323-935f-48e4-9fa4-c56c903ee10c", "codigo": "SOLICITUDES_DERIVAR", "modulo": "SOLICITUDES", "nombre": "Derivar solicitudes"}, {"id": "727061fc-433a-4f13-a259-116c8b728ba3", "codigo": "CERTIFICADOS_VER", "modulo": "CERTIFICADOS", "nombre": "Ver certificados"}, {"id": "730e1785-bc51-4f90-b277-a3b4f18d429a", "codigo": "SOLICITUDES_EDITAR", "modulo": "SOLICITUDES", "nombre": "Editar solicitudes"}, {"id": "762f6b65-abcb-469d-b980-cbd02694f1b1", "codigo": "SOLICITUDES_VALIDAR_PAGO", "modulo": "SOLICITUDES", "nombre": "Validar pagos de solicitudes"}, {"id": "7ac196ef-bc52-4cc5-bef7-bcb5080cd824", "codigo": "AUTH_LOGOUT", "modulo": "AUTH", "nombre": "Cerrar sesión"}, {"id": "88fe8462-d786-4773-8d4e-b644967b5f5b", "codigo": "ESTUDIANTES_EDITAR", "modulo": "ESTUDIANTES", "nombre": "Editar estudiantes"}, {"id": "a9055fe0-7a66-404c-a8bc-1fde89b2f803", "codigo": "SOLICITUDES_CREAR", "modulo": "SOLICITUDES", "nombre": "Crear solicitudes"}, {"id": "b320ff57-d12e-44cf-a5ba-1f45da797658", "codigo": "PAGOS_VALIDAR", "modulo": "PAGOS", "nombre": "Validar pagos"}, {"id": "bfad62d5-ad98-4883-b102-1f836b4614ae", "codigo": "PAGOS_REGISTRAR", "modulo": "PAGOS", "nombre": "Registrar pagos"}, {"id": "d4e8499a-a4ae-4660-bd61-0661f31c0c32", "codigo": "ESTUDIANTES_CREAR", "modulo": "ESTUDIANTES", "nombre": "Crear estudiantes"}, {"id": "d9371e35-d806-40e8-aea0-625feccc8aab", "codigo": "PAGOS_VER", "modulo": "PAGOS", "nombre": "Ver pagos"}, {"id": "e8f16323-04be-45fc-99a7-0b3d69099a93", "codigo": "AUTH_LOGIN", "modulo": "AUTH", "nombre": "Iniciar sesión"}, {"id": "ef8360d0-ec30-4bed-87df-efe0006d11d0", "codigo": "NOTIFICACIONES_VER", "modulo": "NOTIFICACIONES", "nombre": "Ver notificaciones"}, {"id": "fc3dcfff-5909-431b-8dac-712b038788af", "codigo": "ESTUDIANTES_VER", "modulo": "ESTUDIANTES", "nombre": "Ver estudiantes"}]}], "activo": true, "nombres": "Editor", "permisos": ["SOLICITUDES_VER", "SOLICITUDES_ENTREGAR", "PAGOS_CREAR", "AUTH_REFRESH", "USUARIOS_VER", "SOLICITUDES_DERIVAR", "CERTIFICADOS_VER", "SOLICITUDES_EDITAR", "SOLICITUDES_VALIDAR_PAGO", "AUTH_LOGOUT", "ESTUDIANTES_EDITAR", "SOLICITUDES_CREAR", "PAGOS_VALIDAR", "PAGOS_REGISTRAR", "ESTUDIANTES_CREAR", "PAGOS_VER", "AUTH_LOGIN", "NOTIFICACIONES_VER", "ESTUDIANTES_VER"], "telefono": "987654321", "username": "editor_test", "apellidos": "Prueba"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 08:05:20.104-05
9803b710-3f97-49f7-b2f4-9f676b65d0fe	usuario	b2a4c63b-c401-49f6-8dca-e56b86aa7b7f	CREAR	null	{"id": "b2a4c63b-c401-49f6-8dca-e56b86aa7b7f", "dni": "12345678", "cargo": "Editor", "email": "editor@test.com", "roles": [{"id": "b7db07f2-911e-4266-944f-bab290f299b6", "nivel": 3, "codigo": "EDITOR", "nombre": "Editor", "permisos": [{"id": "023dff69-b5fb-490a-bf29-718bffd8d1c2", "codigo": "SOLICITUDES_VER", "modulo": "SOLICITUDES", "nombre": "Ver solicitudes"}, {"id": "09f72675-1acf-49e3-b760-a5abeba5141e", "codigo": "ACTAS_EXPORTAR", "modulo": "ACTAS", "nombre": "Exportar actas"}, {"id": "0bb1a087-48d8-4558-acef-c6493e03b820", "codigo": "AREAS_EDITAR", "modulo": "AREAS", "nombre": "Editar áreas"}, {"id": "121ce9a9-b0fc-4aae-8410-ae2b76583ea3", "codigo": "CERTIFICADOS_CREAR", "modulo": "CERTIFICADOS", "nombre": "Crear certificados"}, {"id": "2c1fbbf8-6449-4b42-9a91-40ca1c78c848", "codigo": "NIVELES_VER", "modulo": "NIVELES", "nombre": "Ver niveles educativos"}, {"id": "2f77e12b-af1a-47a9-b62b-6aff4d1bb277", "codigo": "ACTAS_VER", "modulo": "ACTAS", "nombre": "Ver actas físicas"}, {"id": "324d992f-836a-442d-a006-7e83ff929040", "codigo": "GRADOS_EDITAR", "modulo": "GRADOS", "nombre": "Editar grados"}, {"id": "373960e5-3a30-47d0-a3a4-0700c99ca736", "codigo": "ACTAS_EDITAR", "modulo": "ACTAS", "nombre": "Editar actas físicas"}, {"id": "3a263122-252b-4e00-8a4b-e089f158ba65", "codigo": "NIVELES_CREAR", "modulo": "NIVELES", "nombre": "Crear niveles"}, {"id": "4315a4c1-a2e7-43b8-b01f-c91534a7a552", "codigo": "AUTH_REFRESH", "modulo": "AUTH", "nombre": "Renovar token"}, {"id": "515dc723-213f-4412-8010-7ba17c277f49", "codigo": "AREAS_VER", "modulo": "AREAS", "nombre": "Ver áreas curriculares"}, {"id": "546f8384-25aa-4f42-9973-95b286fe39bc", "codigo": "SOLICITUDES_PROCESAR", "modulo": "SOLICITUDES", "nombre": "Procesar solicitudes"}, {"id": "727061fc-433a-4f13-a259-116c8b728ba3", "codigo": "CERTIFICADOS_VER", "modulo": "CERTIFICADOS", "nombre": "Ver certificados"}, {"id": "730e1785-bc51-4f90-b277-a3b4f18d429a", "codigo": "SOLICITUDES_EDITAR", "modulo": "SOLICITUDES", "nombre": "Editar solicitudes"}, {"id": "7ac196ef-bc52-4cc5-bef7-bcb5080cd824", "codigo": "AUTH_LOGOUT", "modulo": "AUTH", "nombre": "Cerrar sesión"}, {"id": "87178d4e-93f6-4456-80b5-b2723917701f", "codigo": "NIVELES_EDITAR", "modulo": "NIVELES", "nombre": "Editar niveles"}, {"id": "88fe8462-d786-4773-8d4e-b644967b5f5b", "codigo": "ESTUDIANTES_EDITAR", "modulo": "ESTUDIANTES", "nombre": "Editar estudiantes"}, {"id": "8f968910-2a82-4e20-8a44-6975df1ce6da", "codigo": "ANIOS_VER", "modulo": "ANIOS", "nombre": "Ver años lectivos"}, {"id": "9517a57a-b8c6-461e-b85b-6cc23ae331d0", "codigo": "ANIOS_CREAR", "modulo": "ANIOS", "nombre": "Crear años lectivos"}, {"id": "9ebaefda-e1d6-4e67-821c-e86cda440505", "codigo": "SOLICITUDES_BUSCAR", "modulo": "SOLICITUDES", "nombre": "Buscar actas físicas"}, {"id": "a02faf67-ffa1-4ca7-872b-76ad91220331", "codigo": "GRADOS_VER", "modulo": "GRADOS", "nombre": "Ver grados"}, {"id": "a7b2f88e-76ee-4787-8b47-38697aaf5928", "codigo": "GRADOS_CREAR", "modulo": "GRADOS", "nombre": "Crear grados"}, {"id": "b970eff9-178c-4fbd-b683-fba92bd6f11e", "codigo": "SOLICITUDES_GESTIONAR", "modulo": "SOLICITUDES", "nombre": "Gestionar solicitudes"}, {"id": "babbb549-2156-444f-8888-000f1151753b", "codigo": "CERTIFICADOS_EXPORTAR", "modulo": "CERTIFICADOS", "nombre": "Exportar certificados"}, {"id": "be22ea9d-1d77-40bf-8f93-d7aad2b9c0f9", "codigo": "ANIOS_EDITAR", "modulo": "ANIOS", "nombre": "Editar años lectivos"}, {"id": "d4e8499a-a4ae-4660-bd61-0661f31c0c32", "codigo": "ESTUDIANTES_CREAR", "modulo": "ESTUDIANTES", "nombre": "Crear estudiantes"}, {"id": "e8f16323-04be-45fc-99a7-0b3d69099a93", "codigo": "AUTH_LOGIN", "modulo": "AUTH", "nombre": "Iniciar sesión"}, {"id": "eaa01141-77df-4d3f-ab18-d87d0db0f0c2", "codigo": "ACTAS_PROCESAR_OCR", "modulo": "ACTAS", "nombre": "Procesar OCR"}, {"id": "ecd4471f-63a9-457a-b54e-e25aae806ecc", "codigo": "AREAS_CREAR", "modulo": "AREAS", "nombre": "Crear áreas"}, {"id": "ef8360d0-ec30-4bed-87df-efe0006d11d0", "codigo": "NOTIFICACIONES_VER", "modulo": "NOTIFICACIONES", "nombre": "Ver notificaciones"}, {"id": "f3b72ab4-0f88-4b7e-9b90-a33382b01949", "codigo": "ACTAS_SUBIR", "modulo": "ACTAS", "nombre": "Subir actas físicas"}, {"id": "f4674967-ce64-48e1-97fa-60f9a56d521b", "codigo": "CERTIFICADOS_EDITAR", "modulo": "CERTIFICADOS", "nombre": "Editar certificados"}, {"id": "fc3dcfff-5909-431b-8dac-712b038788af", "codigo": "ESTUDIANTES_VER", "modulo": "ESTUDIANTES", "nombre": "Ver estudiantes"}]}], "activo": true, "nombres": "Editor", "permisos": ["SOLICITUDES_VER", "ACTAS_EXPORTAR", "AREAS_EDITAR", "CERTIFICADOS_CREAR", "NIVELES_VER", "ACTAS_VER", "GRADOS_EDITAR", "ACTAS_EDITAR", "NIVELES_CREAR", "AUTH_REFRESH", "AREAS_VER", "SOLICITUDES_PROCESAR", "CERTIFICADOS_VER", "SOLICITUDES_EDITAR", "AUTH_LOGOUT", "NIVELES_EDITAR", "ESTUDIANTES_EDITAR", "ANIOS_VER", "ANIOS_CREAR", "SOLICITUDES_BUSCAR", "GRADOS_VER", "GRADOS_CREAR", "SOLICITUDES_GESTIONAR", "CERTIFICADOS_EXPORTAR", "ANIOS_EDITAR", "ESTUDIANTES_CREAR", "AUTH_LOGIN", "ACTAS_PROCESAR_OCR", "AREAS_CREAR", "NOTIFICACIONES_VER", "ACTAS_SUBIR", "CERTIFICADOS_EDITAR", "ESTUDIANTES_VER"], "telefono": "987654321", "username": "editor_test", "apellidos": "Prueba"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 08:05:37.745-05
6d6fa50a-7e34-49bf-9470-393d39a89140	sesion	886c4ebd-92e2-4ec3-9019-ebf89baf5fde	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:00:25.513-05
083b065c-f5a5-405f-a492-510f48b542a3	sesion	509f1fc1-b892-4a60-8cea-e6f84cdcede9	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:21:50.807-05
c371152e-0e48-4fa3-a81f-071ef72d2ac7	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 09:53:59.402-05
d61baef8-008f-4f86-b9e4-e1d4a8ac3e4c	sesion	d95397d8-93d7-4a31-9653-6e7e6f6c247b	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 09:56:58.226-05
5548b5d1-36eb-4cc0-9bde-197de6607ef9	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 09:58:23.916-05
bec035e6-8c08-4d5f-9a77-d682e0600927	sesion	c5f6ff7e-e5dd-4391-9255-ba6996e7df51	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 09:58:35.097-05
30c544eb-65ff-44dc-8deb-951764a63f6d	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:02:45.955-05
fb65a27a-f170-4065-8c33-bb49636c0c50	sesion	a386696b-96eb-4f97-ac97-d72fdb665890	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:02:58.151-05
47058a8c-23b7-419d-a0b4-578264f5f701	sesion	752f987c-ffa6-4a06-9bf4-0def350a799b	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:03:46.786-05
9279732f-652c-4e21-a71a-8313d899cd8f	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:04:11.135-05
66f5fe2d-d5a9-460c-82f9-45de596a4e2f	sesion	2f50fdec-831f-4510-9de5-9b579a1a04d0	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:04:20.079-05
08563c7f-799c-4d54-8b03-3ff5a31b1ed0	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:06:15.596-05
0fe93e1e-1bdb-4e60-a8ab-55d546c2e164	sesion	57ec1837-323b-4a25-83cc-c695f5a187e7	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:06:25.761-05
756c8ed4-3919-46b4-a0b4-9c81e5ca95ab	sesion	0aa35e48-695e-4c4e-ba76-983a48f15469	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:07:34.914-05
d238ff35-6354-4d30-b07c-05e9e0a23a76	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:14:04.024-05
852a81d8-69dc-4d80-b192-7d4bef8281bc	sesion	f70d6dc5-b2af-444d-8184-2cf0a06bec05	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:14:11.242-05
58a71992-5b28-498c-9105-cd71c221ac4d	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:17:40.639-05
a66ce4bc-7459-4ec0-b4f9-94acfa0899ea	sesion	76bd3be8-8554-4046-be6f-8319050e9f83	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:17:49.392-05
9f6f80b5-5120-4701-a075-6fc35bf7abdd	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:18:06.513-05
9d97f67a-ce50-43ed-8d81-753b7c043678	sesion	63f02d7f-fcd0-49a9-ace2-b2b803579a10	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:18:17.914-05
a0afa5ed-0dd1-4412-8672-fc3539777c69	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:22:55.76-05
e83f1d4a-ea73-44b9-a83e-69d674830eb5	sesion	bdbe7ec5-0ce7-4b92-ae56-31453fc652c9	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:23:49.645-05
ec5a3d65-dd1c-449f-80b3-0bcc1a0eed54	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:24:04.203-05
ccc7ba06-8cda-4938-8687-a2a7b95da140	sesion	23639fcb-6286-4cac-97e1-d5bf196fa911	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:24:12.27-05
4ecfec3b-048d-4219-b15c-024e400855e8	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 12:10:28.352-05
efefbd9a-fb93-4f0a-bd09-0449a4e8bb01	sesion	8a167386-083d-4bdd-ad7f-8cd209a288e8	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 12:10:37.432-05
e33f8ce4-63a7-479c-a8e1-2c4216fa9657	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 12:10:48.42-05
bff7ae49-7165-4f12-aeaf-17980db1be72	sesion	73577826-3c29-431d-b477-32431e27e40b	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 12:11:28.042-05
7b6b6cee-4c80-4fa9-a8ba-c203c07b9e3b	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 14:56:09.616-05
d331f0ad-55e0-42de-92fc-bbfa5e7ca9f9	sesion	3b486fea-9102-444b-97c9-612b47697ac8	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 14:56:23.239-05
e1b059cf-85c0-4304-9153-fb3273702337	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 04:55:00.324-05
89af3825-667b-4ae2-bfcd-1fff9bf9ee98	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 05:15:05.853-05
25563132-9fd1-47b4-ac38-302c3d4cb349	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 05:21:54.114-05
9ab74f2c-87be-4fc5-a0cb-1ee01f2fb9e9	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 05:27:52.423-05
b5fe231f-c734-4f34-94ca-edd46098edcf	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 05:29:48.862-05
be55dcc2-02ed-48f7-8e13-30062eaff7d0	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 05:32:20.866-05
6e278751-debf-4e28-95ef-9df954801860	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 05:44:56.16-05
ed6a72e2-35ec-405b-b4e2-ec662df76291	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 05:47:17.26-05
8caea09b-01e4-4b3f-8074-d2cb53b0c335	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 05:53:22.496-05
c8464569-9e6d-41a8-91e0-fad0cf3bbe4b	solicitud	a13d3682-c315-4a60-8373-41c5b896e91f	CREAR	null	{"id": "a13d3682-c315-4a60-8373-41c5b896e91f", "pago": null, "estado": "DERIVADO_A_EDITOR", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "db66c575-12cc-483c-9443-71dabb750e2d", "dni": "99988999", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "EDWARD RODRIGO", "telefono": "988777878", "direccion": null, "fecharegistro": "2025-11-07T06:47:24.708Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "EDWARD RODRIGO OO URIARTE ANCCOTA", "apellidomaterno": "URIARTE ANCCOTA", "apellidopaterno": "OO", "fechanacimiento": "2012-12-14T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T06:47:24.708Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "db66c575-12cc-483c-9443-71dabb750e2d", "motivorechazo": null, "observaciones": "Derivado a Editor 57a1a83f-5242-4d95-ad55-82dc6655b45c", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T06:47:24.747Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000002", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000002", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T11:49:39.541Z", "fechainicioproceso": null, "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": null, "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 06:49:39.662-05
622207f8-653a-45b5-aa58-2dfaa5367d60	solicitud	c8fb92c5-4227-447c-b5bb-778e6d2083d0	CREAR	null	{"id": "c8fb92c5-4227-447c-b5bb-778e6d2083d0", "pago": null, "estado": "DERIVADO_A_EDITOR", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "2551e254-de04-43d2-85f4-9db0f2967d0d", "dni": "88878797", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "EDWARD RODRIGO", "telefono": "989989989", "direccion": null, "fecharegistro": "2025-11-07T06:38:48.486Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "EDWARD RODRIGO GGJGHJGHJ URIARTE ANCCOTA", "apellidomaterno": "URIARTE ANCCOTA", "apellidopaterno": "GGJGHJGHJ", "fechanacimiento": "2012-12-20T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T06:38:48.486Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "2551e254-de04-43d2-85f4-9db0f2967d0d", "motivorechazo": null, "observaciones": ".", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T06:40:11.039Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000001", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000001", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T11:50:11.973Z", "fechainicioproceso": null, "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": null, "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 06:50:11.997-05
cbdb155b-4ee8-4998-a6a7-dc9330bebbe0	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 07:18:07.364-05
f5fe844a-3013-415a-92eb-a5db79d74a89	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:54:56.771-05
a4798cbc-d911-4f86-b426-3b44af2f3bb0	solicitud	bad399b0-2427-49f5-bc70-f996f5d59702	CREAR	null	{"id": "bad399b0-2427-49f5-bc70-f996f5d59702", "pago": null, "estado": "DERIVADO_A_EDITOR", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "89452da3-386f-43a2-894f-5c2677318857", "dni": "67676767", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "Edard", "telefono": "996967969", "direccion": null, "fecharegistro": "2025-11-07T13:35:31.009Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "Edard GFHGFH Michael", "apellidomaterno": "Michael", "apellidopaterno": "GFHGFH", "fechanacimiento": "2012-12-26T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T13:35:31.009Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "89452da3-386f-43a2-894f-5c2677318857", "motivorechazo": null, "observaciones": "Derivado a Editor 57a1a83f-5242-4d95-ad55-82dc6655b45c", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T13:35:31.039Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000005", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000005", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T13:38:08.254Z", "fechainicioproceso": "2025-11-07T13:38:08.251Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	\N	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 08:38:08.336-05
d5f61136-3e09-43a6-96e0-a5cb4e5a04ed	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 10:05:43.041-05
f044c3e0-3cae-499f-af59-dfaf280ee3f9	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:12:37.668-05
b3fc4144-caff-4dab-828a-b3b1a67b3644	sesion	650aa8d0-f24a-44d0-8854-07054280872f	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 07:53:49.783-05
db8231fa-ee09-44c9-9eb1-06514beb8938	pago	6b68608a-df41-4f7b-b56d-5ee1474cbd76	CREAR	null	{"id": "6b68608a-df41-4f7b-b56d-5ee1474cbd76", "monto": "15", "estado": "VALIDADO", "moneda": "PEN", "comision": "0", "horapago": "1970-01-01T00:00:00.000Z", "fechapago": "2025-11-07T00:00:00.000Z", "montoneto": "15", "solicitud": [{"id": "a243802d-0c0f-4a06-a509-ae242ad08775", "estado": "LISTO_PARA_OCR", "pago_id": "6b68608a-df41-4f7b-b56d-5ee1474cbd76", "prioridad": "NORMAL", "estudiante": {"id": "3d54c7bf-2840-44c0-a19f-e9642427c331", "dni": "54654655", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "FGDF", "telefono": "967858865", "direccion": null, "fecharegistro": "2025-11-07T13:55:46.180Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "FGDF FTYT FTYRT", "apellidomaterno": "FTYRT", "apellidopaterno": "FTYT", "fechanacimiento": "2012-12-14T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T13:55:46.180Z"}, "fechafirma": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "3d54c7bf-2840-44c0-a19f-e9642427c331", "motivorechazo": null, "observaciones": "Editor ha iniciado la búsqueda del acta física", "certificado_id": null, "fechasolicitud": "2025-11-07T13:55:46.219Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000007", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000007", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T17:03:35.151Z", "fechainicioproceso": "2025-11-07T16:43:15.443Z", "fechavalidacionpago": "2025-11-07T17:03:35.145Z", "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": "bb28c466-faa5-4c28-b852-92e12dcbcbc2", "fechageneracioncertificado": null}], "conciliado": true, "metodopago": "EFECTIVO", "numeroorden": "ORD-2025-000006", "numerorecibo": "REC.AFFERTRTE445", "fecharegistro": "2025-11-07T17:03:35.113Z", "observaciones": "Pago en efectivo - Expediente: EXP-2025-000007", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "referenciapago": null, "urlcomprobante": null, "entidadbancaria": null, "numerooperacion": null, "fechaconciliacion": "2025-11-07T17:03:35.110Z", "usuarioconciliacion_id": "bb28c466-faa5-4c28-b852-92e12dcbcbc2"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:03:35.325-05
771c7cee-48db-4943-ae72-9f4550f345c9	pago	4f48682d-0dad-479c-a389-2d5b1ff38aec	CREAR	null	{"id": "4f48682d-0dad-479c-a389-2d5b1ff38aec", "monto": "15", "estado": "VALIDADO", "moneda": "PEN", "comision": "0", "horapago": "1970-01-01T00:00:00.000Z", "fechapago": "2025-11-07T00:00:00.000Z", "montoneto": "15", "solicitud": [{"id": "a13d3682-c315-4a60-8373-41c5b896e91f", "estado": "LISTO_PARA_OCR", "pago_id": "4f48682d-0dad-479c-a389-2d5b1ff38aec", "prioridad": "NORMAL", "estudiante": {"id": "db66c575-12cc-483c-9443-71dabb750e2d", "dni": "99988999", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "EDWARD RODRIGO", "telefono": "988777878", "direccion": null, "fecharegistro": "2025-11-07T06:47:24.708Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "EDWARD RODRIGO OO URIARTE ANCCOTA", "apellidomaterno": "URIARTE ANCCOTA", "apellidopaterno": "OO", "fechanacimiento": "2012-12-14T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T06:47:24.708Z"}, "fechafirma": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "db66c575-12cc-483c-9443-71dabb750e2d", "motivorechazo": null, "observaciones": "{\\"datosAcademicos\\":{\\"departamento\\":\\"\\",\\"provincia\\":\\"\\",\\"distrito\\":\\"\\",\\"nombreColegio\\":\\"Información no disponible (recuperar manualmente)\\",\\"ultimoAnioCursado\\":0,\\"nivel\\":\\"\\"},\\"contacto\\":{\\"celular\\":\\"\\",\\"email\\":null},\\"motivoSolicitud\\":\\"CONTINUIDAD_ESTUDIOS\\",\\"esApoderado\\":false,\\"datosApoderado\\":null,\\"busquedaActa\\":{\\"fechaBusqueda\\":\\"2025-11-07T16:14:20.612Z\\",\\"resultado\\":\\"ENCONTRADA\\",\\"ubicacionFisica\\":\\"estaante 4\\",\\"observaciones\\":\\"Recuperado de texto plano\\"}}", "certificado_id": null, "fechasolicitud": "2025-11-07T06:47:24.747Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000002", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000002", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T17:04:05.012Z", "fechainicioproceso": "2025-11-07T15:50:23.346Z", "fechavalidacionpago": "2025-11-07T17:04:05.010Z", "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": "bb28c466-faa5-4c28-b852-92e12dcbcbc2", "fechageneracioncertificado": null}], "conciliado": true, "metodopago": "EFECTIVO", "numeroorden": "ORD-2025-000007", "numerorecibo": "REC.AFFERTRTE445", "fecharegistro": "2025-11-07T17:04:04.991Z", "observaciones": "Pago en efectivo - Expediente: EXP-2025-000002", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "referenciapago": null, "urlcomprobante": null, "entidadbancaria": null, "numerooperacion": null, "fechaconciliacion": "2025-11-07T17:04:04.989Z", "usuarioconciliacion_id": "bb28c466-faa5-4c28-b852-92e12dcbcbc2"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:04:05.026-05
b7c50d56-75bd-4c5b-986e-e387865f3515	solicitud	cfb3fdbf-0abc-4c95-95cd-3d087c8e034b	CREAR	null	{"id": "cfb3fdbf-0abc-4c95-95cd-3d087c8e034b", "pago": null, "estado": "DERIVADO_A_EDITOR", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "514e0b37-4d14-4f8f-b47e-ab99321fc3c9", "dni": "67657567", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "Edard", "telefono": "998909098", "direccion": null, "fecharegistro": "2025-11-07T17:22:09.629Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "Edard fgfdg Michael", "apellidomaterno": "Michael", "apellidopaterno": "fgfdg", "fechanacimiento": "2012-12-21T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T17:22:09.629Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "514e0b37-4d14-4f8f-b47e-ab99321fc3c9", "motivorechazo": null, "observaciones": "{\\"datosAcademicos\\":{\\"departamento\\":\\"02\\",\\"provincia\\":\\"0216\\",\\"distrito\\":\\"021604\\",\\"nombreColegio\\":\\"vcvdvdssvdd\\",\\"ultimoAnioCursado\\":1995,\\"nivel\\":\\"SECUNDARIA\\"},\\"contacto\\":{\\"celular\\":\\"998909098\\",\\"email\\":null},\\"motivoSolicitud\\":\\"CONTINUIDAD_ESTUDIOS\\",\\"esApoderado\\":false,\\"datosApoderado\\":null}", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-07T17:22:09.659Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000009", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000009", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T17:23:30.077Z", "fechainicioproceso": "2025-11-07T17:23:30.063Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:23:30.18-05
48a8a0b5-aaf3-4ca4-8698-1ae2ae2c2dbc	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:23:36.352-05
3284d419-d5ee-4353-a69e-113ed0c569c0	pago	f53cd41c-65b0-4d49-a1be-5000b928dbd4	CREAR	null	{"id": "f53cd41c-65b0-4d49-a1be-5000b928dbd4", "monto": "15", "estado": "VALIDADO", "moneda": "PEN", "comision": "0", "horapago": "1970-01-01T00:00:00.000Z", "fechapago": "2025-11-07T00:00:00.000Z", "montoneto": "15", "solicitud": [{"id": "cfb3fdbf-0abc-4c95-95cd-3d087c8e034b", "estado": "LISTO_PARA_OCR", "pago_id": "f53cd41c-65b0-4d49-a1be-5000b928dbd4", "prioridad": "NORMAL", "estudiante": {"id": "514e0b37-4d14-4f8f-b47e-ab99321fc3c9", "dni": "67657567", "sexo": "M", "email": null, "estado": "ACTIVO", "nombres": "Edard", "telefono": "998909098", "direccion": null, "fecharegistro": "2025-11-07T17:22:09.629Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "Edard fgfdg Michael", "apellidomaterno": "Michael", "apellidopaterno": "fgfdg", "fechanacimiento": "2012-12-21T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-07T17:22:09.629Z"}, "fechafirma": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "514e0b37-4d14-4f8f-b47e-ab99321fc3c9", "motivorechazo": null, "observaciones": "{\\"datosAcademicos\\":{\\"departamento\\":\\"02\\",\\"provincia\\":\\"0216\\",\\"distrito\\":\\"021604\\",\\"nombreColegio\\":\\"vcvdvdssvdd\\",\\"ultimoAnioCursado\\":1995,\\"nivel\\":\\"SECUNDARIA\\"},\\"contacto\\":{\\"celular\\":\\"998909098\\",\\"email\\":null},\\"motivoSolicitud\\":\\"CONTINUIDAD_ESTUDIOS\\",\\"esApoderado\\":false,\\"datosApoderado\\":null,\\"busquedaActa\\":{\\"fechaBusqueda\\":\\"2025-11-07T17:25:12.101Z\\",\\"resultado\\":\\"ENCONTRADA\\",\\"ubicacionFisica\\":\\"estaante 4\\",\\"observaciones\\":null}}", "certificado_id": null, "fechasolicitud": "2025-11-07T17:22:09.659Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000009", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000009", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-07T17:26:35.763Z", "fechainicioproceso": "2025-11-07T17:23:30.063Z", "fechavalidacionpago": "2025-11-07T17:26:35.761Z", "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": "bb28c466-faa5-4c28-b852-92e12dcbcbc2", "fechageneracioncertificado": null}], "conciliado": true, "metodopago": "EFECTIVO", "numeroorden": "ORD-2025-000009", "numerorecibo": "REC.AFFERTRTE445", "fecharegistro": "2025-11-07T17:26:35.753Z", "observaciones": "Pago en efectivo - Expediente: EXP-2025-000009", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "referenciapago": null, "urlcomprobante": null, "entidadbancaria": null, "numerooperacion": null, "fechaconciliacion": "2025-11-07T17:26:35.751Z", "usuarioconciliacion_id": "bb28c466-faa5-4c28-b852-92e12dcbcbc2"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:26:35.771-05
bebf07d8-6274-4055-ba2d-0d719c4f4454	sesion	3067116a-b810-4148-8b98-fe9940422aeb	LOGOUT	null	{"username": "desconocido"}	3067116a-b810-4148-8b98-fe9940422aeb	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 07:55:16.194-05
d8f1fa67-263f-4d82-8c7d-01255d63a06a	sesion	6780a2aa-1730-46e2-ae2f-be834fcf475e	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 07:55:29.944-05
40e7cdd1-dcf9-4690-b442-e1b2e4aa5f75	actafisica	18782ad5-61fe-4554-9bf2-cc85d579b999	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 08:15:07.951-05
9b7ae480-9a7d-4157-88f8-2abdde1e0d5e	solicitud	174d7c2e-05b5-43b6-8b20-d02643f7d535	CREAR	null	{"id": "174d7c2e-05b5-43b6-8b20-d02643f7d535", "pago": null, "estado": "DERIVADO_A_EDITOR", "pago_id": null, "prioridad": "NORMAL", "estudiante": {"id": "f999749f-0d61-43d0-9446-83bf57745ae2", "dni": "77027939", "sexo": "M", "email": "rodrigoakameluriarte@gmail.com", "estado": "INACTIVO", "nombres": "EDWARD", "telefono": "997778787", "direccion": null, "fecharegistro": "2025-11-11T03:26:08.421Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "nombrecompleto": "EDWARD URIARTE ANCCOTA", "apellidomaterno": "ANCCOTA", "apellidopaterno": "URIARTE", "fechanacimiento": "2012-12-02T00:00:00.000Z", "lugarnacimiento": null, "fechaactualizacion": "2025-11-11T14:11:37.365Z"}, "fechafirma": null, "certificado": null, "fechaentrega": null, "fecharechazo": null, "estudiante_id": "f999749f-0d61-43d0-9446-83bf57745ae2", "motivorechazo": null, "observaciones": "{\\"datosAcademicos\\":{\\"departamento\\":\\"20\\",\\"provincia\\":\\"2001\\",\\"distrito\\":\\"200101\\",\\"nombreColegio\\":\\"COLEGIO GLORIOSO\\",\\"ultimoAnioCursado\\":1994,\\"nivel\\":\\"PRIMARIA\\"},\\"contacto\\":{\\"celular\\":\\"997778787\\",\\"email\\":\\"rodrigoakameluriarte@gmail.com\\"},\\"motivoSolicitud\\":\\"JUBILACION\\",\\"esApoderado\\":false,\\"datosApoderado\\":null}", "tiposolicitud": {"id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "activo": true, "codigo": "CERT_ESTUDIOS", "nombre": "Certificado de Estudios", "montobase": "50", "descripcion": "Certificado oficial de estudios completos", "requierepago": true, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "tiempoentregadias": 7}, "certificado_id": null, "fechasolicitud": "2025-11-11T03:26:08.458Z", "usuariofirma_id": null, "direccionentrega": null, "modalidadentrega": null, "numeroexpediente": "EXP-2025-000010", "tiposolicitud_id": "9ee56a01-2e6b-41dd-a475-90a4845ac405", "numeroseguimiento": "S-2025-000010", "usuarioentrega_id": null, "fechaactualizacion": "2025-11-11T15:03:15.470Z", "fechainicioproceso": "2025-11-11T15:03:15.467Z", "fechavalidacionpago": null, "usuariosolicitud_id": null, "usuariogeneracion_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "usuariovalidacionpago_id": null, "fechageneracioncertificado": null}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:03:15.514-05
1179e238-67b9-4288-b188-8fe6dc5df582	sesion	bb28c466-faa5-4c28-b852-92e12dcbcbc2	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:03:39.668-05
057e7515-b659-47a5-ad3c-7fc0756e2cc5	sesion	3f11db0e-392b-40b4-b4bb-77d3afdfd007	LOGOUT	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 14:09:49.209-05
9fcf1255-b8dc-407b-b9a0-1cdd4e43c850	usuario	3779e23a-c884-4db6-ade5-262ddc7ef836	CREAR	null	{"id": "3779e23a-c884-4db6-ade5-262ddc7ef836", "dni": "55555555", "cargo": "Director de la InstituciÃ³n", "email": "direccion@sigcerh.local", "roles": [{"id": "b7db07f2-911e-4266-944f-bab290f299b6", "nivel": 3, "codigo": "EDITOR", "nombre": "Editor", "permisos": [{"id": "023dff69-b5fb-490a-bf29-718bffd8d1c2", "codigo": "SOLICITUDES_VER", "modulo": "SOLICITUDES", "nombre": "Ver solicitudes"}, {"id": "08c7b5c7-0e24-4b95-bbd7-997f24bbbc93", "codigo": "CERTIFICADOS_ANULAR", "modulo": "CERTIFICADOS", "nombre": "Anular certificados"}, {"id": "09f72675-1acf-49e3-b760-a5abeba5141e", "codigo": "ACTAS_EXPORTAR", "modulo": "ACTAS", "nombre": "Exportar actas"}, {"id": "0bb1a087-48d8-4558-acef-c6493e03b820", "codigo": "AREAS_EDITAR", "modulo": "AREAS", "nombre": "Editar áreas"}, {"id": "121ce9a9-b0fc-4aae-8410-ae2b76583ea3", "codigo": "CERTIFICADOS_CREAR", "modulo": "CERTIFICADOS", "nombre": "Crear certificados"}, {"id": "2a8aed37-e240-4706-8dad-bc720d019415", "codigo": "CERTIFICADOS_FIRMAR", "modulo": "CERTIFICADOS", "nombre": "Firmar certificados"}, {"id": "2c1fbbf8-6449-4b42-9a91-40ca1c78c848", "codigo": "NIVELES_VER", "modulo": "NIVELES", "nombre": "Ver niveles educativos"}, {"id": "2f77e12b-af1a-47a9-b62b-6aff4d1bb277", "codigo": "ACTAS_VER", "modulo": "ACTAS", "nombre": "Ver actas físicas"}, {"id": "2f85d6e1-ad68-43b8-8875-e3b6ed846a15", "codigo": "SOLICITUDES_REGISTRAR", "modulo": "SOLICITUDES", "nombre": "Registrar en SIAGEC"}, {"id": "31f4f37b-48a8-4c1d-80c1-c26e6bf2fe11", "codigo": "SOLICITUDES_FIRMAR", "modulo": "SOLICITUDES", "nombre": "Firmar certificados"}, {"id": "324d992f-836a-442d-a006-7e83ff929040", "codigo": "GRADOS_EDITAR", "modulo": "GRADOS", "nombre": "Editar grados"}, {"id": "373960e5-3a30-47d0-a3a4-0700c99ca736", "codigo": "ACTAS_EDITAR", "modulo": "ACTAS", "nombre": "Editar actas físicas"}, {"id": "3a263122-252b-4e00-8a4b-e089f158ba65", "codigo": "NIVELES_CREAR", "modulo": "NIVELES", "nombre": "Crear niveles"}, {"id": "4315a4c1-a2e7-43b8-b01f-c91534a7a552", "codigo": "AUTH_REFRESH", "modulo": "AUTH", "nombre": "Renovar token"}, {"id": "515dc723-213f-4412-8010-7ba17c277f49", "codigo": "AREAS_VER", "modulo": "AREAS", "nombre": "Ver áreas curriculares"}, {"id": "546f8384-25aa-4f42-9973-95b286fe39bc", "codigo": "SOLICITUDES_PROCESAR", "modulo": "SOLICITUDES", "nombre": "Procesar solicitudes"}, {"id": "5bae1fb8-5199-40ae-bc59-ad8eb8c74714", "codigo": "CONFIG_VER", "modulo": "CONFIGURACION", "nombre": "Ver configuración"}, {"id": "727061fc-433a-4f13-a259-116c8b728ba3", "codigo": "CERTIFICADOS_VER", "modulo": "CERTIFICADOS", "nombre": "Ver certificados"}, {"id": "730e1785-bc51-4f90-b277-a3b4f18d429a", "codigo": "SOLICITUDES_EDITAR", "modulo": "SOLICITUDES", "nombre": "Editar solicitudes"}, {"id": "790bf944-5d45-49ab-b427-bed6853e430d", "codigo": "NOTIFICACIONES_ENVIAR", "modulo": "NOTIFICACIONES", "nombre": "Enviar notificaciones"}, {"id": "7ac196ef-bc52-4cc5-bef7-bcb5080cd824", "codigo": "AUTH_LOGOUT", "modulo": "AUTH", "nombre": "Cerrar sesión"}, {"id": "87178d4e-93f6-4456-80b5-b2723917701f", "codigo": "NIVELES_EDITAR", "modulo": "NIVELES", "nombre": "Editar niveles"}, {"id": "88fe8462-d786-4773-8d4e-b644967b5f5b", "codigo": "ESTUDIANTES_EDITAR", "modulo": "ESTUDIANTES", "nombre": "Editar estudiantes"}, {"id": "8f968910-2a82-4e20-8a44-6975df1ce6da", "codigo": "ANIOS_VER", "modulo": "ANIOS", "nombre": "Ver años lectivos"}, {"id": "9517a57a-b8c6-461e-b85b-6cc23ae331d0", "codigo": "ANIOS_CREAR", "modulo": "ANIOS", "nombre": "Crear años lectivos"}, {"id": "9ebaefda-e1d6-4e67-821c-e86cda440505", "codigo": "SOLICITUDES_BUSCAR", "modulo": "SOLICITUDES", "nombre": "Buscar actas físicas"}, {"id": "a02faf67-ffa1-4ca7-872b-76ad91220331", "codigo": "GRADOS_VER", "modulo": "GRADOS", "nombre": "Ver grados"}, {"id": "a7b2f88e-76ee-4787-8b47-38697aaf5928", "codigo": "GRADOS_CREAR", "modulo": "GRADOS", "nombre": "Crear grados"}, {"id": "b970eff9-178c-4fbd-b683-fba92bd6f11e", "codigo": "SOLICITUDES_GESTIONAR", "modulo": "SOLICITUDES", "nombre": "Gestionar solicitudes"}, {"id": "babbb549-2156-444f-8888-000f1151753b", "codigo": "CERTIFICADOS_EXPORTAR", "modulo": "CERTIFICADOS", "nombre": "Exportar certificados"}, {"id": "be22ea9d-1d77-40bf-8f93-d7aad2b9c0f9", "codigo": "ANIOS_EDITAR", "modulo": "ANIOS", "nombre": "Editar años lectivos"}, {"id": "cbd0ae5a-8882-4db6-ba36-7dfea0e43e22", "codigo": "AUDITORIA_VER", "modulo": "AUDITORIA", "nombre": "Ver auditoría"}, {"id": "d4e8499a-a4ae-4660-bd61-0661f31c0c32", "codigo": "ESTUDIANTES_CREAR", "modulo": "ESTUDIANTES", "nombre": "Crear estudiantes"}, {"id": "d9371e35-d806-40e8-aea0-625feccc8aab", "codigo": "PAGOS_VER", "modulo": "PAGOS", "nombre": "Ver pagos"}, {"id": "e8f16323-04be-45fc-99a7-0b3d69099a93", "codigo": "AUTH_LOGIN", "modulo": "AUTH", "nombre": "Iniciar sesión"}, {"id": "eaa01141-77df-4d3f-ab18-d87d0db0f0c2", "codigo": "ACTAS_PROCESAR_OCR", "modulo": "ACTAS", "nombre": "Procesar OCR"}, {"id": "ecd4471f-63a9-457a-b54e-e25aae806ecc", "codigo": "AREAS_CREAR", "modulo": "AREAS", "nombre": "Crear áreas"}, {"id": "ef8360d0-ec30-4bed-87df-efe0006d11d0", "codigo": "NOTIFICACIONES_VER", "modulo": "NOTIFICACIONES", "nombre": "Ver notificaciones"}, {"id": "f3b72ab4-0f88-4b7e-9b90-a33382b01949", "codigo": "ACTAS_SUBIR", "modulo": "ACTAS", "nombre": "Subir actas físicas"}, {"id": "f4674967-ce64-48e1-97fa-60f9a56d521b", "codigo": "CERTIFICADOS_EDITAR", "modulo": "CERTIFICADOS", "nombre": "Editar certificados"}, {"id": "f7a004fc-c702-4ec4-b1e6-36dda108e31e", "codigo": "SOLICITUDES_VALIDAR", "modulo": "SOLICITUDES", "nombre": "Validar solicitudes (UGEL)"}, {"id": "fc3dcfff-5909-431b-8dac-712b038788af", "codigo": "ESTUDIANTES_VER", "modulo": "ESTUDIANTES", "nombre": "Ver estudiantes"}]}], "activo": true, "nombres": "Director", "permisos": ["SOLICITUDES_VER", "CERTIFICADOS_ANULAR", "ACTAS_EXPORTAR", "AREAS_EDITAR", "CERTIFICADOS_CREAR", "CERTIFICADOS_FIRMAR", "NIVELES_VER", "ACTAS_VER", "SOLICITUDES_REGISTRAR", "SOLICITUDES_FIRMAR", "GRADOS_EDITAR", "ACTAS_EDITAR", "NIVELES_CREAR", "AUTH_REFRESH", "AREAS_VER", "SOLICITUDES_PROCESAR", "CONFIG_VER", "CERTIFICADOS_VER", "SOLICITUDES_EDITAR", "NOTIFICACIONES_ENVIAR", "AUTH_LOGOUT", "NIVELES_EDITAR", "ESTUDIANTES_EDITAR", "ANIOS_VER", "ANIOS_CREAR", "SOLICITUDES_BUSCAR", "GRADOS_VER", "GRADOS_CREAR", "SOLICITUDES_GESTIONAR", "CERTIFICADOS_EXPORTAR", "ANIOS_EDITAR", "AUDITORIA_VER", "ESTUDIANTES_CREAR", "PAGOS_VER", "AUTH_LOGIN", "ACTAS_PROCESAR_OCR", "AREAS_CREAR", "NOTIFICACIONES_VER", "ACTAS_SUBIR", "CERTIFICADOS_EDITAR", "SOLICITUDES_VALIDAR", "ESTUDIANTES_VER"], "telefono": "987654325", "username": "direccion", "apellidos": "Principal"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 22:20:56.664-05
5824dfde-5360-4b2d-a61b-09977620c293	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 22:24:56.431-05
010142bf-50da-4be9-8e8a-c49ff9ce6658	sesion	e8f6df51-71e1-4771-acac-377620faebcd	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 22:25:05.793-05
fe17f3a0-8464-42ab-ab47-01b5480fe7ce	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 22:29:49.91-05
00137716-6e7e-4d8d-943a-42ef72a3c376	sesion	04784098-5f4d-4ee9-9119-280b681597fc	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 22:29:58.516-05
403a8093-ed91-4db8-900f-fe08837fa6cf	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 22:30:43.436-05
c036102f-bb68-468e-9871-5f30c4c57b00	sesion	62187f01-5ff1-4cb9-ba34-06e73bb79651	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 22:31:35.528-05
c7fe2134-f525-4b66-99af-aae9157363cd	sesion	6779138d-0e55-4344-af31-07cd07bfaca1	LOGOUT	null	{"username": "desconocido"}	6779138d-0e55-4344-af31-07cd07bfaca1	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 22:32:34.887-05
a4c91634-309b-4c28-bcd3-1ce55dd59fe6	sesion	089e12b7-84ae-4f67-ad6f-d13db3941f68	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 22:32:44.121-05
f4cbe763-281c-41fb-9c82-1b9e7e6ab1f7	sesion	4bf22bde-7860-43a9-a20e-91a839a15414	LOGOUT	null	{"username": "desconocido"}	4bf22bde-7860-43a9-a20e-91a839a15414	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 23:26:26.388-05
210d0c7d-f3c3-499d-9abe-58477fc215e1	sesion	f07bc562-5c0f-4274-b8f0-525d977b4e5b	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 23:26:35.861-05
3b7b1ebb-53a4-46a8-a452-e84089a492d4	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 23:28:11.834-05
88464b66-f68d-4608-b16b-6b6e262ebb14	sesion	df357db5-8180-485d-bd95-a1fc772a857f	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 23:28:20.262-05
7c483244-cdb0-4015-bb05-4567e8b95419	sesion	3067116a-b810-4148-8b98-fe9940422aeb	LOGOUT	null	{"username": "desconocido"}	3067116a-b810-4148-8b98-fe9940422aeb	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 06:12:29.762-05
995f1eaf-5c4f-45c8-9d35-f767c2179889	sesion	b58aa59f-6c39-440a-8f0f-0efaa6bb3413	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 06:12:40.832-05
d85ecc46-2254-419f-b9a1-b7952bcec5c1	actafisica	a1fca4f1-69e7-41a7-8c3f-e623fe01c4e6	ACTUALIZAR	{"folio": "2", "turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "tipoEvaluacion": "FINAL"}	{"id": "a1fca4f1-69e7-41a7-8c3f-e623fe01c4e6", "tipo": "OCR_LIBRE", "folio": "2", "grado": {"id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "orden": 2, "activo": true, "nombre": "Segundo Grado", "numero": 2, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "2DO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "anio_fin": 1990, "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1"}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251111171020", "seccion": "A", "grado_id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "fechasubida": "2025-11-11T17:10:20.971Z", "hasharchivo": null, "colegiorigen": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,13,11,10,15,15,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,12,10,15,16,11,12,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":2025,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"No especificado\\",\\"grado\\":\\"Segundo Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"FINAL\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-11T17:10:20.971Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-11T17:10:20.971Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 06:28:25.069-05
858d3f9e-cd10-4736-bb74-1765b71fcfea	actafisica	4ca5261b-f03a-47a7-9db9-bd123b6f73a2	ACTUALIZAR	{"turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "tipoEvaluacion": "FINAL"}	{"id": "4ca5261b-f03a-47a7-9db9-bd123b6f73a2", "tipo": "OCR_LIBRE", "folio": null, "grado": {"id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "orden": 2, "activo": true, "nombre": "Segundo Grado", "numero": 2, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "2DO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251111150204", "seccion": "A", "grado_id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-11T15:02:04.189Z", "hasharchivo": null, "colegiorigen": null, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": null, "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,13,11,10,15,15,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,12,10,15,16,11,12,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":2025,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"No especificado\\",\\"grado\\":\\"Segundo Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"FINAL\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-11T15:02:04.189Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-11T15:02:04.189Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 07:30:15.898-05
5cc8e650-4862-4bdb-b3f4-1b4ad8ff4091	actafisica	44139832-8dfe-46af-9008-f07093e4a0a6	ACTUALIZAR	{"turno": "TARDE", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "tipoEvaluacion": "FINAL"}	{"id": "44139832-8dfe-46af-9008-f07093e4a0a6", "tipo": "OCR_LIBRE", "folio": null, "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "TARDE", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251110160708", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-10T16:07:08.426Z", "hasharchivo": null, "colegiorigen": null, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": null, "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,13,11,10,15,15,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,12,10,15,16,11,12,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":2025,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"No especificado\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"FINAL\\",\\"turno\\":\\"TARDE\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-10T16:07:08.426Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-10T16:07:08.426Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 07:30:27.943-05
d5694e84-bba6-4259-b563-6cf92e882049	actafisica	96101728-b5e5-48a6-8f8a-8d777360619b	ACTUALIZAR	{"turno": "TARDE", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "tipoEvaluacion": "FINAL"}	{"id": "96101728-b5e5-48a6-8f8a-8d777360619b", "tipo": "OCR_LIBRE", "folio": null, "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "TARDE", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251110051107", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-10T05:11:07.723Z", "hasharchivo": null, "colegiorigen": null, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": null, "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,13,11,10,15,15,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,12,10,15,16,11,12,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":2025,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"No especificado\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"FINAL\\",\\"turno\\":\\"TARDE\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-10T05:11:07.723Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-10T05:11:07.723Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 07:30:36.791-05
98872414-0c79-4baf-9283-4171097c45fd	actafisica	b1e2e203-a9ec-42f0-8470-838d40fc2f02	ACTUALIZAR	{"turno": "TARDE", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "tipoEvaluacion": "FINAL"}	{"id": "b1e2e203-a9ec-42f0-8470-838d40fc2f02", "tipo": "OCR_LIBRE", "folio": null, "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "TARDE", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251110044242", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-10T04:42:42.976Z", "hasharchivo": null, "colegiorigen": null, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": null, "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,13,11,10,15,15,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,12,10,15,16,11,12,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":2025,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"No especificado\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"FINAL\\",\\"turno\\":\\"TARDE\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-10T04:42:42.976Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-10T04:42:42.976Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 07:30:43.011-05
0ccade7c-16e7-4fa1-bcb2-3086323d3035	actafisica	5909abcc-aa8e-4b67-9c2f-41710ebbb09a	ACTUALIZAR	{"turno": "TARDE", "libroId": "cd21550c-b652-4be8-a820-83ff6680c6cf", "tipoEvaluacion": "FINAL"}	{"id": "5909abcc-aa8e-4b67-9c2f-41710ebbb09a", "tipo": "OCR_LIBRE", "folio": null, "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "cd21550c-b652-4be8-a820-83ff6680c6cf", "activo": true, "codigo": "2", "estado": "ACTIVO", "nombre": "Educacion Secundaria", "estante": "", "anio_fin": 1995, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 496, "tipo_acta": null, "anio_inicio": 1991, "descripcion": "Libro de actas 1991-1995", "folio_inicio": 1, "total_folios": 480, "observaciones": "", "fecha_creacion": "2025-11-10T01:15:57.150Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 2.", "folios_utilizados": 0}, "turno": "TARDE", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251110041008", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "cd21550c-b652-4be8-a820-83ff6680c6cf", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-10T04:10:08.220Z", "hasharchivo": null, "colegiorigen": null, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "ubicacionfisica": null, "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,13,11,10,15,15,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,12,10,15,16,11,12,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":2025,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"No especificado\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"FINAL\\",\\"turno\\":\\"TARDE\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-10T04:10:08.220Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-10T04:10:08.220Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 07:30:50.885-05
7fa06519-02c8-43c5-ac92-cd5c7b818db1	actafisica	2ccdd142-871a-439d-9b2e-3f8ede0ed36b	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 08:15:25.317-05
82b20741-54e5-4307-a9f7-1f3aae6800cc	actafisica	02e7cbe9-c078-4030-a2ce-e328ff088a14	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 08:15:30.765-05
bf7b19bf-2dfc-4677-a103-d00ac8bf0d82	actafisica	0368c308-ccee-47b7-81a9-51d7d8e2fd7f	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 08:15:34.38-05
0e3e04b9-f89b-4330-8480-255ced93ac6e	actafisica	d5f26eda-c41c-4083-943b-82b750628a17	ACTUALIZAR	{"folio": "1", "turno": "TARDE", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "tipoEvaluacion": "FINAL"}	{"id": "d5f26eda-c41c-4083-943b-82b750628a17", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "TARDE", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251110051116", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-10T05:11:16.829Z", "hasharchivo": null, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,13,11,10,15,15,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,12,10,15,16,11,12,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[null,null,null,null,null,null,null,null,null,null,null,null],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":2025,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"No especificado\\",\\"grado\\":\\"Primer Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"FINAL\\",\\"turno\\":\\"TARDE\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-10T05:11:16.829Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-10T05:11:16.829Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 08:17:38.897-05
304fcec6-5ffa-485d-b3f5-82461932e8cd	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 10:05:29.16-05
572dd1f2-52e3-49c5-9091-a77eac7b82a1	sesion	410be06f-7ab1-4da2-b430-ebc982d20f9c	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 10:05:37.699-05
8fd368ca-06c5-4476-8862-d4f1c6c87889	actafisica	be73de2e-3ead-41e9-bcec-086c9b271812	ACTUALIZAR	{"turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "tipoEvaluacion": "FINAL"}	{"id": "be73de2e-3ead-41e9-bcec-086c9b271812", "tipo": "OCR_LIBRE", "folio": null, "grado": {"id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "orden": 2, "activo": true, "nombre": "Segundo Grado", "numero": 2, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "2DO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251112141054", "seccion": "A", "grado_id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-12T14:10:54.866Z", "hasharchivo": null, "normalizada": false, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,13,11,10,15,15,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,12,10,15,16,11,12,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":2025,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"No especificado\\",\\"grado\\":\\"Segundo Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"FINAL\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-12T14:10:54.866Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-12T14:10:54.866Z", "fecha_normalizacion": null, "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 10:40:45.426-05
ccb13ed3-abe8-4ac1-83cc-96dcdbea8dc1	actafisica	be73de2e-3ead-41e9-bcec-086c9b271812	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "tipoEvaluacion": "FINAL"}	{"id": "be73de2e-3ead-41e9-bcec-086c9b271812", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "orden": 2, "activo": true, "nombre": "Segundo Grado", "numero": 2, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "2DO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251112141054", "seccion": "A", "grado_id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-12T14:10:54.866Z", "hasharchivo": null, "normalizada": false, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": "{\\"estudiantes\\":[{\\"apellidoMaterno\\":\\"RIQUELME\\",\\"apellidoPaterno\\":\\"BUSTINCIO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"BUSTINCIO RIQUELME, OPTACIANO\\",\\"nombres\\":\\"OPTACIANO\\",\\"notas\\":[13,11,12,14,12,10,12,14,11,12,11,11],\\"numero\\":1,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"CAHUI\\",\\"asignaturasDesaprobadas\\":4,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CAHUI MAMANI, FELIPE JESÚS\\",\\"nombres\\":\\"FELIPE JESÚS\\",\\"notas\\":[10,11,12,11,10,9,11,14,11,12,10,11],\\"numero\\":2,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAYTA\\",\\"apellidoPaterno\\":\\"CALLAPANI\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CALLAPANI MAYTA, EDGAR\\",\\"nombres\\":\\"EDGAR\\",\\"notas\\":[9,11,13,13,11,10,15,15,12,12,12,12],\\"numero\\":3,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"FLORES\\",\\"apellidoPaterno\\":\\"CALLO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"CALLO FLORES, RUFFO HÉCTOR\\",\\"nombres\\":\\"RUFFO HÉCTOR\\",\\"notas\\":[12,12,12,12,12,10,15,16,11,12,11,11],\\"numero\\":4,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"QUISPE\\",\\"apellidoPaterno\\":\\"CUNO\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"CUNO QUISPE, AGUSTÍN RENEÉ\\",\\"nombres\\":\\"AGUSTÍN RENEÉ\\",\\"notas\\":[11,11,12,13,11,11,11,16,10,11,12,11],\\"numero\\":5,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CHAYÑA\\",\\"apellidoPaterno\\":\\"CHAYÑA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"15\\",\\"nombreCompleto\\":\\"CHAYÑA CHAYÑA, HUGO ALEJANDRO\\",\\"nombres\\":\\"HUGO ALEJANDRO\\",\\"notas\\":[8,10,11,11,10,9,12,16,9,11,11,9],\\"numero\\":6,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"SERRANO\\",\\"apellidoPaterno\\":\\"CHOQUECOTA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"None\\",\\"nombreCompleto\\":\\"CHOQUECOTA SERRANO, VÍCTOR RAÚL\\",\\"nombres\\":\\"VÍCTOR RAÚL\\",\\"notas\\":[],\\"numero\\":7,\\"observaciones\\":\\"Retir. por 30% Inasist. Injust. 30-10-85\\",\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"LOZA\\",\\"apellidoPaterno\\":\\"ESPINOZA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"18\\",\\"nombreCompleto\\":\\"ESPINOZA LOZA, MIJAIL YGOR\\",\\"nombres\\":\\"MIJAIL YGOR\\",\\"notas\\":[11,13,13,14,14,11,15,16,14,13,11,12],\\"numero\\":8,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"DEL PINO\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"GUTIERREZ DEL PINO, JUAN ANTONIO\\",\\"nombres\\":\\"JUAN ANTONIO\\",\\"notas\\":[10,13,12,13,12,11,14,15,11,12,12,11],\\"numero\\":9,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"POMA\\",\\"apellidoPaterno\\":\\"GUTIERREZ\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"17\\",\\"nombreCompleto\\":\\"GUTIERREZ POMA, ALFONSO\\",\\"nombres\\":\\"ALFONSO\\",\\"notas\\":[11,11,11,14,12,11,15,15,12,13,11,11],\\"numero\\":10,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"YUNGAS\\",\\"apellidoPaterno\\":\\"HILASACA\\",\\"asignaturasDesaprobadas\\":0,\\"codigo\\":null,\\"comportamiento\\":\\"19\\",\\"nombreCompleto\\":\\"HILASACA YUNGAS, ADOLFO\\",\\"nombres\\":\\"ADOLFO\\",\\"notas\\":[12,13,12,16,15,12,13,15,15,14,13,12],\\"numero\\":11,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"P\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"HUACANI\\",\\"asignaturasDesaprobadas\\":1,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"HUACANI MAMANI, OSCAR RUBÉN\\",\\"nombres\\":\\"OSCAR RUBÉN\\",\\"notas\\":[11,11,14,14,12,10,12,15,11,12,11,11],\\"numero\\":12,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"MAMANI\\",\\"apellidoPaterno\\":\\"IBEROS\\",\\"asignaturasDesaprobadas\\":2,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"IBEROS MAMANI, DAVID\\",\\"nombres\\":\\"DAVID\\",\\"notas\\":[13,12,13,16,13,10,13,16,12,12,10,12],\\"numero\\":13,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"A\\",\\"tipo\\":\\"G\\"},{\\"apellidoMaterno\\":\\"CORNEJO\\",\\"apellidoPaterno\\":\\"LUCANA\\",\\"asignaturasDesaprobadas\\":6,\\"codigo\\":null,\\"comportamiento\\":\\"16\\",\\"nombreCompleto\\":\\"LUCANA CORNEJO, JAIME CONSTANTINO\\",\\"nombres\\":\\"JAIME CONSTANTINO\\",\\"notas\\":[10,10,11,12,11,10,12,16,9,12,10,9],\\"numero\\":14,\\"observaciones\\":null,\\"sexo\\":\\"M\\",\\"situacionFinal\\":\\"R\\",\\"tipo\\":\\"G\\"}],\\"metadataActa\\":{\\"anioLectivo\\":2025,\\"areas\\":[{\\"codigo\\":\\"MAT\\",\\"nombre\\":\\"MATEMÁTICA\\",\\"posicion\\":1},{\\"codigo\\":\\"COM\\",\\"nombre\\":\\"COMUNICACIÓN\\",\\"posicion\\":2},{\\"codigo\\":\\"ING\\",\\"nombre\\":\\"INGLÉS\\",\\"posicion\\":3},{\\"codigo\\":\\"ART\\",\\"nombre\\":\\"ARTE\\",\\"posicion\\":4},{\\"codigo\\":\\"HGYE\\",\\"nombre\\":\\"HISTORIA, GEOGRAFÍA Y ECONOMÍA\\",\\"posicion\\":5},{\\"codigo\\":\\"FCYC\\",\\"nombre\\":\\"FORMACIÓN CIUDADANA Y CÍVICA\\",\\"posicion\\":6},{\\"codigo\\":\\"PFYR\\",\\"nombre\\":\\"PERSONA, FAMILIA Y RELACIONES HUMANAS\\",\\"posicion\\":7},{\\"codigo\\":\\"EF\\",\\"nombre\\":\\"EDUCACIÓN FÍSICA\\",\\"posicion\\":8},{\\"codigo\\":\\"ER\\",\\"nombre\\":\\"EDUCACIÓN RELIGIOSA\\",\\"posicion\\":9},{\\"codigo\\":\\"CTYA\\",\\"nombre\\":\\"CIENCIA, TECNOLOGÍA Y AMBIENTE\\",\\"posicion\\":10},{\\"codigo\\":\\"EPET\\",\\"nombre\\":\\"EDUCACIÓN PARA EL TRABAJO\\",\\"posicion\\":11},{\\"codigo\\":\\"TUT\\",\\"nombre\\":\\"TUTORÍA\\",\\"posicion\\":12}],\\"colegioOrigen\\":\\"No especificado\\",\\"grado\\":\\"Segundo Grado\\",\\"seccion\\":\\"A\\",\\"tipoEvaluacion\\":\\"FINAL\\",\\"turno\\":\\"MAÑANA\\"},\\"confianza\\":95,\\"procesadoCon\\":\\"gemini-2.5-pro\\",\\"fechaProcesamiento\\":\\"2025-11-12T14:10:54.866Z\\",\\"editorId\\":\\"57a1a83f-5242-4d95-ad55-82dc6655b45c\\"}", "fechaprocesamiento": "2025-11-12T14:10:54.866Z", "fecha_normalizacion": null, "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 10:40:53.195-05
7e7025b9-a4ed-475e-b6a9-f5a721a1516e	sesion	a0bb1ac6-8ed1-4a1b-b850-b1cd34deb870	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 11:23:52.684-05
12fcf745-fc2c-4628-b560-1f1e14ac3352	actafisica	bc8fc4b1-8e5d-4b5a-9fed-be603be3d88a	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:10:38.625-05
07ffcc3c-db15-4467-b9ee-b088208cee31	actafisica	5e908d3e-d17b-402e-8a68-68d5a686d513	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:10:41.67-05
35b083ba-1392-4c79-9516-f797e94caf12	actafisica	a99afb64-c102-47c6-a038-41554f80ee8e	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:10:53.666-05
12015337-52bf-492c-a910-18ef5573ff36	actafisica	206212f3-2359-42a0-82c3-7ec34bb7c9b8	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:11:07.172-05
2c0f9d89-a567-45fe-9b6d-90adfd011316	actafisica	ae09b012-a197-41ea-8674-4bcb101b1a50	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:11:10.183-05
e22ae3af-e639-4f83-be6b-3cf4254d3e7b	actafisica	a0c03cfd-dac5-4698-a107-49534389be46	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:11:13.932-05
3266dbe6-3504-4603-95d4-5d3a61c6e2ff	actafisica	be73de2e-3ead-41e9-bcec-086c9b271812	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:11:16.599-05
4c68f9ec-e0ed-4032-b55c-e09a2682ca87	actafisica	a1fca4f1-69e7-41a7-8c3f-e623fe01c4e6	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:11:19.445-05
b1ad493a-e00d-4bed-a3a6-ab5c47a5741b	actafisica	4ca5261b-f03a-47a7-9db9-bd123b6f73a2	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:11:22.177-05
eea422a5-9d37-42d8-9d46-89a5b5b63bd7	actafisica	44139832-8dfe-46af-9008-f07093e4a0a6	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:11:28.086-05
b02559fb-9da1-4e01-8620-4ab1fb9a074b	actafisica	d5f26eda-c41c-4083-943b-82b750628a17	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:11:31-05
889de2c1-faea-4c47-b04b-594f0ce782a5	actafisica	96101728-b5e5-48a6-8f8a-8d777360619b	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:11:34.456-05
33eb3ea4-addd-4078-b038-7f2db9759664	actafisica	b1e2e203-a9ec-42f0-8470-838d40fc2f02	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:11:37.149-05
33387d74-7852-4ac2-b219-3a7c03273ebc	actafisica	5909abcc-aa8e-4b67-9c2f-41710ebbb09a	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:13:15.882-05
b8218fa1-d70b-4af0-a7ef-e43216f8ec84	actafisica	5c6d8297-27f8-4cce-a9c0-f218de6ac40e	ACTUALIZAR	{"folio": "4", "turno": "MAÑANA", "gradoId": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "seccion": "A", "anioLectivoId": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "tipoEvaluacion": "FINAL"}	{"id": "5c6d8297-27f8-4cce-a9c0-f218de6ac40e", "tipo": "OCR_LIBRE", "folio": "4", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "niveleducativo": {"id": "7c599f4e-cef0-4a37-9c79-220650409b35", "orden": 1, "activo": true, "codigo": "SECUNDARIA", "nombre": "Educacion Secundaria", "descripcion": "Nivel educativo de 1ro° a 5to° año", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251112182432", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "anio": 2012, "activo": true, "fechafin": "2012-12-31T00:00:00.000Z", "fechainicio": "2012-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-12T18:24:32.358Z", "hasharchivo": null, "normalizada": false, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "18c2ba5e-c02d-4e36-911f-99a1fb08ae2c", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": {"metadata": {"modelo_ia": "gemini-2.5-pro", "advertencias": [], "procesado_en": "2025-11-12T18:24:32.358Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 14, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 1, "nombres": "OPTACIANO", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 2, "nombres": "FELIPE JESÚS", "situacionFinal": "R", "apellidoMaterno": "MAMANI", "apellidoPaterno": "CAHUI"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 9, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 3, "nombres": "EDGAR", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 4, "nombres": "RUFFO HÉCTOR", "situacionFinal": "A", "apellidoMaterno": "FLORES", "apellidoPaterno": "CALLO"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 5, "nombres": "AGUSTÍN RENEÉ", "situacionFinal": "A", "apellidoMaterno": "QUISPE", "apellidoPaterno": "CUNO"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 9, "MATEMÁTICA": 8, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 6, "nombres": "HUGO ALEJANDRO", "situacionFinal": "R", "apellidoMaterno": "CHAYÑA", "apellidoPaterno": "CHAYÑA"}, {"sexo": "M", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 7, "nombres": "VÍCTOR RAÚL", "observaciones": "Retir. por 30% Inasist. Injust. 30-10-85", "situacionFinal": "R", "apellidoMaterno": "SERRANO", "apellidoPaterno": "CHOQUECOTA"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 8, "nombres": "MIJAIL YGOR", "situacionFinal": "P", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 9, "nombres": "JUAN ANTONIO", "situacionFinal": "A", "apellidoMaterno": "DEL PINO", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 10, "nombres": "ALFONSO", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 16, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 11, "nombres": "ADOLFO", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 14, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 12, "nombres": "OSCAR RUBÉN", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI"}, {"sexo": "M", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 13, "nombres": "DAVID", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 9, "MATEMÁTICA": 10, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 14, "nombres": "JAIME CONSTANTINO", "situacionFinal": "R", "apellidoMaterno": "CORNEJO", "apellidoPaterno": "LUCANA"}]}, "fechaprocesamiento": "2025-11-12T18:24:32.358Z", "fecha_normalizacion": null, "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:24:52.024-05
bfd4ca2d-f4e7-4f96-ad6b-8e0e9e261e39	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:33:41.909-05
180ccc80-283f-4743-a3ae-cca0f9f0a033	sesion	d6e11807-db70-407c-8ddc-63a316243357	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:33:51.188-05
31ef443f-a7a7-4afc-bfbc-907b0f563b80	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:39:59.938-05
999e5a8a-6709-4301-bc1a-e34ecc8e8139	sesion	01e19881-6b3e-4127-8e06-319e2a50fb4a	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:40:10.35-05
cc21110b-5ca4-435c-982a-b39dcd84e66e	actafisica	58eea18f-19fc-4ae6-86c7-8bff0c860be1	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "gradoId": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "seccion": "A", "anioLectivoId": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "tipoEvaluacion": "FINAL"}	{"id": "58eea18f-19fc-4ae6-86c7-8bff0c860be1", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "orden": 2, "activo": true, "nombre": "Segundo Grado", "numero": 2, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "2DO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "niveleducativo": {"id": "7c599f4e-cef0-4a37-9c79-220650409b35", "orden": 1, "activo": true, "codigo": "SECUNDARIA", "nombre": "Educacion Secundaria", "descripcion": "Nivel educativo de 1ro° a 5to° año", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251112182917", "seccion": "A", "grado_id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "anio": 2005, "activo": false, "fechafin": "2005-12-31T00:00:00.000Z", "fechainicio": "2005-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-12T18:29:17.144Z", "hasharchivo": null, "normalizada": false, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": {"metadata": {"modelo_ia": "gemini-2.5-pro", "advertencias": [], "procesado_en": "2025-11-12T18:29:17.143Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 14, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 1, "nombres": "OPTACIANO", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 2, "nombres": "FELIPE JESÚS", "situacionFinal": "R", "apellidoMaterno": "MAMANI", "apellidoPaterno": "CAHUI"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 9, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 3, "nombres": "EDGAR", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 4, "nombres": "RUFFO HÉCTOR", "situacionFinal": "A", "apellidoMaterno": "FLORES", "apellidoPaterno": "CALLO"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 5, "nombres": "AGUSTÍN RENEÉ", "situacionFinal": "A", "apellidoMaterno": "QUISPE", "apellidoPaterno": "CUNO"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 9, "MATEMÁTICA": 8, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 6, "nombres": "HUGO ALEJANDRO", "situacionFinal": "R", "apellidoMaterno": "CHAYÑA", "apellidoPaterno": "CHAYÑA"}, {"sexo": "M", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 7, "nombres": "VÍCTOR RAÚL", "observaciones": "Retir. por 30% Inasist. Injust. 30-10-85", "situacionFinal": "R", "apellidoMaterno": "SERRANO", "apellidoPaterno": "CHOQUECOTA"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 8, "nombres": "MIJAIL YGOR", "situacionFinal": "P", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 9, "nombres": "JUAN ANTONIO", "situacionFinal": "A", "apellidoMaterno": "DEL PINO", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 10, "nombres": "ALFONSO", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 16, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 11, "nombres": "ADOLFO", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 14, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 12, "nombres": "OSCAR RUBÉN", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI"}, {"sexo": "M", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 13, "nombres": "DAVID", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 9, "MATEMÁTICA": 10, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 14, "nombres": "JAIME CONSTANTINO", "situacionFinal": "R", "apellidoMaterno": "CORNEJO", "apellidoPaterno": "LUCANA"}]}, "fechaprocesamiento": "2025-11-12T18:29:17.144Z", "fecha_normalizacion": null, "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:40:44.96-05
6a64b7f9-7092-48bf-b18c-b9b5c1acdf35	sesion	57a1a83f-5242-4d95-ad55-82dc6655b45c	LOGOUT	null	{"username": "desconocido"}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 22:58:46.301-05
b51b0b6a-4ea0-43db-9b3f-37dd2aa298e6	actafisica	50abfd51-2178-48a2-aa58-0cdcf9e9c4f1	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "gradoId": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "seccion": "A", "anioLectivoId": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "tipoEvaluacion": "FINAL"}	{"id": "50abfd51-2178-48a2-aa58-0cdcf9e9c4f1", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "orden": 2, "activo": true, "nombre": "Segundo Grado", "numero": 2, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "2DO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "niveleducativo": {"id": "7c599f4e-cef0-4a37-9c79-220650409b35", "orden": 1, "activo": true, "codigo": "SECUNDARIA", "nombre": "Educacion Secundaria", "descripcion": "Nivel educativo de 1ro° a 5to° año", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251112184030", "seccion": "A", "grado_id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "anio": 2005, "activo": false, "fechafin": "2005-12-31T00:00:00.000Z", "fechainicio": "2005-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-12T18:40:30.980Z", "hasharchivo": null, "normalizada": false, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": {"metadata": {"modelo_ia": "gemini-2.5-pro", "advertencias": [], "procesado_en": "2025-11-12T18:40:30.980Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 14, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 14, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 1, "nombres": "OPTACIANO", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 2, "nombres": "FELIPE JESÚS", "situacionFinal": "R", "apellidoMaterno": "MAMANI", "apellidoPaterno": "CAHUI"}, {"sexo": "M", "notas": {"ARTE": 9, "INGLÉS": 12, "TUTORÍA": 15, "MATEMÁTICA": 13, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 3, "nombres": "EDGAR", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 15, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 4, "nombres": "RUFFO HÉCTOR", "situacionFinal": "A", "apellidoMaterno": "FLORES", "apellidoPaterno": "CALLO"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 10}, "numero": 5, "nombres": "AGUSTÍN RENEÉ", "situacionFinal": "A", "apellidoMaterno": "QUISPE", "apellidoPaterno": "CUNO"}, {"sexo": "M", "notas": {"ARTE": 8, "INGLÉS": 9, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 9}, "numero": 6, "nombres": "HUGO ALEJANDRO", "situacionFinal": "R", "apellidoMaterno": "CHAYÑA", "apellidoPaterno": "CHAYÑA"}, {"sexo": "M", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 7, "nombres": "VÍCTOR RAÚL", "observaciones": "Retir. por 30% Inasist. Injust. 30-10-85", "situacionFinal": "R", "apellidoMaterno": "SERRANO", "apellidoPaterno": "CHOQUECOTA"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 8, "nombres": "MIJAIL YGOR", "situacionFinal": "P", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 11, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 9, "nombres": "JUAN ANTONIO", "situacionFinal": "A", "apellidoMaterno": "DEL PINO", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 10, "nombres": "ALFONSO", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 16, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 11, "nombres": "ADOLFO", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 12, "nombres": "OSCAR RUBÉN", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 16, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 13, "nombres": "DAVID", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 9, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 9}, "numero": 14, "nombres": "JAIME CONSTANTINO", "situacionFinal": "R", "apellidoMaterno": "CORNEJO", "apellidoPaterno": "LUCANA"}]}, "fechaprocesamiento": "2025-11-12T18:40:30.980Z", "fecha_normalizacion": null, "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:40:59.379-05
6e94efda-f398-4aa3-9156-7012c14828ba	actafisica	0255cdce-f6f2-4d7d-976f-d65d7602c9e2	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:47:05.841-05
aaf47d43-3b5c-4587-9b87-4d64b4c37610	actafisica	c85ca9af-55b6-48cf-91b1-7b44c2614339	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:47:09.311-05
349ebd14-b6fb-4667-bac2-572c9d3a320f	NORMALIZAR_ACTA	7debe9c6-2392-454c-951e-b754ae47eec3	CREAR	null	{"acta": {"id": "50abfd51-2178-48a2-aa58-0cdcf9e9c4f1", "numero": "OCR-LIBRE-20251112184030", "normalizada": true, "fecha_normalizacion": "2025-11-12T18:57:04.783Z"}, "mensaje": "Normalización exitosa: 14 estudiantes procesados", "success": true, "estadisticas": {"notas_creadas": 140, "vinculos_creados": 14, "estudiantes_creados": 14, "estudiantes_existentes": 0, "estudiantes_procesados": 14, "tiempo_procesamiento_ms": 312}}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:57:04.94-05
d7afd284-725a-45ea-b9a6-5f9252abd687	NORMALIZAR_ACTA	835b94d5-3f24-4baa-995e-afae6b44c5c6	CREAR	null	{"acta": {"id": "50abfd51-2178-48a2-aa58-0cdcf9e9c4f1", "numero": "OCR-LIBRE-20251112184030", "normalizada": true, "fecha_normalizacion": "2025-11-12T19:04:28.805Z"}, "mensaje": "Normalización exitosa: 14 estudiantes procesados", "success": true, "estadisticas": {"notas_creadas": 140, "vinculos_creados": 14, "estudiantes_creados": 0, "estudiantes_existentes": 14, "estudiantes_procesados": 14, "tiempo_procesamiento_ms": 285}}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 14:04:28.864-05
b2e34711-554d-4f9e-b2ef-5a7d3d451d17	NORMALIZAR_ACTA	0e0da0b5-6958-4630-9b88-7728b89d06b9	CREAR	null	{"acta": {"id": "4946eeb4-46df-4d84-b445-1a32374b0f6f", "numero": "OCR-LIBRE-20251112184827", "normalizada": true, "fecha_normalizacion": "2025-11-12T19:33:07.519Z"}, "mensaje": "Normalización exitosa: 14 estudiantes procesados", "success": true, "estadisticas": {"notas_creadas": 140, "vinculos_creados": 14, "estudiantes_creados": 0, "estudiantes_existentes": 14, "estudiantes_procesados": 14, "tiempo_procesamiento_ms": 207}}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 14:33:07.527-05
c89d37db-6b12-4524-aaa0-8d465ab5f42e	sesion	fb8a1f88-7705-49f1-859d-f60c61a12278	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 14:55:44.116-05
8c39669c-0db0-4757-9862-adb7763f469b	actafisica	4946eeb4-46df-4d84-b445-1a32374b0f6f	ACTUALIZAR	{"folio": "2", "turno": "MAÑANA", "gradoId": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "seccion": "A", "anioLectivoId": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "tipoEvaluacion": "FINAL"}	{"id": "4946eeb4-46df-4d84-b445-1a32374b0f6f", "tipo": "OCR_LIBRE", "folio": "2", "grado": {"id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "orden": 2, "activo": true, "nombre": "Segundo Grado", "numero": 2, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "2DO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "niveleducativo": {"id": "7c599f4e-cef0-4a37-9c79-220650409b35", "orden": 1, "activo": true, "codigo": "SECUNDARIA", "nombre": "Educacion Secundaria", "descripcion": "Nivel educativo de 1ro° a 5to° año", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "NORMALIZADA", "numero": "OCR-LIBRE-20251112184827", "seccion": "A", "grado_id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "anio": 2005, "activo": false, "fechafin": "2005-12-31T00:00:00.000Z", "fechainicio": "2005-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-12T18:48:27.796Z", "hasharchivo": null, "normalizada": true, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": {"metadata": {"modelo_ia": "gemini-2.5-pro", "advertencias": [], "procesado_en": "2025-11-12T18:48:27.796Z", "areas_detectadas": ["ARTE", "INGLÉS", "TUTORÍA", "MATEMÁTICA", "COMUNICACIÓN", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "EDUCACIÓN PARA EL TRABAJO", "FORMACIÓN CIUDADANA Y CÍVICA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "PERSONA, FAMILIA Y RELACIONES HUMANAS"], "total_estudiantes": 14, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 14, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 1, "nombres": "OPTACIANO", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 2, "nombres": "FELIPE JESÚS", "situacionFinal": "R", "apellidoMaterno": "MAMANI", "apellidoPaterno": "CAHUI"}, {"sexo": "M", "notas": {"ARTE": 9, "INGLÉS": 12, "TUTORÍA": 15, "MATEMÁTICA": 13, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 3, "nombres": "EDGAR", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 15, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 4, "nombres": "RUFFO HÉCTOR", "situacionFinal": "A", "apellidoMaterno": "FLORES", "apellidoPaterno": "CALLO"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 10}, "numero": 5, "nombres": "AGUSTÍN RENEÉ", "situacionFinal": "A", "apellidoMaterno": "QUISPE", "apellidoPaterno": "CUNO"}, {"sexo": "M", "notas": {"ARTE": 8, "INGLÉS": 9, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 9}, "numero": 6, "nombres": "HUGO ALEJANDRO", "situacionFinal": "R", "apellidoMaterno": "CHAYÑA", "apellidoPaterno": "CHAYÑA"}, {"sexo": "M", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 7, "nombres": "VÍCTOR RAÚL", "observaciones": "Retir. por 30% Inasist. Injust. 30-10-85", "situacionFinal": "R", "apellidoMaterno": "SERRANO", "apellidoPaterno": "CHOQUECOTA"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 8, "nombres": "MIJAIL YGOR", "situacionFinal": "P", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 11, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 9, "nombres": "JUAN ANTONIO", "situacionFinal": "A", "apellidoMaterno": "DEL PINO", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 10, "nombres": "ALFONSO", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 16, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 11, "nombres": "ADOLFO", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 12, "nombres": "OSCAR RUBÉN", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 16, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 13, "nombres": "DAVID", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 9, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 9}, "numero": 14, "nombres": "JAIME CONSTANTINO", "situacionFinal": "R", "apellidoMaterno": "CORNEJO", "apellidoPaterno": "LUCANA"}]}, "fechaprocesamiento": "2025-11-12T18:48:27.796Z", "fecha_normalizacion": "2025-11-12T19:33:07.513Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 15:02:31.187-05
80af7c00-ade9-44af-a424-9436a57c8be4	actafisica	4946eeb4-46df-4d84-b445-1a32374b0f6f	ACTUALIZAR	{"folio": "2", "turno": "MAÑANA", "gradoId": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libroId": "cd21550c-b652-4be8-a820-83ff6680c6cf", "seccion": "A", "anioLectivoId": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "tipoEvaluacion": "FINAL"}	{"id": "4946eeb4-46df-4d84-b445-1a32374b0f6f", "tipo": "OCR_LIBRE", "folio": "2", "grado": {"id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "orden": 2, "activo": true, "nombre": "Segundo Grado", "numero": 2, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "2DO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "niveleducativo": {"id": "7c599f4e-cef0-4a37-9c79-220650409b35", "orden": 1, "activo": true, "codigo": "SECUNDARIA", "nombre": "Educacion Secundaria", "descripcion": "Nivel educativo de 1ro° a 5to° año", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}}, "libro": {"id": "cd21550c-b652-4be8-a820-83ff6680c6cf", "activo": true, "codigo": "2", "estado": "ACTIVO", "nombre": "Educacion Secundaria", "estante": "", "anio_fin": 1995, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 496, "tipo_acta": null, "anio_inicio": 1991, "descripcion": "Libro de actas 1991-1995", "folio_inicio": 1, "total_folios": 480, "observaciones": "", "fecha_creacion": "2025-11-10T01:15:57.150Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 2.", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "NORMALIZADA", "numero": "OCR-LIBRE-20251112184827", "seccion": "A", "grado_id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libro_id": "cd21550c-b652-4be8-a820-83ff6680c6cf", "urlarchivo": null, "aniolectivo": {"id": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "anio": 2005, "activo": false, "fechafin": "2005-12-31T00:00:00.000Z", "fechainicio": "2005-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-12T18:48:27.796Z", "hasharchivo": null, "normalizada": true, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": {"metadata": {"modelo_ia": "gemini-2.5-pro", "advertencias": [], "procesado_en": "2025-11-12T18:48:27.796Z", "areas_detectadas": ["ARTE", "INGLÉS", "TUTORÍA", "MATEMÁTICA", "COMUNICACIÓN", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "EDUCACIÓN PARA EL TRABAJO", "FORMACIÓN CIUDADANA Y CÍVICA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "PERSONA, FAMILIA Y RELACIONES HUMANAS"], "total_estudiantes": 14, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 14, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 1, "nombres": "OPTACIANO", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 2, "nombres": "FELIPE JESÚS", "situacionFinal": "R", "apellidoMaterno": "MAMANI", "apellidoPaterno": "CAHUI"}, {"sexo": "M", "notas": {"ARTE": 9, "INGLÉS": 12, "TUTORÍA": 15, "MATEMÁTICA": 13, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 3, "nombres": "EDGAR", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 15, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 4, "nombres": "RUFFO HÉCTOR", "situacionFinal": "A", "apellidoMaterno": "FLORES", "apellidoPaterno": "CALLO"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 10}, "numero": 5, "nombres": "AGUSTÍN RENEÉ", "situacionFinal": "A", "apellidoMaterno": "QUISPE", "apellidoPaterno": "CUNO"}, {"sexo": "M", "notas": {"ARTE": 8, "INGLÉS": 9, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 9}, "numero": 6, "nombres": "HUGO ALEJANDRO", "situacionFinal": "R", "apellidoMaterno": "CHAYÑA", "apellidoPaterno": "CHAYÑA"}, {"sexo": "M", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 7, "nombres": "VÍCTOR RAÚL", "observaciones": "Retir. por 30% Inasist. Injust. 30-10-85", "situacionFinal": "R", "apellidoMaterno": "SERRANO", "apellidoPaterno": "CHOQUECOTA"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 8, "nombres": "MIJAIL YGOR", "situacionFinal": "P", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 11, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 9, "nombres": "JUAN ANTONIO", "situacionFinal": "A", "apellidoMaterno": "DEL PINO", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 10, "nombres": "ALFONSO", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 16, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 11, "nombres": "ADOLFO", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 12, "nombres": "OSCAR RUBÉN", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 16, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 13, "nombres": "DAVID", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 9, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 9}, "numero": 14, "nombres": "JAIME CONSTANTINO", "situacionFinal": "R", "apellidoMaterno": "CORNEJO", "apellidoPaterno": "LUCANA"}]}, "fechaprocesamiento": "2025-11-12T18:48:27.796Z", "fecha_normalizacion": "2025-11-12T19:33:07.513Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 15:02:59.772-05
84566e54-b422-4db1-aee3-d57f78288bf4	actafisica	4946eeb4-46df-4d84-b445-1a32374b0f6f	ACTUALIZAR	{"folio": "2", "turno": "MAÑANA", "gradoId": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libroId": "cd21550c-b652-4be8-a820-83ff6680c6cf", "seccion": "A", "anioLectivoId": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "tipoEvaluacion": "FINAL"}	{"id": "4946eeb4-46df-4d84-b445-1a32374b0f6f", "tipo": "OCR_LIBRE", "folio": "2", "grado": {"id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "orden": 2, "activo": true, "nombre": "Segundo Grado", "numero": 2, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "2DO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "niveleducativo": {"id": "7c599f4e-cef0-4a37-9c79-220650409b35", "orden": 1, "activo": true, "codigo": "SECUNDARIA", "nombre": "Educacion Secundaria", "descripcion": "Nivel educativo de 1ro° a 5to° año", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}}, "libro": {"id": "cd21550c-b652-4be8-a820-83ff6680c6cf", "activo": true, "codigo": "2", "estado": "ACTIVO", "nombre": "Educacion Secundaria", "estante": "", "anio_fin": 1995, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 496, "tipo_acta": null, "anio_inicio": 1991, "descripcion": "Libro de actas 1991-1995", "folio_inicio": 1, "total_folios": 480, "observaciones": "", "fecha_creacion": "2025-11-10T01:15:57.150Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 2.", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "NORMALIZADA", "numero": "OCR-LIBRE-20251112184827", "seccion": "A", "grado_id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libro_id": "cd21550c-b652-4be8-a820-83ff6680c6cf", "urlarchivo": null, "aniolectivo": {"id": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "anio": 2005, "activo": false, "fechafin": "2005-12-31T00:00:00.000Z", "fechainicio": "2005-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-12T18:48:27.796Z", "hasharchivo": null, "normalizada": true, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": {"metadata": {"modelo_ia": "gemini-2.5-pro", "advertencias": [], "procesado_en": "2025-11-12T18:48:27.796Z", "areas_detectadas": ["ARTE", "INGLÉS", "TUTORÍA", "MATEMÁTICA", "COMUNICACIÓN", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "EDUCACIÓN PARA EL TRABAJO", "FORMACIÓN CIUDADANA Y CÍVICA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "PERSONA, FAMILIA Y RELACIONES HUMANAS"], "total_estudiantes": 14, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 14, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 1, "nombres": "OPTACIANO", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 2, "nombres": "FELIPE JESÚS", "situacionFinal": "R", "apellidoMaterno": "MAMANI", "apellidoPaterno": "CAHUI"}, {"sexo": "M", "notas": {"ARTE": 9, "INGLÉS": 12, "TUTORÍA": 15, "MATEMÁTICA": 13, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 3, "nombres": "EDGAR", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 15, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 4, "nombres": "RUFFO HÉCTOR", "situacionFinal": "A", "apellidoMaterno": "FLORES", "apellidoPaterno": "CALLO"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 10}, "numero": 5, "nombres": "AGUSTÍN RENEÉ", "situacionFinal": "A", "apellidoMaterno": "QUISPE", "apellidoPaterno": "CUNO"}, {"sexo": "M", "notas": {"ARTE": 8, "INGLÉS": 9, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 9}, "numero": 6, "nombres": "HUGO ALEJANDRO", "situacionFinal": "R", "apellidoMaterno": "CHAYÑA", "apellidoPaterno": "CHAYÑA"}, {"sexo": "M", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 7, "nombres": "VÍCTOR RAÚL", "observaciones": "Retir. por 30% Inasist. Injust. 30-10-85", "situacionFinal": "R", "apellidoMaterno": "SERRANO", "apellidoPaterno": "CHOQUECOTA"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 8, "nombres": "MIJAIL YGOR", "situacionFinal": "P", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 11, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 9, "nombres": "JUAN ANTONIO", "situacionFinal": "A", "apellidoMaterno": "DEL PINO", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 10, "nombres": "ALFONSO", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 16, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 11, "nombres": "ADOLFO", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 12, "nombres": "OSCAR RUBÉN", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 16, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 13, "nombres": "DAVID", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 9, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 9}, "numero": 14, "nombres": "JAIME CONSTANTINO", "situacionFinal": "R", "apellidoMaterno": "CORNEJO", "apellidoPaterno": "LUCANA"}]}, "fechaprocesamiento": "2025-11-12T18:48:27.796Z", "fecha_normalizacion": "2025-11-12T19:33:07.513Z", "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 15:32:49.945-05
46969d20-1a44-4121-91c2-e8821fabcf68	actafisica	9696c4f4-f181-46d9-ae53-6b53b09dd665	ACTUALIZAR	{"folio": "2", "turno": "MAÑANA", "gradoId": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "seccion": "A", "anioLectivoId": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "tipoEvaluacion": "FINAL"}	{"id": "9696c4f4-f181-46d9-ae53-6b53b09dd665", "tipo": "OCR_LIBRE", "folio": "2", "grado": {"id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "orden": 2, "activo": true, "nombre": "Segundo Grado", "numero": 2, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "2DO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "niveleducativo": {"id": "7c599f4e-cef0-4a37-9c79-220650409b35", "orden": 1, "activo": true, "codigo": "SECUNDARIA", "nombre": "Educacion Secundaria", "descripcion": "Nivel educativo de 1ro° a 5to° año", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251112203229", "seccion": "A", "grado_id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "anio": 2005, "activo": false, "fechafin": "2005-12-31T00:00:00.000Z", "fechainicio": "2005-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-12T20:32:29.579Z", "hasharchivo": null, "normalizada": false, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "f2ddff9d-85a7-4433-9e55-0c69d6bbf924", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": {"metadata": {"modelo_ia": "gemini-2.5-pro", "advertencias": [], "procesado_en": "2025-11-12T20:32:29.579Z", "areas_detectadas": ["ARTE", "INGLÉS", "TUTORÍA", "MATEMÁTICA", "COMUNICACIÓN", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "EDUCACIÓN PARA EL TRABAJO", "FORMACIÓN CIUDADANA Y CÍVICA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "PERSONA, FAMILIA Y RELACIONES HUMANAS"], "total_estudiantes": 14, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 14, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 1, "nombres": "OPTACIANO", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 2, "nombres": "FELIPE JESÚS", "situacionFinal": "R", "apellidoMaterno": "MAMANI", "apellidoPaterno": "CAHUI"}, {"sexo": "M", "notas": {"ARTE": 9, "INGLÉS": 12, "TUTORÍA": 15, "MATEMÁTICA": 13, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 3, "nombres": "EDGAR", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 15, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 4, "nombres": "RUFFO HÉCTOR", "situacionFinal": "A", "apellidoMaterno": "FLORES", "apellidoPaterno": "CALLO"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 10}, "numero": 5, "nombres": "AGUSTÍN RENEÉ", "situacionFinal": "A", "apellidoMaterno": "QUISPE", "apellidoPaterno": "CUNO"}, {"sexo": "M", "notas": {"ARTE": 8, "INGLÉS": 9, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 9}, "numero": 6, "nombres": "HUGO ALEJANDRO", "situacionFinal": "R", "apellidoMaterno": "CHAYÑA", "apellidoPaterno": "CHAYÑA"}, {"sexo": "M", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 7, "nombres": "VÍCTOR RAÚL", "observaciones": "Retir. por 30% Inasist. Injust. 30-10-85", "situacionFinal": "R", "apellidoMaterno": "SERRANO", "apellidoPaterno": "CHOQUECOTA"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 8, "nombres": "MIJAIL YGOR", "situacionFinal": "P", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 11, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 9, "nombres": "JUAN ANTONIO", "situacionFinal": "A", "apellidoMaterno": "DEL PINO", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 10, "nombres": "ALFONSO", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 16, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 11, "nombres": "ADOLFO", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 12, "nombres": "OSCAR RUBÉN", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 16, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 13, "nombres": "DAVID", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 9, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 10, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 9}, "numero": 14, "nombres": "JAIME CONSTANTINO", "situacionFinal": "R", "apellidoMaterno": "CORNEJO", "apellidoPaterno": "LUCANA"}]}, "fechaprocesamiento": "2025-11-12T20:32:29.579Z", "fecha_normalizacion": null, "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 15:32:59.941-05
53452de8-bc2d-4379-9803-66ee3c9bdaa9	sesion	4da46ec1-f78f-4a7f-b9fc-858b0988942e	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 19:40:07.982-05
04edb2b6-4fcd-4c7f-bfef-e1fb386cc53c	actafisica	9696c4f4-f181-46d9-ae53-6b53b09dd665	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 20:46:16.1-05
f4206614-e460-4746-8a36-2dd5c43422e6	actafisica	4946eeb4-46df-4d84-b445-1a32374b0f6f	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 20:46:18.872-05
f02791bf-aefa-46e7-8ca9-3b22e6072907	actafisica	50abfd51-2178-48a2-aa58-0cdcf9e9c4f1	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 20:46:21.4-05
68514d02-0547-4572-9594-b3bc927d2dec	actafisica	58eea18f-19fc-4ae6-86c7-8bff0c860be1	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 20:46:27.762-05
d4f2cd38-f179-4ae1-a97d-18e3ef93b7a0	actafisica	5c6d8297-27f8-4cce-a9c0-f218de6ac40e	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 20:46:31.158-05
a37f120e-6ae2-4c34-83e7-8ea2fb060e62	actafisica	c2ec645a-2599-4bf4-b36b-5c55aaca6a9b	ACTUALIZAR	{"folio": "1", "turno": "MAÑANA", "gradoId": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "seccion": "A", "anioLectivoId": "4800a722-34ad-4686-97bf-0b5cb443b078", "tipoEvaluacion": "FINAL"}	{"id": "c2ec645a-2599-4bf4-b36b-5c55aaca6a9b", "tipo": "OCR_LIBRE", "folio": "1", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "niveleducativo": {"id": "7c599f4e-cef0-4a37-9c79-220650409b35", "orden": 1, "activo": true, "codigo": "SECUNDARIA", "nombre": "Educacion Secundaria", "descripcion": "Nivel educativo de 1ro° a 5to° año", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251113021742", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "4800a722-34ad-4686-97bf-0b5cb443b078", "anio": 1985, "activo": false, "fechafin": "1985-12-31T00:00:00.000Z", "fechainicio": "1985-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-13T02:17:42.631Z", "hasharchivo": null, "normalizada": false, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "4800a722-34ad-4686-97bf-0b5cb443b078", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": {"metadata": {"modelo_ia": "gemini-2.5-pro", "advertencias": [], "procesado_en": "2025-11-13T02:17:42.631Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 32, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 14, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 1, "nombres": "EDGAR WALTER", "situacionFinal": "A", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR"}, {"sexo": "M", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 2, "nombres": "DOMINGO DAVID", "observaciones": "Retir. por 30% Inasist. Injust. 04-07-85", "situacionFinal": "R", "apellidoMaterno": "PARISACA", "apellidoPaterno": "APAZA"}, {"sexo": "M", "notas": {"ARTE": 15, "INGLÉS": 15, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 3, "nombres": "BELCHER", "observaciones": "Rectif de Nombre Napoleon", "situacionFinal": "P", "apellidoMaterno": "CRUZ", "apellidoPaterno": "ASQUI"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 4, "nombres": "OPTACIANO", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 5, "nombres": "FELIPE JESÚS", "situacionFinal": "R", "apellidoMaterno": "MAMANI", "apellidoPaterno": "CAHUI"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 9, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 10}, "numero": 6, "nombres": "EDGAR", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 7, "nombres": "RUFFO HÉCTOR", "situacionFinal": "A", "apellidoMaterno": "FLORES", "apellidoPaterno": "CALLO"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 8, "nombres": "AGUSTÍN RENEÉ", "situacionFinal": "A", "apellidoMaterno": "QUISPE", "apellidoPaterno": "CUNO"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 9, "MATEMÁTICA": 8, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 9, "nombres": "HUGO ALEJANDRO", "situacionFinal": "R", "apellidoMaterno": "CHAYÑA", "apellidoPaterno": "CHAYÑA"}, {"sexo": "M", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 10, "nombres": "VÍCTOR RAÚL", "observaciones": "Retir. por 30% Inasist. Injust. 30-10-85", "situacionFinal": "R", "apellidoMaterno": "SERRANO", "apellidoPaterno": "CHOQUECOOTA"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 11, "nombres": "MIJAIL YGOR", "situacionFinal": "P", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 12, "nombres": "JUAN ANTONIO", "situacionFinal": "A", "apellidoMaterno": "DEL PINO", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 13, "nombres": "ALFONSO", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 16, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 14, "nombres": "ADOLFO", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 14, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 15, "nombres": "OSCAR RUBÉN", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI"}, {"sexo": "M", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 16, "nombres": "DAVID", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 10, "TUTORÍA": 10, "MATEMÁTICA": 10, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 16, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 9, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 10}, "numero": 17, "nombres": "JAIME CONSTANTINO", "situacionFinal": "R", "apellidoMaterno": "CORNEJO", "apellidoPaterno": "LUCANA"}, {"sexo": "M", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 18, "nombres": "JOSÉ LUIS", "situacionFinal": "P", "apellidoMaterno": "RIVAS", "apellidoPaterno": "LLANOS"}, {"sexo": "M", "notas": {"ARTE": 15, "INGLÉS": 16, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 19, "nombres": "JORGE", "situacionFinal": "P", "apellidoMaterno": "RAMOS", "apellidoPaterno": "MAQUERA"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 20, "nombres": "MARIO", "situacionFinal": "A", "apellidoMaterno": "MACHACA", "apellidoPaterno": "MENDIZABAL"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 21, "nombres": "RUBÉN", "situacionFinal": "A", "apellidoMaterno": "NENA", "apellidoPaterno": "MENDOZA"}, {"sexo": "M", "notas": {"ARTE": 15, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 10, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 22, "nombres": "HERMES DOUGLAS", "situacionFinal": "A", "apellidoMaterno": "AQUINO", "apellidoPaterno": "MIRAVAL"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 10, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 23, "nombres": "LIBORIO TEÓFILO", "situacionFinal": "A", "apellidoMaterno": "CARRASCO", "apellidoPaterno": "PACHAPUMA"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 24, "nombres": "JOSÉ LUIS", "situacionFinal": "P", "apellidoMaterno": "ATENCIO", "apellidoPaterno": "RONQUILLO"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 25, "nombres": "JAIME", "situacionFinal": "P", "apellidoMaterno": "VARGAS", "apellidoPaterno": "TIPULA"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 17, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 26, "nombres": "WILLIAM EFRAÍN", "situacionFinal": "A", "apellidoMaterno": "TITO", "apellidoPaterno": "VALERO"}, {"sexo": "M", "notas": {"ARTE": 15, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 15, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 18, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 27, "nombres": "JUAN WASHINGTON", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "VARGAS"}, {"sexo": "M", "notas": {"ARTE": 16, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 28, "nombres": "RONMEL ISAAC", "situacionFinal": "P", "apellidoMaterno": "CHARAJA", "apellidoPaterno": "VARGAS"}, {"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 11, "TUTORÍA": 10, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 9, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 29, "nombres": "JUAN", "observaciones": "Firma apoderado Carlos Nombre Agustin 0.11.86", "situacionFinal": "R", "apellidoMaterno": "APAZA", "apellidoPaterno": "VILCA"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 30, "nombres": "RONALD", "situacionFinal": "P", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "YANQUI"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 31, "nombres": "JULIAN EDGAR", "situacionFinal": "A", "apellidoMaterno": "CHOQUE", "apellidoPaterno": "ZAPANA"}, {"sexo": "M", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 32, "nombres": "ADOLFO", "observaciones": "Retir. por 30% Inasist. Injust. 04-07-85", "situacionFinal": "R", "apellidoMaterno": "PEREZ", "apellidoPaterno": "ZARATE"}]}, "fechaprocesamiento": "2025-11-13T02:17:42.631Z", "fecha_normalizacion": null, "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 21:33:12.123-05
d26a9f19-f272-4191-8491-6fbbd8557c4d	actafisica	894cbaeb-ae6e-4fb0-b83a-7cadb5f985ac	ACTUALIZAR	{"folio": "2", "turno": "MAÑANA", "gradoId": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "seccion": "A", "anioLectivoId": "74a5ab00-d6b1-4b7b-9b57-d026e194ae07", "tipoEvaluacion": "FINAL"}	{"id": "894cbaeb-ae6e-4fb0-b83a-7cadb5f985ac", "tipo": "OCR_LIBRE", "folio": "2", "grado": {"id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "orden": 2, "activo": true, "nombre": "Segundo Grado", "numero": 2, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "2DO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "niveleducativo": {"id": "7c599f4e-cef0-4a37-9c79-220650409b35", "orden": 1, "activo": true, "codigo": "SECUNDARIA", "nombre": "Educacion Secundaria", "descripcion": "Nivel educativo de 1ro° a 5to° año", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251113023243", "seccion": "A", "grado_id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "74a5ab00-d6b1-4b7b-9b57-d026e194ae07", "anio": 1986, "activo": false, "fechafin": "1986-12-31T00:00:00.000Z", "fechainicio": "1986-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-13T02:32:43.981Z", "hasharchivo": null, "normalizada": false, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "74a5ab00-d6b1-4b7b-9b57-d026e194ae07", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": {"metadata": {"modelo_ia": "gemini-2.5-pro", "advertencias": [], "procesado_en": "2025-11-13T02:32:43.981Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 30, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "notas": {"ARTE": 10, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 6, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 1, "nombres": "EDGAR WALTER", "situacionFinal": "A", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 2, "nombres": "BELCHER", "situacionFinal": "P", "apellidoMaterno": "CRUZ", "apellidoPaterno": "ASQUI"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 8, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 3, "nombres": "OPTACIANO", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 13, "TUTORÍA": 11, "MATEMÁTICA": 9, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 4, "nombres": "EDGAR", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 5, "nombres": "RUFFO HÉCTOR", "situacionFinal": "P", "apellidoMaterno": "FLORES", "apellidoPaterno": "CALLO"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 6, "nombres": "MIJAIL YGOR", "situacionFinal": "P", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 10, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 7, "nombres": "JESÚS", "situacionFinal": "A", "apellidoMaterno": "PALOMINO", "apellidoPaterno": "FUENTES"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 10, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 9, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 8, "nombres": "JUAN ANTONIO", "situacionFinal": "A", "apellidoMaterno": "DEL PINO", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 9, "nombres": "ALFONSO", "situacionFinal": "A", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 10, "nombres": "ADOLFO", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 11, "nombres": "OSCAR RUBÉN", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 12, "nombres": "DAVID", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 13, "nombres": "FABIO DAVID", "situacionFinal": "P", "apellidoMaterno": "SALAS", "apellidoPaterno": "IGLESIAS"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 10, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 14, "nombres": "JOSÉ LUIS", "situacionFinal": "A", "apellidoMaterno": "RIVAS", "apellidoPaterno": "LLANOS"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 9, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 15, "nombres": "RONALD CARLOS", "situacionFinal": "A", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "LLANQUE"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 15, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 16, "nombres": "JORGE", "situacionFinal": "P", "apellidoMaterno": "RAMOS", "apellidoPaterno": "MAQUERA"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 8, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 8, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 7, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 9, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 17, "nombres": "DAVID", "situacionFinal": "R", "apellidoMaterno": "ZAPANA", "apellidoPaterno": "MAYTA"}, {"sexo": "M", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 18, "nombres": "MARIO", "observaciones": "Retirado por motivos familiares 29.09.86", "situacionFinal": "R", "apellidoMaterno": "MACHACA", "apellidoPaterno": "MENDIZABAL"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 8, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 19, "nombres": "RUBEN", "situacionFinal": "A", "apellidoMaterno": "NENA", "apellidoPaterno": "MENDOZA"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 12, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 20, "nombres": "HERMES DOUGLAS", "situacionFinal": "A", "apellidoMaterno": "AQUINO", "apellidoPaterno": "MIRAVAL"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 21, "nombres": "FACTOR VICTOR", "situacionFinal": "P", "apellidoMaterno": "PONCE", "apellidoPaterno": "NINA"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 22, "nombres": "JOSÉ LUIS", "situacionFinal": "P", "apellidoMaterno": "ATENCIO", "apellidoPaterno": "RONQUILLO"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 23, "nombres": "GLOBER", "situacionFinal": "A", "apellidoMaterno": "ORTEGAL", "apellidoPaterno": "SOTO"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 24, "nombres": "JAIME", "situacionFinal": "P", "apellidoMaterno": "VARGAS", "apellidoPaterno": "TIPULA"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 10, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 25, "nombres": "CÉSAR LUCIO", "situacionFinal": "A", "apellidoMaterno": "VALDIVIA", "apellidoPaterno": "TOVAR"}, {"sexo": "M", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 26, "nombres": "WILLIAM EFRAÍN", "situacionFinal": "P", "apellidoMaterno": "TITO", "apellidoPaterno": "VALERO"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 15, "TUTORÍA": 13, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 18, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 27, "nombres": "JUAN WASHINGTON", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "VARGAS"}, {"sexo": "M", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 14, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 28, "nombres": "RONMEL ISAAC", "situacionFinal": "P", "apellidoMaterno": "CHARAJA", "apellidoPaterno": "VARGAS"}, {"sexo": "M", "notas": {"ARTE": 14, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 13, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 29, "nombres": "JUSTO GERMÁN", "situacionFinal": "P", "apellidoMaterno": "CONTRERAS", "apellidoPaterno": "VERASTEGUI"}, {"sexo": "M", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 9, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 30, "nombres": "JULIÁN EDGAR", "situacionFinal": "A", "apellidoMaterno": "CHOQUE", "apellidoPaterno": "ZAPANA"}]}, "fechaprocesamiento": "2025-11-13T02:32:43.981Z", "fecha_normalizacion": null, "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 21:33:20.19-05
79bf34c9-e42a-4142-b1bf-0fed6d06d4b8	actafisica	f2821cea-c7ce-4bdd-87c9-8a08657d1604	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 22:16:37.868-05
dfab0850-d005-422c-b5ca-4ab8d0e05db2	sesion	a4fbff7a-f88f-4f3b-b0f7-7920e99109f1	LOGIN	null	{"username": "desconocido"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 22:58:54.707-05
aa816955-ba35-45a4-b2d7-72dd779df413	actafisica	f6c55832-f089-4fc1-9f2b-632711c2f20f	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-13 00:00:12.278-05
18ccceb5-4a74-4e5d-a103-ced331aee00e	actafisica	046fa91d-276e-4dc4-af93-ebfd6fb98691	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-13 00:09:00.246-05
3409ad6f-3e85-4f83-9054-28033ce171fc	actafisica	894cbaeb-ae6e-4fb0-b83a-7cadb5f985ac	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-13 00:11:12.329-05
f755f1b2-a495-43c5-aee4-703758c38563	actafisica	c2ec645a-2599-4bf4-b36b-5c55aaca6a9b	ELIMINAR	{}	null	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-13 00:16:24.813-05
8bb89a68-a13f-4223-afb1-e730c41b62e1	actafisica	f46730d3-93c4-4198-8990-4c3e0504cbd4	ACTUALIZAR	{"folio": "5", "turno": "MAÑANA", "gradoId": "c2b3d6ff-c0ce-4932-ac72-5a3f8a48d7d1", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "seccion": "A", "anioLectivoId": "e0ac2d1e-0b62-433d-919b-ca87899bc3e5", "tipoEvaluacion": "FINAL"}	{"id": "f46730d3-93c4-4198-8990-4c3e0504cbd4", "tipo": "OCR_LIBRE", "folio": "5", "grado": {"id": "c2b3d6ff-c0ce-4932-ac72-5a3f8a48d7d1", "orden": 5, "activo": true, "nombre": "Quinto Grado", "numero": 5, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "5TO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "niveleducativo": {"id": "7c599f4e-cef0-4a37-9c79-220650409b35", "orden": 1, "activo": true, "codigo": "SECUNDARIA", "nombre": "Educacion Secundaria", "descripcion": "Nivel educativo de 1ro° a 5to° año", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251113045933", "seccion": "A", "grado_id": "c2b3d6ff-c0ce-4932-ac72-5a3f8a48d7d1", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "e0ac2d1e-0b62-433d-919b-ca87899bc3e5", "anio": 1989, "activo": false, "fechafin": "1989-12-31T00:00:00.000Z", "fechainicio": "1989-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-13T04:59:33.334Z", "hasharchivo": null, "normalizada": false, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "e0ac2d1e-0b62-433d-919b-ca87899bc3e5", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": {"metadata": {"modelo_ia": "Gemini", "advertencias": [], "procesado_en": "2025-11-13T04:59:33.334Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 30, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 16, "TUTORÍA": 11, "MATEMÁTICA": 15, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 17, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 1, "nombres": "JESÚS", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 15, "TUTORÍA": 17, "MATEMÁTICA": 14, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 18}, "numero": 2, "nombres": "DANTE", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "ALOSILLA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 15, "TUTORÍA": 16, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 3, "nombres": "JOSÉ LUIS", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "COACALLA", "apellidoPaterno": "ANGLES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 14, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 4, "nombres": "JULIÁN", "comportamiento": "13", "situacionFinal": "P", "apellidoMaterno": "ARCATA", "apellidoPaterno": "AQUINO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 15, "TUTORÍA": 15, "MATEMÁTICA": 15, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 5, "nombres": "JESÚS YAMES", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "AYLLON", "apellidoPaterno": "ARAUJO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 15, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 17, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 6, "nombres": "ALEXIS", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "PEREZ", "apellidoPaterno": "ARIAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 7, "nombres": "MIGUEL GABINO", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "ASCARRUNZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 16, "EDUCACIÓN PARA EL TRABAJO": 8, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 8, "nombres": "MARCO ANTONIO", "comportamiento": "16", "situacionFinal": "R", "apellidoMaterno": "PAREDES", "apellidoPaterno": "ATENCIO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 10, "MATEMÁTICA": 15, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 5, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 9, "nombres": "JAVIER", "comportamiento": "13", "situacionFinal": "R", "apellidoMaterno": "VALENCIA", "apellidoPaterno": "AZA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 14, "TUTORÍA": 10, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 9}, "numero": 10, "nombres": "PEDRO", "comportamiento": "14", "situacionFinal": "R", "apellidoMaterno": "PACHARI", "apellidoPaterno": "BARREDA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 11, "TUTORÍA": 14, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 11, "nombres": "LUIS ABRAHAM", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "CANAZA", "apellidoPaterno": "BELTRAN", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 12, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 9, "EDUCACIÓN RELIGIOSA": 17, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 12, "nombres": "ANIBAL AMÉRICO", "comportamiento": "10", "situacionFinal": "R", "apellidoMaterno": "CASTAÑON", "apellidoPaterno": "BELTRAN", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 14, "TUTORÍA": 15, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 13, "nombres": "JAVIER", "comportamiento": "13", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "COLQUE", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 14, "nombres": "JOHNNY WALKER", "comportamiento": "12", "situacionFinal": "P", "apellidoMaterno": "CAHUI", "apellidoPaterno": "COPARI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 11, "TUTORÍA": 15, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 15, "nombres": "JUAN CARLOS", "comportamiento": "13", "situacionFinal": "P", "apellidoMaterno": "CRUZ", "apellidoPaterno": "CUTIPA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 16, "nombres": "JOSÉ ARTURO", "comportamiento": "13", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "CHAIÑA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 13, "TUTORÍA": 10, "MATEMÁTICA": 13, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 17, "nombres": "WILLSON RAYMUNDO", "comportamiento": "12", "situacionFinal": "R", "apellidoMaterno": "ARIAS", "apellidoPaterno": "CHAMBI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 16, "TUTORÍA": 17, "MATEMÁTICA": 16, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 17, "EDUCACIÓN PARA EL TRABAJO": 17, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 18}, "numero": 18, "nombres": "ALFREDO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "TAVERA", "apellidoPaterno": "ENRIQUEZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 14, "TUTORÍA": 15, "MATEMÁTICA": 15, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 19, "nombres": "CÉSAR AUGUSTO", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "BUSTINZA", "apellidoPaterno": "FLORES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 13, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 20, "nombres": "ELVER IHONY", "comportamiento": "11", "situacionFinal": "P", "apellidoMaterno": "TICONA", "apellidoPaterno": "FLORES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 11, "TUTORÍA": 10, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 21, "nombres": "MAGÉN LUIS", "comportamiento": "12", "situacionFinal": "R", "apellidoMaterno": "QUISPE", "apellidoPaterno": "GARCIA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": 13, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 22, "nombres": "WILBER RENÉ", "observaciones": "Nota 'EXO' en la 4ta columna", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "YUCRA", "apellidoPaterno": "GUERRA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 9, "TUTORÍA": 11, "MATEMÁTICA": 8, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 23, "nombres": "EDGAR RUBÉN", "comportamiento": "12", "situacionFinal": "R", "apellidoMaterno": "BELTRAN", "apellidoPaterno": "LOPE", "asignaturasDesaprobadas": 3}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 24, "nombres": "ABILIO", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "ALAVE", "apellidoPaterno": "MAMANI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 16, "TUTORÍA": 15, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 25, "nombres": "MARCO ANTONIO", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "CASTRO", "apellidoPaterno": "NEIRA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 12, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 17, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 26, "nombres": "PERCY CONCEPCIÓN", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "PORTUGAL", "apellidoPaterno": "PEREZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 16, "MATEMÁTICA": 15, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 27, "nombres": "SAMUEL GUIDO", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "QUISPE", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 14, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 28, "nombres": "LUIS ARTURO", "comportamiento": "09", "situacionFinal": "R", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "RAMOS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 17, "TUTORÍA": 13, "MATEMÁTICA": 15, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 18, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 29, "nombres": "JUAN TOMÁS", "observaciones": "CORREGIDO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "SOPLIN", "apellidoPaterno": "RIVERA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 11, "TUTORÍA": 15, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 30, "nombres": "ETLIO", "comportamiento": "14", "situacionFinal": "P", "apellidoMaterno": "OVIEDO", "apellidoPaterno": "ROJAS", "asignaturasDesaprobadas": 0}]}, "fechaprocesamiento": "2025-11-13T04:59:33.334Z", "fecha_normalizacion": null, "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-13 00:19:00.751-05
8865e7c4-64ea-43ca-b623-eebaf3ee0434	actafisica	f8b4d31e-ea4c-4873-971f-a2fc78a59cf7	ACTUALIZAR	{"folio": "4", "turno": "MAÑANA", "gradoId": "4238b5f2-31c1-438b-891e-6ff1c5752503", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "seccion": "A", "anioLectivoId": "5eabc565-4cde-4bff-b394-3d3e85bbe2a7", "tipoEvaluacion": "FINAL"}	{"id": "f8b4d31e-ea4c-4873-971f-a2fc78a59cf7", "tipo": "OCR_LIBRE", "folio": "4", "grado": {"id": "4238b5f2-31c1-438b-891e-6ff1c5752503", "orden": 4, "activo": true, "nombre": "Cuarto Grado", "numero": 4, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "4TO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "niveleducativo": {"id": "7c599f4e-cef0-4a37-9c79-220650409b35", "orden": 1, "activo": true, "codigo": "SECUNDARIA", "nombre": "Educacion Secundaria", "descripcion": "Nivel educativo de 1ro° a 5to° año", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251113050834", "seccion": "A", "grado_id": "4238b5f2-31c1-438b-891e-6ff1c5752503", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "5eabc565-4cde-4bff-b394-3d3e85bbe2a7", "anio": 1988, "activo": false, "fechafin": "1988-12-31T00:00:00.000Z", "fechainicio": "1988-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-13T05:08:34.196Z", "hasharchivo": null, "normalizada": false, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "5eabc565-4cde-4bff-b394-3d3e85bbe2a7", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": {"metadata": {"modelo_ia": "Gemini", "advertencias": [], "procesado_en": "2025-11-13T05:08:34.196Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 36, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 17, "TUTORÍA": null, "MATEMÁTICA": 20, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 16, "EDUCACIÓN PARA EL TRABAJO": 18, "FORMACIÓN CIUDADANA Y CÍVICA": 17, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 16, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 1, "nombres": "JESÚS", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 19, "INGLÉS": 15, "TUTORÍA": 16, "MATEMÁTICA": 18, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 16, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 17, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 2, "nombres": "DANTE", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "ALOSILLA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 18, "INGLÉS": 14, "TUTORÍA": 15, "MATEMÁTICA": 18, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 3, "nombres": "JOSÉ LUIS", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "COACALLA", "apellidoPaterno": "ANGLES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 14, "MATEMÁTICA": 15, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 17, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 4, "nombres": "JULIÁN", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "ARCATA", "apellidoPaterno": "AQUINO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 15, "TUTORÍA": 13, "MATEMÁTICA": 17, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 5, "nombres": "JESÚS YAMES", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "AYLLON", "apellidoPaterno": "ARAUJO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 19, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 17, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 18}, "numero": 6, "nombres": "ALEXIS", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "PEREZ", "apellidoPaterno": "ARIAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 15, "TUTORÍA": 14, "MATEMÁTICA": 16, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 7, "nombres": "MIGUEL GABINO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "ASCARRUNZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 14, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 8, "nombres": "MARCO ANTONIO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "PAREDES", "apellidoPaterno": "ATENCIO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 18, "INGLÉS": 16, "TUTORÍA": 15, "MATEMÁTICA": 19, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 17, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 19, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 9, "nombres": "JAVIER", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "VALENCIA", "apellidoPaterno": "AZA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 17, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 10, "nombres": "PEDRO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "PACHARI", "apellidoPaterno": "BARRREDA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 15, "TUTORÍA": 12, "MATEMÁTICA": 15, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 11, "nombres": "LUIS ABRAHAM", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "CANAZA", "apellidoPaterno": "BELTRAN", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 12, "TUTORÍA": 14, "MATEMÁTICA": 17, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 16, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 12, "nombres": "ANIBAL AMÉRICO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CASTAÑON", "apellidoPaterno": "BELTRAN", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 14, "TUTORÍA": 10, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 13, "nombres": "EDUARDO ARTURO", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "ROMERO", "apellidoPaterno": "CABALLERO", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 18, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 17, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 8, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 14, "nombres": "JAVIER", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "COLQUE", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 15, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 15, "nombres": "JOHNNY WALKER", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "CAHUI", "apellidoPaterno": "COPARI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 14, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 16, "nombres": "JOSÉ ARTURO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "CHAIÑA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 15, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 17, "nombres": "WILLSON RAYMUNDO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "ARIAS", "apellidoPaterno": "CHAMBI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 19, "INGLÉS": 15, "TUTORÍA": 16, "MATEMÁTICA": 19, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 16, "EDUCACIÓN PARA EL TRABAJO": 17, "FORMACIÓN CIUDADANA Y CÍVICA": 17, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 17, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 17, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 18, "nombres": "ALFREDO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "TAVERA", "apellidoPaterno": "ENRIQUEZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 18, "INGLÉS": 14, "TUTORÍA": 16, "MATEMÁTICA": 17, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 16, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 19, "nombres": "CÉSAR AUGUSTO", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "BUSTINZA", "apellidoPaterno": "FLORES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 20, "nombres": "ELVER IHONY", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "TICONA", "apellidoPaterno": "FLORES", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 15, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 21, "nombres": "MAGÉN LUIS", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "QUISPE", "apellidoPaterno": "GARCIA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": null, "TUTORÍA": 12, "MATEMÁTICA": 15, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 22, "nombres": "WILBER RENÉ", "observaciones": "EXO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "YUCRA", "apellidoPaterno": "GUERRA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 23, "nombres": "EDGAR RUBÉN", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "BELTRAN", "apellidoPaterno": "LOPE", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 19, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 15, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 24, "nombres": "ABILIO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "ALAVE", "apellidoPaterno": "MAMANI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 15, "TUTORÍA": 13, "MATEMÁTICA": 17, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 25, "nombres": "MARCO ANTONIO", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "CASTRO", "apellidoPaterno": "NEIRA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 18, "INGLÉS": 13, "TUTORÍA": 14, "MATEMÁTICA": 17, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 16, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 17, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 26, "nombres": "PERCY CONCEPCIÓN", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "PORTUGAL", "apellidoPaterno": "PEREZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 16, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 27, "nombres": "SAMUEL GUIDO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "QUISPE", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 13, "TUTORÍA": 11, "MATEMÁTICA": 14, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 8, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 28, "nombres": "JAVIER", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "MAQUERA", "apellidoPaterno": "QUISPE", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 11, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 8, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 29, "nombres": "LUIS ARTURO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "RAMOS", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 19, "INGLÉS": 16, "TUTORÍA": 17, "MATEMÁTICA": 19, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 16, "EDUCACIÓN PARA EL TRABAJO": 18, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 18, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 17}, "numero": 30, "nombres": "JUAN TOMÁS", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "SOPLIN", "apellidoPaterno": "RIVERA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 19, "INGLÉS": 14, "TUTORÍA": 15, "MATEMÁTICA": 15, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 31, "nombres": "ETLIO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "OVIEDO", "apellidoPaterno": "ROJAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 18, "INGLÉS": 13, "TUTORÍA": 14, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 17, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 32, "nombres": "PERCY GENARO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "RAMOS", "apellidoPaterno": "ROJAS", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 13, "TUTORÍA": 15, "MATEMÁTICA": 15, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 33, "nombres": "FEIFER", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "COPA", "apellidoPaterno": "RUELAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 34, "nombres": "LUIS EDGAR", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "SUCAPUCA", "apellidoPaterno": "SUCAPUCA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 18, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 15, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 35, "nombres": "JILVER JESÚS", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "NUÑEZ", "apellidoPaterno": "VILCA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 17, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 16, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 17, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 36, "nombres": "HENRY FRANKLIN", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "AGUILAR", "apellidoPaterno": "YANQUE", "asignaturasDesaprobadas": 0}]}, "fechaprocesamiento": "2025-11-13T05:08:34.196Z", "fecha_normalizacion": null, "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-13 00:19:12.938-05
8690a48b-d236-486f-94d2-9f0778e428b4	actafisica	ead07fea-4bdb-4b47-8ddd-1258f620793d	ACTUALIZAR	{"folio": "3", "turno": "MAÑANA", "gradoId": "5e355c2f-794b-43cd-919e-a6fcfb1f4769", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "seccion": "A", "anioLectivoId": "b42b090c-d11d-42b7-ae8b-8e4eee152d85", "tipoEvaluacion": "FINAL"}	{"id": "ead07fea-4bdb-4b47-8ddd-1258f620793d", "tipo": "OCR_LIBRE", "folio": "3", "grado": {"id": "5e355c2f-794b-43cd-919e-a6fcfb1f4769", "orden": 3, "activo": true, "nombre": "Tercer Grado", "numero": 3, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "3RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "niveleducativo": {"id": "7c599f4e-cef0-4a37-9c79-220650409b35", "orden": 1, "activo": true, "codigo": "SECUNDARIA", "nombre": "Educacion Secundaria", "descripcion": "Nivel educativo de 1ro° a 5to° año", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251113051105", "seccion": "A", "grado_id": "5e355c2f-794b-43cd-919e-a6fcfb1f4769", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "b42b090c-d11d-42b7-ae8b-8e4eee152d85", "anio": 1987, "activo": false, "fechafin": "1987-12-31T00:00:00.000Z", "fechainicio": "1987-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-13T05:11:05.660Z", "hasharchivo": null, "normalizada": false, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "b42b090c-d11d-42b7-ae8b-8e4eee152d85", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": {"metadata": {"modelo_ia": "Gemini", "advertencias": [], "procesado_en": "2025-11-13T05:11:05.660Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 30, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 11, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 1, "nombres": "EDGAR WALTER", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 12, "MATEMÁTICA": 13, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 2, "nombres": "BELCHER", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "CRUZ", "apellidoPaterno": "ASQUI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 14, "MATEMÁTICA": 14, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 3, "nombres": "CLAUDIO EUDIS", "comportamiento": "19", "situacionFinal": "P", "apellidoMaterno": "DIAZ", "apellidoPaterno": "BELLIDO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 10, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 4, "nombres": "OPTACIANO", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 5, "nombres": "EDGAR", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 6, "nombres": "MIJAIL IGOR", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 7, "nombres": "RUDY AURELIO", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "PEREZ", "apellidoPaterno": "FLORES", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 8, "nombres": "JESÚS", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "PALOMINO", "apellidoPaterno": "FUENTES", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 13, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 9, "nombres": "ALFONSO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 13, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 10, "nombres": "ADOLFO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 13, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 11, "nombres": "OSCAR RUBÉN", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 12, "nombres": "DAVID", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 14, "MATEMÁTICA": 12, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 13, "nombres": "FABIO DAVID", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "SALAS", "apellidoPaterno": "IGLESIAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 10, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 9, "EDUCACIÓN RELIGIOSA": 8, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 9}, "numero": 14, "nombres": "RONALD CARLOS", "comportamiento": "17", "situacionFinal": "R", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "LLANQUE", "asignaturasDesaprobadas": 8}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 14, "TUTORÍA": 17, "MATEMÁTICA": 14, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 15, "nombres": "JORGE", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "RAMOS", "apellidoPaterno": "MAQUERA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 16, "nombres": "RUBÉN", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "NENA", "apellidoPaterno": "MENDOZA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 15, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 17, "nombres": "HERMES DOUGLAS", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "AQUINO", "apellidoPaterno": "MIRAVAL", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 18, "nombres": "FACTOR VÍCTOR", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "PONCE", "apellidoPaterno": "NINA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 10, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 19, "nombres": "JAVIER", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "TARQUI", "apellidoPaterno": "PERCCA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 15, "TUTORÍA": 15, "MATEMÁTICA": 14, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 20, "nombres": "ROMEL", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "QUISPE", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 21, "nombres": "GERBAULT", "comportamiento": "19", "situacionFinal": "P", "apellidoMaterno": "CONDORI", "apellidoPaterno": "RAMOS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 22, "nombres": "JOSÉ LUIS", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "ATENCIO", "apellidoPaterno": "RONQUILLO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 16, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 23, "nombres": "GLOBER", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "ORTEGAL", "apellidoPaterno": "SOTO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 10, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 24, "nombres": "JAIME", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "VARGAS", "apellidoPaterno": "TIPULA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 13, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 25, "nombres": "CÉSAR LUCIO", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "VALDIVIA", "apellidoPaterno": "TOVAR", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 13, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 26, "nombres": "WILLIAM EFRAÍN", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "TITO", "apellidoPaterno": "VALERO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 14, "TUTORÍA": 16, "MATEMÁTICA": 16, "COMUNICACIÓN": 17, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 16, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 18}, "numero": 27, "nombres": "JUAN WASHINGTON", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "VARGAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 13, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 28, "nombres": "RONMEL ISAAC", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "CHARAJA", "apellidoPaterno": "VARGAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 16, "MATEMÁTICA": 12, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 29, "nombres": "FÉLIX", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "COILA", "apellidoPaterno": "YANQUI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 14, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 30, "nombres": "JULIAN EDGAR", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "CHOQUE", "apellidoPaterno": "ZAPANA", "asignaturasDesaprobadas": 0}]}, "fechaprocesamiento": "2025-11-13T05:11:05.660Z", "fecha_normalizacion": null, "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-13 00:20:09.832-05
4e6c939b-0a15-4e0a-b3f5-60b17336decf	actafisica	fee8187e-e941-4c4f-bc25-21a795f3e3da	ACTUALIZAR	{"folio": "2", "turno": "MAÑANA", "gradoId": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "seccion": "A", "anioLectivoId": "74a5ab00-d6b1-4b7b-9b57-d026e194ae07", "tipoEvaluacion": "FINAL"}	{"id": "fee8187e-e941-4c4f-bc25-21a795f3e3da", "tipo": "OCR_LIBRE", "folio": "2", "grado": {"id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "orden": 2, "activo": true, "nombre": "Segundo Grado", "numero": 2, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "2DO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "niveleducativo": {"id": "7c599f4e-cef0-4a37-9c79-220650409b35", "orden": 1, "activo": true, "codigo": "SECUNDARIA", "nombre": "Educacion Secundaria", "descripcion": "Nivel educativo de 1ro° a 5to° año", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251113051618", "seccion": "A", "grado_id": "f8148f80-3bed-4f19-9a3b-fca1d4af32c5", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "74a5ab00-d6b1-4b7b-9b57-d026e194ae07", "anio": 1986, "activo": false, "fechafin": "1986-12-31T00:00:00.000Z", "fechainicio": "1986-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-13T05:16:18.426Z", "hasharchivo": null, "normalizada": false, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "74a5ab00-d6b1-4b7b-9b57-d026e194ae07", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": {"metadata": {"modelo_ia": "Gemini", "advertencias": [], "procesado_en": "2025-11-13T05:16:18.426Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 30, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "tipo": "G", "notas": {"ARTE": 10, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 14, "FORMACIÓN CIUDADANA Y CÍVICA": 6, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 1, "nombres": "EDGAR WALTER", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR", "asignaturasDesaprobadas": 3}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 2, "nombres": "BELCHER", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "CRUZ", "apellidoPaterno": "ASQUI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 8, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 3, "nombres": "OPTACIANO", "comportamiento": "14", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO", "asignaturasDesaprobadas": 3}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 13, "TUTORÍA": 11, "MATEMÁTICA": 9, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 4, "nombres": "EDGAR", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 5, "nombres": "RUFFO HÉCTOR", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "FLORES", "apellidoPaterno": "CALLO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 6, "nombres": "MIJAIL YGOR", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 10, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 7, "nombres": "JESÚS", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "PALOMINO", "apellidoPaterno": "FUENTES", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 10, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 9, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 8, "nombres": "JUAN ANTONIO", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "DEL PINO", "apellidoPaterno": "GUTIERREZ", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 9, "nombres": "ALFONSO", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 10, "nombres": "ADOLFO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 11, "nombres": "OSCAR RUBÉN", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 12, "nombres": "DAVID", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 13, "nombres": "FABIO DAVID", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "SALAS", "apellidoPaterno": "IGLESIAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 10, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 14, "nombres": "JOSÉ LUIS", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "RIVAS", "apellidoPaterno": "LLANOS", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 9, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 15, "nombres": "RONALD CARLOS", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "LLANQUE", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 15, "TUTORÍA": 14, "MATEMÁTICA": 13, "COMUNICACIÓN": 15, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 16, "nombres": "JORGE", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "RAMOS", "apellidoPaterno": "MAQUERA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 8, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 8, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 7, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 9, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 17, "nombres": "DAVID", "comportamiento": "15", "situacionFinal": "R", "apellidoMaterno": "ZAPANA", "apellidoPaterno": "MAYTA", "asignaturasDesaprobadas": 4}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 18, "nombres": "MARIO", "observaciones": "Retirado por motivos familiares 29.09.86", "comportamiento": "None", "situacionFinal": "R", "apellidoMaterno": "MACHACA", "apellidoPaterno": "MENDIZABAL", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 8, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 19, "nombres": "RUBEN", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "NENA", "apellidoPaterno": "MENDOZA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 12, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 20, "nombres": "HERMES DOUGLAS", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "AQUINO", "apellidoPaterno": "MIRAVAL", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 21, "nombres": "FACTOR VICTOR", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "PONCE", "apellidoPaterno": "NINA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 22, "nombres": "JOSÉ LUIS", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "ATENCIO", "apellidoPaterno": "RONQUILLO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 23, "nombres": "GLOBER", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "ORTEGAL", "apellidoPaterno": "SOTO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 13, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 24, "nombres": "JAIME", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "VARGAS", "apellidoPaterno": "TIPULA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 14, "TUTORÍA": 14, "MATEMÁTICA": 10, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 25, "nombres": "CÉSAR LUCIO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "VALDIVIA", "apellidoPaterno": "TOVAR", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 26, "nombres": "WILLIAM EFRAÍN", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "TITO", "apellidoPaterno": "VALERO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 15, "TUTORÍA": 13, "MATEMÁTICA": 14, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 18, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 16, "FORMACIÓN CIUDADANA Y CÍVICA": 15, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 27, "nombres": "JUAN WASHINGTON", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "VARGAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 14, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 14, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 28, "nombres": "RONMEL ISAAC", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CHARAJA", "apellidoPaterno": "VARGAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 13, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 12, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 15, "FORMACIÓN CIUDADANA Y CÍVICA": 16, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 29, "nombres": "JUSTO GERMÁN", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CONTRERAS", "apellidoPaterno": "VERASTEGUI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 9, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 30, "nombres": "JULIÁN EDGAR", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "CHOQUE", "apellidoPaterno": "ZAPANA", "asignaturasDesaprobadas": 2}]}, "fechaprocesamiento": "2025-11-13T05:16:18.426Z", "fecha_normalizacion": null, "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-13 00:20:35.786-05
a374bc5f-4837-4ab8-bcd1-333760dd88d5	actafisica	63eb1a53-1f45-429a-bf21-964fb465f24b	ACTUALIZAR	{"folio": "2", "turno": "MAÑANA", "gradoId": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libroId": "6522aa18-0437-48b6-b351-46c39be2b408", "seccion": "A", "anioLectivoId": "4800a722-34ad-4686-97bf-0b5cb443b078", "tipoEvaluacion": "FINAL"}	{"id": "63eb1a53-1f45-429a-bf21-964fb465f24b", "tipo": "OCR_LIBRE", "folio": "2", "grado": {"id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "orden": 1, "activo": true, "nombre": "Primer Grado", "numero": 1, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "nombrecorto": "1RO", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "niveleducativo": {"id": "7c599f4e-cef0-4a37-9c79-220650409b35", "orden": 1, "activo": true, "codigo": "SECUNDARIA", "nombre": "Educacion Secundaria", "descripcion": "Nivel educativo de 1ro° a 5to° año", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}}, "libro": {"id": "6522aa18-0437-48b6-b351-46c39be2b408", "activo": true, "codigo": "1", "estado": "ACTIVO", "nombre": "Libro de actas", "estante": "", "anio_fin": 1990, "nivel_id": "7c599f4e-cef0-4a37-9c79-220650409b35", "folio_fin": 500, "tipo_acta": "EVALUACION", "anio_inicio": 1985, "descripcion": "Libro de actas 1985-1990", "folio_inicio": 1, "total_folios": 500, "observaciones": "Libro en buen estado, legible", "fecha_creacion": "2025-11-10T01:15:57.134Z", "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32", "seccion_archivo": "HISTORICOS", "ubicacion_fisica": "Archivo Central - Estante A - Caja 1", "folios_utilizados": 0}, "turno": "MAÑANA", "estado": "PROCESADO_OCR", "numero": "OCR-LIBRE-20251113051848", "seccion": "A", "grado_id": "b267eca3-a39b-4a26-a73f-da759d3247d2", "libro_id": "6522aa18-0437-48b6-b351-46c39be2b408", "urlarchivo": null, "aniolectivo": {"id": "4800a722-34ad-4686-97bf-0b5cb443b078", "anio": 1985, "activo": false, "fechafin": "1985-12-31T00:00:00.000Z", "fechainicio": "1985-03-01T00:00:00.000Z", "observaciones": null, "institucion_id": "51e3415d-775e-436b-bfe0-3a21eee4de32"}, "calidad_ocr": null, "fechasubida": "2025-11-13T05:18:48.535Z", "hasharchivo": null, "normalizada": false, "confianza_ia": null, "fechaemision": null, "solicitud_id": null, "nombrearchivo": null, "observaciones": null, "aniolectivo_id": "4800a722-34ad-4686-97bf-0b5cb443b078", "procesadoconia": true, "tipoevaluacion": "FINAL", "tamanoarchivo_kb": null, "usuariosubida_id": "57a1a83f-5242-4d95-ad55-82dc6655b45c", "urlexcelexportado": null, "datosextraidosjson": {"metadata": {"modelo_ia": "Gemini", "advertencias": [], "procesado_en": "2025-11-13T05:18:48.535Z", "areas_detectadas": ["MATEMÁTICA", "COMUNICACIÓN", "INGLÉS", "ARTE", "HISTORIA, GEOGRAFÍA Y ECONOMÍA", "FORMACIÓN CIUDADANA Y CÍVICA", "PERSONA, FAMILIA Y RELACIONES HUMANAS", "EDUCACIÓN FÍSICA", "EDUCACIÓN RELIGIOSA", "CIENCIA, TECNOLOGÍA Y AMBIENTE", "EDUCACIÓN PARA EL TRABAJO", "TUTORÍA"], "total_estudiantes": 32, "confianza_promedio": 95}, "estudiantes": [{"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 14, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 1, "nombres": "EDGAR WALTER", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "BARRIENTOS", "apellidoPaterno": "AGUILAR", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 2, "nombres": "DOMINGO DAVID", "observaciones": "Retir. por 30% Inasist. Injust. 04-07-85", "comportamiento": "None", "situacionFinal": "R", "apellidoMaterno": "PARISACA", "apellidoPaterno": "APAZA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 15, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 3, "nombres": "BELCHER", "observaciones": "Rectif de Nombre Napoleon", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "CRUZ", "apellidoPaterno": "ASQUI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 13, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 4, "nombres": "OPTACIANO", "comportamiento": "17", "situacionFinal": "A", "apellidoMaterno": "RIQUELME", "apellidoPaterno": "BUSTINCIO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 5, "nombres": "FELIPE JESÚS", "comportamiento": "16", "situacionFinal": "R", "apellidoMaterno": "MAMANI", "apellidoPaterno": "CAHUI", "asignaturasDesaprobadas": 4}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 9, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 6, "nombres": "EDGAR", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "MAYTA", "apellidoPaterno": "CALLAPANI", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 7, "nombres": "RUFFO HÉCTOR", "comportamiento": "18", "situacionFinal": "A", "apellidoMaterno": "FLORES", "apellidoPaterno": "CALLO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 8, "nombres": "AGUSTÍN RENEÉ", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "QUISPE", "apellidoPaterno": "CUNO", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 11, "INGLÉS": 11, "TUTORÍA": 9, "MATEMÁTICA": 8, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 9, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 10, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 9, "nombres": "HUGO ALEJANDRO", "comportamiento": "15", "situacionFinal": "R", "apellidoMaterno": "CHAYÑA", "apellidoPaterno": "CHAYÑA", "asignaturasDesaprobadas": 6}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 10, "nombres": "VÍCTOR RAÚL", "observaciones": "Retir. por 30% Inasist. Injust. 30-10-85", "comportamiento": "None", "situacionFinal": "R", "apellidoMaterno": "SERRANO", "apellidoPaterno": "CHOQUECOTA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 14, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 11, "nombres": "MIJAIL YGOR", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "LOZA", "apellidoPaterno": "ESPINOZA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 12, "nombres": "JUAN ANTONIO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "DEL PINO", "apellidoPaterno": "GUTIERREZ", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 13, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 13, "nombres": "ALFONSO", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "POMA", "apellidoPaterno": "GUTIERREZ", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 14, "nombres": "ADOLFO", "comportamiento": "19", "situacionFinal": "P", "apellidoMaterno": "YUNGAS", "apellidoPaterno": "HILASACA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 14, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 15, "nombres": "OSCAR RUBÉN", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "HUACANI", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 12, "MATEMÁTICA": 13, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 16, "nombres": "DAVID", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "MAMANI", "apellidoPaterno": "IBEROS", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 11, "TUTORÍA": 9, "MATEMÁTICA": 10, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 10, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 17, "nombres": "JAIME CONSTANTINO", "comportamiento": "16", "situacionFinal": "R", "apellidoMaterno": "CORNEJO", "apellidoPaterno": "LUCANA", "asignaturasDesaprobadas": 6}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 12, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 13, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 14, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 18, "nombres": "JOSÉ LUIS", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "RIVAS", "apellidoPaterno": "LLANOS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 13, "TUTORÍA": 13, "MATEMÁTICA": 11, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 13, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 19, "nombres": "JORGE", "comportamiento": "17", "situacionFinal": "P", "apellidoMaterno": "RAMOS", "apellidoPaterno": "MAQUERA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 20, "nombres": "MARIO", "comportamiento": "15", "situacionFinal": "A", "apellidoMaterno": "MACHACA", "apellidoPaterno": "MENDIZABAL", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 11, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 21, "nombres": "RUBÉN", "comportamiento": "15", "situacionFinal": "A", "apellidoMaterno": "NENA", "apellidoPaterno": "MENDOZA", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 11, "TUTORÍA": 12, "MATEMÁTICA": 10, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 16, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 22, "nombres": "HERMES DOUGLAS", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "AQUINO", "apellidoPaterno": "MIRAVAL", "asignaturasDesaprobadas": 3}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 10, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 10, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 13}, "numero": 23, "nombres": "LIBORIO TEÓFILO", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "CARRASCO", "apellidoPaterno": "PACHAPUMA", "asignaturasDesaprobadas": 3}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 12, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 24, "nombres": "JOSÉ LUIS", "comportamiento": "15", "situacionFinal": "P", "apellidoMaterno": "ATENCIO", "apellidoPaterno": "RONQUILLO", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 12, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 12, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 25, "nombres": "JAIME", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "VARGAS", "apellidoPaterno": "TIPULA", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 10, "EDUCACIÓN FÍSICA": 17, "EDUCACIÓN RELIGIOSA": 12, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 14}, "numero": 26, "nombres": "WILLIAM EFRAÍN", "comportamiento": "15", "situacionFinal": "A", "apellidoMaterno": "TITO", "apellidoPaterno": "VALERO", "asignaturasDesaprobadas": 2}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 15, "INGLÉS": 14, "TUTORÍA": 13, "MATEMÁTICA": 15, "COMUNICACIÓN": 14, "EDUCACIÓN FÍSICA": 18, "EDUCACIÓN RELIGIOSA": 15, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 15, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 15, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 16}, "numero": 27, "nombres": "JUAN WASHINGTON", "comportamiento": "19", "situacionFinal": "P", "apellidoMaterno": "CASTILLO", "apellidoPaterno": "VARGAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 16, "INGLÉS": 12, "TUTORÍA": 12, "MATEMÁTICA": 11, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 14, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 12, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 15}, "numero": 28, "nombres": "RONMEL ISAAC", "comportamiento": "18", "situacionFinal": "P", "apellidoMaterno": "CHARAJA", "apellidoPaterno": "VARGAS", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 10, "INGLÉS": 11, "TUTORÍA": 10, "MATEMÁTICA": 10, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 14, "EDUCACIÓN RELIGIOSA": 9, "EDUCACIÓN PARA EL TRABAJO": 9, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 10, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 29, "nombres": "JUAN", "observaciones": "Transf. a... Carlos... 0.11.86", "comportamiento": "17", "situacionFinal": "R", "apellidoMaterno": "APAZA", "apellidoPaterno": "VILCA", "asignaturasDesaprobadas": 7}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 14, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 13, "EDUCACIÓN FÍSICA": 13, "EDUCACIÓN RELIGIOSA": 16, "EDUCACIÓN PARA EL TRABAJO": 12, "FORMACIÓN CIUDADANA Y CÍVICA": 11, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 11, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 11, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 11}, "numero": 30, "nombres": "RONALD AGUSTIN", "observaciones": "Carlos Humberto O.M. 86", "comportamiento": "16", "situacionFinal": "P", "apellidoMaterno": "RODRIGUEZ", "apellidoPaterno": "YANQUI", "asignaturasDesaprobadas": 0}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": 13, "INGLÉS": 12, "TUTORÍA": 11, "MATEMÁTICA": 12, "COMUNICACIÓN": 11, "EDUCACIÓN FÍSICA": 15, "EDUCACIÓN RELIGIOSA": 11, "EDUCACIÓN PARA EL TRABAJO": 11, "FORMACIÓN CIUDADANA Y CÍVICA": 10, "CIENCIA, TECNOLOGÍA Y AMBIENTE": 12, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": 13, "PERSONA, FAMILIA Y RELACIONES HUMANAS": 12}, "numero": 31, "nombres": "JULIAN EDGAR", "comportamiento": "16", "situacionFinal": "A", "apellidoMaterno": "CHOQUE", "apellidoPaterno": "ZAPANA", "asignaturasDesaprobadas": 1}, {"sexo": "M", "tipo": "G", "notas": {"ARTE": null, "INGLÉS": null, "TUTORÍA": null, "MATEMÁTICA": null, "COMUNICACIÓN": null, "EDUCACIÓN FÍSICA": null, "EDUCACIÓN RELIGIOSA": null, "EDUCACIÓN PARA EL TRABAJO": null, "FORMACIÓN CIUDADANA Y CÍVICA": null, "CIENCIA, TECNOLOGÍA Y AMBIENTE": null, "HISTORIA, GEOGRAFÍA Y ECONOMÍA": null, "PERSONA, FAMILIA Y RELACIONES HUMANAS": null}, "numero": 32, "nombres": "ADOLFO", "observaciones": "Retir. por 30% Inasist. Injust. 04-07-85", "comportamiento": "None", "situacionFinal": "R", "apellidoMaterno": "PEREZ", "apellidoPaterno": "ZARATE", "asignaturasDesaprobadas": 0}]}, "fechaprocesamiento": "2025-11-13T05:18:48.535Z", "fecha_normalizacion": null, "fechaexportacionexcel": null}	57a1a83f-5242-4d95-ad55-82dc6655b45c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-13 00:20:49.816-05
\.


--
-- Data for Name: certificado; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.certificado (id, institucion_id, codigovirtual, numero, estudiante_id, fechaemision, horaemision, lugaremision, gradoscompletados, situacionfinal, promediogeneral, urlpdf, hashpdf, urlqr, observacionretiros, observaciontraslados, observacionsiagie, observacionpruebasubicacion, observacionconvalidacion, observacionotros, ordenmerito, estado, version, esrectificacion, certificadoanterior_id, motivorectificacion, usuarioemision_id, fechacreacion, usuarioanulacion_id, fechaanulacion, motivoanulacion) FROM stdin;
acdd45ff-c552-4a34-99de-65eeccc1dcef	51e3415d-775e-436b-bfe0-3a21eee4de32	RHC8960	\N	031727da-7c3a-4194-a1fe-8fae0c9dc3f4	2025-11-13	01:17:17.668	PUNO	{2}	DESAPROBADO	11.90	\N	\N	\N	\N	\N	\N	\N	\N	Certificado generado automáticamente desde actas normalizadas	\N	BORRADOR	1	f	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-12 20:17:17.685-05	\N	\N	\N
6b8c35a3-457e-4025-a1e4-2d7e28a81205	51e3415d-775e-436b-bfe0-3a21eee4de32	BUU0875	\N	031727da-7c3a-4194-a1fe-8fae0c9dc3f4	2025-11-13	01:18:01.142	PUNO	{2}	DESAPROBADO	11.90	/storage/certificados/2025/CERT_6b8c35a3_1762996681522.pdf	02f16d402e7ed5c72c0b7fb6b8cccaf0b9560b1a36a46515de766d4cae7bffa5	/storage/qr/BUU0875.png	\N	\N	\N	\N	\N	Certificado de prueba generado automáticamente	\N	EMITIDO	1	f	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-12 20:18:01.144-05	\N	\N	\N
\.


--
-- Data for Name: certificadodetalle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.certificadodetalle (id, certificado_id, aniolectivo_id, grado_id, situacionfinal, observaciones, orden) FROM stdin;
dd4f32ea-26f0-4481-95a5-02ac22d48241	acdd45ff-c552-4a34-99de-65eeccc1dcef	f2ddff9d-85a7-4433-9e55-0c69d6bbf924	f8148f80-3bed-4f19-9a3b-fca1d4af32c5	A	\N	1
71b1af3c-7ffb-4d50-8868-87251e2478eb	6b8c35a3-457e-4025-a1e4-2d7e28a81205	f2ddff9d-85a7-4433-9e55-0c69d6bbf924	f8148f80-3bed-4f19-9a3b-fca1d4af32c5	A	\N	1
\.


--
-- Data for Name: certificadonota; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.certificadonota (id, certificadodetalle_id, area_id, nota, notaliteral, esexonerado, orden) FROM stdin;
5c6a5479-6d67-4b1f-bd17-4f480324b7bf	dd4f32ea-26f0-4481-95a5-02ac22d48241	c978abd4-9ae6-45dc-8c52-671c5b7151a2	12	\N	f	1
6e81a33b-7a18-46d4-8461-ca632767842f	dd4f32ea-26f0-4481-95a5-02ac22d48241	6b157324-935b-4188-9c16-e39d911bcbe5	13	\N	f	2
d9b5c097-d8a9-4f37-a795-58f142da2530	dd4f32ea-26f0-4481-95a5-02ac22d48241	d1ebfe0e-3f47-44a9-a36c-7d0ad2f737be	11	\N	f	3
27e6b045-0a57-4062-a6f6-29563d0fc115	dd4f32ea-26f0-4481-95a5-02ac22d48241	024dc30a-3b11-4cb6-8d38-ea3b709103c5	12	\N	f	4
a0004349-30c5-4ce9-94ce-eb9d5a12d6f1	dd4f32ea-26f0-4481-95a5-02ac22d48241	f4650e7a-2c25-45ce-8d57-172e5c60c821	12	\N	f	5
57edfd1c-4629-456b-81cb-d0757d7fc2b6	dd4f32ea-26f0-4481-95a5-02ac22d48241	e5efbb75-2c3e-47ec-b22b-1cd6ae64c3ca	10	\N	f	6
da97a6e6-b88b-4f08-9c9e-6d9c6df9000a	dd4f32ea-26f0-4481-95a5-02ac22d48241	63ff6462-36de-4e4f-bc71-0d0cf40ea3b0	12	\N	f	7
4399d2e1-3206-4a10-af72-3310afdb11ba	dd4f32ea-26f0-4481-95a5-02ac22d48241	b018b101-c930-415a-a180-b86bc14f3931	11	\N	f	8
46237c65-34aa-4122-bc3a-42cfa19a7465	dd4f32ea-26f0-4481-95a5-02ac22d48241	a771170e-ee4e-4a98-acc9-8f0149fc95f8	15	\N	f	9
d80301a4-535e-4069-b257-db8e5557d118	dd4f32ea-26f0-4481-95a5-02ac22d48241	b8481131-2790-4afc-a611-a6e9f0764f4d	11	\N	f	10
784ff1f8-d5fd-4f21-af3a-db1725f5995b	71b1af3c-7ffb-4d50-8868-87251e2478eb	c978abd4-9ae6-45dc-8c52-671c5b7151a2	12	\N	f	1
ee8c47d8-80c3-4147-8531-3749680c8be0	71b1af3c-7ffb-4d50-8868-87251e2478eb	6b157324-935b-4188-9c16-e39d911bcbe5	13	\N	f	2
39736301-8cd0-4f25-b60a-1508018007c6	71b1af3c-7ffb-4d50-8868-87251e2478eb	d1ebfe0e-3f47-44a9-a36c-7d0ad2f737be	11	\N	f	3
f69decc8-1945-4512-8151-10c834c56e77	71b1af3c-7ffb-4d50-8868-87251e2478eb	024dc30a-3b11-4cb6-8d38-ea3b709103c5	12	\N	f	4
9f8d8cca-6354-42af-aa0e-81941d3b7796	71b1af3c-7ffb-4d50-8868-87251e2478eb	f4650e7a-2c25-45ce-8d57-172e5c60c821	12	\N	f	5
a81de3f9-b9b3-4140-bb10-e781213ffc99	71b1af3c-7ffb-4d50-8868-87251e2478eb	e5efbb75-2c3e-47ec-b22b-1cd6ae64c3ca	10	\N	f	6
573fc35d-b124-47ec-955f-ad54a4bb334b	71b1af3c-7ffb-4d50-8868-87251e2478eb	63ff6462-36de-4e4f-bc71-0d0cf40ea3b0	12	\N	f	7
bf6abc43-be3c-48ca-a281-a58ddf4478aa	71b1af3c-7ffb-4d50-8868-87251e2478eb	b018b101-c930-415a-a180-b86bc14f3931	11	\N	f	8
8ab589fd-f55f-4577-a4b0-e6ac9ee91b5c	71b1af3c-7ffb-4d50-8868-87251e2478eb	a771170e-ee4e-4a98-acc9-8f0149fc95f8	15	\N	f	9
ba56c24f-af57-40db-a82a-e43110f526ae	71b1af3c-7ffb-4d50-8868-87251e2478eb	b8481131-2790-4afc-a611-a6e9f0764f4d	11	\N	f	10
\.


--
-- Data for Name: conciliacionbancaria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conciliacionbancaria (id, institucion_id, entidadbancaria, fechaconciliacion, fechainicio, fechafin, totalregistros, totalmonto, archivooriginal_url, archivonombre, estado, observaciones, usuario_id, fechacreacion) FROM stdin;
\.


--
-- Data for Name: conciliaciondetalle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conciliaciondetalle (id, conciliacion_id, pago_id, numerooperacion, fechatransaccion, monto, conciliado, diferencia, observaciones) FROM stdin;
\.


--
-- Data for Name: configuracioninstitucion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.configuracioninstitucion (id, codigomodular, nombre, ugel, distrito, provincia, departamento, direccion, telefono, email, logo_url, nombredirector, cargodirector, firma_url, textolegal, activo, fechaactualizacion) FROM stdin;
51e3415d-775e-436b-bfe0-3a21eee4de32	0000000	InstituciÃ³n Educativa Ejemplo	UGEL PUNO	Puno	\N	Puno	Av. EducaciÃ³n #123	(051) 123456	contacto@ie-ejemplo.edu.pe	\N	Director(a) del Sistema	Director	\N	El presente certificado es vÃ¡lido siempre que pueda ser verificado en nuestro sistema digital.	t	2025-11-01 22:40:59.113859-05
\.


--
-- Data for Name: curriculogrado; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.curriculogrado (id, area_id, grado_id, aniolectivo_id, orden, activo) FROM stdin;
\.


--
-- Data for Name: estudiante; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.estudiante (id, institucion_id, dni, apellidopaterno, apellidomaterno, nombres, fechanacimiento, lugarnacimiento, sexo, email, telefono, direccion, observaciones, estado, fecharegistro, fechaactualizacion) FROM stdin;
514e0b37-4d14-4f8f-b47e-ab99321fc3c9	51e3415d-775e-436b-bfe0-3a21eee4de32	67657567	fgfdg	Michael	Edard	2012-12-21	\N	M	\N	998909098	\N	\N	INACTIVO	2025-11-07 12:22:09.629-05	2025-11-11 09:11:12.215242-05
f999749f-0d61-43d0-9446-83bf57745ae2	51e3415d-775e-436b-bfe0-3a21eee4de32	77027939	URIARTE	ANCCOTA	EDWARD	2012-12-02	\N	M	rodrigoakameluriarte@gmail.com	997778787	\N	\N	INACTIVO	2025-11-10 22:26:08.421-05	2025-11-11 09:11:37.365438-05
db66c575-12cc-483c-9443-71dabb750e2d	51e3415d-775e-436b-bfe0-3a21eee4de32	99988999	OO	URIARTE ANCCOTA	EDWARD RODRIGO	2012-12-14	\N	M	\N	988777878	\N	\N	INACTIVO	2025-11-07 01:47:24.708-05	2025-11-11 09:16:34.210298-05
2551e254-de04-43d2-85f4-9db0f2967d0d	51e3415d-775e-436b-bfe0-3a21eee4de32	88878797	GGJGHJGHJ	URIARTE ANCCOTA	EDWARD RODRIGO	2012-12-20	\N	M	\N	989989989	\N	\N	INACTIVO	2025-11-07 01:38:48.486-05	2025-11-11 09:16:41.231732-05
0242c567-bea8-44e2-bb3f-87a5784a60a8	51e3415d-775e-436b-bfe0-3a21eee4de32	65565465	FVFG	Michael	Edard	2012-12-12	\N	M	\N	967876867	\N	\N	INACTIVO	2025-11-07 08:25:20.868-05	2025-11-11 14:56:46.901092-05
7ee515b9-4934-4a83-b2ee-a7dadde3d5fb	51e3415d-775e-436b-bfe0-3a21eee4de32	76766575	fgdfgd	Michael	fghddf	2012-12-12	\N	M	\N	987976979	\N	\N	INACTIVO	2025-11-07 09:38:15.765-05	2025-11-11 14:57:01.565754-05
3d54c7bf-2840-44c0-a19f-e9642427c331	51e3415d-775e-436b-bfe0-3a21eee4de32	54654655	FTYT	FTYRT	FGDF	2012-12-14	\N	M	\N	967858865	\N	\N	INACTIVO	2025-11-07 08:55:46.18-05	2025-11-11 14:57:05.46333-05
f0059948-7954-4ed8-bc16-d65664781e71	51e3415d-775e-436b-bfe0-3a21eee4de32	55474554	fdf	Michael	Edard	2012-12-06	\N	M	\N	976996956	\N	\N	INACTIVO	2025-11-07 08:47:28.812-05	2025-11-11 14:57:09.643013-05
89452da3-386f-43a2-894f-5c2677318857	51e3415d-775e-436b-bfe0-3a21eee4de32	67676767	GFHGFH	Michael	Edard	2012-12-26	\N	M	\N	996967969	\N	\N	INACTIVO	2025-11-07 08:35:31.009-05	2025-11-11 14:57:13.209835-05
a106f15f-9e22-4204-9a48-b33d63bc9961	51e3415d-775e-436b-bfe0-3a21eee4de32	77777787	UUUU	Michael	Edard	2012-12-14	\N	M	\N	987867886	\N	\N	INACTIVO	2025-11-07 07:42:36.78-05	2025-11-11 14:57:17.075142-05
5d37e7de-f975-4fc4-a6e3-491bc59900df	51e3415d-775e-436b-bfe0-3a21eee4de32	T2452001	BUSTINCIO	RIQUELME	OPTACIANO	2000-01-01	\N	M	\N	\N	\N	\N	ACTIVO	2025-11-12 13:57:04.522-05	2025-11-12 13:57:04.522-05
315d747b-9a38-46f1-8aa4-450463931ca3	51e3415d-775e-436b-bfe0-3a21eee4de32	T2455502	CAHUI	MAMANI	FELIPE JESÚS	2000-01-01	\N	M	\N	\N	\N	\N	ACTIVO	2025-11-12 13:57:04.558-05	2025-11-12 13:57:04.558-05
49a4b884-1bda-4388-96b3-8aab3493b751	51e3415d-775e-436b-bfe0-3a21eee4de32	T2457303	CALLAPANI	MAYTA	EDGAR	2000-01-01	\N	M	\N	\N	\N	\N	ACTIVO	2025-11-12 13:57:04.575-05	2025-11-12 13:57:04.575-05
f32821f2-0c7e-48db-8101-7bed5f3ac67c	51e3415d-775e-436b-bfe0-3a21eee4de32	T2458904	CALLO	FLORES	RUFFO HÉCTOR	2000-01-01	\N	M	\N	\N	\N	\N	ACTIVO	2025-11-12 13:57:04.591-05	2025-11-12 13:57:04.591-05
0e4da4c1-b090-4bc4-9900-bc96d7730edd	51e3415d-775e-436b-bfe0-3a21eee4de32	T2460905	CUNO	QUISPE	AGUSTÍN RENEÉ	2000-01-01	\N	M	\N	\N	\N	\N	ACTIVO	2025-11-12 13:57:04.611-05	2025-11-12 13:57:04.611-05
ef298081-9548-40ac-8495-6636aa23f313	51e3415d-775e-436b-bfe0-3a21eee4de32	T2463006	CHAYÑA	CHAYÑA	HUGO ALEJANDRO	2000-01-01	\N	M	\N	\N	\N	\N	ACTIVO	2025-11-12 13:57:04.632-05	2025-11-12 13:57:04.632-05
222939ac-3ced-4034-a38e-a15d8d5645a4	51e3415d-775e-436b-bfe0-3a21eee4de32	T2465007	CHOQUECOTA	SERRANO	VÍCTOR RAÚL	2000-01-01	\N	M	\N	\N	\N	\N	ACTIVO	2025-11-12 13:57:04.653-05	2025-11-12 13:57:04.653-05
8475559f-1b0b-429e-813b-ca9281279d8b	51e3415d-775e-436b-bfe0-3a21eee4de32	T2467108	ESPINOZA	LOZA	MIJAIL YGOR	2000-01-01	\N	M	\N	\N	\N	\N	ACTIVO	2025-11-12 13:57:04.673-05	2025-11-12 13:57:04.673-05
031727da-7c3a-4194-a1fe-8fae0c9dc3f4	51e3415d-775e-436b-bfe0-3a21eee4de32	T2468909	GUTIERREZ	DEL PINO	JUAN ANTONIO	2000-01-01	\N	M	\N	\N	\N	\N	ACTIVO	2025-11-12 13:57:04.692-05	2025-11-12 13:57:04.692-05
f46342bd-6b48-4347-acea-6c9a3b70cecb	51e3415d-775e-436b-bfe0-3a21eee4de32	T2470710	GUTIERREZ	POMA	ALFONSO	2000-01-01	\N	M	\N	\N	\N	\N	ACTIVO	2025-11-12 13:57:04.709-05	2025-11-12 13:57:04.709-05
e723e64c-6a88-42f0-ac63-ce137de282a1	51e3415d-775e-436b-bfe0-3a21eee4de32	T2472311	HILASACA	YUNGAS	ADOLFO	2000-01-01	\N	M	\N	\N	\N	\N	ACTIVO	2025-11-12 13:57:04.725-05	2025-11-12 13:57:04.725-05
f7c4adfd-5e24-4961-bace-0c1bcf4205a6	51e3415d-775e-436b-bfe0-3a21eee4de32	T2473812	HUACANI	MAMANI	OSCAR RUBÉN	2000-01-01	\N	M	\N	\N	\N	\N	ACTIVO	2025-11-12 13:57:04.74-05	2025-11-12 13:57:04.74-05
26cde2c5-288c-4e6c-a92f-15975cb187d0	51e3415d-775e-436b-bfe0-3a21eee4de32	T2475213	IBEROS	MAMANI	DAVID	2000-01-01	\N	M	\N	\N	\N	\N	ACTIVO	2025-11-12 13:57:04.754-05	2025-11-12 13:57:04.754-05
cf1482ae-5adb-48fc-b8a1-0e30e2b021f7	51e3415d-775e-436b-bfe0-3a21eee4de32	12476614	LUCANA	CORNEJO	JAIME CONSTANTINO	2000-01-01	Puno, Puno, Provincia de puno	M	rodrigoakameluriarte@gmail.com	974842500	JR. ACORA 265	.	ACTIVO	2025-11-12 13:57:04.768-05	2025-11-12 19:43:30.47906-05
7c0d8625-1795-456a-9d4a-4c99916ba11c	51e3415d-775e-436b-bfe0-3a21eee4de32	77058024	Garcia	Rodriguz	Juan Ramon	1994-02-02	Puno, Puno, Provincia de puno	M	\N	\N	\N	\N	ACTIVO	2025-11-12 19:46:10.874-05	2025-11-12 19:46:10.874-05
\.


--
-- Data for Name: grado; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grado (id, institucion_id, nivel_id, numero, nombre, nombrecorto, orden, activo) FROM stdin;
b267eca3-a39b-4a26-a73f-da759d3247d2	51e3415d-775e-436b-bfe0-3a21eee4de32	7c599f4e-cef0-4a37-9c79-220650409b35	1	Primer Grado	1RO	1	t
5e355c2f-794b-43cd-919e-a6fcfb1f4769	51e3415d-775e-436b-bfe0-3a21eee4de32	7c599f4e-cef0-4a37-9c79-220650409b35	3	Tercer Grado	3RO	3	t
f8148f80-3bed-4f19-9a3b-fca1d4af32c5	51e3415d-775e-436b-bfe0-3a21eee4de32	7c599f4e-cef0-4a37-9c79-220650409b35	2	Segundo Grado	2DO	2	t
c2b3d6ff-c0ce-4932-ac72-5a3f8a48d7d1	51e3415d-775e-436b-bfe0-3a21eee4de32	7c599f4e-cef0-4a37-9c79-220650409b35	5	Quinto Grado	5TO	5	t
4238b5f2-31c1-438b-891e-6ff1c5752503	51e3415d-775e-436b-bfe0-3a21eee4de32	7c599f4e-cef0-4a37-9c79-220650409b35	4	Cuarto Grado	4TO	4	t
\.


--
-- Data for Name: institucionusuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.institucionusuario (id, institucion_id, usuario_id, esadministrador, activo, fechaasignacion, usuarioasigno_id) FROM stdin;
0ba7fa3d-6435-4d5c-b4f4-e0dc584481b6	51e3415d-775e-436b-bfe0-3a21eee4de32	4bf22bde-7860-43a9-a20e-91a839a15414	t	t	2025-11-01 22:40:59.221267-05	\N
dc0e07e9-2fca-4fd0-bba2-728b3bd83ac0	51e3415d-775e-436b-bfe0-3a21eee4de32	57a1a83f-5242-4d95-ad55-82dc6655b45c	f	t	2025-11-07 04:57:45.811243-05	\N
\.


--
-- Data for Name: libro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.libro (id, institucion_id, codigo, descripcion, ubicacion_fisica, anio_inicio, anio_fin, total_folios, estado, observaciones, fecha_creacion, activo, nivel_id, nombre, tipo_acta, folio_inicio, folio_fin, folios_utilizados, estante, seccion_archivo) FROM stdin;
6522aa18-0437-48b6-b351-46c39be2b408	51e3415d-775e-436b-bfe0-3a21eee4de32	1	Libro de actas 1985-1990	Archivo Central - Estante A - Caja 1	1985	1990	500	ACTIVO	Libro en buen estado, legible	2025-11-09 20:15:57.134-05	t	7c599f4e-cef0-4a37-9c79-220650409b35	Libro de actas	EVALUACION	1	500	0		HISTORICOS
079f521b-beba-43fb-be8b-9efbc6684752	51e3415d-775e-436b-bfe0-3a21eee4de32	Libro - 003	Este libro se encuentra en buen estadi	estaante 4	1990	1995	387	ACTIVO		2025-11-12 19:50:38.162-05	f	7c599f4e-cef0-4a37-9c79-220650409b35	3er libro de actas	\N	1	400	0		HISTORICOS
2b722ffc-1c7d-4c56-b103-affbca252b7e	51e3415d-775e-436b-bfe0-3a21eee4de32	3	Libro de actas 1996-2000	Archivo Central - Estante B - Caja 1	1996	2000	520	ACTIVO	\N	2025-11-09 20:15:57.153-05	f	\N	\N	\N	1	\N	0	\N	\N
cd21550c-b652-4be8-a820-83ff6680c6cf	51e3415d-775e-436b-bfe0-3a21eee4de32	2	Libro de actas 1991-1995	Archivo Central - Estante A - Caja 2.	1991	1995	480	ACTIVO		2025-11-09 20:15:57.15-05	t	7c599f4e-cef0-4a37-9c79-220650409b35	Educacion Secundaria	\N	1	496	0		HISTORICOS
\.


--
-- Data for Name: metodopago; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metodopago (id, institucion_id, codigo, nombre, tipo, descripcion, requierevalidacion, comisionporcentaje, comisionfija, activo, configuracion) FROM stdin;
c0f8786b-ce27-44ce-a9f1-1ce8a62689e9	51e3415d-775e-436b-bfe0-3a21eee4de32	EFECTIVO	Efectivo	MANUAL	\N	t	\N	\N	t	\N
cd5eaec0-7f8d-41ef-8f0b-fbf6d6929ccc	51e3415d-775e-436b-bfe0-3a21eee4de32	YAPE	Yape	MANUAL	\N	t	\N	\N	t	\N
637b0cf1-7b51-46e5-a26d-ba7b60756d8a	51e3415d-775e-436b-bfe0-3a21eee4de32	PLIN	Plin	MANUAL	\N	t	\N	\N	t	\N
bfb04cbf-6243-41d7-9e73-870054c2212c	51e3415d-775e-436b-bfe0-3a21eee4de32	TRANSFERENCIA	Transferencia Bancaria	MANUAL	\N	t	\N	\N	t	\N
\.


--
-- Data for Name: niveleducativo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.niveleducativo (id, institucion_id, codigo, nombre, descripcion, orden, activo) FROM stdin;
7c599f4e-cef0-4a37-9c79-220650409b35	51e3415d-775e-436b-bfe0-3a21eee4de32	SECUNDARIA	Educacion Secundaria	Nivel educativo de 1ro° a 5to° año	1	t
\.


--
-- Data for Name: notificacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notificacion (id, tipo, destinatario, asunto, mensaje, canal, solicitud_id, certificado_id, estado, intentos, fechaenvio, fechaleido, error, fechacreacion) FROM stdin;
c711b15d-a526-46bf-a10e-0f1bc4664803	SOLICITUD_RECIBIDA	mesadepartes@sigcerh.local	Nueva solicitud recibida	{"nombreEstudiante":"fgdfgd Michael, fghddf","codigoSeguimiento":"S-2025-000008","mensaje":"Nueva solicitud recibida: EXP-2025-000008"}	EMAIL	982e2774-101e-4650-9f48-4d35c26fc278	\N	PENDIENTE	0	\N	2025-11-07 09:49:28.422-05	\N	2025-11-07 09:38:15.949-05
223e8126-f550-4384-a067-c6f413bf3cba	ACTA_ENCONTRADA	967876867	Acta encontrada - Proceda con el pago	{"numeroExpediente":"EXP-2025-000004","estudianteNombre":"FVFG Michael Edard","monto":15,"ubicacionFisica":"estaante 4"}	EMAIL	8646423a-c656-4b12-ac2c-bf5220dd75c2	\N	FALLIDA	1	\N	\N	No recipients defined	2025-11-07 11:06:46.961-05
118854f3-a171-43c1-bad3-d04dad1b69dd	ACTA_ENCONTRADA	988777878	Acta encontrada - Proceda con el pago	{"numeroExpediente":"EXP-2025-000002","estudianteNombre":"OO URIARTE ANCCOTA EDWARD RODRIGO","monto":15,"ubicacionFisica":"estaante 4"}	EMAIL	a13d3682-c315-4a60-8373-41c5b896e91f	\N	FALLIDA	1	\N	\N	No recipients defined	2025-11-07 11:14:20.672-05
4e692891-b9d0-465c-ae16-4a184855db9d	ACTA_NO_ENCONTRADA	996967969	Acta no encontrada	{"numeroExpediente":"EXP-2025-000005","estudianteNombre":"GFHGFH Michael Edard","motivo":"no se ecnontro"}	EMAIL	bad399b0-2427-49f5-bc70-f996f5d59702	\N	FALLIDA	1	\N	\N	No recipients defined	2025-11-07 11:20:18.046-05
afa6bddc-1743-4276-8cc1-e217001eb3c4	ACTA_NO_ENCONTRADA	989989989	Acta no encontrada	{"numeroExpediente":"EXP-2025-000001","estudianteNombre":"GGJGHJGHJ URIARTE ANCCOTA EDWARD RODRIGO","motivo":"no se encontro"}	EMAIL	c8fb92c5-4227-447c-b5bb-778e6d2083d0	\N	FALLIDA	1	\N	\N	No recipients defined	2025-11-07 11:21:30.033-05
fac328fa-b68c-4abb-8063-df1758acdb06	ACTA_ENCONTRADA	987976979	Acta encontrada - Proceda con el pago	{"numeroExpediente":"EXP-2025-000008","estudianteNombre":"fgdfgd Michael fghddf","monto":15,"ubicacionFisica":"estaante 4"}	EMAIL	982e2774-101e-4650-9f48-4d35c26fc278	\N	FALLIDA	1	\N	\N	No recipients defined	2025-11-07 11:41:19.464-05
ec4eb8a6-3521-4652-a456-7592bd45dc0e	ACTA_ENCONTRADA	998909098	Acta encontrada - Proceda con el pago	{"numeroExpediente":"EXP-2025-000009","estudianteNombre":"fgfdg Michael Edard","monto":15,"ubicacionFisica":"estaante 4"}	EMAIL	cfb3fdbf-0abc-4c95-95cd-3d087c8e034b	\N	FALLIDA	1	\N	\N	No recipients defined	2025-11-07 12:25:12.277-05
379e6872-d3d3-40ce-a729-95d3cf893ea3	SOLICITUD_RECIBIDA	mesadepartes@sigcerh.local	Nueva solicitud recibida	{"nombreEstudiante":"fgfdg Michael, Edard","codigoSeguimiento":"S-2025-000009","mensaje":"Nueva solicitud recibida: EXP-2025-000009"}	EMAIL	cfb3fdbf-0abc-4c95-95cd-3d087c8e034b	\N	ENVIADA	0	2025-11-07 12:22:12.837-05	2025-11-07 12:39:15.44-05	\N	2025-11-07 12:22:09.677-05
3826f8c2-4bdb-43cb-b6f6-4268198b10ef	SOLICITUD_RECIBIDA	mesadepartes@sigcerh.local	Nueva solicitud recibida	{"nombreEstudiante":"URIARTE ANCCOTA, EDWARD RODRIGO","codigoSeguimiento":"S-2025-000010","mensaje":"Nueva solicitud recibida: EXP-2025-000010"}	EMAIL	174d7c2e-05b5-43b6-8b20-d02643f7d535	\N	ENVIADA	0	2025-11-10 22:26:14.69-05	\N	\N	2025-11-10 22:26:08.556-05
\.


--
-- Data for Name: pago; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pago (id, institucion_id, numeroorden, numerooperacion, monto, moneda, comision, montoneto, metodopago, entidadbancaria, referenciapago, fechapago, horapago, numerorecibo, urlcomprobante, estado, conciliado, fechaconciliacion, usuarioconciliacion_id, observaciones, fecharegistro) FROM stdin;
d59ca186-7d6e-4c22-98aa-53197323430a	51e3415d-775e-436b-bfe0-3a21eee4de32	ORD-2025-000001	\N	15.00	PEN	0.00	15.00	EFECTIVO	\N	\N	2025-11-07	\N	\N	\N	PENDIENTE	f	\N	\N	\N	2025-11-07 11:45:06.253-05
0da973d6-d813-462f-9e1a-d216e5cf38d3	51e3415d-775e-436b-bfe0-3a21eee4de32	ORD-2025-000002	\N	15.00	PEN	0.00	15.00	EFECTIVO	\N	\N	2025-11-07	\N	\N	\N	PENDIENTE	f	\N	\N	\N	2025-11-07 11:45:06.295-05
aa590d00-2e8b-4555-93b7-7814a9f74b04	51e3415d-775e-436b-bfe0-3a21eee4de32	ORD-2025-000003	\N	15.00	PEN	0.00	15.00	EFECTIVO	\N	\N	2025-11-07	\N	\N	\N	PENDIENTE	f	\N	\N	\N	2025-11-07 11:45:06.312-05
ef83c2dc-2d0a-4e69-86cd-d0f6094a4c57	51e3415d-775e-436b-bfe0-3a21eee4de32	ORD-2025-000004	\N	15.00	PEN	0.00	15.00	PENDIENTE	\N	\N	2025-11-07	\N	\N	\N	PENDIENTE	f	\N	\N	Orden de pago - Expediente: EXP-2025-000007	2025-11-07 11:57:47.484-05
398c4593-a480-4630-a803-19d4619fe738	51e3415d-775e-436b-bfe0-3a21eee4de32	ORD-2025-000008	\N	15.00	PEN	0.00	15.00	PENDIENTE	\N	\N	2025-11-07	\N	\N	\N	PENDIENTE	f	\N	\N	Orden generada automáticamente al encontrar acta - Expediente: EXP-2025-000009	2025-11-07 12:25:12.2-05
bcefee94-f049-4414-96bc-3a4e42cda04d	51e3415d-775e-436b-bfe0-3a21eee4de32	ORD-EXP-2025-000005	\N	15.00	PEN	0.00	15.00	EFECTIVO	\N	\N	2025-11-07	18:14:14.483	REC-EXP-2025-000005	\N	VALIDADO	t	2025-11-07 13:14:14.483-05	57a1a83f-5242-4d95-ad55-82dc6655b45c	Pago de prueba OCR - EXP-2025-000005	2025-11-07 13:14:14.485-05
60863343-c121-43c0-9421-c7efee523c52	51e3415d-775e-436b-bfe0-3a21eee4de32	ORD-2025-000005	\N	15.00	PEN	0.00	15.00	EFECTIVO	\N	\N	2025-11-07	\N	REC-1762534667498	\N	VALIDADO	t	2025-11-07 11:57:47.498-05	\N	Pago en efectivo validado - Expediente: EXP-2025-000006	2025-11-07 11:57:47.501-05
6b68608a-df41-4f7b-b56d-5ee1474cbd76	51e3415d-775e-436b-bfe0-3a21eee4de32	ORD-2025-000006	\N	15.00	PEN	0.00	15.00	EFECTIVO	\N	\N	2025-11-07	00:00:00	REC.AFFERTRTE445	\N	VALIDADO	t	2025-11-07 12:03:35.11-05	\N	Pago en efectivo - Expediente: EXP-2025-000007	2025-11-07 12:03:35.113-05
4f48682d-0dad-479c-a389-2d5b1ff38aec	51e3415d-775e-436b-bfe0-3a21eee4de32	ORD-2025-000007	\N	15.00	PEN	0.00	15.00	EFECTIVO	\N	\N	2025-11-07	00:00:00	REC.AFFERTRTE445	\N	VALIDADO	t	2025-11-07 12:04:04.989-05	\N	Pago en efectivo - Expediente: EXP-2025-000002	2025-11-07 12:04:04.991-05
f53cd41c-65b0-4d49-a1be-5000b928dbd4	51e3415d-775e-436b-bfe0-3a21eee4de32	ORD-2025-000009	\N	15.00	PEN	0.00	15.00	EFECTIVO	\N	\N	2025-11-07	00:00:00	REC.AFFERTRTE445	\N	VALIDADO	t	2025-11-07 12:26:35.751-05	\N	Pago en efectivo - Expediente: EXP-2025-000009	2025-11-07 12:26:35.753-05
\.


--
-- Data for Name: pagodetalle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pagodetalle (id, pago_id, metodopago_id, monto, moneda, numerocelular, nombretitular, terminal_id, lote, trace, codigoautorizacion, ultimos4digitos, tipotarjeta, cuotas, qr_code, qr_id, transaction_id, pasarela, merchant_id, commerce_code, responsejson, fechatransaccion) FROM stdin;
\.


--
-- Data for Name: parametro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parametro (id, codigo, nombre, valor, tipo, descripcion, modificable, fechaactualizacion, usuarioactualizacion_id) FROM stdin;
ca7af78b-8945-489f-97af-cbaa60e35872	PAGOS_ACTIVOS	Sistema de pagos activo	true	BOOLEAN	Activa o desactiva el sistema de pagos	t	2025-11-01 22:40:59.231726-05	\N
a9cd6b00-eee0-437b-9d70-fe153d8c05a3	PAGO_CONDICIONAL	Pago solo si encuentra acta	true	BOOLEAN	Solo cobrar si se encuentra el acta fÃ­sica	t	2025-11-01 22:40:59.231726-05	\N
1acdbde8-ef29-4bba-afea-319b7ddb97e4	NOTIF_EMAIL	Notificaciones por email	true	BOOLEAN	Enviar notificaciones por correo electrÃ³nico	t	2025-11-01 22:40:59.231726-05	\N
b82d44f0-7d08-439e-856e-86461e23872b	OCR_MODO	Modo OCR	DUAL	STRING	Modo de procesamiento OCR: GEMINI, TESSERACT o DUAL	t	2025-11-01 22:40:59.231726-05	\N
24325c7c-a715-49a8-8ac6-0ad11b57c2c6	TIEMPO_POLLING	Polling frontend (ms)	30000	NUMBER	Tiempo de actualizaciÃ³n automÃ¡tica en el frontend	t	2025-11-01 22:40:59.231726-05	\N
\.


--
-- Data for Name: pasarelapago; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pasarelapago (id, institucion_id, codigo, nombre, descripcion, merchant_id, commerce_code, api_key_encrypted, api_secret_encrypted, webhook_url, webhook_secret, ambiente, activo, configuracion, fechaactualizacion) FROM stdin;
\.


--
-- Data for Name: permiso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permiso (id, codigo, nombre, modulo, activo) FROM stdin;
02e3fdce-dbda-4ca7-9360-4367b0c768a8	SOL_CREAR	Crear Solicitud	solicitudes	t
d618152d-98ab-42bb-bd4a-937210dbf962	SOL_VER	Ver Solicitudes	solicitudes	t
f14f3fc5-80a7-48ca-a424-68eceffd1d76	SOL_EDITAR	Editar Solicitud	solicitudes	t
73c4e60c-f4d4-47ef-9e5c-35d3b1382ed9	CERT_VER	Ver Certificados	certificados	t
67725458-2acf-445f-954e-2a8cefb65460	CERT_GENERAR	Generar Certificado	certificados	t
7ac358d6-5736-4b95-9e36-6c864e5ba419	CERT_FIRMAR	Firmar Certificado	certificados	t
bd4216ca-42a3-4d43-80fb-ac8c5f87e454	PAGO_VER	Ver Pagos	pagos	t
69f5d24e-35fb-4ba4-b6d5-416e7416afbb	PAGO_VALIDAR	Validar Pago	pagos	t
76b478d3-d47a-4453-8508-8b452f3968eb	USER_VER	Ver Usuarios	usuarios	t
0d1e6dd8-c00a-494f-ba7e-047b77408e02	USER_CREAR	Crear Usuario	usuarios	t
730e1785-bc51-4f90-b277-a3b4f18d429a	SOLICITUDES_EDITAR	Editar solicitudes	SOLICITUDES	t
bbe662ad-2585-4ca8-a1a9-52c8a1732e2f	SOLICITUDES_ELIMINAR	Eliminar solicitudes	SOLICITUDES	t
88fe8462-d786-4773-8d4e-b644967b5f5b	ESTUDIANTES_EDITAR	Editar estudiantes	ESTUDIANTES	t
680d0849-9d3d-41ed-83e5-918fd4b27b29	ESTUDIANTES_ELIMINAR	Eliminar estudiantes	ESTUDIANTES	t
f3b72ab4-0f88-4b7e-9b90-a33382b01949	ACTAS_SUBIR	Subir actas físicas	ACTAS	t
373960e5-3a30-47d0-a3a4-0700c99ca736	ACTAS_EDITAR	Editar actas físicas	ACTAS	t
7c2957a8-485a-4fb5-9039-2bad2d947117	ACTAS_ELIMINAR	Eliminar actas físicas	ACTAS	t
eaa01141-77df-4d3f-ab18-d87d0db0f0c2	ACTAS_PROCESAR_OCR	Procesar OCR	ACTAS	t
09f72675-1acf-49e3-b760-a5abeba5141e	ACTAS_EXPORTAR	Exportar actas	ACTAS	t
d9371e35-d806-40e8-aea0-625feccc8aab	PAGOS_VER	Ver pagos	PAGOS	t
1da438a1-68c9-4311-831a-e11c229a800d	PAGOS_CREAR	Crear orden de pago	PAGOS	t
bfad62d5-ad98-4883-b102-1f836b4614ae	PAGOS_REGISTRAR	Registrar pagos	PAGOS	t
b320ff57-d12e-44cf-a5ba-1f45da797658	PAGOS_VALIDAR	Validar pagos	PAGOS	t
59fa3bbb-c9b9-4646-9069-1a65a32c6191	PAGOS_EDITAR	Editar configuración de pagos	PAGOS	t
52f299fb-2e29-4bcd-866c-cba329b3b75c	CONFIG_EDITAR	Editar configuración	CONFIGURACION	t
b2437cc0-d674-44bc-90ae-55f9167ed861	CONFIG_PARAMETROS	Gestionar parámetros	CONFIGURACION	t
cbd0ae5a-8882-4db6-ba36-7dfea0e43e22	AUDITORIA_VER	Ver auditoría	AUDITORIA	t
304b2243-0fd4-415a-8863-44270a427275	AUDITORIA_EXPORTAR	Exportar auditoría	AUDITORIA	t
ef8360d0-ec30-4bed-87df-efe0006d11d0	NOTIFICACIONES_VER	Ver notificaciones	NOTIFICACIONES	t
790bf944-5d45-49ab-b427-bed6853e430d	NOTIFICACIONES_ENVIAR	Enviar notificaciones	NOTIFICACIONES	t
e8f16323-04be-45fc-99a7-0b3d69099a93	AUTH_LOGIN	Iniciar sesión	AUTH	t
fba16016-63d3-424e-b191-1b9c7dcff193	AUTH_REGISTER	Registrarse	AUTH	t
7ac196ef-bc52-4cc5-bef7-bcb5080cd824	AUTH_LOGOUT	Cerrar sesión	AUTH	t
4b42a4da-d124-4982-8933-a3876613bbab	USUARIOS_VER	Ver usuarios	USUARIOS	t
70e4e920-5be0-4672-9fb5-7a9304245ba2	USUARIOS_CREAR	Crear usuarios	USUARIOS	t
83d341b7-8b83-464a-9a1a-09acbcbeba4d	USUARIOS_EDITAR	Editar usuarios	USUARIOS	t
52d679ed-110b-44f4-99f7-e39f743cc799	USUARIOS_ELIMINAR	Eliminar usuarios	USUARIOS	t
4db7a3a1-958e-4f0b-9492-7d7bb3919d05	USUARIOS_ASIGNAR_ROLES	Asignar roles	USUARIOS	t
9f0c0c0d-38a4-4bbc-9304-1991ec684a96	ROLES_VER	Ver roles	ROLES	t
bfe24853-f5f1-4ce2-91a2-5ea2bf2b3e22	ROLES_CREAR	Crear roles	ROLES	t
0949e210-74d0-4656-86be-314c34046b02	ROLES_EDITAR	Editar roles	ROLES	t
54745a25-6401-485d-8cfe-d478996243b9	ROLES_ELIMINAR	Eliminar roles	ROLES	t
6aa53e85-3275-4674-a445-1830ed297eaf	PERMISOS_VER	Ver permisos	ROLES	t
023dff69-b5fb-490a-bf29-718bffd8d1c2	SOLICITUDES_VER	Ver solicitudes	SOLICITUDES	t
559d6323-935f-48e4-9fa4-c56c903ee10c	SOLICITUDES_DERIVAR	Derivar solicitudes	SOLICITUDES	t
9ebaefda-e1d6-4e67-821c-e86cda440505	SOLICITUDES_BUSCAR	Buscar actas físicas	SOLICITUDES	t
b970eff9-178c-4fbd-b683-fba92bd6f11e	SOLICITUDES_GESTIONAR	Gestionar solicitudes	SOLICITUDES	t
762f6b65-abcb-469d-b980-cbd02694f1b1	SOLICITUDES_VALIDAR_PAGO	Validar pagos de solicitudes	SOLICITUDES	t
546f8384-25aa-4f42-9973-95b286fe39bc	SOLICITUDES_PROCESAR	Procesar solicitudes	SOLICITUDES	t
f7a004fc-c702-4ec4-b1e6-36dda108e31e	SOLICITUDES_VALIDAR	Validar solicitudes (UGEL)	SOLICITUDES	t
2f85d6e1-ad68-43b8-8875-e3b6ed846a15	SOLICITUDES_REGISTRAR	Registrar en SIAGEC	SOLICITUDES	t
31f4f37b-48a8-4c1d-80c1-c26e6bf2fe11	SOLICITUDES_FIRMAR	Firmar certificados	SOLICITUDES	t
09d69f96-a640-4b02-b872-f520f06f32ce	SOLICITUDES_ENTREGAR	Marcar como entregado	SOLICITUDES	t
727061fc-433a-4f13-a259-116c8b728ba3	CERTIFICADOS_VER	Ver certificados	CERTIFICADOS	t
121ce9a9-b0fc-4aae-8410-ae2b76583ea3	CERTIFICADOS_CREAR	Crear certificados	CERTIFICADOS	t
f4674967-ce64-48e1-97fa-60f9a56d521b	CERTIFICADOS_EDITAR	Editar certificados	CERTIFICADOS	t
74e8b15f-72be-44d2-942c-3399195d909c	CERTIFICADOS_ELIMINAR	Eliminar certificados	CERTIFICADOS	t
2a8aed37-e240-4706-8dad-bc720d019415	CERTIFICADOS_FIRMAR	Firmar certificados	CERTIFICADOS	t
08c7b5c7-0e24-4b95-bbd7-997f24bbbc93	CERTIFICADOS_ANULAR	Anular certificados	CERTIFICADOS	t
babbb549-2156-444f-8888-000f1151753b	CERTIFICADOS_EXPORTAR	Exportar certificados	CERTIFICADOS	t
fc3dcfff-5909-431b-8dac-712b038788af	ESTUDIANTES_VER	Ver estudiantes	ESTUDIANTES	t
d4e8499a-a4ae-4660-bd61-0661f31c0c32	ESTUDIANTES_CREAR	Crear estudiantes	ESTUDIANTES	t
a02faf67-ffa1-4ca7-872b-76ad91220331	GRADOS_VER	Ver grados	GRADOS	t
5449b6a8-ef0c-4914-b100-70e59b738a5d	PAGOS_CONCILIAR	Conciliar pagos	PAGOS	t
5bae1fb8-5199-40ae-bc59-ad8eb8c74714	CONFIG_VER	Ver configuración	CONFIGURACION	t
4315a4c1-a2e7-43b8-b01f-c91534a7a552	AUTH_REFRESH	Renovar token	AUTH	t
a9055fe0-7a66-404c-a8bc-1fde89b2f803	SOLICITUDES_CREAR	Crear solicitudes	SOLICITUDES	t
a7b2f88e-76ee-4787-8b47-38697aaf5928	GRADOS_CREAR	Crear grados	GRADOS	t
324d992f-836a-442d-a006-7e83ff929040	GRADOS_EDITAR	Editar grados	GRADOS	t
aba68fb2-832a-4cae-a9b7-9c477d2b5080	GRADOS_ELIMINAR	Eliminar grados	GRADOS	t
8f968910-2a82-4e20-8a44-6975df1ce6da	ANIOS_VER	Ver años lectivos	ANIOS	t
9517a57a-b8c6-461e-b85b-6cc23ae331d0	ANIOS_CREAR	Crear años lectivos	ANIOS	t
be22ea9d-1d77-40bf-8f93-d7aad2b9c0f9	ANIOS_EDITAR	Editar años lectivos	ANIOS	t
a3808f79-884b-4a20-9f77-34cc0e64bcdf	ANIOS_ELIMINAR	Eliminar años lectivos	ANIOS	t
515dc723-213f-4412-8010-7ba17c277f49	AREAS_VER	Ver áreas curriculares	AREAS	t
ecd4471f-63a9-457a-b54e-e25aae806ecc	AREAS_CREAR	Crear áreas	AREAS	t
0bb1a087-48d8-4558-acef-c6493e03b820	AREAS_EDITAR	Editar áreas	AREAS	t
d734a460-7262-4395-9a11-108e1d8db032	AREAS_ELIMINAR	Eliminar áreas	AREAS	t
2c1fbbf8-6449-4b42-9a91-40ca1c78c848	NIVELES_VER	Ver niveles educativos	NIVELES	t
3a263122-252b-4e00-8a4b-e089f158ba65	NIVELES_CREAR	Crear niveles	NIVELES	t
87178d4e-93f6-4456-80b5-b2723917701f	NIVELES_EDITAR	Editar niveles	NIVELES	t
4c14072c-2d7a-4b07-b635-532028125977	NIVELES_ELIMINAR	Eliminar niveles	NIVELES	t
2f77e12b-af1a-47a9-b62b-6aff4d1bb277	ACTAS_VER	Ver actas físicas	ACTAS	t
\.


--
-- Data for Name: rol; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rol (id, institucion_id, codigo, nombre, descripcion, nivel, activo) FROM stdin;
fac5f198-9628-491c-bac0-1ebb84999e1f	51e3415d-775e-436b-bfe0-3a21eee4de32	PUBLICO	Público	Usuario público que puede solicitar certificados	1	t
f1c3a727-c1cd-4506-9df5-063faee768d9	51e3415d-775e-436b-bfe0-3a21eee4de32	MESA_DE_PARTES	Mesa de Partes	Personal de mesa de partes que registra solicitudes	2	t
b7db07f2-911e-4266-944f-bab290f299b6	51e3415d-775e-436b-bfe0-3a21eee4de32	EDITOR	Editor	Personal que edita y genera certificados (ahora incluye todas las funciones)	3	t
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	51e3415d-775e-436b-bfe0-3a21eee4de32	ADMIN	Administrador	Administrador del sistema con todos los permisos	10	t
\.


--
-- Data for Name: rolpermiso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rolpermiso (rol_id, permiso_id) FROM stdin;
b7db07f2-911e-4266-944f-bab290f299b6	7c2957a8-485a-4fb5-9039-2bad2d947117
fac5f198-9628-491c-bac0-1ebb84999e1f	e8f16323-04be-45fc-99a7-0b3d69099a93
fac5f198-9628-491c-bac0-1ebb84999e1f	fba16016-63d3-424e-b191-1b9c7dcff193
fac5f198-9628-491c-bac0-1ebb84999e1f	7ac196ef-bc52-4cc5-bef7-bcb5080cd824
fac5f198-9628-491c-bac0-1ebb84999e1f	4315a4c1-a2e7-43b8-b01f-c91534a7a552
fac5f198-9628-491c-bac0-1ebb84999e1f	023dff69-b5fb-490a-bf29-718bffd8d1c2
fac5f198-9628-491c-bac0-1ebb84999e1f	a9055fe0-7a66-404c-a8bc-1fde89b2f803
fac5f198-9628-491c-bac0-1ebb84999e1f	727061fc-433a-4f13-a259-116c8b728ba3
fac5f198-9628-491c-bac0-1ebb84999e1f	ef8360d0-ec30-4bed-87df-efe0006d11d0
f1c3a727-c1cd-4506-9df5-063faee768d9	e8f16323-04be-45fc-99a7-0b3d69099a93
f1c3a727-c1cd-4506-9df5-063faee768d9	7ac196ef-bc52-4cc5-bef7-bcb5080cd824
f1c3a727-c1cd-4506-9df5-063faee768d9	4315a4c1-a2e7-43b8-b01f-c91534a7a552
f1c3a727-c1cd-4506-9df5-063faee768d9	023dff69-b5fb-490a-bf29-718bffd8d1c2
f1c3a727-c1cd-4506-9df5-063faee768d9	a9055fe0-7a66-404c-a8bc-1fde89b2f803
f1c3a727-c1cd-4506-9df5-063faee768d9	730e1785-bc51-4f90-b277-a3b4f18d429a
f1c3a727-c1cd-4506-9df5-063faee768d9	559d6323-935f-48e4-9fa4-c56c903ee10c
f1c3a727-c1cd-4506-9df5-063faee768d9	762f6b65-abcb-469d-b980-cbd02694f1b1
f1c3a727-c1cd-4506-9df5-063faee768d9	09d69f96-a640-4b02-b872-f520f06f32ce
f1c3a727-c1cd-4506-9df5-063faee768d9	fc3dcfff-5909-431b-8dac-712b038788af
f1c3a727-c1cd-4506-9df5-063faee768d9	d4e8499a-a4ae-4660-bd61-0661f31c0c32
f1c3a727-c1cd-4506-9df5-063faee768d9	88fe8462-d786-4773-8d4e-b644967b5f5b
f1c3a727-c1cd-4506-9df5-063faee768d9	d9371e35-d806-40e8-aea0-625feccc8aab
f1c3a727-c1cd-4506-9df5-063faee768d9	1da438a1-68c9-4311-831a-e11c229a800d
f1c3a727-c1cd-4506-9df5-063faee768d9	bfad62d5-ad98-4883-b102-1f836b4614ae
f1c3a727-c1cd-4506-9df5-063faee768d9	b320ff57-d12e-44cf-a5ba-1f45da797658
f1c3a727-c1cd-4506-9df5-063faee768d9	727061fc-433a-4f13-a259-116c8b728ba3
f1c3a727-c1cd-4506-9df5-063faee768d9	ef8360d0-ec30-4bed-87df-efe0006d11d0
f1c3a727-c1cd-4506-9df5-063faee768d9	4b42a4da-d124-4982-8933-a3876613bbab
b7db07f2-911e-4266-944f-bab290f299b6	e8f16323-04be-45fc-99a7-0b3d69099a93
b7db07f2-911e-4266-944f-bab290f299b6	7ac196ef-bc52-4cc5-bef7-bcb5080cd824
b7db07f2-911e-4266-944f-bab290f299b6	4315a4c1-a2e7-43b8-b01f-c91534a7a552
b7db07f2-911e-4266-944f-bab290f299b6	023dff69-b5fb-490a-bf29-718bffd8d1c2
b7db07f2-911e-4266-944f-bab290f299b6	730e1785-bc51-4f90-b277-a3b4f18d429a
b7db07f2-911e-4266-944f-bab290f299b6	9ebaefda-e1d6-4e67-821c-e86cda440505
b7db07f2-911e-4266-944f-bab290f299b6	b970eff9-178c-4fbd-b683-fba92bd6f11e
b7db07f2-911e-4266-944f-bab290f299b6	546f8384-25aa-4f42-9973-95b286fe39bc
b7db07f2-911e-4266-944f-bab290f299b6	f7a004fc-c702-4ec4-b1e6-36dda108e31e
b7db07f2-911e-4266-944f-bab290f299b6	2f85d6e1-ad68-43b8-8875-e3b6ed846a15
b7db07f2-911e-4266-944f-bab290f299b6	31f4f37b-48a8-4c1d-80c1-c26e6bf2fe11
b7db07f2-911e-4266-944f-bab290f299b6	727061fc-433a-4f13-a259-116c8b728ba3
b7db07f2-911e-4266-944f-bab290f299b6	121ce9a9-b0fc-4aae-8410-ae2b76583ea3
b7db07f2-911e-4266-944f-bab290f299b6	f4674967-ce64-48e1-97fa-60f9a56d521b
b7db07f2-911e-4266-944f-bab290f299b6	2a8aed37-e240-4706-8dad-bc720d019415
b7db07f2-911e-4266-944f-bab290f299b6	08c7b5c7-0e24-4b95-bbd7-997f24bbbc93
b7db07f2-911e-4266-944f-bab290f299b6	babbb549-2156-444f-8888-000f1151753b
b7db07f2-911e-4266-944f-bab290f299b6	fc3dcfff-5909-431b-8dac-712b038788af
b7db07f2-911e-4266-944f-bab290f299b6	d4e8499a-a4ae-4660-bd61-0661f31c0c32
b7db07f2-911e-4266-944f-bab290f299b6	88fe8462-d786-4773-8d4e-b644967b5f5b
b7db07f2-911e-4266-944f-bab290f299b6	a02faf67-ffa1-4ca7-872b-76ad91220331
b7db07f2-911e-4266-944f-bab290f299b6	a7b2f88e-76ee-4787-8b47-38697aaf5928
b7db07f2-911e-4266-944f-bab290f299b6	324d992f-836a-442d-a006-7e83ff929040
b7db07f2-911e-4266-944f-bab290f299b6	8f968910-2a82-4e20-8a44-6975df1ce6da
b7db07f2-911e-4266-944f-bab290f299b6	9517a57a-b8c6-461e-b85b-6cc23ae331d0
b7db07f2-911e-4266-944f-bab290f299b6	be22ea9d-1d77-40bf-8f93-d7aad2b9c0f9
b7db07f2-911e-4266-944f-bab290f299b6	515dc723-213f-4412-8010-7ba17c277f49
b7db07f2-911e-4266-944f-bab290f299b6	ecd4471f-63a9-457a-b54e-e25aae806ecc
b7db07f2-911e-4266-944f-bab290f299b6	0bb1a087-48d8-4558-acef-c6493e03b820
b7db07f2-911e-4266-944f-bab290f299b6	2c1fbbf8-6449-4b42-9a91-40ca1c78c848
b7db07f2-911e-4266-944f-bab290f299b6	3a263122-252b-4e00-8a4b-e089f158ba65
b7db07f2-911e-4266-944f-bab290f299b6	87178d4e-93f6-4456-80b5-b2723917701f
b7db07f2-911e-4266-944f-bab290f299b6	2f77e12b-af1a-47a9-b62b-6aff4d1bb277
b7db07f2-911e-4266-944f-bab290f299b6	f3b72ab4-0f88-4b7e-9b90-a33382b01949
b7db07f2-911e-4266-944f-bab290f299b6	373960e5-3a30-47d0-a3a4-0700c99ca736
b7db07f2-911e-4266-944f-bab290f299b6	eaa01141-77df-4d3f-ab18-d87d0db0f0c2
b7db07f2-911e-4266-944f-bab290f299b6	09f72675-1acf-49e3-b760-a5abeba5141e
b7db07f2-911e-4266-944f-bab290f299b6	d9371e35-d806-40e8-aea0-625feccc8aab
b7db07f2-911e-4266-944f-bab290f299b6	5bae1fb8-5199-40ae-bc59-ad8eb8c74714
b7db07f2-911e-4266-944f-bab290f299b6	cbd0ae5a-8882-4db6-ba36-7dfea0e43e22
b7db07f2-911e-4266-944f-bab290f299b6	ef8360d0-ec30-4bed-87df-efe0006d11d0
b7db07f2-911e-4266-944f-bab290f299b6	790bf944-5d45-49ab-b427-bed6853e430d
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	e8f16323-04be-45fc-99a7-0b3d69099a93
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	fba16016-63d3-424e-b191-1b9c7dcff193
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	7ac196ef-bc52-4cc5-bef7-bcb5080cd824
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	4315a4c1-a2e7-43b8-b01f-c91534a7a552
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	4b42a4da-d124-4982-8933-a3876613bbab
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	70e4e920-5be0-4672-9fb5-7a9304245ba2
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	83d341b7-8b83-464a-9a1a-09acbcbeba4d
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	52d679ed-110b-44f4-99f7-e39f743cc799
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	4db7a3a1-958e-4f0b-9492-7d7bb3919d05
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	9f0c0c0d-38a4-4bbc-9304-1991ec684a96
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	bfe24853-f5f1-4ce2-91a2-5ea2bf2b3e22
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	0949e210-74d0-4656-86be-314c34046b02
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	54745a25-6401-485d-8cfe-d478996243b9
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	6aa53e85-3275-4674-a445-1830ed297eaf
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	023dff69-b5fb-490a-bf29-718bffd8d1c2
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	a9055fe0-7a66-404c-a8bc-1fde89b2f803
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	730e1785-bc51-4f90-b277-a3b4f18d429a
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	bbe662ad-2585-4ca8-a1a9-52c8a1732e2f
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	559d6323-935f-48e4-9fa4-c56c903ee10c
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	9ebaefda-e1d6-4e67-821c-e86cda440505
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	b970eff9-178c-4fbd-b683-fba92bd6f11e
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	762f6b65-abcb-469d-b980-cbd02694f1b1
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	546f8384-25aa-4f42-9973-95b286fe39bc
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	f7a004fc-c702-4ec4-b1e6-36dda108e31e
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	2f85d6e1-ad68-43b8-8875-e3b6ed846a15
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	31f4f37b-48a8-4c1d-80c1-c26e6bf2fe11
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	09d69f96-a640-4b02-b872-f520f06f32ce
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	727061fc-433a-4f13-a259-116c8b728ba3
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	121ce9a9-b0fc-4aae-8410-ae2b76583ea3
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	f4674967-ce64-48e1-97fa-60f9a56d521b
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	74e8b15f-72be-44d2-942c-3399195d909c
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	2a8aed37-e240-4706-8dad-bc720d019415
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	08c7b5c7-0e24-4b95-bbd7-997f24bbbc93
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	babbb549-2156-444f-8888-000f1151753b
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	fc3dcfff-5909-431b-8dac-712b038788af
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	d4e8499a-a4ae-4660-bd61-0661f31c0c32
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	88fe8462-d786-4773-8d4e-b644967b5f5b
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	680d0849-9d3d-41ed-83e5-918fd4b27b29
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	a02faf67-ffa1-4ca7-872b-76ad91220331
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	a7b2f88e-76ee-4787-8b47-38697aaf5928
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	324d992f-836a-442d-a006-7e83ff929040
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	aba68fb2-832a-4cae-a9b7-9c477d2b5080
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	8f968910-2a82-4e20-8a44-6975df1ce6da
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	9517a57a-b8c6-461e-b85b-6cc23ae331d0
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	be22ea9d-1d77-40bf-8f93-d7aad2b9c0f9
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	a3808f79-884b-4a20-9f77-34cc0e64bcdf
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	515dc723-213f-4412-8010-7ba17c277f49
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	ecd4471f-63a9-457a-b54e-e25aae806ecc
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	0bb1a087-48d8-4558-acef-c6493e03b820
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	d734a460-7262-4395-9a11-108e1d8db032
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	2c1fbbf8-6449-4b42-9a91-40ca1c78c848
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	3a263122-252b-4e00-8a4b-e089f158ba65
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	87178d4e-93f6-4456-80b5-b2723917701f
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	4c14072c-2d7a-4b07-b635-532028125977
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	2f77e12b-af1a-47a9-b62b-6aff4d1bb277
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	f3b72ab4-0f88-4b7e-9b90-a33382b01949
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	373960e5-3a30-47d0-a3a4-0700c99ca736
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	7c2957a8-485a-4fb5-9039-2bad2d947117
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	eaa01141-77df-4d3f-ab18-d87d0db0f0c2
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	09f72675-1acf-49e3-b760-a5abeba5141e
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	d9371e35-d806-40e8-aea0-625feccc8aab
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	1da438a1-68c9-4311-831a-e11c229a800d
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	bfad62d5-ad98-4883-b102-1f836b4614ae
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	b320ff57-d12e-44cf-a5ba-1f45da797658
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	59fa3bbb-c9b9-4646-9069-1a65a32c6191
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	5449b6a8-ef0c-4914-b100-70e59b738a5d
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	5bae1fb8-5199-40ae-bc59-ad8eb8c74714
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	52f299fb-2e29-4bcd-866c-cba329b3b75c
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	b2437cc0-d674-44bc-90ae-55f9167ed861
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	cbd0ae5a-8882-4db6-ba36-7dfea0e43e22
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	304b2243-0fd4-415a-8863-44270a427275
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	ef8360d0-ec30-4bed-87df-efe0006d11d0
8a11ab04-4d0f-4ea5-aad4-3f463e29982b	790bf944-5d45-49ab-b427-bed6853e430d
\.


--
-- Data for Name: sesion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sesion (id, usuario_id, token, ip, useragent, fechainicio, fechaexpiracion, fechacierre, activa) FROM stdin;
7697c20e-dcec-444d-a246-36ac253d411a	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjkxNjkwOCwiZXhwIjoxNzYzNTIxNzA4LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.qUvKvrug3aYpVISfh-oFLRJJHWL7tJuVx_092G-ImRo	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 14:56:23.21-05	2025-11-18 22:08:28.899-05	2025-11-11 22:24:56.414-05	f
4547dddd-6da9-47ed-ab59-ca5d61b57f7c	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1MzM2OCwiZXhwIjoxNzYzMDU4MTY4LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.lhyXw3Rg6oMxGd568nIe93wRzAhKnORss5qT3Vtp-Eg	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:22:48.643-05	2025-11-13 13:22:48.641-05	2025-11-06 13:23:22.979-05	f
cf4df866-e05f-45fc-b088-2eade32c31e2	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1Mzc3NywiZXhwIjoxNzYzMDU4NTc3LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.erjqUTvq0BSEQjRMl9hvGbc3_VFeCNflGuiEJfQ9qG0	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:29:37.461-05	2025-11-13 13:29:37.459-05	2025-11-06 13:31:08.678-05	f
f7a6dbfd-6a01-4cf8-bfec-09ca8af8cab2	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1Mzg3NSwiZXhwIjoxNzYzMDU4Njc1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.DWUat2NMnaODrX7sgbyjowafC6tX5piAC_11fFARlz0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:31:15.974-05	2025-11-13 13:31:15.973-05	2025-11-06 13:31:38.483-05	f
fef5e942-8d96-4a5c-a76e-d6fc397cc2fe	3067116a-b810-4148-8b98-fe9940422aeb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMDY3MTE2YS1iODEwLTQxNDgtOGI5OC1mZTk5NDA0MjJhZWIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjk0Mjc3NSwiZXhwIjoxNzYzNTQ3NTc1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.iBXOhw2pw8-pKR3Kq7zHCmyJeH7NIJ4aTjkIsiRmIUc	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 23:28:20.238-05	2025-11-19 05:19:35.218-05	2025-11-12 06:12:29.638-05	f
cff13fcd-3796-430d-a9ba-4861a10c2980	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1MzkwMywiZXhwIjoxNzYzMDU4NzAzLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.tynlC950v0AcM007PTCvX-8XoPeyOPjq6D_vgoJ73Hg	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:31:43.722-05	2025-11-13 13:31:43.72-05	2025-11-06 13:31:53.219-05	f
36385987-b94c-4e23-9af0-b6bcdbfe7a1c	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDA0MSwiZXhwIjoxNzYzMDU4ODQxLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.IgwSmFgCnDui28Sf4ecQTKbhiEFVr4v2JxSrNKZ0S1c	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:34:01.006-05	2025-11-13 13:34:01.005-05	2025-11-06 13:34:09.375-05	f
af5c8b95-de56-48fe-b974-0c7dafaabdd6	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjk2MzU3NCwiZXhwIjoxNzYzNTY4Mzc0LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.9rFoSSmfHnJfF31jjbADZHtwPrg3lWYSBouAEDC-NEc	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 10:05:37.667-05	2025-11-19 11:06:14.839-05	\N	t
8ca89f74-dce8-481d-86d2-288b660e6b27	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjUzNjIyNSwiZXhwIjoxNzYzMTQxMDI1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.SbTdtlenJug1SGMpG1RjnBEkgh_LomUkMwGES7yao28	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:23:45.272-05	2025-11-14 12:23:45.271-05	2025-11-07 12:25:20.528-05	f
dc98e948-2f49-4f38-9c37-a226b8f9242c	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MzAwNjEyOSwiZXhwIjoxNzYzNjEwOTI5LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.gU4loiGpTYlz2NND-Gl6hvvIW-g8iecWUW1ahf83V1w	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 19:40:07.915-05	2025-11-19 22:55:29.823-05	2025-11-12 22:58:46.203-05	f
971dde7a-a5f7-4e5c-9190-2d5480bd4eea	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDA3NSwiZXhwIjoxNzYzMDU4ODc1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.EcE3JYiNyJffVM6vAbWWZSsZ40cidtZQAbXU7_eNvHg	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:34:35.742-05	2025-11-13 13:34:35.741-05	2025-11-06 13:34:42.063-05	f
a2d16714-5f37-479d-ab88-89885136c03b	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDA4OCwiZXhwIjoxNzYzMDU4ODg4LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.lmrLo9r3xPzTyMoUW2VoVZarjDdSWhbvCzfZ-DOeGh4	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:34:48.213-05	2025-11-13 13:34:48.212-05	2025-11-06 13:34:55.503-05	f
68781c59-9fe8-46e3-8c46-022d72a77118	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDI0NywiZXhwIjoxNzYzMDU5MDQ3LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.o0Z_vDTjuacehB-bMlTVhKcPEiYixYorlUA9bmTJr9I	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:37:27.339-05	2025-11-13 13:37:27.338-05	2025-11-06 13:37:34.38-05	f
468eef55-80db-426d-bb56-97ab37dec379	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDU1MSwiZXhwIjoxNzYzMDU5MzUxLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.HJyrIzpulmNr2kVkShgN2jm7XbvJyL0qpKBagFA8cEI	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:42:31.566-05	2025-11-13 13:42:31.565-05	2025-11-06 13:42:38.64-05	f
6eb5e992-c2a4-4039-b9af-cfaf53c1e308	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDU2NCwiZXhwIjoxNzYzMDU5MzY0LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.aM0SYzu3of9J7qXRxZhQF57ycn-L7EZ8vJV22O3vo7M	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:42:44.594-05	2025-11-13 13:42:44.593-05	2025-11-06 13:42:55.595-05	f
11dfb33f-3750-4900-a7b8-ac331018d88a	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDU4MCwiZXhwIjoxNzYzMDU5MzgwLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.7hQSgqFBX5uH-h5NWzyaCJOw4mcmJSXbdoe7d5wqqAU	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:43:00.771-05	2025-11-13 13:43:00.77-05	2025-11-06 13:43:06.749-05	f
315dd7b1-88c5-418a-b6a4-6ab2524d0424	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDU5MSwiZXhwIjoxNzYzMDU5MzkxLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.n3orrVMFTkZO37FpkAHUnVcuzec6LzaQFz31PtFjkGg	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:43:11.927-05	2025-11-13 13:43:11.926-05	2025-11-06 13:43:18.99-05	f
d885716e-2970-4b8f-a55a-f56a48fc3f57	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDYxNSwiZXhwIjoxNzYzMDU5NDE1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.e_DL7WL6UURpNFjNvQyiswpqRc2Qx1e9HYlnbJ2F1sY	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:43:35.183-05	2025-11-13 13:43:35.181-05	2025-11-06 13:43:40.215-05	f
be94945e-15cd-4639-a871-6178d09996aa	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDYyNCwiZXhwIjoxNzYzMDU5NDI0LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.R_LmGyWHpkZR7gbG-pMRMax1mBT6bgBUSLJ-rDz-VS0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:43:44.774-05	2025-11-13 13:43:44.773-05	2025-11-06 13:43:49.663-05	f
4c663909-0540-418e-a214-5f30e2f2866d	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDY2NiwiZXhwIjoxNzYzMDU5NDY2LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.bgYekMjxpff13rgvcIAkCm5o7LfWEabNopvIPPXqLEE	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:44:26.569-05	2025-11-13 13:44:26.568-05	2025-11-06 13:44:33.772-05	f
6d8bfab6-8a9d-491c-a5fc-62073a035ea8	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDY4OCwiZXhwIjoxNzYzMDU5NDg4LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.JINLlolxzLUdoLEEuGE1TsSn7Nu8MqusMxqcTtg64mg	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:44:48.213-05	2025-11-13 13:44:48.212-05	2025-11-06 13:44:57.103-05	f
912281ff-59aa-442c-8d11-f50222c8e807	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDc4NCwiZXhwIjoxNzYzMDU5NTg0LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.oqAOkRplsKtRKNf_rh6YG9xgZZCZIZMLconT6wWalqw	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:46:24.125-05	2025-11-13 13:46:24.123-05	2025-11-06 13:46:33.455-05	f
c4207558-e03f-4d1c-975c-fe530bca2a83	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDc5OCwiZXhwIjoxNzYzMDU5NTk4LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.wCjruQekOKu-7aYUOFD2hM_qSSggtNED2GWsaSDJKGo	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:46:38.649-05	2025-11-13 13:46:38.647-05	2025-11-06 13:48:11.36-05	f
1c548b78-9f59-413a-9023-ebcb54e9c8a0	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDkwNCwiZXhwIjoxNzYzMDU5NzA0LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.RKr_j80gb1IWJ28ddIlm9K_y2FpQxCWF40GFU1ScwK8	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:48:24.777-05	2025-11-13 13:48:24.775-05	2025-11-06 13:48:34.094-05	f
9240d5ae-8e5b-4965-981d-9fc13630af64	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDkyOCwiZXhwIjoxNzYzMDU5NzI4LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.Zfou7hTnUFF7s5iVk4kktEAoHnbTohzbLK16CeArFmA	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:48:48.12-05	2025-11-13 13:48:48.119-05	2025-11-06 13:49:32.723-05	f
c8375b7c-b51c-4d51-805d-f15dd4cc7000	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NDk4NiwiZXhwIjoxNzYzMDU5Nzg2LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.xL_52R8AznEqhpOnJq0sfR-rQmN6r1et4SAfmZ5QVIs	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:49:46.063-05	2025-11-13 13:49:46.062-05	2025-11-06 13:49:59.72-05	f
5822f3c0-46c3-4472-b1d2-21df2781ebf4	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTAwNSwiZXhwIjoxNzYzMDU5ODA1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.VAlnPGamkwuauas4un_lYV98Y0nqoRQAQZecsVxBlkg	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:50:05.363-05	2025-11-13 13:50:05.362-05	2025-11-06 13:50:15.433-05	f
ecf595ea-75f1-4b47-b191-7efc312b0099	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTAyMCwiZXhwIjoxNzYzMDU5ODIwLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.8cw9FrZEhBYT4RaSzZ1uCRBhiEOxovwnIL6L-DrugV4	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:50:20.333-05	2025-11-13 13:50:20.332-05	2025-11-06 13:50:25.641-05	f
fdd5414f-ab79-42e8-9b90-e1c29e789409	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTA0NywiZXhwIjoxNzYzMDU5ODQ3LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.mKSM3nACLcvcmF25uBR1Gu7npemHBBw8L_7r3lILzHI	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:50:47.68-05	2025-11-13 13:50:47.678-05	2025-11-06 13:51:02.133-05	f
b865a4dd-2420-45e2-a4af-2f27ad9ff276	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTA2OCwiZXhwIjoxNzYzMDU5ODY4LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.jRFOm2QJxL3wuEcYO_YNRLjzAOCN8pvZp_8BkwubSdg	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:51:08.13-05	2025-11-13 13:51:08.128-05	2025-11-06 13:51:17.011-05	f
67909808-88e6-460e-88ee-f2f2dc48a09d	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTA4MywiZXhwIjoxNzYzMDU5ODgzLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.q6nEe6yKeZHp5aV4mbEQM3JglBLZdlGJ_zoh8AbuNow	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:51:23.531-05	2025-11-13 13:51:23.53-05	2025-11-06 13:53:09.814-05	f
bc4a0815-5eab-44ee-a7b8-588314957140	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTIwNSwiZXhwIjoxNzYzMDYwMDA1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.iIw7Tt-DAKRNatRwzjp9kvLAV64TzxLtYzL-oBQKQGY	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:53:25.657-05	2025-11-13 13:53:25.655-05	2025-11-06 13:53:52.903-05	f
567a226e-1fe0-4dc2-a213-0403b1168b4d	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTIzOSwiZXhwIjoxNzYzMDYwMDM5LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.ZpJ4Xrj2-yShRE4VnW2Uv3f6GHHWb3sWGshrb-mV4rQ	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:53:59.43-05	2025-11-13 13:53:59.429-05	2025-11-06 13:54:03.456-05	f
2c35b4fd-e18e-4f5b-bd66-08a8a5e5134d	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTI2MSwiZXhwIjoxNzYzMDYwMDYxLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.CI_A6JlaKmLkkqtwm4AmKVigxs64NSz1CbF-vcf1_oM	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:54:21.394-05	2025-11-13 13:54:21.393-05	2025-11-06 13:54:30.383-05	f
f22bb307-5b04-4ee7-ab87-90a297e89465	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTI4OCwiZXhwIjoxNzYzMDYwMDg4LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.j7VY6XcTJtILfM7U67TURCHRkn2fz3gyRdHzvXxLmw8	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:54:48.89-05	2025-11-13 13:54:48.889-05	2025-11-06 13:54:53.612-05	f
d33a8837-44b0-4c6b-a8b1-95e9385348e8	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTM2OSwiZXhwIjoxNzYzMDYwMTY5LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.NbYQktdFxpzaobAANGdgkPz4TC0O8tMNxgQIkvAMHlY	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:56:09.453-05	2025-11-13 13:56:09.451-05	2025-11-06 13:56:21.73-05	f
16d9101a-aade-48f7-a9d9-3b3a52451877	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTM5OCwiZXhwIjoxNzYzMDYwMTk4LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.ZQqaBcqZ-RqWXUUK4Nc7T6lCJqSTMAQGJufR4Rykxeg	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:56:38.973-05	2025-11-13 13:56:38.972-05	2025-11-06 13:56:43.955-05	f
84a07266-d930-4972-a011-5153981eec91	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTQxMiwiZXhwIjoxNzYzMDYwMjEyLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.iKHKPnsKJJaFNxaJB7vodRWZVkNwqJueWhhrSoQiYq4	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:56:52.194-05	2025-11-13 13:56:52.193-05	2025-11-06 13:56:56.725-05	f
6c68e039-e88b-4d22-8ab5-21540020909a	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTQ1OCwiZXhwIjoxNzYzMDYwMjU4LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.fNlk5LnLAGUEZ7W-t28Ug3Dp8-RcChx_TSKywQmBWs4	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 13:57:38.701-05	2025-11-13 13:57:38.695-05	2025-11-06 13:57:43.032-05	f
453e74b5-517d-4786-8186-e06bfea0214e	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTU1OSwiZXhwIjoxNzYzMDYwMzU5LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.PW2L60DgVFG-3unEseFLP_rHXZkeY6-NSPQed88XYaQ	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 13:59:19.209-05	2025-11-13 13:59:19.205-05	2025-11-06 13:59:27.791-05	f
e7689d76-1a29-4cd1-a471-34b2b8ccb203	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTYxNiwiZXhwIjoxNzYzMDYwNDE2LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.KsrWu46aliWnUfkkTj0e5pMqG5HCwnYEuML7hw-azTI	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 14:00:16.071-05	2025-11-13 14:00:16.068-05	2025-11-06 14:00:24.157-05	f
06134894-bd22-4e6c-9c30-096ac7feb118	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjUxMjg2MywiZXhwIjoxNzYzMTE3NjYzLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.DmdjLZoSZZAncKoZwcGwPf-GRpCHepFfUkY3LHjBknw	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 05:54:23.677-05	2025-11-14 05:54:23.675-05	2025-11-07 05:54:55.896-05	f
ffc685da-6893-4c65-8a19-d8d284e17a22	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTY0MywiZXhwIjoxNzYzMDYwNDQzLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.Fvui85X2-h8QthwRM7UtAvnfqeJb0raPiAQk6JHYrTc	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 14:00:43.627-05	2025-11-13 14:00:43.626-05	2025-11-06 14:00:51.439-05	f
8b96fe5a-e73c-4fdc-b9a1-a421850f3b4b	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTY2OSwiZXhwIjoxNzYzMDYwNDY5LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.GUlJ-WV6rQvQhHL55dGt0t2O4-bmqO-8OMf32i0hvow	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 14:01:09.01-05	2025-11-13 14:01:09.008-05	2025-11-06 14:01:18.711-05	f
6087cb4c-2bf0-424d-8dca-30a8000d913a	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTY4NSwiZXhwIjoxNzYzMDYwNDg1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.irpLT18_v4fYYosouh0qxfBLYUgc0yuQE_HVmNr2-S8	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 14:01:25.073-05	2025-11-13 14:01:25.071-05	2025-11-06 14:01:32.709-05	f
06156538-f43d-48aa-8570-c633c8ef8d4b	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTc1MywiZXhwIjoxNzYzMDYwNTUzLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.YhYybt_WTMd7dcQ03SshDEy1dkJzdHnROWY5i2OGIxU	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 14:02:33.5-05	2025-11-13 14:02:33.499-05	2025-11-06 14:02:41.933-05	f
e2a75af1-f0ed-4e9e-bcb9-f27edfc1ba11	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NTc2OSwiZXhwIjoxNzYzMDYwNTY5LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.XS5wA9U-2oecKh8L79SEBWA7oMpwaYQaq7nqYIJTt7Q	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 14:02:49.515-05	2025-11-13 14:02:49.514-05	2025-11-06 14:02:55.594-05	f
4f944f8a-1b17-40db-ab59-ab4b22dc62fb	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NjM1OSwiZXhwIjoxNzYzMDYxMTU5LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.SNgHIYpY8NpxULYdug1FfOdngoCrKV2CUnqzeDxpReQ	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 14:12:39.343-05	2025-11-13 14:12:39.342-05	2025-11-06 14:12:51.121-05	f
ae421168-3313-424c-86c7-36e1fc791dd6	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NjM3NywiZXhwIjoxNzYzMDYxMTc3LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.13oogSQpPgfdxllZVwRRpMkbww2E5DEmfco9gKxpm30	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 14:12:57.17-05	2025-11-13 14:12:57.169-05	2025-11-06 14:13:01.155-05	f
5294634b-5539-41c2-8cec-521e974434d1	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ1NjM5MiwiZXhwIjoxNzYzMDYxMTkyLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.6dkImj7ltLVPe9N-b6YnMJQlTLmjKptJXRLkGj8fGus	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 14:13:12.976-05	2025-11-13 14:13:12.975-05	2025-11-06 14:13:21.309-05	f
acc458be-c1eb-4c9c-b9a4-eb85ef9cdcbf	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ2NTk0NiwiZXhwIjoxNzYzMDcwNzQ2LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.mDQU1yAkNyeNDIfjxwAqirsO3K6YRk_2vu8-wH-sCLs	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 15:37:45.778-05	2025-11-13 16:52:26.842-05	2025-11-06 17:39:33.196-05	f
7eeff05a-f01d-4fba-b04a-061e610f360d	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ2ODc5NiwiZXhwIjoxNzYzMDczNTk2LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.M9tY7p4UX0hzdULTipO-uqc65FbTye9mc2QPWh6LBhI	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 17:39:56.471-05	2025-11-13 17:39:56.469-05	2025-11-06 17:40:01.596-05	f
ab6b9fc5-0c25-4a3a-9e78-464eead3f9e2	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ3MTg1MCwiZXhwIjoxNzYzMDc2NjUwLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.xiuMMzMWgGF5BuZFl1Rg_1drH-VwwrmVkuC3Os7TfCs	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 18:30:50.308-05	2025-11-13 18:30:50.307-05	2025-11-06 18:32:05.079-05	f
2b970300-73a4-4d15-af16-59e31d8889ba	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ3OTUwNywiZXhwIjoxNzYzMDg0MzA3LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.LZLlyXIU_Xf4WSrFSm5hOQzxYewmFRp68y8LruA8zCM	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-06 20:38:27.222-05	2025-11-13 20:38:27.22-05	2025-11-06 21:28:01.434-05	f
46ac739c-5e2f-4c0e-be40-cdf63d06790d	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ4Njk2NywiZXhwIjoxNzYzMDkxNzY3LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.O31suhD3nTeRTvsRTTlqrBq5sCj1oJ4TyJQ3EOrPuvg	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-06 22:42:47.503-05	2025-11-13 22:42:47.496-05	2025-11-06 22:42:56.081-05	f
eafd887b-9ab1-44f5-864b-5ae5e9ca4cb5	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjQ5NDUwMiwiZXhwIjoxNzYzMDk5MzAyLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.sEdo0yaigoQdjOWE7BAXnaXjvVOrBDt_XLfLN3_hdwM	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 00:48:22.535-05	2025-11-14 00:48:22.533-05	2025-11-07 00:48:26.973-05	f
06730483-402d-4384-8a67-ec8b2c7f6899	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjUwNzAzMiwiZXhwIjoxNzYzMTExODMyLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.m6nmt4vhEs4DS9OtHnBeN5F1HcZ-zKmbNzFa5hezvTM	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 04:17:12.676-05	2025-11-14 04:17:12.674-05	2025-11-07 04:17:17.189-05	f
91c9d8af-7533-44ad-b02e-870167984ba9	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjUwOTU4OSwiZXhwIjoxNzYzMTE0Mzg5LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.HxQRwjrYpfkB0rACzNqxUkQuS2i8qO0P82Qv2y0hJdI	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-11-07 04:59:49.281-05	2025-11-14 04:59:49.279-05	2025-11-07 05:00:02.909-05	f
4d19734b-edf2-4fb0-9a5d-cdbe7e3bf89c	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjkxNzkwNSwiZXhwIjoxNzYzNTIyNzA1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.bnGD7xveEe4430K0q9UOdjzBf6gexqcCYGlGSAhbIl4	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 22:25:05.77-05	2025-11-18 22:25:05.769-05	2025-11-11 22:29:49.882-05	f
a13fec75-002d-4512-8d30-5599b23f7cac	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjkxODE5OCwiZXhwIjoxNzYzNTIyOTk4LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.41y18lb2N6gAIubeCVgc2H4DUmm9FLiPxgQD5WLibj4	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 22:29:58.497-05	2025-11-18 22:29:58.495-05	2025-11-11 22:30:43.425-05	f
d08c996b-bf15-4b16-97ab-587273d98855	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjk0OTY3OSwiZXhwIjoxNzYzNTU0NDc5LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.3vy6AGzo7vyDueBcb2laH8RPByTEkCjpLlDHTXCH1HI	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 06:12:40.808-05	2025-11-19 07:14:39.352-05	2025-11-12 07:53:33.207-05	f
15a8393a-46e8-45d4-96fb-80a42afc7392	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjUzMTYwMCwiZXhwIjoxNzYzMTM2NDAwLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.yjxeAWKRvgXEnaA8HjQBwlCczIpSXdG30zZznr_GufA	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 10:05:54.286-05	2025-11-14 11:06:40.017-05	2025-11-07 11:08:17.462-05	f
00c49e2d-1a57-4648-ba70-c0815b3fd1a5	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjUzMTk2NywiZXhwIjoxNzYzMTM2NzY3LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.HHMXpEqJtyZnrtyyGen4mDr2QW1k_E8Ptf06CSrdeRI	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 11:12:47.287-05	2025-11-14 11:12:47.285-05	2025-11-07 11:41:31.847-05	f
8f63c688-696c-475e-bb03-c75b326aa393	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjk3MTg3MiwiZXhwIjoxNzYzNTc2NjcyLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.kHqGJM9_lOFAX6eOeFLBhvRUsQE2iuhxriV81kHzGew	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 11:23:52.577-05	2025-11-19 13:24:32.199-05	2025-11-12 13:33:41.7-05	f
92c87d5f-3bb9-4ea8-a8ac-4e89a6932b6c	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MzAwOTk2MywiZXhwIjoxNzYzNjE0NzYzLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.n48GlZ-nVhVZiGnhaotVuymbkDlBtj34B9X7gps-CwI	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 22:58:54.681-05	2025-11-19 23:59:23.581-05	\N	t
4fad33d2-5588-4737-a9fc-01e84ff1e7bb	6779138d-0e55-4344-af31-07cd07bfaca1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Nzc5MTM4ZC0wZTU1LTQzNDQtYWYzMS0wN2NkMDdiZmFjYTEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjkxODI5NSwiZXhwIjoxNzYzNTIzMDk1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.mWvkvZWeJADpN6Y1gsKQQuomiZxENPhbHoOWSuFf6Uc	\N	\N	2025-11-11 22:31:35.509-05	2025-11-18 22:31:35.507-05	2025-11-11 22:32:34.86-05	f
e268b066-85e1-4106-974c-051dd48ba614	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjU0MTc5NSwiZXhwIjoxNzYzMTQ2NTk1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.jCB_PNGf2rZ14e5VN1VK1xAs4KWEEgs6bPvMY6NbUa8	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 12:55:06.097-05	2025-11-14 13:56:35.614-05	2025-11-07 14:07:32.262-05	f
83f0a324-ae95-4e17-941e-4c190cce9b69	3067116a-b810-4148-8b98-fe9940422aeb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMDY3MTE2YS1iODEwLTQxNDgtOGI5OC1mZTk5NDA0MjJhZWIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjk1MjAyOSwiZXhwIjoxNzYzNTU2ODI5LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.Eax2IDNCY_cMm8BL39AyhK7QIW946syb_n_Vzqh8JDk	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 07:53:49.775-05	2025-11-19 07:53:49.772-05	2025-11-12 07:55:16.175-05	f
20fb9b7e-fb7d-416d-8587-27c7a2e1022d	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjk3MjQzMSwiZXhwIjoxNzYzNTc3MjMxLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.Pwuyz6t42O2JBccYAVfT2ndx5Sl01rwCCYEdzPI89VA	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:33:51.166-05	2025-11-19 13:33:51.16-05	2025-11-12 13:39:59.823-05	f
0971ca7b-78fa-45c6-a046-b5d202ddd596	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjU1MDI5MCwiZXhwIjoxNzYzMTU1MDkwLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.oBXkjnEOaVnzTHjo9NkV4xA3b2knCc41w7rscHVdqk8	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 14:09:56.703-05	2025-11-14 16:18:10.329-05	2025-11-07 17:17:19.664-05	f
4cb5c22d-6e84-4fa9-8419-d8272c988d81	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjU1Mzg3NywiZXhwIjoxNzYzMTU4Njc3LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.mDoFP51kR7dwTjgGLMNC-aBBQ6HOkbxatICd1-4c_nI	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:17:57.146-05	2025-11-14 17:17:57.144-05	2025-11-07 17:18:27.305-05	f
624024c4-d83c-4606-957b-2764d4d18d3e	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjU1MzkxNCwiZXhwIjoxNzYzMTU4NzE0LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.XsMf36C6Q052BgA2Lk9u4OamqW2GqexwlbfntbpegS4	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:18:34.121-05	2025-11-14 17:18:34.119-05	2025-11-07 17:25:51.443-05	f
9832addd-b1e3-4843-ac66-fdf98cad5279	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjU1NDM3NSwiZXhwIjoxNzYzMTU5MTc1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.Xp-rc9ajeom9O-Y5kJi6uofNy2b__6UpyZMQj9h_kHk	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:26:15.128-05	2025-11-14 17:26:15.126-05	\N	t
b0ca888b-5b26-4459-aec0-88ba7ca078aa	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjU1NDcwOCwiZXhwIjoxNzYzMTU5NTA4LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.AzX6DEtB8mPVhSCAScSE7PnIamH_MEVfjeWU7xGZios	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:31:48.672-05	2025-11-14 17:31:48.67-05	2025-11-07 17:37:15.628-05	f
3d5ca6c8-5015-4702-934d-dcf2ac96ded4	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjU1NTA2OSwiZXhwIjoxNzYzMTU5ODY5LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.j-l8ud2aaFUGKyzvEW1btlwEgEI5aR-06ARyox0arZs	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 17:37:49.934-05	2025-11-14 17:37:49.933-05	2025-11-07 17:43:49.103-05	f
01757afc-5fe3-4943-ad25-dc4bd517461e	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjU1NjY5NCwiZXhwIjoxNzYzMTYxNDk0LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.c04AGrV5lRPQPyiMYQpwDGFJFmTuVwOsgS-C6jPROYs	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 18:04:54.803-05	2025-11-14 18:04:54.801-05	2025-11-07 18:05:02.545-05	f
85aadb64-e431-466a-807e-861f914d033b	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjU1NjcwNywiZXhwIjoxNzYzMTYxNTA3LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.mWgS_vy-d4LxfCd0Y1-yudsHtvA6G-hkWQAcrc3mlyU	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 18:05:07.959-05	2025-11-14 18:05:07.956-05	2025-11-07 18:20:31.382-05	f
021dc0c1-0388-4aee-b4e1-1cd5c1ae0d2e	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjU2MTkxMCwiZXhwIjoxNzYzMTY2NzEwLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.HQhuVEBLuaGdKvdEMkUFnx9yzJtsobaBp46P2oqIL2E	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 18:20:45.981-05	2025-11-14 19:31:50.702-05	2025-11-07 19:50:21.917-05	f
d37f36f7-2d8b-47af-9994-4ee132b1ece5	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjU2MzE0MCwiZXhwIjoxNzYzMTY3OTQwLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.qEyidmb0cmPnwTxIN3SsrTKuPvsjY503dhRRwKfONhA	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 19:52:20.317-05	2025-11-14 19:52:20.315-05	2025-11-07 19:53:03.902-05	f
4271fbcc-9ff5-4a46-b4e8-1152390ba5d6	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjczMzUyOCwiZXhwIjoxNzYzMzM4MzI4LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.0DFJUOD-c-O97jX9Rq-zW-a2wK2iWwee_GLEV2TtSrY	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-07 19:53:11.428-05	2025-11-16 19:12:08.587-05	\N	t
f7212675-34d2-43b4-8979-aeb5406ca62c	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjczNzAxNCwiZXhwIjoxNzYzMzQxODE0LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.We5lHBaZJcYKsmNzCHCfNEuRcmvmkZW_Ghkd_w7LG3I	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-09 20:10:14.267-05	2025-11-16 20:10:14.266-05	2025-11-09 20:21:43.892-05	f
8dec0a5a-4395-4604-a3ec-deeefc3e017f	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjkxODM2NCwiZXhwIjoxNzYzNTIzMTY0LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0._VZmnsPxz2WxHODn7H2P1RS9J8aqLL8A484Tcbyyqrk	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 22:32:44.097-05	2025-11-18 22:32:44.096-05	2025-11-11 23:26:26.267-05	f
3c7f781f-0153-4ffc-802f-d980fb71780a	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjc0OTA0OSwiZXhwIjoxNzYzMzUzODQ5LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.HeC_3abHU8c8YVnS6QUQuY__FFIBt3gm2zWlXqGU5xQ	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-09 20:21:52.621-05	2025-11-16 23:30:49.171-05	2025-11-10 00:26:29.807-05	f
4b34f148-ae0f-4e1e-a4ad-78e87866ab21	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjc4ODA3NywiZXhwIjoxNzYzMzkyODc3LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.L-vowLA3mZk52gAKZ82qOiK_onRW2f3PzPpCc-CXAzw	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-10 00:26:37.378-05	2025-11-17 10:21:17.077-05	2025-11-10 11:04:33.358-05	f
6877eb2c-a49b-46fb-bd37-54835fd722a6	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjgxMzU1MSwiZXhwIjoxNzYzNDE4MzUxLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.--8HcJUcpV2hae7bWffBSkBjabs9Gypb_e2c4MyPSuc	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-10 11:04:41.036-05	2025-11-17 17:25:51.125-05	2025-11-10 17:32:29.798-05	f
c9db496f-d51e-44f4-ab07-d601d67e8e8e	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjg3MjgyNCwiZXhwIjoxNzYzNDc3NjI0LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.gbDaMjEveBDmh-Woj-PnbBjG4nciXRfcD2X62dmjZac	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-10 22:52:16.416-05	2025-11-18 09:53:44.9-05	2025-11-11 09:53:59.288-05	f
54fd949f-db39-4e31-8cda-0ce81e142483	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjg3MzAxOCwiZXhwIjoxNzYzNDc3ODE4LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.foBV9jOF6RuRZv3M9BfQgHDPSHmgIARXoUmImiDmBOU	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 09:56:58.207-05	2025-11-18 09:56:58.205-05	2025-11-11 09:58:23.9-05	f
775175df-644a-4c84-9567-c7765a88143a	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjg3MzExNSwiZXhwIjoxNzYzNDc3OTE1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.Gmm-kzmi-PayfPoEG5J5A0Lge14ECQCScwNfsharQ3o	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 09:58:35.075-05	2025-11-18 09:58:35.072-05	2025-11-11 10:02:45.929-05	f
420fdb55-76cb-44cf-ba24-7c847a74c2e2	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjg3MzQyNiwiZXhwIjoxNzYzNDc4MjI2LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.Xa_TyAy6Fb5WsxpBCylKnqlK2KLEccoh8eB7SZdsjlU	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:03:46.76-05	2025-11-18 10:03:46.758-05	2025-11-11 10:04:11.119-05	f
e8e81fcc-6952-4812-9a1f-b19155d17c1a	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjg3MzQ2MCwiZXhwIjoxNzYzNDc4MjYwLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.DP1a35-O3WGNQX9xT60f-nwBm2JEbUxhoA0etPNo3TI	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:04:20.06-05	2025-11-18 10:04:20.059-05	2025-11-11 10:06:15.558-05	f
bd53379a-4fc4-47db-8e14-395175b8a28f	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjg3MzU4NSwiZXhwIjoxNzYzNDc4Mzg1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.Q7Iyi0rFx7v9OrGsHkUCyF7R7TTCpinZHJGL2XDPklo	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:06:25.741-05	2025-11-18 10:06:25.74-05	\N	t
4677a5d2-f99b-416e-a90c-e9cdbb376c5a	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjg3MzY1NCwiZXhwIjoxNzYzNDc4NDU0LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.MSpatGLJsBjSpoxqim6BL1CzwUcqRB_oFWKCe37ISFk	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:07:34.792-05	2025-11-18 10:07:34.786-05	2025-11-11 10:14:03.997-05	f
262577a5-e9ad-402b-8c19-1324598ef96c	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjg3NDA1MSwiZXhwIjoxNzYzNDc4ODUxLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.vCmR11fHLJPPS9RYzg-XKz44uAEhp7mvvx_eSNt_5pY	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:14:11.218-05	2025-11-18 10:14:11.215-05	2025-11-11 10:17:40.61-05	f
56223864-48dd-4c24-aee0-b6640eb07c5b	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjg3NDI2OSwiZXhwIjoxNzYzNDc5MDY5LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.B3Rc4Al8Ya1diBa4QE8FZn-VYKysxKJGp5aCGZ1l3Sc	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:17:49.371-05	2025-11-18 10:17:49.369-05	2025-11-11 10:18:06.49-05	f
57e31124-e01a-4bdc-be61-351732a1db97	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjg3NDI5NywiZXhwIjoxNzYzNDc5MDk3LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.3FimM1QFzwCVdyfyFe_RLb68xGENv5Aguk9AdPlT0QE	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:18:17.891-05	2025-11-18 10:18:17.889-05	2025-11-11 10:22:55.727-05	f
ee64757a-a523-4d08-b800-86d3e7c95b93	4bf22bde-7860-43a9-a20e-91a839a15414	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmYyMmJkZS03ODYwLTQzYTktYTIwZS05MWE4MzlhMTU0MTQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjg3NDYyOSwiZXhwIjoxNzYzNDc5NDI5LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.rVQJ527Z8PvbVb3mf1xN3HBnERj1hJGFMVom40wweeI	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:23:49.624-05	2025-11-18 10:23:49.614-05	2025-11-11 10:24:04.179-05	f
21a59ac7-8a12-4489-987f-f46d2885afc7	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjg5MDg0MiwiZXhwIjoxNzYzNDk1NjQyLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.Nnt3bK9rFlvSpc_m2BzSIUM-kJ16Iw0XWn-aCBD5j6M	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 12:11:28.023-05	2025-11-18 14:54:02.009-05	2025-11-11 14:56:09.391-05	f
37e494ad-1557-49e2-b71e-6ac7225eccf3	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjg4MTAxMiwiZXhwIjoxNzYzNDg1ODEyLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.1h1PSEc0ORVpio2lynRzAMDJz9HRlw2fHH4gesfwH8Y	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 10:24:12.248-05	2025-11-18 12:10:12.39-05	2025-11-11 12:10:28.324-05	f
ae5c5e0a-f73a-4cd9-8c32-23603975d884	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjg4MTAzNywiZXhwIjoxNzYzNDg1ODM3LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.STzRghBtZ7Cr5JzTymEeMHJs-jSTyXpz1v5Po06gZs0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 12:10:37.412-05	2025-11-18 12:10:37.408-05	2025-11-11 12:10:48.402-05	f
5d98594f-f72d-442a-a7cb-be5a74321370	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2MjkyMTU5NSwiZXhwIjoxNzYzNTI2Mzk1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.QrWVKnGwUvxNwHWWneDJ7UJIt3IU6YfD0cbc0JIU-h0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-11 23:26:35.839-05	2025-11-18 23:26:35.838-05	2025-11-11 23:28:11.809-05	f
444c29c6-ac29-41fc-b7da-6d63cc51c59f	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjk1OTM2NywiZXhwIjoxNzYzNTY0MTY3LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.-ednJR7Y4A9HRUB-hhadJZ7TGmqb0P73HnFgTAyzjw0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 07:55:29.935-05	2025-11-19 09:56:07.46-05	2025-11-12 10:05:29.071-05	f
30640fc5-6054-453f-90a3-059ac9945e0f	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjk3NzMzMCwiZXhwIjoxNzYzNTgyMTMwLCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0._vkOFSvt3Ae7_YN1R4jzMmA6q3PnTd1r1SRpmYOYrHs	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 13:40:10.328-05	2025-11-19 14:55:30.689-05	\N	t
0e7e7778-b71d-4fe9-9c10-82f0b1988fc7	57a1a83f-5242-4d95-ad55-82dc6655b45c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1N2ExYTgzZi01MjQyLTRkOTUtYWQ1NS04MmRjNjY1NWI0NWMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc2Mjk4NTUxNSwiZXhwIjoxNzYzNTkwMzE1LCJhdWQiOiJzaWdjZXJoLWZyb250ZW5kIiwiaXNzIjoic2lnY2VyaC1iYWNrZW5kIn0.z5ZgwCM5iDNdWmV_Lb4h3hYxJIIIVeUAeBDzPp_7RMY	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-11-12 14:55:44.094-05	2025-11-19 17:11:55.832-05	\N	t
\.


--
-- Data for Name: solicitud; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitud (id, numeroexpediente, estudiante_id, tiposolicitud_id, modalidadentrega, direccionentrega, numeroseguimiento, estado, prioridad, pago_id, certificado_id, fechasolicitud, fechavalidacionpago, fechainicioproceso, fechageneracioncertificado, fechafirma, fechaentrega, fecharechazo, motivorechazo, observaciones, usuariosolicitud_id, usuariovalidacionpago_id, usuariogeneracion_id, usuariofirma_id, usuarioentrega_id, fechaactualizacion) FROM stdin;
69060e10-2b55-4a8e-b902-393dbeb31174	EXP-2025-000003	a106f15f-9e22-4204-9a48-b33d63bc9961	9ee56a01-2e6b-41dd-a475-90a4845ac405	\N	\N	S-2025-000003	REGISTRADA	NORMAL	\N	\N	2025-11-07 07:42:36.829-05	\N	2025-11-07 10:50:23.346-05	\N	\N	\N	\N	\N	{"datosAcademicos":{"departamento":"14","provincia":"1401","distrito":"140105","nombreColegio":"CDDVDSGV","ultimoAnioCursado":1993,"nivel":"SECUNDARIA"},"contacto":{"celular":"987867886","email":null},"motivoSolicitud":"JUBILACION","esApoderado":true,"datosApoderado":{"tipoDocumento":"DNI","numeroDocumento":"76868768","nombres":"Edard","apellidoPaterno":"TYTRGFDG","apellidoMaterno":"Michael","relacionConEstudiante":"APODERADO"}}	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	\N	\N	2025-11-07 10:50:23.439524-05
982e2774-101e-4650-9f48-4d35c26fc278	EXP-2025-000008	7ee515b9-4934-4a83-b2ee-a7dadde3d5fb	9ee56a01-2e6b-41dd-a475-90a4845ac405	\N	\N	S-2025-000008	ACTA_ENCONTRADA_PENDIENTE_PAGO	NORMAL	\N	\N	2025-11-07 09:38:15.784-05	\N	2025-11-07 11:43:15.356-05	\N	\N	\N	\N	\N	{"datosAcademicos":{"departamento":"20","provincia":"2001","distrito":"200101","nombreColegio":"dsgsdgsd","ultimoAnioCursado":1997,"nivel":"SECUNDARIA"},"contacto":{"celular":"987976979","email":null},"motivoSolicitud":"TRAMITE_LABORAL","esApoderado":false,"datosApoderado":null,"busquedaActa":{"fechaBusqueda":"2025-11-07T16:41:19.167Z","resultado":"ENCONTRADA","ubicacionFisica":"estaante 4","observaciones":null}}	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	\N	\N	2025-11-07 11:57:47.457212-05
c8fb92c5-4227-447c-b5bb-778e6d2083d0	EXP-2025-000001	2551e254-de04-43d2-85f4-9db0f2967d0d	9ee56a01-2e6b-41dd-a475-90a4845ac405	\N	\N	S-2025-000001	ACTA_NO_ENCONTRADA	NORMAL	\N	\N	2025-11-07 01:40:11.039-05	\N	2025-11-07 10:50:23.346-05	\N	\N	\N	2025-11-07 11:21:29.9-05	Acta física no encontrada en archivo	{"datosAcademicos":{"departamento":"","provincia":"","distrito":"","nombreColegio":"Información no disponible (recuperar manualmente)","ultimoAnioCursado":0,"nivel":""},"contacto":{"celular":"","email":null},"motivoSolicitud":"CONTINUIDAD_ESTUDIOS","esApoderado":false,"datosApoderado":null,"busquedaActa":{"fechaBusqueda":"2025-11-07T16:21:29.903Z","resultado":"NO_ENCONTRADA","motivoNoEncontrada":"no se encontro","observaciones":"Recuperado de texto plano"}}	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	\N	\N	2025-11-07 11:32:16.081529-05
8646423a-c656-4b12-ac2c-bf5220dd75c2	EXP-2025-000004	0242c567-bea8-44e2-bb3f-87a5784a60a8	9ee56a01-2e6b-41dd-a475-90a4845ac405	\N	\N	S-2025-000004	DERIVADO_A_EDITOR	NORMAL	\N	\N	2025-11-07 08:25:20.885-05	\N	2025-11-07 11:43:15.448-05	\N	\N	\N	\N	\N	{"datosAcademicos":{"departamento":"","provincia":"","distrito":"","nombreColegio":"Información no disponible (recuperar manualmente)","ultimoAnioCursado":0,"nivel":""},"contacto":{"celular":"","email":null},"motivoSolicitud":"CONTINUIDAD_ESTUDIOS","esApoderado":false,"datosApoderado":null,"busquedaActa":{"fechaBusqueda":"2025-11-07T16:06:46.830Z","resultado":"ENCONTRADA","ubicacionFisica":"estaante 4","observaciones":"Recuperado de texto plano"}}	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	\N	\N	2025-11-07 11:57:47.512636-05
f7ad112b-4ab4-4caf-acfd-b7c99573f1db	EXP-2025-000006	f0059948-7954-4ed8-bc16-d65664781e71	9ee56a01-2e6b-41dd-a475-90a4845ac405	\N	\N	S-2025-000006	LISTO_PARA_OCR	NORMAL	60863343-c121-43c0-9421-c7efee523c52	\N	2025-11-07 08:47:28.832-05	2025-11-07 11:57:47.503-05	2025-11-07 11:43:15.446-05	\N	\N	\N	\N	\N	Editor ha iniciado la búsqueda del acta física	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	\N	\N	2025-11-11 22:09:25.984751-05
a243802d-0c0f-4a06-a509-ae242ad08775	EXP-2025-000007	3d54c7bf-2840-44c0-a19f-e9642427c331	9ee56a01-2e6b-41dd-a475-90a4845ac405	\N	\N	S-2025-000007	LISTO_PARA_OCR	NORMAL	6b68608a-df41-4f7b-b56d-5ee1474cbd76	\N	2025-11-07 08:55:46.219-05	2025-11-07 12:03:35.145-05	2025-11-07 11:43:15.443-05	\N	\N	\N	\N	\N	Editor ha iniciado la búsqueda del acta física	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	\N	\N	2025-11-11 22:09:25.984751-05
174d7c2e-05b5-43b6-8b20-d02643f7d535	EXP-2025-000010	f999749f-0d61-43d0-9446-83bf57745ae2	9ee56a01-2e6b-41dd-a475-90a4845ac405	\N	\N	S-2025-000010	DERIVADO_A_EDITOR	NORMAL	\N	\N	2025-11-10 22:26:08.458-05	\N	2025-11-11 10:03:15.467-05	\N	\N	\N	\N	\N	{"datosAcademicos":{"departamento":"20","provincia":"2001","distrito":"200101","nombreColegio":"COLEGIO GLORIOSO","ultimoAnioCursado":1994,"nivel":"PRIMARIA"},"contacto":{"celular":"997778787","email":"rodrigoakameluriarte@gmail.com"},"motivoSolicitud":"JUBILACION","esApoderado":false,"datosApoderado":null}	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	\N	\N	2025-11-11 10:03:15.470952-05
a13d3682-c315-4a60-8373-41c5b896e91f	EXP-2025-000002	db66c575-12cc-483c-9443-71dabb750e2d	9ee56a01-2e6b-41dd-a475-90a4845ac405	\N	\N	S-2025-000002	LISTO_PARA_OCR	NORMAL	4f48682d-0dad-479c-a389-2d5b1ff38aec	\N	2025-11-07 01:47:24.747-05	2025-11-07 12:04:05.01-05	2025-11-07 10:50:23.346-05	\N	\N	\N	\N	\N	{"datosAcademicos":{"departamento":"","provincia":"","distrito":"","nombreColegio":"Información no disponible (recuperar manualmente)","ultimoAnioCursado":0,"nivel":""},"contacto":{"celular":"","email":null},"motivoSolicitud":"CONTINUIDAD_ESTUDIOS","esApoderado":false,"datosApoderado":null,"busquedaActa":{"fechaBusqueda":"2025-11-07T16:14:20.612Z","resultado":"ENCONTRADA","ubicacionFisica":"estaante 4","observaciones":"Recuperado de texto plano"}}	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	\N	\N	2025-11-11 22:09:25.984751-05
cfb3fdbf-0abc-4c95-95cd-3d087c8e034b	EXP-2025-000009	514e0b37-4d14-4f8f-b47e-ab99321fc3c9	9ee56a01-2e6b-41dd-a475-90a4845ac405	\N	\N	S-2025-000009	LISTO_PARA_OCR	NORMAL	f53cd41c-65b0-4d49-a1be-5000b928dbd4	\N	2025-11-07 12:22:09.659-05	2025-11-07 12:26:35.761-05	2025-11-07 12:23:30.063-05	\N	\N	\N	\N	\N	{"datosAcademicos":{"departamento":"02","provincia":"0216","distrito":"021604","nombreColegio":"vcvdvdssvdd","ultimoAnioCursado":1995,"nivel":"SECUNDARIA"},"contacto":{"celular":"998909098","email":null},"motivoSolicitud":"CONTINUIDAD_ESTUDIOS","esApoderado":false,"datosApoderado":null,"busquedaActa":{"fechaBusqueda":"2025-11-07T17:25:12.101Z","resultado":"ENCONTRADA","ubicacionFisica":"estaante 4","observaciones":null}}	\N	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	\N	\N	2025-11-11 22:09:25.984751-05
bad399b0-2427-49f5-bc70-f996f5d59702	EXP-2025-000005	89452da3-386f-43a2-894f-5c2677318857	9ee56a01-2e6b-41dd-a475-90a4845ac405	\N	\N	S-2025-000005	LISTO_PARA_OCR	NORMAL	bcefee94-f049-4414-96bc-3a4e42cda04d	\N	2025-11-07 08:35:31.039-05	2025-11-07 13:14:14.527-05	2025-11-07 10:50:23.346-05	\N	\N	\N	2025-11-07 11:20:18.024-05	Acta física no encontrada en archivo	{"actaFisica":{"fechaSubida":"2025-11-07T18:14:14.527Z","anioLectivo":1995,"grado":"Quinto Grado","seccion":"A","turno":"MAÑANA","tipoEvaluacion":"FINAL","ubicacionFisica":"Archivo-undefined-undefined-A","colegioOrigen":"I.E. Prueba","archivoUrl":null},"resultadoOCR":{"totalEstudiantes":24,"estudiantes":[{"numero":1,"codigo":"EST-1995-0001","tipo":"P","apellidoPaterno":"García","apellidoMaterno":"Flores","nombres":"Carlos Alberto","sexo":"F","notas":[17,15,17,10,17,13,11,15,16,19,14,20],"comportamiento":"A","asignaturasDesaprobadas":1,"situacionFinal":"D","observaciones":"1 asignaturas desaprobadas"},{"numero":2,"codigo":"EST-1995-0002","tipo":"P","apellidoPaterno":"Flores","apellidoMaterno":"Torres","nombres":"José Luis","sexo":"M","notas":[10,20,12,19,12,13,12,17,12,15,19,13],"comportamiento":"C","asignaturasDesaprobadas":1,"situacionFinal":"D","observaciones":"1 asignaturas desaprobadas"},{"numero":3,"codigo":"EST-1995-0003","tipo":"P","apellidoPaterno":"Sánchez","apellidoMaterno":"García","nombres":"Rosa María","sexo":"F","notas":[20,19,18,20,12,19,11,20,14,13,17,12],"comportamiento":"B","asignaturasDesaprobadas":0,"situacionFinal":"A"},{"numero":4,"codigo":"EST-1995-0004","tipo":"P","apellidoPaterno":"Torres","apellidoMaterno":"García","nombres":"Juan Carlos","sexo":"M","notas":[17,19,20,17,15,16,20,17,13,17,16,15],"comportamiento":"C","asignaturasDesaprobadas":0,"situacionFinal":"A"},{"numero":5,"codigo":"EST-1995-0005","tipo":"G","apellidoPaterno":"Martínez","apellidoMaterno":"Pérez","nombres":"Carmen Lucía","sexo":"F","notas":[11,11,14,19,13,18,15,10,10,13,10,16],"comportamiento":"B","asignaturasDesaprobadas":3,"situacionFinal":"D","observaciones":"3 asignaturas desaprobadas"},{"numero":6,"codigo":"EST-1995-0006","tipo":"G","apellidoPaterno":"Martínez","apellidoMaterno":"Martínez","nombres":"José Luis","sexo":"F","notas":[16,16,15,20,17,18,12,12,20,13,14,11],"comportamiento":"B","asignaturasDesaprobadas":0,"situacionFinal":"A"},{"numero":7,"codigo":"EST-1995-0007","tipo":"G","apellidoPaterno":"Torres","apellidoMaterno":"Ramírez","nombres":"María Elena","sexo":"M","notas":[16,15,14,10,16,13,15,20,10,18,13,16],"comportamiento":"C","asignaturasDesaprobadas":2,"situacionFinal":"D","observaciones":"2 asignaturas desaprobadas"},{"numero":8,"codigo":"EST-1995-0008","tipo":"P","apellidoPaterno":"García","apellidoMaterno":"González","nombres":"María Elena","sexo":"M","notas":[20,15,19,15,13,14,14,14,20,13,11,14],"comportamiento":"C","asignaturasDesaprobadas":0,"situacionFinal":"A"},{"numero":9,"codigo":"EST-1995-0009","tipo":"P","apellidoPaterno":"Flores","apellidoMaterno":"Rodríguez","nombres":"Pedro Miguel","sexo":"F","notas":[12,14,15,13,15,10,12,12,17,10,19,13],"comportamiento":"B","asignaturasDesaprobadas":2,"situacionFinal":"D","observaciones":"2 asignaturas desaprobadas"},{"numero":10,"codigo":"EST-1995-0010","tipo":"G","apellidoPaterno":"Flores","apellidoMaterno":"Martínez","nombres":"José Luis","sexo":"M","notas":[15,15,20,14,18,14,18,12,13,19,13,15],"comportamiento":"B","asignaturasDesaprobadas":0,"situacionFinal":"A"},{"numero":11,"codigo":"EST-1995-0011","tipo":"P","apellidoPaterno":"Ramírez","apellidoMaterno":"Ramírez","nombres":"Luis Fernando","sexo":"F","notas":[10,13,18,16,13,20,15,12,12,15,19,19],"comportamiento":"A","asignaturasDesaprobadas":1,"situacionFinal":"D","observaciones":"1 asignaturas desaprobadas"},{"numero":12,"codigo":"EST-1995-0012","tipo":"G","apellidoPaterno":"Ramírez","apellidoMaterno":"López","nombres":"Julia Isabel","sexo":"F","notas":[10,16,19,16,19,14,12,11,15,15,14,17],"comportamiento":"A","asignaturasDesaprobadas":1,"situacionFinal":"D","observaciones":"1 asignaturas desaprobadas"},{"numero":13,"codigo":"EST-1995-0013","tipo":"G","apellidoPaterno":"González","apellidoMaterno":"Pérez","nombres":"Julia Isabel","sexo":"M","notas":[15,11,11,17,12,17,18,12,15,10,14,17],"comportamiento":"A","asignaturasDesaprobadas":1,"situacionFinal":"D","observaciones":"1 asignaturas desaprobadas"},{"numero":14,"codigo":"EST-1995-0014","tipo":"P","apellidoPaterno":"López","apellidoMaterno":"Ramírez","nombres":"Carmen Lucía","sexo":"M","notas":[10,11,19,12,20,13,13,12,11,19,13,20],"comportamiento":"B","asignaturasDesaprobadas":1,"situacionFinal":"D","observaciones":"1 asignaturas desaprobadas"},{"numero":15,"codigo":"EST-1995-0015","tipo":"G","apellidoPaterno":"López","apellidoMaterno":"Ramírez","nombres":"María Elena","sexo":"F","notas":[17,10,18,13,18,19,17,17,17,18,17,18],"comportamiento":"C","asignaturasDesaprobadas":1,"situacionFinal":"D","observaciones":"1 asignaturas desaprobadas"},{"numero":16,"codigo":"EST-1995-0016","tipo":"P","apellidoPaterno":"Pérez","apellidoMaterno":"Ramírez","nombres":"Pedro Miguel","sexo":"F","notas":[17,10,15,10,19,18,20,12,16,13,18,13],"comportamiento":"A","asignaturasDesaprobadas":2,"situacionFinal":"D","observaciones":"2 asignaturas desaprobadas"},{"numero":17,"codigo":"EST-1995-0017","tipo":"G","apellidoPaterno":"Torres","apellidoMaterno":"Pérez","nombres":"Pedro Miguel","sexo":"M","notas":[10,12,10,15,15,11,10,17,11,15,20,13],"comportamiento":"A","asignaturasDesaprobadas":3,"situacionFinal":"D","observaciones":"3 asignaturas desaprobadas"},{"numero":18,"codigo":"EST-1995-0018","tipo":"G","apellidoPaterno":"Rodríguez","apellidoMaterno":"Martínez","nombres":"Julia Isabel","sexo":"F","notas":[10,10,19,16,14,14,20,10,20,10,18,20],"comportamiento":"C","asignaturasDesaprobadas":4,"situacionFinal":"R","observaciones":"4 asignaturas desaprobadas"},{"numero":19,"codigo":"EST-1995-0019","tipo":"P","apellidoPaterno":"Flores","apellidoMaterno":"Sánchez","nombres":"Carlos Alberto","sexo":"M","notas":[14,15,12,15,18,15,13,15,12,18,12,15],"comportamiento":"C","asignaturasDesaprobadas":0,"situacionFinal":"A"},{"numero":20,"codigo":"EST-1995-0020","tipo":"G","apellidoPaterno":"García","apellidoMaterno":"Martínez","nombres":"Ana Patricia","sexo":"F","notas":[10,14,13,12,11,12,17,15,14,14,12,17],"comportamiento":"B","asignaturasDesaprobadas":1,"situacionFinal":"D","observaciones":"1 asignaturas desaprobadas"},{"numero":21,"codigo":"EST-1995-0021","tipo":"P","apellidoPaterno":"Martínez","apellidoMaterno":"Martínez","nombres":"Ana Patricia","sexo":"F","notas":[11,16,20,18,13,11,10,12,16,19,20,10],"comportamiento":"A","asignaturasDesaprobadas":2,"situacionFinal":"D","observaciones":"2 asignaturas desaprobadas"},{"numero":22,"codigo":"EST-1995-0022","tipo":"G","apellidoPaterno":"López","apellidoMaterno":"García","nombres":"Pedro Miguel","sexo":"M","notas":[15,11,11,18,12,10,14,11,18,10,10,10],"comportamiento":"A","asignaturasDesaprobadas":4,"situacionFinal":"R","observaciones":"4 asignaturas desaprobadas"},{"numero":23,"codigo":"EST-1995-0023","tipo":"G","apellidoPaterno":"Rodríguez","apellidoMaterno":"García","nombres":"Julia Isabel","sexo":"M","notas":[12,19,20,19,20,16,12,12,18,18,12,13],"comportamiento":"C","asignaturasDesaprobadas":0,"situacionFinal":"A"},{"numero":24,"codigo":"EST-1995-0024","tipo":"G","apellidoPaterno":"Pérez","apellidoMaterno":"Sánchez","nombres":"Rosa María","sexo":"M","notas":[19,10,17,15,10,13,11,13,16,16,15,15],"comportamiento":"C","asignaturasDesaprobadas":2,"situacionFinal":"D","observaciones":"2 asignaturas desaprobadas"}],"metadataActa":{"anioLectivo":1995,"grado":"Quinto Grado","seccion":"A","turno":"MAÑANA","tipoEvaluacion":"FINAL","colegioOrigen":"I.E. Prueba"},"confianza":95,"advertencias":[],"fechaProcesamiento":"2025-11-07T18:50:35.786Z","procesadoPor":"57a1a83f-5242-4d95-ad55-82dc6655b45c"}}	\N	57a1a83f-5242-4d95-ad55-82dc6655b45c	57a1a83f-5242-4d95-ad55-82dc6655b45c	\N	\N	2025-11-07 13:50:35.810377-05
\.


--
-- Data for Name: solicitudhistorial; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitudhistorial (id, solicitud_id, estadoanterior, estadonuevo, observaciones, usuario_id, fecha) FROM stdin;
94385800-698e-467c-ab35-615da74155f9	a13d3682-c315-4a60-8373-41c5b896e91f	REGISTRADA	DERIVADO_A_EDITOR	\N	\N	2025-11-07 06:49:39.541472-05
5a84f486-c4b0-48dc-92f1-25a308be8c51	c8fb92c5-4227-447c-b5bb-778e6d2083d0	REGISTRADA	DERIVADO_A_EDITOR	\N	\N	2025-11-07 06:50:11.973887-05
dba13538-7255-452a-974f-d5074b1195d4	69060e10-2b55-4a8e-b902-393dbeb31174	EN_BUSQUEDA	REGISTRADA	\N	\N	2025-11-07 08:32:31.20774-05
25479aa4-1620-4983-85c8-982bfc50c947	bad399b0-2427-49f5-bc70-f996f5d59702	REGISTRADA	DERIVADO_A_EDITOR	\N	\N	2025-11-07 08:38:08.254416-05
bd274d11-c0a7-42c0-9de8-98fa75421a02	8646423a-c656-4b12-ac2c-bf5220dd75c2	EN_BUSQUEDA	ACTA_ENCONTRADA_PENDIENTE_PAGO	\N	\N	2025-11-07 11:06:46.830598-05
aae7246d-ee39-4711-b6cc-518c1d3a3ceb	8646423a-c656-4b12-ac2c-bf5220dd75c2	EN_BUSQUEDA	ACTA_ENCONTRADA_PENDIENTE_PAGO	Acta encontrada en: estaante 4	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 11:06:46.85-05
2af1e355-334f-4793-8d97-ea7681234a9d	a13d3682-c315-4a60-8373-41c5b896e91f	DERIVADO_A_EDITOR	EN_BUSQUEDA	\N	\N	2025-11-07 11:12:56.961149-05
b3bf810f-ff92-4c6b-b8e7-461236714297	a13d3682-c315-4a60-8373-41c5b896e91f	DERIVADO_A_EDITOR	EN_BUSQUEDA	Editor ha iniciado la búsqueda del acta física	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 11:12:56.986-05
80ec0b32-cf87-40ae-a928-37184376d301	a13d3682-c315-4a60-8373-41c5b896e91f	EN_BUSQUEDA	ACTA_ENCONTRADA_PENDIENTE_PAGO	\N	\N	2025-11-07 11:14:20.612659-05
b985ffac-a53d-4ee2-9273-f212d3ef3c2a	a13d3682-c315-4a60-8373-41c5b896e91f	EN_BUSQUEDA	ACTA_ENCONTRADA_PENDIENTE_PAGO	Acta encontrada en: estaante 4	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 11:14:20.627-05
90631d29-1302-4309-a284-182e7fd83835	c8fb92c5-4227-447c-b5bb-778e6d2083d0	DERIVADO_A_EDITOR	EN_BUSQUEDA	\N	\N	2025-11-07 11:18:50.81649-05
c3f6e3e9-8049-4991-82b5-7043dd7acdcd	c8fb92c5-4227-447c-b5bb-778e6d2083d0	DERIVADO_A_EDITOR	EN_BUSQUEDA	Editor ha iniciado la búsqueda del acta física	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 11:18:50.841-05
361361c1-e736-4204-8f2d-ef98484edd6b	bad399b0-2427-49f5-bc70-f996f5d59702	DERIVADO_A_EDITOR	EN_BUSQUEDA	\N	\N	2025-11-07 11:19:03.733151-05
c5126539-0177-451b-be76-e595adb29bc6	bad399b0-2427-49f5-bc70-f996f5d59702	DERIVADO_A_EDITOR	EN_BUSQUEDA	Editor ha iniciado la búsqueda del acta física	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 11:19:03.75-05
12e69436-f2cc-4bea-b973-3fbae45725a7	bad399b0-2427-49f5-bc70-f996f5d59702	EN_BUSQUEDA	ACTA_NO_ENCONTRADA	\N	\N	2025-11-07 11:20:18.027594-05
fb54b89a-2648-45ee-979d-a62539a3f4f6	bad399b0-2427-49f5-bc70-f996f5d59702	EN_BUSQUEDA	ACTA_NO_ENCONTRADA	Acta no encontrada. Motivo: no se ecnontro	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 11:20:18.033-05
8d79280f-3986-476b-9870-880c60d8ebeb	c8fb92c5-4227-447c-b5bb-778e6d2083d0	EN_BUSQUEDA	ACTA_NO_ENCONTRADA	\N	\N	2025-11-07 11:21:29.903247-05
7bcbf9a0-eddf-418b-992e-665f0f317a32	c8fb92c5-4227-447c-b5bb-778e6d2083d0	EN_BUSQUEDA	ACTA_NO_ENCONTRADA	Acta no encontrada. Motivo: no se encontro	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 11:21:29.928-05
2ff396ca-17df-4834-b4ce-356bb0dc21f3	982e2774-101e-4650-9f48-4d35c26fc278	REGISTRADA	DERIVADO_A_EDITOR	\N	\N	2025-11-07 11:37:31.208797-05
779ce9ec-f46f-4d17-86a4-fc1053bd24db	982e2774-101e-4650-9f48-4d35c26fc278	REGISTRADA	DERIVADO_A_EDITOR	Derivado automáticamente por script de migración	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 11:37:31.23-05
c0a092ef-ff57-4652-b759-1a3be03eb89e	a243802d-0c0f-4a06-a509-ae242ad08775	REGISTRADA	DERIVADO_A_EDITOR	\N	\N	2025-11-07 11:37:31.241007-05
39399f96-e949-43bc-b6e5-7923e6f847fb	a243802d-0c0f-4a06-a509-ae242ad08775	REGISTRADA	DERIVADO_A_EDITOR	Derivado automáticamente por script de migración	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 11:37:31.243-05
39ee1528-8e68-45c7-a4fd-287a83dbbddd	f7ad112b-4ab4-4caf-acfd-b7c99573f1db	REGISTRADA	DERIVADO_A_EDITOR	\N	\N	2025-11-07 11:37:31.246501-05
33db2d8f-142a-41d9-bfd9-59ccfc94907b	f7ad112b-4ab4-4caf-acfd-b7c99573f1db	REGISTRADA	DERIVADO_A_EDITOR	Derivado automáticamente por script de migración	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 11:37:31.249-05
280d2dec-3e49-464a-b787-92196b0ae9a2	f7ad112b-4ab4-4caf-acfd-b7c99573f1db	DERIVADO_A_EDITOR	EN_BUSQUEDA	\N	\N	2025-11-07 11:37:53.056779-05
b49eaf78-c790-4e49-93c1-9a32b0858b0d	f7ad112b-4ab4-4caf-acfd-b7c99573f1db	DERIVADO_A_EDITOR	EN_BUSQUEDA	Editor ha iniciado la búsqueda del acta física	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 11:37:53.073-05
5f2a9d95-1c97-4ece-ae49-a88f6cef0aad	a243802d-0c0f-4a06-a509-ae242ad08775	DERIVADO_A_EDITOR	EN_BUSQUEDA	\N	\N	2025-11-07 11:38:10.721438-05
fa59c8a8-87eb-48f4-b1fd-9556cf01b673	a243802d-0c0f-4a06-a509-ae242ad08775	DERIVADO_A_EDITOR	EN_BUSQUEDA	Editor ha iniciado la búsqueda del acta física	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 11:38:10.737-05
a470f201-1821-4563-bf84-cda51a9db061	982e2774-101e-4650-9f48-4d35c26fc278	DERIVADO_A_EDITOR	EN_BUSQUEDA	\N	\N	2025-11-07 11:39:59.307087-05
bf83d15e-82ed-41c3-a068-a3f7979074d4	982e2774-101e-4650-9f48-4d35c26fc278	DERIVADO_A_EDITOR	EN_BUSQUEDA	Editor ha iniciado la búsqueda del acta física	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 11:39:59.332-05
23aac9ea-4aa8-4975-a9b7-f2683621ba29	982e2774-101e-4650-9f48-4d35c26fc278	EN_BUSQUEDA	ACTA_ENCONTRADA_PENDIENTE_PAGO	\N	\N	2025-11-07 11:41:19.29817-05
3e7af5f3-2ab6-45d5-820e-eddc555706a1	982e2774-101e-4650-9f48-4d35c26fc278	EN_BUSQUEDA	ACTA_ENCONTRADA_PENDIENTE_PAGO	Acta encontrada en: estaante 4	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 11:41:19.323-05
31f1927d-24ca-40c9-b03d-7493ff2b7ff8	982e2774-101e-4650-9f48-4d35c26fc278	ACTA_ENCONTRADA_PENDIENTE_PAGO	DERIVADO_A_EDITOR	\N	\N	2025-11-07 11:43:15.418763-05
55523535-01e9-45b3-a7dd-a4d36e61e71c	f7ad112b-4ab4-4caf-acfd-b7c99573f1db	EN_BUSQUEDA	ACTA_ENCONTRADA_PENDIENTE_PAGO	\N	\N	2025-11-07 11:43:15.447914-05
7643792e-995f-4a96-a0cf-1808ccef78cc	982e2774-101e-4650-9f48-4d35c26fc278	DERIVADO_A_EDITOR	ACTA_ENCONTRADA_PENDIENTE_PAGO	\N	\N	2025-11-07 11:57:47.457212-05
78504244-fab1-497a-bd97-50fddebf96af	a243802d-0c0f-4a06-a509-ae242ad08775	EN_BUSQUEDA	ACTA_ENCONTRADA_PENDIENTE_PAGO	\N	\N	2025-11-07 11:57:47.49587-05
8ce820db-348b-464b-84f5-a1291e95c398	f7ad112b-4ab4-4caf-acfd-b7c99573f1db	ACTA_ENCONTRADA_PENDIENTE_PAGO	LISTO_PARA_OCR	\N	\N	2025-11-07 11:57:47.50539-05
f8154d2e-7470-426d-a6bc-5f8f03e7c4da	bad399b0-2427-49f5-bc70-f996f5d59702	ACTA_NO_ENCONTRADA	EN_BUSQUEDA	\N	\N	2025-11-07 11:57:47.509573-05
64e6afd6-4b23-48bf-b4e7-5a252b0489f8	8646423a-c656-4b12-ac2c-bf5220dd75c2	ACTA_ENCONTRADA_PENDIENTE_PAGO	DERIVADO_A_EDITOR	\N	\N	2025-11-07 11:57:47.512636-05
c04c75b8-d7d7-4eb0-bec1-653183510210	a243802d-0c0f-4a06-a509-ae242ad08775	ACTA_ENCONTRADA_PENDIENTE_PAGO	LISTO_PARA_OCR	\N	\N	2025-11-07 12:03:35.15185-05
ffd83171-c1de-4b2e-803f-1be30fbf35ee	a13d3682-c315-4a60-8373-41c5b896e91f	ACTA_ENCONTRADA_PENDIENTE_PAGO	LISTO_PARA_OCR	\N	\N	2025-11-07 12:04:05.012707-05
abc3448c-c29f-497f-9322-b217fd866dbf	cfb3fdbf-0abc-4c95-95cd-3d087c8e034b	REGISTRADA	DERIVADO_A_EDITOR	\N	\N	2025-11-07 12:23:30.077974-05
4c443495-ec6b-41fb-9102-38f36c21b2e4	cfb3fdbf-0abc-4c95-95cd-3d087c8e034b	DERIVADO_A_EDITOR	EN_BUSQUEDA	\N	\N	2025-11-07 12:23:56.678755-05
64e2ae37-2223-42b1-9320-824d91c0bcc4	cfb3fdbf-0abc-4c95-95cd-3d087c8e034b	DERIVADO_A_EDITOR	EN_BUSQUEDA	Editor ha iniciado la búsqueda del acta física	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 12:23:56.683-05
dcc05045-f118-4ad4-b433-1ca0266cc998	cfb3fdbf-0abc-4c95-95cd-3d087c8e034b	EN_BUSQUEDA	ACTA_ENCONTRADA_PENDIENTE_PAGO	\N	\N	2025-11-07 12:25:12.158147-05
c4debe8b-1825-4d7a-ba70-e23710ed9617	cfb3fdbf-0abc-4c95-95cd-3d087c8e034b	EN_BUSQUEDA	ACTA_ENCONTRADA_PENDIENTE_PAGO	Acta encontrada en: estaante 4	57a1a83f-5242-4d95-ad55-82dc6655b45c	2025-11-07 12:25:12.168-05
80d5b7c8-f37c-4af6-8cce-0d207a823b83	cfb3fdbf-0abc-4c95-95cd-3d087c8e034b	ACTA_ENCONTRADA_PENDIENTE_PAGO	LISTO_PARA_OCR	\N	\N	2025-11-07 12:26:35.763247-05
a8450f44-8547-42fe-8b9a-9567df612b83	bad399b0-2427-49f5-bc70-f996f5d59702	EN_BUSQUEDA	LISTO_PARA_OCR	\N	\N	2025-11-07 13:14:14.533424-05
1adc3117-d6e8-48eb-a208-3b8c0627c4b7	174d7c2e-05b5-43b6-8b20-d02643f7d535	REGISTRADA	DERIVADO_A_EDITOR	\N	\N	2025-11-11 10:03:15.470952-05
d1760240-f540-45b7-ad0d-0f44c915cf79	a13d3682-c315-4a60-8373-41c5b896e91f	REGISTRADA	DERIVADO_A_EDITOR	Derivado a Editor 57a1a83f-5242-4d95-ad55-82dc6655b45c	\N	2025-11-07 06:49:39.564-05
54f94afd-d571-4f60-9313-ff60c41f789c	c8fb92c5-4227-447c-b5bb-778e6d2083d0	REGISTRADA	DERIVADO_A_EDITOR	.	\N	2025-11-07 06:50:11.989-05
0998b78c-c5e1-477b-97d2-518d487c5179	bad399b0-2427-49f5-bc70-f996f5d59702	REGISTRADA	DERIVADO_A_EDITOR	Derivado a Editor 57a1a83f-5242-4d95-ad55-82dc6655b45c	\N	2025-11-07 08:38:08.276-05
2bd3df50-3591-4219-904a-72316ed3137d	cfb3fdbf-0abc-4c95-95cd-3d087c8e034b	REGISTRADA	DERIVADO_A_EDITOR	Derivado a Editor 57a1a83f-5242-4d95-ad55-82dc6655b45c	\N	2025-11-07 12:23:30.1-05
8dcddcb8-9e1b-4082-9f69-7fbd801eb065	174d7c2e-05b5-43b6-8b20-d02643f7d535	REGISTRADA	DERIVADO_A_EDITOR	Derivado a Editor 57a1a83f-5242-4d95-ad55-82dc6655b45c	\N	2025-11-11 10:03:15.505-05
\.


--
-- Data for Name: tiposolicitud; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tiposolicitud (id, institucion_id, codigo, nombre, descripcion, requierepago, montobase, tiempoentregadias, activo) FROM stdin;
9ee56a01-2e6b-41dd-a475-90a4845ac405	51e3415d-775e-436b-bfe0-3a21eee4de32	CERT_ESTUDIOS	Certificado de Estudios	Certificado oficial de estudios completos	t	50.00	7	t
34fe9bc6-1184-4c19-8e58-7e55fbc8eb88	51e3415d-775e-436b-bfe0-3a21eee4de32	CERT_DUP	Duplicado de Certificado	Duplicado por pÃ©rdida o deterioro	t	60.00	5	t
40666575-9bf1-4a48-ab46-68034d921c0e	51e3415d-775e-436b-bfe0-3a21eee4de32	CONST_ESTUDIOS	Constancia de Estudios	Constancia simple de estudios	t	30.00	3	t
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuario (id, username, email, passwordhash, dni, nombres, apellidos, telefono, cargo, ultimoacceso, intentosfallidos, bloqueado, fechabloqueo, activo, cambiarpassword, fechacreacion, fechaactualizacion) FROM stdin;
57a1a83f-5242-4d95-ad55-82dc6655b45c	editor	editor@sigcerh.local	$2b$10$Mf8jJ0CIN1F8zb.KAsOfueuE7.Mnkb.9g.2CSx9hjA.oewCTVuic6	22222222	Editor	Actas	987654322	Editor / Oficina de Actas	2025-11-12 22:58:54.661-05	0	f	\N	t	t	2025-11-07 04:57:45.805647-05	2025-11-12 22:58:54.664694-05
6779138d-0e55-4344-af31-07cd07bfaca1	juanmiguel	rodrigoakameluriarte@gmail.com	$2b$10$406rPz9uca/ez5fumrZIueX6qQ0R91S0PXaQ1SHJ36nGPFp9NdXjq	\N	\N	\N	\N	\N	2025-11-11 22:31:35.488-05	0	f	\N	t	f	2025-11-11 22:31:35.31-05	2025-11-11 22:31:35.490945-05
4bf22bde-7860-43a9-a20e-91a839a15414	admin	admin@sigcerh.local	$2b$10$97ztvr5ArFmVO8LdzKKHju0JSqkosadHunCXLNfdMTmXNcJh5FWHy	00000000	Administrador	del Sistema		Administrador General	2025-11-11 22:32:44.075-05	0	f	\N	t	t	2025-11-01 22:40:59.205123-05	2025-11-11 22:32:44.077951-05
3067116a-b810-4148-8b98-fe9940422aeb	mesadepartes	mesadepartes@sigcerh.local	$2b$10$R3jESZ0T3l6ye/hnMlWPpu64.BWrk7M5fxQbxLIHNHxiPEkuWHmZ6	\N	Mick	Marvin MD	\N	\N	2025-11-12 07:53:49.757-05	0	f	\N	t	t	2025-11-11 22:20:15.559-05	2025-11-12 07:53:49.75962-05
\.


--
-- Data for Name: usuariorol; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuariorol (usuario_id, rol_id, fechaasignacion, activo, usuarioasigno_id) FROM stdin;
57a1a83f-5242-4d95-ad55-82dc6655b45c	b7db07f2-911e-4266-944f-bab290f299b6	2025-11-07 04:57:45.811243-05	t	\N
4bf22bde-7860-43a9-a20e-91a839a15414	8a11ab04-4d0f-4ea5-aad4-3f463e29982b	2025-11-07 17:48:20.047-05	t	\N
3067116a-b810-4148-8b98-fe9940422aeb	f1c3a727-c1cd-4506-9df5-063faee768d9	2025-11-11 22:20:15.559-05	t	\N
6779138d-0e55-4344-af31-07cd07bfaca1	fac5f198-9628-491c-bac0-1ebb84999e1f	2025-11-11 22:31:35.326-05	t	\N
\.


--
-- Data for Name: verificacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verificacion (id, codigovirtual, certificado_id, fecha, ip, useragent, ubicacion, resultado, detalleresultado, tipoconsulta) FROM stdin;
\.


--
-- Data for Name: webhookpago; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhookpago (id, pasarela_id, pago_id, evento, payload, headers, ip, procesado, fechaprocesamiento, error, fecharecepcion) FROM stdin;
\.


--
-- Name: actaestudiante actaestudiante_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actaestudiante
    ADD CONSTRAINT actaestudiante_pkey PRIMARY KEY (id);


--
-- Name: actafisica actafisica_numero_aniolectivo_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actafisica
    ADD CONSTRAINT actafisica_numero_aniolectivo_id_key UNIQUE (numero, aniolectivo_id);


--
-- Name: actafisica actafisica_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actafisica
    ADD CONSTRAINT actafisica_pkey PRIMARY KEY (id);


--
-- Name: actanota actanota_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actanota
    ADD CONSTRAINT actanota_pkey PRIMARY KEY (id);


--
-- Name: aniolectivo aniolectivo_institucion_id_anio_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aniolectivo
    ADD CONSTRAINT aniolectivo_institucion_id_anio_key UNIQUE (institucion_id, anio);


--
-- Name: aniolectivo aniolectivo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aniolectivo
    ADD CONSTRAINT aniolectivo_pkey PRIMARY KEY (id);


--
-- Name: areacurricular areacurricular_institucion_id_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areacurricular
    ADD CONSTRAINT areacurricular_institucion_id_codigo_key UNIQUE (institucion_id, codigo);


--
-- Name: areacurricular areacurricular_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areacurricular
    ADD CONSTRAINT areacurricular_pkey PRIMARY KEY (id);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- Name: certificado certificado_codigovirtual_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificado
    ADD CONSTRAINT certificado_codigovirtual_key UNIQUE (codigovirtual);


--
-- Name: certificado certificado_numero_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificado
    ADD CONSTRAINT certificado_numero_key UNIQUE (numero);


--
-- Name: certificado certificado_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificado
    ADD CONSTRAINT certificado_pkey PRIMARY KEY (id);


--
-- Name: certificadodetalle certificadodetalle_certificado_id_aniolectivo_id_grado_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificadodetalle
    ADD CONSTRAINT certificadodetalle_certificado_id_aniolectivo_id_grado_id_key UNIQUE (certificado_id, aniolectivo_id, grado_id);


--
-- Name: certificadodetalle certificadodetalle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificadodetalle
    ADD CONSTRAINT certificadodetalle_pkey PRIMARY KEY (id);


--
-- Name: certificadonota certificadonota_certificadodetalle_id_area_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificadonota
    ADD CONSTRAINT certificadonota_certificadodetalle_id_area_id_key UNIQUE (certificadodetalle_id, area_id);


--
-- Name: certificadonota certificadonota_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificadonota
    ADD CONSTRAINT certificadonota_pkey PRIMARY KEY (id);


--
-- Name: conciliacionbancaria conciliacionbancaria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conciliacionbancaria
    ADD CONSTRAINT conciliacionbancaria_pkey PRIMARY KEY (id);


--
-- Name: conciliaciondetalle conciliaciondetalle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conciliaciondetalle
    ADD CONSTRAINT conciliaciondetalle_pkey PRIMARY KEY (id);


--
-- Name: configuracioninstitucion configuracioninstitucion_codigomodular_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracioninstitucion
    ADD CONSTRAINT configuracioninstitucion_codigomodular_key UNIQUE (codigomodular);


--
-- Name: configuracioninstitucion configuracioninstitucion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracioninstitucion
    ADD CONSTRAINT configuracioninstitucion_pkey PRIMARY KEY (id);


--
-- Name: curriculogrado curriculogrado_area_id_grado_id_aniolectivo_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curriculogrado
    ADD CONSTRAINT curriculogrado_area_id_grado_id_aniolectivo_id_key UNIQUE (area_id, grado_id, aniolectivo_id);


--
-- Name: curriculogrado curriculogrado_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curriculogrado
    ADD CONSTRAINT curriculogrado_pkey PRIMARY KEY (id);


--
-- Name: estudiante estudiante_institucion_id_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estudiante
    ADD CONSTRAINT estudiante_institucion_id_dni_key UNIQUE (institucion_id, dni);


--
-- Name: estudiante estudiante_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estudiante
    ADD CONSTRAINT estudiante_pkey PRIMARY KEY (id);


--
-- Name: grado grado_institucion_id_nivel_id_numero_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grado
    ADD CONSTRAINT grado_institucion_id_nivel_id_numero_key UNIQUE (institucion_id, nivel_id, numero);


--
-- Name: grado grado_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grado
    ADD CONSTRAINT grado_pkey PRIMARY KEY (id);


--
-- Name: institucionusuario institucionusuario_institucion_id_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.institucionusuario
    ADD CONSTRAINT institucionusuario_institucion_id_usuario_id_key UNIQUE (institucion_id, usuario_id);


--
-- Name: institucionusuario institucionusuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.institucionusuario
    ADD CONSTRAINT institucionusuario_pkey PRIMARY KEY (id);


--
-- Name: libro libro_institucion_id_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libro
    ADD CONSTRAINT libro_institucion_id_codigo_key UNIQUE (institucion_id, codigo);


--
-- Name: libro libro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libro
    ADD CONSTRAINT libro_pkey PRIMARY KEY (id);


--
-- Name: metodopago metodopago_institucion_id_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodopago
    ADD CONSTRAINT metodopago_institucion_id_codigo_key UNIQUE (institucion_id, codigo);


--
-- Name: metodopago metodopago_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodopago
    ADD CONSTRAINT metodopago_pkey PRIMARY KEY (id);


--
-- Name: niveleducativo niveleducativo_institucion_id_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.niveleducativo
    ADD CONSTRAINT niveleducativo_institucion_id_codigo_key UNIQUE (institucion_id, codigo);


--
-- Name: niveleducativo niveleducativo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.niveleducativo
    ADD CONSTRAINT niveleducativo_pkey PRIMARY KEY (id);


--
-- Name: notificacion notificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_pkey PRIMARY KEY (id);


--
-- Name: pago pago_numeroorden_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_numeroorden_key UNIQUE (numeroorden);


--
-- Name: pago pago_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_pkey PRIMARY KEY (id);


--
-- Name: pagodetalle pagodetalle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagodetalle
    ADD CONSTRAINT pagodetalle_pkey PRIMARY KEY (id);


--
-- Name: parametro parametro_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parametro
    ADD CONSTRAINT parametro_codigo_key UNIQUE (codigo);


--
-- Name: parametro parametro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parametro
    ADD CONSTRAINT parametro_pkey PRIMARY KEY (id);


--
-- Name: pasarelapago pasarelapago_institucion_id_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pasarelapago
    ADD CONSTRAINT pasarelapago_institucion_id_codigo_key UNIQUE (institucion_id, codigo);


--
-- Name: pasarelapago pasarelapago_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pasarelapago
    ADD CONSTRAINT pasarelapago_pkey PRIMARY KEY (id);


--
-- Name: permiso permiso_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permiso
    ADD CONSTRAINT permiso_codigo_key UNIQUE (codigo);


--
-- Name: permiso permiso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permiso
    ADD CONSTRAINT permiso_pkey PRIMARY KEY (id);


--
-- Name: rol rol_institucion_id_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_institucion_id_codigo_key UNIQUE (institucion_id, codigo);


--
-- Name: rol rol_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_pkey PRIMARY KEY (id);


--
-- Name: rolpermiso rolpermiso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rolpermiso
    ADD CONSTRAINT rolpermiso_pkey PRIMARY KEY (rol_id, permiso_id);


--
-- Name: sesion sesion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesion
    ADD CONSTRAINT sesion_pkey PRIMARY KEY (id);


--
-- Name: sesion sesion_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesion
    ADD CONSTRAINT sesion_token_key UNIQUE (token);


--
-- Name: solicitud solicitud_numeroexpediente_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud
    ADD CONSTRAINT solicitud_numeroexpediente_key UNIQUE (numeroexpediente);


--
-- Name: solicitud solicitud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud
    ADD CONSTRAINT solicitud_pkey PRIMARY KEY (id);


--
-- Name: solicitudhistorial solicitudhistorial_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudhistorial
    ADD CONSTRAINT solicitudhistorial_pkey PRIMARY KEY (id);


--
-- Name: tiposolicitud tiposolicitud_institucion_id_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tiposolicitud
    ADD CONSTRAINT tiposolicitud_institucion_id_codigo_key UNIQUE (institucion_id, codigo);


--
-- Name: tiposolicitud tiposolicitud_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tiposolicitud
    ADD CONSTRAINT tiposolicitud_pkey PRIMARY KEY (id);


--
-- Name: usuario usuario_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_dni_key UNIQUE (dni);


--
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- Name: usuario usuario_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_username_key UNIQUE (username);


--
-- Name: usuariorol usuariorol_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariorol
    ADD CONSTRAINT usuariorol_pkey PRIMARY KEY (usuario_id, rol_id);


--
-- Name: verificacion verificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verificacion
    ADD CONSTRAINT verificacion_pkey PRIMARY KEY (id);


--
-- Name: webhookpago webhookpago_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhookpago
    ADD CONSTRAINT webhookpago_pkey PRIMARY KEY (id);


--
-- Name: idx_acta_anio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acta_anio ON public.actafisica USING btree (aniolectivo_id);


--
-- Name: idx_acta_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acta_estado ON public.actafisica USING btree (estado);


--
-- Name: idx_acta_grado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acta_grado ON public.actafisica USING btree (grado_id);


--
-- Name: idx_acta_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acta_hash ON public.actafisica USING btree (hasharchivo);


--
-- Name: idx_acta_json; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acta_json ON public.actafisica USING gin (datosextraidosjson);


--
-- Name: idx_acta_libro; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acta_libro ON public.actafisica USING btree (libro_id);


--
-- Name: idx_acta_normalizada; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acta_normalizada ON public.actafisica USING btree (normalizada);


--
-- Name: idx_acta_numero; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acta_numero ON public.actafisica USING btree (numero);


--
-- Name: idx_acta_procesado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acta_procesado ON public.actafisica USING btree (procesadoconia);


--
-- Name: idx_acta_procesado_normalizada; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acta_procesado_normalizada ON public.actafisica USING btree (procesadoconia, normalizada);


--
-- Name: idx_acta_solicitud; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acta_solicitud ON public.actafisica USING btree (solicitud_id);


--
-- Name: idx_actaest_acta; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actaest_acta ON public.actaestudiante USING btree (acta_id);


--
-- Name: idx_actaest_estudiante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actaest_estudiante ON public.actaestudiante USING btree (estudiante_id);


--
-- Name: idx_actaest_orden; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actaest_orden ON public.actaestudiante USING btree (acta_id, numero_orden);


--
-- Name: idx_actanota_actaest; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actanota_actaest ON public.actanota USING btree (acta_estudiante_id);


--
-- Name: idx_actanota_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actanota_area ON public.actanota USING btree (area_id);


--
-- Name: idx_actanota_orden; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actanota_orden ON public.actanota USING btree (acta_estudiante_id, orden);


--
-- Name: idx_anio_inst_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anio_inst_activo ON public.aniolectivo USING btree (institucion_id, activo) WHERE (activo = true);


--
-- Name: idx_anio_inst_anio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anio_inst_anio ON public.aniolectivo USING btree (institucion_id, anio DESC);


--
-- Name: idx_anio_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anio_institucion ON public.aniolectivo USING btree (institucion_id);


--
-- Name: idx_area_inst_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_area_inst_activo ON public.areacurricular USING btree (institucion_id) WHERE (activo = true);


--
-- Name: idx_area_inst_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_area_inst_codigo ON public.areacurricular USING btree (institucion_id, codigo);


--
-- Name: idx_area_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_area_institucion ON public.areacurricular USING btree (institucion_id);


--
-- Name: idx_area_orden; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_area_orden ON public.areacurricular USING btree (orden);


--
-- Name: idx_auditoria_accion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_accion ON public.auditoria USING btree (accion);


--
-- Name: idx_auditoria_entidad; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_entidad ON public.auditoria USING btree (entidad, entidadid);


--
-- Name: idx_auditoria_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_fecha ON public.auditoria USING btree (fecha DESC);


--
-- Name: idx_auditoria_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_usuario ON public.auditoria USING btree (usuario_id);


--
-- Name: idx_certdet_anio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certdet_anio ON public.certificadodetalle USING btree (aniolectivo_id);


--
-- Name: idx_certdet_certificado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certdet_certificado ON public.certificadodetalle USING btree (certificado_id);


--
-- Name: idx_certdet_grado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certdet_grado ON public.certificadodetalle USING btree (grado_id);


--
-- Name: idx_certificado_codigovirtual; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certificado_codigovirtual ON public.certificado USING btree (codigovirtual);


--
-- Name: idx_certificado_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certificado_estado ON public.certificado USING btree (estado);


--
-- Name: idx_certificado_estudiante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certificado_estudiante ON public.certificado USING btree (estudiante_id);


--
-- Name: idx_certificado_estudiante_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certificado_estudiante_estado ON public.certificado USING btree (estudiante_id, estado);


--
-- Name: idx_certificado_fechaemision; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certificado_fechaemision ON public.certificado USING btree (fechaemision DESC);


--
-- Name: idx_certificado_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certificado_institucion ON public.certificado USING btree (institucion_id);


--
-- Name: idx_certificado_numero; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certificado_numero ON public.certificado USING btree (numero);


--
-- Name: idx_certnota_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certnota_area ON public.certificadonota USING btree (area_id);


--
-- Name: idx_certnota_detalle; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certnota_detalle ON public.certificadonota USING btree (certificadodetalle_id);


--
-- Name: idx_concdet_conciliacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_concdet_conciliacion ON public.conciliaciondetalle USING btree (conciliacion_id);


--
-- Name: idx_concdet_operacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_concdet_operacion ON public.conciliaciondetalle USING btree (numerooperacion);


--
-- Name: idx_concdet_pago; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_concdet_pago ON public.conciliaciondetalle USING btree (pago_id);


--
-- Name: idx_concdet_pendiente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_concdet_pendiente ON public.conciliaciondetalle USING btree (conciliado) WHERE (conciliado = false);


--
-- Name: idx_conciliacion_banco; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conciliacion_banco ON public.conciliacionbancaria USING btree (entidadbancaria);


--
-- Name: idx_conciliacion_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conciliacion_estado ON public.conciliacionbancaria USING btree (estado);


--
-- Name: idx_conciliacion_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conciliacion_fecha ON public.conciliacionbancaria USING btree (fechaconciliacion DESC);


--
-- Name: idx_conciliacion_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conciliacion_institucion ON public.conciliacionbancaria USING btree (institucion_id);


--
-- Name: idx_curriculo_anio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_curriculo_anio ON public.curriculogrado USING btree (aniolectivo_id);


--
-- Name: idx_curriculo_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_curriculo_area ON public.curriculogrado USING btree (area_id);


--
-- Name: idx_curriculo_grado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_curriculo_grado ON public.curriculogrado USING btree (grado_id);


--
-- Name: idx_estudiante_apellidos; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_estudiante_apellidos ON public.estudiante USING btree (apellidopaterno, apellidomaterno);


--
-- Name: idx_estudiante_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_estudiante_estado ON public.estudiante USING btree (estado) WHERE ((estado)::text = 'ACTIVO'::text);


--
-- Name: idx_estudiante_fechanacimiento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_estudiante_fechanacimiento ON public.estudiante USING btree (fechanacimiento);


--
-- Name: idx_estudiante_inst_dni; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_estudiante_inst_dni ON public.estudiante USING btree (institucion_id, dni);


--
-- Name: idx_estudiante_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_estudiante_institucion ON public.estudiante USING btree (institucion_id);


--
-- Name: idx_estudiante_nombrecompleto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_estudiante_nombrecompleto ON public.estudiante USING gin (nombrecompleto public.gin_trgm_ops);


--
-- Name: idx_grado_inst_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_grado_inst_activo ON public.grado USING btree (institucion_id) WHERE (activo = true);


--
-- Name: idx_grado_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_grado_institucion ON public.grado USING btree (institucion_id);


--
-- Name: idx_grado_nivel; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_grado_nivel ON public.grado USING btree (nivel_id);


--
-- Name: idx_institucion_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_institucion_activo ON public.configuracioninstitucion USING btree (activo) WHERE (activo = true);


--
-- Name: idx_institucion_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_institucion_codigo ON public.configuracioninstitucion USING btree (codigomodular);


--
-- Name: idx_instuser_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_instuser_activo ON public.institucionusuario USING btree (institucion_id, usuario_id) WHERE (activo = true);


--
-- Name: idx_instuser_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_instuser_institucion ON public.institucionusuario USING btree (institucion_id);


--
-- Name: idx_instuser_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_instuser_usuario ON public.institucionusuario USING btree (usuario_id);


--
-- Name: idx_libro_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_libro_estado ON public.libro USING btree (estado);


--
-- Name: idx_libro_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_libro_institucion ON public.libro USING btree (institucion_id);


--
-- Name: idx_libro_nivel; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_libro_nivel ON public.libro USING btree (nivel_id);


--
-- Name: idx_metodopago_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metodopago_activo ON public.metodopago USING btree (institucion_id) WHERE (activo = true);


--
-- Name: idx_metodopago_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metodopago_codigo ON public.metodopago USING btree (institucion_id, codigo);


--
-- Name: idx_metodopago_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metodopago_institucion ON public.metodopago USING btree (institucion_id);


--
-- Name: idx_metodopago_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metodopago_tipo ON public.metodopago USING btree (tipo);


--
-- Name: idx_mv_stats_cert_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mv_stats_cert_institucion ON public.mv_estadisticas_certificados USING btree (institucion_id);


--
-- Name: idx_mv_stats_cert_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mv_stats_cert_unique ON public.mv_estadisticas_certificados USING btree (institucion_id, anio, mes, estado);


--
-- Name: idx_nivel_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nivel_activo ON public.niveleducativo USING btree (activo) WHERE (activo = true);


--
-- Name: idx_nivel_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nivel_codigo ON public.niveleducativo USING btree (institucion_id, codigo);


--
-- Name: idx_nivel_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nivel_institucion ON public.niveleducativo USING btree (institucion_id);


--
-- Name: idx_notif_canal; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_canal ON public.notificacion USING btree (canal);


--
-- Name: idx_notif_certificado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_certificado ON public.notificacion USING btree (certificado_id);


--
-- Name: idx_notif_destinatario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_destinatario ON public.notificacion USING btree (destinatario);


--
-- Name: idx_notif_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_estado ON public.notificacion USING btree (estado);


--
-- Name: idx_notif_pendientes; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_pendientes ON public.notificacion USING btree (estado, fechacreacion) WHERE ((estado)::text = 'PENDIENTE'::text);


--
-- Name: idx_notif_solicitud; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_solicitud ON public.notificacion USING btree (solicitud_id);


--
-- Name: idx_pago_conciliado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_conciliado ON public.pago USING btree (conciliado) WHERE (conciliado = false);


--
-- Name: idx_pago_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_estado ON public.pago USING btree (estado);


--
-- Name: idx_pago_inst_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_inst_fecha ON public.pago USING btree (institucion_id, fechapago DESC);


--
-- Name: idx_pago_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_institucion ON public.pago USING btree (institucion_id);


--
-- Name: idx_pago_numerooperacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_numerooperacion ON public.pago USING btree (numerooperacion);


--
-- Name: idx_pago_numeroorden; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_numeroorden ON public.pago USING btree (numeroorden);


--
-- Name: idx_pagodet_celular; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagodet_celular ON public.pagodetalle USING btree (numerocelular);


--
-- Name: idx_pagodet_metodo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagodet_metodo ON public.pagodetalle USING btree (metodopago_id);


--
-- Name: idx_pagodet_pago; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagodet_pago ON public.pagodetalle USING btree (pago_id);


--
-- Name: idx_pagodet_pasarela; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagodet_pasarela ON public.pagodetalle USING btree (pasarela);


--
-- Name: idx_pagodet_transaction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagodet_transaction ON public.pagodetalle USING btree (transaction_id);


--
-- Name: idx_pasarela_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pasarela_activo ON public.pasarelapago USING btree (institucion_id) WHERE (activo = true);


--
-- Name: idx_pasarela_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pasarela_codigo ON public.pasarelapago USING btree (institucion_id, codigo);


--
-- Name: idx_pasarela_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pasarela_institucion ON public.pasarelapago USING btree (institucion_id);


--
-- Name: idx_rol_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rol_activo ON public.rol USING btree (institucion_id) WHERE (activo = true);


--
-- Name: idx_rol_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rol_codigo ON public.rol USING btree (institucion_id, codigo);


--
-- Name: idx_rol_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rol_institucion ON public.rol USING btree (institucion_id);


--
-- Name: idx_sesion_activa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sesion_activa ON public.sesion USING btree (activa, fechaexpiracion) WHERE (activa = true);


--
-- Name: idx_sesion_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sesion_token ON public.sesion USING btree (token);


--
-- Name: idx_sesion_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sesion_usuario ON public.sesion USING btree (usuario_id);


--
-- Name: idx_solhist_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solhist_fecha ON public.solicitudhistorial USING btree (fecha DESC);


--
-- Name: idx_solhist_solicitud; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solhist_solicitud ON public.solicitudhistorial USING btree (solicitud_id);


--
-- Name: idx_solicitud_certificado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_certificado ON public.solicitud USING btree (certificado_id);


--
-- Name: idx_solicitud_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_estado ON public.solicitud USING btree (estado);


--
-- Name: idx_solicitud_estudiante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_estudiante ON public.solicitud USING btree (estudiante_id);


--
-- Name: idx_solicitud_estudiante_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_estudiante_estado ON public.solicitud USING btree (estudiante_id, estado);


--
-- Name: idx_solicitud_fechasolicitud; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_fechasolicitud ON public.solicitud USING btree (fechasolicitud DESC);


--
-- Name: idx_solicitud_numeroexpediente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_numeroexpediente ON public.solicitud USING btree (numeroexpediente);


--
-- Name: idx_solicitud_pago; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_pago ON public.solicitud USING btree (pago_id);


--
-- Name: idx_solicitud_prioridad; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_prioridad ON public.solicitud USING btree (prioridad) WHERE ((estado)::text <> ALL ((ARRAY['ENTREGADA'::character varying, 'RECHAZADA'::character varying])::text[]));


--
-- Name: idx_solicitud_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_tipo ON public.solicitud USING btree (tiposolicitud_id);


--
-- Name: idx_tiposol_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tiposol_activo ON public.tiposolicitud USING btree (institucion_id) WHERE (activo = true);


--
-- Name: idx_tiposol_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tiposol_codigo ON public.tiposolicitud USING btree (institucion_id, codigo);


--
-- Name: idx_tiposol_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tiposol_institucion ON public.tiposolicitud USING btree (institucion_id);


--
-- Name: idx_unica_institucion_activa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_unica_institucion_activa ON public.configuracioninstitucion USING btree (activo) WHERE (activo = true);


--
-- Name: idx_usuario_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_activo ON public.usuario USING btree (activo) WHERE (activo = true);


--
-- Name: idx_usuario_bloqueado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_bloqueado ON public.usuario USING btree (bloqueado) WHERE (bloqueado = true);


--
-- Name: idx_usuario_dni; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_dni ON public.usuario USING btree (dni);


--
-- Name: idx_usuario_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_email ON public.usuario USING btree (email);


--
-- Name: idx_usuario_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_username ON public.usuario USING btree (username);


--
-- Name: idx_usurol_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usurol_activo ON public.usuariorol USING btree (activo) WHERE (activo = true);


--
-- Name: idx_usurol_rol; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usurol_rol ON public.usuariorol USING btree (rol_id);


--
-- Name: idx_usurol_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usurol_usuario ON public.usuariorol USING btree (usuario_id);


--
-- Name: idx_verificacion_certificado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_verificacion_certificado ON public.verificacion USING btree (certificado_id);


--
-- Name: idx_verificacion_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_verificacion_codigo ON public.verificacion USING btree (codigovirtual);


--
-- Name: idx_verificacion_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_verificacion_fecha ON public.verificacion USING btree (fecha DESC);


--
-- Name: idx_verificacion_ip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_verificacion_ip ON public.verificacion USING btree (ip);


--
-- Name: idx_verificacion_resultado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_verificacion_resultado ON public.verificacion USING btree (resultado);


--
-- Name: idx_webhook_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_webhook_fecha ON public.webhookpago USING btree (fecharecepcion DESC);


--
-- Name: idx_webhook_pago; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_webhook_pago ON public.webhookpago USING btree (pago_id);


--
-- Name: idx_webhook_pasarela; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_webhook_pasarela ON public.webhookpago USING btree (pasarela_id);


--
-- Name: idx_webhook_pendiente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_webhook_pendiente ON public.webhookpago USING btree (procesado, fecharecepcion) WHERE (procesado = false);


--
-- Name: uq_actaest_acta_estudiante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_actaest_acta_estudiante ON public.actaestudiante USING btree (acta_id, estudiante_id);


--
-- Name: uq_actaest_acta_orden; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_actaest_acta_orden ON public.actaestudiante USING btree (acta_id, numero_orden);


--
-- Name: uq_actanota_actaest_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_actanota_actaest_area ON public.actanota USING btree (acta_estudiante_id, area_id);


--
-- Name: actafisica trg_actafisica_validar_normalizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_actafisica_validar_normalizacion BEFORE UPDATE ON public.actafisica FOR EACH ROW EXECUTE FUNCTION public.validar_acta_antes_normalizar();


--
-- Name: certificado trg_certificado_validar_institucion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_certificado_validar_institucion BEFORE INSERT OR UPDATE ON public.certificado FOR EACH ROW EXECUTE FUNCTION public.validar_estudiante_institucion();


--
-- Name: configuracioninstitucion trg_config_actualizar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_config_actualizar BEFORE UPDATE ON public.configuracioninstitucion FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- Name: estudiante trg_estudiante_actualizar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_estudiante_actualizar BEFORE UPDATE ON public.estudiante FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- Name: notificacion trg_notificacion_intentos; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_notificacion_intentos BEFORE UPDATE ON public.notificacion FOR EACH ROW EXECUTE FUNCTION public.incrementar_intentos_notificacion();


--
-- Name: pago trg_pago_calcular_neto; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_pago_calcular_neto BEFORE INSERT OR UPDATE ON public.pago FOR EACH ROW EXECUTE FUNCTION public.calcular_monto_neto_pago();


--
-- Name: pago trg_pago_orden; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_pago_orden BEFORE INSERT ON public.pago FOR EACH ROW EXECUTE FUNCTION public.generar_numero_orden();


--
-- Name: pagodetalle trg_pagodetalle_validar_monto; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_pagodetalle_validar_monto BEFORE INSERT OR UPDATE ON public.pagodetalle FOR EACH ROW EXECUTE FUNCTION public.validar_monto_pago_detalle();


--
-- Name: parametro trg_parametro_actualizar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_parametro_actualizar BEFORE UPDATE ON public.parametro FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- Name: solicitud trg_solicitud_actualizar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_solicitud_actualizar BEFORE UPDATE ON public.solicitud FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- Name: solicitud trg_solicitud_expediente; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_solicitud_expediente BEFORE INSERT ON public.solicitud FOR EACH ROW EXECUTE FUNCTION public.generar_numero_expediente();


--
-- Name: solicitud trg_solicitud_historial; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_solicitud_historial AFTER UPDATE ON public.solicitud FOR EACH ROW EXECUTE FUNCTION public.registrar_historial_solicitud();


--
-- Name: usuario trg_usuario_actualizar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_usuario_actualizar BEFORE UPDATE ON public.usuario FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- Name: usuario trg_usuario_bloqueo; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_usuario_bloqueo BEFORE UPDATE ON public.usuario FOR EACH ROW EXECUTE FUNCTION public.bloquear_usuario_intentos();


--
-- Name: verificacion trg_verificacion_validar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_verificacion_validar BEFORE INSERT ON public.verificacion FOR EACH ROW EXECUTE FUNCTION public.validar_certificado_activo();


--
-- Name: actafisica fk_acta_anio; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actafisica
    ADD CONSTRAINT fk_acta_anio FOREIGN KEY (aniolectivo_id) REFERENCES public.aniolectivo(id) ON DELETE RESTRICT;


--
-- Name: actafisica fk_acta_grado; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actafisica
    ADD CONSTRAINT fk_acta_grado FOREIGN KEY (grado_id) REFERENCES public.grado(id) ON DELETE RESTRICT;


--
-- Name: actafisica fk_acta_libro; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actafisica
    ADD CONSTRAINT fk_acta_libro FOREIGN KEY (libro_id) REFERENCES public.libro(id) ON DELETE SET NULL;


--
-- Name: actafisica fk_acta_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actafisica
    ADD CONSTRAINT fk_acta_solicitud FOREIGN KEY (solicitud_id) REFERENCES public.solicitud(id) ON DELETE SET NULL;


--
-- Name: actafisica fk_acta_usuario_subida; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actafisica
    ADD CONSTRAINT fk_acta_usuario_subida FOREIGN KEY (usuariosubida_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: actaestudiante fk_actaest_acta; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actaestudiante
    ADD CONSTRAINT fk_actaest_acta FOREIGN KEY (acta_id) REFERENCES public.actafisica(id) ON DELETE CASCADE;


--
-- Name: actaestudiante fk_actaest_estudiante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actaestudiante
    ADD CONSTRAINT fk_actaest_estudiante FOREIGN KEY (estudiante_id) REFERENCES public.estudiante(id) ON DELETE CASCADE;


--
-- Name: actanota fk_actanota_actaest; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actanota
    ADD CONSTRAINT fk_actanota_actaest FOREIGN KEY (acta_estudiante_id) REFERENCES public.actaestudiante(id) ON DELETE CASCADE;


--
-- Name: actanota fk_actanota_area; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actanota
    ADD CONSTRAINT fk_actanota_area FOREIGN KEY (area_id) REFERENCES public.areacurricular(id) ON DELETE RESTRICT;


--
-- Name: aniolectivo fk_anio_institucion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aniolectivo
    ADD CONSTRAINT fk_anio_institucion FOREIGN KEY (institucion_id) REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT;


--
-- Name: areacurricular fk_area_institucion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areacurricular
    ADD CONSTRAINT fk_area_institucion FOREIGN KEY (institucion_id) REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT;


--
-- Name: auditoria fk_auditoria_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: certificadodetalle fk_certdet_anio; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificadodetalle
    ADD CONSTRAINT fk_certdet_anio FOREIGN KEY (aniolectivo_id) REFERENCES public.aniolectivo(id) ON DELETE RESTRICT;


--
-- Name: certificadodetalle fk_certdet_certificado; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificadodetalle
    ADD CONSTRAINT fk_certdet_certificado FOREIGN KEY (certificado_id) REFERENCES public.certificado(id) ON DELETE CASCADE;


--
-- Name: certificadodetalle fk_certdet_grado; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificadodetalle
    ADD CONSTRAINT fk_certdet_grado FOREIGN KEY (grado_id) REFERENCES public.grado(id) ON DELETE RESTRICT;


--
-- Name: certificado fk_certificado_anterior; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificado
    ADD CONSTRAINT fk_certificado_anterior FOREIGN KEY (certificadoanterior_id) REFERENCES public.certificado(id) ON DELETE SET NULL;


--
-- Name: certificado fk_certificado_estudiante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificado
    ADD CONSTRAINT fk_certificado_estudiante FOREIGN KEY (estudiante_id) REFERENCES public.estudiante(id) ON DELETE RESTRICT;


--
-- Name: certificado fk_certificado_institucion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificado
    ADD CONSTRAINT fk_certificado_institucion FOREIGN KEY (institucion_id) REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT;


--
-- Name: certificado fk_certificado_usuario_anulacion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificado
    ADD CONSTRAINT fk_certificado_usuario_anulacion FOREIGN KEY (usuarioanulacion_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: certificado fk_certificado_usuario_emision; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificado
    ADD CONSTRAINT fk_certificado_usuario_emision FOREIGN KEY (usuarioemision_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: certificadonota fk_certnota_area; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificadonota
    ADD CONSTRAINT fk_certnota_area FOREIGN KEY (area_id) REFERENCES public.areacurricular(id) ON DELETE RESTRICT;


--
-- Name: certificadonota fk_certnota_detalle; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificadonota
    ADD CONSTRAINT fk_certnota_detalle FOREIGN KEY (certificadodetalle_id) REFERENCES public.certificadodetalle(id) ON DELETE CASCADE;


--
-- Name: conciliaciondetalle fk_concdet_conciliacion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conciliaciondetalle
    ADD CONSTRAINT fk_concdet_conciliacion FOREIGN KEY (conciliacion_id) REFERENCES public.conciliacionbancaria(id) ON DELETE CASCADE;


--
-- Name: conciliaciondetalle fk_concdet_pago; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conciliaciondetalle
    ADD CONSTRAINT fk_concdet_pago FOREIGN KEY (pago_id) REFERENCES public.pago(id) ON DELETE SET NULL;


--
-- Name: conciliacionbancaria fk_conciliacion_institucion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conciliacionbancaria
    ADD CONSTRAINT fk_conciliacion_institucion FOREIGN KEY (institucion_id) REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT;


--
-- Name: conciliacionbancaria fk_conciliacion_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conciliacionbancaria
    ADD CONSTRAINT fk_conciliacion_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: curriculogrado fk_curriculo_anio; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curriculogrado
    ADD CONSTRAINT fk_curriculo_anio FOREIGN KEY (aniolectivo_id) REFERENCES public.aniolectivo(id) ON DELETE RESTRICT;


--
-- Name: curriculogrado fk_curriculo_area; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curriculogrado
    ADD CONSTRAINT fk_curriculo_area FOREIGN KEY (area_id) REFERENCES public.areacurricular(id) ON DELETE RESTRICT;


--
-- Name: curriculogrado fk_curriculo_grado; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curriculogrado
    ADD CONSTRAINT fk_curriculo_grado FOREIGN KEY (grado_id) REFERENCES public.grado(id) ON DELETE RESTRICT;


--
-- Name: estudiante fk_estudiante_institucion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estudiante
    ADD CONSTRAINT fk_estudiante_institucion FOREIGN KEY (institucion_id) REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT;


--
-- Name: grado fk_grado_institucion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grado
    ADD CONSTRAINT fk_grado_institucion FOREIGN KEY (institucion_id) REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT;


--
-- Name: grado fk_grado_nivel; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grado
    ADD CONSTRAINT fk_grado_nivel FOREIGN KEY (nivel_id) REFERENCES public.niveleducativo(id) ON DELETE SET NULL;


--
-- Name: institucionusuario fk_instuser_asignador; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.institucionusuario
    ADD CONSTRAINT fk_instuser_asignador FOREIGN KEY (usuarioasigno_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: institucionusuario fk_instuser_institucion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.institucionusuario
    ADD CONSTRAINT fk_instuser_institucion FOREIGN KEY (institucion_id) REFERENCES public.configuracioninstitucion(id) ON DELETE CASCADE;


--
-- Name: institucionusuario fk_instuser_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.institucionusuario
    ADD CONSTRAINT fk_instuser_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- Name: libro fk_libro_institucion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libro
    ADD CONSTRAINT fk_libro_institucion FOREIGN KEY (institucion_id) REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT;


--
-- Name: libro fk_libro_nivel; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libro
    ADD CONSTRAINT fk_libro_nivel FOREIGN KEY (nivel_id) REFERENCES public.niveleducativo(id) ON DELETE SET NULL;


--
-- Name: metodopago fk_metodopago_institucion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodopago
    ADD CONSTRAINT fk_metodopago_institucion FOREIGN KEY (institucion_id) REFERENCES public.configuracioninstitucion(id) ON DELETE CASCADE;


--
-- Name: niveleducativo fk_nivel_institucion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.niveleducativo
    ADD CONSTRAINT fk_nivel_institucion FOREIGN KEY (institucion_id) REFERENCES public.configuracioninstitucion(id) ON DELETE CASCADE;


--
-- Name: notificacion fk_notif_certificado; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT fk_notif_certificado FOREIGN KEY (certificado_id) REFERENCES public.certificado(id) ON DELETE SET NULL;


--
-- Name: notificacion fk_notif_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT fk_notif_solicitud FOREIGN KEY (solicitud_id) REFERENCES public.solicitud(id) ON DELETE SET NULL;


--
-- Name: pago fk_pago_institucion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT fk_pago_institucion FOREIGN KEY (institucion_id) REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT;


--
-- Name: pago fk_pago_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT fk_pago_usuario FOREIGN KEY (usuarioconciliacion_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: pagodetalle fk_pagodet_metodo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagodetalle
    ADD CONSTRAINT fk_pagodet_metodo FOREIGN KEY (metodopago_id) REFERENCES public.metodopago(id) ON DELETE RESTRICT;


--
-- Name: pagodetalle fk_pagodet_pago; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagodetalle
    ADD CONSTRAINT fk_pagodet_pago FOREIGN KEY (pago_id) REFERENCES public.pago(id) ON DELETE CASCADE;


--
-- Name: parametro fk_parametro_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parametro
    ADD CONSTRAINT fk_parametro_usuario FOREIGN KEY (usuarioactualizacion_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: pasarelapago fk_pasarela_institucion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pasarelapago
    ADD CONSTRAINT fk_pasarela_institucion FOREIGN KEY (institucion_id) REFERENCES public.configuracioninstitucion(id) ON DELETE CASCADE;


--
-- Name: rol fk_rol_institucion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT fk_rol_institucion FOREIGN KEY (institucion_id) REFERENCES public.configuracioninstitucion(id) ON DELETE CASCADE;


--
-- Name: rolpermiso fk_rolperm_permiso; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rolpermiso
    ADD CONSTRAINT fk_rolperm_permiso FOREIGN KEY (permiso_id) REFERENCES public.permiso(id) ON DELETE CASCADE;


--
-- Name: rolpermiso fk_rolperm_rol; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rolpermiso
    ADD CONSTRAINT fk_rolperm_rol FOREIGN KEY (rol_id) REFERENCES public.rol(id) ON DELETE CASCADE;


--
-- Name: sesion fk_sesion_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesion
    ADD CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- Name: solicitudhistorial fk_solhist_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudhistorial
    ADD CONSTRAINT fk_solhist_solicitud FOREIGN KEY (solicitud_id) REFERENCES public.solicitud(id) ON DELETE CASCADE;


--
-- Name: solicitudhistorial fk_solhist_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudhistorial
    ADD CONSTRAINT fk_solhist_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: solicitud fk_solicitud_certificado; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud
    ADD CONSTRAINT fk_solicitud_certificado FOREIGN KEY (certificado_id) REFERENCES public.certificado(id) ON DELETE SET NULL;


--
-- Name: solicitud fk_solicitud_entregador; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud
    ADD CONSTRAINT fk_solicitud_entregador FOREIGN KEY (usuarioentrega_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: solicitud fk_solicitud_estudiante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud
    ADD CONSTRAINT fk_solicitud_estudiante FOREIGN KEY (estudiante_id) REFERENCES public.estudiante(id) ON DELETE RESTRICT;


--
-- Name: solicitud fk_solicitud_firmante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud
    ADD CONSTRAINT fk_solicitud_firmante FOREIGN KEY (usuariofirma_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: solicitud fk_solicitud_generador; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud
    ADD CONSTRAINT fk_solicitud_generador FOREIGN KEY (usuariogeneracion_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: solicitud fk_solicitud_pago; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud
    ADD CONSTRAINT fk_solicitud_pago FOREIGN KEY (pago_id) REFERENCES public.pago(id) ON DELETE SET NULL;


--
-- Name: solicitud fk_solicitud_tipo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud
    ADD CONSTRAINT fk_solicitud_tipo FOREIGN KEY (tiposolicitud_id) REFERENCES public.tiposolicitud(id) ON DELETE RESTRICT;


--
-- Name: solicitud fk_solicitud_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud
    ADD CONSTRAINT fk_solicitud_usuario FOREIGN KEY (usuariosolicitud_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: solicitud fk_solicitud_validador_pago; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud
    ADD CONSTRAINT fk_solicitud_validador_pago FOREIGN KEY (usuariovalidacionpago_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: tiposolicitud fk_tiposol_institucion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tiposolicitud
    ADD CONSTRAINT fk_tiposol_institucion FOREIGN KEY (institucion_id) REFERENCES public.configuracioninstitucion(id) ON DELETE RESTRICT;


--
-- Name: usuariorol fk_usurol_asignador; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariorol
    ADD CONSTRAINT fk_usurol_asignador FOREIGN KEY (usuarioasigno_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- Name: usuariorol fk_usurol_rol; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariorol
    ADD CONSTRAINT fk_usurol_rol FOREIGN KEY (rol_id) REFERENCES public.rol(id) ON DELETE CASCADE;


--
-- Name: usuariorol fk_usurol_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariorol
    ADD CONSTRAINT fk_usurol_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- Name: verificacion fk_verificacion_certificado; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verificacion
    ADD CONSTRAINT fk_verificacion_certificado FOREIGN KEY (certificado_id) REFERENCES public.certificado(id) ON DELETE SET NULL;


--
-- Name: webhookpago fk_webhook_pago; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhookpago
    ADD CONSTRAINT fk_webhook_pago FOREIGN KEY (pago_id) REFERENCES public.pago(id) ON DELETE SET NULL;


--
-- Name: webhookpago fk_webhook_pasarela; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhookpago
    ADD CONSTRAINT fk_webhook_pasarela FOREIGN KEY (pasarela_id) REFERENCES public.pasarelapago(id) ON DELETE SET NULL;


--
-- Name: mv_estadisticas_certificados; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: postgres
--

REFRESH MATERIALIZED VIEW public.mv_estadisticas_certificados;


--
-- PostgreSQL database dump complete
--

\unrestrict thI6PsNGn38fzVwLwo9EMokmCB6ogUppNgdx6NviS1kDumOHU4XFguNwKGVygq0

