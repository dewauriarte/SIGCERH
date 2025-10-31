# 🎯 SPRINT 10: MÓDULO NOTIFICACIONES

> **Módulo**: Backend - Notificaciones  
> **Duración**: 3-4 días  
> **Prioridad**: 🟢 MEDIA  
> **Estado**: 🔄 En progreso (Fases 1-6 completadas)

---

## 📌 Objetivo

Sistema de notificaciones por email (automático) y generación de listas para notificación manual por SMS/WhatsApp.

---

## 🎯 Metas del Sprint

- [x] Servicio de email con Nodemailer (Gmail SMTP)
- [x] Cola de notificaciones
- [x] Plantillas HTML de emails
- [x] Reintento automático en caso de fallo
- [x] Listado de notificaciones pendientes para WhatsApp/SMS
- [x] Generación de enlaces wa.me para WhatsApp
- [x] Registro de notificaciones enviadas
- [ ] Tests >80% coverage

---

## 📊 Tabla Involucrada (1)

- [x] Notificacion

---

## ✅ Tareas Principales

### 🟦 FASE 1: EmailService (6h) ✅
- [x] Configurar Nodemailer con Gmail SMTP
- [x] Método enviarEmail()
- [x] Manejo de errores SMTP
- [x] Retry logic (3 intentos)
- [x] Validar credenciales SMTP en startup

### 🟦 FASE 2: Plantillas de Email (4h) ✅
- [x] Template engine (Handlebars)
- [x] Plantillas HTML por tipo de notificación:
  - [x] Acta encontrada (notificar pago)
  - [x] Certificado emitido
- [x] Header y footer común
- [x] Diseño responsive

### 🟦 FASE 3: NotificacionService (5h) ✅
- [x] create() - Crear notificación
- [x] enviarPorEmail() - Envío automático
- [x] marcarComoEnviada()
- [x] marcarComoFallida()
- [x] reintentar()
- [x] findPendientes()
- [x] generarListadoManual() - Para WhatsApp/SMS

### 🟦 FASE 4: Cola y Worker (3h) ✅
- [x] Implementar cola simple en memoria
- [x] Worker que procesa cola cada 10 segundos
- [x] Priorización de notificaciones

### 🟦 FASE 5: Listado para WhatsApp/SMS Manual (3h) ✅
- [x] WhatsAppService implementado
- [x] Filtrar notificaciones pendientes de envío manual
- [x] Generar enlaces wa.me con mensaje pre-llenado
- [x] Exportar a CSV/Excel
- [x] Marcar como enviada manualmente

### 🟦 FASE 6: Integración con Solicitudes (3h) ✅
- [x] Hook en transiciones críticas (acta encontrada, certificado emitido)
- [x] Crear notificación automática
- [x] Enviar email automáticamente
- [x] Worker integrado en servidor

### 🟦 FASE 7: Controllers y Routes (2h)
- [ ] NotificacionesController
- [ ] Endpoint para ver pendientes
- [ ] Endpoint para listado manual

### 🟦 FASE 8: Testing (4h)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Mock de envío de emails
- [ ] Test de reintentos

### 🟦 FASE 9: Documentación (2h)
- [ ] Documentar configuración SMTP
- [ ] Guía de notificaciones manuales
- [ ] Plantillas disponibles

---

## 📋 Endpoints

```
# Sistema (interno)
POST   /api/notificaciones/enviar

# Mesa de Partes (notificación manual)
GET    /api/notificaciones/pendientes-whatsapp
GET    /api/notificaciones/pendientes-sms
GET    /api/notificaciones/exportar-csv
POST   /api/notificaciones/:id/marcar-enviada

# Admin
GET    /api/notificaciones
GET    /api/notificaciones/:id
POST   /api/notificaciones/:id/reintentar
```

---

## 📧 Canales de Notificación

### Email (Automático - GRATIS)
- Gmail SMTP configurado
- Límite: 500 emails/día
- Envío automático en cada transición
- Reintentos en caso de fallo

### WhatsApp (Manual - GRATIS)
- Sistema genera lista con enlaces wa.me
- Mesa de Partes hace clic en cada enlace
- Ejemplo: `https://wa.me/51999999999?text=Hola,%20su%20solicitud...`
- Marca como enviada manualmente

### SMS (Manual - COSTO)
- Sistema genera lista para copiar/pegar
- Mesa de Partes envía manualmente
- Marcar como enviada

---

## 🎯 Ejemplo de Plantilla Email

**Asunto**: Acta encontrada - Solicitud S-2025-001234

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Notificación UGEL</title>
</head>
<body style="font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h2>¡Buenas noticias!</h2>
    <p>Hola <strong>{{nombreEstudiante}}</strong>,</p>
    <p>Encontramos su acta en nuestro archivo.</p>
    <p>Código de seguimiento: <strong>{{codigoSeguimiento}}</strong></p>
    <p>Para continuar con la emisión de su certificado, realice el pago de <strong>S/ 15.00</strong>:</p>
    <ul>
      <li>Yape/Plin: Escanear QR en plataforma</li>
      <li>Efectivo: Ventanilla UGEL</li>
    </ul>
    <a href="{{enlacePlataforma}}" style="...">Ver mi solicitud</a>
    <hr>
    <p style="font-size: 12px; color: #666;">
      UGEL XX - Sistema de Certificados Históricos
    </p>
  </div>
</body>
</html>
```

---

## 🧪 Criterios de Aceptación

- [ ] Emails se envían automáticamente
- [ ] Plantillas HTML funcionan
- [ ] Reintentos funcionan en caso de fallo
- [ ] Listado de WhatsApp genera enlaces correctos
- [ ] CSV se exporta correctamente
- [ ] Notificaciones se registran en BD
- [ ] Tests >80% coverage

---

## ⚠️ Dependencias

- Sprint 07 - Módulo solicitudes

---

## 📝 Configuración Necesaria

Variables en `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=certificados@ugel.gob.pe
SMTP_PASSWORD=app_password_aqui
SMTP_FROM=UGEL XX <certificados@ugel.gob.pe>
```

**Nota**: Usar App Password de Google, no la contraseña normal.

---

**✅ SPRINT FINAL DEL BACKEND COMPLETADO**

Todos los 11 sprints del Backend han sido planificados.

**🔗 Siguiente módulo**: Frontend (02_FRONTEND)

