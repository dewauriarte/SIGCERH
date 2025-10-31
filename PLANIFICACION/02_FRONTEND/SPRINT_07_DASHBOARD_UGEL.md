# 🎯 SPRINT 07: DASHBOARD UGEL

> **Módulo**: Frontend - Dashboard Interno  
> **Duración**: 3-4 días  
> **Prioridad**: 🟡 ALTA  
> **Estado**: ⬜ No iniciado  
> **Rol**: ENCARGADO_UGEL

---

## 📌 Objetivo

Dashboard para validación oficial de certificados: revisar datos extraídos por OCR, comparar con acta física, aprobar o observar.

---

## 🎯 Funcionalidades

- [ ] Dashboard con estadísticas
- [ ] Solicitudes pendientes de validación
- [ ] Ver acta física escaneada y datos extraídos
- [ ] Comparar acta vs datos OCR
- [ ] Aprobar certificado
- [ ] Observar certificado (devolver a Editor)
- [ ] Historial de validaciones
- [ ] Actualización en tiempo real

---

## 📱 Pantallas (4)

### 1. Dashboard Principal
### 2. Solicitudes Pendientes de Validación
### 3. Validar Certificado (Vista Detallada)
### 4. Historial de Validaciones

---

## ✅ Tareas Principales

### 🟦 FASE 1: Dashboard Principal (3h)
- [ ] Cards de estadísticas:
  - Pendientes de validación
  - Aprobados hoy
  - Observados
  - Total validado
- [ ] Gráficos de validaciones por día

### 🟦 FASE 2: Lista Pendientes de Validación (4h)
- [ ] DataTable:
  - Código
  - Estudiante
  - Colegio
  - Editor que procesó
  - Fecha procesamiento
  - Días pendiente
  - Acciones
- [ ] Filtros
- [ ] Botón "Validar"

### 🟦 FASE 3: Pantalla de Validación ⭐⭐ (8h)

**Layout de 2 columnas**:

**Columna Izquierda: Acta Física**
- [ ] Visor PDF/Imagen del acta escaneada
- [ ] Zoom in/out
- [ ] Rotación
- [ ] Pantalla completa

**Columna Derecha: Datos Extraídos**
- [ ] Información del estudiante
- [ ] Tabla de notas extraídas:
  - Área Curricular | Nota
  - 12 áreas con sus notas
- [ ] Comportamiento
- [ ] Situación Final

**Herramientas de Validación**:
- [ ] Checkbox por cada dato:
  - [ ] ✅ Verificado
  - [ ] ⚠️ Discrepancia
- [ ] Campo de observaciones por dato
- [ ] Contador de verificaciones completadas

**Botones de Acción**:
- [ ] Botón "✅ APROBAR" (verde)
  - Confirmación
  - Comentario opcional
  - Firma digital UGEL (opcional)
  - Pasa a SIAGEC
- [ ] Botón "⚠️ OBSERVAR" (amarillo)
  - Campo obligatorio: Observaciones
  - Especificar qué corregir
  - Devuelve a Editor
  - Notifica a Editor

### 🟦 FASE 4: Historial de Validaciones (3h)
- [ ] DataTable de certificados validados
- [ ] Filtros:
  - Por fecha
  - Por estado (Aprobado/Observado)
  - Por validador
- [ ] Ver detalles de validación

### 🟦 FASE 5: Actualización Tiempo Real (2h)
- [ ] Polling cada 30s
- [ ] Notificaciones de nuevos certificados

---

## 🧪 Criterios de Aceptación

- [ ] Dashboard funciona
- [ ] Lista de pendientes actualiza automáticamente
- [ ] Acta física se visualiza correctamente
- [ ] Datos extraídos se muestran claramente
- [ ] Comparación lado a lado funciona
- [ ] Aprobar funciona (pasa a SIAGEC)
- [ ] Observar funciona (devuelve a Editor con comentarios)
- [ ] Historial se muestra
- [ ] Responsive

---

## ⚠️ Dependencias

- Sprint 03 - Autenticación
- Sprint 06 - Dashboard Editor (datos OCR)
- Backend Sprint 07 - API solicitudes

---

**🔗 Siguiente**: [SPRINT_08_DASHBOARD_SIAGEC.md](./SPRINT_08_DASHBOARD_SIAGEC.md)

