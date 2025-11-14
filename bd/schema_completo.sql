-- ============================================
-- SCRIPT CONSOLIDADO - BD SIGCERH
-- ============================================
-- Este archivo es generado automáticamente y contiene la estructura completa de la base de datos.

-- ============================================
-- Parte 1: Tablas Principales
-- c:\SIGCERH\bd\01_schema_optimizado.sql
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
    UNIQUE(institucion_id, nivel_id, numero)
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

-- ============================================
-- Parte 2: Certificados, Usuarios y Seguridad
-- c:\SIGCERH\bd\02_certificados_usuarios.sql
-- ============================================

-- CERTIFICADOS
CREATE TABLE Certificado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL DEFAULT obtener_institucion_sesion(),
    codigoVirtual VARCHAR(50) NOT NULL UNIQUE,
    numero VARCHAR(50) UNIQUE,
    estudiante_id UUID NOT NULL,
    fechaEmision DATE NOT NULL,
    horaEmision TIME NOT NULL,
    lugarEmision VARCHAR(100) DEFAULT 'PUNO',
    gradosCompletados TEXT[],
    situacionFinal VARCHAR(50),
    promedioGeneral DECIMAL(4,2),
    urlPdf TEXT,
    hashPdf VARCHAR(64),
    urlQR TEXT,
    observacionRetiros TEXT,
    observacionTraslados TEXT,
    observacionSIAGIE TEXT,
    observacionPruebasUbicacion TEXT,
    observacionConvalidacion TEXT,
    observacionOtros TEXT,
    ordenMerito INT,
    estado VARCHAR(20) DEFAULT 'EMITIDO',
    version INT DEFAULT 1,
    esRectificacion BOOLEAN DEFAULT false,
    certificadoAnterior_id UUID,
    motivoRectificacion TEXT,
    usuarioEmision_id UUID,
    fechaCreacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    usuarioAnulacion_id UUID,
    fechaAnulacion TIMESTAMPTZ,
    motivoAnulacion TEXT,
    CHECK (promedioGeneral IS NULL OR (promedioGeneral >= 0 AND promedioGeneral <= 20))
);

CREATE TABLE CertificadoDetalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificado_id UUID NOT NULL,
    anioLectivo_id UUID NOT NULL,
    grado_id UUID NOT NULL,
    situacionFinal VARCHAR(50),
    observaciones TEXT,
    orden INT NOT NULL,
    UNIQUE(certificado_id, anioLectivo_id, grado_id)
);

CREATE TABLE CertificadoNota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificadoDetalle_id UUID NOT NULL,
    area_id UUID NOT NULL,
    nota INT CHECK (nota >= 0 AND nota <= 20),
    notaLiteral VARCHAR(50),
    esExonerado BOOLEAN DEFAULT false,
    orden INT NOT NULL,
    UNIQUE(certificadoDetalle_id, area_id)
);

CREATE TABLE Verificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigoVirtual VARCHAR(50) NOT NULL,
    certificado_id UUID,
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ip VARCHAR(45),
    userAgent TEXT,
    ubicacion VARCHAR(255),
    resultado VARCHAR(30) NOT NULL,
    detalleResultado TEXT,
    tipoConsulta VARCHAR(30)
);

-- SOLICITUDES Y TRÁMITES
CREATE TABLE TipoSolicitud (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL DEFAULT obtener_institucion_sesion(),
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    requierePago BOOLEAN DEFAULT true,
    montoBase DECIMAL(10,2),
    tiempoEntregaDias INT,
    activo BOOLEAN DEFAULT true,
    UNIQUE(institucion_id, codigo),
    CHECK (montoBase IS NULL OR montoBase >= 0)
);

CREATE TABLE Solicitud (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numeroExpediente VARCHAR(50) UNIQUE,
    estudiante_id UUID NOT NULL,
    tipoSolicitud_id UUID NOT NULL,
    modalidadEntrega VARCHAR(30),
    direccionEntrega TEXT,
    numeroSeguimiento VARCHAR(50),
    estado VARCHAR(30) DEFAULT 'REGISTRADA',
    prioridad VARCHAR(20) DEFAULT 'NORMAL',
    pago_id UUID,
    certificado_id UUID,
    fechaSolicitud TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fechaValidacionPago TIMESTAMPTZ,
    fechaInicioProceso TIMESTAMPTZ,
    fechaGeneracionCertificado TIMESTAMPTZ,
    fechaFirma TIMESTAMPTZ,
    fechaEntrega TIMESTAMPTZ,
    fechaRechazo TIMESTAMPTZ,
    motivoRechazo TEXT,
    observaciones TEXT,
    usuarioSolicitud_id UUID,
    usuarioValidacionPago_id UUID,
    usuarioGeneracion_id UUID,
    usuarioFirma_id UUID,
    usuarioEntrega_id UUID,
    fechaActualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE SolicitudHistorial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id UUID NOT NULL,
    estadoAnterior VARCHAR(30),
    estadoNuevo VARCHAR(30) NOT NULL,
    observaciones TEXT,
    usuario_id UUID,
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL DEFAULT obtener_institucion_sesion(),
    numeroOrden VARCHAR(50) NOT NULL UNIQUE,
    numeroOperacion VARCHAR(50),
    monto DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'PEN',
    comision DECIMAL(10,2) DEFAULT 0,
    montoNeto DECIMAL(10,2),
    metodoPago VARCHAR(30),
    entidadBancaria VARCHAR(100),
    referenciaPago VARCHAR(100),
    fechaPago DATE NOT NULL,
    horaPago TIME,
    numeroRecibo VARCHAR(50),
    urlComprobante TEXT,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    conciliado BOOLEAN DEFAULT false,
    fechaConciliacion TIMESTAMPTZ,
    usuarioConciliacion_id UUID,
    observaciones TEXT,
    fechaRegistro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (monto > 0)
);

CREATE TABLE MetodoPago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL,
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    descripcion TEXT,
    requiereValidacion BOOLEAN DEFAULT true,
    comisionPorcentaje DECIMAL(5,2),
    comisionFija DECIMAL(10,2),
    activo BOOLEAN DEFAULT true,
    configuracion JSONB,
    UNIQUE(institucion_id, codigo)
);

CREATE TABLE PagoDetalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pago_id UUID NOT NULL,
    metodoPago_id UUID NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'PEN',
    numeroCelular VARCHAR(15),
    nombreTitular VARCHAR(200),
    terminal_id VARCHAR(50),
    lote VARCHAR(20),
    trace VARCHAR(20),
    codigoAutorizacion VARCHAR(50),
    ultimos4Digitos VARCHAR(4),
    tipoTarjeta VARCHAR(30),
    cuotas INT DEFAULT 1,
    qr_code TEXT,
    qr_id VARCHAR(100),
    transaction_id VARCHAR(100),
    pasarela VARCHAR(50),
    merchant_id VARCHAR(100),
    commerce_code VARCHAR(50),
    responseJSON JSONB,
    fechaTransaccion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (monto > 0)
);

CREATE TABLE PasarelaPago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL,
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    merchant_id VARCHAR(100),
    commerce_code VARCHAR(100),
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    webhook_url TEXT,
    webhook_secret TEXT,
    ambiente VARCHAR(20) DEFAULT 'SANDBOX',
    activo BOOLEAN DEFAULT true,
    configuracion JSONB,
    fechaActualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institucion_id, codigo)
);

CREATE TABLE WebhookPago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pasarela_id UUID,
    pago_id UUID,
    evento VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    headers JSONB,
    ip VARCHAR(45),
    procesado BOOLEAN DEFAULT false,
    fechaProcesamiento TIMESTAMPTZ,
    error TEXT,
    fechaRecepcion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ConciliacionBancaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL,
    entidadBancaria VARCHAR(100) NOT NULL,
    fechaConciliacion DATE NOT NULL,
    fechaInicio DATE NOT NULL,
    fechaFin DATE NOT NULL,
    totalRegistros INT,
    totalMonto DECIMAL(12,2),
    archivoOriginal_url TEXT,
    archivoNombre VARCHAR(255),
    estado VARCHAR(30) DEFAULT 'PENDIENTE',
    observaciones TEXT,
    usuario_id UUID,
    fechaCreacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ConciliacionDetalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conciliacion_id UUID NOT NULL,
    pago_id UUID,
    numeroOperacion VARCHAR(50),
    fechaTransaccion DATE,
    monto DECIMAL(10,2),
    conciliado BOOLEAN DEFAULT false,
    diferencia DECIMAL(10,2),
    observaciones TEXT
);

CREATE TABLE Notificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(30) NOT NULL,
    destinatario VARCHAR(150) NOT NULL,
    asunto VARCHAR(255),
    mensaje TEXT NOT NULL,
    canal VARCHAR(20) NOT NULL,
    solicitud_id UUID,
    certificado_id UUID,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    intentos INT DEFAULT 0,
    fechaEnvio TIMESTAMPTZ,
    fechaLeido TIMESTAMPTZ,
    error TEXT,
    fechaCreacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- USUARIOS Y SEGURIDAD
CREATE TABLE Usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    dni VARCHAR(8) UNIQUE,
    nombres VARCHAR(150),
    apellidos VARCHAR(150),
    telefono VARCHAR(20),
    cargo VARCHAR(100),
    ultimoAcceso TIMESTAMPTZ,
    intentosFallidos INT DEFAULT 0,
    bloqueado BOOLEAN DEFAULT false,
    fechaBloqueo TIMESTAMPTZ,
    activo BOOLEAN DEFAULT true,
    cambiarPassword BOOLEAN DEFAULT true,
    fechaCreacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Rol (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID,
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    nivel INT NOT NULL,
    activo BOOLEAN DEFAULT true,
    UNIQUE(institucion_id, codigo)
);

CREATE TABLE InstitucionUsuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    esAdministrador BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    fechaAsignacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    usuarioAsigno_id UUID,
    UNIQUE(institucion_id, usuario_id)
);

CREATE TABLE UsuarioRol (
    usuario_id UUID NOT NULL,
    rol_id UUID NOT NULL,
    fechaAsignacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    usuarioAsigno_id UUID,
    PRIMARY KEY (usuario_id, rol_id)
);

CREATE TABLE Permiso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE RolPermiso (
    rol_id UUID NOT NULL,
    permiso_id UUID NOT NULL,
    PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE Sesion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    ip VARCHAR(45),
    userAgent TEXT,
    fechaInicio TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fechaExpiracion TIMESTAMPTZ NOT NULL,
    fechaCierre TIMESTAMPTZ,
    activa BOOLEAN DEFAULT true,
    CHECK (fechaExpiracion > fechaInicio)
);

-- AUDITORÍA
CREATE TABLE Auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad VARCHAR(50) NOT NULL,
    entidadId UUID NOT NULL,
    accion VARCHAR(30) NOT NULL,
    datosAnteriores JSONB,
    datosNuevos JSONB,
    usuario_id UUID,
    ip VARCHAR(45),
    userAgent TEXT,
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Parametro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    valor TEXT NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    descripcion TEXT,
    modificable BOOLEAN DEFAULT true,
    fechaActualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    usuarioActualizacion_id UUID
);

-- ============================================
-- Parte 3: Foreign Keys (Relaciones)
-- c:\SIGCERH\bd\03_foreign_keys.sql
-- ============================================

-- INSTITUCIÓN Y NIVELES
ALTER TABLE NivelEducativo
    ADD CONSTRAINT fk_nivel_institucion FOREIGN KEY (institucion_id) REFERENCES ConfiguracionInstitucion(id) ON DELETE CASCADE;

ALTER TABLE InstitucionUsuario
    ADD CONSTRAINT fk_instuser_institucion FOREIGN KEY (institucion_id) REFERENCES ConfiguracionInstitucion(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_instuser_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_instuser_asignador FOREIGN KEY (usuarioAsigno_id) REFERENCES Usuario(id) ON DELETE SET NULL;

-- ESTUDIANTES
ALTER TABLE Estudiante
    ADD CONSTRAINT fk_estudiante_institucion FOREIGN KEY (institucion_id) REFERENCES ConfiguracionInstitucion(id) ON DELETE RESTRICT;

-- AÑO LECTIVO Y GRADOS
ALTER TABLE AnioLectivo
    ADD CONSTRAINT fk_anio_institucion FOREIGN KEY (institucion_id) REFERENCES ConfiguracionInstitucion(id) ON DELETE RESTRICT;

ALTER TABLE Grado
    ADD CONSTRAINT fk_grado_institucion FOREIGN KEY (institucion_id) REFERENCES ConfiguracionInstitucion(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_grado_nivel FOREIGN KEY (nivel_id) REFERENCES NivelEducativo(id) ON DELETE SET NULL;

ALTER TABLE AreaCurricular
    ADD CONSTRAINT fk_area_institucion FOREIGN KEY (institucion_id) REFERENCES ConfiguracionInstitucion(id) ON DELETE RESTRICT;

-- Foreign keys de Seccion y Matricula eliminadas - tablas no necesarias

ALTER TABLE CurriculoGrado
    ADD CONSTRAINT fk_curriculo_area FOREIGN KEY (area_id) REFERENCES AreaCurricular(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_curriculo_grado FOREIGN KEY (grado_id) REFERENCES Grado(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_curriculo_anio FOREIGN KEY (anioLectivo_id) REFERENCES AnioLectivo(id) ON DELETE RESTRICT;

-- Foreign keys de Periodo, Nota y Subsanacion eliminadas - tablas no necesarias

ALTER TABLE ActaFisica
    ADD CONSTRAINT fk_acta_anio FOREIGN KEY (anioLectivo_id) REFERENCES AnioLectivo(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_acta_grado FOREIGN KEY (grado_id) REFERENCES Grado(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_acta_usuario FOREIGN KEY (usuarioSubida_id) REFERENCES Usuario(id) ON DELETE SET NULL;

ALTER TABLE Certificado
    ADD CONSTRAINT fk_certificado_institucion FOREIGN KEY (institucion_id) REFERENCES ConfiguracionInstitucion(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_certificado_estudiante FOREIGN KEY (estudiante_id) REFERENCES Estudiante(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_certificado_anterior FOREIGN KEY (certificadoAnterior_id) REFERENCES Certificado(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_certificado_usuario_emision FOREIGN KEY (usuarioEmision_id) REFERENCES Usuario(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_certificado_usuario_anulacion FOREIGN KEY (usuarioAnulacion_id) REFERENCES Usuario(id) ON DELETE SET NULL;

ALTER TABLE CertificadoDetalle
    ADD CONSTRAINT fk_certdet_certificado FOREIGN KEY (certificado_id) REFERENCES Certificado(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_certdet_anio FOREIGN KEY (anioLectivo_id) REFERENCES AnioLectivo(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_certdet_grado FOREIGN KEY (grado_id) REFERENCES Grado(id) ON DELETE RESTRICT;

ALTER TABLE CertificadoNota
    ADD CONSTRAINT fk_certnota_detalle FOREIGN KEY (certificadoDetalle_id) REFERENCES CertificadoDetalle(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_certnota_area FOREIGN KEY (area_id) REFERENCES AreaCurricular(id) ON DELETE RESTRICT;

ALTER TABLE Verificacion
    ADD CONSTRAINT fk_verificacion_certificado FOREIGN KEY (certificado_id) REFERENCES Certificado(id) ON DELETE SET NULL;

ALTER TABLE TipoSolicitud
    ADD CONSTRAINT fk_tiposol_institucion FOREIGN KEY (institucion_id) REFERENCES ConfiguracionInstitucion(id) ON DELETE RESTRICT;

ALTER TABLE Solicitud
    ADD CONSTRAINT fk_solicitud_estudiante FOREIGN KEY (estudiante_id) REFERENCES Estudiante(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_solicitud_tipo FOREIGN KEY (tipoSolicitud_id) REFERENCES TipoSolicitud(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_solicitud_pago FOREIGN KEY (pago_id) REFERENCES Pago(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_solicitud_certificado FOREIGN KEY (certificado_id) REFERENCES Certificado(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_solicitud_usuario FOREIGN KEY (usuarioSolicitud_id) REFERENCES Usuario(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_solicitud_validador_pago FOREIGN KEY (usuarioValidacionPago_id) REFERENCES Usuario(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_solicitud_generador FOREIGN KEY (usuarioGeneracion_id) REFERENCES Usuario(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_solicitud_firmante FOREIGN KEY (usuarioFirma_id) REFERENCES Usuario(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_solicitud_entregador FOREIGN KEY (usuarioEntrega_id) REFERENCES Usuario(id) ON DELETE SET NULL;

ALTER TABLE SolicitudHistorial
    ADD CONSTRAINT fk_solhist_solicitud FOREIGN KEY (solicitud_id) REFERENCES Solicitud(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_solhist_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE SET NULL;

ALTER TABLE Pago
    ADD CONSTRAINT fk_pago_institucion FOREIGN KEY (institucion_id) REFERENCES ConfiguracionInstitucion(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_pago_usuario FOREIGN KEY (usuarioConciliacion_id) REFERENCES Usuario(id) ON DELETE SET NULL;

ALTER TABLE MetodoPago
    ADD CONSTRAINT fk_metodopago_institucion FOREIGN KEY (institucion_id) REFERENCES ConfiguracionInstitucion(id) ON DELETE CASCADE;

ALTER TABLE PagoDetalle
    ADD CONSTRAINT fk_pagodet_pago FOREIGN KEY (pago_id) REFERENCES Pago(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_pagodet_metodo FOREIGN KEY (metodoPago_id) REFERENCES MetodoPago(id) ON DELETE RESTRICT;

ALTER TABLE PasarelaPago
    ADD CONSTRAINT fk_pasarela_institucion FOREIGN KEY (institucion_id) REFERENCES ConfiguracionInstitucion(id) ON DELETE CASCADE;

ALTER TABLE WebhookPago
    ADD CONSTRAINT fk_webhook_pasarela FOREIGN KEY (pasarela_id) REFERENCES PasarelaPago(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_webhook_pago FOREIGN KEY (pago_id) REFERENCES Pago(id) ON DELETE SET NULL;

ALTER TABLE ConciliacionBancaria
    ADD CONSTRAINT fk_conciliacion_institucion FOREIGN KEY (institucion_id) REFERENCES ConfiguracionInstitucion(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_conciliacion_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE SET NULL;

ALTER TABLE ConciliacionDetalle
    ADD CONSTRAINT fk_concdet_conciliacion FOREIGN KEY (conciliacion_id) REFERENCES ConciliacionBancaria(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_concdet_pago FOREIGN KEY (pago_id) REFERENCES Pago(id) ON DELETE SET NULL;

ALTER TABLE Notificacion
    ADD CONSTRAINT fk_notif_solicitud FOREIGN KEY (solicitud_id) REFERENCES Solicitud(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_notif_certificado FOREIGN KEY (certificado_id) REFERENCES Certificado(id) ON DELETE SET NULL;

ALTER TABLE Rol
    ADD CONSTRAINT fk_rol_institucion FOREIGN KEY (institucion_id) REFERENCES ConfiguracionInstitucion(id) ON DELETE CASCADE;

ALTER TABLE UsuarioRol
    ADD CONSTRAINT fk_usurol_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_usurol_rol FOREIGN KEY (rol_id) REFERENCES Rol(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_usurol_asignador FOREIGN KEY (usuarioAsigno_id) REFERENCES Usuario(id) ON DELETE SET NULL;

ALTER TABLE RolPermiso
    ADD CONSTRAINT fk_rolperm_rol FOREIGN KEY (rol_id) REFERENCES Rol(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_rolperm_permiso FOREIGN KEY (permiso_id) REFERENCES Permiso(id) ON DELETE CASCADE;

ALTER TABLE Sesion
    ADD CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE;

ALTER TABLE Auditoria
    ADD CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE SET NULL;

ALTER TABLE Parametro
    ADD CONSTRAINT fk_parametro_usuario FOREIGN KEY (usuarioActualizacion_id) REFERENCES Usuario(id) ON DELETE SET NULL;

-- ============================================
-- Parte 4: Índices de Performance
-- c:\SIGCERH\bd\04_indices.sql
-- ============================================

-- CONFIGURACIÓN INSTITUCIONAL
CREATE INDEX idx_institucion_activo ON ConfiguracionInstitucion(activo) WHERE activo = true;
CREATE INDEX idx_institucion_codigo ON ConfiguracionInstitucion(codigoModular);

-- NIVEL EDUCATIVO
CREATE INDEX idx_nivel_institucion ON NivelEducativo(institucion_id);
CREATE INDEX idx_nivel_codigo ON NivelEducativo(institucion_id, codigo);
CREATE INDEX idx_nivel_activo ON NivelEducativo(activo) WHERE activo = true;

-- INSTITUCIÓN USUARIO
CREATE INDEX idx_instuser_institucion ON InstitucionUsuario(institucion_id);
CREATE INDEX idx_instuser_usuario ON InstitucionUsuario(usuario_id);
CREATE INDEX idx_instuser_activo ON InstitucionUsuario(institucion_id, usuario_id) WHERE activo = true;

-- ESTUDIANTE - Búsquedas frecuentes
CREATE INDEX idx_estudiante_institucion ON Estudiante(institucion_id);
CREATE INDEX idx_estudiante_inst_dni ON Estudiante(institucion_id, dni);
CREATE INDEX idx_estudiante_nombreCompleto ON Estudiante USING gin(nombreCompleto gin_trgm_ops);
CREATE INDEX idx_estudiante_estado ON Estudiante(estado) WHERE estado = 'ACTIVO';
CREATE INDEX idx_estudiante_apellidos ON Estudiante(apellidoPaterno, apellidoMaterno);
CREATE INDEX idx_estudiante_fechaNacimiento ON Estudiante(fechaNacimiento);

-- MATRÍCULA - Consultas por estudiante, año, grado
CREATE INDEX idx_matricula_estudiante ON Matricula(estudiante_id);
CREATE INDEX idx_matricula_anio ON Matricula(anioLectivo_id);
CREATE INDEX idx_matricula_grado ON Matricula(grado_id);
CREATE INDEX idx_matricula_seccion ON Matricula(seccion_id);
CREATE INDEX idx_matricula_codigo ON Matricula(codigo);
CREATE INDEX idx_matricula_estado ON Matricula(estado) WHERE estado = 'ACTIVO';
CREATE INDEX idx_matricula_anio_grado ON Matricula(anioLectivo_id, grado_id);
CREATE INDEX idx_matricula_estudiante_anio ON Matricula(estudiante_id, anioLectivo_id);

-- NOTAS - Performance crítico
CREATE INDEX idx_nota_matricula ON Nota(matricula_id);
CREATE INDEX idx_nota_area ON Nota(area_id);
CREATE INDEX idx_nota_periodo ON Nota(periodo_id);
CREATE INDEX idx_nota_matricula_area ON Nota(matricula_id, area_id);
CREATE INDEX idx_nota_matricula_periodo ON Nota(matricula_id, periodo_id);
CREATE INDEX idx_nota_usuario ON Nota(usuarioRegistro_id);

-- ACTAS OCR - Búsquedas por año/grado
CREATE INDEX idx_acta_anio ON ActaFisica(anioLectivo_id);
CREATE INDEX idx_acta_grado ON ActaFisica(grado_id);
CREATE INDEX idx_acta_seccion ON ActaFisica(seccion_id);
CREATE INDEX idx_acta_numero ON ActaFisica(numero);
CREATE INDEX idx_acta_procesado ON ActaFisica(procesadoConIA);
CREATE INDEX idx_acta_hash ON ActaFisica(hashArchivo);
CREATE INDEX idx_acta_json ON ActaFisica USING gin(datosExtraidosJSON);

-- CERTIFICADOS - Verificación y búsquedas
CREATE INDEX idx_certificado_institucion ON Certificado(institucion_id);
CREATE INDEX idx_certificado_estudiante ON Certificado(estudiante_id);
CREATE INDEX idx_certificado_codigoVirtual ON Certificado(codigoVirtual);
CREATE INDEX idx_certificado_numero ON Certificado(numero);
CREATE INDEX idx_certificado_estado ON Certificado(estado);
CREATE INDEX idx_certificado_fechaEmision ON Certificado(fechaEmision DESC);
CREATE INDEX idx_certificado_estudiante_estado ON Certificado(estudiante_id, estado);

CREATE INDEX idx_certdet_certificado ON CertificadoDetalle(certificado_id);
CREATE INDEX idx_certdet_anio ON CertificadoDetalle(anioLectivo_id);
CREATE INDEX idx_certdet_grado ON CertificadoDetalle(grado_id);

CREATE INDEX idx_certnota_detalle ON CertificadoNota(certificadoDetalle_id);
CREATE INDEX idx_certnota_area ON CertificadoNota(area_id);

-- VERIFICACIONES - Analytics
CREATE INDEX idx_verificacion_codigo ON Verificacion(codigoVirtual);
CREATE INDEX idx_verificacion_certificado ON Verificacion(certificado_id);
CREATE INDEX idx_verificacion_fecha ON Verificacion(fecha DESC);
CREATE INDEX idx_verificacion_resultado ON Verificacion(resultado);
CREATE INDEX idx_verificacion_ip ON Verificacion(ip);

-- TIPO SOLICITUD
CREATE INDEX idx_tiposol_institucion ON TipoSolicitud(institucion_id);
CREATE INDEX idx_tiposol_codigo ON TipoSolicitud(institucion_id, codigo);
CREATE INDEX idx_tiposol_activo ON TipoSolicitud(institucion_id) WHERE activo = true;

-- SOLICITUDES - Dashboard y seguimiento
CREATE INDEX idx_solicitud_estudiante ON Solicitud(estudiante_id);
CREATE INDEX idx_solicitud_tipo ON Solicitud(tipoSolicitud_id);
CREATE INDEX idx_solicitud_estado ON Solicitud(estado);
CREATE INDEX idx_solicitud_pago ON Solicitud(pago_id);
CREATE INDEX idx_solicitud_certificado ON Solicitud(certificado_id);
CREATE INDEX idx_solicitud_numeroExpediente ON Solicitud(numeroExpediente);
CREATE INDEX idx_solicitud_fechaSolicitud ON Solicitud(fechaSolicitud DESC);
CREATE INDEX idx_solicitud_estudiante_estado ON Solicitud(estudiante_id, estado);
CREATE INDEX idx_solicitud_prioridad ON Solicitud(prioridad) WHERE estado NOT IN ('ENTREGADA', 'RECHAZADA');

CREATE INDEX idx_solhist_solicitud ON SolicitudHistorial(solicitud_id);
CREATE INDEX idx_solhist_fecha ON SolicitudHistorial(fecha DESC);

-- PAGOS - Conciliación
CREATE INDEX idx_pago_institucion ON Pago(institucion_id);
CREATE INDEX idx_pago_numeroOrden ON Pago(numeroOrden);
CREATE INDEX idx_pago_numeroOperacion ON Pago(numeroOperacion);
CREATE INDEX idx_pago_estado ON Pago(estado);
CREATE INDEX idx_pago_inst_fecha ON Pago(institucion_id, fechaPago DESC);
CREATE INDEX idx_pago_conciliado ON Pago(conciliado) WHERE conciliado = false;

-- MÉTODO PAGO
CREATE INDEX idx_metodopago_institucion ON MetodoPago(institucion_id);
CREATE INDEX idx_metodopago_codigo ON MetodoPago(institucion_id, codigo);
CREATE INDEX idx_metodopago_tipo ON MetodoPago(tipo);
CREATE INDEX idx_metodopago_activo ON MetodoPago(institucion_id) WHERE activo = true;

-- PAGO DETALLE
CREATE INDEX idx_pagodet_pago ON PagoDetalle(pago_id);
CREATE INDEX idx_pagodet_metodo ON PagoDetalle(metodoPago_id);
CREATE INDEX idx_pagodet_transaction ON PagoDetalle(transaction_id);
CREATE INDEX idx_pagodet_celular ON PagoDetalle(numeroCelular);
CREATE INDEX idx_pagodet_pasarela ON PagoDetalle(pasarela);

-- PASARELA PAGO
CREATE INDEX idx_pasarela_institucion ON PasarelaPago(institucion_id);
CREATE INDEX idx_pasarela_codigo ON PasarelaPago(institucion_id, codigo);
CREATE INDEX idx_pasarela_activo ON PasarelaPago(institucion_id) WHERE activo = true;

-- WEBHOOK PAGO
CREATE INDEX idx_webhook_pasarela ON WebhookPago(pasarela_id);
CREATE INDEX idx_webhook_pago ON WebhookPago(pago_id);
CREATE INDEX idx_webhook_pendiente ON WebhookPago(procesado, fechaRecepcion) WHERE procesado = false;
CREATE INDEX idx_webhook_fecha ON WebhookPago(fechaRecepcion DESC);

-- CONCILIACIÓN BANCARIA
CREATE INDEX idx_conciliacion_institucion ON ConciliacionBancaria(institucion_id);
CREATE INDEX idx_conciliacion_fecha ON ConciliacionBancaria(fechaConciliacion DESC);
CREATE INDEX idx_conciliacion_estado ON ConciliacionBancaria(estado);
CREATE INDEX idx_conciliacion_banco ON ConciliacionBancaria(entidadBancaria);

-- CONCILIACIÓN DETALLE
CREATE INDEX idx_concdet_conciliacion ON ConciliacionDetalle(conciliacion_id);
CREATE INDEX idx_concdet_pago ON ConciliacionDetalle(pago_id);
CREATE INDEX idx_concdet_operacion ON ConciliacionDetalle(numeroOperacion);
CREATE INDEX idx_concdet_pendiente ON ConciliacionDetalle(conciliado) WHERE conciliado = false;

-- NOTIFICACIONES - Cola de envío
CREATE INDEX idx_notif_solicitud ON Notificacion(solicitud_id);
CREATE INDEX idx_notif_certificado ON Notificacion(certificado_id);
CREATE INDEX idx_notif_estado ON Notificacion(estado);
CREATE INDEX idx_notif_destinatario ON Notificacion(destinatario);
CREATE INDEX idx_notif_canal ON Notificacion(canal);
CREATE INDEX idx_notif_pendientes ON Notificacion(estado, fechaCreacion) WHERE estado = 'PENDIENTE';

-- USUARIOS - Autenticación
CREATE INDEX idx_usuario_username ON Usuario(username);
CREATE INDEX idx_usuario_email ON Usuario(email);
CREATE INDEX idx_usuario_dni ON Usuario(dni);
CREATE INDEX idx_usuario_activo ON Usuario(activo) WHERE activo = true;
CREATE INDEX idx_usuario_bloqueado ON Usuario(bloqueado) WHERE bloqueado = true;

-- ROL
CREATE INDEX idx_rol_institucion ON Rol(institucion_id);
CREATE INDEX idx_rol_codigo ON Rol(institucion_id, codigo);
CREATE INDEX idx_rol_activo ON Rol(institucion_id) WHERE activo = true;

CREATE INDEX idx_usurol_usuario ON UsuarioRol(usuario_id);
CREATE INDEX idx_usurol_rol ON UsuarioRol(rol_id);
CREATE INDEX idx_usurol_activo ON UsuarioRol(activo) WHERE activo = true;

CREATE INDEX idx_sesion_usuario ON Sesion(usuario_id);
CREATE INDEX idx_sesion_token ON Sesion(token);
CREATE INDEX idx_sesion_activa ON Sesion(activa, fechaExpiracion) WHERE activa = true;

-- AUDITORÍA - Reportes
CREATE INDEX idx_auditoria_entidad ON Auditoria(entidad, entidadId);
CREATE INDEX idx_auditoria_usuario ON Auditoria(usuario_id);
CREATE INDEX idx_auditoria_fecha ON Auditoria(fecha DESC);
CREATE INDEX idx_auditoria_accion ON Auditoria(accion);

-- ÁREA CURRICULAR
CREATE INDEX idx_area_institucion ON AreaCurricular(institucion_id);
CREATE INDEX idx_area_inst_codigo ON AreaCurricular(institucion_id, codigo);
CREATE INDEX idx_area_orden ON AreaCurricular(orden);
CREATE INDEX idx_area_inst_activo ON AreaCurricular(institucion_id) WHERE activo = true;

-- CURRÍCULO GRADO
CREATE INDEX idx_curriculo_area ON CurriculoGrado(area_id);
CREATE INDEX idx_curriculo_grado ON CurriculoGrado(grado_id);
CREATE INDEX idx_curriculo_anio ON CurriculoGrado(anioLectivo_id);

-- PERIODO
CREATE INDEX idx_periodo_anio ON Periodo(anioLectivo_id);
CREATE INDEX idx_periodo_orden ON Periodo(orden);

-- SECCIÓN
CREATE INDEX idx_seccion_grado ON Seccion(grado_id);
CREATE INDEX idx_seccion_anio ON Seccion(anioLectivo_id);
CREATE INDEX idx_seccion_activo ON Seccion(activo) WHERE activo = true;

-- AÑO LECTIVO
CREATE INDEX idx_anio_institucion ON AnioLectivo(institucion_id);
CREATE INDEX idx_anio_inst_activo ON AnioLectivo(institucion_id, activo) WHERE activo = true;
CREATE INDEX idx_anio_inst_anio ON AnioLectivo(institucion_id, anio DESC);

-- GRADO
CREATE INDEX idx_grado_institucion ON Grado(institucion_id);
CREATE INDEX idx_grado_nivel ON Grado(nivel_id);
CREATE INDEX idx_grado_inst_activo ON Grado(institucion_id) WHERE activo = true;

-- ============================================
-- Parte 5: Triggers y Funciones
-- c:\SIGCERH\bd\05_triggers_funciones.sql
-- ============================================

-- FUNCIÓN: Actualizar fechaActualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fechaActualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS para fechaActualizacion
CREATE TRIGGER trg_estudiante_actualizar
    BEFORE UPDATE ON Estudiante
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trg_usuario_actualizar
    BEFORE UPDATE ON Usuario
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trg_solicitud_actualizar
    BEFORE UPDATE ON Solicitud
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trg_config_actualizar
    BEFORE UPDATE ON ConfiguracionInstitucion
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trg_parametro_actualizar
    BEFORE UPDATE ON Parametro
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- FUNCIÓN: Registrar cambios en historial de solicitud
CREATE OR REPLACE FUNCTION registrar_historial_solicitud()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_solicitud_historial
    AFTER UPDATE ON Solicitud
    FOR EACH ROW
    EXECUTE FUNCTION registrar_historial_solicitud();

-- FUNCIÓN: Validar que el certificado no esté anulado antes de verificar
CREATE OR REPLACE FUNCTION validar_certificado_activo()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verificacion_validar
    BEFORE INSERT ON Verificacion
    FOR EACH ROW
    EXECUTE FUNCTION validar_certificado_activo();

-- FUNCIÓN: Obtener la única institución configurada
CREATE OR REPLACE FUNCTION obtener_institucion_default()
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql STABLE;

-- Alias para compatibilidad (usa la misma función)
CREATE OR REPLACE FUNCTION obtener_institucion_sesion()
RETURNS UUID AS $$
BEGIN
    RETURN obtener_institucion_default();
END;
$$ LANGUAGE plpgsql STABLE;

-- FUNCIÓN: Calcular edad desde fecha de nacimiento
CREATE OR REPLACE FUNCTION calcular_edad(fecha_nac DATE)
RETURNS INT AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(fecha_nac));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- FUNCIÓN: Generar código de matrícula automático
CREATE OR REPLACE FUNCTION generar_codigo_matricula()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_matricula_codigo
    BEFORE INSERT ON Matricula
    FOR EACH ROW
    EXECUTE FUNCTION generar_codigo_matricula();

-- FUNCIÓN: Generar número de expediente automático
CREATE OR REPLACE FUNCTION generar_numero_expediente()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_solicitud_expediente
    BEFORE INSERT ON Solicitud
    FOR EACH ROW
    EXECUTE FUNCTION generar_numero_expediente();

-- FUNCIÓN: Generar número de orden de pago
CREATE OR REPLACE FUNCTION generar_numero_orden()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pago_orden
    BEFORE INSERT ON Pago
    FOR EACH ROW
    EXECUTE FUNCTION generar_numero_orden();

-- FUNCIÓN: Incrementar intentos de notificación
CREATE OR REPLACE FUNCTION incrementar_intentos_notificacion()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notificacion_intentos
    BEFORE UPDATE ON Notificacion
    FOR EACH ROW
    EXECUTE FUNCTION incrementar_intentos_notificacion();

-- FUNCIÓN: Validar capacidad de sección
CREATE OR REPLACE FUNCTION validar_capacidad_seccion()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_matricula_capacidad
    BEFORE INSERT OR UPDATE ON Matricula
    FOR EACH ROW
    EXECUTE FUNCTION validar_capacidad_seccion();

-- FUNCIÓN: Bloquear usuario después de 5 intentos fallidos
CREATE OR REPLACE FUNCTION bloquear_usuario_intentos()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.intentosFallidos >= 5 AND OLD.intentosFallidos < 5 THEN
        NEW.bloqueado := true;
        NEW.fechaBloqueo := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuario_bloqueo
    BEFORE UPDATE ON Usuario
    FOR EACH ROW
    EXECUTE FUNCTION bloquear_usuario_intentos();

-- FUNCIÓN: Limpiar sesiones expiradas automáticamente
CREATE OR REPLACE FUNCTION limpiar_sesiones_expiradas()
RETURNS void AS $$
BEGIN
    UPDATE Sesion
    SET activa = false,
        fechaCierre = CURRENT_TIMESTAMP
    WHERE activa = true
      AND fechaExpiracion < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Vista materializada para estadísticas de certificados
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_estadisticas_certificados AS
SELECT 
    EXTRACT(YEAR FROM c.fechaEmision) as anio,
    EXTRACT(MONTH FROM c.fechaEmision) as mes,
    c.estado,
    COUNT(*) as total,
    AVG(c.promedioGeneral) as promedio_general
FROM Certificado c
GROUP BY EXTRACT(YEAR FROM c.fechaEmision), EXTRACT(MONTH FROM c.fechaEmision), c.estado;

-- Índice en la vista materializada
CREATE INDEX idx_mv_stats_cert_anio_mes ON mv_estadisticas_certificados(anio, mes);

-- COMENTARIOS EN TABLAS PRINCIPALES
COMMENT ON TABLE Estudiante IS 'Registro de estudiantes del colegio';
COMMENT ON TABLE Matricula IS 'Matrículas por año lectivo y grado';
COMMENT ON TABLE Nota IS 'Calificaciones por área y periodo';
COMMENT ON TABLE ActaFisica IS 'Actas escaneadas procesadas con IA (OCR)';
COMMENT ON TABLE Certificado IS 'Certificados de estudios emitidos';
COMMENT ON TABLE Solicitud IS 'Solicitudes de trámites documentarios';
COMMENT ON TABLE Usuario IS 'Usuarios del sistema';
COMMENT ON TABLE Auditoria IS 'Log de auditoría de todas las operaciones';

-- FUNCIÓN: Validar que estudiante pertenece a la institución
CREATE OR REPLACE FUNCTION validar_estudiante_institucion()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_matricula_validar_institucion
    BEFORE INSERT OR UPDATE ON Matricula
    FOR EACH ROW
    EXECUTE FUNCTION validar_estudiante_institucion();

CREATE TRIGGER trg_certificado_validar_institucion
    BEFORE INSERT OR UPDATE ON Certificado
    FOR EACH ROW
    EXECUTE FUNCTION validar_estudiante_institucion();

-- FUNCIÓN: Validar consistencia de institución entre entidades relacionadas
CREATE OR REPLACE FUNCTION validar_consistencia_institucion()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_seccion_validar_institucion
    BEFORE INSERT OR UPDATE ON Seccion
    FOR EACH ROW
    EXECUTE FUNCTION validar_consistencia_institucion();

-- FUNCIÓN: Calcular monto neto del pago (monto - comisión)
CREATE OR REPLACE FUNCTION calcular_monto_neto_pago()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.comision IS NOT NULL AND NEW.comision > 0 THEN
        NEW.montoNeto := NEW.monto - NEW.comision;
    ELSE
        NEW.montoNeto := NEW.monto;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pago_calcular_neto
    BEFORE INSERT OR UPDATE ON Pago
    FOR EACH ROW
    EXECUTE FUNCTION calcular_monto_neto_pago();

-- FUNCIÓN: Validar que la suma de PagoDetalle no exceda el monto del Pago
CREATE OR REPLACE FUNCTION validar_monto_pago_detalle()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pagodetalle_validar_monto
    BEFORE INSERT OR UPDATE ON PagoDetalle
    FOR EACH ROW
    EXECUTE FUNCTION validar_monto_pago_detalle();

-- FUNCIÓN: Actualizar vista materializada de estadísticas por institución
CREATE OR REPLACE FUNCTION refrescar_estadisticas()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_certificados;
END;
$$ LANGUAGE plpgsql;

-- VISTA MATERIALIZADA: Estadísticas por institución
DROP MATERIALIZED VIEW IF EXISTS mv_estadisticas_certificados;
CREATE MATERIALIZED VIEW mv_estadisticas_certificados AS
SELECT 
    c.institucion_id,
    EXTRACT(YEAR FROM c.fechaEmision) as anio,
    EXTRACT(MONTH FROM c.fechaEmision) as mes,
    c.estado,
    COUNT(*) as total,
    AVG(c.promedioGeneral) as promedio_general
FROM Certificado c
GROUP BY c.institucion_id, EXTRACT(YEAR FROM c.fechaEmision), EXTRACT(MONTH FROM c.fechaEmision), c.estado;

CREATE UNIQUE INDEX idx_mv_stats_cert_unique ON mv_estadisticas_certificados(institucion_id, anio, mes, estado);
CREATE INDEX idx_mv_stats_cert_institucion ON mv_estadisticas_certificados(institucion_id);

-- COMENTARIOS EN TABLAS PRINCIPALES
COMMENT ON TABLE ConfiguracionInstitucion IS 'Configuración de instituciones educativas (multi-tenant)';
COMMENT ON TABLE NivelEducativo IS 'Niveles educativos por institución (Inicial, Primaria, Secundaria)';
COMMENT ON TABLE InstitucionUsuario IS 'Relación entre usuarios e instituciones que administran';
COMMENT ON TABLE Estudiante IS 'Registro de estudiantes por institución';
COMMENT ON TABLE Matricula IS 'Matrículas por año lectivo y grado';
COMMENT ON TABLE Nota IS 'Calificaciones por área y periodo';
COMMENT ON TABLE ActaFisica IS 'Actas escaneadas procesadas con IA (OCR)';
COMMENT ON TABLE Certificado IS 'Certificados de estudios emitidos por institución';
COMMENT ON TABLE Solicitud IS 'Solicitudes de trámites documentarios';
COMMENT ON TABLE MetodoPago IS 'Métodos de pago configurados por institución (Yape, POS, Tarjeta, etc)';
COMMENT ON TABLE PagoDetalle IS 'Detalle de transacciones por método de pago';
COMMENT ON TABLE PasarelaPago IS 'Configuración de pasarelas de pago (Niubiz, Culqi, MercadoPago)';
COMMENT ON TABLE WebhookPago IS 'Log de webhooks recibidos de pasarelas de pago';
COMMENT ON TABLE ConciliacionBancaria IS 'Proceso de conciliación bancaria';
COMMENT ON TABLE Usuario IS 'Usuarios del sistema';
COMMENT ON TABLE Auditoria IS 'Log de auditoría de todas las operaciones';

-- COMENTARIOS EN CAMPOS CRÍTICOS
COMMENT ON COLUMN Estudiante.institucion_id IS 'Institución a la que pertenece el estudiante';
COMMENT ON COLUMN Estudiante.sexo IS 'M=Mujer, H=Hombre';
COMMENT ON COLUMN ActaFisica.datosExtraidosJSON IS 'Datos extraídos por Gemini AI en formato JSON';
COMMENT ON COLUMN Certificado.codigoVirtual IS 'Código único para verificación online';
COMMENT ON COLUMN Certificado.hashPdf IS 'SHA-256 del PDF para verificación de integridad';
COMMENT ON COLUMN PagoDetalle.numeroCelular IS 'Número celular para pagos Yape/Plin';
COMMENT ON COLUMN PagoDetalle.terminal_id IS 'ID del terminal POS';
COMMENT ON COLUMN PagoDetalle.transaction_id IS 'ID de transacción de la pasarela';
COMMENT ON COLUMN PagoDetalle.responseJSON IS 'Respuesta completa de la pasarela de pago';
