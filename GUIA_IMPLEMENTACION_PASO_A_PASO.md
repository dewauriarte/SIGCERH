# 📋 Guía de Implementación: Normalización de Actas

## ✅ Checklist General

- [ ] Paso 1: Actualizar Schema Prisma
- [ ] Paso 2: Ejecutar Migraciones
- [ ] Paso 3: Integrar Servicio de Normalización
- [ ] Paso 4: Crear Endpoints API
- [ ] Paso 5: Probar Funcionalidad
- [ ] Paso 6: Integrar con Frontend (futuro)

---

## 🚀 Paso 1: Actualizar Schema Prisma

### 1.1 Abrir archivo schema.prisma
```bash
cd backend/prisma
code schema.prisma
```

### 1.2 Agregar nuevos modelos al final del archivo

```prisma
// ====================================================
// NORMALIZACIÓN DE ACTAS FÍSICAS
// ====================================================

model ActaEstudiante {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  acta_id         String   @db.Uuid
  estudiante_id   String   @db.Uuid
  numero_orden    Int
  situacion_final String?  @db.VarChar(50)
  observaciones   String?
  fecha_registro  DateTime @default(now()) @db.Timestamptz(6)

  actafisica      ActaFisica @relation(fields: [acta_id], references: [id], onDelete: Cascade)
  estudiante      Estudiante @relation(fields: [estudiante_id], references: [id], onDelete: Cascade)
  notas           ActaNota[]

  @@unique([acta_id, estudiante_id])
  @@unique([acta_id, numero_orden])
  @@index([acta_id])
  @@index([estudiante_id])
  @@map("actaestudiante")
}

model ActaNota {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  acta_estudiante_id String   @db.Uuid
  area_id            String   @db.Uuid
  nota               Int?     @db.Integer
  nota_literal       String?  @db.VarChar(50)
  es_exonerado       Boolean  @default(false)
  nombre_area_ocr    String?  @db.VarChar(150)
  confianza_ocr      Decimal? @db.Decimal(5, 2)
  orden              Int
  fecha_registro     DateTime @default(now()) @db.Timestamptz(6)

  actaEstudiante     ActaEstudiante @relation(fields: [acta_estudiante_id], references: [id], onDelete: Cascade)
  areaCurricular     AreaCurricular @relation(fields: [area_id], references: [id], onDelete: Restrict)

  @@unique([acta_estudiante_id, area_id])
  @@index([acta_estudiante_id])
  @@index([area_id])
  @@map("actanota")
}
```

### 1.3 Actualizar modelo ActaFisica EXISTENTE

Buscar el modelo `actafisica` y agregar:

```prisma
model actafisica {
  // ... campos existentes ...

  // ✅ AGREGAR estos campos nuevos:
  normalizada         Boolean?  @default(false)
  fecha_normalizacion DateTime? @db.Timestamptz(6)

  // ✅ AGREGAR esta relación:
  estudiantes         ActaEstudiante[]

  // ... resto de campos existentes ...

  // ✅ AGREGAR estos índices:
  @@index([normalizada])
  @@index([procesadoconia, normalizada])
}
```

### 1.4 Actualizar modelo Estudiante EXISTENTE

Buscar el modelo `estudiante` y agregar:

```prisma
model estudiante {
  // ... campos existentes ...

  // ✅ AGREGAR esta relación:
  actas_normalizadas  ActaEstudiante[]

  // ... resto de campos existentes ...
}
```

### 1.5 Actualizar modelo AreaCurricular EXISTENTE

Buscar el modelo `areacurricular` y agregar:

```prisma
model areacurricular {
  // ... campos existentes ...

  // ✅ AGREGAR esta relación:
  notasActas          ActaNota[]

  // ... resto de campos existentes ...
}
```

---

## 🗄️ Paso 2: Ejecutar Migraciones

### 2.1 Generar migración Prisma
```bash
cd backend
npx prisma migrate dev --name add_acta_normalizacion
```

Esto creará:
- Nueva migración en `prisma/migrations/`
- Actualizará el cliente Prisma

### 2.2 Ejecutar SQL adicional (funciones y vistas)

**Opción A: Con psql (recomendado)**
```bash
psql -U postgres -d certificados_db -f prisma/migrations/add_acta_normalizacion.sql
```

**Opción B: Desde pgAdmin**
1. Abrir pgAdmin
2. Conectar a base de datos `certificados_db`
3. Abrir Query Tool
4. Copiar contenido de `add_acta_normalizacion.sql`
5. Ejecutar

### 2.3 Generar cliente Prisma
```bash
npx prisma generate
```

### 2.4 Verificar migraciones
```bash
npx prisma db pull
npx prisma validate
```

Si todo está bien, verás:
```
✓ Prisma schema loaded from prisma/schema.prisma
✓ Schema validation successful
```

---

## 🔧 Paso 3: Integrar Servicio de Normalización

### 3.1 Verificar archivos creados

Asegúrate de tener estos archivos:
```
backend/src/modules/actas/
├── normalizacion.types.ts       ✅ (ya creado)
├── normalizacion.service.ts     ✅ (ya creado)
├── normalizacion.controller.ts  ⬜ (crear en paso 4)
└── normalizacion.routes.ts      ⬜ (crear en paso 4)
```

### 3.2 Actualizar index.ts del módulo actas

Editar: `backend/src/modules/actas/index.ts`

```typescript
export * from './actas-fisicas.service';
export * from './actas-fisicas.controller';
export * from './actas-fisicas.routes';

// ✅ AGREGAR:
export * from './normalizacion.types';
export * from './normalizacion.service';
export * from './normalizacion.controller';
export * from './normalizacion.routes';

export * from './types';
export * from './dtos';
```

---

## 🌐 Paso 4: Crear Endpoints API

### 4.1 Crear controlador

Crear archivo: `backend/src/modules/actas/normalizacion.controller.ts`

```typescript
import { Request, Response } from 'express';
import { normalizacionService } from './normalizacion.service';
import { logger } from '@config/logger';

export class NormalizacionController {
  /**
   * POST /actas/:id/validar
   * Valida datos OCR antes de normalizar
   */
  async validarDatosOCR(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const validacion = await normalizacionService.validarDatosOCR(id);

      return res.status(200).json({
        success: true,
        data: validacion
      });
    } catch (error: any) {
      logger.error('Error al validar datos OCR', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /actas/:id/normalizar
   * Normaliza acta (JSON → BD)
   */
  async normalizarActa(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { usuarioId } = req.body;

      const resultado = await normalizacionService.normalizarActa(id, usuarioId);

      return res.status(200).json({
        success: true,
        data: resultado
      });
    } catch (error: any) {
      logger.error('Error al normalizar acta', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /estudiantes/:id/actas
   * Obtiene todas las actas de un estudiante
   */
  async getActasDeEstudiante(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const actas = await normalizacionService.getActasDeEstudiante(id);

      return res.status(200).json({
        success: true,
        data: actas
      });
    } catch (error: any) {
      logger.error('Error al obtener actas del estudiante', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /estudiantes/:id/notas-consolidadas
   * Consolida notas para certificado
   */
  async consolidarNotasParaCertificado(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const consolidado = await normalizacionService
        .consolidarNotasParaCertificado(id);

      return res.status(200).json({
        success: true,
        data: consolidado
      });
    } catch (error: any) {
      logger.error('Error al consolidar notas', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const normalizacionController = new NormalizacionController();
```

### 4.2 Crear rutas

Crear archivo: `backend/src/modules/actas/normalizacion.routes.ts`

```typescript
import { Router } from 'express';
import { normalizacionController } from './normalizacion.controller';
import { authenticateToken } from '@middleware/auth.middleware';
import { authorize } from '@middleware/authorization.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /actas/:id/validar - Validar datos OCR
router.post(
  '/:id/validar',
  authorize(['ADMIN', 'MESA_PARTES', 'EDITOR']),
  normalizacionController.validarDatosOCR
);

// POST /actas/:id/normalizar - Normalizar acta
router.post(
  '/:id/normalizar',
  authorize(['ADMIN', 'MESA_PARTES']),
  normalizacionController.normalizarActa
);

// GET /estudiantes/:id/actas - Actas de un estudiante
router.get(
  '/estudiantes/:id/actas',
  authorize(['ADMIN', 'MESA_PARTES', 'EDITOR']),
  normalizacionController.getActasDeEstudiante
);

// GET /estudiantes/:id/notas-consolidadas - Consolidado para certificado
router.get(
  '/estudiantes/:id/notas-consolidadas',
  authorize(['ADMIN', 'MESA_PARTES']),
  normalizacionController.consolidarNotasParaCertificado
);

export default router;
```

### 4.3 Registrar rutas en app.ts

Editar: `backend/src/app.ts`

```typescript
import normalizacionRoutes from '@modules/actas/normalizacion.routes';

// ... otras importaciones ...

// Registrar rutas
app.use('/api/actas', actasRoutes);
app.use('/api/actas', normalizacionRoutes); // ✅ AGREGAR ESTA LÍNEA
app.use('/api/solicitudes', solicitudesRoutes);
// ... otras rutas ...
```

---

## 🧪 Paso 5: Probar Funcionalidad

### 5.1 Crear acta de prueba

**Opción A: Usar datos existentes**
```sql
-- Verificar que exista un acta procesada con OCR
SELECT id, numero, procesadoconia, normalizada
FROM actafisica
WHERE procesadoconia = true AND normalizada = false
LIMIT 1;
```

**Opción B: Crear acta de prueba manual**
```typescript
// En un script de test o usando Postman
const actaTest = await prisma.actafisica.create({
  data: {
    numero: 'TEST-001',
    tipo: 'EVALUACION',
    aniolectivo_id: '...',
    grado_id: '...',
    urlarchivo: 'test.pdf',
    procesadoconia: true,
    datosextraidosjson: {
      estudiantes: [
        {
          numero: 1,
          dni: '12345678',
          apellidoPaterno: 'PEREZ',
          apellidoMaterno: 'GOMEZ',
          nombres: 'JUAN',
          sexo: 'H',
          situacionFinal: 'APROBADO',
          notas: {
            'MATEMATICA': 15,
            'COMUNICACION': 14,
            'CIENCIA Y TECNOLOGIA': 16
          }
        }
      ],
      metadata: {
        total_estudiantes: 1,
        confianza_promedio: 95,
        areas_detectadas: ['MATEMATICA', 'COMUNICACION', 'CIENCIA Y TECNOLOGIA']
      }
    }
  }
});
```

### 5.2 Probar endpoints con cURL o Postman

#### Test 1: Validar datos OCR
```bash
curl -X POST http://localhost:5000/api/actas/{actaId}/validar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Respuesta esperada:
```json
{
  "success": true,
  "data": {
    "valido": true,
    "errores": [],
    "advertencias": [],
    "estadisticas": {
      "total_estudiantes": 1,
      "estudiantes_con_dni": 1,
      "total_notas": 3,
      "areas_mapeadas": 3
    }
  }
}
```

#### Test 2: Normalizar acta
```bash
curl -X POST http://localhost:5000/api/actas/{actaId}/normalizar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"usuarioId": "user-id"}'
```

Respuesta esperada:
```json
{
  "success": true,
  "data": {
    "success": true,
    "mensaje": "Normalización exitosa: 1 estudiantes procesados",
    "estadisticas": {
      "estudiantes_procesados": 1,
      "estudiantes_creados": 0,
      "estudiantes_existentes": 1,
      "vinculos_creados": 1,
      "notas_creadas": 3,
      "tiempo_procesamiento_ms": 250
    }
  }
}
```

#### Test 3: Consultar actas de estudiante
```bash
curl http://localhost:5000/api/actas/estudiantes/{estudianteId}/actas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test 4: Consolidar notas
```bash
curl http://localhost:5000/api/actas/estudiantes/{estudianteId}/notas-consolidadas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5.3 Verificar en base de datos

```sql
-- Verificar que se crearon los registros
SELECT * FROM actaestudiante LIMIT 10;
SELECT * FROM actanota LIMIT 10;

-- Verificar acta normalizada
SELECT id, numero, normalizada, fecha_normalizacion
FROM actafisica
WHERE normalizada = true;

-- Ver estudiantes de una acta
SELECT
  e.dni,
  e.nombres,
  e.apellidopaterno,
  ae.numero_orden,
  ae.situacion_final
FROM actaestudiante ae
JOIN estudiante e ON ae.estudiante_id = e.id
WHERE ae.acta_id = 'acta-id';

-- Ver notas de un estudiante en una acta
SELECT
  ac.nombre AS area,
  an.nota,
  an.nombre_area_ocr,
  an.confianza_ocr
FROM actanota an
JOIN actaestudiante ae ON an.acta_estudiante_id = ae.id
JOIN areacurricular ac ON an.area_id = ac.id
WHERE ae.id = 'actaestudiante-id';
```

---

## ✅ Paso 6: Integración con Frontend (Futuro)

### 6.1 Endpoints disponibles

```typescript
// API endpoints listos para consumir:

// 1. Validar datos OCR
POST /api/actas/:id/validar

// 2. Normalizar acta
POST /api/actas/:id/normalizar

// 3. Ver actas de un estudiante
GET /api/actas/estudiantes/:id/actas

// 4. Consolidado para certificado
GET /api/actas/estudiantes/:id/notas-consolidadas
```

### 6.2 Pantallas a implementar

1. **Validación de JSON extraído**
   - Mostrar JSON en tabla editable
   - Marcar errores/advertencias
   - Permitir correcciones manuales
   - Botón "Normalizar"

2. **Vista de actas por estudiante**
   - Tabla con todas las actas
   - Filtros por año, grado
   - Ver notas por acta

3. **Consolidado para certificado**
   - Vista previa del certificado
   - Agrupado por año/grado
   - Cálculo de promedios

---

## 🐛 Troubleshooting

### Error: "Prisma model not found"
```bash
npx prisma generate
npm run dev
```

### Error: "Column does not exist"
```bash
# Verificar que la migración se ejecutó
npx prisma migrate status

# Si falta migración:
npx prisma migrate deploy
```

### Error: "Área no encontrada"
Asegúrate de tener áreas curriculares creadas:
```sql
INSERT INTO areacurricular (codigo, nombre, orden, activo)
VALUES
  ('MAT', 'MATEMATICA', 1, true),
  ('COM', 'COMUNICACION', 2, true),
  ('CTA', 'CIENCIA Y TECNOLOGIA', 3, true);
```

### Error: "Estudiante duplicado"
Verificar configuración de estrategia de duplicados:
```typescript
const normalizacionService = new NormalizacionService({
  estrategia_duplicados: 'saltar' // o 'actualizar'
});
```

---

## 📚 Recursos

- **Documentación completa**: `PLAN_NORMALIZACION_ACTAS.md`
- **Resumen visual**: `RESUMEN_NORMALIZACION_ACTAS.md`
- **Migraciones SQL**: `backend/prisma/migrations/add_acta_normalizacion.sql`
- **Schema Prisma**: `backend/prisma/schema_actas_normalizacion.prisma`
- **Servicio**: `backend/src/modules/actas/normalizacion.service.ts`
- **Types**: `backend/src/modules/actas/normalizacion.types.ts`

---

## 🎉 Resultado Final

Al completar todos los pasos tendrás:

✅ Base de datos con tablas normalizadas
✅ API funcional con 4 endpoints
✅ Servicio de normalización completo
✅ Validación y mapeo inteligente de áreas
✅ Consultas SQL optimizadas
✅ Consolidación automática para certificados
✅ JSON original como backup

**¡Sistema listo para producción!** 🚀
