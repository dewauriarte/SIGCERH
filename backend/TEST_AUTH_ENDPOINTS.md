# TEST - Endpoints de Autenticación

Pruebas de los endpoints de autenticación del Sprint 03.

## Base URL
```
http://localhost:3000/api/auth
```

## Variables de Entorno
Asegúrate de tener configuradas en `.env`:
- JWT_SECRET
- JWT_EXPIRES_IN
- JWT_REFRESH_EXPIRES_IN
- BCRYPT_ROUNDS

---

## 1. Health Check

```bash
curl http://localhost:3000/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "SIGCERH Backend está funcionando",
  "timestamp": "2025-10-31T...",
  "environment": "development"
}
```

---

## 2. Register (Registro de Usuario)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "Test1234",
    "dni": "12345678",
    "nombres": "Usuario",
    "apellidos": "De Prueba",
    "telefono": "987654321",
    "cargo": "Tester"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "1h"
  }
}
```

---

## 3. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "admin",
    "password": "admin123"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "uuid...",
      "username": "admin",
      "email": "admin@sigcerh.local",
      "roles": [...],
      "permisos": [...]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "1h"
  }
}
```

**Guarda el accessToken para las siguientes pruebas**

---

## 4. Get Me (Usuario Autenticado)

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Información del usuario",
  "data": {
    "id": "uuid...",
    "username": "admin",
    "email": "admin@sigcerh.local",
    "roles": [...],
    "permisos": [...]
  }
}
```

---

## 5. Refresh Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "TU_REFRESH_TOKEN_AQUI"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Token renovado exitosamente",
  "data": {
    "accessToken": "nuevo_access_token...",
    "refreshToken": "nuevo_refresh_token...",
    "expiresIn": "1h"
  }
}
```

---

## 6. Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "TU_REFRESH_TOKEN_AQUI"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

---

## 7. Forgot Password

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sigcerh.local"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Si el correo existe, recibirás instrucciones para recuperar tu contraseña"
}
```

---

## 8. Reset Password

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_aqui",
    "newPassword": "NewPass1234"
  }'
```

---

## Pruebas de Errores

### Login con credenciales incorrectas
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "admin",
    "password": "wrongpassword"
  }'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

### Acceso sin token
```bash
curl -X GET http://localhost:3000/api/auth/me
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Token de autenticación no proporcionado"
}
```

### Token inválido
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer token_invalido"
```

**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Token inválido"
}
```

---

## Scripts PowerShell (Windows)

### Login y guardar tokens
```powershell
$response = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/login" -ContentType "application/json" -Body '{"usernameOrEmail":"admin","password":"admin123"}'
$accessToken = $response.data.accessToken
$refreshToken = $response.data.refreshToken
Write-Host "Access Token: $accessToken"
Write-Host "Refresh Token: $refreshToken"
```

### Get Me con token guardado
```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/auth/me" -Headers $headers
```

---

## Usuario Admin Predeterminado

**Usuario:** admin  
**Email:** admin@sigcerh.local  
**Contraseña:** admin123  
**Rol:** ADMIN (con todos los permisos)

---

## Notas

- Los tokens JWT expiran según la configuración en `.env`
- El refresh token se guarda en la tabla `sesion` de la base de datos
- Todos los endpoints de autenticación están bajo `/api/auth`
- Los endpoints protegidos requieren header `Authorization: Bearer TOKEN`
- La auditoría se registra automáticamente en la tabla `auditoria`

