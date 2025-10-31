-- ============================================
-- Parte 4: Índices de Performance
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
