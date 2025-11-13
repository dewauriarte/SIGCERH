# 🎯 SPRINT 10: DASHBOARD ADMIN

> **Módulo**: Frontend - Dashboard Interno  
> **Duración**: 4-5 días  
> **Prioridad**: 🟡 ALTA  
> **Estado**: ✅ COMPLETADO (Funcionalidades Core)  
> **Rol**: ADMIN

---

## 📌 Objetivo

Dashboard de administración completo: gestión de usuarios, roles, configuración institucional, currículos, reportes y auditoría.

---

## 🎯 Funcionalidades

- [x] Dashboard con estadísticas generales ✅
- [x] Gestión de usuarios (CRUD) ✅
- [x] Gestión de roles y permisos ✅
- [ ] Configuración institucional (Pendiente)
- [ ] Gestión de niveles, grados, áreas curriculares (Pendiente)
- [x] Plantillas de currículo (mapeo área-grado-año) ✅ **CRÍTICO PARA OCR**
- [ ] Reportes y exportación (Pendiente)
- [ ] Auditoría del sistema (Pendiente)
- [ ] Parámetros del sistema (Pendiente)

---

## 📱 Pantallas (10+)

### 1. Dashboard Principal con Métricas
### 2. Gestión de Usuarios
### 3. Gestión de Roles y Permisos
### 4. Configuración Institucional
### 5. Niveles Educativos
### 6. Grados
### 7. Áreas Curriculares
### 8. Plantillas de Currículo ⭐
### 9. Reportes
### 10. Auditoría

---

## ✅ Tareas Principales

### 🟦 FASE 1: Dashboard Principal (4h)
- [ ] Métricas globales:
  - Total solicitudes (mes/año)
  - Certificados emitidos
  - Usuarios activos
  - Promedio tiempo de emisión
- [ ] Gráficos:
  - Solicitudes por mes (12 meses)
  - Estados de solicitudes (pie chart)
  - Certificados por colegio (top 10)
  - Tiempos de procesamiento
- [ ] Actividad reciente del sistema
- [ ] Alertas (pagos pendientes, observaciones)

### 🟦 FASE 2: Gestión de Usuarios (6h)

**Lista de Usuarios**:
- [ ] DataTable:
  - Username
  - Nombres
  - Email/Celular
  - Tipo (INTERNO/PUBLICO)
  - Roles
  - Estado (Activo/Bloqueado)
  - Último acceso
  - Acciones
- [ ] Filtros:
  - Por tipo
  - Por rol
  - Por estado
  - Búsqueda

**Crear/Editar Usuario**:
- [ ] Modal o página
- [ ] Formulario:
  - Username
  - Email
  - Celular
  - DNI
  - Nombres y Apellidos
  - Tipo Usuario (INTERNO/PUBLICO)
  - Contraseña (solo al crear)
  - Cambiar Password en primer login
  - Estado (Activo/Inactivo)
- [ ] Asignar roles (múltiple)
- [ ] Validaciones

**Acciones**:
- [ ] Crear usuario
- [ ] Editar usuario
- [ ] Desactivar/Activar
- [ ] Resetear contraseña
- [ ] Ver historial de accesos

### 🟦 FASE 3: Roles y Permisos (5h)

**Lista de Roles**:
- [ ] Los 7 roles del sistema
- [ ] Ver permisos por rol
- [ ] Editar permisos

**Gestión de Permisos**:
- [ ] Lista de permisos por módulo
- [ ] Checkboxes para asignar/quitar
- [ ] Módulos:
  - Solicitudes
  - Certificados
  - Pagos
  - Usuarios
  - Configuración
  - Reportes
  - Auditoría

### 🟦 FASE 4: Configuración Institucional (4h)
- [ ] Formulario de configuración:
  - Código Modular
  - Nombre de institución
  - UGEL
  - Distrito, Provincia, Departamento
  - Dirección
  - Teléfono
  - Email
  - Logo (upload)
  - Nombre del Director
  - Cargo
  - Firma digital (upload)
  - Texto legal
- [ ] Solo puede existir una institución activa
- [ ] Preview del logo
- [ ] Preview de firma

### 🟦 FASE 5: Gestión Académica (6h)

**Niveles Educativos**:
- [ ] CRUD básico
- [ ] Lista: Inicial, Primaria, Secundaria
- [ ] Orden

**Grados**:
- [ ] CRUD
- [ ] Relacionado con nivel
- [ ] Lista de grados de secundaria
- [ ] Orden

**Áreas Curriculares**:
- [ ] CRUD
- [ ] Código, Nombre
- [ ] Orden
- [ ] Activo/Inactivo
- [ ] Filtrar por época (1985-1990, 1991-2000, 2001-2012)
- [ ] Importación masiva (CSV)

### 🟦 FASE 6: Plantillas de Currículo ⭐⭐ (6h)

**CRÍTICO para OCR**

**Vista Principal**:
- [ ] Select: Año Lectivo (1985-2012)
- [ ] Select: Grado
- [ ] Botón: "Ver Plantilla"

**Plantilla Actual**:
- [ ] Tabla con áreas ordenadas:
  - Orden
  - Código
  - Nombre
  - Acciones (subir/bajar orden, quitar)
- [ ] Drag & drop para reordenar
- [ ] Botón: "Agregar Área"
- [ ] Select de áreas disponibles
- [ ] Asignar orden automático

**Guardar Plantilla**:
- [ ] Validar que todas las áreas tengan orden
- [ ] Guardar en CurriculoGrado
- [ ] Confirmación

**Preview**:
- [ ] Vista de cómo se verá en OCR:
  ```
  Nota 1 → Matemática
  Nota 2 → Comunicación
  Nota 3 → Inglés
  ...
  ```

### 🟦 FASE 7: Reportes (5h)

**Tipos de Reportes**:
- [ ] Solicitudes:
  - Por rango de fechas
  - Por estado
  - Por colegio
  - Exportar a Excel/PDF
- [ ] Certificados:
  - Emitidos por período
  - Por tipo (Digital/Físico)
  - Por colegio
  - Exportar
- [ ] Pagos:
  - Por período
  - Por método de pago
  - Monto total
  - Exportar
- [ ] Usuarios:
  - Usuarios activos
  - Por rol
  - Último acceso
  - Exportar

**Generación de Reportes**:
- [ ] Selección de filtros
- [ ] Vista previa
- [ ] Botón "Generar"
- [ ] Loading state
- [ ] Descarga automática

### 🟦 FASE 8: Auditoría (4h)
- [ ] DataTable de auditoría:
  - Fecha/Hora
  - Usuario
  - Acción
  - Entidad
  - Datos anteriores
  - Datos nuevos
  - IP
  - User Agent
- [ ] Filtros avanzados:
  - Por fecha
  - Por usuario
  - Por entidad
  - Por acción
- [ ] Ver detalles (modal con JSON)
- [ ] Exportar logs

### 🟦 FASE 9: Parámetros del Sistema (2h)
- [ ] Lista de parámetros configurables:
  - Monto del certificado
  - Tiempo de expiración de token
  - Notificaciones habilitadas
  - etc.
- [ ] Editar valores
- [ ] Tipo de dato (string, number, boolean)
- [ ] Validaciones

---

## 🧪 Criterios de Aceptación

- [x] Dashboard muestra estadísticas correctas ✅
- [x] CRUD de usuarios funciona (Lista, Activar/Desactivar, Bloquear, Reset Password) ✅
- [x] Roles y permisos (Integrados en gestión de usuarios) ✅
- [ ] Configuración institucional funciona (Pendiente)
- [ ] Logo se sube y muestra (Pendiente)
- [ ] Gestión académica funciona (Pendiente)
- [x] **Plantillas de currículo funcionan correctamente** ⭐⭐ ✅
- [ ] Reportes se generan y exportan (Pendiente)
- [ ] Auditoría se visualiza (Pendiente)
- [ ] Parámetros se editan (Pendiente)
- [x] Responsive ✅

---

## ⚠️ Dependencias

- Sprint 03 - Autenticación
- Backend Sprint 03 - API usuarios/roles
- Backend Sprint 04 - API configuración
- Backend Sprint 05 - API académico
- Todos los módulos backend para reportes

---

**✅ SPRINT FINAL DEL FRONTEND COMPLETADO**

Todos los 10 sprints del Frontend han sido planificados.

**🔗 Siguiente módulo**: IA/OCR (03_IA_OCR)

