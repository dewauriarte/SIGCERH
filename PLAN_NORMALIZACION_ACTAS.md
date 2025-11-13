# Plan de Normalización de Actas Físicas

## 📌 Problema Identificado

**Situación actual:**
- Las actas se guardan solo en JSON (`datosextraidosjson`)
- No hay vínculo directo Estudiante ↔ ActaFisica
- No se pueden consultar actas de un estudiante específico
- Las notas no están normalizadas (difícil consolidar para certificados)

**Por qué JSON:**
- La IA extrae datos de actas físicas con estructura VARIABLE
- Cada año/grado puede tener diferentes áreas curriculares
- Número de columnas varía
- Necesitamos flexibilidad en la extracción

## ✅ Solución: Flujo Híbrido (JSON + Normalización)

### Principio:
1. **IA extrae → JSON** (flexible)
2. **Usuario valida → Corrige si es necesario**
3. **Sistema normaliza → BD relacional** (estructurado)
4. **JSON permanece como backup** (auditoría)

---

## 🗄️ 1. Nuevas Tablas

### Tabla: ActaEstudiante (Vínculo Acta ↔ Estudiante)

```prisma
model ActaEstudiante {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  acta_id         String   @db.Uuid
  estudiante_id   String   @db.Uuid

  // Datos específicos del estudiante en esta acta
  numero_orden    Int                    // Posición en el acta (1, 2, 3...)
  situacion_final String?  @db.VarChar(50)  // APROBADO, DESAPROBADO, RETIRADO, etc.
  observaciones   String?

  // Auditoría
  fecha_registro  DateTime @default(now()) @db.Timestamptz(6)

  // Relaciones
  actafisica      ActaFisica @relation(fields: [acta_id], references: [id], onDelete: Cascade)
  estudiante      Estudiante @relation(fields: [estudiante_id], references: [id], onDelete: Cascade)
  notas           ActaNota[]

  @@unique([acta_id, estudiante_id])
  @@unique([acta_id, numero_orden])
  @@index([acta_id])
  @@index([estudiante_id])
  @@map("actaestudiante")
}
```

### Tabla: ActaNota (Notas normalizadas por área)

```prisma
model ActaNota {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  acta_estudiante_id String   @db.Uuid
  area_id            String   @db.Uuid

  // Calificación
  nota               Int?     @db.Integer                   // 0-20 (null si no aplica)
  nota_literal       String?  @db.VarChar(50)               // "Trece", "AD", etc.
  es_exonerado       Boolean  @default(false)

  // Datos de origen OCR (para trazabilidad)
  nombre_area_ocr    String?  @db.VarChar(150)              // Nombre extraído por OCR
  confianza_ocr      Decimal? @db.Decimal(5, 2)             // 0-100%

  // Orden
  orden              Int

  // Auditoría
  fecha_registro     DateTime @default(now()) @db.Timestamptz(6)

  // Relaciones
  actaEstudiante     ActaEstudiante @relation(fields: [acta_estudiante_id], references: [id], onDelete: Cascade)
  areaCurricular     AreaCurricular @relation(fields: [area_id], references: [id], onDelete: Restrict)

  @@unique([acta_estudiante_id, area_id])
  @@index([acta_estudiante_id])
  @@index([area_id])
  @@map("actanota")
}
```

### Actualizar ActaFisica (agregar campo de control)

```prisma
model ActaFisica {
  // ... campos existentes ...

  procesadoconia     Boolean?  @default(false)
  datosextraidosjson Json?                                  // JSON de IA (backup)
  normalizada        Boolean?  @default(false)              // ✅ NUEVO: Indica si ya se normalizó
  fecha_normalizacion DateTime? @db.Timestamptz(6)          // ✅ NUEVO: Cuándo se normalizó

  // Relación con estudiantes normalizados
  estudiantes        ActaEstudiante[]                       // ✅ NUEVO

  // ... resto de campos ...
}
```

---

## 🔄 2. Flujo de Procesamiento

### Estado 1: OCR Extrae a JSON

```typescript
// IA/OCR extrae acta → Guarda en JSON
await prisma.actafisica.update({
  where: { id: actaId },
  data: {
    procesadoconia: true,
    datosextraidosjson: {
      estudiantes: [
        {
          numero: 1,
          dni: "12345678",
          apellidoPaterno: "PEREZ",
          apellidoMaterno: "GOMEZ",
          nombres: "JUAN CARLOS",
          sexo: "H",
          situacionFinal: "APROBADO",
          notas: {
            "MATEMATICA": 15,
            "COMUNICACION": 14,
            "CIENCIA Y TECNOLOGIA": 16,
            "PERSONAL SOCIAL": 13,
            // ... áreas variables según año/grado
          }
        },
        // ... más estudiantes
      ],
      metadata: {
        total_estudiantes: 30,
        confianza_promedio: 95.5,
        areas_detectadas: ["MATEMATICA", "COMUNICACION", ...]
      }
    },
    normalizada: false,  // ⚠️ Aún NO normalizada
    estado: 'PROCESADA_OCR'
  }
});
```

### Estado 2: Usuario Valida/Corrige

```typescript
// Endpoint para validar y corregir JSON
async validarYCorregirOCR(actaId: string, correcciones: any) {
  const acta = await prisma.actafisica.findUnique({
    where: { id: actaId }
  });

  let datosOCR = acta.datosextraidosjson as any;

  // Aplicar correcciones al JSON
  for (const correccion of correcciones) {
    if (correccion.tipo === 'estudiante') {
      datosOCR.estudiantes[correccion.index][correccion.campo] = correccion.nuevoValor;
    }
    if (correccion.tipo === 'nota') {
      datosOCR.estudiantes[correccion.indexEstudiante].notas[correccion.area] = correccion.nuevoValor;
    }
  }

  // Guardar JSON corregido
  await prisma.actafisica.update({
    where: { id: actaId },
    data: {
      datosextraidosjson: datosOCR,
      observaciones: `Correcciones aplicadas: ${correcciones.length} cambios`
    }
  });

  return { success: true, datosCorregidos: datosOCR };
}
```

### Estado 3: ⭐ NORMALIZACIÓN (De JSON a BD)

```typescript
/**
 * ⭐ MÉTODO PRINCIPAL: Normalizar JSON validado a tablas relacionales
 */
async normalizarActa(actaId: string, usuarioId?: string) {
  const acta = await prisma.actafisica.findUnique({
    where: { id: actaId },
    include: {
      aniolectivo: true,
      grado: true,
      libro: true
    }
  });

  // Validaciones
  if (!acta.procesadoconia) {
    throw new Error('El acta debe estar procesada con OCR primero');
  }

  if (acta.normalizada) {
    throw new Error('Esta acta ya fue normalizada');
  }

  if (!acta.datosextraidosjson) {
    throw new Error('No hay datos JSON para normalizar');
  }

  const datosOCR = acta.datosextraidosjson as any;
  const estudiantes = datosOCR.estudiantes || [];

  // Obtener plantilla de currículo del año/grado
  const plantillaCurriculo = await curriculoGradoService.getPlantillaByAnioGrado(
    acta.aniolectivo.anio,
    acta.grado.numero
  );

  // Crear mapa de áreas por código/nombre
  const mapAreas = new Map(
    plantillaCurriculo.map(area => [
      area.nombre.toUpperCase(),
      area
    ])
  );

  // === NORMALIZACIÓN EN TRANSACCIÓN ===
  const resultado = await prisma.$transaction(async (tx) => {
    const estudiantesCreados = [];
    const notasCreadas = [];
    const errores = [];

    for (const estOCR of estudiantes) {
      try {
        // 1. Buscar o crear estudiante
        let estudiante = await tx.estudiante.findFirst({
          where: {
            OR: [
              { dni: estOCR.dni },
              {
                nombres: estOCR.nombres,
                apellidopaterno: estOCR.apellidoPaterno,
                apellidomaterno: estOCR.apellidoMaterno
              }
            ]
          }
        });

        if (!estudiante) {
          estudiante = await tx.estudiante.create({
            data: {
              dni: estOCR.dni || `TEMP${Date.now()}${estOCR.numero}`,
              apellidopaterno: estOCR.apellidoPaterno,
              apellidomaterno: estOCR.apellidoMaterno,
              nombres: estOCR.nombres,
              sexo: estOCR.sexo || 'M',
              fechanacimiento: estOCR.fechaNacimiento
                ? new Date(estOCR.fechaNacimiento)
                : new Date('2000-01-01'),
              estado: 'ACTIVO'
            }
          });
        }

        // 2. Crear ActaEstudiante (vínculo)
        const actaEstudiante = await tx.actaEstudiante.create({
          data: {
            acta_id: actaId,
            estudiante_id: estudiante.id,
            numero_orden: estOCR.numero,
            situacion_final: estOCR.situacionFinal,
            observaciones: estOCR.observaciones
          }
        });

        estudiantesCreados.push(actaEstudiante.id);

        // 3. Normalizar notas (mapeo flexible)
        let orden = 1;
        for (const [nombreAreaOCR, nota] of Object.entries(estOCR.notas || {})) {
          const nombreAreaNormalizado = nombreAreaOCR.toUpperCase().trim();

          // Buscar área en la plantilla
          let area = mapAreas.get(nombreAreaNormalizado);

          // Búsqueda aproximada si no coincide exactamente
          if (!area) {
            for (const [key, value] of mapAreas.entries()) {
              if (key.includes(nombreAreaNormalizado) || nombreAreaNormalizado.includes(key)) {
                area = value;
                break;
              }
            }
          }

          // Si encontramos el área, crear la nota
          if (area) {
            await tx.actaNota.create({
              data: {
                acta_estudiante_id: actaEstudiante.id,
                area_id: area.id,
                nota: typeof nota === 'number' ? nota : null,
                nota_literal: typeof nota === 'string' ? nota : null,
                nombre_area_ocr: nombreAreaOCR,  // Guardar nombre original
                orden: orden++
              }
            });
            notasCreadas.push(area.nombre);
          } else {
            // Área no encontrada - registrar error
            errores.push({
              estudiante: `${estOCR.nombres} ${estOCR.apellidoPaterno}`,
              area: nombreAreaOCR,
              motivo: 'Área curricular no encontrada en plantilla'
            });
          }
        }

      } catch (error: any) {
        errores.push({
          estudiante: `${estOCR.nombres} ${estOCR.apellidoPaterno}`,
          error: error.message
        });
      }
    }

    return { estudiantesCreados, notasCreadas, errores };
  });

  // Marcar acta como normalizada
  await prisma.actafisica.update({
    where: { id: actaId },
    data: {
      normalizada: true,
      fecha_normalizacion: new Date(),
      estado: 'NORMALIZADA',
      observaciones: acta.observaciones +
        `\n\n[${new Date().toISOString()}] Normalizada: ${resultado.estudiantesCreados.length} estudiantes, ${resultado.notasCreadas.length} notas.`
    }
  });

  logger.info(
    `Acta ${acta.numero} normalizada exitosamente`,
    {
      actaId,
      estudiantes: resultado.estudiantesCreados.length,
      notas: resultado.notasCreadas.length,
      errores: resultado.errores.length
    }
  );

  return {
    success: true,
    mensaje: `Acta normalizada: ${resultado.estudiantesCreados.length} estudiantes procesados`,
    detalles: resultado
  };
}
```

---

## 🔍 3. Consultas Útiles

### Consultar actas de un estudiante

```typescript
async getActasDeEstudiante(estudianteId: string) {
  return await prisma.actaEstudiante.findMany({
    where: { estudiante_id: estudianteId },
    include: {
      actafisica: {
        include: {
          aniolectivo: true,
          grado: true,
          libro: true
        }
      },
      notas: {
        include: {
          areaCurricular: true
        },
        orderBy: { orden: 'asc' }
      }
    },
    orderBy: {
      actafisica: {
        aniolectivo: {
          anio: 'asc'
        }
      }
    }
  });
}
```

### Consolidar notas para certificado

```typescript
async consolidarNotasParaCertificado(estudianteId: string) {
  const actas = await this.getActasDeEstudiante(estudianteId);

  const consolidado = actas.map(actaEst => ({
    anio: actaEst.actafisica.aniolectivo.anio,
    grado: actaEst.actafisica.grado.nombre,
    situacionFinal: actaEst.situacion_final,
    notas: actaEst.notas.map(nota => ({
      area: nota.areaCurricular.nombre,
      codigo: nota.areaCurricular.codigo,
      nota: nota.nota,
      notaLiteral: nota.nota_literal
    })),
    libro: actaEst.actafisica.libro?.codigo,
    folio: actaEst.actafisica.folio
  }));

  return consolidado;
}
```

---

## 📊 4. Ventajas de este Enfoque

### ✅ Flexibilidad + Estructura
- **IA extrae libremente** → JSON sin restricciones
- **Sistema valida y normaliza** → Datos limpios en BD
- **JSON permanece** → Auditoría y trazabilidad

### ✅ Manejo de Variabilidad
- Áreas curriculares diferentes por año → Mapeo inteligente
- Columnas variables → Se adapta dinámicamente
- Errores de OCR → Se corrigen antes de normalizar

### ✅ Queries Eficientes
- Consultas SQL rápidas (índices, joins)
- No hay que parsear JSON en cada consulta
- Reportes y estadísticas directas

### ✅ Generación de Certificados
- Consolidación simple de múltiples actas
- Agrupación por año/grado automática
- Trazabilidad completa (libro, folio, acta)

---

## 🚀 5. Implementación por Fases

### Fase 1: Schema y Migraciones
- [ ] Agregar modelos Prisma
- [ ] Generar migraciones SQL
- [ ] Actualizar modelo ActaFisica

### Fase 2: Servicio de Normalización
- [ ] Método `normalizarActa()`
- [ ] Método `validarYCorregirOCR()`
- [ ] Mapeo inteligente de áreas curriculares

### Fase 3: Endpoints
- [ ] POST `/actas/:id/normalizar`
- [ ] GET `/estudiantes/:id/actas`
- [ ] GET `/estudiantes/:id/notas-consolidadas`

### Fase 4: Frontend
- [ ] Pantalla de revisión/validación JSON
- [ ] Botón "Normalizar" después de validar
- [ ] Vista de actas por estudiante
- [ ] Consolidado para certificado

---

## ⚠️ Consideraciones Importantes

### Manejo de Duplicados
- Verificar si el estudiante ya existe (por DNI o nombre completo)
- Evitar duplicar ActaEstudiante para misma acta

### Mapeo de Áreas
- Crear tabla de sinónimos/aliases para áreas curriculares
- Ejemplo: "COMUNICACIÓN" = "COMUNICACION" = "LENGUA"

### Validación Pre-Normalización
- JSON debe estar completo y validado
- Todas las áreas deben estar en el currículo
- DNIs válidos (o asignar temporales)

### Rollback
- Si falla la normalización, no marcar como normalizada
- Transacción garantiza atomicidad
- JSON original siempre disponible

---

## 📝 Ejemplo Completo

```typescript
// 1. OCR procesa acta
await ocrService.procesarActa(actaId);
// → Guarda JSON en datosextraidosjson
// → Estado: PROCESADA_OCR

// 2. Usuario valida/corrige
await actaService.validarYCorregirOCR(actaId, correcciones);
// → Actualiza JSON con correcciones

// 3. Sistema normaliza
await actaService.normalizarActa(actaId);
// → Crea ActaEstudiante (30 registros)
// → Crea ActaNota (240 registros = 30 estudiantes × 8 áreas)
// → Estado: NORMALIZADA

// 4. Consultar datos normalizados
const actas = await actaService.getActasDeEstudiante(estudianteId);
// → Retorna todas las actas donde aparece el estudiante

// 5. Generar certificado
const notasConsolidadas = await actaService.consolidarNotasParaCertificado(estudianteId);
// → Agrupa notas por año/grado
// → Listo para certificado
```

---

## 🎯 Resumen

| Aspecto | Solución |
|---------|----------|
| **Extracción IA** | JSON flexible (sin restricciones) |
| **Validación** | Humano revisa/corrige JSON |
| **Almacenamiento** | BD normalizada (ActaEstudiante + ActaNota) |
| **Backup** | JSON original permanece |
| **Consultas** | SQL eficiente sobre tablas normalizadas |
| **Certificados** | Consolidación simple desde tablas |
| **Trazabilidad** | Completa (libro, folio, acta) |

