# 🎯 SPRINT 01: SETUP INICIAL DEL PROYECTO FRONTEND

> **Módulo**: Frontend - Setup  
> **Duración**: 2-3 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: 🔄 En progreso (Fases 1-4 completadas)

---

## 📌 Objetivo

Inicializar proyecto React con Vite, TypeScript, Tailwind CSS, shadcn/ui, configurar routing, estado global y estructura de carpetas profesional.

---

## 🎯 Metas del Sprint

- [x] Proyecto Vite + React + TypeScript funcionando
- [x] Tailwind CSS configurado
- [x] shadcn/ui instalado y configurado
- [x] React Router configurado
- [ ] Zustand configurado (estado global)
- [ ] TanStack Query configurado (server state)
- [ ] Axios configurado con interceptors
- [ ] ESLint + Prettier configurados
- [ ] Hot reload funcionando

---

## ✅ Tareas Principales

### ✅ FASE 1: Inicialización (30 min)
- [x] Crear proyecto con Vite
  ```bash
  npm create vite@latest frontend -- --template react-ts
  cd frontend
  npm install
  ```
- [x] Verificar que funciona: `npm run dev`

### ✅ FASE 2: Tailwind CSS (1h)
- [x] Instalar Tailwind CSS
- [x] Configurar `tailwind.config.js`
- [x] Configurar `postcss.config.js`
- [x] Agregar directivas a CSS global
- [x] Probar con clases de Tailwind

### ✅ FASE 3: shadcn/ui (2h)
- [x] Instalar shadcn/ui CLI
- [x] Ejecutar `npx shadcn-ui@latest init`
- [x] Configurar tema base (light + dark)
- [x] Instalar componentes iniciales:
  - [x] button
  - [x] card
  - [x] input
  - [x] form
  - [x] sonner (reemplazo de toast)
- [x] Probar componentes

### ✅ FASE 4: React Router (1h)
- [x] Instalar `react-router-dom`
- [x] Crear estructura básica de rutas
- [x] Rutas públicas vs protegidas
- [x] Layout base

### 🟦 FASE 5: Estado Global (2h)
- [ ] Instalar Zustand
- [ ] Crear `authStore.ts`
- [ ] Crear `themeStore.ts`
- [ ] Probar stores 

### 🟦 FASE 6: Server State (2h)
- [ ] Instalar TanStack Query
- [ ] Configurar QueryClient
- [ ] Crear query/mutation base

### 🟦 FASE 7: API Client (3h)
- [ ] Instalar Axios
- [ ] Configurar instancia base
- [ ] Interceptor para JWT
- [ ] Interceptor para errores
- [ ] Variables de entorno

### 🟦 FASE 8: Formularios (1h)
- [ ] Instalar React Hook Form
- [ ] Instalar Zod
- [ ] Ejemplo básico

### 🟦 FASE 9: Utilidades (2h)
- [ ] Configurar path aliases (@/)
- [ ] Funciones utils comunes
- [ ] Formatters (fechas, moneda)

### 🟦 FASE 10: Estructura de Carpetas (1h)
- [ ] Crear carpetas:
  - components/ui/
  - components/layout/
  - pages/
  - hooks/
  - stores/
  - services/
  - lib/
  - types/

### 🟦 FASE 11: ESLint + Prettier (1h)
- [ ] Configurar ESLint
- [ ] Configurar Prettier
- [ ] Scripts en package.json

### 🟦 FASE 12: Testing Setup (2h)
- [ ] Instalar Vitest
- [ ] Instalar React Testing Library
- [ ] Configurar test environment
- [ ] Test de ejemplo

---

## 🔧 Dependencias a Instalar

```bash
# Core
npm install react-router-dom
npm install zustand
npm install @tanstack/react-query
npm install axios
npm install react-hook-form zod @hookform/resolvers

# UI
npm install -D tailwindcss postcss autoprefixer
npx shadcn-ui@latest init

# Icons
npm install lucide-react

# Utils
npm install clsx tailwind-merge
npm install date-fns

# Dev
npm install -D @types/node
npm install -D eslint prettier
npm install -D vitest @testing-library/react
```

---

## 🧪 Criterios de Aceptación

- [x] Proyecto inicia sin errores
- [x] Tailwind CSS funciona
- [x] shadcn/ui componentes visibles
- [x] Routing funciona
- [ ] Stores de Zustand funcionan
- [ ] TanStack Query configurado
- [ ] Axios hace llamadas a API
- [x] Hot reload funciona
- [x] Build funciona: `npm run build`

---

## ⚠️ Dependencias

- Node.js 20 LTS instalado
- Backend corriendo en localhost:5000

---

**🔗 Siguiente**: [SPRINT_02_SISTEMA_DISENO.md](./SPRINT_02_SISTEMA_DISENO.md)

