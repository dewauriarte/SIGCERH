# 🎯 SPRINT 04: CONFIGURACIÓN INSTITUCIONAL

> **Módulo**: Backend - Configuración  
> **Duración**: 3 días  
> **Prioridad**: 🟡 ALTA  
> **Estado**: ✅ COMPLETADO (Testing pendiente)

---

## 📌 Objetivo

CRUD completo para configuración de la institución educativa (UGEL/IE), niveles educativos y asignación de usuarios.

---

## 🎯 Metas del Sprint

- [x] CRUD ConfiguracionInstitucion
- [x] CRUD NivelEducativo
- [x] Asignación de usuarios a institución
- [x] Subida de logo institucional
- [ ] Tests >80% coverage

---

## 📊 Tablas Involucradas (3)

- [x] ConfiguracionInstitucion
- [x] NivelEducativo
- [x] InstitucionUsuario

---

## ✅ Tareas Principales

### ✅ FASE 1: Services (4h)
- [x] ConfiguracionService
  - [x] get() - Obtener configuración activa
  - [x] update() - Actualizar configuración
  - [x] uploadLogo() - Subir logo
- [x] NivelesService (CRUD completo)
- [x] InstitucionUsuarioService

### ✅ FASE 2: Controllers y Routes (3h)
- [x] ConfiguracionController
- [x] NivelesController
- [x] Proteger rutas (solo ADMIN)

### ✅ FASE 3: Validaciones (2h)
- [x] Validar solo una institución activa
- [x] Validar formatos de imagen para logo
- [x] DTOs con Zod

### ✅ FASE 4: Storage (2h)
- [x] Servicio de subida de archivos
- [x] Almacenar logos en /storage/logos/

### 🟦 FASE 5: Testing (3h)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Test de constraint única institución


---

## 📋 Endpoints

```
GET    /api/configuracion/institucion
PUT    /api/configuracion/institucion
POST   /api/configuracion/institucion/logo

GET    /api/configuracion/niveles
POST   /api/configuracion/niveles
PUT    /api/configuracion/niveles/:id
DELETE /api/configuracion/niveles/:id

GET    /api/institucion/usuarios
POST   /api/institucion/usuarios/:usuarioId
DELETE /api/institucion/usuarios/:usuarioId
```

---

## 🧪 Criterios de Aceptación

- [x] Solo existe una institución activa
- [x] Logo se guarda correctamente
- [x] CRUD de niveles funciona
- [x] Usuarios se asignan a institución
- [ ] Tests >80% coverage

---

## ⚠️ Dependencias

- Sprint 03 - Autenticación implementada

---

**🔗 Siguiente**: [SPRINT_05_MODULO_ACADEMICO.md](./SPRINT_05_MODULO_ACADEMICO.md)

