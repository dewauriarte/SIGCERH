# 🎯 SPRINT 05: DASHBOARD MESA DE PARTES

> **Módulo**: Frontend - Dashboard Interno  
> **Duración**: 4 días  
> **Prioridad**: 🟡 ALTA  
> **Estado**: ⬜ No iniciado  
> **Rol**: MESA_DE_PARTES

---

## 📌 Objetivo

Dashboard para Mesa de Partes: recibir solicitudes, derivar a Editor, validar pagos en efectivo y gestionar entregas de certificados.

---

## 🎯 Funcionalidades

- [ ] Dashboard con estadísticas
- [ ] Lista de solicitudes pendientes de derivación
- [ ] Derivar solicitud a Editor
- [ ] Lista de pagos pendientes de validación
- [ ] Validar pago en efectivo/comprobante
- [ ] Lista de certificados listos para entrega
- [ ] Marcar como entregado
- [ ] Actualización en tiempo real

---

## 📱 Pantallas (6)

### 1. Dashboard Principal
### 2. Solicitudes Pendientes de Derivación
### 3. Validar y Derivar Solicitud
### 4. Pagos Pendientes de Validación
### 5. Validar Pago
### 6. Certificados para Entrega

---

## ✅ Tareas Principales

### 🟦 FASE 1: Layout y Navegación (2h)
- [ ] Sidebar con menú:
  - Dashboard
  - Solicitudes
  - Pagos
  - Entregas
- [ ] Header con rol "Mesa de Partes"

### 🟦 FASE 2: Dashboard Principal (4h)
- [ ] Cards de estadísticas:
  - [ ] Solicitudes pendientes de derivación
  - [ ] Pagos pendientes de validación
  - [ ] Certificados listos para entrega
  - [ ] Total procesado hoy
- [ ] Gráficos (Recharts):
  - [ ] Solicitudes por día (última semana)
  - [ ] Pagos validados por día
- [ ] Lista de acciones recientes

### 🟦 FASE 3: Solicitudes Pendientes (5h)
- [ ] DataTable con columnas:
  - Código
  - Estudiante
  - Fecha solicitud
  - Datos del colegio
  - Estado
  - Acciones
- [ ] Filtros:
  - [ ] Por fecha
  - [ ] Por estado
  - [ ] Búsqueda por código/DNI
- [ ] Botón "Ver Detalles"
- [ ] Modal con detalles completos
- [ ] Botón "Derivar a Editor"
- [ ] Confirmación antes de derivar
- [ ] Actualización en tiempo real (polling)

### 🟦 FASE 4: Pagos Pendientes (5h)
- [ ] DataTable de pagos:
  - Código solicitud
  - Estudiante
  - Monto
  - Método de pago
  - Fecha pago
  - Comprobante (imagen)
  - Acciones
- [ ] Ver comprobante en modal/imagen ampliada
- [ ] Botón "Validar Pago"
- [ ] Modal de validación:
  - [ ] Ver datos del pago
  - [ ] Ver comprobante
  - [ ] Confirmar monto
  - [ ] Botones: "Aprobar" / "Rechazar"
- [ ] Campo observaciones si rechaza
- [ ] Toast de confirmación

### 🟦 FASE 5: Registro Pago Efectivo (3h)
- [ ] Formulario para registrar pago efectivo:
  - [ ] Buscar solicitud por código
  - [ ] Mostrar datos de solicitud
  - [ ] Monto (pre-llenado S/ 15.00)
  - [ ] Número de recibo
  - [ ] Fecha de pago
  - [ ] Método: Efectivo
- [ ] Validación
- [ ] Botón "Registrar Pago"
- [ ] Actualiza estado de solicitud automáticamente

### 🟦 FASE 6: Certificados para Entrega (4h)
- [x] DataTable de certificados listos:
  - Código
  - Estudiante
  - Tipo (Digital/Físico)
  - Fecha emisión
  - Acciones
- [x] Filtro: Solo certificados físicos
- [x] Ver certificado (preview PDF)
- [x] Botón "Marcar como Entregado"
- [x] Modal de confirmación:
  - [x] DNI del receptor
  - [x] Nombre del receptor
  - [x] Firma digital o checkbox de confirmación
- [x] Generar constancia de entrega (PDF)

### 🟦 FASE 7: Notificaciones (2h)
- [x] Badge con contador en menú
- [x] Lista de notificaciones:
  - Nueva solicitud
  - Pago recibido (pendiente validación)
  - Certificado listo para entrega

### 🟦 FASE 8: Actualización Tiempo Real (2h)
- [x] Polling en todas las listas (30s)
- [x] Indicador de actualización
- [x] Notificaciones toast cuando hay cambios
- [x] Refrescar al detectar nuevo registro

---

## 🔄 Actualización en Tiempo Real

```typescript
// Solicitudes pendientes
const { data: solicitudes } = useQuery({
  queryKey: ['solicitudes', 'pendientes-derivacion'],
  queryFn: getSolicitudesPendientesDerivacion,
  refetchInterval: 30000,
});

// Pagos pendientes
const { data: pagos } = useQuery({
  queryKey: ['pagos', 'pendientes-validacion'],
  queryFn: getPagosPendientesValidacion,
  refetchInterval: 30000,
});
```

---

## 🧪 Criterios de Aceptación

- [ ] Dashboard muestra estadísticas correctas
- [ ] Lista de solicitudes actualiza automáticamente
- [ ] Derivar a Editor funciona
- [ ] Lista de pagos actualiza automáticamente
- [ ] Validar pago funciona (aprobar/rechazar)
- [ ] Registrar pago efectivo funciona
- [ ] Lista de entregas funciona
- [ ] Marcar como entregado funciona
- [ ] Notificaciones funcionan
- [ ] Responsive

---

## ⚠️ Dependencias

- Sprint 03 - Autenticación
- Backend Sprint 07 - API solicitudes
- Backend Sprint 08 - API pagos

---

**🔗 Siguiente**: [SPRINT_06_DASHBOARD_EDITOR.md](./SPRINT_06_DASHBOARD_EDITOR.md)

