-- ============================================
-- Parte 5: Triggers y Funciones
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
