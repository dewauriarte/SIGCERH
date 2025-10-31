# ✅ FLUJO CORRECTO (CON INTERVENCIÓN HUMANA)

## FASE 1: Editor Prepara el Contexto (ANTES del OCR)

```javascript
// En la interfaz del Editor:
1. Editor localiza el acta física
2. Lee la cabecera manualmente
3. Registra en el sistema:
{
  "solicitud_id": "uuid-solicitud",
  "acta_id": "uuid-acta-nueva",
  
  // DATOS MANUALES DEL EDITOR (leyendo el acta):
  "metadata": {
    "anio": 1990,              // ← Editor lo ESCRIBE viendo el acta
    "grado_id": "uuid-5to",    // ← Editor lo SELECCIONA de dropdown
    "seccion": "A",            // ← Editor lo ESCRIBE
    "turno": "Mañana",         // ← Editor lo SELECCIONA
    "colegio_id": "uuid-col",  // ← Ya viene de la solicitud
    "tipoEvaluacion": "FINAL"  // ← Editor lo SELECCIONA
  },
  
  "archivoEscaneado": "acta-1990-5A.pdf"
}
```

## FASE 2: Sistema Carga la Plantilla de Áreas

```javascript
// Backend automáticamente busca el currículo:
const plantillaAreas = await db.query(`
  SELECT 
    cg.orden,
    ac.id as area_id,
    ac.codigo,
    ac.nombre
  FROM CurriculoGrado cg
  JOIN AreaCurricular ac ON cg.area_id = ac.id
  WHERE cg.anioLectivo_id = (SELECT id FROM AnioLectivo WHERE anio = $1)
    AND cg.grado_id = $2
  ORDER BY cg.orden`, [metadata.anio, metadata.grado_id]);

// Resultado:
[
  { orden: 1, nombre: 'Matemática', codigo: 'MAT' },
  { orden: 2, nombre: 'Comunicación', codigo: 'COM' },
  { orden: 3, nombre: 'Inglés', codigo: 'ING' },
  // ... 12 áreas
]
```

## FASE 3: Editor Lanza el OCR (CON Contexto)

```javascript
// El sistema envía a Gemini:
const prompt = `Extrae los datos de esta acta de notas de 1990, 5to grado, sección A.
Las columnas de notas corresponden a:
Nota 1 = Matemática
Nota 2 = Comunicación 
Nota 3 = Inglés
Nota 4 = Ciencias Sociales
Nota 5 = Ciencias Naturales
Nota 6 = Educación para el Arte
Nota 7 = Educación Física
Nota 8 = Educación Religiosa
Nota 9 = Educación para el Trabajo
Nota 10 = Persona, Familia y RRHH
Nota 11 = CTA
Nota 12 = Formación Ciudadana

Extrae SOLO estos campos por estudiante:
- Número
- Código
- Tipo (P/G)
- Nombre Completo
- Sexo (H/M)
- Nota1 a Nota12 (valores numéricos o null si está vacío)
- Comportamiento
- Asignaturas Desaprobadas
- Situación Final (A/R/D)

Formato JSON.`;

const resultadoOCR = await gemini.extractData(actaEscaneada, prompt);
```

## FASE 4: OCR Extrae TODOS los Estudiantes de la Tabla

```json
{
  "estudiantes": [
    {
      "numero": 1,
      "codigo": "1",
      "tipo": "G",
      "nombreCompleto": "CALLAPANI MAYTA, Edgar",
      "sexo": "H",
      "notas": [9, 11, 13, 13, 11, 10, 15, 15, 12, 12, 12, null],
      "comportamiento": 16,
      "asignaturasDesaprobadas": 2,
      "situacionFinal": "A"
    },
    {
      "numero": 2,
      "codigo": "2",
      "tipo": "G",
      "nombreCompleto": "GALLO FLORES, Ruffo Héctor",
      "sexo": "H",
      "notas": [12, 12, 12, 12, 12, 10, 15, 16, 11, 12, 11, null],
      "comportamiento": 18,
      "asignaturasDesaprobadas": 1,
      "situacionFinal": "A"
    },
    {
      "numero": 3,
      "codigo": "3",
      "tipo": "G",
      "nombreCompleto": "CUNO QUISPE, Agustín Reneé",
      "sexo": "H",
      "notas": [11, 11, 12, 13, 11, 11, 16, 10, 11, 12, 11, null],
      "comportamiento": 16,
      "asignaturasDesaprobadas": 1,
      "situacionFinal": "A"
    },
    {
      "numero": 4,
      "codigo": "4",
      "tipo": "P",
      "nombreCompleto": "CHOQUECOTA SERRANO, Víctor Raúl",
      "sexo": "H",
      "notas": [null, null, null, null, null, null, null, null, null, null, null, null],
      "comportamiento": null,
      "asignaturasDesaprobadas": 0,
      "observaciones": "Retir. por 30% Inasist. Injust. 30-",
      "situacionFinal": "R"
    },
    {
      "numero": 5,
      "codigo": "5",
      "tipo": "G",
      "nombreCompleto": "ESPINOZA LOZA, Mijail Ygor",
      "sexo": "H",
      "notas": [11, 13, 13, 14, 14, 11, 15, 16, 14, 13, 11, 12],
      "comportamiento": 17,
      "asignaturasDesaprobadas": 0,
      "situacionFinal": "A"
    },
    // ... 25 estudiantes más ...
  ]
}
```

> **Nota Importante:** 
> - El OCR extrae **TODOS los estudiantes de la hoja** (20-40 estudiantes típicamente)
> - El OCR NO dice "Matemática = 13". Solo dice "Nota1 = 13"
> - Todos comparten el mismo año, grado, sección y plantilla de áreas

## FASE 5: Backend Procesa TODOS los Estudiantes

```javascript
async function procesarActa(metadata, plantillaAreas, resultadoOCR) {
  
  console.log(`Procesando ${resultadoOCR.estudiantes.length} estudiantes...`);
  // Típicamente: 20-40 estudiantes por acta
  
  for (const estudiante of resultadoOCR.estudiantes) {  // ← Loop de 20-40 iteraciones
    
    // 1. Buscar o crear estudiante
    let est = await buscarOCrearEstudiante({
      nombreCompleto: estudiante.nombreCompleto,
      sexo: estudiante.sexo
    });
    
    // 2. Crear certificado para este estudiante
    const certificado = await crearCertificado({
      estudiante_id: est.id,
      anioLectivo_id: metadata.anio,
      grado_id: metadata.grado_id
    });
    
    // 3. Crear detalle (año/grado específico)
    const detalle = await crearCertificadoDetalle({
      certificado_id: certificado.id,
      anioLectivo_id: metadata.anio,
      grado_id: metadata.grado_id,
      comportamiento: estudiante.comportamiento,
      situacionFinal: estudiante.situacionFinal,
      observaciones: estudiante.observaciones,
      orden: 1
    });
    
    // 4. Mapear notas usando la PLANTILLA
    for (let i = 0; i < estudiante.notas.length; i++) {
      const nota = estudiante.notas[i];
      
      if (nota !== null) {
        const area = plantillaAreas[i]; // ← Aquí está la magia
        
        await crearCertificadoNota({
          certificadoDetalle_id: detalle.id,
          area_id: area.area_id,       // ← De CurriculoGrado
          nota: nota,                  // ← 13 (del OCR)
          orden: area.orden            // ← 1 (para impresión)
        });
      }
    }
    
    console.log(`✓ Procesado: ${estudiante.nombreCompleto}`);
  }
  
  console.log(`✅ Total procesados: ${resultadoOCR.estudiantes.length} estudiantes`);
}

// Resultado en BD de 1 acta con 30 estudiantes:
// - 30 registros en Estudiante (o menos si ya existen)
// - 30 registros en Certificado
// - 30 registros en CertificadoDetalle
// - ~360 registros en CertificadoNota (30 estudiantes × 12 áreas)
```

## 🖥️ INTERFAZ DEL EDITOR (Ejemplo)

```
┌─────────────────────────────────────────────────────────┐
│ PROCESAR ACTA CON OCR                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📄 Solicitud: S-2025-001234                             │
│ 👤 Estudiante: NUSTINGTO RIQUELME, Optaciano           │
│                                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ DATOS DEL ACTA (Leer manualmente del documento físico) │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                         │
│ Año Lectivo:      [1990       ▼]  ← Dropdown           │
│ Grado:            [5to Sec.   ▼]  ← Dropdown           │
│ Sección:          [A___________]  ← Input manual       │
│ Turno:            [Mañana     ▼]  ← Dropdown           │
│ Tipo Evaluación:  [FINAL      ▼]  ← Dropdown           │
│                                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ PLANTILLA DE ÁREAS (Cargada automáticamente)           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                         │
│ ✅ Nota 1  → Matemática                                │
│ ✅ Nota 2  → Comunicación                              │
│ ✅ Nota 3  → Inglés                                    │
│ ✅ Nota 4  → Ciencias Sociales                         │
│ ... (12 áreas en total)                                 │
│                                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ARCHIVO ESCANEADO                                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                         │
│ 📎 [Subir PDF del acta escaneada]                      │
│    acta-1990-5A-nustingto.pdf (2.3 MB) ✅              │
│                                                         │
│         [🤖 PROCESAR CON IA/OCR]                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Después de procesar:

```
┌─────────────────────────────────────────────────────────────────┐
│ RESULTADO DEL OCR - ACTA 1990-5A                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ✅ Se detectaron 30 estudiantes en el acta                     │
│                                                                 │
│ 📋 LISTA DE ESTUDIANTES EXTRAÍDOS:                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                 │
│ 1. [G] CALLAPANI MAYTA, Edgar (H)                              │
│    📊 Notas: 9, 11, 13, 13, 11, 10, 15, 15, 12, 12, 12       │
│    📝 Comportamiento: 16  |  Desaprobadas: 2                   │
│    [✅ OK] [✏️ Editar]                                         │
│                                                                 │
│ 2. [G] GALLO FLORES, Ruffo Héctor (H)                          │
│    📊 Notas: 12, 12, 12, 12, 12, 10, 15, 16, 11, 12, 11      │
│    📝 Comportamiento: 18  |  Desaprobadas: 1                   │
│    [✅ OK] [✏️ Editar]                                         │
│                                                                 │
│ 3. [G] CUNO QUISPE, Agustín Reneé (H)                          │
│    📊 Notas: 11, 11, 12, 13, 11, 11, 16, 10, 11, 12, 11      │
│    📝 Comportamiento: 16  |  Desaprobadas: 1                   │
│    [✅ OK] [✏️ Editar]                                         │
│                                                                 │
│ 4. [P] CHOQUECOTA SERRANO, Víctor Raúl (H) ⚠️                  │
│    ⚠️  Observación: "Retir. por 30% Inasist. Injust."         │
│    📝 Situación: RETIRADO                                      │
│    [⚠️ Revisar] [✏️ Editar]                                    │
│                                                                 │
│ 5. [G] ESPINOZA LOZA, Mijail Ygor (H)                          │
│    📊 Notas: 11, 13, 13, 14, 14, 11, 15, 16, 14, 13, 11, 12  │
│    📝 Comportamiento: 17  |  Desaprobadas: 0                   │
│    [✅ OK] [✏️ Editar]                                         │
│                                                                 │
│ 6. [G] GUTIERREZ DEL PINO, Juan Antonio (H)                    │
│    📊 Notas: 10, 13, 12, 13, 12, 11, 14, 15, 11, 12, 12, 11  │
│    📝 Comportamiento: 16  |  Desaprobadas: 0                   │
│    [✅ OK] [✏️ Editar]                                         │
│                                                                 │
│ 7. [G] GUTIERREZ POMA, Alfonso (H)                             │
│    📊 Notas: 11, 11, 11, 14, 12, 11, 15, 15, 12, 13, 11, 11  │
│    📝 Comportamiento: 15  |  Desaprobadas: 0                   │
│    [✅ OK] [✏️ Editar]                                         │
│                                                                 │
│ ... (23 estudiantes más) ...                                   │
│                                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                 │
│ 📊 RESUMEN:                                                     │
│    ✅ Estudiantes aprobados: 27                                │
│    ⚠️  Con observaciones: 3                                    │
│    📝 Total extraído: 30 estudiantes                           │
│                                                                 │
│    [🔍 REVISAR TODOS] [✅ APROBAR Y GUARDAR EN BD]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

> Al hacer clic en "GUARDAR EN BD":
> - Se crean 30 registros de Estudiante
> - Se crean 30 Certificados
> - Se crean 30 CertificadoDetalle
> - Se crean ~360 CertificadoNota (30 × 12 áreas)
```

## 🎯 RESUMEN: División de Responsabilidades

| Dato                           | ¿Quién lo Provee?          | Fuente                                     |
|--------------------------------|----------------------------|--------------------------------------------|
| Año                            | 👤 Editor (manual)         | Lee cabecera del acta física               |
| Grado                          | 👤 Editor (manual)         | Lee cabecera del acta física               |
| Sección                        | 👤 Editor (manual)         | Lee cabecera del acta física               |
| Plantilla de Áreas             | 🤖 Sistema (automático)    | CurriculoGrado según año+grado             |
| **TODOS los Estudiantes**      | 🤖 IA/OCR                  | **Extrae 20-40 estudiantes de la tabla**   |
| Nombres Estudiantes            | 🤖 IA/OCR                  | Extrae de tabla del acta                   |
| Notas numéricas                | 🤖 IA/OCR                  | Extrae de tabla del acta                   |
| Comportamiento                 | 🤖 IA/OCR                  | Extrae de tabla del acta                   |
| Observaciones (retiros, etc.)  | 🤖 IA/OCR                  | Extrae de tabla del acta                   |
| Mapeo Nota→Área                | 🤖 Sistema (automático)    | Combina OCR + CurriculoGrado               |

---

## 🔑 PUNTOS CLAVE DEL FLUJO

### 1. Una Acta = Muchos Estudiantes
✅ El OCR procesa **toda la hoja** de una vez (20-40 estudiantes)  
✅ Todos los estudiantes comparten: año, grado, sección, plantilla de áreas  
✅ Cada estudiante tiene diferentes: nombre, sexo, notas, observaciones  

### 2. División Clara de Tareas
👤 **Editor** → Lee cabecera manualmente (año, grado, sección)  
🤖 **Sistema** → Carga plantilla de áreas automáticamente (CurriculoGrado)  
🤖 **IA/OCR** → Extrae todos los estudiantes y sus notas  
🤖 **Backend** → Combina todo y guarda en BD  

### 3. Resultado en BD por Acta
Para 1 acta con 30 estudiantes:
- 30 registros en `Estudiante`
- 30 registros en `Certificado`
- 30 registros en `CertificadoDetalle`
- ~360 registros en `CertificadoNota` (30 estudiantes × 12 áreas)