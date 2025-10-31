# 🎯 SPRINT 07: MÓDULO SOLICITUDES (FLUJO COMPLETO)

> **Módulo**: Backend - Solicitudes  
> **Duración**: 6-7 días  
> **Prioridad**: 🔴 CRÍTICA (CORE del sistema)  
> **Estado**: ✅ COMPLETADO

---

## 📌 Objetivo

Implementar el flujo completo de solicitudes con 13 estados, máquina de estados robusta, trazabilidad completa por rol y endpoints específicos para cada actor del flujo.

---

## 🎯 Metas del Sprint

- [x] State machine de 13 estados funcionando
- [x] Trazabilidad: usuarios y fechas por cada etapa
- [x] Endpoints específicos por rol
- [x] Historial automático de cambios
- [x] Notificaciones automáticas en transiciones
- [x] Validaciones de permisos por rol
- [x] Tests >80% coverage

---

## 📊 Tablas Involucradas (3)

- [x] TipoSolicitud
- [x] Solicitud ⭐⭐⭐ (13 estados + trazabilidad)
- [x] SolicitudHistorial

---

## 🔄 13 Estados a Implementar

1. REGISTRADA
2. DERIVADO_A_EDITOR
3. EN_BUSQUEDA
4. ACTA_ENCONTRADA_PENDIENTE_PAGO
5. ACTA_NO_ENCONTRADA
6. PAGO_VALIDADO
7. EN_PROCESAMIENTO_OCR
8. EN_VALIDACION_UGEL
9. OBSERVADO_POR_UGEL
10. EN_REGISTRO_SIAGEC
11. EN_FIRMA_DIRECCION
12. CERTIFICADO_EMITIDO
13. ENTREGADO

---

## ✅ Tareas Principales

### 🟦 FASE 1: State Machine (8h)
- [x] Diseñar diagrama de transiciones válidas
- [x] Implementar StateMachine class
- [x] Validar transiciones permitidas
- [x] Hooks pre/post transición
- [x] Registro automático en SolicitudHistorial

### 🟦 FASE 2: SolicitudService (10h)
- [x] create() - Usuario público crea solicitud
- [x] findAll() con filtros por estado/rol
- [x] findById()
- [x] findByCodigo() - Seguimiento público
- [x] **Métodos de transición por rol**:
  - [x] derivarAEditor() - Mesa de Partes
  - [x] marcarActaEncontrada() - Editor
  - [x] marcarActaNoEncontrada() - Editor
  - [x] validarPago() - Mesa de Partes/Sistema
  - [x] iniciarProcesamiento() - Editor
  - [x] aprobarUGEL() - UGEL
  - [x] observarUGEL() - UGEL
  - [x] registrarSIAGEC() - SIAGEC
  - [x] firmarCertificado() - Dirección
  - [x] marcarEntregado() - Mesa de Partes

### 🟦 FASE 3: Validaciones por Rol (6h)
- [x] Implementar guards por rol
- [x] Validar que solo roles autorizados ejecuten transiciones
- [x] Validar pre-condiciones por transición

### 🟦 FASE 4: Historial y Auditoría (4h)
- [x] Auto-registro en SolicitudHistorial
- [x] Incluir observaciones en transiciones
- [x] Endpoint para ver historial completo

### 🟦 FASE 5: Notificaciones Automáticas (4h)
- [x] Trigger de notificación en cada transición crítica
- [x] Plantillas de mensaje por estado
- [x] Integrar con módulo de notificaciones

### 🟦 FASE 6: Endpoints por Rol (8h)

**Usuario Público**:
- [x] POST /api/solicitudes (crear)
- [x] GET /api/solicitudes/:codigo/seguimiento

**Mesa de Partes**:
- [x] GET /api/solicitudes/pendientes-derivacion
- [x] POST /api/solicitudes/:id/derivar-editor
- [x] POST /api/solicitudes/:id/validar-pago-efectivo
- [x] GET /api/solicitudes/listas-entrega
- [x] POST /api/solicitudes/:id/marcar-entregado

**Editor**:
- [x] GET /api/solicitudes/asignadas-busqueda
- [x] POST /api/solicitudes/:id/acta-encontrada
- [x] POST /api/solicitudes/:id/acta-no-encontrada
- [x] POST /api/solicitudes/:id/iniciar-procesamiento

**UGEL**:
- [x] GET /api/solicitudes/pendientes-validacion-ugel
- [x] POST /api/solicitudes/:id/aprobar-ugel
- [x] POST /api/solicitudes/:id/observar-ugel

**SIAGEC**:
- [x] GET /api/solicitudes/pendientes-registro-siagec
- [x] POST /api/solicitudes/:id/registrar-siagec

**Dirección**:
- [x] GET /api/solicitudes/pendientes-firma
- [x] POST /api/solicitudes/:id/firmar-certificado

**Admin/Reportes**:
- [x] GET /api/solicitudes/dashboard
- [x] GET /api/solicitudes/estadisticas

### 🟦 FASE 7: DTOs y Validaciones (4h)
- [x] CreateSolicitudDTO
- [x] UpdateSolicitudDTO
- [x] DTOs por cada transición
- [x] Validaciones con Zod

### 🟦 FASE 8: Controllers (4h)
- [x] SolicitudController
- [x] Organizar por rol
- [x] Middleware de autorización

### 🟦 FASE 9: Testing (8h)
- [x] Unit tests de StateMachine
- [x] Unit tests de SolicitudService
- [x] Integration tests del flujo completo
- [x] Tests de permisos por rol
- [x] Tests de validaciones

### 🟦 FASE 10: Documentación (3h)
- [x] Documentar flujo completo
- [x] Diagrama de estados
- [x] Guía por rol

---

## 🎯 Flujo Visual Simplificado

```
REGISTRADA 
  ↓ (Mesa de Partes)
DERIVADO_A_EDITOR
  ↓ (Editor busca)
EN_BUSQUEDA
  ↓ ✅ (Editor)          ↓ ❌ (Editor)
ACTA_ENCONTRADA ←→ ACTA_NO_ENCONTRADA (FIN)
  ↓ (Usuario paga)
PAGO_VALIDADO
  ↓ (Editor procesa)
EN_PROCESAMIENTO_OCR
  ↓ (Editor envía)
EN_VALIDACION_UGEL
  ↓ ✅ (UGEL)           ↓ ❌ (UGEL)
EN_REGISTRO_SIAGEC ←→ OBSERVADO_POR_UGEL (vuelve a Editor)
  ↓ (SIAGEC)
EN_FIRMA_DIRECCION
  ↓ (Dirección)
CERTIFICADO_EMITIDO
  ↓ (Usuario descarga/retira)
ENTREGADO (FIN)
```

---

## 🧪 Criterios de Aceptación

- [x] 13 estados implementados correctamente
- [x] State machine valida transiciones
- [x] Trazabilidad completa (usuarios y fechas)
- [x] Endpoints por rol funcionan
- [x] Solo roles autorizados pueden ejecutar acciones
- [x] Historial se registra automáticamente
- [x] Notificaciones se disparan en transiciones
- [x] Tests >80% coverage
- [x] Flujo completo funciona end-to-end

---

## ⚠️ Dependencias

- Sprint 03 - Autenticación (roles)
- Sprint 06 - Actas físicas

---

**🔗 Siguiente**: [SPRINT_08_MODULO_PAGOS.md](./SPRINT_08_MODULO_PAGOS.md)

