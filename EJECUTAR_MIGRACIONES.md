# 🚀 Ejecutar Migraciones - Sistema de Normalización de Actas

## ✅ Archivos Implementados

- ✅ `backend/prisma/schema.prisma` - Schema actualizado con modelos
- ✅ `backend/src/modules/actas/normalizacion.types.ts` - Types completos
- ✅ `backend/src/modules/actas/normalizacion.service.ts` - Servicio de normalización
- ✅ `backend/src/modules/actas/normalizacion.controller.ts` - Controlador API
- ✅ `backend/src/modules/actas/normalizacion.routes.ts` - Rutas protegidas
- ✅ `backend/src/modules/actas/index.ts` - Exports actualizados
- ✅ `backend/src/app.ts` - Rutas registradas

## 📋 Pasos para Ejecutar

### 1. Generar y Aplicar Migración de Prisma

```bash
cd backend

# Generar migración
npx prisma migrate dev --name add_acta_normalizacion

# Generar cliente Prisma
npx prisma generate
```

**Esto creará:**
- Tablas: `actaestudiante` y `actanota`
- Campos en `actafisica`: `normalizada`, `fecha_normalizacion`
- Todas las relaciones y constraints

### 2. Ejecutar SQL Adicional (Vistas y Funciones)

**Opción A: Usando psql (recomendado)**
```bash
psql -U postgres -d certificados_db -f prisma/migrations/add_acta_normalizacion.sql
```

**Opción B: Usando pgAdmin**
1. Abrir pgAdmin
2. Conectar a `certificados_db`
3. Abrir Query Tool
4. Copiar contenido de `backend/prisma/migrations/add_acta_normalizacion.sql`
5. Ejecutar

**Esto creará:**
- Vistas: `v_actas_estudiante`, `v_notas_estudiante`
- Funciones: `estadisticas_acta_normalizada()`, `tiene_notas_en_periodo()`
- Triggers: `trg_actafisica_validar_normalizacion`

### 3. Verificar Instalación

```bash
# Verificar schema
cd backend
npx prisma validate

# Verificar migración
npx prisma migrate status
```

**Salida esperada:**
```
✓ Schema validation successful
✓ Migrations applied successfully
```

### 4. Iniciar Servidor

```bash
cd backend
npm run dev
```

**Verificar logs:**
```
[INFO] SIGCERH Backend iniciado en puerto 5000
[INFO] Base de datos conectada
```

---

## 🧪 Probar Endpoints

### 1. Validar Acta OCR
```bash
curl -X POST http://localhost:5000/api/actas/{actaId}/validar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Normalizar Acta
```bash
curl -X POST http://localhost:5000/api/actas/{actaId}/normalizar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Ver Actas de Estudiante
```bash
curl http://localhost:5000/api/actas/estudiantes/{estudianteId}/actas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Consolidar Notas
```bash
curl http://localhost:5000/api/actas/estudiantes/{estudianteId}/notas-consolidadas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔍 Verificar en Base de Datos

```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('actaestudiante', 'actanota');

-- Verificar campos en actafisica
SELECT column_name FROM information_schema.columns
WHERE table_name = 'actafisica'
  AND column_name IN ('normalizada', 'fecha_normalizacion');

-- Verificar vistas
SELECT table_name FROM information_schema.views
WHERE table_name IN ('v_actas_estudiante', 'v_notas_estudiante');

-- Verificar funciones
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE '%acta%' AND routine_type = 'FUNCTION';
```

---

## ⚠️ Solución de Problemas

### Error: "Prisma model not found"
```bash
npx prisma generate
npm run dev
```

### Error: "Column does not exist"
```bash
# Verificar estado de migraciones
npx prisma migrate status

# Aplicar migraciones pendientes
npx prisma migrate deploy
```

### Error: "Cannot find module"
```bash
# Limpiar caché y reinstalar
cd backend
rm -rf node_modules
npm install
npx prisma generate
```

---

## 📚 Documentación Completa

Para más detalles, consultar:
- **Plan detallado**: `PLAN_NORMALIZACION_ACTAS.md`
- **Resumen visual**: `RESUMEN_NORMALIZACION_ACTAS.md`
- **Guía paso a paso**: `GUIA_IMPLEMENTACION_PASO_A_PASO.md`

---

## 🎉 Resultado Final

Una vez completados todos los pasos tendrás:

✅ **Base de Datos**
- Tablas normalizadas (actaestudiante, actanota)
- Vistas optimizadas
- Funciones auxiliares
- Triggers de validación

✅ **Backend**
- API con 4 endpoints funcionales
- Servicio de normalización completo
- Validación y mapeo inteligente
- Consultas optimizadas

✅ **Listo para usar**
- Normalizar actas procesadas por IA
- Consultar actas por estudiante
- Consolidar notas para certificados
- JSON original como backup
