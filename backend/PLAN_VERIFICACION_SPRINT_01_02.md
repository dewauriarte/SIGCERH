# ✅ PLAN DE VERIFICACIÓN - SPRINT 01 Y 02

**Fecha**: 31 de Octubre 2025
**Estado**: Backend implementado - Verificación pendiente

---

## 📊 RESUMEN DEL ESTADO ACTUAL

### ✅ Sprint 01: Setup Inicial - IMPLEMENTADO

| Componente | Estado | Archivo | Verificado |
|------------|--------|---------|------------|
| Express App | ✅ Implementado | `src/app.ts` | ✅ Funcionando |
| Server Entry Point | ✅ Implementado | `src/index.ts` | ✅ Funcionando |
| Config Env | ✅ Implementado | `src/config/env.ts` | ⬜ |
| Config Logger | ✅ Implementado | `src/config/logger.ts` | ⬜ |
| Config Database | ✅ Implementado | `src/config/database.ts` | ⬜ |
| Error Middleware | ✅ Implementado | `src/middleware/errorHandler.ts` | ⬜ |
| Auth Middleware | ✅ Implementado | `src/middleware/auth.middleware.ts` | ⬜ |
| .env | ✅ Configurado | `.env` | ⬜ |
| TypeScript Config | ✅ Configurado | `tsconfig.json` | ⬜ |
| Jest Config | ✅ Configurado | `jest.config.js` | ⬜ |
| Health Check | ✅ Funcionando | GET /health | ✅ OK |

**Servidor corriendo**: ✅ http://localhost:3000

---

### ✅ Sprint 02: Prisma ORM - IMPLEMENTADO

| Componente | Estado | Archivo | Verificado |
|------------|--------|---------|------------|
| Prisma Schema | ✅ Implementado | `prisma/schema.prisma` | ⬜ |
| Database Singleton | ✅ Implementado | `src/config/database.ts` | ⬜ |
| Seeds | ✅ Implementados | `prisma/seeds/` | ⬜ |
| Prisma Client | ✅ Generado | `node_modules/.prisma/client` | ⚠️ Error permisos |

---

## 🎯 PLAN DE VERIFICACIÓN PASO A PASO

### **FASE 1: Verificaciones Básicas (Sprint 01)** ⏱️ 15 min

#### 1.1 Verificar Health Check ✅
```bash
curl http://localhost:3000/health
```
**Resultado esperado**:
```json
{
  "success": true,
  "message": "SIGCERH Backend está funcionando",
  "timestamp": "2025-10-31T...",
  "environment": "development"
}
```
**Estado**: ✅ PASADO

---

#### 1.2 Verificar Variables de Entorno
```bash
# En backend/
cat .env
```
**Verificar que existen**:
- [x] DATABASE_URL
- [x] NODE_ENV
- [x] PORT
- [x] JWT_SECRET
- [x] CORS_ORIGIN

**Estado**: ⬜ PENDIENTE

---

#### 1.3 Verificar Logs
```bash
# Verificar que se crean logs
ls -la backend/logs
```
**Verificar**:
- [ ] Carpeta `logs/` existe
- [ ] Se crean archivos de log al iniciar el servidor
- [ ] Logs contienen información útil

**Estado**: ⬜ PENDIENTE

---

#### 1.4 Verificar TypeScript Compila
```bash
cd backend
npm run build
```
**Verificar**:
- [ ] Compila sin errores
- [ ] Se crea carpeta `dist/`
- [ ] Archivos .js generados correctamente

**Estado**: ⬜ PENDIENTE

---

### **FASE 2: Verificaciones de Prisma (Sprint 02)** ⏱️ 30 min

#### 2.1 Verificar Schema Prisma
```bash
cd backend
npx prisma validate
```
**Verificar**:
- [ ] Schema válido sin errores
- [ ] 32 modelos definidos
- [ ] Relaciones correctas

**Estado**: ⬜ PENDIENTE

---

#### 2.2 Regenerar Prisma Client (IMPORTANTE)
```bash
# PRIMERO: Detener el servidor si está corriendo
# Luego:
cd backend
npx prisma generate
```
**Verificar**:
- [ ] Se genera sin errores
- [ ] Cliente TypeScript disponible

**Estado**: ⚠️ ERROR DE PERMISOS - Detener servidor primero

---

#### 2.3 Verificar Conexión a Base de Datos
```bash
cd backend
npx prisma db pull --print
```
**Verificar**:
- [ ] Se conecta correctamente
- [ ] Muestra las 32 tablas
- [ ] No hay errores de conexión

**Estado**: ⬜ PENDIENTE

---

#### 2.4 Abrir Prisma Studio 🎯
```bash
cd backend
npm run prisma:studio
```
**Pasos**:
1. Ejecutar comando
2. Abrir navegador en http://localhost:5555
3. Verificar que se ven todas las tablas
4. Explorar datos

**Verificar**:
- [ ] Prisma Studio abre correctamente
- [ ] Se ven las 32 tablas
- [ ] Se pueden consultar datos

**Estado**: ⬜ PENDIENTE

---

#### 2.5 Ejecutar Seeds
```bash
cd backend
npm run seed
```
**Verificar**:
- [ ] Seeds se ejecutan sin errores
- [ ] Se crean datos iniciales:
  - ConfiguracionInstitucion
  - Roles (7 roles)
  - Niveles Educativos
  - Grados
  - Áreas Curriculares
  - Años Lectivos

**Estado**: ⬜ PENDIENTE

---

#### 2.6 Verificar Datos en BD
```bash
# Usando Prisma Studio o psql
psql -U postgres -d certificados_db -c "SELECT * FROM \"Rol\";"
psql -U postgres -d certificados_db -c "SELECT * FROM \"ConfiguracionInstitucion\";"
psql -U postgres -d certificados_db -c "SELECT * FROM \"Usuario\";"
```
**Verificar**:
- [ ] Existen 7 roles
- [ ] Existe configuración de institución
- [ ] Existe usuario admin

**Estado**: ⬜ PENDIENTE

---

### **FASE 3: Tests Unitarios** ⏱️ 20 min

#### 3.1 Ejecutar Tests Existentes
```bash
cd backend
npm test
```
**Verificar**:
- [ ] Tests pasan correctamente
- [ ] Coverage aceptable
- [ ] No hay errores

**Estado**: ⬜ PENDIENTE

---

#### 3.2 Crear Test de Conexión BD (si no existe)
Crear archivo: `backend/src/config/__tests__/database.test.ts`

```typescript
import { testDatabaseConnection } from '../database';

describe('Database Connection', () => {
  test('should connect to database successfully', async () => {
    const isConnected = await testDatabaseConnection();
    expect(isConnected).toBe(true);
  });
});
```

Ejecutar:
```bash
npm test -- database.test.ts
```

**Estado**: ⬜ PENDIENTE

---

### **FASE 4: Verificación de Endpoints** ⏱️ 15 min

#### 4.1 Health Check
```bash
curl http://localhost:3000/health
```
✅ YA VERIFICADO

---

#### 4.2 Endpoint de Auth (si existe)
```bash
# Verificar que endpoint existe (aunque no esté implementado)
curl http://localhost:3000/api/auth/login
```
**Verificar**:
- [ ] Responde (aunque sea con error 404 o 401)
- [ ] No hay error 500

**Estado**: ⬜ PENDIENTE

---

#### 4.3 Listar Todos los Endpoints
Revisar `backend/src/app.ts` líneas 93-106:

```typescript
app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api', configuracionRoutes);
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/academico', academicoRoutes);
app.use('/api/actas', actasRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/certificados', certificadoRoutes);
app.use('/api/verificar', verificacionRoutes);
```

**Verificar cada uno con curl**:
```bash
curl http://localhost:3000/api/auth
curl http://localhost:3000/api/roles
curl http://localhost:3000/api/usuarios
# etc...
```

**Estado**: ⬜ PENDIENTE

---

## 🚨 PROBLEMAS IDENTIFICADOS

### ❌ Problema 1: Prisma Generate - Error de Permisos
**Síntoma**:
```
EPERM: operation not permitted, rename 'query_engine-windows.dll.node.tmp'
```

**Causa**: El servidor está corriendo y tiene bloqueado el archivo

**Solución**:
1. Detener el servidor (Ctrl+C en la terminal donde corre)
2. Ejecutar: `npm run prisma:generate`
3. Reiniciar el servidor: `npm run dev`

**Estado**: ⬜ PENDIENTE

---

### ⚠️ Problema 2: Documentación Faltante
**Según Sprint 01 - Tareas T10.1 a T10.3**:

- [ ] `backend/README.md` con instrucciones de setup
- [ ] Documentación de estructura de carpetas
- [ ] `CHANGELOG.md`

**Estado**: ⬜ PENDIENTE

---

### ⚠️ Problema 3: Tests No Verificados
Según el `jest.config.js` existe configuración pero no sabemos si hay tests escritos.

**Verificar**:
```bash
# Buscar archivos de test
find backend/src -name "*.test.ts"
```

**Estado**: ⬜ PENDIENTE

---

## 📝 CHECKLIST COMPLETO

### Sprint 01: Setup Inicial

#### Servidor y Configuración
- [x] Servidor Express corriendo ✅
- [ ] Health check funciona ✅ (ya verificado)
- [ ] Variables .env configuradas
- [ ] Logs se generan correctamente
- [ ] TypeScript compila sin errores
- [ ] ESLint configurado
- [ ] Prettier configurado

#### Middlewares
- [x] Error handler implementado
- [x] CORS configurado
- [x] Helmet (seguridad) configurado
- [x] Rate limiting configurado
- [x] Morgan (HTTP logger) configurado
- [x] Compression configurado

#### Documentación
- [ ] README.md del backend
- [ ] Documentación estructura carpetas
- [ ] CHANGELOG.md

---

### Sprint 02: Prisma ORM

#### Configuración Prisma
- [x] Prisma instalado
- [x] Schema generado con 32 modelos
- [ ] Cliente Prisma generado (error permisos)
- [ ] Schema validado sin errores
- [x] Database singleton implementado

#### Base de Datos
- [ ] Conexión a BD verificada
- [ ] Health check de BD funciona
- [ ] Prisma Studio abre correctamente
- [ ] Se pueden consultar tablas

#### Seeds
- [x] Seeds implementados
- [ ] Seeds ejecutados correctamente
- [ ] Datos iniciales creados:
  - [ ] ConfiguracionInstitucion
  - [ ] 7 Roles
  - [ ] Niveles Educativos
  - [ ] Grados
  - [ ] Usuario admin

#### Tests
- [ ] Tests de conexión
- [ ] Tests de queries básicas
- [ ] Tests pasan correctamente

---

## 🎯 SIGUIENTES PASOS RECOMENDADOS

### 1. **INMEDIATO** (Ahora mismo)
1. ✅ Detener el servidor si está corriendo
2. Ejecutar: `npm run prisma:generate`
3. Reiniciar servidor: `npm run dev`
4. Verificar health check funciona

### 2. **CORTO PLAZO** (Hoy)
1. Ejecutar Prisma Studio: `npm run prisma:studio`
2. Verificar seeds: `npm run seed`
3. Explorar datos en Prisma Studio
4. Ejecutar tests: `npm test`

### 3. **MEDIANO PLAZO** (Esta semana)
1. Crear documentación faltante (README.md, CHANGELOG.md)
2. Escribir tests unitarios faltantes
3. Verificar todos los endpoints
4. Completar checklist de ambos sprints

---

## 📋 COMANDOS ÚTILES

### Servidor
```bash
npm run dev          # Iniciar en desarrollo
npm run build        # Compilar TypeScript
npm start            # Producción
npm run lint         # Linter
npm run format       # Formatear código
```

### Prisma
```bash
npm run prisma:generate   # Generar cliente
npm run prisma:studio     # Abrir Prisma Studio
npm run seed              # Ejecutar seeds
npm run prisma:push       # Push schema a BD
npm run prisma:pull       # Pull desde BD
```

### Tests
```bash
npm test                  # Todos los tests
npm run test:watch        # Watch mode
```

### Base de Datos
```bash
# Conectar con psql
psql -U postgres -d certificados_db

# Listar tablas
\dt

# Ver datos de tabla
SELECT * FROM "Rol";
SELECT * FROM "Usuario";
```

---

## ✅ RESULTADO FINAL ESPERADO

Al completar este plan de verificación, deberías tener:

1. ✅ Servidor corriendo sin errores
2. ✅ Prisma Client generado correctamente
3. ✅ Base de datos conectada y funcionando
4. ✅ Prisma Studio operativo
5. ✅ Seeds ejecutados con datos iniciales
6. ✅ Tests pasando correctamente
7. ✅ Todos los endpoints respondiendo
8. ✅ Documentación completa

---

**📝 Última actualización**: 31/10/2025
**👤 Creado por**: Claude Code
**📌 Versión**: 1.0
