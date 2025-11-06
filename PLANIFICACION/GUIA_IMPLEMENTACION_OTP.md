# Guía de Implementación de OTP en SIGCERH

## 📋 Resumen

Se ha implementado un sistema completo de OTP (One-Time Password) para autenticación y verificación de usuarios en SIGCERH.

---

## 🗄️ Paso 1: Crear la Tabla en la Base de Datos

Ejecuta la migración SQL:

```bash
# Desde el directorio bd/migrations
psql -U tu_usuario -d sigcerh_db -f create_otp_table.sql
```

O ejecuta directamente el script SQL desde pgAdmin o tu cliente PostgreSQL preferido.

**Ubicación**: `c:\SIGCERH\bd\migrations\create_otp_table.sql`

Esto creará:
- ✅ Tabla `otp` con todos los campos necesarios
- ✅ Índices para mejorar el rendimiento
- ✅ Triggers para actualizar timestamps
- ✅ Función `clean_expired_otps()` para limpieza automática

---

## 🔧 Paso 2: Configurar Variables de Entorno

Asegúrate de tener configuradas las variables SMTP en tu `.env`:

```env
# SMTP Configuration (ya existentes)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-app
SMTP_FROM=SIGCERH <tu-email@gmail.com>
```

**Nota**: Para Gmail, necesitas crear una "Contraseña de aplicación" en la configuración de seguridad de tu cuenta Google.

---

## 🚀 Paso 3: Integrar Rutas OTP en el Sistema

Actualiza `backend/src/modules/auth/auth.routes.ts` para incluir las rutas OTP:

```typescript
import otpRoutes from './otp/otp.routes';

// ... código existente ...

// Rutas OTP
router.use('/otp', otpRoutes);

export default router;
```

---

## 📝 Paso 4: Uso del Sistema OTP

### 4.1 Generar y Enviar OTP

**Endpoint**: `POST /api/auth/otp/generar`  
**Auth**: Requiere token JWT  

**Request Body**:
```json
{
  "usuarioId": "uuid-del-usuario",
  "tipo": "EMAIL",
  "proposito": "LOGIN",
  "destinatario": "usuario@ejemplo.com"
}
```

**Tipos disponibles**:
- `EMAIL` - Envío por correo electrónico
- `SMS` - Envío por SMS (próximamente)

**Propósitos disponibles**:
- `REGISTRO` - Verificación de registro
- `LOGIN` - Verificación de inicio de sesión (2FA)
- `RECUPERACION_PASSWORD` - Recuperación de contraseña
- `CAMBIO_EMAIL` - Cambio de email
- `CAMBIO_TELEFONO` - Cambio de teléfono
- `VERIFICACION_2FA` - Autenticación de dos factores

**Response**:
```json
{
  "success": true,
  "message": "Código de verificación enviado exitosamente"
}
```

---

### 4.2 Verificar OTP

**Endpoint**: `POST /api/auth/otp/verificar`  
**Auth**: Requiere token JWT  

**Request Body**:
```json
{
  "usuarioId": "uuid-del-usuario",
  "codigo": "123456",
  "proposito": "LOGIN"
}
```

**Response Exitoso**:
```json
{
  "success": true,
  "message": "Código verificado exitosamente"
}
```

**Response Error**:
```json
{
  "success": false,
  "message": "Código incorrecto. Te quedan 3 intentos"
}
```

---

## 💡 Ejemplo de Uso: Login con OTP (2FA)

### Backend

```typescript
import { otpService } from '@modules/auth/otp';
import { OTPTipo, OTPProposito } from '@modules/auth/otp';

// 1. Usuario hace login normal
const loginResult = await authService.login(credentials);

// 2. Si el usuario tiene 2FA activado, generar OTP
if (user.twoFactorEnabled) {
  await otpService.generarYEnviarOTP({
    usuarioId: user.id,
    tipo: OTPTipo.EMAIL,
    proposito: OTPProposito.LOGIN,
    destinatario: user.email,
  });
  
  return {
    success: true,
    requiresOTP: true,
    message: 'Código de verificación enviado a tu email',
  };
}

// 3. Usuario ingresa el código OTP
const verifyResult = await otpService.verificarOTP({
  usuarioId: user.id,
  codigo: '123456',
  proposito: OTPProposito.LOGIN,
});

if (verifyResult.success) {
  // Continuar con el login normal y devolver tokens
  return {
    success: true,
    accessToken: '...',
    refreshToken: '...',
  };
}
```

### Frontend (React)

```typescript
// 1. Login inicial
const login = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials);
  
  if (response.data.requiresOTP) {
    // Mostrar modal/pantalla para ingresar OTP
    setShowOTPModal(true);
    setUserId(response.data.userId);
  } else {
    // Login exitoso, guardar tokens
    saveTokens(response.data);
  }
};

// 2. Verificar OTP
const verifyOTP = async (code) => {
  const response = await api.post('/api/auth/otp/verificar', {
    usuarioId: userId,
    codigo: code,
    proposito: 'LOGIN',
  });
  
  if (response.data.success) {
    // OTP verificado, continuar con login
    const loginResponse = await api.post('/api/auth/login/complete', {
      userId: userId,
    });
    saveTokens(loginResponse.data);
  }
};
```

---

## 📧 Personalización del Email

El template del email se encuentra en:
`backend/src/modules/auth/otp/otp.service.ts` - Método `generarHTMLEmail()`

Puedes personalizarlo modificando el HTML según tus necesidades.

---

## 🔒 Configuración de Seguridad

El sistema OTP viene con configuración segura por defecto:

```typescript
{
  longitudCodigo: 6,        // Código de 6 dígitos
  expiracionMinutos: 10,    // Expira en 10 minutos
  maxIntentos: 5,           // Máximo 5 intentos
  cooldownSegundos: 60,     // 1 minuto entre solicitudes
}
```

Para modificar estos valores, puedes instanciar el servicio con configuración personalizada:

```typescript
import { OTPService } from '@modules/auth/otp';

const customOTPService = new OTPService({
  longitudCodigo: 8,        // Código más largo
  expiracionMinutos: 5,     // Expira más rápido
  maxIntentos: 3,           // Menos intentos
  cooldownSegundos: 120,    // 2 minutos de cooldown
});
```

---

## 🧹 Limpieza Automática de OTPs Expirados

### Opción 1: Desde el código (recomendado)

Agregar un cron job en tu aplicación:

```typescript
import { otpService } from '@modules/auth/otp';

// Limpiar cada hora
setInterval(async () => {
  const deleted = await otpService.limpiarOTPsExpirados();
  console.log(`Limpiados ${deleted} OTPs expirados`);
}, 60 * 60 * 1000); // 1 hora
```

### Opción 2: Desde PostgreSQL (cron)

Configura un cron job en el servidor PostgreSQL o usa `pg_cron`:

```sql
-- Con pg_cron
SELECT cron.schedule('clean-otps', '0 * * * *', 'SELECT clean_expired_otps()');
```

---

## 🧪 Testing

### Test Manual con cURL

```bash
# 1. Login para obtener token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail": "admin", "password": "password123"}'

# 2. Generar OTP
curl -X POST http://localhost:3000/api/auth/otp/generar \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": "uuid-del-usuario",
    "tipo": "EMAIL",
    "proposito": "LOGIN",
    "destinatario": "tu-email@ejemplo.com"
  }'

# 3. Verificar OTP (usar el código recibido por email)
curl -X POST http://localhost:3000/api/auth/otp/verificar \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": "uuid-del-usuario",
    "codigo": "123456",
    "proposito": "LOGIN"
  }'
```

---

## 🔄 Flujo Completo: Recuperación de Contraseña con OTP

1. **Usuario solicita recuperación**:
   ```typescript
   POST /api/auth/forgot-password
   { "email": "usuario@ejemplo.com" }
   ```

2. **Backend genera y envía OTP**:
   ```typescript
   const user = await prisma.usuario.findUnique({ where: { email } });
   
   await otpService.generarYEnviarOTP({
     usuarioId: user.id,
     tipo: OTPTipo.EMAIL,
     proposito: OTPProposito.RECUPERACION_PASSWORD,
     destinatario: user.email,
   });
   ```

3. **Usuario ingresa OTP y nueva contraseña**:
   ```typescript
   POST /api/auth/reset-password
   {
     "email": "usuario@ejemplo.com",
     "codigo": "123456",
     "nuevaPassword": "nuevaPassword123"
   }
   ```

4. **Backend verifica OTP y actualiza contraseña**:
   ```typescript
   const verifyResult = await otpService.verificarOTP({
     usuarioId: user.id,
     codigo: '123456',
     proposito: OTPProposito.RECUPERACION_PASSWORD,
   });
   
   if (verifyResult.success) {
     // Actualizar contraseña
     const hashedPassword = await hashPassword(nuevaPassword);
     await prisma.usuario.update({
       where: { id: user.id },
       data: { passwordhash: hashedPassword },
     });
   }
   ```

---

## ⚠️ Consideraciones de Producción

### 1. Migrar a Brevo (cuando crezcas)

Cuando superes ~200 emails/día, migra a Brevo:

1. Registrarse en https://www.brevo.com/pricing/
2. Obtener API Key
3. Instalar SDK: `npm install @getbrevo/brevo`
4. Modificar `email.service.ts` para usar Brevo en lugar de Gmail

### 2. Rate Limiting

Considera agregar rate limiting adicional en las rutas OTP:

```typescript
import rateLimit from 'express-rate-limit';

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 requests por ventana
  message: 'Demasiadas solicitudes de OTP, intenta más tarde',
});

router.post('/generar', otpLimiter, authenticate, ...);
```

### 3. Logging y Monitoreo

Monitorea:
- Tasa de envío de OTPs
- Tasa de verificación exitosa/fallida
- OTPs expirados sin usar (posible UX problem)

### 4. SMS Implementation (Futuro)

Para implementar SMS con Phone.Email:

1. Registrarse en https://www.phone.email/
2. Obtener API Key (1,000 SMS gratis/mes por 6 meses)
3. Implementar envío en `otp.service.ts`:
   ```typescript
   private async enviarOTPPorSMS(telefono: string, codigo: string) {
     // Implementar con Phone.Email API
   }
   ```

---

## 📚 Archivos Creados

```
backend/src/modules/auth/otp/
  ├── index.ts                 # Exportaciones del módulo
  ├── otp.types.ts            # Tipos y enums
  ├── otp.dto.ts              # DTOs de validación (Zod)
  ├── otp.utils.ts            # Utilidades (generar, hashear, comparar)
  ├── otp.service.ts          # Lógica de negocio
  ├── otp.controller.ts       # Controladores HTTP
  └── otp.routes.ts           # Rutas Express

backend/src/middleware/
  └── validation.middleware.ts # Middleware de validación Zod

bd/migrations/
  └── create_otp_table.sql    # Migración de base de datos

PLANIFICACION/
  ├── OPCIONES_OTP_2025.md            # Comparativa de servicios OTP
  └── GUIA_IMPLEMENTACION_OTP.md      # Esta guía
```

---

## ✅ Checklist de Implementación

- [ ] Ejecutar migración SQL para crear tabla `otp`
- [ ] Verificar configuración SMTP en `.env`
- [ ] Integrar rutas OTP en `auth.routes.ts`
- [ ] Probar envío de OTP (generar)
- [ ] Probar verificación de OTP
- [ ] Implementar flujo en frontend
- [ ] Configurar limpieza automática de OTPs expirados
- [ ] Agregar rate limiting en producción
- [ ] Configurar logs y monitoreo
- [ ] (Opcional) Migrar a Brevo cuando sea necesario

---

## 🎉 ¡Listo!

El sistema OTP está completamente implementado y listo para usar. Puedes integrarlo en cualquier flujo que requiera verificación adicional de usuario.

**Siguiente paso recomendado**: Implementar el flujo de login con 2FA opcional para usuarios que lo deseen activar.

---

**Fecha**: Noviembre 2025  
**Sistema**: SIGCERH  
**Módulo**: Autenticación - OTP
