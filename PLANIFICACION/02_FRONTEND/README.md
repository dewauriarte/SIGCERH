# 🎨 MÓDULO FRONTEND - PLANIFICACIÓN DETALLADA

## 📊 Resumen del Módulo

SPA (Single Page Application) con React 19, TypeScript, Vite, shadcn/ui y Tailwind CSS.

---

## 🎯 Objetivos Generales

- ✅ Portal público para solicitud y seguimiento
- ✅ 7 dashboards (uno por rol)
- ✅ Sistema de diseño consistente con shadcn/ui
- ✅ Temas light/dark
- ✅ Actualización en tiempo real (polling/websockets)
- ✅ Responsive design (móvil, tablet, desktop)
- ✅ Performance optimizado (Lighthouse >90)

---

## 📋 Sprints del Frontend (10 total)

| # | Sprint | Duración | Prioridad | Estado | Para Rol |
|---|--------|----------|-----------|--------|----------|
| 01 | [Setup Inicial](./SPRINT_01_SETUP_INICIAL.md) | 2-3 días | 🔴 CRÍTICA | ⬜ | - |
| 02 | [Sistema de Diseño](./SPRINT_02_SISTEMA_DISENO.md) | 3-4 días | 🔴 CRÍTICA | ⬜ | - |
| 03 | [Autenticación Frontend](./SPRINT_03_AUTENTICACION.md) | 3 días | 🔴 CRÍTICA | ⬜ | Todos |
| 04 | [Portal Público](./SPRINT_04_PORTAL_PUBLICO.md) | 5-6 días | 🔴 CRÍTICA | ⬜ | PUBLICO |
| 05 | [Dashboard Mesa de Partes](./SPRINT_05_DASHBOARD_MESADEPARTES.md) | 4 días | 🟡 ALTA | ⬜ | MESA_DE_PARTES |
| 06 | [Dashboard Editor](./SPRINT_06_DASHBOARD_EDITOR.md) | 5-6 días | 🔴 CRÍTICA | ⬜ | EDITOR |
| 07 | [Dashboard UGEL](./SPRINT_07_DASHBOARD_UGEL.md) | 3-4 días | 🟡 ALTA | ⬜ | ENCARGADO_UGEL |
| 08 | [Dashboard SIAGEC](./SPRINT_08_DASHBOARD_SIAGEC.md) | 3 días | 🟡 ALTA | ⬜ | ENCARGADO_SIAGEC |
| 09 | [Dashboard Dirección](./SPRINT_09_DASHBOARD_DIRECCION.md) | 3 días | 🟡 ALTA | ⬜ | DIRECCION |
| 10 | [Dashboard Admin](./SPRINT_10_DASHBOARD_ADMIN.md) | 4-5 días | 🟡 ALTA | ⬜ | ADMIN |

---

## 🎨 Pantallas por Rol

### PUBLICO (Sprint 04)
1. Landing page
2. Formulario de solicitud
3. Pop-up gestión de expectativas
4. Confirmación con código
5. Seguimiento de solicitud (consulta por código)
6. Pantalla de pago
7. Descarga de certificado

### MESA_DE_PARTES (Sprint 05)
1. Dashboard principal
2. Lista de solicitudes pendientes de derivación
3. Lista de pagos pendientes de validación
4. Validar pago efectivo
5. Derivar solicitud a Editor
6. Entregar certificados físicos

### EDITOR (Sprint 06) ⭐
1. Dashboard principal
2. Solicitudes asignadas para búsqueda
3. Marcar acta encontrada/no encontrada
4. Subir acta escaneada con metadata
5. **Interfaz de procesamiento OCR** ⭐⭐
6. Revisión y corrección de datos OCR
7. Validación de notas
8. Enviar a UGEL

### ENCARGADO_UGEL (Sprint 07)
1. Dashboard principal
2. Solicitudes pendientes de validación
3. Ver acta física y datos extraídos
4. Aprobar certificado
5. Observar certificado (devolver a Editor)

### ENCARGADO_SIAGEC (Sprint 08)
1. Dashboard principal
2. Solicitudes pendientes de registro
3. Generar código QR y código virtual
4. Registrar digitalmente
5. Enviar a Dirección

### DIRECCION (Sprint 09)
1. Dashboard principal
2. Solicitudes pendientes de firma
3. Vista previa del certificado
4. Firmar digitalmente o marcar para firma manuscrita
5. Autorizar entrega

### ADMIN (Sprint 10)
1. Dashboard principal con estadísticas
2. Gestión de usuarios
3. Gestión de roles y permisos
4. Configuración institucional
5. Gestión de niveles, grados, áreas curriculares
6. Plantillas de currículo
7. Reportes y exportación
8. Auditoría

---

## 🔧 Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.x | Framework UI |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool |
| shadcn/ui | latest | Componentes UI |
| Tailwind CSS | 3.x | Styling |
| Zustand | 4.x | Estado global |
| TanStack Query | 5.x | Server state |
| React Hook Form | 7.x | Formularios |
| Zod | 3.x | Validación |
| React Router | 6.x | Routing |
| Recharts | 2.x | Gráficos |
| Lucide React | latest | Iconos |

---

## 🎨 Sistema de Diseño

### Temas
- ✅ Light mode
- ✅ Dark mode
- ✅ Persistencia en localStorage
- ✅ Toggle en header

### Colores (Tailwind)
```
Primary: blue-600
Secondary: slate-600
Success: green-600
Warning: yellow-600
Error: red-600
```

### Componentes shadcn/ui
- Button
- Card
- Input
- Select
- Table
- Dialog
- Tabs
- Badge
- Alert
- Form
- Toast
- Dropdown Menu
- Sheet (sidebar)
- Avatar
- Skeleton (loading)

---

## 🔄 Actualización en Tiempo Real

### Estrategia
1. **Polling** (Sprint 03):
   - Consultar API cada 30 segundos
   - TanStack Query con refetchInterval
   - Solo para vistas activas

2. **WebSockets** (Opcional - futuro):
   - Socket.io cliente
   - Eventos en tiempo real

### Estados que se actualizan
- Solicitudes (cambios de estado)
- Notificaciones
- Dashboard (estadísticas)

---

## 📱 Responsive Design

### Breakpoints (Tailwind)
```
sm: 640px   (móvil grande)
md: 768px   (tablet)
lg: 1024px  (laptop)
xl: 1280px  (desktop)
2xl: 1536px (pantallas grandes)
```

### Prioridad
- Mobile-first design
- Tablet optimizado
- Desktop full experience

---

## 🚀 Performance

### Objetivos Lighthouse
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >90

### Optimizaciones
- Code splitting por ruta
- Lazy loading de componentes
- Imágenes optimizadas (WebP)
- Caché de assets
- Bundle size <300KB (inicial)

---

## 🗂️ Estructura de Código

```
frontend/
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/       # Layout components
│   │   └── shared/       # Shared components
│   │
│   ├── pages/            # Páginas por rol
│   │   ├── public/       # Portal público
│   │   ├── auth/         # Login/Register
│   │   ├── mesa-partes/  # Dashboard Mesa de Partes
│   │   ├── editor/       # Dashboard Editor
│   │   ├── ugel/         # Dashboard UGEL
│   │   ├── siagec/       # Dashboard SIAGEC
│   │   ├── direccion/    # Dashboard Dirección
│   │   └── admin/        # Dashboard Admin
│   │
│   ├── hooks/            # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useSolicitudes.ts
│   │   └── useTheme.ts
│   │
│   ├── stores/           # Zustand stores
│   │   ├── authStore.ts
│   │   └── themeStore.ts
│   │
│   ├── services/         # API calls
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   └── solicitudes.service.ts
│   │
│   ├── lib/              # Utilidades
│   │   ├── utils.ts
│   │   └── validators.ts
│   │
│   ├── types/            # TypeScript types
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 📊 Progreso General

### Cobertura de Roles (7/7)
- [ ] PUBLICO - Sprint 04
- [ ] MESA_DE_PARTES - Sprint 05
- [ ] EDITOR - Sprint 06
- [ ] ENCARGADO_UGEL - Sprint 07
- [ ] ENCARGADO_SIAGEC - Sprint 08
- [ ] DIRECCION - Sprint 09
- [ ] ADMIN - Sprint 10

---

## ⚠️ Dependencias

- Backend completo (Sprint 00-10 del Backend)
- API REST funcionando
- Endpoints documentados

---

**📝 Última actualización**: 31/10/2025  
**👤 Actualizado por**: Sistema  
**📌 Versión**: 1.0  
**🔗 Volver a**: [PLANIFICACION/README.md](../README.md)  
**🔗 Comenzar con**: [SPRINT_01_SETUP_INICIAL.md](./SPRINT_01_SETUP_INICIAL.md)

