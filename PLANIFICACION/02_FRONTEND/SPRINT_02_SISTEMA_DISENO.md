# 🎯 SPRINT 02: SISTEMA DE DISEÑO

> **Módulo**: Frontend - Design System  
> **Duración**: 3-4 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ⬜ No iniciado

---

## 📌 Objetivo

Crear sistema de diseño completo con componentes base, layouts, temas light/dark, y guía de estilo consistente.

---

## 🎯 Metas del Sprint

- [ ] Temas light/dark funcionando ⭐
- [ ] Toggle de tema persistente
- [ ] Layout principal (header, sidebar, footer)
- [ ] Componentes base personalizados
- [ ] Sistema de colores definido
- [ ] Tipografía consistente
- [ ] Animaciones y transiciones
- [ ] Loading states
- [ ] Error states

---

## ✅ Tareas Principales

### 🟦 FASE 1: Temas Light/Dark ⭐⭐ (4h)
- [ ] Configurar `themeStore.ts` con Zustand
- [ ] Hook `useTheme()` custom
- [ ] Toggle en header
- [ ] Persistir en localStorage
- [ ] Aplicar clase `dark` a `<html>`
- [ ] Probar todos los componentes en ambos temas

### 🟦 FASE 2: Layout Principal (4h)
- [ ] AppLayout component
- [ ] Header component
  - [ ] Logo
  - [ ] Navegación
  - [ ] Toggle tema
  - [ ] User menu
- [ ] Sidebar component (para dashboards internos)
  - [ ] Menú por rol
  - [ ] Colapsable
  - [ ] Active state
- [ ] Footer component
- [ ] Container responsive

### 🟦 FASE 3: Componentes Base (8h)

**Instalar y personalizar componentes shadcn/ui**:
- [ ] Button (variantes: default, outline, ghost, destructive)
- [ ] Card (con header, content, footer)
- [ ] Input (text, email, password, search)
- [ ] Select / ComboBox
- [ ] Textarea
- [ ] Checkbox
- [ ] Radio Group
- [ ] Switch
- [ ] Label
- [ ] Form (con React Hook Form integration)
- [ ] Table (con sorting, pagination)
- [ ] Dialog / Modal
- [ ] Alert / Alert Dialog
- [ ] Toast / Sonner
- [ ] Tabs
- [ ] Badge
- [ ] Avatar
- [ ] Skeleton (loading)
- [ ] Dropdown Menu
- [ ] Sheet (sidebar mobile)
- [ ] Separator

### 🟦 FASE 4: Componentes Custom (6h)
- [ ] PageHeader (título, breadcrumbs, acciones)
- [ ] StatsCard (para dashboards)
- [ ] DataTable (wrapper de tabla con filtros)
- [ ] StatusBadge (para estados de solicitud)
- [ ] EmptyState (cuando no hay datos)
- [ ] ErrorState (cuando falla algo)
- [ ] LoadingSpinner
- [ ] SearchBar
- [ ] FilterPanel
- [ ] Pagination
- [ ] FileUpload

### 🟦 FASE 5: Sistema de Colores (2h)
- [ ] Definir paleta en `tailwind.config.js`
- [ ] Variables CSS en ambos temas
- [ ] Documentar uso de colores

### 🟦 FASE 6: Tipografía (2h)
- [ ] Configurar fuentes (Inter, Roboto, etc.)
- [ ] Clases de utilidad para títulos (h1-h6)
- [ ] Clases para párrafos
- [ ] Clases para texto auxiliar

### 🟦 FASE 7: Animaciones (2h)
- [ ] Transiciones suaves
- [ ] Animaciones de entrada/salida
- [ ] Loading animations
- [ ] Hover effects

### 🟦 FASE 8: Responsive Design (4h)
- [ ] Mobile-first approach
- [ ] Breakpoints consistentes
- [ ] Probar en diferentes tamaños
- [ ] Menú mobile (hamburger)

### 🟦 FASE 9: Storybook/Documentación (3h - opcional)
- [ ] Galería de componentes en página interna
- [ ] Ejemplos de uso
- [ ] Código de ejemplo

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

- [ ] Toggle de tema funciona
- [ ] Tema persiste al recargar
- [ ] Todos los componentes se ven bien en ambos temas
- [ ] Layout responsive funciona
- [ ] Sidebar colapsa en móvil
- [ ] Componentes consistentes en toda la app
- [ ] Animaciones suaves
- [ ] Loading states visibles
- [ ] Error states informativos

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

**🔗 Siguiente**: [SPRINT_03_AUTENTICACION.md](./SPRINT_03_AUTENTICACION.md)

