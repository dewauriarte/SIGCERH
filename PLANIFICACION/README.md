# 📋 PLANIFICACIÓN MAESTRA - SISTEMA SIGCERH

## 🎯 Visión General del Proyecto

Sistema completo de gestión de certificados históricos (1985-2012) desarrollado con arquitectura modular y profesional.

---

## 📊 Estado General del Proyecto

| Módulo | Total Sprints | Planificados | En Progreso | Pendientes | Estado |
|--------|---------------|-------------|-------------|------------|--------|
| 00_INFRAESTRUCTURA | 2 | 2 | 0 | 0 | ✅ Planificado |
| 01_BACKEND | 11 | 11 | 0 | 0 | ✅ Planificado |
| 02_FRONTEND | 10 | 10 | 0 | 0 | ✅ Planificado |
| 03_IA_OCR | 4 | 4 | 0 | 0 | ✅ Planificado |
| 04_INTEGRACION | 3 | 3 | 0 | 0 | ✅ Planificado |
| 05_DESPLIEGUE | 3 | 3 | 0 | 0 | ✅ Planificado |
| **TOTAL** | **33** | **33** | **0** | **0** | **✅ 100% PLANIFICADO** |

---

## 🗂️ Estructura de Carpetas

```
PLANIFICACION/
├── README.md (Este archivo - índice maestro)
├── ARQUITECTURA_SISTEMA.md (Diseño técnico general)
│
├── 00_INFRAESTRUCTURA/ ✅
│   ├── README.md ✅
│   ├── SPRINT_01_ENTORNO_DESARROLLO.md ✅
│   └── SPRINT_02_SERVIDOR_PRODUCCION.md ✅
│
├── 01_BACKEND/
│   ├── SPRINT_00_BASE_DE_DATOS.md ✅
│   ├── SPRINT_01_SETUP_INICIAL.md ✅
│   ├── SPRINT_02_PRISMA_ORM.md ✅
│   ├── SPRINT_03_AUTENTICACION_SEGURIDAD.md
│   ├── SPRINT_04_CONFIGURACION_INSTITUCIONAL.md
│   ├── SPRINT_05_MODULO_ACADEMICO.md
│   ├── SPRINT_06_MODULO_ACTAS_FISICAS.md
│   ├── SPRINT_07_MODULO_SOLICITUDES.md
│   ├── SPRINT_08_MODULO_PAGOS.md
│   ├── SPRINT_09_MODULO_CERTIFICADOS.md
│   └── SPRINT_10_MODULO_NOTIFICACIONES.md
│
├── 02_FRONTEND/ ✅
│   ├── README.md ✅
│   ├── SPRINT_01_SETUP_INICIAL.md ✅
│   ├── SPRINT_02_SISTEMA_DISENO.md ✅
│   ├── SPRINT_03_AUTENTICACION.md ✅
│   ├── SPRINT_04_PORTAL_PUBLICO.md ✅
│   ├── SPRINT_05_DASHBOARD_MESADEPARTES.md ✅
│   ├── SPRINT_06_DASHBOARD_EDITOR.md ✅
│   ├── SPRINT_07_DASHBOARD_UGEL.md ✅
│   ├── SPRINT_08_DASHBOARD_SIAGEC.md ✅
│   ├── SPRINT_09_DASHBOARD_DIRECCION.md ✅
│   └── SPRINT_10_DASHBOARD_ADMIN.md ✅
│
├── 03_IA_OCR/ ✅
│   ├── README.md ✅
│   ├── SPRINT_01_SETUP_GEMINI.md ✅
│   ├── SPRINT_02_OCR_GRATUITO.md ✅
│   ├── SPRINT_03_PROCESAMIENTO_DUAL.md ✅
│   └── SPRINT_04_INTEGRACION_BACKEND.md ✅
│
├── 04_INTEGRACION/ ✅
│   ├── README.md ✅
│   ├── SPRINT_01_BACKEND_FRONTEND.md ✅
│   ├── SPRINT_02_INTEGRACION_OCR.md ✅
│   └── SPRINT_03_TESTING_E2E.md ✅
│
└── 05_DESPLIEGUE/ ✅
    ├── README.md ✅
    ├── SPRINT_01_PREPARACION.md ✅
    ├── SPRINT_02_PRODUCCION.md ✅
    └── SPRINT_03_MANTENIMIENTO.md ✅
```

---

## 🚀 Stack Tecnológico

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express 4.x
- **Lenguaje**: TypeScript 5.x
- **ORM**: Prisma 5.x
- **Base de Datos**: PostgreSQL 15
- **Autenticación**: JWT + bcrypt
- **Validación**: Zod
- **Logger**: Winston
- **Testing**: Jest

### Frontend
- **Build Tool**: Vite 5.x
- **Framework**: React 19
- **Lenguaje**: TypeScript 5.x
- **UI Library**: shadcn/ui + Tailwind CSS 3.x
- **Estado Global**: Zustand + TanStack Query
- **Formularios**: React Hook Form + Zod
- **Routing**: React Router 6.x
- **Testing**: Vitest + React Testing Library

### IA/OCR
- **Lenguaje**: Python 3.11+
- **IA**: Google Gemini API
- **OCR Tradicional**: Tesseract + OpenCV
- **API Framework**: Flask
- **Procesamiento**: pandas, NumPy

### DevOps
- **Contenedores**: Docker + Docker Compose
- **Servidor Web**: Nginx
- **Control de Versiones**: Git
- **CI/CD**: GitHub Actions

---

## 📈 Progreso por Módulo

### ✅ 00_INFRAESTRUCTURA (Planificación completa - 0/2 implementados)
Preparación del entorno de desarrollo y producción.

**📁 Ver**: [00_INFRAESTRUCTURA/README.md](./00_INFRAESTRUCTURA/README.md)

#### Sprints Documentados (2/2):
1. [x] **Sprint 01** - Entorno de Desarrollo (Node.js, PostgreSQL, Python, Git, Docker)
2. [x] **Sprint 02** - Servidor de Producción (Ubuntu 22.04, Nginx, seguridad)

**Características**:
- ✅ Configuración completa de desarrollo
- ✅ Servidor de producción preparado
- ✅ Seguridad básica configurada
- ✅ Todas las herramientas necesarias

---

### ⬜ 01_BACKEND (0% - 0/11)
API REST con Node.js + Express + TypeScript

#### Sprints Completados (0/11):
*Ninguno aún*

#### Sprints en Progreso (0/11):
*Ninguno aún*

#### Próximos Sprints:
1. **Sprint 00** - Base de Datos PostgreSQL (32 tablas) 🔴
2. **Sprint 01** - Setup Inicial (Express + TypeScript) 🔴
3. **Sprint 02** - Prisma ORM & Conexión BD 🔴
4. **Sprint 03** - Autenticación & Seguridad (JWT, Roles, Permisos) 🔴
5. **Sprint 04** - Configuración Institucional (3 tablas)
6. **Sprint 05** - Módulo Académico (5 tablas - CurriculoGrado⭐)
7. **Sprint 07** - Módulo Solicitudes (13 estados⭐⭐)
8. **Sprint 08** - Módulo Pagos (Validación manual)
9. **Sprint 09** - Módulo Certificados (PDF, QR, Firmas)
10. **Sprint 10** - Módulo Notificaciones (Email/SMS)

**Cobertura**:
- ✅ 32/32 tablas cubiertas
- ✅ 7/7 roles implementados
- ✅ 13/13 estados del flujo

---

### ✅ 02_FRONTEND (Planificación completa - 2/10 implementados) 🚀
SPA con React + TypeScript + Vite + shadcn/ui

**📁 Ver**: [02_FRONTEND/README.md](./02_FRONTEND/README.md)

#### Sprints Documentados (10/10):
1. [x] **Sprint 01** - Setup Inicial (Vite + React + shadcn/ui + TanStack Query) 🔴
2. [x] **Sprint 02** - Sistema de Diseño (Componentes + Temas light/dark) 🔴
3. [x] **Sprint 03** - Autenticación Frontend (JWT + Actualización tiempo real) 🔴
4. [x] **Sprint 04** - Portal Público (7 pantallas + Seguimiento tiempo real) ⭐⭐
5. [x] **Sprint 05** - Dashboard Mesa de Partes (Derivación + Validación pagos) ✅ IMPLEMENTADO
6. [x] **Sprint 06** - Dashboard Editor (Búsqueda actas + Interfaz OCR) ⭐⭐⭐
7. [x] **Sprint 07** - Dashboard UGEL (Validación oficial) ✅ IMPLEMENTADO
8. [x] **Sprint 08** - Dashboard SIAGEC (Registro digital + QR)
9. [x] **Sprint 09** - Dashboard Dirección (Firma digital/manuscrita)
10. [x] **Sprint 10** - Dashboard Admin (Gestión + Plantillas currículo) ⭐

**Características Clave**:
- ✅ shadcn/ui + Tailwind CSS
- ✅ Actualización en tiempo real (polling 30s con TanStack Query)
- ✅ Temas light/dark con persistencia
- ✅ 7 dashboards (uno por cada rol)
- ✅ Portal público según FLUJO_USUARIO_PUBLICO_WEB.md
- ✅ Responsive design (mobile-first)

**Cobertura**:
- ✅ 7/7 roles con dashboard
- ✅ 13/13 estados del flujo implementados
- ✅ Todas las funcionalidades del flujo documentado

---

### ✅ 03_IA_OCR (Planificación completa - 0/4 implementados)
Módulo independiente de procesamiento OCR

**📁 Ver**: [03_IA_OCR/README.md](./03_IA_OCR/README.md)

#### Sprints Documentados (4/4):
1. [x] **Sprint 01** - Setup Gemini Vision AI (**Gemini 2.5 Pro**) ⭐
2. [x] **Sprint 02** - OCR Gratuito (Tesseract + EasyOCR) ⭐⭐
3. [x] **Sprint 03** - Procesamiento Dual & Comparación ⭐⭐
4. [x] **Sprint 04** - Integración Backend (API Flask)

**Características Clave**:
- ✅ Gemini 2.5 Pro (modelo más avanzado)
- ✅ Sistema gratuito completo (Tesseract + EasyOCR)
- ✅ Preprocesamiento avanzado de imágenes
- ✅ Comparación inteligente de resultados
- ✅ API REST con Flask

---

### ✅ 04_INTEGRACION (Planificación completa - 0/3 implementados)
Integración de todos los módulos

**📁 Ver**: [04_INTEGRACION/README.md](./04_INTEGRACION/README.md)

#### Sprints Documentados (3/3):
1. [x] **Sprint 01** - Integración Backend-Frontend ⭐
2. [x] **Sprint 02** - Integración OCR ⭐⭐
3. [x] **Sprint 03** - Testing End-to-End (13 estados, 7 roles) ⭐⭐⭐

**Cobertura**:
- ✅ Flujo completo de 13 estados probado
- ✅ 7 roles validados
- ✅ Casos de éxito y error
- ✅ Performance y optimización

---

### ✅ 05_DESPLIEGUE (Planificación completa - 0/3 implementados)
Deployment y producción

**📁 Ver**: [05_DESPLIEGUE/README.md](./05_DESPLIEGUE/README.md)

#### Sprints Documentados (3/3):
1. [x] **Sprint 01** - Preparación Docker + CI/CD
2. [x] **Sprint 02** - Despliegue Producción (Nginx + SSL)
3. [x] **Sprint 03** - Monitoreo y Mantenimiento 24/7

**Características**:
- ✅ Docker y Docker Compose
- ✅ CI/CD con GitHub Actions
- ✅ SSL/TLS con Certbot
- ✅ Monitoreo 24/7
- ✅ Backups automáticos

---

## 🎯 Objetivos Clave por Módulo

### Backend
- [x] 32 tablas modeladas en Prisma
- [x] 7 roles con permisos granulares
- [x] 13 estados del flujo de solicitudes
- [ ] API REST completa documentada
- [ ] Tests unitarios >80% coverage
- [ ] Documentación Swagger/OpenAPI

### Frontend
- [x] 10 sprints documentados completamente
- [x] 7 dashboards (uno por rol) planificados
- [x] Portal público responsive planificado
- [x] Sistema de diseño con shadcn/ui planificado
- [x] Temas light/dark planificados
- [x] Actualización en tiempo real planificada
- [ ] Implementación de sprints
- [ ] Performance (Lighthouse >90)

### IA/OCR
- [x] 4 sprints documentados completamente
- [x] Gemini 2.5 Pro configurado
- [x] Sistema gratuito (Tesseract + EasyOCR) planificado
- [x] Comparación dual planificada
- [x] API Flask documentada
- [ ] Implementación de sprints

### Integración
- [x] 3 sprints documentados completamente
- [x] Integración Backend-Frontend planificada
- [x] Integración OCR planificada
- [x] Tests E2E documentados (13 estados, 7 roles)
- [ ] Implementación de sprints

### Despliegue
- [x] 3 sprints documentados completamente
- [x] Docker y Docker Compose planificado
- [x] CI/CD planificado
- [x] Monitoreo 24/7 planificado
- [ ] Implementación de sprints

---

## 📌 Convenciones y Estándares

### Prioridades
- 🔴 **CRÍTICA**: Bloqueante, debe completarse primero
- 🟡 **ALTA**: Importante para el flujo principal
- 🟢 **MEDIA**: Funcionalidad secundaria
- ⚪ **BAJA**: Nice to have

### Estados de Sprint
- ⬜ **No iniciado**
- 🟡 **En progreso**
- ✅ **Completado**
- ⚠️ **Bloqueado**
- ❌ **Cancelado**

### Formato de Commits
```
tipo(scope): descripción corta

[opcional] descripción larga

tipo: feat, fix, docs, style, refactor, test, chore
scope: backend, frontend, ocr, db, auth, etc.
```

Ejemplo:
```
feat(backend): agregar endpoint de solicitudes
fix(frontend): corregir validación de formulario
docs(planificacion): actualizar sprint 03
```

---

## 📚 Documentación Adicional

### Documentos de Referencia
- `ARQUITECTURA_SISTEMA.md` - Diseño técnico detallado
- `../INFORMACION DEL SISTEMA/FLUJO_COMPLETO_*.md` - Flujos de negocio
- `../INFORMACION DEL SISTEMA/STACK_TECNOLOGICO_LOW_COST.md` - Stack técnico
- `../bd/README_EJECUCION.md` - Documentación de BD

### Enlaces Externos
- [Documentación PostgreSQL 15](https://www.postgresql.org/docs/15/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Documentation](https://react.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Gemini API Docs](https://ai.google.dev/docs)

---

## 🔄 Proceso de Actualización

### Cómo marcar un sprint como completado

1. Completar todas las tareas del sprint
2. Verificar criterios de aceptación
3. Actualizar estado en el archivo del sprint
4. Actualizar este README.md con el progreso
5. Commit con mensaje descriptivo

### Cómo reportar bloqueadores

1. Marcar sprint con ⚠️
2. Documentar bloqueador en sección "Riesgos"
3. Notificar al equipo
4. Buscar mitigación o plan B

---

## 📞 Contacto y Soporte

### Equipo
- **Backend Lead**: [Nombre]
- **Frontend Lead**: [Nombre]
- **DevOps**: [Nombre]
- **QA**: [Nombre]

### Canales
- **Slack/Discord**: #sigcerh-dev
- **Email**: dev@ugel.gob.pe
- **Reuniones**: Lunes y Jueves 3:00 PM

---

## 🎓 Onboarding para Nuevos Desarrolladores

### Paso 1: Setup Local
1. Clonar repositorio
2. Instalar dependencias (Node 20, PostgreSQL 15, Python 3.11)
3. Configurar variables de entorno
4. Ejecutar scripts de BD

### Paso 2: Leer Documentación
1. Este README completo
2. ARQUITECTURA_SISTEMA.md
3. Flujos de negocio en INFORMACION DEL SISTEMA/
4. Sprint actual del módulo asignado

### Paso 3: Primer Sprint
1. Elegir sprint no iniciado de prioridad alta
2. Leer sprint completo antes de iniciar
3. Marcar como "En progreso"
4. Completar tareas paso a paso
5. Hacer commit frecuentemente
6. Solicitar code review

---

## 📊 Métricas del Proyecto

### Estimaciones
- **Duración total estimada**: 12-16 semanas
- **Sprints por semana**: 2-3 (dependiendo de complejidad)
- **Horas por sprint**: 8-40 horas

### Seguimiento
- **Velocidad**: Sprints completados por semana
- **Calidad**: Test coverage, bugs encontrados
- **Bloqueos**: Días bloqueados por dependencias

---

---

## 🚀 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### 📍 FASE 1: SETUP LOCAL (1 día)
1. [00_INFRAESTRUCTURA/SPRINT_01_ENTORNO_DESARROLLO.md](./00_INFRAESTRUCTURA/SPRINT_01_ENTORNO_DESARROLLO.md) 🔴
   - Instalar Node.js, PostgreSQL, Python en TU PC
   - Configurar VS Code
   - Docker local

### 📍 FASE 2: DESARROLLO BACKEND LOCAL (15-20 días)
2. [01_BACKEND/SPRINT_00_BASE_DE_DATOS.md](./01_BACKEND/SPRINT_00_BASE_DE_DATOS.md) 🔴
3. [01_BACKEND/SPRINT_01_SETUP_INICIAL.md](./01_BACKEND/SPRINT_01_SETUP_INICIAL.md) 🔴
4. Backend Sprint 02-10 (en tu localhost:5000)

### 📍 FASE 3: DESARROLLO FRONTEND LOCAL (15-20 días)
5. Frontend Sprint 01-10 (en tu localhost:3000)

### 📍 FASE 4: DESARROLLO OCR LOCAL (8-10 días)
6. OCR Sprint 01-04 (en tu localhost:5001)

### 📍 FASE 5: INTEGRACIÓN LOCAL (8-10 días)
7. Integración Sprint 01-03
   - Todo funcionando en localhost
   - Tests E2E pasando

### 📍 FASE 6: PREPARAR SERVIDOR (1-2 días)
8. [00_INFRAESTRUCTURA/SPRINT_02_SERVIDOR_PRODUCCION.md](./00_INFRAESTRUCTURA/SPRINT_02_SERVIDOR_PRODUCCION.md) 🟡
   - **Solo cuando todo funcione en local**

### 📍 FASE 7: DESPLIEGUE A PRODUCCIÓN (5-7 días)
9. Despliegue Sprint 01-03
   - Docker Compose
   - CI/CD
   - Deploy al servidor

---

**📝 Última actualización**: 31/10/2025  
**👤 Actualizado por**: Sistema de Planificación  
**📌 Versión**: 3.1 - ✅ PLANIFICACIÓN 100% + ORDEN DE EJECUCIÓN  
**🎉 Estado**: ⭐ LISTO PARA IMPLEMENTACIÓN ⭐  
**🔗 COMENZAR AQUÍ**: [00_INFRAESTRUCTURA/SPRINT_01_ENTORNO_DESARROLLO.md](./00_INFRAESTRUCTURA/SPRINT_01_ENTORNO_DESARROLLO.md)

