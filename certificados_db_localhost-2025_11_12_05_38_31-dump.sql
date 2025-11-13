--
-- PostgreSQL database dump
--

\restrict ojpTWHNiQMNgWi5yCBZ6qcw83hmO1U1t8DoDNsKmzPImgsiO9tasJc2gXpw9POr

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
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


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
    colegiorigen character varying(255),
    estado character varying(30) DEFAULT 'DISPONIBLE'::character varying,
    seccion character varying(10),
    solicitud_id uuid,
    tipoevaluacion character varying(50),
    turno character varying(20),
    ubicacionfisica character varying(255),
    libro_id uuid
);


ALTER TABLE public.actafisica OWNER TO postgres;

--
-- Name: TABLE actafisica; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.actafisica IS 'Actas escaneadas procesadas con IA (OCR)';


--
-- Name: COLUMN actafisica.datosextraidosjson; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.actafisica.datosextraidosjson IS 'Datos extraÃ­dos por Gemini AI en formato JSON';


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
    activo boolean DEFAULT true
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
-- Name: idx_acta_numero; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acta_numero ON public.actafisica USING btree (numero);


--
-- Name: idx_acta_procesado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acta_procesado ON public.actafisica USING btree (procesadoconia);


--
-- Name: idx_acta_solicitud; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acta_solicitud ON public.actafisica USING btree (solicitud_id);


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
-- Name: actafisica fk_acta_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actafisica
    ADD CONSTRAINT fk_acta_usuario FOREIGN KEY (usuariosubida_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


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
ALTER TABLE ONLY public.usuariorol
    ADD CONSTRAINT fk_usurol_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.verificacion
    ADD CONSTRAINT fk_verificacion_certificado FOREIGN KEY (certificado_id) REFERENCES public.certificado(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.webhookpago
    ADD CONSTRAINT fk_webhook_pago FOREIGN KEY (pago_id) REFERENCES public.pago(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.webhookpago
    ADD CONSTRAINT fk_webhook_pasarela FOREIGN KEY (pasarela_id) REFERENCES public.pasarelapago(id) ON DELETE SET NULL;
REFRESH MATERIALIZED VIEW public.mv_estadisticas_certificados;


--
-- PostgreSQL database dump complete
--

\unrestrict ojpTWHNiQMNgWi5yCBZ6qcw83hmO1U1t8DoDNsKmzPImgsiO9tasJc2gXpw9POr

