# 📖 Cómo Acceder al Historial Académico de Estudiantes

## 🎯 Opción 1: Desde el Menú Lateral (Sidebar)

1. **Inicia sesión** como usuario con rol `EDITOR` o `ADMIN`
2. En el menú lateral izquierdo, busca la opción **"Estudiantes"**
3. Haz clic en **"Estudiantes"**
4. Se abrirá la página con la lista de todos los estudiantes

```
┌────────────────────────────┐
│  SIGCERH                   │
│  Sistema de Certificados   │
├────────────────────────────┤
│  📊 Dashboard              │
│  📂 Expedientes Asignados  │
│  🧠 Procesar OCR           │
│  💾 Normalizar Actas       │
│  👥 Estudiantes           ← AQUÍ
│  📚 Libros de Actas        │
│  📅 Años Lectivos          │
└────────────────────────────┘
```

---

## 🚀 Opción 2: Desde el Dashboard del Editor (Más Rápido)

1. **Inicia sesión** como usuario con rol `EDITOR`
2. Serás dirigido automáticamente al **Dashboard - Oficina de Actas**
3. Baja hasta la sección **"Acciones Rápidas"**
4. Haz clic en la tarjeta **"Estudiantes"**

```
┌──────────────────────────────────────────────────────────┐
│  Dashboard - Oficina de Actas                            │
├──────────────────────────────────────────────────────────┤
│  Estadísticas Principales:                               │
│  [Expedientes] [Actas Encontradas] [OCR] [Certificados] │
├──────────────────────────────────────────────────────────┤
│  Acciones Rápidas                                        │
│                                                           │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐│
│  │ 🧠 OCR Gemini │  │ 👥 Estudiantes│  │ 📚 Libros    ││
│  │ Procesar IA   │  │ Ver y gestionar│  │ Organizar   ││
│  └───────────────┘  └───────────────┘  └──────────────┘│
│                           ↑ CLIC AQUÍ                    │
└──────────────────────────────────────────────────────────┘
```

---

## 📋 Opción 3: Desde la Lista de Estudiantes → Historial Individual

Una vez en la página de **Estudiantes**:

1. Verás una tabla con todos los estudiantes registrados
2. Cada fila tiene un menú de **3 puntos (⋮)** al final
3. Haz clic en los **3 puntos** del estudiante que quieres ver
4. En el menú desplegable, selecciona **"Historial Académico"**

```
┌─────────────────────────────────────────────────────────────────┐
│  Estudiantes                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ DNI      │ Nombre Completo              │ ... │ Acciones │   │
│  ├──────────┼──────────────────────────────┼─────┼──────────┤   │
│  │ T2452001 │ BUSTINCIO RIQUELME OPTACIANO │ ... │   ⋮     │   │
│  │          │                               │     │  ┌──────┴──┐│
│  │          │                               │     │  │ 📖 Hist.││
│  │          │                               │     │  │ 👁 Ver  ││
│  │          │                               │     │  │ ✏️ Edit  ││
│  │          │                               │     │  │ 🗑️ Elim  ││
│  │          │                               │     │  └─────────┘│
│  └──────────┴──────────────────────────────┴─────┴──────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌐 URLs Directas para Acceso

Puedes usar estas URLs directamente en el navegador:

### Ver Lista de Estudiantes:
```
http://localhost:5173/dashboard/estudiantes
```
o
```
http://localhost:5173/admin/estudiantes
```

### Ver Historial de un Estudiante Específico:
```
http://localhost:5173/estudiantes/{ID_DEL_ESTUDIANTE}/historial
```

**Ejemplo real:**
```
http://localhost:5173/estudiantes/5d37e7de-f975-4fc4-a6e3-491bc59900df/historial
```

---

## 🎨 Vista del Historial Académico

Cuando accedas al historial de un estudiante, verás:

### 1️⃣ Información del Estudiante
```
┌────────────────────────────────────────────────────────┐
│ 📖 Historial Académico                                 │
│    BUSTINCIO RIQUELME OPTACIANO                        │
│                                                         │
│ DNI: T2452001 [⚠️ TEMPORAL]                            │
│ Nombre: BUSTINCIO RIQUELME OPTACIANO                   │
│ Estado: ✅ Puede generar certificado                   │
│                                                         │
│ ⚠️ DNI Temporal Detectado                              │
│ Se recomienda completar el DNI real para certificados  │
│ oficiales.                                              │
│ [📝 Completar DNI Real]                                │
└────────────────────────────────────────────────────────┘
```

### 2️⃣ Resumen Visual de Grados
```
┌─────────────────────────────────────────────────────────┐
│ Resumen de Grados                                       │
│ Total de actas: 1 de 5 grados                          │
│                                                          │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐         │
│  │ 1°  │  │ 2°  │  │ 3°  │  │ 4°  │  │ 5°  │         │
│  │     │  │ ✅  │  │     │  │     │  │     │         │
│  │Falta│  │12.0 │  │Falta│  │Falta│  │Falta│         │
│  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘         │
└─────────────────────────────────────────────────────────┘
```

### 3️⃣ Detalle de Cada Grado
```
┌───────────────────────────────────────────────────────────┐
│ 📄 2° GRADO DE SECUNDARIA                                 │
│ Año Académico: 2005 | Promedio: 12.00                    │
│                                                            │
│ ┌────────────────────────────────┬──────────┬──────────┐ │
│ │ Área Curricular                │ Calif.   │ Estado   │ │
│ ├────────────────────────────────┼──────────┼──────────┤ │
│ │ Arte                           │    13    │ ✅ Aprob │ │
│ │ Ciencia, Tecnología y Ambiente │    12    │ ✅ Aprob │ │
│ │ Comunicación                   │    12    │ ✅ Aprob │ │
│ │ Educación Física               │    11    │ ✅ Aprob │ │
│ │ Educación para el Trabajo      │    12    │ ✅ Aprob │ │
│ │ Educación Religiosa            │    10    │ ❌ Desap │ │
│ │ Formación Ciudadana y Cívica   │    14    │ ✅ Aprob │ │
│ │ Inglés                         │    11    │ ✅ Aprob │ │
│ │ Matemática                     │    14    │ ✅ Aprob │ │
│ │ Persona, Familia y RR.HH.      │    11    │ ✅ Aprob │ │
│ └────────────────────────────────┴──────────┴──────────┘ │
│                                                            │
│ Promedio del Grado: 12.00                                 │
└───────────────────────────────────────────────────────────┘
```

### 4️⃣ Grados Faltantes (si aplica)
```
┌────────────────────────────────────────────────────────┐
│ ⚠️ Grados Faltantes                                    │
│ No se encontraron actas para los siguientes grados:    │
│                                                         │
│ [1° Grado] [3° Grado] [4° Grado] [5° Grado]           │
│                                                         │
│ Para generar un certificado completo, es necesario     │
│ tener las actas de todos los grados (1° a 5°).        │
└────────────────────────────────────────────────────────┘
```

---

## 🔧 Completar DNI Real (Si tiene DNI Temporal)

Si el estudiante tiene un DNI temporal (comienza con "T"), verás un botón para completarlo:

1. Haz clic en **"Completar DNI Real"**
2. Se abrirá un formulario modal
3. Ingresa el **DNI real de 8 dígitos**
4. (Opcional) Marca **"Fusionar con estudiante existente"** si el DNI ya existe
5. Haz clic en **"Actualizar DNI"**

```
┌───────────────────────────────────────────────┐
│ Completar DNI Real                            │
├───────────────────────────────────────────────┤
│                                                │
│ DNI Actual (Temporal)                         │
│ ┌────────────────────────────────────────┐   │
│ │ T2452001                                │   │
│ └────────────────────────────────────────┘   │
│                                                │
│ Nuevo DNI (8 dígitos)                         │
│ ┌────────────────────────────────────────┐   │
│ │ 12345678                                │   │
│ └────────────────────────────────────────┘   │
│                                                │
│ ☐ Fusionar con estudiante existente si el    │
│   DNI ya existe                                │
│                                                │
│ ℹ️ Si marca la opción de fusionar y ya existe│
│   un estudiante con este DNI, todas las actas │
│   se vincularán al estudiante con DNI real.   │
│                                                │
│ [Cancelar]            [Actualizar DNI]        │
└───────────────────────────────────────────────┘
```

---

## 🧪 Probar el Sistema

### Test Rápido en Backend:
```bash
cd backend
npx tsx test_flujo_completo.ts
```

Este script prueba:
- ✅ Búsqueda por nombre
- ✅ Obtención de historial académico
- ✅ Agrupación de actas por grado
- ✅ Detección de DNI temporal
- ✅ Preparación de datos para certificado

---

## 📊 Datos de Prueba Actuales

Estudiante de ejemplo en la base de datos:

```
Nombre: BUSTINCIO RIQUELME OPTACIANO
DNI: T2452001 (TEMPORAL)
ID: 5d37e7de-f975-4fc4-a6e3-491bc59900df

Actas registradas:
- 2° Grado (Año 2005)
  - 10 áreas curriculares
  - Promedio: 12.00
  - Situación: Aprobado

Grados faltantes: 1°, 3°, 4°, 5°
```

---

## 🎯 Próximos Pasos

Una vez que veas el historial académico, podrás:

1. ✅ Ver todas las actas consolidadas por grado
2. ✅ Actualizar DNI de temporal a real
3. ✅ Verificar qué grados faltan
4. ⏳ Generar certificado PDF (próxima funcionalidad)

---

## 🆘 Solución de Problemas

### "No veo la opción Estudiantes en el menú"
- Verifica que estés autenticado con rol `EDITOR` o `ADMIN`
- Cierra sesión y vuelve a iniciar
- Limpia caché del navegador (Ctrl + F5)

### "La página de estudiantes está vacía"
- Verifica que el backend esté corriendo (`npm run dev` en `/backend`)
- Verifica que haya datos normalizados en la BD
- Ejecuta `npx tsx backend/verificar_datos.ts` para verificar datos

### "Error al cargar historial"
- Verifica que el ID del estudiante sea correcto
- Revisa la consola del navegador (F12) para ver errores
- Verifica que el backend tenga el servicio `actas.service.ts`

---

## 📱 Atajos de Teclado (Futuro)

En futuras versiones:
- `Ctrl + K` → Búsqueda rápida de estudiantes
- `Ctrl + E` → Ir a lista de estudiantes
- `Esc` → Cerrar modales/diálogos

---

**Versión:** 1.0  
**Última actualización:** Noviembre 2025  
**Estado:** ✅ Sistema Funcional
