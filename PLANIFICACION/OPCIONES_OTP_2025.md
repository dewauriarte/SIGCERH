# Opciones Gratuitas de OTP para SIGCERH (2025)

## 📋 Resumen Ejecutivo

Este documento analiza las mejores opciones gratuitas para implementar OTP (One-Time Password) en el sistema SIGCERH, tanto para autenticación vía **Email** como **SMS**.

---

## 🎯 Opciones Principales

### 1. **OTP por Email (RECOMENDADO - Más Fácil y Barato)**

#### ✅ **Nodemailer con Gmail** (YA INSTALADO)
**Estado**: Ya implementado en el sistema
**Costo**: Gratis
**Límites**: 
- Gmail personal: ~500 emails/día
- Gmail Workspace: 2,000 emails/día

**Ventajas**:
- Ya está configurado en tu sistema
- Sin costos adicionales
- Fácil implementación
- Ideal para empezar

**Desventajas**:
- Límite diario de envíos
- No es profesional para producción a gran escala

**Implementación**: Ver sección "Implementación OTP Email" más abajo

---

#### ✅ **Brevo (antes Sendinblue)** - MEJOR OPCIÓN EMAIL
**Costo**: Gratis
**Plan Free**: 
- ✅ 300 emails por DÍA (9,000/mes)
- ✅ API REST y SMTP
- ✅ Sin tarjeta de crédito
- ✅ Emails transaccionales incluidos
- ✅ Soporte por email
- ✅ Webhooks
- ✅ Logs ilimitados

**Planes Pagados**:
- Starter: Desde $9/mes (5,000 emails/mes)
- Standard: Desde $19/mes (10,000 emails/mes) + Automatización

**Ventajas**:
- Plan gratuito generoso (300 emails/día)
- API fácil de usar
- Excelente deliverability
- Buena reputación
- Dashboard con estadísticas

**Implementación**:
```typescript
// Instalar SDK
npm install @getbrevo/brevo

// Configuración
import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(0, process.env.BREVO_API_KEY);

// Enviar OTP
const sendSmtpEmail = {
  sender: { email: 'noreply@tudominio.com', name: 'SIGCERH' },
  to: [{ email: user.email }],
  subject: 'Código de Verificación',
  htmlContent: `<p>Tu código OTP es: <strong>${otp}</strong></p>`
};

await apiInstance.sendTransacEmail(sendSmtpEmail);
```

**Registro**: https://www.brevo.com/pricing/

---

#### ✅ **SendPulse** - Alternativa Email
**Costo**: Gratis
**Plan Free**: 
- 12,000 emails/mes (400/día)
- API y SMTP
- Soporte 24/7

**Planes Pagados**:
- $60/mes para 100,000 emails
- Pay-as-you-go: $28 por 20,000 emails (válidos 12 meses)

**Ventajas**:
- Más emails en plan gratuito que Brevo
- Soporte 24/7 incluso en plan free
- Editor visual incluido

**Registro**: https://sendpulse.com/

---

#### ✅ **Resend** - Moderna Opción Email
**Costo**: Gratis
**Plan Free**: 
- 100 emails/día (3,000/mes)
- API moderna y simple
- Sin tarjeta de crédito

**Planes Pagados**:
- $20/mes por 50,000 emails

**Ventajas**:
- API muy moderna y simple
- Documentación excelente
- Diseñado para desarrolladores
- React Email support

**Implementación**:
```typescript
npm install resend

import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@tudominio.com',
  to: user.email,
  subject: 'Código de Verificación',
  html: `<p>Tu código OTP es: <strong>${otp}</strong></p>`
});
```

**Registro**: https://resend.com/

---

### 2. **OTP por SMS** (Más Costoso)

#### ⚠️ **Twilio** - El más usado pero PAGO
**Costo**: NO ES GRATUITO
**Trial**: $15 de crédito gratis al registrarse
**Precio Real**: ~$0.0079 por SMS (México)

**No recomendado para empezar** debido a los costos.

---

#### ✅ **Phone.Email** - SMS GRATUITO (MÁS INTERESANTE)
**Costo**: GRATIS
**Plan Free**: 
- ✅ 1,000 SMS GRATIS por mes (por 6 meses)
- ✅ Verificación global
- ✅ API simple
- ✅ Widget de "Sign in with Phone"
- ✅ Soporte para múltiples frameworks

**Cómo funciona**:
1. Usuario hace clic en botón "Sign in with Phone"
2. Abre ventana de autenticación
3. Usuario ingresa número de teléfono
4. Recibe OTP por SMS
5. Ingresa OTP
6. Phone.Email devuelve un JSON URL con el número verificado

**Ventajas**:
- Realmente GRATIS (1,000 SMS/mes por 6 meses)
- Fácil integración
- Widget pre-construido
- Soporte React, Node.js, PHP, Python, etc.
- No necesitas gestionar el envío de SMS tú mismo

**Desventajas**:
- Después de 6 meses necesitarás renovar o migrar
- Depende de servicio de terceros
- Widget visible de Phone.Email

**Implementación**:
```html
<!-- En tu frontend -->
<div id="pe_signInButton"></div>

<script src="https://www.phone.email/sign-in-button-v1.js"></script>
<script>
  PhoneEmail.init({
    apiKey: 'TU_API_KEY',
    elementId: 'pe_signInButton',
    onSuccess: function(data) {
      // data contiene el número verificado
      console.log('Teléfono verificado:', data.phoneNumber);
      // Enviar al backend para crear sesión
    }
  });
</script>
```

**Registro**: https://www.phone.email/

---

#### ⚠️ **SNS (AWS)** - SMS Pago pero escalable
**Costo**: NO ES GRATUITO
**Precio**: ~$0.00645 por SMS

**No recomendado** para proyectos pequeños por complejidad y costo.

---

## 🏆 Recomendaciones por Caso de Uso

### Para Proyectos Pequeños/Medianos (RECOMENDADO):
1. **Email OTP con Brevo** (Plan Free: 300 emails/día)
   - ✅ Fácil implementación
   - ✅ Completamente gratis
   - ✅ Profesional
   - ✅ Sin tarjeta de crédito

2. **Email OTP con Gmail + Nodemailer** (Ya lo tienes)
   - ✅ Listo para usar
   - ✅ Cero configuración adicional
   - ✅ Perfecto para desarrollo y pruebas

### Para Verificación Telefónica (OPCIONAL):
**Phone.Email** (1,000 SMS gratis/mes por 6 meses)
- ✅ Única opción verdaderamente gratuita para SMS
- ⚠️ Limitado a 6 meses
- ⚠️ Depende de terceros

---

## 💡 Mi Recomendación Principal

### Fase 1 (INMEDIATO): Email OTP con sistema actual
**Usar**: Nodemailer + Gmail (que ya tienes instalado)
- Sin costos
- Sin configuración adicional
- Implementación en 1-2 horas

### Fase 2 (CUANDO CREZCAS): Migrar a Brevo
**Cuando**: Superes 200 emails/día o necesites más profesionalismo
- Plan gratuito de 300 emails/día
- Registro en 5 minutos
- Migración simple (solo cambiar transporter)

### Fase 3 (FUTURO): SMS Opcional
**Si realmente necesitas SMS**: Phone.Email
- 1,000 SMS gratis/mes
- Evaluar después de 6 meses si vale la pena pagar

---

## 📊 Comparativa Rápida

| Servicio | Tipo | Plan Free | Límite Free | Pros | Contras |
|----------|------|-----------|-------------|------|---------|
| **Gmail + Nodemailer** | Email | ✅ Sí | 500/día | Ya instalado, gratis | Límite bajo |
| **Brevo** | Email | ✅ Sí | 300/día | Profesional, sin CC | Límite diario |
| **SendPulse** | Email | ✅ Sí | 400/día | Más emails | UI menos intuitiva |
| **Resend** | Email | ✅ Sí | 100/día | API moderna | Menos emails |
| **Phone.Email** | SMS | ✅ Sí | 1000/mes (6 meses) | SMS gratis | Temporal |
| **Twilio** | SMS | ⚠️ $15 crédito | N/A | Más usado | Caro |

---

## 🚀 Próximos Pasos

1. ✅ **Implementar OTP por Email** con sistema actual (Nodemailer)
2. ✅ **Crear módulo OTP** reutilizable
3. ⚠️ **Evaluar Brevo** cuando necesites más capacidad
4. ⚠️ **Considerar Phone.Email** solo si realmente necesitas SMS

---

## 📝 Notas Adicionales

### Seguridad del OTP:
- OTP de 6 dígitos
- Expiración: 5-10 minutos
- Límite de intentos: 3-5
- Rate limiting: 1 OTP cada 60 segundos por usuario
- Almacenar hash del OTP, no en texto plano

### Mejores Prácticas:
- No enviar OTP por canal inseguro
- Log de intentos fallidos
- Bloqueo temporal después de múltiples fallos
- Expirar OTP usado
- Generar OTP criptográficamente seguro

---

**Fecha**: Noviembre 2025
**Sistema**: SIGCERH
**Autor**: Análisis de opciones OTP
