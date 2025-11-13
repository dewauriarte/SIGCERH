# ✅ Resumen: Sistema de Normalización de Actas

## 📊 ¿Qué se implementó?

### ✅ 1. Base de Datos
- **2 Tablas nuevas:**
  - `ActaEstudiante`: Vínculo Acta ↔ Estudiante
  - `ActaNota`: Notas normalizadas por área
- **Vistas SQL:**
  - `v_actas_estudiante`: Actas por estudiante
  - `v_notas_estudiante`: Todas las notas normalizadas
- **Funciones:**
  - `estadisticas_acta_normalizada()`
  - `tiene_notas_en_periodo()`
- **Triggers:**
  - Validación antes de normalizar
- **Índices optimizados** para consultas rápidas

### ✅ 2. Backend (TypeScript)
- **Types completos** (`normalizacion.types.ts`):
  - 15+ interfaces para todo el flujo
  - Configuración flexible
- **Servicio de normalización** (`normalizacion.service.ts`):
  - Validación de JSON
  - Mapeo inteligente de áreas curriculares
  - Normalización transaccional
  - Consultas de datos normalizados
  - Consolidación para certificados

---

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE NORMALIZACIÓN                       │
└─────────────────────────────────────────────────────────────────┘

1. OCR/IA PROCESA ACTA
   ┌────────────────────────┐
   │ Acta física (PDF/IMG)  │
   └───────────┬────────────┘
               │
               ▼
   ┌────────────────────────┐
   │  IA extrae datos       │
   │  (Gemini Vision)       │
   └───────────┬────────────┘
               │
               ▼
   ┌────────────────────────┐
   │  JSON FLEXIBLE         │◄───── Estructura variable
   │  {                     │       (áreas cambian por año)
   │    estudiantes: [      │
   │      {                 │
   │        numero: 1,      │
   │        dni: "12345",   │
   │        nombres: "...", │
   │        notas: {        │
   │          "MAT": 15,    │◄───── Columnas variables
   │          "COM": 14     │
   │        }               │
   │      }                 │
   │    ]                   │
   │  }                     │
   └───────────┬────────────┘
               │
               ▼
   ┌────────────────────────┐
   │  Guardar en:           │
   │  ActaFisica            │
   │  .datosextraidosjson   │
   │  .procesadoconia=true  │
   │  Estado: PROCESADA_OCR │
   └───────────┬────────────┘
               │
═══════════════╪═══════════════════════════════════════════════════
               │
2. USUARIO VALIDA/CORRIGE
               │
               ▼
   ┌────────────────────────┐
   │  Frontend muestra JSON │
   │  ┌──────────────────┐  │
   │  │ # Estudiante 1   │  │
   │  │ DNI: 12345678    │  │
   │  │ Nombre: Juan...  │  │
   │  │                  │  │
   │  │ MAT: 15  ✓       │  │
   │  │ COM: 14  ✓       │  │
   │  │ CTA: [?]  ⚠️      │◄─ Usuario corrige
   │  └──────────────────┘  │
   └───────────┬────────────┘
               │
               ▼
   ┌────────────────────────┐
   │  Aplicar correcciones  │
   │  al JSON               │
   └───────────┬────────────┘
               │
═══════════════╪═══════════════════════════════════════════════════
               │
3. SISTEMA NORMALIZA (JSON → BD)
               │
               ▼
   ┌────────────────────────┐
   │  1. Validar JSON       │
   │     ✓ Datos completos  │
   │     ✓ DNIs válidos     │
   │     ✓ Notas en rango   │
   └───────────┬────────────┘
               │
               ▼
   ┌────────────────────────┐
   │  2. Mapear áreas       │
   │     "MATEMATICA" →     │
   │     AreaCurricular.id  │
   │                        │
   │     Métodos:           │
   │     • Exacto (100%)    │
   │     • Aproximado (80%) │
   │     • Manual           │
   └───────────┬────────────┘
               │
               ▼
   ┌────────────────────────┐
   │  3. TRANSACCIÓN        │
   │                        │
   │  Para cada estudiante: │
   │  ├─ Buscar/Crear       │
   │  │  Estudiante         │
   │  │                     │
   │  ├─ Crear              │
   │  │  ActaEstudiante     │
   │  │  (vínculo)          │
   │  │                     │
   │  └─ Crear              │
   │     ActaNota × N       │
   │     (cada área)        │
   └───────────┬────────────┘
               │
               ▼
   ┌────────────────────────┐
   │  4. Marcar como        │
   │     normalizada        │
   │                        │
   │  ActaFisica:           │
   │  .normalizada = true   │
   │  .fecha_normalizacion  │
   │  Estado: NORMALIZADA   │
   └───────────┬────────────┘
               │
═══════════════╪═══════════════════════════════════════════════════
               │
4. CONSULTAS Y CERTIFICADOS
               │
               ▼
   ┌────────────────────────┐
   │  Datos NORMALIZADOS    │
   │  en BD relacional      │
   └───────────┬────────────┘
               │
               ├──────────────────────┐
               │                      │
               ▼                      ▼
   ┌────────────────────┐  ┌────────────────────┐
   │ Consultar actas    │  │ Consolidar para    │
   │ de un estudiante   │  │ certificado        │
   │                    │  │                    │
   │ SELECT *           │  │ Agrupar por:       │
   │ FROM ActaEstudiante│  │ • Año              │
   │ WHERE              │  │ • Grado            │
   │   estudiante_id    │  │                    │
   │ JOIN ActaFisica    │  │ Calcular:          │
   │ JOIN AnioLectivo   │  │ • Promedio general │
   │ JOIN Grado         │  │ • Situación final  │
   │                    │  │ • Áreas cursadas   │
   │ → Resultados       │  │                    │
   │   INSTANTÁNEOS     │  │ → Listo para PDF   │
   └────────────────────┘  └────────────────────┘
```

---

## 📁 Archivos Creados

### 1. Migración SQL
```
backend/prisma/migrations/add_acta_normalizacion.sql
```
- Crea tablas `ActaEstudiante` y `ActaNota`
- Agrega campos `normalizada` y `fecha_normalizacion` a `ActaFisica`
- Crea índices, vistas, funciones y triggers

### 2. Types TypeScript
```
backend/src/modules/actas/normalizacion.types.ts
```
- Interfaces para todo el flujo
- Configuración flexible
- 15+ tipos definidos

### 3. Servicio de Normalización
```
backend/src/modules/actas/normalizacion.service.ts
```
Métodos principales:
- `validarDatosOCR()`: Valida JSON antes de normalizar
- `normalizarActa()`: ⭐ Normaliza JSON → BD
- `getActasDeEstudiante()`: Consulta actas por estudiante
- `consolidarNotasParaCertificado()`: Prepara datos para certificado

### 4. Documentación
```
PLAN_NORMALIZACION_ACTAS.md
RESUMEN_NORMALIZACION_ACTAS.md (este archivo)
```

---

## 🎯 Ejemplo de Uso

### Paso 1: OCR procesa acta
```typescript
// IA extrae datos → JSON
await ocrService.procesarActa(actaId);
// → ActaFisica.datosextraidosjson = {...}
// → ActaFisica.procesadoconia = true
```

### Paso 2: Usuario valida (opcional)
```typescript
// Frontend muestra JSON para revisión/corrección
const datosOCR = await actaService.getDatosOCR(actaId);
// Usuario corrige datos
await actaService.aplicarCorrecciones(actaId, correcciones);
```

### Paso 3: Normalizar
```typescript
import { normalizacionService } from './normalizacion.service';

// Validar primero
const validacion = await normalizacionService.validarDatosOCR(actaId);
if (!validacion.valido) {
  console.log('Errores:', validacion.errores);
  return;
}

// Normalizar
const resultado = await normalizacionService.normalizarActa(actaId);
console.log(resultado);
// {
//   success: true,
//   mensaje: "Normalización exitosa: 30 estudiantes procesados",
//   estadisticas: {
//     estudiantes_procesados: 30,
//     estudiantes_creados: 5,
//     estudiantes_existentes: 25,
//     vinculos_creados: 30,
//     notas_creadas: 240,  // 30 estudiantes × 8 áreas
//     tiempo_procesamiento_ms: 1523
//   }
// }
```

### Paso 4: Consultar datos normalizados
```typescript
// 4A. Ver todas las actas de un estudiante
const actas = await normalizacionService.getActasDeEstudiante(estudianteId);
console.log(actas);
// [
//   {
//     acta: { numero: "001-2010", folio: 25 },
//     anioLectivo: { anio: 2010 },
//     grado: { numero: 1, nombre: "Primer Grado" },
//     notas: [
//       { area: "MATEMATICA", nota: 15 },
//       { area: "COMUNICACION", nota: 14 },
//       ...
//     ]
//   },
//   ...
// ]

// 4B. Consolidar para certificado
const consolidado = await normalizacionService.consolidarNotasParaCertificado(estudianteId);
console.log(consolidado);
// {
//   estudiante: { dni: "12345678", nombreCompleto: "Juan Pérez" },
//   periodos: [
//     {
//       anio: 2010,
//       grado: { numero: 1, nombre: "Primer Grado" },
//       notas: [...],
//       acta: { numero: "001-2010", libro: "LIBRO-001" }
//     },
//     ...
//   ],
//   estadisticas: {
//     total_periodos: 6,
//     anio_inicio: 2010,
//     anio_fin: 2015,
//     grados_cursados: [1, 2, 3, 4, 5, 6],
//     promedio_general: 14.5,
//     total_notas: 48
//   }
// }
```

---

## 🔍 Consultas SQL Útiles

### Ver actas de un estudiante
```sql
SELECT * FROM v_actas_estudiante
WHERE estudiante_id = 'xxx'
ORDER BY anio, grado_numero;
```

### Ver todas las notas de un estudiante
```sql
SELECT * FROM v_notas_estudiante
WHERE estudiante_id = 'xxx'
ORDER BY anio, grado_numero, area_orden;
```

### Estadísticas de un acta normalizada
```sql
SELECT * FROM estadisticas_acta_normalizada('acta-id');
-- Retorna:
-- total_estudiantes: 30
-- total_notas: 240
-- notas_por_estudiante: 8.00
-- areas_registradas: 8
```

---

## ⚙️ Configuración

### Opciones de Normalización
```typescript
const normalizacionService = new NormalizacionService({
  // Validación
  requerir_dni: false,                // ¿DNI obligatorio?
  permitir_dni_temporal: true,        // ¿Generar DNI temporal?
  validar_areas_estricto: false,      // ¿Rechazar si área no existe?

  // Mapeo de áreas
  umbral_similitud_areas: 70,         // 0-100 (mínimo para mapeo aproximado)
  permitir_mapeo_manual: true,

  // Duplicados
  estrategia_duplicados: 'saltar',    // 'actualizar' | 'saltar' | 'error'
  campos_match_estudiante: ['dni', 'nombre_completo'],

  // Transaccionalidad
  modo_transaccion: 'mejor_esfuerzo', // 'todo_o_nada' | 'mejor_esfuerzo'
  rollback_on_error: false,

  // Auditoría
  guardar_json_original: true,        // Mantener JSON como backup
  registrar_correcciones: true
});
```

---

## 🚀 Próximos Pasos

### Fase 1: Actualizar Prisma Schema ✅ HECHO
- [x] Agregar modelos `ActaEstudiante` y `ActaNota`
- [x] Actualizar modelo `ActaFisica`

### Fase 2: Ejecutar Migración
```bash
cd backend
npx prisma migrate dev --name add_acta_normalizacion
npx prisma generate
```

### Fase 3: Crear Endpoints
```typescript
// routes/actas-normalizacion.routes.ts
POST   /actas/:id/validar           // Validar JSON
POST   /actas/:id/normalizar        // Normalizar JSON → BD
GET    /estudiantes/:id/actas       // Listar actas de estudiante
GET    /estudiantes/:id/notas-consolidadas // Para certificado
```

### Fase 4: Frontend
- Pantalla de revisión/validación de JSON extraído
- Corrección manual de datos
- Botón "Normalizar" después de validar
- Vista de actas por estudiante
- Consolidado para certificado

---

## 📊 Beneficios

### ✅ Flexibilidad
- IA extrae libremente (JSON sin restricciones)
- Sistema adapta dinámicamente áreas curriculares variables

### ✅ Validación
- Datos validados antes de normalizar
- Correcciones manuales pre-normalización
- JSON original permanece como backup

### ✅ Rendimiento
- Consultas SQL rápidas (índices optimizados)
- No hay que parsear JSON en cada consulta
- Joins eficientes

### ✅ Trazabilidad Completa
- Libro, folio, acta física
- Nombre original extraído por OCR
- Confianza de IA en cada nota
- Historial de correcciones

### ✅ Generación de Certificados
- Consolidación automática por año/grado
- Cálculo de promedios
- Detección de situación final
- Listo para imprimir

---

## 📝 Notas Importantes

### ⚠️ JSON se mantiene como backup
- Nunca se elimina
- Sirve para auditoría
- Permite re-normalizar si es necesario

### ⚠️ Normalización es idempotente
- Se puede ejecutar múltiples veces
- Detecta duplicados
- Configurable: saltar, actualizar o error

### ⚠️ Mapeo de áreas inteligente
1. **Exacto**: "MATEMATICA" → "MATEMATICA" (100%)
2. **Aproximado**: "MATEMÁTICA" → "MATEMATICA" (90%)
3. **Contiene**: "CIENCIA Y TECNOLOGIA" → "CIENCIA Y AMBIENTE" (80%)
4. **Manual**: Usuario mapea áreas no reconocidas

---

## 🎉 Resultado Final

```
ANTES (Solo JSON):
┌────────────────────┐
│ ActaFisica         │
│ ├─ numero          │
│ ├─ grado_id        │
│ └─ datos JSON ❓   │  ← Datos encerrados, difícil consultar
└────────────────────┘

DESPUÉS (Normalizado):
┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│ ActaFisica         │────<│ ActaEstudiante     │>───│ Estudiante         │
│ ├─ numero          │     │ ├─ numero_orden    │    │ ├─ dni             │
│ ├─ libro_id        │     │ ├─ situacion_final │    │ ├─ nombres         │
│ ├─ folio           │     │ └─ ...             │    │ └─ ...             │
│ ├─ datos JSON ✓    │     └────────┬───────────┘    └────────────────────┘
│ └─ normalizada ✓   │              │
└────────────────────┘              │
                                    ▼
                         ┌────────────────────┐
                         │ ActaNota           │
                         │ ├─ area_id         │────> AreaCurricular
                         │ ├─ nota            │
                         │ └─ nota_literal    │
                         └────────────────────┘

✅ Consultas SQL rápidas
✅ Joins eficientes
✅ Reportes directos
✅ Certificados automáticos
```

---

## 📞 Soporte

Si tienes dudas:
1. Revisa `PLAN_NORMALIZACION_ACTAS.md` (plan detallado)
2. Revisa `normalizacion.types.ts` (todos los tipos)
3. Revisa `normalizacion.service.ts` (implementación completa)
4. Revisa las migraciones SQL (estructura de BD)

---

**¡Sistema listo para usar!** 🚀
