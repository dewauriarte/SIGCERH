-- Migración: Crear tabla OTP para códigos de verificación
-- Fecha: 2025-11-06
-- Sistema: SIGCERH

-- Crear tabla OTP
CREATE TABLE IF NOT EXISTS otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  codigo_hash VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('EMAIL', 'SMS')),
  proposito VARCHAR(50) NOT NULL CHECK (proposito IN (
    'REGISTRO',
    'LOGIN',
    'RECUPERACION_PASSWORD',
    'CAMBIO_EMAIL',
    'CAMBIO_TELEFONO',
    'VERIFICACION_2FA'
  )),
  intentos INTEGER NOT NULL DEFAULT 0,
  usado BOOLEAN NOT NULL DEFAULT false,
  expira_en TIMESTAMP NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_otp_usuario_id ON otp(usuario_id);
CREATE INDEX idx_otp_proposito ON otp(proposito);
CREATE INDEX idx_otp_expira_en ON otp(expira_en);
CREATE INDEX idx_otp_usado ON otp(usado);
CREATE INDEX idx_otp_creado_en ON otp(creado_en);

-- Crear índice compuesto para búsquedas comunes
CREATE INDEX idx_otp_usuario_proposito_usado ON otp(usuario_id, proposito, usado);

-- Comentarios de la tabla
COMMENT ON TABLE otp IS 'Almacena códigos OTP (One-Time Password) para verificación de usuarios';
COMMENT ON COLUMN otp.id IS 'ID único del registro OTP';
COMMENT ON COLUMN otp.usuario_id IS 'ID del usuario al que pertenece el OTP';
COMMENT ON COLUMN otp.codigo_hash IS 'Hash del código OTP (bcrypt)';
COMMENT ON COLUMN otp.tipo IS 'Tipo de envío del OTP: EMAIL o SMS';
COMMENT ON COLUMN otp.proposito IS 'Propósito del OTP: registro, login, recuperación, etc.';
COMMENT ON COLUMN otp.intentos IS 'Número de intentos de verificación realizados';
COMMENT ON COLUMN otp.usado IS 'Indica si el OTP ya fue usado exitosamente';
COMMENT ON COLUMN otp.expira_en IS 'Fecha y hora de expiración del OTP';
COMMENT ON COLUMN otp.creado_en IS 'Fecha y hora de creación del OTP';
COMMENT ON COLUMN otp.actualizado_en IS 'Fecha y hora de última actualización';

-- Trigger para actualizar automáticamente el campo actualizado_en
CREATE OR REPLACE FUNCTION update_otp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_otp_updated_at
  BEFORE UPDATE ON otp
  FOR EACH ROW
  EXECUTE FUNCTION update_otp_updated_at();

-- Función para limpiar OTPs expirados (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION clean_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM otp 
  WHERE expira_en < CURRENT_TIMESTAMP 
  OR (usado = true AND creado_en < CURRENT_TIMESTAMP - INTERVAL '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clean_expired_otps() IS 'Limpia OTPs expirados y OTPs usados de hace más de 7 días';

-- Log de migración
INSERT INTO migraciones (nombre, descripcion, ejecutado_en)
VALUES (
  'create_otp_table',
  'Crea tabla OTP para códigos de verificación de usuarios',
  CURRENT_TIMESTAMP
)
ON CONFLICT (nombre) DO NOTHING;
