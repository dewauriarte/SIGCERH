# 🎯 SPRINT 06: MÓDULO ACTAS FÍSICAS & OCR

> **Módulo**: Backend - Actas  
> **Duración**: 5-6 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ✅ COMPLETADO

---

## 📌 Objetivo

Gestión completa de actas físicas: subida, metadata, estados de búsqueda, procesamiento OCR, validación manual y exportación.

---

## 🎯 Metas del Sprint

- [x] Subida de actas escaneadas (PDF/imagen)
- [x] Estados de búsqueda (DISPONIBLE, ASIGNADA_BUSQUEDA, ENCONTRADA, NO_ENCONTRADA)
- [x] Registro de metadata del acta
- [x] Asignación de acta a solicitud
- [x] Endpoint para recibir datos procesados por OCR
- [x] Validación manual contra acta física
- [x] Exportación a Excel
- [x] Tests >80% coverage

---

## 📊 Tabla Involucrada (1)

- [x] ActaFisica ⭐⭐ (con 20+ campos)

---

## ✅ Tareas Principales

### 🟦 FASE 1: Subida de Archivos (4h)
- [x] Middleware de Multer configurado
- [x] Validar formatos (PDF, JPG, PNG)
- [x] Validar tamaño máximo (10MB)
- [x] Almacenar en /storage/actas/
- [x] Generar hash del archivo

### 🟦 FASE 2: ActaFisicaService (8h)
- [x] create() - Subir acta con metadata
- [x] findAll() con filtros
- [x] findById()
- [x] update() - Actualizar metadata
- [x] asignarSolicitud()
- [x] marcarEncontrada()
- [x] marcarNoEncontrada()
- [x] recibirDatosOCR()
- [x] validarManualmente()
- [x] exportarExcel()
- [x] compararOCRconFisica()
- [x] validarConCorrecciones()

### 🟦 FASE 3: Estados y Workflow (4h)
- [x] Implementar máquina de estados
- [x] Transiciones válidas entre estados
- [x] Validaciones de negocio por estado

### 🟦 FASE 4: Metadata del Acta (3h)
- [x] Formulario de metadata:
  - [x] Año lectivo
  - [x] Grado
  - [x] Sección
  - [x] Turno
  - [x] Tipo de evaluación
  - [x] Colegio origen
  - [x] Ubicación física
- [x] DTOs con Zod

### 🟦 FASE 5: Procesamiento OCR (6h)
- [x] Endpoint POST /api/actas/:id/procesar-ocr
- [x] Recibir JSON con estudiantes extraídos
- [x] Guardar en campo datosExtraidosJSON
- [x] Crear registros en:
  - [x] Estudiante (si no existe)
  - [x] Certificado
  - [x] CertificadoDetalle
  - [x] CertificadoNota (usando plantilla de currículo)

### 🟦 FASE 6: Validación Manual (3h)
- [x] Endpoint POST /api/actas/:id/validar-manual
- [x] Comparar datos OCR vs acta física
- [x] Registrar observaciones del Editor
- [x] Marcar como validada
- [x] Endpoint GET /api/actas/:id/comparar-ocr (comparación visual)
- [x] Endpoint POST /api/actas/:id/validar-con-correcciones
- [x] Aplicar correcciones a estudiantes antes de aprobar

### 🟦 FASE 7: Exportación Excel (3h)
- [x] Librería ExcelJS
- [x] Generar Excel con datos del acta
- [x] Incluir todos los estudiantes
- [x] Descargar archivo

### 🟦 FASE 8: Controllers y Routes (3h)
- [x] ActasFisicasController
- [x] Proteger rutas por rol (EDITOR, ADMIN)
- [x] Upload middleware en ruta de subida

### 🟦 FASE 9: Testing (5h)
- [x] Unit tests
- [x] Integration tests con mock de archivos
- [x] Test de estados
- [x] Test de procesamiento OCR

### 🟦 FASE 10: Documentación (2h)
- [x] Guía de procesamiento OCR

---

## 📋 Endpoints

```
POST   /api/actas (subir acta con metadata)
GET    /api/actas
GET    /api/actas/:id
PUT    /api/actas/:id/metadata
POST   /api/actas/:id/asignar-solicitud
POST   /api/actas/:id/marcar-encontrada
POST   /api/actas/:id/marcar-no-encontrada
POST   /api/actas/:id/procesar-ocr ⭐ CRÍTICO
POST   /api/actas/:id/validar-manual
GET    /api/actas/:id/exportar-excel
```

---

## 🎯 Endpoint CRÍTICO

**POST /api/actas/:id/procesar-ocr**

Recibe JSON del módulo OCR con estudiantes extraídos.

Body esperado:
```json
{
  "estudiantes": [
    {
      "numero": 1,
      "nombreCompleto": "APELLIDOS, Nombres",
      "sexo": "H",
      "notas": [13, 14, 15, ...],
      "comportamiento": 16,
      "asignaturasDesaprobadas": 1,
      "situacionFinal": "A"
    },
    ...
  ]
}
```

Este endpoint crea automáticamente:
- Estudiantes (si no existen)
- Certificados con detalles y notas

---

## 🧪 Criterios de Aceptación

- [x] Actas se suben correctamente
- [x] Metadata se guarda
- [x] Estados funcionan correctamente
- [x] Asignación a solicitud funciona
- [x] Procesamiento OCR crea certificados automáticamente
- [x] Validación manual funciona
- [x] Excel se genera correctamente
- [x] Tests >80% coverage

---

## ⚠️ Dependencias

- Sprint 05 - Módulo académico (CurriculoGrado)

---

**🔗 Siguiente**: [SPRINT_07_MODULO_SOLICITUDES.md](./SPRINT_07_MODULO_SOLICITUDES.md)

