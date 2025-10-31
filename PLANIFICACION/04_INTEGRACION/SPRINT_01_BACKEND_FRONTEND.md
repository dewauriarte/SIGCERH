# 🎯 SPRINT 01: INTEGRACIÓN BACKEND-FRONTEND

> **Módulo**: Integración  
> **Duración**: 3-4 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ⬜ No iniciado

---

## 📌 Objetivo

Conectar completamente Backend (Node.js) con Frontend (React), configurar CORS, variables de entorno, axios, manejo de errores y autenticación.

---

## 🎯 Metas del Sprint

- [ ] Backend y Frontend corriendo simultáneamente
- [ ] CORS configurado correctamente
- [ ] Axios configurado con interceptors
- [ ] Autenticación funcionando (login/logout)
- [ ] Refresh token automático
- [ ] Protección de rutas por rol
- [ ] Manejo de errores HTTP
- [ ] Loading states globales
- [ ] Notificaciones toast

---

## ✅ Tareas Principales

### 🟦 FASE 1: Configuración de Puertos (1h)
- [ ] Backend en puerto 5000
- [ ] Frontend en puerto 3000
- [ ] OCR en puerto 5001
- [ ] Scripts para correr todos:
  - npm run dev:backend
  - npm run dev:frontend
  - npm run dev:ocr
  - npm run dev:all (concurrently)

### 🟦 FASE 2: CORS en Backend (2h)
- [ ] Instalar cors en Backend
- [ ] Configurar origins permitidos:
  - http://localhost:3000 (dev)
  - https://certificados.ugel.gob.pe (prod)
- [ ] Permitir credenciales
- [ ] Headers personalizados
- [ ] Testing de CORS

### 🟦 FASE 3: Variables de Entorno (1h)

**Backend .env**:
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] GEMINI_API_KEY
- [ ] SMTP_HOST, SMTP_USER, SMTP_PASS
- [ ] OCR_API_URL, OCR_API_KEY
- [ ] FRONTEND_URL

**Frontend .env**:
- [ ] VITE_API_URL=http://localhost:5000
- [ ] VITE_APP_NAME
- [ ] VITE_ENV=development

### 🟦 FASE 4: Cliente Axios en Frontend (3h)
- [ ] Instancia base de axios
- [ ] Base URL desde variable de entorno
- [ ] Timeout de 30 segundos
- [ ] Headers por defecto
- [ ] Request interceptor (agregar JWT)
- [ ] Response interceptor (manejo de errores)
- [ ] Retry con backoff exponencial

### 🟦 FASE 5: Autenticación Completa (5h)
- [ ] Login funciona (POST /api/auth/login)
- [ ] Token se guarda en localStorage
- [ ] Token se envía en cada request (Authorization header)
- [ ] Refresh token automático al expirar
- [ ] Logout funciona (limpia storage)
- [ ] Redirección a login si 401
- [ ] Protección de rutas por rol
- [ ] Persistencia de sesión al recargar

### 🟦 FASE 6: Servicios API por Módulo (6h)

**Crear servicios en Frontend**:

**auth.service.ts**:
- [ ] login(credentials)
- [ ] logout()
- [ ] refreshToken()
- [ ] getMe()

**solicitudes.service.ts**:
- [ ] crearSolicitud(data)
- [ ] getSolicitudByCodigo(codigo, dni)
- [ ] getSolicitudesPendientes()
- [ ] derivarAEditor(id)
- [ ] marcarActaEncontrada(id)

**pagos.service.ts**:
- [ ] generarOrdenPago(solicitudId)
- [ ] subirComprobante(pagoId, file)
- [ ] validarPago(pagoId, aprobar)

**certificados.service.ts**:
- [ ] getCertificado(id)
- [ ] descargarCertificado(id)

**usuarios.service.ts**:
- [ ] getUsuarios()
- [ ] crearUsuario(data)
- [ ] editarUsuario(id, data)

### 🟦 FASE 7: Manejo Global de Errores (3h)
- [ ] Interceptor captura errores 4xx/5xx
- [ ] Mensajes de error amigables
- [ ] Toast de error automático
- [ ] Log de errores en consola (dev)
- [ ] Casos especiales:
  - 401: Redirigir a login
  - 403: Mostrar "No autorizado"
  - 404: Mostrar "No encontrado"
  - 500: "Error del servidor"
  - Network error: "Sin conexión"

### 🟦 FASE 8: Loading States (2h)
- [ ] Loading global (zustand store)
- [ ] Spinner en navbar cuando hay requests
- [ ] Loading por query (TanStack Query)
- [ ] Skeleton loaders en listas
- [ ] Botones con loading state

### 🟦 FASE 9: Testing de Integración (4h)
- [ ] Login desde Frontend → Backend funciona
- [ ] Token se envía correctamente
- [ ] Refresh token funciona
- [ ] Protección de rutas funciona
- [ ] Todos los servicios API funcionan
- [ ] Manejo de errores funciona
- [ ] Loading states funcionan

---

## 🧪 Criterios de Aceptación

- [ ] Backend y Frontend corren simultáneamente
- [ ] No hay errores de CORS
- [ ] Login funciona
- [ ] Token se envía en cada request
- [ ] Refresh token automático
- [ ] Logout limpia todo
- [ ] Rutas protegidas funcionan
- [ ] Errores se manejan correctamente
- [ ] Loading states visibles
- [ ] Toast notifications funcionan

---

## ⚠️ Dependencias

- Backend Sprint 03 - Autenticación API
- Frontend Sprint 03 - Autenticación Frontend
- Todos los sprints de Backend y Frontend

---

**🔗 Siguiente**: [SPRINT_02_INTEGRACION_OCR.md](./SPRINT_02_INTEGRACION_OCR.md)

