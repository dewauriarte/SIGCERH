# 🎯 SPRINT 04: PORTAL PÚBLICO

> **Módulo**: Frontend - Portal Público  
> **Duración**: 5-6 días  
> **Prioridad**: 🔴 CRÍTICA (Usuario final)  
> **Estado**: ⬜ No iniciado  
> **Rol**: PUBLICO

---

## 📌 Objetivo

Portal completo para usuarios públicos: solicitar certificado, seguimiento en tiempo real, pago y descarga. Implementar exactamente según FLUJO_USUARIO_PUBLICO_WEB.md.

---

## 🎯 Metas del Sprint

- [ ] Landing page atractiva
- [ ] Formulario de solicitud completo (FUT virtual)
- [ ] Pop-up de gestión de expectativas ⭐
- [ ] Confirmación con código de seguimiento
- [ ] Consulta de estado en tiempo real ⭐⭐
- [ ] Pantalla de pago (Yape/Plin/Efectivo/Tarjeta)
- [ ] Descarga de certificado PDF
- [ ] Responsive (mobile-first)

---

## 📱 Pantallas a Desarrollar (7)

### 1. Landing Page
### 2. Pop-up Gestión de Expectativas
### 3. Tipo de Persona (Filtro Apoderado)
### 4. Formulario de Solicitud (FUT Virtual)
### 5. Confirmación de Búsqueda (Código)
### 6. Consulta de Estado (Seguimiento)
### 7. Pantalla de Pago

---

## ✅ Tareas Detalladas

### 🟦 FASE 1: Landing Page (4h)
- [ ] Hero section
  - [ ] Título: "Certificados Históricos 1985-2012"
  - [ ] Subtítulo explicativo
  - [ ] 2 botones principales:
    - [ ] "Solicitar Certificado"
    - [ ] "Consultar Estado"
- [ ] Sección "¿Cómo funciona?" (3 pasos)
- [ ] Sección "Requisitos"
- [ ] Sección "Preguntas frecuentes"
- [ ] Footer institucional
- [ ] Diseño atractivo y responsive

### 🟦 FASE 2: Pop-up Gestión de Expectativas ⭐ (3h)
**Pantalla crítica según flujo**

Al hacer clic en "Solicitar Certificado":
- [ ] Dialog/Modal
- [ ] Título: "Antes de comenzar"
- [ ] Contenido:
  ```
  Está iniciando una solicitud para el periodo (1985-2012).
  El proceso es:
  
  1. Búsqueda (Gratuita): Registrará sus datos. 
     Nuestro equipo buscará el acta física.
  
  2. Pago (S/ 15.00): Solo si el acta es encontrada.
  
  3. Emisión: Tras el pago, recibirá su certificado.
  
  Tenga a mano datos del estudiante y del colegio.
  ```
- [ ] Botones: "Cancelar" y "Aceptar y Continuar"
- [ ] Redirigir a formulario al aceptar

### 🟦 FASE 3: Tipo de Persona (2h)
- [ ] Pantalla de selección
- [ ] 2 opciones:
  - [ ] "A nombre propio (Soy el exalumno)"
  - [ ] "Como apoderado o familiar"
- [ ] Si elige apoderado:
  - [ ] Agregar campos del apoderado
  - [ ] Campo para subir carta poder
- [ ] Continuar a formulario

### 🟦 FASE 4: Formulario de Solicitud (8h) ⭐⭐

**Sección 1: Datos del Estudiante**
- [ ] Tipo de documento (Select)
- [ ] Número de DNI (Input con validación 8 dígitos)
- [ ] Nombres (Input)
- [ ] Apellido Paterno (Input)
- [ ] Apellido Materno (Input)
- [ ] Fecha de Nacimiento (DatePicker)

**Sección 2: Datos Académicos** (Crítico para búsqueda)
- [ ] Ubicación del Colegio:
  - [ ] Departamento (Select)
  - [ ] Provincia (Select, carga según departamento)
  - [ ] Distrito (Select, carga según provincia)
- [ ] Nombre del Colegio (Input + ayuda)
  - Texto de ayuda: "Ingrese el nombre tal como lo recuerda..."
- [ ] Último año que cursó (Input año, 1985-2012)
- [ ] Nivel (Select: Primaria/Secundaria)
- [ ] Grados que solicita (Checkboxes o Select múltiple)

**Sección 3: Datos de Contacto**
- [ ] Celular (Input, obligatorio) ⭐
  - Ayuda: "Le enviaremos SMS o lo llamaremos"
- [ ] Correo electrónico (Input, opcional)
  - Ayuda: "Si no tiene correo, puede dejarlo en blanco"

**Sección 4: Motivo de Solicitud**
- [ ] Select: Trámite de título, Jubilación, Continuidad estudios, etc.

**Sección 5: Términos y Condiciones**
- [ ] Checkbox "He leído y acepto los Términos"
- [ ] Link a términos (Dialog)
- [ ] Botón "GENERAR SOLICITUD DE BÚSQUEDA" (disabled hasta aceptar)

**Validaciones con Zod**:
- [ ] Todos los campos requeridos
- [ ] DNI válido (8 dígitos)
- [ ] Celular válido (9 dígitos)
- [ ] Email válido (si proporcionado)
- [ ] Año entre 1985-2012

### 🟦 FASE 5: Confirmación con Código (3h)
- [ ] Pantalla de éxito
- [ ] Mostrar código grande: `S-2025-001234`
- [ ] Mensaje: "¡Solicitud registrada!"
- [ ] Instrucciones:
  ```
  Guarde este código para consultar el estado.
  
  Próximo paso: Nuestro equipo de Oficina de Actas 
  iniciará la búsqueda del acta en 3-5 días hábiles.
  
  Le notificaremos por SMS/correo.
  ```
- [ ] Botón: "Consultar Estado Ahora"
- [ ] Botón: "Volver al inicio"

### 🟦 FASE 6: Consulta de Estado ⭐⭐⭐ (8h)

**Pantalla de Consulta**:
- [ ] Input: Código de seguimiento
- [ ] Input: DNI del estudiante
- [ ] Botón: "Consultar"

**Pantalla de Resultado** (actualización en tiempo real):
- [ ] Card con información de la solicitud
- [ ] Timeline visual de estados
- [ ] Estado actual destacado
- [ ] Polling cada 30 segundos ⭐

**Estados a mostrar** (13 + diseño específico):

1. **EN_BUSQUEDA**
   - Mensaje: "Su solicitud fue registrada. Nuestro equipo está localizando su acta."
   - Icono: Loading spinner

2. **ACTA_ENCONTRADA_PENDIENTE_PAGO** ⭐
   - Mensaje: "¡Buenas noticias! Encontramos su acta."
   - Instrucciones de pago
   - **Botones de pago visibles**:
     - [ ] "Pagar con Yape/Plin"
     - [ ] "Pagar con Tarjeta"
     - [ ] "Pagar en Efectivo"
   - Monto: S/ 15.00

3. **ACTA_NO_ENCONTRADA**
   - Mensaje: "No pudimos localizar el acta."
   - Posibles causas
   - Recomendaciones
   - Sin pago
   - Badge: "No procedente"

4. **PAGO_VALIDADO**
   - Mensaje: "¡Pago validado! Su certificado está siendo procesado."

5. **EN_PROCESAMIENTO_OCR**
   - Mensaje: "Procesando su certificado con IA..."

6. **EN_VALIDACION_UGEL**
   - Mensaje: "Validando autenticidad con UGEL..."

7. **OBSERVADO_POR_UGEL**
   - Mensaje: "Certificado observado. Requiere correcciones."
   - Mostrar observaciones

8. **EN_REGISTRO_SIAGEC**
   - Mensaje: "Registrando digitalmente..."

9. **EN_FIRMA_DIRECCION**
   - Mensaje: "Esperando firma de la Dirección..."

10. **CERTIFICADO_EMITIDO** ⭐⭐
    - Mensaje: "¡Su certificado está listo!"
    - **Botón grande: "DESCARGAR CERTIFICADO (PDF)"**
    - Información adicional si es retiro físico

11. **ENTREGADO**
    - Mensaje: "Certificado entregado el DD/MM/YYYY"
    - Badge: "Completado"

### 🟦 FASE 7: Pantalla de Pago (6h)

**Opciones de Pago**:

**Opción 1: Yape/Plin**
- [ ] Mostrar QR code
- [ ] Instrucciones:
  ```
  1. Escanea el código QR con tu app
  2. Completa el pago de S/ 15.00
  3. Sube tu captura de pantalla
  ```
- [ ] Componente FileUpload
- [ ] Botón "Enviar Comprobante"
- [ ] Mensaje: "Mesa de Partes validará su pago en 24h"

**Opción 2: Efectivo**
- [ ] Mensaje:
  ```
  Acérquese a ventanilla de UGEL XX:
  
  Dirección: [Dirección]
  Horario: Lunes a Viernes 8:30am - 4:30pm
  Monto: S/ 15.00
  
  Lleve su código: S-2025-XXXXX
  ```

**Opción 3: Tarjeta** (preparado para futuro)
- [ ] Badge: "Próximamente"
- [ ] Deshabilitar por ahora

**Estados del pago**:
- [ ] PENDIENTE: "Esperando pago..."
- [ ] PENDIENTE_VALIDACION: "Comprobante recibido, validando..."
- [ ] VALIDADO: "¡Pago confirmado!"
- [ ] RECHAZADO: "Comprobante rechazado. Intente nuevamente."

### 🟦 FASE 8: Descarga de Certificado (2h)
- [ ] Botón de descarga
- [ ] Descargar PDF desde API
- [ ] Abrir en nueva pestaña
- [ ] Loading state durante descarga
- [ ] Mensaje: "Descarga iniciada"

### 🟦 FASE 9: Responsive Design (4h)
- [ ] Mobile-first
- [ ] Probar en móvil, tablet, desktop
- [ ] Formulario adaptado a pantalla pequeña
- [ ] Timeline vertical en móvil

### 🟦 FASE 10: UX y Animaciones (3h)
- [ ] Transiciones suaves entre pantallas
- [ ] Loading states elegantes
- [ ] Animación en timeline de estados
- [ ] Feedback visual en acciones
- [ ] Toast notifications

---

## 🔄 Actualización en Tiempo Real

**Implementar en consulta de estado**:
```typescript
const { data: solicitud } = useQuery({
  queryKey: ['solicitud', codigo],
  queryFn: () => getSolicitudByCodigo(codigo),
  refetchInterval: 30000, // 30 segundos
  enabled: !!codigo,
});
```

**Mostrar indicador**: "Actualizando... ⟳" (cada 30s)

---

## 🧪 Criterios de Aceptación

- [ ] Landing page atractiva
- [ ] Pop-up de expectativas funciona
- [ ] Formulario completo con todas las validaciones
- [ ] Código se genera y muestra
- [ ] Consulta de estado funciona
- [ ] **Actualización automática cada 30s** ⭐
- [ ] 13 estados se muestran correctamente
- [ ] Pago Yape/Plin funciona
- [ ] Comprobante se sube
- [ ] Certificado se descarga
- [ ] Responsive en mobile
- [ ] Experiencia de usuario fluida

---

## 📱 Flujo Completo Usuario

```
Landing → Pop-up → Tipo Persona → Formulario → Confirmación
                                                      ↓
                              ← Consultar Estado ←  Código
                                      ↓
                                (Polling 30s)
                                      ↓
                          Acta Encontrada → Pagar
                                              ↓
                                        Pago Validado
                                              ↓
                                         Procesando
                                              ↓
                                    Certificado Listo
                                              ↓
                                          Descargar
```

---

## ⚠️ Dependencias

- Sprint 03 - Autenticación (opcional para público)
- Backend Sprint 07 - API de solicitudes
- Backend Sprint 08 - API de pagos
- Backend Sprint 09 - API de certificados

---

**🔗 Siguiente**: [SPRINT_05_DASHBOARD_MESADEPARTES.md](./SPRINT_05_DASHBOARD_MESADEPARTES.md)

