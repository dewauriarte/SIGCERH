# 🎯 SPRINT 02: SISTEMA DE DISEÑO

> **Módulo**: Frontend - Design System  
> **Duración**: 3-4 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ✅ COMPLETADO

---

## 📌 Objetivo

Crear sistema de diseño completo con componentes base, layouts, temas light/dark, y guía de estilo consistente.

---

## 🎯 Metas del Sprint

- [x] Temas light/dark funcionando ⭐
- [x] Toggle de tema persistente
- [x] Layout principal (header, sidebar, footer)
- [x] Componentes base personalizados
- [x] Sistema de colores definido
- [x] Tipografía consistente
- [x] Animaciones y transiciones
- [x] Loading states
- [x] Error states

---

## ✅ Tareas Principales

### 🟦 FASE 1: Temas Light/Dark ⭐⭐ (4h) ✅
- [x] Configurar `themeStore.ts` con Zustand
- [x] Hook `useTheme()` custom
- [x] Toggle en header
- [x] Persistir en localStorage
- [x] Aplicar clase `dark` a `<html>`
- [x] Probar todos los componentes en ambos temas

### 🟦 FASE 2: Layout Principal (4h) ✅
- [x] AppLayout component
- [x] Header component
  - [x] Logo
  - [x] Navegación
  - [x] Toggle tema
  - [x] User menu
- [x] Sidebar component (para dashboards internos)
  - [x] Menú por rol (7 roles configurados)
  - [x] Colapsable
  - [x] Active state
- [x] Footer component (PublicLayout)
- [x] Container responsive

### 🟦 FASE 3: Componentes Base (8h) ✅

**Instalar y personalizar componentes shadcn/ui**:
- [x] Button (variantes: default, outline, ghost, destructive)
- [x] Card (con header, content, footer)
- [x] Input (text, email, password, search)
- [x] Select / ComboBox
- [x] Textarea
- [x] Checkbox
- [x] Radio Group
- [x] Switch
- [x] Label
- [x] Form (con React Hook Form integration)
- [x] Table (con sorting, pagination)
- [x] Dialog / Modal
- [x] Alert / Alert Dialog
- [x] Toast / Sonner
- [x] Tabs
- [x] Badge
- [x] Avatar
- [x] Skeleton (loading)
- [x] Dropdown Menu
- [x] Sheet (sidebar mobile)
- [x] Separator

### 🟦 FASE 4: Componentes Custom (6h) ✅
- [x] PageHeader (título, breadcrumbs, acciones)
- [x] StatsCard (para dashboards con trends)
- [x] DataTable (wrapper de tabla con filtros, sorting, pagination)
- [x] StatusBadge (17 estados del sistema configurados)
- [x] EmptyState (cuando no hay datos)
- [x] ErrorState (cuando falla algo, con retry)
- [x] LoadingSpinner (con variantes sm/md/lg y fullScreen)
- [x] SearchBar (con debounce)
- [x] FilterPanel (con Sheet lateral)
- [x] Pagination (completa con page size)
- [x] FileUpload (drag & drop, múltiples archivos, validación)

### 🟦 FASE 5: Sistema de Colores (2h) ✅
- [x] Definir paleta en `tailwind.config.js` (primary-blue, success-green, warning-orange, error-red)
- [x] Variables CSS en ambos temas (light/dark completos)
- [x] Documentar uso de colores (colores personalizados con escalas 50-950)

### 🟦 FASE 6: Tipografía (2h) ✅
- [x] Configurar fuentes (Inter para UI, JetBrains Mono para código)
- [x] Clases de utilidad para títulos (h1-h6 con responsive)
- [x] Clases para párrafos (leading mejorado)
- [x] Clases para texto auxiliar (antialiasing, font features)

### 🟦 FASE 7: Animaciones (2h) ✅
- [x] Transiciones suaves (all, height, spacing)
- [x] Animaciones de entrada/salida (fade, slide, zoom)
- [x] Loading animations (spin, shimmer, bounce-subtle)
- [x] Hover effects (scale, translate, shadow)

### 🟦 FASE 8: Responsive Design (4h) ✅
- [x] Mobile-first approach (grid responsive, flex wrap)
- [x] Breakpoints consistentes (sm, md, lg, xl configurados)
- [x] Probar en diferentes tamaños (componentes probados)
- [x] Menú mobile (Sheet component para sidebar mobile)

### 🟦 FASE 9: Storybook/Documentación (3h - opcional) ✅
- [x] Galería de componentes en página interna (ComponentsExamplePage.tsx)
- [x] Ejemplos de uso (todos los componentes demostrados)
- [x] Código de ejemplo (implementaciones reales en Dashboard)

---

## 🎨 Paleta de Colores (Tailwind)

### Light Mode
```
Primary: blue-600
Secondary: slate-700
Background: white
Surface: slate-50
Text: slate-900
Border: slate-200
```

### Dark Mode
```
Primary: blue-500
Secondary: slate-300
Background: slate-950
Surface: slate-900
Text: slate-50
Border: slate-800
```

---

## 📐 Layouts por Tipo de Usuario

### Layout Público
- Header simple (logo + login)
- Sin sidebar
- Footer institucional

### Layout Interno (Staff)
- Header completo (logo + nav + user + theme toggle)
- Sidebar con menú por rol
- Footer simple

---

## 🧪 Criterios de Aceptación

- [x] Toggle de tema funciona
- [x] Tema persiste al recargar
- [x] Todos los componentes se ven bien en ambos temas
- [x] Layout responsive funciona
- [x] Sidebar colapsa en móvil
- [x] Componentes consistentes en toda la app
- [x] Animaciones suaves
- [x] Loading states visibles
- [x] Error states informativos

---

## 🎯 Componentes shadcn/ui a Instalar

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
```

---

## ⚠️ Dependencias

- Sprint 01 - Setup inicial completado

---

## 📦 IMPLEMENTACIÓN COMPLETADA

### Componentes Custom Creados

Todos los componentes están disponibles en `src/components/custom/`:

1. **PageHeader** - Cabecera de página con título, descripción, breadcrumbs y acciones
2. **StatsCard** - Tarjetas de estadísticas con iconos, valores, tendencias y colores personalizables
3. **StatusBadge** - Badges para los 17 estados del sistema de certificados
4. **EmptyState** - Estado vacío con icono, título, descripción y acción opcional
5. **ErrorState** - Estado de error con mensaje y botón de reintento
6. **LoadingSpinner** - Spinner de carga con variantes (sm/md/lg) y modo fullScreen
7. **SearchBar** - Barra de búsqueda con debounce y botón de limpiar
8. **FilterPanel** - Panel de filtros lateral con Sheet
9. **Pagination** - Paginación completa con cambio de tamaño de página
10. **FileUpload** - Carga de archivos con drag & drop, múltiples archivos y validación
11. **DataTable** - Tabla de datos con sorting, búsqueda, paginación y filtros

### Configuración de Navegación por Rol

Archivo: `src/config/navigation.ts`

Se implementaron 7 configuraciones de navegación completas:

1. **PUBLICO** - Usuario que solicita certificados
   - Nueva Solicitud, Mis Solicitudes, Mis Certificados, Mis Pagos, Mi Perfil

2. **MESA_DE_PARTES** - Recepción y validación inicial
   - Solicitudes Recibidas, Validar Datos, Derivar a Editor, Validar Pagos, Entregas

3. **EDITOR** - Busca, procesa y digitaliza
   - Expedientes Asignados, Procesamiento OCR, Certificados, Archivo de Actas

4. **ENCARGADO_UGEL** - Valida autenticidad
   - Validación Pendientes, En Revisión, Aprobar/Observar, Archivo Histórico, Reportes

5. **ENCARGADO_SIAGEC** - Registra digitalmente
   - Registro Digital, Generar Códigos QR, Validación Técnica, Repositorio Digital

6. **DIRECCION** - Firma y autoriza
   - Firma de Certificados (Digital/Física), Certificados Firmados, Reportes, Auditoría

7. **ADMIN** - Administrador del sistema
   - Usuarios, Solicitudes, Certificados, Configuración Completa, Sistema, Reportes

### Hook useRole

Archivo: `src/hooks/useRole.ts`

Utilidad para gestión de roles con:
- Detección automática del rol del usuario
- Flags booleanos para cada rol (isAdmin, isEditor, etc.)
- Permisos granulares (canManageUsers, canValidatePayments, etc.)
- Función `hasRole()` para verificar múltiples roles

### Estados del Sistema

17 estados completos implementados en StatusBadge:
- EN_BUSQUEDA, DERIVADO_A_EDITOR, ACTA_ENCONTRADA, ACTA_NO_ENCONTRADA
- PENDIENTE_PAGO, PAGO_VALIDADO, EN_PROCESAMIENTO
- EN_VALIDACION_UGEL, APROBADO_UGEL, OBSERVADO_UGEL
- EN_SIAGEC, OBSERVADO_SIAGEC, EN_FIRMA_FINAL
- CERTIFICADO_EMITIDO, OBSERVADO_DIRECCION, ENTREGADO, RECHAZADO

### Layouts Implementados

1. **RootLayout** - Layout raíz con ThemeProvider y Toaster
2. **ProtectedLayout** - Layout para usuarios autenticados con:
   - Sidebar colapsable con navegación por rol
   - Header con breadcrumbs, búsqueda (Cmd+K), toggle de tema
   - Búsqueda global con Command palette
3. **PublicLayout** - Layout para páginas públicas con:
   - Header simple con navegación y login
   - Footer institucional completo

### Sistema de Colores

Paleta personalizada en `tailwind.config.js`:
- **primary-blue** (50-950) - Color principal del sistema
- **success-green** (50-950) - Estados exitosos
- **warning-orange** (50-950) - Advertencias y pendientes
- **error-red** (50-950) - Errores y rechazos

### Tipografía

- **Fuente principal**: Inter (display y UI)
- **Fuente monoespaciada**: JetBrains Mono (código)
- Escalas responsive para h1-h6
- Antialiasing y font features optimizados

### Animaciones

Keyframes personalizados:
- fade-in/fade-out
- slide-in-from-top/bottom/left/right
- zoom-in/zoom-out
- bounce-subtle
- shimmer (para loading states)

### Utilidades CSS

- scrollbar-hide: Ocultar scrollbar manteniendo funcionalidad
- scrollbar-thin: Scrollbar personalizado delgado
- text-balance: Balance de texto mejorado

### Página de Demostración

`src/pages/ComponentsExamplePage.tsx` - Galería completa de todos los componentes con ejemplos de uso en tabs:
- Stats Cards
- Estados (Loading, Error, Empty, Status Badges)
- Data Table completa
- Formularios (FileUpload, SearchBar, FilterPanel)

### Dashboard Mejorado

`src/pages/DashboardPage.tsx` actualizado con:
- PageHeader personalizado con acciones por rol
- StatsCard con trending
- Estadísticas específicas por rol (Editor, UGEL, etc.)
- StatusBadge en actividad reciente
- Colores personalizados del sistema

---

## 🎉 SPRINT COMPLETADO

✅ Todos los componentes base de shadcn/ui instalados (21 componentes)  
✅ 11 componentes custom implementados  
✅ 7 configuraciones de navegación por rol  
✅ Sistema de colores completo con 4 paletas  
✅ Tipografía optimizada y responsive  
✅ Animaciones suaves en todo el sistema  
✅ Layouts diferenciados (público/protegido)  
✅ Temas light/dark con persistencia  
✅ 17 estados del sistema configurados  
✅ Página de demostración completa  

**Estado**: Sistema de diseño completamente implementado y listo para Sprint 03 🚀

---

**🔗 Siguiente**: [SPRINT_03_AUTENTICACION.md](./SPRINT_03_AUTENTICACION.md)

