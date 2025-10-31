-- ============================================
-- Parte 2: Certificados, Usuarios y Seguridad
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
