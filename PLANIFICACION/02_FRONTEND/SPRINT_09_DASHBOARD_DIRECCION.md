# 🎯 SPRINT 09: DASHBOARD DIRECCIÓN

> **Módulo**: Frontend - Dashboard Interno  
> **Duración**: 3 días  
> **Prioridad**: 🟡 ALTA  
> **Estado**: ⬜ No iniciado  
> **Rol**: DIRECCION

---

## 📌 Objetivo

Dashboard para firma final: revisar certificado, firmar digitalmente o marcar para firma manuscrita, autorizar entrega.

---

## 🎯 Funcionalidades

- [ ] Dashboard con estadísticas
- [ ] Solicitudes pendientes de firma
- [ ] Vista previa completa del certificado
- [ ] Firmar digitalmente (si configurado)
- [ ] Marcar para firma manuscrita
- [ ] Subir versión firmada (si manuscrita)
- [ ] Autorizar entrega
- [ ] Actualización en tiempo real

---

## 📱 Pantallas (4)

### 1. Dashboard Principal
### 2. Solicitudes Pendientes de Firma
### 3. Firmar Certificado
### 4. Historial de Firmas

---

## ✅ Tareas Principales

### 🟦 FASE 1: Dashboard Principal (2h)
- [ ] Cards de estadísticas:
  - Pendientes de firma
  - Firmados hoy
  - Observados
  - Total firmado
- [ ] Gráficos

### 🟦 FASE 2: Lista Pendientes (3h)
- [ ] DataTable:
  - Código
  - Estudiante
  - Colegio
  - Registrado por SIAGEC
  - Fecha registro
  - Tipo firma elegido
  - Acciones
- [ ] Filtros por tipo de firma
- [ ] Botón "Revisar y Firmar"

### 🟦 FASE 3: Revisar y Firmar (8h)

**Vista Previa del Certificado**:
- [ ] Visor PDF completo
- [ ] Verificar:
  - Datos del estudiante correctos
  - Notas completas
  - Códigos QR y virtual presentes
  - Formato correcto

**Información de Validaciones Previas**:
- [ ] Procesado por Editor: [Nombre]
- [ ] Validado por UGEL: [Nombre]
- [ ] Registrado por SIAGEC: [Nombre]
- [ ] Fecha de cada etapa

**Opción 1: Firma Digital** (si usuario eligió digital):
- [ ] Botón "Firmar Digitalmente"
- [ ] Modal de confirmación:
  - Ver resumen del certificado
  - Campo: Observaciones finales (opcional)
  - Confirmar con contraseña
- [ ] Integración con certificado digital (preparado)
- [ ] Aplicar firma digital al PDF
- [ ] Mostrar: "✅ Certificado firmado digitalmente"
- [ ] Estado: CERTIFICADO_EMITIDO
- [ ] Habilitar descarga para usuario

**Opción 2: Firma Manuscrita** (si usuario eligió física):
- [ ] Botón "Generar para Firma Manuscrita"
- [ ] Generar PDF sin firma digital
- [ ] Instrucciones:
  ```
  1. Descargar certificado
  2. Imprimir en formato oficial
  3. Firmar manuscrítamente y sellar
  4. Escanear versión firmada
  5. Subir versión firmada
  ```
- [ ] Botón "Descargar para Imprimir"
- [ ] FileUpload "Subir Versión Firmada"
- [ ] Vista previa de versión firmada subida
- [ ] Botón "Confirmar Firma Manuscrita"
- [ ] Estado: CERTIFICADO_EMITIDO
- [ ] Usuario debe retirar físico en UGEL

**Observaciones**:
- [ ] Botón "Observar"
- [ ] Campo: Motivo de observación
- [ ] Devolver a etapa previa (especificar)

### 🟦 FASE 4: Historial (2h)
- [ ] Lista de certificados firmados
- [ ] Filtrar por tipo de firma
- [ ] Ver detalles

### 🟦 FASE 5: Actualización Tiempo Real (1h)
- [ ] Polling
- [ ] Notificaciones

---

## 🧪 Criterios de Aceptación

- [ ] Dashboard funciona
- [ ] Lista actualiza automáticamente
- [ ] Vista previa completa funciona
- [ ] Firma digital funciona (preparado)
- [ ] Marcar firma manuscrita funciona
- [ ] Subir versión firmada funciona
- [ ] Autorizar entrega funciona
- [ ] Notificación a usuario al finalizar
- [ ] Observar funciona
- [ ] Responsive

---

## ⚠️ Dependencias

- Sprint 03 - Autenticación
- Backend Sprint 07 - API solicitudes
- Backend Sprint 09 - API certificados (firma)

---

**🔗 Siguiente**: [SPRINT_10_DASHBOARD_ADMIN.md](./SPRINT_10_DASHBOARD_ADMIN.md)

