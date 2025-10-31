# 🎯 SPRINT 08: MÓDULO PAGOS

> **Módulo**: Backend - Pagos  
> **Duración**: 5-6 días  
> **Prioridad**: 🟡 ALTA  
> **Estado**: 🔄 En progreso (Fases 1-5 completadas)

---

## 📌 Objetivo

Sistema completo de pagos con validación manual para efectivo, registro de métodos de pago, generación de órdenes, subida de comprobantes y conciliación bancaria.

---

## 🎯 Metas del Sprint

- [x] Generación de órdenes de pago
- [x] Métodos de pago configurables (Yape, Plin, Efectivo, Tarjeta)
- [x] Validación manual de pagos (Mesa de Partes)
- [x] Subida de comprobantes
- [x] Webhook receiver (preparado para futuro)
- [ ] Conciliación bancaria
- [x] Reportes de pagos
- [ ] Tests >80% coverage

---

## 📊 Tablas Involucradas (7)

- [x] Pago (con validación manual)
- [x] MetodoPago
- [ ] PagoDetalle (existente, sin lógica adicional)
- [ ] PasarelaPago (existente, preparado para futuro)
- [x] WebhookPago
- [ ] ConciliacionBancaria
- [ ] ConciliacionDetalle

---

## ✅ Tareas Principales

### ✅ FASE 1: Métodos de Pago (4h) - COMPLETADA
- [x] MetodoPagoService (CRUD)
- [x] Seed de métodos:
  - [x] YAPE
  - [x] PLIN
  - [x] EFECTIVO
  - [x] TARJETA (preparado para futuro)
- [x] Configuración de comisiones

### ✅ FASE 2: PagoService (8h) - COMPLETADA
- [x] generarOrden() - Crear orden de pago
- [x] registrarPagoEfectivo() - Mesa de Partes
- [x] subirComprobante() - Usuario (Yape/Plin)
- [x] validarManualmente() - Mesa de Partes ⭐
- [x] rechazarComprobante() - Mesa de Partes
- [x] confirmarPagoAutomatico() - Webhook (preparado, no implementado)
- [x] findAll() con filtros
- [x] findById()

### ✅ FASE 3: Validación Manual (6h) - COMPLETADA
- [x] Endpoint para Mesa de Partes ver pagos pendientes
- [x] Validar comprobante subido
- [x] Validar monto y fecha
- [x] Marcar como VALIDADO
- [x] Trigger para actualizar estado de Solicitud
- [x] Notificar al usuario (preparado)

### ✅ FASE 4: Subida de Comprobantes (3h) - COMPLETADA
- [x] Middleware Multer
- [x] Almacenar en /storage/comprobantes/
- [x] Validar formato de imagen
- [x] Asociar a pago

### ✅ FASE 5: Webhook Receiver (3h - preparación) - COMPLETADA
- [x] Endpoint POST /api/pagos/webhook
- [x] Validar firma del webhook (preparado)
- [x] Registrar en WebhookPago
- [x] Procesar automáticamente (preparado)

### 🟦 FASE 6: Conciliación Bancaria (4h)
- [ ] ConciliacionService
- [ ] Importar archivo bancario
- [ ] Matchear con pagos registrados
- [ ] Reportar diferencias
- [ ] Marcar como conciliado

### ✅ FASE 7: Reportes (3h) - COMPLETADA
- [x] Reporte de pagos por período
- [x] Reporte por método de pago
- [x] Reporte de pagos pendientes de validación
- [x] Exportar a Excel

### ✅ FASE 8: Controllers y Routes (4h) - COMPLETADA
- [x] PagosController
- [x] MetodosPagoController
- [ ] ConciliacionController (pendiente)
- [x] Proteger rutas

### 🟦 FASE 9: Testing (5h)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Test de validación manual
- [ ] Test de conciliación

---

## 📋 Endpoints 

```
# Generación (Usuario Público)
POST   /api/pagos/orden
POST   /api/pagos/:id/comprobante (subir Yape/Plin)

# Validación Manual (Mesa de Partes)
GET    /api/pagos/pendientes-validacion
POST   /api/pagos/:id/validar-manual ⭐
POST   /api/pagos/:id/rechazar-comprobante

# Efectivo (Mesa de Partes)
POST   /api/pagos/:id/registrar-efectivo

# Webhook (Sistema - futuro)
POST   /api/pagos/webhook

# Métodos de Pago (Admin)
GET    /api/pagos/metodos
POST   /api/pagos/metodos
PUT    /api/pagos/metodos/:id

# Reportes (Admin)
GET    /api/pagos/reportes
GET    /api/pagos/exportar-excel

# Conciliación (Admin)
POST   /api/pagos/conciliacion/importar
GET    /api/pagos/conciliacion/:id
```

---

## 🎯 Flujo de Pago

**1. Usuario Público**:
- Solicitud pasa a estado "ACTA_ENCONTRADA_PENDIENTE_PAGO"
- Sistema genera orden de pago (S/ 15.00)
- Usuario elige método de pago

**2A. Pago Digital (Yape/Plin)**:
- Usuario paga y sube comprobante
- Mesa de Partes valida manualmente
- Sistema marca como VALIDADO
- Solicitud pasa a siguiente estado

**2B. Pago Efectivo**:
- Usuario paga en ventanilla intititucin
- Mesa de Partes registra pago directamente
- Sistema marca como VALIDADO
- Solicitud pasa a siguiente estado

---

## 🧪 Criterios de Aceptación

- [x] Órdenes de pago se generan correctamente
- [x] Usuario puede subir comprobante
- [x] Mesa de Partes puede validar pagos manualmente
- [x] Efectivo se registra correctamente
- [x] Webhook receiver funciona (preparado)
- [ ] Conciliación bancaria funciona
- [x] Reportes se generan
- [ ] Tests >80% coverage

---

## ⚠️ Dependencias

- Sprint 07 - Módulo solicitudes

---

**🔗 Siguiente**: [SPRINT_09_MODULO_CERTIFICADOS.md](./SPRINT_09_MODULO_CERTIFICADOS.md)

