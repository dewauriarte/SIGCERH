# 🎯 SPRINT 06: DASHBOARD EDITOR (OFICINA DE ACTAS)

> **Módulo**: Frontend - Dashboard Interno  
> **Duración**: 5-6 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ⬜ No iniciado  
> **Rol**: EDITOR

---

## 📌 Objetivo

Dashboard más complejo del sistema: búsqueda de actas, subida de archivos, procesamiento OCR, revisión de datos extraídos y generación de certificados.

---

## 🎯 Funcionalidades Críticas

- [ ] Solicitudes asignadas para búsqueda
- [ ] Marcar acta encontrada/no encontrada
- [ ] **Subir acta escaneada con metadata** ⭐
- [ ] **Interfaz de procesamiento OCR** ⭐⭐⭐
- [ ] **Revisión y corrección de datos OCR** ⭐⭐
- [ ] Validación de notas
- [ ] Enviar a UGEL para aprobación
- [ ] Actualización en tiempo real

---

## 📱 Pantallas (7)

### 1. Dashboard Principal
### 2. Solicitudes Asignadas
### 3. Buscar Acta (Encontrada/No Encontrada)
### 4. Subir Acta con Metadata ⭐
### 5. Procesar con OCR ⭐⭐⭐
### 6. Revisar y Corregir Datos OCR ⭐⭐
### 7. Enviar a UGEL

---

## ✅ Tareas Principales

### 🟦 FASE 1: Dashboard Principal (3h)
- [ ] Cards de estadísticas:
  - Solicitudes asignadas
  - Actas encontradas hoy
  - Procesadas con OCR
  - Enviadas a UGEL
- [ ] Lista de solicitudes urgentes
- [ ] Progreso del día

### 🟦 FASE 2: Solicitudes Asignadas (4h)
- [ ] DataTable:
  - Código
  - Estudiante
  - Colegio
  - Años solicitados
  - Días desde asignación
  - Estado búsqueda
  - Acciones
- [ ] Filtros por estado búsqueda
- [ ] Ver detalles de solicitud
- [ ] Botón "Iniciar Búsqueda"

### 🟦 FASE 3: Buscar Acta (4h)
- [ ] Modal/Pantalla de búsqueda
- [ ] Mostrar datos del estudiante
- [ ] Checkbox: "✅ Acta Encontrada" / "❌ Acta No Encontrada"
- [ ] Si encontrada:
  - [ ] Continuar a subir acta
- [ ] Si no encontrada:
  - [ ] Campo: Observaciones (razón)
  - [ ] Botón "Notificar a Usuario"
  - [ ] Sistema automáticamente notifica sin cobrar

### 🟦 FASE 4: Subir Acta con Metadata ⭐⭐ (6h)

**Formulario de Metadata** (según nota para OCR):
- [ ] Año Lectivo (Select 1985-2012)
- [ ] Grado (Select: 1° a 5° Secundaria)
- [ ] Sección (Input: A, B, C, etc.)
- [ ] Turno (Select: Mañana/Tarde)
- [ ] Tipo Evaluación (Select: Final/Recuperación)
- [ ] Colegio Origen (Input + búsqueda)
- [ ] Ubicación Física del Acta (Textarea)

**Subida de Archivo**:
- [ ] FileUpload component
- [ ] Drag & drop
- [ ] Validar formato (PDF, JPG, PNG)
- [ ] Validar tamaño (máx 10MB)
- [ ] Preview del archivo
- [ ] Progress bar durante subida

**Plantilla de Áreas** (automática):
- [ ] Al seleccionar año + grado:
  - [ ] Llamar API: GET /api/curriculo/plantilla?anio=1990&grado=5
  - [ ] Mostrar lista de áreas curriculares ordenadas
  - [ ] Ej: "Nota 1 → Matemática", "Nota 2 → Comunicación"
- [ ] Mostrar las 12 áreas esperadas
- [ ] Confirmación: "Esta plantilla se usará para el OCR"

**Botón**:
- [ ] "Guardar y Procesar con IA/OCR"

### 🟦 FASE 5: Procesar con OCR ⭐⭐⭐ (8h)

**Pantalla de Procesamiento**:
- [ ] Mostrar archivo subido
- [ ] Mostrar metadata ingresada
- [ ] Mostrar plantilla de áreas
- [ ] Botón grande: "🤖 PROCESAR CON IA/OCR"
- [ ] Loading state durante procesamiento:
  - [ ] Spinner animado
  - [ ] Texto: "Procesando con IA... Esto puede tomar 1-2 minutos"
  - [ ] Progress bar (simulado)

**Resultado del OCR**:
- [ ] Título: "✅ Se detectaron N estudiantes en el acta"
- [ ] Lista expandible de estudiantes
- [ ] Por cada estudiante mostrar:
  - [ ] Número
  - [ ] Código
  - [ ] Tipo (G/P)
  - [ ] Nombre Completo
  - [ ] Sexo
  - [ ] Notas (array de 12)
  - [ ] Comportamiento
  - [ ] Asignaturas Desaprobadas
  - [ ] Situación Final (A/R/D)
  - [ ] Observaciones (si tiene)

**Acciones por Estudiante**:
- [ ] Badge de estado: ✅ OK / ⚠️ Revisar
- [ ] Botón "Editar" (abrir modal de corrección)

### 🟦 FASE 6: Revisar y Corregir Datos OCR ⭐⭐ (8h)

**Modal de Edición de Estudiante**:
- [ ] Todos los campos editables
- [ ] Nombre completo (Input)
- [ ] Sexo (Select: H/M)
- [ ] Notas por área:
  - [ ] Tabla con 12 filas
  - [ ] Área | Nota
  - [ ] Input numérico 0-20
  - [ ] Permitir vacío (null)
- [ ] Comportamiento (Input 0-20)
- [ ] Asignaturas Desaprobadas (Input)
- [ ] Situación Final (Select: A/R/D)
- [ ] Observaciones (Textarea)

**Validaciones**:
- [ ] Nombre no vacío
- [ ] Notas entre 0-20 o vacío
- [ ] Comportamiento entre 0-20

**Botones**:
- [ ] "Guardar Correcciones"
- [ ] "Cancelar"

**Resumen Final**:
- [ ] Mostrar contador:
  - Estudiantes totales
  - Con correcciones
  - Listos para guardar
- [ ] Botón: "✅ APROBAR Y GUARDAR EN BD"

**Al guardar**:
- [ ] Loading state
- [ ] Llamar API: POST /api/actas/:id/procesar-ocr
- [ ] Enviar JSON con todos los estudiantes
- [ ] Backend crea automáticamente:
  - Estudiantes
  - Certificados
  - CertificadoDetalle
  - CertificadoNota
- [ ] Success toast
- [ ] Redirigir a siguiente paso

### 🟦 FASE 7: Enviar a UGEL (2h)
- [ ] Vista previa del certificado generado
- [ ] Lista de certificados creados (30 estudiantes)
- [ ] Botón: "Enviar a UGEL para Validación"
- [ ] Confirmación
- [ ] Actualiza estado a EN_VALIDACION_UGEL
- [ ] Notifica a UGEL

### 🟦 FASE 8: Observaciones de UGEL (2h)
- [ ] Si UGEL observa, mostrar observaciones
- [ ] Permitir corregir datos
- [ ] Reenviar a UGEL

### 🟦 FASE 9: Actualización Tiempo Real (2h)
- [ ] Polling en listas
- [ ] Notificaciones de nuevas asignaciones

---

## 🔄 Flujo Completo del Editor

```
Solicitud Asignada
  ↓
Buscar Acta Física
  ↓ (3-5 días)
✅ Encontrada          ❌ No Encontrada
  ↓                       ↓
Notificar Pago       Notificar Usuario (FIN)
  ↓
Esperar Pago
  ↓
Pago Validado
  ↓
Subir Acta + Metadata
  ↓
Procesar con OCR
  ↓
Revisar 30 Estudiantes Extraídos
  ↓
Corregir Datos si Necesario
  ↓
Guardar en BD (crea certificados)
  ↓
Enviar a UGEL
```

---

## 🎯 Componentes Clave

### ActaUploadForm ⭐
### OCRProcessing ⭐⭐⭐
### StudentListOCR ⭐⭐
### StudentEditModal ⭐⭐
### PlantillaCurriculo (vista previa)

---

## 🧪 Criterios de Aceptación

- [ ] Dashboard funciona
- [ ] Solicitudes asignadas se listan
- [ ] Marcar acta encontrada/no encontrada funciona
- [ ] Subir acta con metadata funciona
- [ ] **Procesar OCR extrae estudiantes correctamente** ⭐⭐
- [ ] **Lista de 30 estudiantes se muestra** ⭐
- [ ] **Editar estudiante individual funciona** ⭐
- [ ] Guardar en BD crea certificados
- [ ] Enviar a UGEL funciona
- [ ] Actualización en tiempo real
- [ ] Responsive

---

## 🔌 Integración con Backend

### Endpoints Críticos:
```
POST /api/actas (subir acta)
PUT  /api/actas/:id/metadata
GET  /api/curriculo/plantilla?anio=1990&grado=5 ⭐⭐
POST /api/actas/:id/procesar-ocr ⭐⭐⭐ (envía JSON estudiantes)
```

---

## ⚠️ Dependencias

- Sprint 03 - Autenticación
- Backend Sprint 05 - API Currícculo (plantilla)
- Backend Sprint 06 - API Actas
- Módulo OCR (03_IA_OCR) funcionando

---

**🔗 Siguiente**: [SPRINT_07_DASHBOARD_UGEL.md](./SPRINT_07_DASHBOARD_UGEL.md)

