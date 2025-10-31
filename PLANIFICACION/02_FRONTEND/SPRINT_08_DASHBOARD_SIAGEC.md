# 🎯 SPRINT 08: DASHBOARD SIAGEC

> **Módulo**: Frontend - Dashboard Interno  
> **Duración**: 3 días  
> **Prioridad**: 🟡 ALTA  
> **Estado**: ⬜ No iniciado  
> **Rol**: ENCARGADO_SIAGEC

---

## 📌 Objetivo

Dashboard para registro digital: generar código QR, código virtual, registrar en sistema y enviar a Dirección.

---

## 🎯 Funcionalidades

- [ ] Dashboard con estadísticas
- [ ] Solicitudes pendientes de registro
- [ ] Generar código QR
- [ ] Generar código virtual
- [ ] Vista previa del certificado con códigos
- [ ] Registrar digitalmente
- [ ] Enviar a Dirección para firma
- [ ] Actualización en tiempo real

---

## 📱 Pantallas (4)

### 1. Dashboard Principal
### 2. Solicitudes Pendientes de Registro
### 3. Registrar Digitalmente (Generar Códigos)
### 4. Historial de Registros

---

## ✅ Tareas Principales

### 🟦 FASE 1: Dashboard Principal (2h)
- [ ] Cards de estadísticas:
  - Pendientes de registro
  - Registrados hoy
  - Con observaciones técnicas
  - Total registrado
- [ ] Gráficos

### 🟦 FASE 2: Lista Pendientes (3h)
- [ ] DataTable:
  - Código
  - Estudiante
  - Colegio
  - Validado por UGEL
  - Fecha validación
  - Acciones
- [ ] Botón "Registrar"

### 🟦 FASE 3: Registrar Digitalmente (6h)

**Vista del Certificado**:
- [ ] Preview del certificado PDF
- [ ] Datos del estudiante
- [ ] Tabla de notas completa

**Generación de Códigos**:
- [ ] Botón "Generar Código Virtual"
  - Genera código de 7 dígitos
  - Muestra: ABC1234
  - Copiable
- [ ] Botón "Generar Código QR"
  - Genera imagen QR
  - URL: https://verificar.ugel[XX].gob.pe/?qr=[HASH]
  - Preview del QR
  - Descargar QR

**Vista Previa con Códigos**:
- [ ] Preview del PDF con:
  - Código virtual insertado
  - Código QR insertado
  - Posición correcta

**Validaciones Técnicas**:
- [ ] Verificar formato PDF/A
- [ ] Verificar metadata completa
- [ ] Verificar resolución adecuada

**Acciones**:
- [ ] ✅ "Registrar y Enviar a Dirección"
  - Confirma registro
  - Guarda códigos en BD
  - Actualiza PDF con códigos
  - Pasa a EN_FIRMA_DIRECCION
- [ ] ⚠️ "Observar"
  - Si hay problemas técnicos
  - Devolver a Editor
  - Campo: Observaciones

### 🟦 FASE 4: Historial (2h)
- [ ] Lista de certificados registrados
- [ ] Ver códigos generados
- [ ] Estadísticas

### 🟦 FASE 5: Actualización Tiempo Real (1h)
- [ ] Polling
- [ ] Notificaciones

---

## 🧪 Criterios de Aceptación

- [ ] Dashboard funciona
- [ ] Lista actualiza automáticamente
- [ ] Código virtual se genera correctamente
- [ ] Código QR se genera y visualiza
- [ ] Preview del certificado con códigos funciona
- [ ] Registrar funciona (pasa a Dirección)
- [ ] Observar funciona (devuelve a Editor)
- [ ] Responsive

---

## ⚠️ Dependencias

- Sprint 03 - Autenticación
- Backend Sprint 07 - API solicitudes
- Backend Sprint 09 - API certificados (QR, códigos)

---

**🔗 Siguiente**: [SPRINT_09_DASHBOARD_DIRECCION.md](./SPRINT_09_DASHBOARD_DIRECCION.md)

