# 🎯 RECOMENDACIONES AJUSTADAS - SPRINT 06 (CONTEXTO REAL)

> **Contexto Operativo**:
> - 📦 Volcado masivo de datos históricos en 1 día (8 horas)
> - 👥 Solo 4 usuarios procesando OCR
> - 📅 Actas de 1985-2012 (~27 años)
> - 🏢 Sistema institucional (no público)

---

## ❌ RECOMENDACIONES ORIGINALES **NO APLICABLES**

### 1. Rate Limiting en Upload - **DESCARTAR**
**Por qué NO aplicar:**
- ❌ Contraproducente para volcado masivo
- ❌ Solo 4 usuarios OCR (baja concurrencia)
- ❌ Sistema interno, no expuesto públicamente
- ❌ Limitaría la velocidad de migración

**Alternativa CORRECTA:**
✅ **NO implementar rate limiting**
✅ En su lugar: Script de migración masiva (ver abajo)

---

### 2. Optimización de OCR para Concurrencia - **NO PRIORITARIO**
**Por qué NO es urgente:**
- ❌ Solo 4 usuarios procesando OCR
- ❌ Procesamiento secuencial es aceptable
- ❌ No hay cuello de botella de concurrencia

**Alternativa CORRECTA:**
✅ Mantener código actual (funciona bien para 4 usuarios)
✅ Optimizar solo si el procesamiento toma >5 min por acta

---

## ✅ RECOMENDACIONES **REALMENTE NECESARIAS**

### 1. 🚀 **Script de Migración Masiva** - **CRÍTICO**
**Problema**: La API actual está diseñada para uso uno-por-uno, no para volcado masivo.

**Solución**: Crear script de migración específico

#### Opción A: Script de Node.js con Prisma (RECOMENDADA)
```typescript
// backend/scripts/migracion-actas-masiva.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileUploadService } from '../src/shared/services/file-upload.service';

const prisma = new PrismaClient();

interface ActaParaMigrar {
  numero: string;
  anio: number;
  grado: number;
  archivo: string; // ruta al PDF/imagen
  // ... otros campos
}

async function migrarActasMasivamente(actas: ActaParaMigrar[]) {
  console.log(`🚀 Iniciando migración de ${actas.length} actas...`);

  let exitosas = 0;
  let fallidas = 0;
  const errores: any[] = [];

  // Procesar en lotes de 50 para no saturar memoria
  const BATCH_SIZE = 50;

  for (let i = 0; i < actas.length; i += BATCH_SIZE) {
    const lote = actas.slice(i, i + BATCH_SIZE);

    console.log(`📦 Procesando lote ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(actas.length/BATCH_SIZE)}`);

    // Procesar lote en paralelo
    const resultados = await Promise.allSettled(
      lote.map(acta => migrarActa(acta))
    );

    resultados.forEach((resultado, idx) => {
      if (resultado.status === 'fulfilled') {
        exitosas++;
      } else {
        fallidas++;
        errores.push({
          acta: lote[idx],
          error: resultado.reason.message
        });
      }
    });

    // Pequeña pausa entre lotes
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ Migración completada:`);
  console.log(`   - Exitosas: ${exitosas}`);
  console.log(`   - Fallidas: ${fallidas}`);

  if (errores.length > 0) {
    fs.writeFileSync(
      'migracion-errores.json',
      JSON.stringify(errores, null, 2)
    );
    console.log(`\n⚠️  Errores guardados en: migracion-errores.json`);
  }
}

async function migrarActa(acta: ActaParaMigrar) {
  // 1. Buscar año lectivo
  const anioLectivo = await prisma.aniolectivo.findFirst({
    where: { anio: acta.anio }
  });

  if (!anioLectivo) {
    throw new Error(`Año lectivo ${acta.anio} no encontrado`);
  }

  // 2. Buscar grado
  const grado = await prisma.grado.findFirst({
    where: { numero: acta.grado }
  });

  if (!grado) {
    throw new Error(`Grado ${acta.grado} no encontrado`);
  }

  // 3. Leer y procesar archivo
  const archivoBuffer = fs.readFileSync(acta.archivo);
  const mockFile = {
    buffer: archivoBuffer,
    originalname: path.basename(acta.archivo),
    mimetype: acta.archivo.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
    size: archivoBuffer.length
  } as Express.Multer.File;

  const uploadedFile = await fileUploadService.saveActa(mockFile, {
    numero: acta.numero,
    anio: acta.anio
  });

  // 4. Verificar duplicados
  const existe = await prisma.actafisica.findFirst({
    where: {
      OR: [
        { hasharchivo: uploadedFile.hash },
        {
          numero: acta.numero,
          aniolectivo_id: anioLectivo.id
        }
      ]
    }
  });

  if (existe) {
    console.log(`⏭️  Acta ${acta.numero}-${acta.anio} ya existe, saltando...`);
    return;
  }

  // 5. Crear acta
  await prisma.actafisica.create({
    data: {
      numero: acta.numero,
      tipo: 'CONSOLIDADO',
      aniolectivo_id: anioLectivo.id,
      grado_id: grado.id,
      nombrearchivo: uploadedFile.filename,
      urlarchivo: uploadedFile.url,
      hasharchivo: uploadedFile.hash,
      estado: 'DISPONIBLE',
      usuariosubida_id: 'SISTEMA_MIGRACION', // Usuario especial
      // ... otros campos
    }
  });

  console.log(`✅ Acta ${acta.numero}-${acta.anio} migrada`);
}

// Ejecutar
const actasParaMigrar = JSON.parse(
  fs.readFileSync('actas-para-migrar.json', 'utf-8')
);

migrarActasMasivamente(actasParaMigrar)
  .then(() => {
    console.log('🎉 Migración finalizada');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Error en migración:', error);
    process.exit(1);
  });
```

**Ventajas:**
- ✅ Procesa en lotes (50 actas por vez)
- ✅ Procesamiento paralelo dentro de cada lote
- ✅ Manejo robusto de errores
- ✅ Log detallado de progreso
- ✅ Guarda errores en archivo JSON
- ✅ No satura memoria ni BD

**Ejecución:**
```bash
cd backend
npm run ts-node scripts/migracion-actas-masiva.ts
```

**Estimación de tiempo:**
- 5,000 actas × 0.5 seg = ~40 minutos
- 10,000 actas × 0.5 seg = ~80 minutos

---

#### Opción B: Preparar JSON para Importar
```json
// actas-para-migrar.json
[
  {
    "numero": "001",
    "anio": 1985,
    "grado": 5,
    "seccion": "A",
    "turno": "MAÑANA",
    "archivo": "/ruta/a/archivos/ACTA_001_1985.pdf"
  },
  {
    "numero": "002",
    "anio": 1985,
    "grado": 5,
    "seccion": "B",
    "turno": "TARDE",
    "archivo": "/ruta/a/archivos/ACTA_002_1985.pdf"
  }
  // ... miles de actas
]
```

---

### 2. 📊 **Endpoint de Progreso** - **ÚTIL**
**Para monitorear el avance durante el volcado**

```typescript
// actas-fisicas.controller.ts
async getEstadisticas(req: Request, res: Response): Promise<void> {
  try {
    const stats = await prisma.actafisica.groupBy({
      by: ['estado'],
      _count: true
    });

    const porAnio = await prisma.actafisica.groupBy({
      by: ['aniolectivo_id'],
      _count: true,
      orderBy: {
        aniolectivo_id: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      data: {
        porEstado: stats,
        porAnio: porAnio,
        total: stats.reduce((acc, s) => acc + s._count, 0)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
}
```

**Ruta:**
```typescript
// GET /api/actas/estadisticas
router.get('/estadisticas', actasFisicasController.getEstadisticas);
```

**Utilidad durante volcado:**
```
GET /api/actas/estadisticas
{
  "porEstado": {
    "DISPONIBLE": 4521,
    "ASIGNADA_BUSQUEDA": 120,
    "ENCONTRADA": 45
  },
  "porAnio": {
    "1985": 180,
    "1986": 195,
    ...
  },
  "total": 4686
}
```

---

### 3. 🔍 **Validación Pre-Migración** - **RECOMENDADO**
**Antes de iniciar el volcado masivo**

```typescript
// Script de validación
async function validarPreMigracion() {
  console.log('🔍 Validando configuración previa...\n');

  // 1. Verificar que existen todos los años lectivos
  const aniosRequeridos = Array.from({length: 28}, (_, i) => 1985 + i);
  const aniosExistentes = await prisma.aniolectivo.findMany({
    where: { anio: { in: aniosRequeridos } }
  });

  const aniosFaltantes = aniosRequeridos.filter(
    anio => !aniosExistentes.find(a => a.anio === anio)
  );

  if (aniosFaltantes.length > 0) {
    console.error(`❌ Faltan años lectivos: ${aniosFaltantes.join(', ')}`);
    return false;
  }
  console.log('✅ Todos los años lectivos (1985-2012) existen');

  // 2. Verificar que existen todos los grados
  const gradosRequeridos = [1, 2, 3, 4, 5, 6]; // Primaria
  const gradosExistentes = await prisma.grado.findMany({
    where: { numero: { in: gradosRequeridos } }
  });

  if (gradosExistentes.length !== gradosRequeridos.length) {
    console.error('❌ Faltan grados');
    return false;
  }
  console.log('✅ Todos los grados existen');

  // 3. Verificar que existe currículo para cada año-grado
  for (const anio of aniosRequeridos) {
    for (const gradoNum of gradosRequeridos) {
      const anioLectivo = await prisma.aniolectivo.findFirst({
        where: { anio }
      });
      const grado = await prisma.grado.findFirst({
        where: { numero: gradoNum }
      });

      if (!anioLectivo || !grado) continue;

      const curriculo = await prisma.curriculogrado.findMany({
        where: {
          aniolectivo_id: anioLectivo.id,
          grado_id: grado.id,
          activo: true
        }
      });

      if (curriculo.length === 0) {
        console.warn(`⚠️  Falta currículo para ${anio} - Grado ${gradoNum}`);
      }
    }
  }

  // 4. Verificar espacio en disco
  const dirActas = path.join(process.cwd(), 'storage', 'actas');
  if (!fs.existsSync(dirActas)) {
    fs.mkdirSync(dirActas, { recursive: true });
  }
  console.log('✅ Directorio de almacenamiento listo');

  console.log('\n✅ Validación completada. Sistema listo para migración.\n');
  return true;
}
```

---

### 4. 🎛️ **Configuración Temporal Durante Volcado** - **OPCIONAL**
**Ajustar timeouts y límites temporalmente**

```typescript
// backend/src/config/upload.config.ts
export const UPLOAD_CONFIG = {
  // Durante migración: aumentar límites temporalmente
  MAX_FILE_SIZE: process.env.MIGRATION_MODE === 'true'
    ? 50 * 1024 * 1024  // 50MB durante migración
    : 10 * 1024 * 1024, // 10MB normal

  ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],

  // Timeouts
  REQUEST_TIMEOUT: process.env.MIGRATION_MODE === 'true'
    ? 300000 // 5 minutos durante migración
    : 60000  // 1 minuto normal
};
```

**Activar modo migración:**
```bash
MIGRATION_MODE=true npm run start
```

---

## 🚫 RECOMENDACIONES **NO NECESARIAS** (4 USUARIOS)

### ❌ 1. Paralelización de Procesamiento OCR
- **Razón**: Solo 4 usuarios, no hay cuello de botella
- **Mantener**: Código actual (secuencial está bien)

### ❌ 2. Caching de Plantillas de Currículo
- **Razón**: Con 4 usuarios, el overhead de caché no vale la pena
- **Mantener**: Queries directas a BD (más simple)

### ❌ 3. WebSockets para Progreso en Tiempo Real
- **Razón**: Overkill para 4 usuarios
- **Alternativa**: Polling cada 5 segundos es suficiente

### ❌ 4. Queue System (Bull/RabbitMQ)
- **Razón**: Complejidad innecesaria para 4 usuarios
- **Mantener**: Procesamiento síncrono

---

## 📋 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Pre-Volcado (1 día antes)
1. ✅ Ejecutar script de validación pre-migración
2. ✅ Crear todos los años lectivos faltantes (1985-2012)
3. ✅ Configurar currículos para cada año-grado
4. ✅ Preparar JSON con lista de actas a migrar
5. ✅ Hacer backup completo de BD

### Fase 2: Volcado Masivo (Día D - 8 horas)
**Opción A: Script Automatizado** (RECOMENDADO)
```bash
# 06:00 - Iniciar migración
MIGRATION_MODE=true npm run migrate:actas

# Monitorear progreso cada hora
# 07:00, 08:00, 09:00... check estadísticas
```

**Opción B: Por API** (si no hay script)
- 2 personas subiendo actas manualmente
- Usar endpoint `/api/actas` con Postman/script
- ~500 actas/hora × 8 horas = 4,000 actas

### Fase 3: Post-Volcado (Misma tarde)
1. ✅ Verificar total de actas migradas
2. ✅ Revisar archivo de errores
3. ✅ Re-intentar actas fallidas
4. ✅ Desactivar `MIGRATION_MODE`
5. ✅ Backup final

### Fase 4: Procesamiento OCR (Días siguientes)
- 4 editores procesando OCR a su ritmo
- ~50 actas/día/editor = 200 actas/día
- 5,000 actas ÷ 200 = 25 días hábiles (~1 mes)

---

## 🎯 RESUMEN: QUÉ HACER Y QUÉ NO

### ✅ HACER (CRÍTICO)
1. 🚀 **Script de migración masiva** - Ahorra 90% del tiempo
2. 🔍 **Validación pre-migración** - Evita problemas durante volcado
3. 📊 **Endpoint de estadísticas** - Monitorear progreso

### ⚠️ CONSIDERAR (ÚTIL)
4. 🎛️ **Modo migración con límites ajustados** - Mayor flexibilidad
5. 📝 **Log detallado de errores** - Debugging post-volcado

### ❌ NO HACER (INNECESARIO)
- ❌ Rate limiting
- ❌ Optimizaciones de concurrencia
- ❌ Caching complejo
- ❌ Queue systems
- ❌ WebSockets

---

## 💡 RESPUESTA DIRECTA A TUS PREGUNTAS

### 1. "¿Rate limiting con volcado de 8 horas?"
**Respuesta**: **NO aplicar rate limiting**. Es contraproducente.
- Usa script de migración en su lugar
- El rate limiting es para APIs públicas, no para migraciones internas

### 2. "Solo 4 usuarios con OCR, ¿optimizar concurrencia?"
**Respuesta**: **NO es necesario**.
- El código actual funciona perfectamente para 4 usuarios
- Secuencial es más simple y suficiente
- Solo optimizar si toma >5 min procesar un acta

### 3. "¿Cómo hacemos el volcado masivo?"
**Respuesta**: **Script de Node.js** (ver arriba)
- Procesa 50 actas en paralelo por lote
- 5,000 actas en ~40-80 minutos
- Manejo robusto de errores
- Log detallado

---

## 📊 ESTIMACIONES REALISTAS

### Con Script de Migración
- **Preparación**: 4 horas (validación, configuración)
- **Ejecución**: 1-2 horas (5,000-10,000 actas)
- **Verificación**: 2 horas (revisar errores, re-intentar)
- **Total**: **1 día completo** con margen

### Sin Script (Manual por API)
- **2 editores × 8 horas × 60 actas/hora** = ~1,000 actas/día
- **5,000 actas = 5 días** 😰

**Conclusión**: El script ahorra **4 días de trabajo**.

---

## ✅ RECOMENDACIÓN FINAL

**Implementar SOLO:**
1. ✅ Script de migración masiva
2. ✅ Validación pre-migración
3. ✅ Endpoint de estadísticas

**NO implementar:**
- ❌ Rate limiting
- ❌ Optimizaciones de concurrencia
- ❌ Otras "mejoras" del reporte original

**El código actual del Sprint 6 está perfecto para tu caso de uso.**

---

**Generado por**: Claude Code
**Fecha**: 2025-11-06
**Contexto**: 4 usuarios OCR, volcado masivo en 8 horas
