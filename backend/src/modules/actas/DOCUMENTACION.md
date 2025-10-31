# Módulo de Actas Físicas

## Descripción
Gestión completa del ciclo de vida de actas físicas (1985-2012): subida, búsqueda, procesamiento OCR y exportación.

## Endpoints

### POST /api/actas
Subir acta con archivo (PDF/imagen) y metadata.

**Permisos:** ACTAS_EDITAR (EDITOR)

**Body (multipart/form-data):**
- `archivo`: File (PDF/JPG/JPEG/PNG, max 10MB)
- `numero`: string
- `tipo`: CONSOLIDADO | TRASLADO | SUBSANACION | RECUPERACION
- `anioLectivoId`: UUID
- `gradoId`: UUID
- Campos opcionales: seccion, turno, fechaEmision, libro, folio, etc.

### GET /api/actas
Listar actas con filtros y paginación.

**Permisos:** ACTAS_VER

**Query params:**
- `estado`: DISPONIBLE | ASIGNADA_BUSQUEDA | ENCONTRADA | NO_ENCONTRADA
- `anioLectivoId`: UUID
- `gradoId`: UUID
- `procesado`: boolean
- `page`: number (default: 1)
- `limit`: number (default: 20)

### GET /api/actas/:id
Obtener acta por ID con todas las relaciones.

**Permisos:** ACTAS_VER

### PUT /api/actas/:id/metadata
Actualizar metadata de acta (no modifica archivo).

**Permisos:** ACTAS_EDITAR

### POST /api/actas/:id/asignar-solicitud
Vincular acta a solicitud (cambia estado a ASIGNADA_BUSQUEDA).

**Permisos:** ACTAS_EDITAR

**Body:**
```json
{
  "solicitudId": "uuid"
}
```

### POST /api/actas/:id/marcar-encontrada
Marcar acta como encontrada físicamente.

**Permisos:** ACTAS_EDITAR

**Body:**
```json
{
  "observaciones": "Encontrada en archivo..."
}
```

### POST /api/actas/:id/marcar-no-encontrada
Marcar acta como no encontrada.

**Permisos:** ACTAS_EDITAR

### ⭐ POST /api/actas/:id/procesar-ocr
**CRÍTICO**: Procesar datos de OCR y crear certificados automáticamente.

**Permisos:** ACTAS_PROCESAR

**Body:**
```json
{
  "estudiantes": [
    {
      "numero": 1,
      "dni": "12345678",
      "apellidoPaterno": "GOMEZ",
      "apellidoMaterno": "LOPEZ",
      "nombres": "JUAN CARLOS",
      "sexo": "M",
      "fechaNacimiento": "2000-05-15",
      "notas": {
        "MAT": 14,
        "COM": 15
      },
      "situacionFinal": "APROBADO"
    }
  ]
}
```

**Proceso:**
1. Obtiene plantilla de currículo (año/grado)
2. Busca o crea estudiantes
3. Crea certificados en estado BORRADOR
4. Crea certificadoDetalle y certificadoNota por cada estudiante

### POST /api/actas/:id/validar-manual
Validar manualmente datos procesados.

**Permisos:** ACTAS_EDITAR

### GET /api/actas/:id/exportar-excel
Exportar acta a archivo Excel.

**Permisos:** ACTAS_VER

**Response:** Archivo .xlsx

## Estados

```
DISPONIBLE (inicial)
  ↓ asignarSolicitud()
ASIGNADA_BUSQUEDA
  ↓ marcarEncontrada()    ↓ marcarNoEncontrada()
ENCONTRADA              NO_ENCONTRADA
  ↓ procesarOCR()
(Certificados creados)
```

## Integración con Sistema

- **Sprint 5 (Académico):** Usa `curriculoGradoService.getPlantillaByAnioGrado()` para OCR
- **Sprint 7 (Solicitudes):** Campo `solicitud_id` para vincular
- **Sprint 9 (Certificados):** Crea certificados automáticamente desde OCR

## Dependencias
- ExcelJS: Exportación a Excel
- Multer: Subida de archivos
- crypto: Hash SHA-256 de archivos

