# 🎯 SPRINT 07: DASHBOARD UGEL

> **Módulo**: Frontend - Dashboard Interno  
> **Duración**: 3-4 días  
> **Prioridad**: 🟡 ALTA  
> **Estado**: ✅ COMPLETADO  
> **Rol**: ENCARGADO_UGEL  
> **Fecha Completado**: 2025-11-07

---

## 📌 Objetivo

Dashboard para validación oficial de certificados: revisar datos extraídos por OCR, comparar con acta física, aprobar o observar.

---

## 🎯 Funcionalidades

- [x] Dashboard con estadísticas
- [x] Solicitudes pendientes de validación
- [x] Ver acta física escaneada y datos extraídos
- [x] Comparar acta vs datos OCR
- [x] Aprobar certificado
- [x] Observar certificado (devolver a Editor)
- [x] Historial de validaciones
- [x] Actualización en tiempo real

---

## 📱 Pantallas (4)

### 1. Dashboard Principal
### 2. Solicitudes Pendientes de Validación
### 3. Validar Certificado (Vista Detallada)
### 4. Historial de Validaciones

---

## ✅ Tareas Principales

### 🟦 FASE 1: Dashboard Principal (3h)
- [x] Cards de estadísticas:
  - Pendientes de validación
  - Aprobados hoy
  - Observados
  - Total validado
- [x] Gráficos de validaciones por día

### 🟦 FASE 2: Lista Pendientes de Validación (4h)
- [x] DataTable:
  - Código
  - Estudiante
  - Colegio
  - Editor que procesó
  - Fecha procesamiento
  - Días pendiente
  - Acciones
- [x] Filtros
- [x] Botón "Validar"

### 🟦 FASE 3: Pantalla de Validación ⭐⭐ (8h)

**Layout de 2 columnas**:

**Columna Izquierda: Acta Física**
- [x] Visor PDF/Imagen del acta escaneada
- [x] Zoom in/out
- [x] Rotación
- [x] Pantalla completa

**Columna Derecha: Datos Extraídos**
- [x] Información del estudiante
- [x] Tabla de notas extraídas:
  - Área Curricular | Nota
  - 12 áreas con sus notas
- [x] Comportamiento
- [x] Situación Final

**Herramientas de Validación**:
- [x] Checkbox por cada dato:
  - [x] ✅ Verificado
  - [x] ⚠️ Discrepancia
- [x] Campo de observaciones por dato
- [x] Contador de verificaciones completadas

**Botones de Acción**:
- [x] Botón "✅ APROBAR" (verde)
  - Confirmación
  - Comentario opcional
  - Firma digital UGEL (opcional)
  - Pasa a SIAGEC
- [x] Botón "⚠️ OBSERVAR" (amarillo)
  - Campo obligatorio: Observaciones
  - Especificar qué corregir
  - Devuelve a Editor
  - Notifica a Editor

### 🟦 FASE 4: Historial de Validaciones (3h)
- [x] DataTable de certificados validados
- [x] Filtros:
  - Por fecha
  - Por estado (Aprobado/Observado)
  - Por validador
- [x] Ver detalles de validación

### 🟦 FASE 5: Actualización Tiempo Real (2h)
- [x] Polling cada 30s
- [x] Notificaciones de nuevos certificados

---

## 🧪 Criterios de Aceptación

- [x] Dashboard funciona
- [x] Lista de pendientes actualiza automáticamente
- [x] Acta física se visualiza correctamente
- [x] Datos extraídos se muestran claramente
- [x] Comparación lado a lado funciona
- [x] Aprobar funciona (pasa a SIAGEC)
- [x] Observar funciona (devuelve a Editor con comentarios)
- [x] Historial se muestra
- [x] Responsive

---

## ⚠️ Dependencias

- Sprint 03 - Autenticación
- Sprint 06 - Dashboard Editor (datos OCR)
- Backend Sprint 07 - API solicitudes

---

## ✅ Estado de Implementación

**SPRINT COMPLETADO - 2025-11-07**

✅ Todas las funcionalidades implementadas  
✅ 4 páginas creadas (Dashboard, Pendientes, Validar, Historial)  
✅ Servicio de solicitudes UGEL implementado  
✅ Rutas protegidas configuradas  
✅ Integración con backend completa  
✅ Actualización en tiempo real funcionando  

📄 **Ver reporte detallado**: [SPRINT_07_UGEL_COMPLETADO.md](./SPRINT_07_UGEL_COMPLETADO.md)

---

**🔗 Siguiente**: [SPRINT_08_DASHBOARD_SIAGEC.md](./SPRINT_08_DASHBOARD_SIAGEC.md)

