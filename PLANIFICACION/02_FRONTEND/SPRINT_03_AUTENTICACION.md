# 🎯 SPRINT 03: AUTENTICACIÓN FRONTEND

> **Módulo**: Frontend - Auth  
> **Duración**: 3 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ⬜ No iniciado

---

## 📌 Objetivo

Sistema completo de autenticación: login, registro, protección de rutas, manejo de JWT, refresh tokens y actualización en tiempo real del estado de sesión.

---

## 🎯 Metas del Sprint

- [ ] Pantalla de login funcionando
- [ ] Pantalla de registro (usuarios públicos)
- [ ] Almacenamiento seguro de JWT
- [ ] Refresh token automático
- [ ] Protección de rutas por rol
- [ ] Redirección según rol después de login
- [ ] Logout funcionando
- [ ] **Actualización en tiempo real de sesión** ⭐
- [ ] Forgot/Reset password

---

## ✅ Tareas Principales

### 🟦 FASE 1: Auth Store (3h)
- [ ] Ampliar `authStore.ts`:
  - [ ] user
  - [ ] token
  - [ ] refreshToken
  - [ ] isAuthenticated
  - [ ] login()
  - [ ] logout()
  - [ ] setUser()
  - [ ] checkAuth()
- [ ] Persistir token en localStorage (seguro)
- [ ] Hidratar store al cargar app

### 🟦 FASE 2: API Auth Service (3h)
- [ ] `auth.service.ts`:
  - [ ] login()
  - [ ] register()
  - [ ] logout()
  - [ ] refreshToken()
  - [ ] getMe()
  - [ ] forgotPassword()
  - [ ] resetPassword()
- [ ] Integrar con Axios interceptors

### 🟦 FASE 3: Interceptors de Axios (3h)
- [ ] Request interceptor:
  - [ ] Agregar JWT a headers
- [ ] Response interceptor:
  - [ ] Capturar 401
  - [ ] Intentar refresh token
  - [ ] Si falla, logout automático
- [ ] Retry de request original

### 🟦 FASE 4: Hooks Custom (2h)
- [ ] `useAuth()` - Acceso al authStore
- [ ] `useUser()` - Datos del usuario
- [ ] `useRole()` - Verificar rol
- [ ] `usePermissions()` - Verificar permisos

### 🟦 FASE 5: Pantalla de Login (4h)
- [ ] Formulario con React Hook Form + Zod
- [ ] Campos: email/username, password
- [ ] Botón de login
- [ ] Link a registro
- [ ] Link a olvidé contraseña
- [ ] Mostrar errores
- [ ] Loading state
- [ ] Redirección después de login

### 🟦 FASE 6: Pantalla de Registro (4h)
- [ ] Formulario para usuarios públicos
- [ ] Campos:
  - [ ] DNI
  - [ ] Nombres y apellidos
  - [ ] Email (opcional)
  - [ ] Celular (obligatorio)
  - [ ] Contraseña
  - [ ] Confirmar contraseña
- [ ] Validaciones con Zod
- [ ] Términos y condiciones
- [ ] Redirección a login después de registro

### 🟦 FASE 7: Protección de Rutas (3h)
- [ ] Componente `PrivateRoute`
- [ ] Componente `RoleBasedRoute`
- [ ] Redirección a login si no autenticado
- [ ] Redirección a 403 si no tiene permiso
- [ ] Aplicar a todas las rutas protegidas

### 🟦 FASE 8: Redirección por Rol (2h)
- [ ] Después de login, redirigir según rol:
  - [ ] PUBLICO → /mi-cuenta
  - [ ] MESA_DE_PARTES → /mesa-partes
  - [ ] EDITOR → /editor
  - [ ] ENCARGADO_UGEL → /ugel
  - [ ] ENCARGADO_SIAGEC → /siagec
  - [ ] DIRECCION → /direccion
  - [ ] ADMIN → /admin

### 🟦 FASE 9: Actualización en Tiempo Real ⭐⭐ (4h)
- [ ] Polling cada 30 segundos para verificar sesión
- [ ] TanStack Query con `refetchInterval`
- [ ] Si token expira, mostrar modal de "sesión expirada"
- [ ] Auto-logout si no hay actividad (opcional)
- [ ] Pausar polling cuando ventana no está activa

### 🟦 FASE 10: Forgot/Reset Password (3h)
- [ ] Pantalla "Olvidé mi contraseña"
- [ ] Formulario con email
- [ ] Pantalla "Restablecer contraseña" (con token)
- [ ] Formulario con nueva contraseña
- [ ] Validaciones

### 🟦 FASE 11: User Menu (2h)
- [ ] Dropdown en header
- [ ] Avatar con iniciales
- [ ] Nombre y rol
- [ ] Link a perfil
- [ ] Link a configuración
- [ ] Botón de logout

---

## 🔐 Seguridad

### Token Storage
- JWT en `localStorage` (o `sessionStorage` si "recordarme" no está marcado)
- Nunca almacenar contraseña
- Limpiar storage al logout

### Refresh Token
- Automático cuando JWT expira
- Si refresh falla → logout
- Retry de request original después de refresh

---

## 🔄 Flujo de Login

```
Usuario ingresa credenciales
  ↓
POST /api/auth/login
  ↓
Recibe: { token, refreshToken, user }
  ↓
authStore.login(datos)
  ↓
localStorage.setItem('token', token)
  ↓
Redirigir según rol
  ↓
Polling cada 30s para verificar sesión
```

---

## 🧪 Criterios de Aceptación

- [ ] Login funciona
- [ ] Registro funciona
- [ ] JWT se almacena correctamente
- [ ] Refresh token funciona automáticamente
- [ ] Rutas protegidas funcionan
- [ ] Redirección por rol funciona
- [ ] Logout limpia todo
- [ ] Polling de sesión funciona
- [ ] Forgot/reset password funcionan
- [ ] User menu funciona

---

## 🎯 Actualización en Tiempo Real

**Implementación con TanStack Query**:
```typescript
// Verificar sesión cada 30 segundos
const { data: user } = useQuery({
  queryKey: ['auth', 'me'],
  queryFn: authService.getMe,
  refetchInterval: 30000, // 30 segundos
  refetchIntervalInBackground: false,
  onError: () => {
    // Auto-logout si falla
    authStore.logout();
  }
});
```

---

## ⚠️ Dependencias

- Sprint 01 - Setup inicial
- Sprint 02 - Sistema de diseño
- Backend Sprint 03 - Autenticación API

---

**🔗 Siguiente**: [SPRINT_04_PORTAL_PUBLICO.md](./SPRINT_04_PORTAL_PUBLICO.md)

