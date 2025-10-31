# 🎯 SPRINT 05: MÓDULO ACADÉMICO

> **Módulo**: Backend - Académico  
> **Duración**: 4-5 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ✅ COMPLETADO (Testing pendiente)

---

## 📌 Objetivo

CRUD completo de estudiantes, años lectivos, grados, áreas curriculares y **CurriculoGrado** (crítico para OCR).

---

## 🎯 Metas del Sprint

- [x] CRUD Estudiantes con búsqueda avanzada
- [x] CRUD Años Lectivos (1985-2012)
- [x] CRUD Grados
- [x] CRUD Áreas Curriculares
- [x] **CRUD CurriculoGrado** (mapeo área-grado-año) ⭐⭐
- [x] Importación masiva CSV/Excel
- [x] Endpoint: **Plantilla de currículo por año/grado** (para OCR)
- [ ] Tests >80% coverage (pendiente)

---

## 📊 Tablas Involucradas (5)

- [x] Estudiante ⭐
- [x] AnioLectivo
- [x] Grado
- [x] AreaCurricular
- [x] CurriculoGrado ⭐⭐ (CRÍTICO)

---

## ✅ Tareas Principales

### ✅ FASE 1: CRUD Estudiantes (6h)
- [x] EstudianteService
  - [x] create()
  - [x] findAll() con paginación y filtros
  - [x] findById()
  - [x] update()
  - [x] delete() (soft delete)
  - [x] search() - Búsqueda avanzada (DNI, nombre)
  - [x] importFromCSV()
- [x] Validación de DNI (8 dígitos)
- [x] Validación de duplicados

### ✅ FASE 2: CRUD Años Lectivos (2h)
- [x] AnioLectivoService (CRUD básico)
- [x] Validar rango 1985-2012
- [x] Seed de años históricos (28 años: 1985-2012)

### ✅ FASE 3: CRUD Grados (2h)
- [x] GradoService (CRUD)
- [x] Relacionar con NivelEducativo (opcional)
- [x] Seed de grados de secundaria (1ro-5to)

### ✅ FASE 4: CRUD Áreas Curriculares (3h)
- [x] AreaCurricularService (CRUD)
- [x] Seed de 12 áreas curriculares estándar
  - Matemática, Comunicación, Inglés, CTA, CCSS, EPT
  - Arte, Educación Física, FCC, PFRH, Religión, Computación

### ✅ FASE 5: CurriculoGrado ⭐⭐ (8h)
- [x] CurriculoGradoService
  - [x] assignAreasToGrado() - Asignar áreas a grado-año
  - [x] **getPlantillaByAnioGrado()** ⭐ CRÍTICO para OCR
  - [x] updateOrden() - Cambiar orden de áreas
- [x] Endpoint para obtener plantilla de currículo
- [x] Fallback: Retorna todas las áreas activas cuando no hay currículo específico

### ✅ FASE 6: Importación Masiva (4h)
- [x] Parser de CSV (csv-parse)
- [x] Validación de datos (Zod + validación personalizada)
- [x] Reporte de errores de importación (exitosos, errores, duplicados)
- [x] Endpoint de importación: POST /api/estudiantes/importar
- [x] Archivo CSV de ejemplo incluido

### ✅ FASE 7: Controllers y Routes (4h)
- [x] EstudiantesController (6 endpoints + importar)
- [x] AniosLectivosController (5 endpoints CRUD)
- [x] GradosController (5 endpoints CRUD)
- [x] AreasCurricularesController (5 endpoints CRUD)
- [x] CurriculoController (5 endpoints + plantilla crítica)

### ⏳ FASE 8: Testing (5h) - PENDIENTE
- [ ] Unit tests de cada servicio
- [ ] Integration tests
- [ ] Test de plantilla de currículo
- [ ] Test de importación CSV

### ⏳ FASE 9: Documentación (2h) - NO REQUERIDA
- [x] Archivo CSV de ejemplo incluido en `backend/ejemplos/`

---

## 📋 Endpoints Críticos

```
# Estudiantes
GET    /api/estudiantes
POST   /api/estudiantes
GET    /api/estudiantes/:id
PUT    /api/estudiantes/:id
DELETE /api/estudiantes/:id
GET    /api/estudiantes/buscar?dni=&nombre=
POST   /api/estudiantes/importar-csv

# Años Lectivos
GET    /api/anios-lectivos
POST   /api/anios-lectivos

# Grados
GET    /api/grados
POST   /api/grados

# Áreas Curriculares
GET    /api/areas-curriculares
POST   /api/areas-curriculares
GET    /api/areas-curriculares/historicas?epoca=

# Currículo ⭐⭐ CRÍTICO
POST   /api/curriculo/grado (asignar áreas)
GET    /api/curriculo/plantilla?anio=1990&grado=5to ⭐⭐⭐
PUT    /api/curriculo/:id/orden
```

---

## 🎯 Endpoint CRÍTICO para OCR

**GET /api/curriculo/plantilla?anio=1990&grado=5to**

Retorna la plantilla de áreas curriculares ordenadas para ese año y grado.

Ejemplo respuesta:
```json
{
  "anio": 1990,
  "grado": "5to Secundaria",
  "areas": [
    { "orden": 1, "codigo": "MAT", "nombre": "Matemática" },
    { "orden": 2, "codigo": "COM", "nombre": "Comunicación" },
    { "orden": 3, "codigo": "ING", "nombre": "Inglés" },
    ...
  ]
}
```

Este endpoint es usado por el Editor antes de procesar OCR.

---

## 🧪 Criterios de Aceptación

- [x] CRUD completo de las 5 tablas
- [x] Búsqueda de estudiantes funciona (por DNI y nombre)
- [x] Importación CSV funciona (con reporte detallado)
- [x] Plantilla de currículo retorna áreas ordenadas correctamente
- [x] Seeds ejecutados: 28 años, 5 grados, 12 áreas
- [ ] Tests >80% coverage (pendiente)

---

## ⚠️ Dependencias

- Sprint 04 - Configuración institucional

---

**🔗 Siguiente**: [SPRINT_06_MODULO_ACTAS_FISICAS.md](./SPRINT_06_MODULO_ACTAS_FISICAS.md)

