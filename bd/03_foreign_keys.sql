-- ============================================
-- Parte 3: Foreign Keys (Relaciones)
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
