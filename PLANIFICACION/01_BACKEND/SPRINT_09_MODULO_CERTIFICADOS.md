# 🎯 SPRINT 09: MÓDULO CERTIFICADOS

> **Módulo**: Backend - Certificados  
> **Duración**: 6-7 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: 🔄 En progreso (Fases 1-8 completadas)

---

## 📌 Objetivo

Generación de certificados, creación de PDF con diseño oficial, generación de código QR, código virtual de verificación, firmas digitales/manuscritas y sistema de verificación pública.

---

## 🎯 Metas del Sprint

- [x] Generación de estructura de certificado
- [x] Consolidación de notas por año
- [x] Generación de PDF con diseño oficial
- [x] Código QR con enlace de verificación
- [x] Código virtual (7 dígitos)
- [x] Firma digital (preparado)
- [x] Firma manuscrita (marcado)
- [x] Sistema de verificación pública
- [x] Anulación y rectificación de certificados
- [ ] Tests >80% coverage

---

## 📊 Tablas Involucradas (4)

- [x] Certificado (PDF, QR, firmas)
- [x] CertificadoDetalle (por año/grado)
- [x] CertificadoNota (notas por área)
- [x] Verificacion (log de verificaciones)

---

## ✅ Tareas Principales

### 🟦 FASE 1: CertificadoService (8h) ✅
- [x] create() - Crear certificado vacío
- [x] consolidarNotas() - Agrupar por año
- [x] calcularPromedioGeneral()
- [x] generarCodigoVirtual()
- [x] findById()
- [x] findByCodigoVirtual()
- [x] anular()
- [x] rectificar()

### 🟦 FASE 2: Generación de PDF (10h) ✅
- [x] PDFService con PDFKit
- [x] Plantilla de diseño oficial
- [x] Header con logo y datos de institución
- [x] Tabla de notas por año
- [x] Footer con códigos (QR + virtual)
- [x] Espacio para firma (digital o manuscrita)
- [x] Guardar en /storage/certificados/
- [x] Generar hash del PDF

### 🟦 FASE 3: Código QR (4h) ✅
- [x] QRService con librería qrcode
- [x] Generar QR con URL de verificación
- [x] URL: https://verificar.ugel[XX].gob.pe/?qr=[HASH]
- [x] Incrustar QR en PDF

### 🟦 FASE 4: Código Virtual (3h) ✅
- [x] Generar código único de 7 dígitos
- [x] Validar unicidad
- [x] Almacenar en BD

### 🟦 FASE 5: Firmas (6h) ✅
- [x] Firma Digital:
  - [x] Integración con certificado digital (preparado)
  - [x] Firmar PDF digitalmente
  - [x] Validar firma
- [x] Firma Manuscrita:
  - [x] Marcar certificado como "requiere firma manuscrita"
  - [x] Generar PDF para impresión
  - [x] Endpoint para subir versión escaneada firmada

### 🟦 FASE 6: Verificación Pública (5h) ✅
- [x] Endpoint público (sin auth): GET /api/verificar/:codigoVirtual
- [x] Endpoint público: GET /api/verificar/qr/:hash
- [x] Mostrar datos del certificado
- [x] Validar estado (VÁLIDO, ANULADO)
- [x] Registrar verificación en tabla Verificacion

### 🟦 FASE 7: Anulación y Rectificación (4h) ✅
- [x] anularCertificado()
  - [x] Cambiar estado a ANULADO
  - [x] Registrar motivo
  - [x] Auditoría
- [x] rectificarCertificado()
  - [x] Crear nueva versión
  - [x] Vincular con anterior
  - [x] Anular anterior automáticamente

### 🟦 FASE 8: Controllers y Routes (4h) ✅
- [x] CertificadosController
- [x] VerificacionController (público)
- [x] Proteger rutas internas

### 🟦 FASE 9: Testing (6h)
- [ ] Unit tests de servicios
- [ ] Integration tests
- [ ] Test de generación PDF
- [ ] Test de código QR
- [ ] Test de verificación pública

### 🟦 FASE 10: Documentación (2h)
- [ ] Documentar endpoints
- [ ] Guía de verificación

---

## 📋 Endpoints

```
# Generación (Editor/Sistema - interno)
POST   /api/certificados/generar
GET    /api/certificados/:id
POST   /api/certificados/:id/generar-pdf

# Firmas (Dirección)
POST   /api/certificados/:id/firmar-digitalmente
POST   /api/certificados/:id/marcar-firma-manuscrita
POST   /api/certificados/:id/subir-firmado

# Gestión (Admin)
POST   /api/certificados/:id/anular
POST   /api/certificados/:id/rectificar

# Usuario Final
GET    /api/certificados/:id/descargar

# Verificación Pública (SIN AUTH) ⭐
GET    /api/verificar/:codigoVirtual
GET    /api/verificar/qr/:hash
```

---

## 🎯 Estructura del PDF

```
┌─────────────────────────────────────────┐
│ [LOGO]    UGEL XX                  [QR] │
│           Certificado de Estudios       │
├─────────────────────────────────────────┤
│ Datos del Estudiante:                   │
│ - DNI: 12345678                         │
│ - Nombres: APELLIDOS, Nombres          │
│ - Fecha Nacimiento: 01/01/1995          │
├─────────────────────────────────────────┤
│ Institución Educativa:                  │
│ - Colegio XYZ (Código: 123456)         │
├─────────────────────────────────────────┤
│ Notas por Año:                          │
│                                         │
│ 1° Secundaria - 1995                    │
│ ┌────────────────────┬──────┐          │
│ │ Área Curricular    │ Nota │          │
│ ├────────────────────┼──────┤          │
│ │ Matemática         │  15  │          │
│ │ Comunicación       │  16  │          │
│ │ ...                │  ... │          │
│ └────────────────────┴──────┘          │
│                                         │
│ (Repetir para cada año)                │
├─────────────────────────────────────────┤
│ Promedio General: 15.5                  │
│ Situación Final: APROBADO               │
├─────────────────────────────────────────┤
│ Código de Verificación: ABC1234         │
│                                         │
│ ___________________                     │
│ Firma del Director                      │
│                                         │
│ Emitido: 31/10/2025                     │
└─────────────────────────────────────────┘
```

---

## 🔐 Verificación Pública

**GET /api/verificar/ABC1234**

Respuesta:
```json
{
  "valido": true,
  "estado": "EMITIDO",
  "estudiante": {
    "dni": "12345678",
    "nombres": "APELLIDOS, Nombres"
  },
  "institucion": "Colegio XYZ",
  "fechaEmision": "2025-10-31",
  "promedio": 15.5,
  "firmas": ["Director"],
  "anulado": false
}
```

---

## 🧪 Criterios de Aceptación

- [x] Certificados se generan con estructura correcta
- [x] PDF se genera con diseño oficial
- [x] QR funciona y redirige a verificación
- [x] Código virtual es único
- [x] Firma digital funciona (preparado)
- [x] Firma manuscrita se marca correctamente
- [x] Verificación pública funciona sin auth
- [x] Anulación funciona
- [x] Rectificación crea nueva versión
- [ ] Tests >80% coverage

---

## ⚠️ Dependencias

- Sprint 07 - Módulo solicitudes
- Sprint 08 - Módulo pagos

---

**🔗 Siguiente**: [SPRINT_10_MODULO_NOTIFICACIONES.md](./SPRINT_10_MODULO_NOTIFICACIONES.md)

