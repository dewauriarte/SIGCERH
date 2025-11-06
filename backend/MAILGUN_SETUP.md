# 📧 Configuración de Mailgun para SIGCERH

## ¿Por qué Mailgun?

Mailgun es una plataforma profesional de envío de emails que ofrece:
- ✅ **5,000 emails gratis por mes** (los primeros 3 meses)
- ✅ **1,000 validaciones de email gratis por mes** (permanentemente)
- ✅ Alta deliverability (99%+ de entregabilidad)
- ✅ Tracking de opens, clicks, bounces
- ✅ API simple y confiable
- ✅ Mejor que Gmail SMTP para producción

## 🚀 Pasos para Configurar Mailgun

### 1. Crear Cuenta en Mailgun

1. Ve a [https://app.mailgun.com/](https://app.mailgun.com/)
2. Haz clic en "Sign Up"
3. Completa el registro con tu email
4. Verifica tu email

### 2. Obtener Credenciales

1. Una vez logueado, ve al Dashboard
2. En el menú lateral, haz clic en **"Sending" > "Domains"**
3. Verás un dominio sandbox (ejemplo: `sandboxXXXXX.mailgun.org`)
4. Haz clic en el dominio sandbox
5. En la sección **"Domain Information"**, encontrarás:
   - **API Key**: En "Settings" > "API Keys"
   - **Domain**: El nombre del dominio (ejemplo: `sandboxXXXXX.mailgun.org`)

### 3. Obtener API Key

1. Ve a **"Settings" > "API Keys"** en el menú lateral
2. Copia la **Private API Key** (empieza con `key-`)
3. **IMPORTANTE**: Guarda esta key de forma segura

### 4. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env` en la carpeta `backend`:

```env
# ============================================
# EMAIL - MAILGUN (Recomendado para producción)
# ============================================
# API Key de Mailgun (obtener de: https://app.mailgun.com/settings/api_security)
MAILGUN_API_KEY=key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Dominio de Mailgun (usar el sandbox mientras se prueba)
# Ejemplo: sandboxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.mailgun.org
MAILGUN_DOMAIN=sandboxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.mailgun.org

# Email "From" (debe ser del mismo dominio)
# Ejemplo: noreply@sandboxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.mailgun.org
MAILGUN_FROM=SIGCERH <noreply@sandboxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.mailgun.org>

# ============================================
# EMAIL - SMTP (Opcional - Fallback)
# ============================================
# Si Mailgun no está configurado, el sistema usará SMTP tradicional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@sigcerh.local
```

### 5. Agregar Emails Autorizados (Solo para Sandbox)

⚠️ **IMPORTANTE**: El dominio sandbox de Mailgun solo permite enviar emails a direcciones autorizadas.

Para autorizar un email:

1. Ve a tu dominio en Mailgun
2. Haz clic en **"Authorized Recipients"**
3. Haz clic en **"Add Recipient"**
4. Ingresa el email al que quieres enviar (tu email de prueba)
5. Mailgun enviará un email de confirmación a esa dirección
6. Haz clic en el link de confirmación

**Puedes agregar hasta 5 emails autorizados en el plan gratuito.**

### 6. Configurar Dominio Propio (Opcional - Producción)

Para producción, es recomendable usar tu propio dominio:

1. En Mailgun, ve a **"Sending" > "Domains"**
2. Haz clic en **"Add New Domain"**
3. Ingresa tu dominio (ejemplo: `sigcerh.edu.pe`)
4. Sigue las instrucciones para agregar los registros DNS:
   - **TXT**: Para verificación
   - **MX**: Para recibir emails (opcional)
   - **CNAME**: Para tracking

**Con dominio propio puedes enviar a cualquier email sin autorización previa.**

## 🧪 Probar la Configuración

1. Asegúrate de que las variables estén en `.env`
2. Reinicia el servidor backend:
   ```bash
   npm run dev
   ```
3. Deberías ver en los logs:
   ```
   ✓ Servicio de email configurado: Mailgun
   ✓ Conexión Mailgun verificada exitosamente
   ```

4. Prueba enviando un email de recuperación de contraseña o OTP

## 📊 Monitorear Envíos

1. Ve al Dashboard de Mailgun
2. Haz clic en **"Sending" > "Logs"**
3. Verás todos los emails enviados con su estado:
   - ✅ Delivered: Email entregado exitosamente
   - ⏳ Queued: Email en cola
   - ❌ Failed: Error al enviar
   - 📬 Opened: Email abierto por el destinatario
   - 🔗 Clicked: Link clickeado

## 🔄 Alternativa: SMTP Tradicional

Si prefieres no usar Mailgun, el sistema automáticamente usará SMTP tradicional (Gmail).

Para configurar Gmail SMTP:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucorreo@gmail.com
SMTP_PASSWORD=tu_app_password
SMTP_FROM=SIGCERH <tucorreo@gmail.com>
```

**Nota**: Para Gmail necesitas una "App Password", no tu contraseña regular.

## ❓ Solución de Problemas

### Error: "Forbidden"
- Verifica que tu API Key sea correcta
- Asegúrate de usar la **Private API Key**, no la Public

### Error: "Free accounts are for test purposes only..."
- El email destinatario no está en la lista de "Authorized Recipients"
- Agrega el email a la lista o usa un dominio verificado

### No se envían emails
- Verifica que las variables MAILGUN_* estén en .env
- Revisa los logs del servidor: `npm run dev`
- Verifica los logs de Mailgun en su dashboard

## 📚 Recursos

- [Documentación de Mailgun](https://documentation.mailgun.com/)
- [Dashboard de Mailgun](https://app.mailgun.com/)
- [Pricing de Mailgun](https://www.mailgun.com/pricing/)

---

**Última actualización**: Configuración implementada en Sprint 3 - Autenticación y Seguridad

