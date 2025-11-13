# 📚 MEJORAS EN LA GESTIÓN DE LIBROS Y ACTAS FÍSICAS

## 🎯 Problema Identificado

La tabla `libro` era demasiado básica y no cumplía con la funcionalidad necesaria para gestionar correctamente el inventario de libros físicos de actas. Había redundancia de datos y falta de control sobre los folios.

## ✅ Solución Implementada

### 1. **Tabla LIBRO Mejorada**

#### Campos Nuevos Agregados:
- `nivel_id` → Relación con nivel educativo (Primaria/Secundaria)
- `nombre` → Nombre descriptivo del libro
- `tipo_acta` → Tipo de actas que contiene (EVALUACION, RECUPERACION, etc.)
- `folio_inicio` → Número del primer folio
- `folio_fin` → Número del último folio
- `folios_utilizados` → Contador automático de folios usados
- `estante` → Ubicación física específica
- `seccion_archivo` → Sección del archivo (HISTORICOS, ACTIVOS)
- `usuario_registro_id` → Quién registró el libro
- `fecha_actualizacion` → Última actualización

#### Constraints Nuevos:
- ✅ Validación de que `anio_fin >= anio_inicio`
- ✅ Validación de que `folio_fin >= folio_inicio`
- ✅ Validación de que `folios_utilizados <= total_folios`
- ✅ Relación con nivel educativo
- ✅ Relación con usuario que registra

#### Estados del Libro:
- **ACTIVO**: Libro disponible para agregar actas
- **EN_USO**: Libro en proceso de llenado
- **COMPLETO**: Todos los folios están utilizados
- **ARCHIVADO**: Libro completo y archivado
- **DETERIORADO**: Libro con daños físicos
- **PERDIDO**: Libro extraviado

---

### 2. **Tabla ACTAFISICA Mejorada**

#### Cambios Principales:
- ✅ `libro_id` ahora es **OBLIGATORIO** (NOT NULL)
- ✅ `folio` cambió de VARCHAR a INTEGER (más eficiente)
- ✅ Eliminada redundancia de `ubicacionfisica` (ahora se obtiene del libro)
- ✅ Constraint único: `(libro_id, folio)` → No pueden haber dos actas en el mismo folio del mismo libro

#### Campos Nuevos:
- `tamanoarchivo_kb` → Tamaño del archivo escaneado
- `calidad_ocr` → Calidad del OCR (EXCELENTE, BUENA, REGULAR, MALA)
- `confianza_ia` → Nivel de confianza del procesamiento IA (0-100%)
- `usuarioprocesamiento_id` → Usuario que procesó el acta
- `fecha_actualizacion` → Última actualización

#### Constraints Nuevos:
- ✅ `(libro_id, folio)` UNIQUE → Un folio solo puede tener una acta
- ✅ Validación de que `folio > 0`
- ✅ Validación de que `confianza_ia` esté entre 0 y 100

---

### 3. **Funciones y Triggers Automáticos**

#### Función: `validar_folio_libro()`
**Se ejecuta ANTES de insertar/actualizar un acta**

✅ Valida que el libro esté en estado ACTIVO o EN_USO
✅ Valida que el folio esté dentro del rango permitido del libro
✅ Previene insertar actas en libros ARCHIVADOS o DETERIORADOS

```sql
-- Ejemplo: Si el libro tiene folios del 1 al 200
-- No permitirá insertar un acta con folio 250
```

#### Función: `actualizar_folios_libro()`
**Se ejecuta DESPUÉS de insertar/eliminar un acta**

✅ Actualiza automáticamente el contador `folios_utilizados` del libro
✅ Cuenta folios únicos (no duplicados)
✅ Actualiza la fecha de modificación del libro

```sql
-- Cuando insertas una nueva acta:
-- El libro actualiza automáticamente su contador de folios
```

#### Trigger: `trg_libro_actualizar`
✅ Actualiza automáticamente `fecha_actualizacion` al modificar un libro

---

### 4. **Índices de Rendimiento**

#### Índices para LIBRO:
```sql
- idx_libro_nivel → Búsqueda por nivel educativo
- idx_libro_tipo → Búsqueda por tipo de acta
- idx_libro_anios → Búsqueda por rango de años
- idx_libro_activo → Libros activos (optimizado)
- idx_libro_ubicacion → Búsqueda por ubicación física
- idx_libro_inst_nivel_anio → Búsqueda combinada
```

#### Índices para ACTAFISICA:
```sql
- idx_acta_libro_folio → Búsqueda de acta por libro y folio
- idx_acta_tipo → Búsqueda por tipo de acta
- idx_acta_calidad → Búsqueda por calidad del OCR
- idx_acta_pendiente_procesar → Actas pendientes de procesar (optimizado)
```

---

### 5. **Vistas SQL para Consultas Rápidas**

#### Vista: `v_actas_completo`
Muestra todas las actas con información consolidada:
- ✅ Datos del acta
- ✅ Información del libro
- ✅ Año lectivo
- ✅ Grado y nivel educativo
- ✅ Estado de procesamiento

**Ejemplo de uso:**
```sql
SELECT * FROM v_actas_completo 
WHERE libro_codigo = 'PRIM-2010-A' 
ORDER BY folio;
```

#### Vista: `v_estadisticas_libros`
Muestra estadísticas completas de cada libro:
- ✅ Total de actas en el libro
- ✅ Actas procesadas vs pendientes
- ✅ Porcentaje de uso del libro
- ✅ Primera y última acta registrada

**Ejemplo de uso:**
```sql
SELECT 
    codigo,
    nombre,
    total_actas,
    porcentaje_uso,
    actas_procesadas,
    actas_pendientes
FROM v_estadisticas_libros
WHERE estado = 'ACTIVO'
ORDER BY porcentaje_uso DESC;
```

---

## 🎬 Flujo de Trabajo Mejorado

### 1️⃣ **Registrar un Libro**
```sql
INSERT INTO libro (
    codigo, nombre, nivel_id, tipo_acta,
    anio_inicio, anio_fin,
    folio_inicio, folio_fin, total_folios,
    ubicacion_fisica, estante, seccion_archivo,
    estado
) VALUES (
    'PRIM-2010-A',
    'Libro de Actas de Primaria 2010 - Tomo A',
    '...',  -- UUID del nivel Primaria
    'EVALUACION',
    2010, 2012,
    1, 200, 200,
    'Archivo Central',
    'E-05',
    'HISTORICOS',
    'ACTIVO'
);
```

### 2️⃣ **Registrar un Acta en el Libro**
```sql
INSERT INTO actafisica (
    libro_id, folio, numero, tipo,
    aniolectivo_id, grado_id,
    seccion, turno,
    fechaemision,
    urlarchivo,
    hasharchivo
) VALUES (
    '...',  -- UUID del libro
    45,     -- Número de folio
    'A-001-2010',
    'EVALUACION',
    '...',  -- UUID año lectivo
    '...',  -- UUID grado
    'A',
    'MAÑANA',
    '2010-12-20',
    'https://...',
    'sha256hash...'
);
```

✅ **El sistema automáticamente:**
- Valida que el folio 45 esté entre 1 y 200
- Valida que el libro esté ACTIVO
- Incrementa el contador `folios_utilizados` del libro
- Previene duplicados en el mismo folio

### 3️⃣ **Consultar Actas de un Libro**
```sql
SELECT 
    numero, folio, tipo, grado_nombre, seccion,
    procesadoconia, calidad_ocr, confianza_ia
FROM v_actas_completo
WHERE libro_codigo = 'PRIM-2010-A'
ORDER BY folio;
```

### 4️⃣ **Ver Estadísticas del Libro**
```sql
SELECT * FROM v_estadisticas_libros
WHERE codigo = 'PRIM-2010-A';
```

Resultado:
```
codigo: PRIM-2010-A
nombre: Libro de Actas de Primaria 2010 - Tomo A
total_folios: 200
folios_utilizados: 45
porcentaje_uso: 22.50
total_actas: 45
actas_procesadas: 40
actas_pendientes: 5
```

---

## 📊 Beneficios de las Mejoras

### ✅ **Control Total de Inventario**
- Sabes exactamente qué libros tienes
- Dónde están ubicados físicamente
- Cuántos folios han sido utilizados
- Estado actual de cada libro

### ✅ **Integridad de Datos**
- No se pueden duplicar folios en el mismo libro
- Validaciones automáticas de rangos
- Control de estados del libro
- Rastreabilidad completa (quién y cuándo)

### ✅ **Rendimiento Optimizado**
- Índices estratégicos para búsquedas rápidas
- Vistas precalculadas para estadísticas
- Consultas optimizadas

### ✅ **Facilidad de Uso**
- Vistas que simplifican consultas complejas
- Contadores automáticos
- Validaciones en tiempo real
- Información consolidada

### ✅ **Gestión Profesional**
- Trazabilidad de archivos físicos
- Estadísticas en tiempo real
- Control de calidad del OCR
- Mejor organización del archivo

---

## 🚀 Ejemplos de Consultas Útiles

### **1. Libros con más del 80% de uso**
```sql
SELECT codigo, nombre, porcentaje_uso, estado
FROM v_estadisticas_libros
WHERE porcentaje_uso >= 80
ORDER BY porcentaje_uso DESC;
```

### **2. Actas pendientes de procesar por libro**
```sql
SELECT 
    libro_codigo,
    COUNT(*) as pendientes
FROM v_actas_completo
WHERE procesadoconia = false
GROUP BY libro_codigo
ORDER BY pendientes DESC;
```

### **3. Folios disponibles en un libro**
```sql
-- Encuentra folios sin usar en el libro
SELECT f.folio_numero
FROM generate_series(1, 200) f(folio_numero)
LEFT JOIN actafisica a ON a.folio = f.folio_numero 
    AND a.libro_id = '...'  -- UUID del libro
WHERE a.id IS NULL
ORDER BY f.folio_numero;
```

### **4. Calidad promedio del OCR por libro**
```sql
SELECT 
    libro_codigo,
    AVG(confianza_ia) as confianza_promedio,
    COUNT(*) as total_actas
FROM v_actas_completo
WHERE procesadoconia = true
GROUP BY libro_codigo
ORDER BY confianza_promedio DESC;
```

---

## 📝 Notas Importantes

1. **Libro es OBLIGATORIO**: Todas las actas deben estar asociadas a un libro físico
2. **Folio Único**: No puede haber dos actas en el mismo folio del mismo libro
3. **Validación Automática**: El sistema valida rangos antes de insertar
4. **Contadores Automáticos**: No necesitas actualizar manualmente los contadores
5. **Estados Controlados**: Solo puedes agregar actas a libros ACTIVOS o EN_USO

---

## 🎓 Estructura Final

```
LIBRO (Inventario)
├── Código: PRIM-2010-A
├── Nombre: Libro de Actas Primaria 2010
├── Nivel: Primaria
├── Tipo: EVALUACION
├── Años: 2010-2012
├── Folios: 1 a 200 (total: 200)
├── Utilizados: 45 folios (22.5%)
├── Ubicación: Archivo Central, Estante E-05
└── Estado: ACTIVO
    │
    └── ACTAS FÍSICAS
        ├── Folio 1: A-001-2010 (1ro A)
        ├── Folio 2: A-002-2010 (1ro B)
        ├── Folio 3: A-003-2010 (2do A)
        └── ...
```

---

## 🎉 Resultado Final

Ahora tienes un **sistema profesional de gestión de libros y actas físicas** con:

✅ **Control total** del inventario físico
✅ **Validaciones automáticas** que previenen errores
✅ **Estadísticas en tiempo real** de uso y procesamiento
✅ **Trazabilidad completa** de todos los registros
✅ **Optimización de rendimiento** con índices estratégicos
✅ **Facilidad de consulta** con vistas predefinidas

¡La estructura está lista para una gestión profesional! 🚀

