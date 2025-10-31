# 🚀 MÓDULO BACKEND - PLANIFICACIÓN DETALLADA

## 📊 Resumen del Módulo

API REST completa desarrollada con Node.js, Express, TypeScript y Prisma ORM.

---

## 🎯 Objetivos Generales

- ✅ API REST completa con 32 tablas
- ✅ Sistema de autenticación JWT con 7 roles
- ✅ Flujo de solicitudes con 13 estados
- ✅ Sistema de pagos con validación manual
- ✅ Generación de certificados PDF con QR
- ✅ Sistema de notificaciones
- ✅ Auditoría completa de acciones

---

## 📋 Sprints del Backend (11 total)

### 🔴 CRÍTICOS (Deben completarse primero)

| # | Sprint | Duración | Prioridad | Estado | Tablas | Dependencias |
|---|--------|----------|-----------|--------|--------|--------------|
| 00 | [Base de Datos](./SPRINT_00_BASE_DE_DATOS.md) | 1-2 días | 🔴 CRÍTICA | ⬜ | 32 | PostgreSQL 15 |
| 01 | [Setup Inicial](./SPRINT_01_SETUP_INICIAL.md) | 2-3 días | 🔴 CRÍTICA | ⬜ | 0 | Sprint 00 |
| 02 | [Prisma ORM](./SPRINT_02_PRISMA_ORM.md) | 2-3 días | 🔴 CRÍTICA | ⬜ | 32 | Sprint 00, 01 |
| 03 | [Autenticación & Seguridad](./SPRINT_03_AUTENTICACION_SEGURIDAD.md) | 4-5 días | 🔴 CRÍTICA | ⬜ | 8 | Sprint 02 |
| 07 | [Módulo Solicitudes](./SPRINT_07_MODULO_SOLICITUDES.md) | 6-7 días | 🔴 CRÍTICA | ⬜ | 3 | Sprint 03-06 |
| 09 | [Módulo Certificados](./SPRINT_09_MODULO_CERTIFICADOS.md) | 6-7 días | 🔴 CRÍTICA | ⬜ | 4 | Sprint 07, 08 |

### 🟡 ALTA PRIORIDAD

| # | Sprint | Duración | Prioridad | Estado | Tablas | Dependencias |
|---|--------|----------|-----------|--------|--------|--------------|
| 04 | [Configuración Institucional](./SPRINT_04_CONFIGURACION_INSTITUCIONAL.md) | 3 días | 🟡 ALTA | ⬜ | 3 | Sprint 03 |
| 05 | [Módulo Académico](./SPRINT_05_MODULO_ACADEMICO.md) | 4-5 días | 🟡 ALTA | ⬜ | 5 | Sprint 04 |
| 06 | [Módulo Actas Físicas](./SPRINT_06_MODULO_ACTAS_FISICAS.md) | 5-6 días | 🟡 ALTA | ⬜ | 1 | Sprint 05 |
| 08 | [Módulo Pagos](./SPRINT_08_MODULO_PAGOS.md) | 5-6 días | 🟡 ALTA | ⬜ | 7 | Sprint 07 |

### 🟢 MEDIA PRIORIDAD

| # | Sprint | Duración | Prioridad | Estado | Tablas | Dependencias |
|---|--------|----------|-----------|--------|--------|--------------|
| 10 | [Módulo Notificaciones](./SPRINT_10_MODULO_NOTIFICACIONES.md) | 3-4 días | 🟢 MEDIA | ⬜ | 1 | Sprint 07 |

---

## 📊 Progreso General

### Cobertura de Tablas (32 total)

| Categoría | Tablas | Sprint | Estado |
|-----------|--------|--------|--------|
| Configuración | 3 | Sprint 04 | ⬜ |
| Académicas | 5 | Sprint 05 | ⬜ |
| Actas Físicas | 1 | Sprint 06 | ⬜ |
| Certificados | 4 | Sprint 09 | ⬜ |
| Solicitudes | 3 | Sprint 07 | ⬜ |
| Pagos | 7 | Sprint 08 | ⬜ |
| Notificaciones | 1 | Sprint 10 | ⬜ |
| Usuarios & Seguridad | 6 | Sprint 03 | ⬜ |
| Auditoría | 2 | Sprint 03 | ⬜ |
| **TOTAL** | **32** | - | **0%** |

### Cobertura de Roles (7 total)

| Rol | Implementado en | Estado |
|-----|-----------------|--------|
| PUBLICO | Sprint 03, 07 | ⬜ |
| MESA_DE_PARTES | Sprint 03, 07, 08 | ⬜ |
| EDITOR | Sprint 03, 06, 07 | ⬜ |
| ENCARGADO_UGEL | Sprint 03, 07 | ⬜ |
| ENCARGADO_SIAGEC | Sprint 03, 07 | ⬜ |
| DIRECCION | Sprint 03, 09 | ⬜ |
| ADMIN | Sprint 03, 04 | ⬜ |

### Cobertura de Estados (13 total)

Todos los 13 estados implementados en **Sprint 07**:

1. REGISTRADA
2. DERIVADO_A_EDITOR
3. EN_BUSQUEDA
4. ACTA_ENCONTRADA_PENDIENTE_PAGO
5. ACTA_NO_ENCONTRADA
6. PAGO_VALIDADO
7. EN_PROCESAMIENTO_OCR
8. EN_VALIDACION_UGEL
9. OBSERVADO_POR_UGEL
10. EN_REGISTRO_SIAGEC
11. EN_FIRMA_DIRECCION
12. CERTIFICADO_EMITIDO
13. ENTREGADO

---

## 🗂️ Estructura de Código Backend

```
backend/
├── prisma/
│   ├── schema.prisma          # 32 modelos Prisma
│   ├── seed.ts                # Seeds iniciales
│   └── migrations/            # Migraciones
│
├── src/
│   ├── config/                # Configuraciones
│   │   ├── env.config.ts
│   │   ├── database.ts
│   │   ├── logger.config.ts
│   │   └── constants.ts
│   │
│   ├── middlewares/           # Middlewares globales
│   │   ├── auth.middleware.ts
│   │   ├── roles.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── logger.middleware.ts
│   │
│   ├── modules/               # Módulos por funcionalidad
│   │   ├── auth/              # Sprint 03
│   │   ├── usuarios/          # Sprint 03
│   │   ├── configuracion/     # Sprint 04
│   │   ├── estudiantes/       # Sprint 05
│   │   ├── curriculo/         # Sprint 05
│   │   ├── actas/             # Sprint 06
│   │   ├── solicitudes/       # Sprint 07
│   │   ├── pagos/             # Sprint 08
│   │   ├── certificados/      # Sprint 09
│   │   ├── notificaciones/    # Sprint 10
│   │   └── admin/             # Sprint 03-04
│   │
│   ├── services/              # Servicios reutilizables
│   │   ├── storage.service.ts
│   │   ├── email.service.ts
│   │   ├── pdf.service.ts
│   │   ├── qr.service.ts
│   │   └── hash.service.ts
│   │
│   ├── utils/                 # Utilidades
│   │   ├── jwt.ts
│   │   ├── bcrypt.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   │
│   ├── types/                 # TypeScript types
│   │   ├── express.d.ts
│   │   ├── models.ts
│   │   └── api.ts
│   │
│   ├── app.ts                 # Configuración Express
│   └── server.ts              # Entry point
│
├── storage/                   # Archivos subidos
│   ├── uploads/
│   ├── comprobantes/
│   ├── actas/
│   └── certificados/
│
├── logs/                      # Logs de aplicación
│
├── tests/                     # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 20 LTS | Runtime |
| Express | 4.x | Framework web |
| TypeScript | 5.x | Lenguaje tipado |
| Prisma | 5.x | ORM |
| PostgreSQL | 15.x | Base de datos |
| JWT | 9.x | Autenticación |
| bcrypt | 5.x | Hash de contraseñas |
| Zod | 3.x | Validación |
| Winston | 3.x | Logging |
| PDFKit | 0.14.x | Generación PDF |
| QRCode | 1.x | Generación QR |
| Nodemailer | 6.x | Envío emails |

---

## 📈 Métricas de Calidad

### Objetivos de Testing

| Tipo de Test | Coverage Objetivo | Estado |
|--------------|-------------------|--------|
| Unit Tests | ≥ 80% | ⬜ 0% |
| Integration Tests | ≥ 70% | ⬜ 0% |
| E2E Tests | Flujos críticos | ⬜ 0% |

### Objetivos de Performance

| Métrica | Objetivo | Estado |
|---------|----------|--------|
| Response Time (avg) | < 200ms | ⬜ |
| Database Queries | < 100ms | ⬜ |
| Error Rate | < 0.1% | ⬜ |
| Uptime | > 99.9% | ⬜ |

---

## 🔐 Seguridad Implementada

- [x] JWT para autenticación
- [x] Bcrypt para contraseñas (10 rounds)
- [x] Helmet para headers HTTP
- [x] CORS configurado
- [x] Rate Limiting (100 req/15min)
- [x] Validación con Zod
- [x] Sanitización de inputs
- [x] Auditoría de acciones
- [ ] SQL Injection prevention (Prisma)
- [ ] XSS prevention
- [ ] CSRF tokens

---

## 📚 Endpoints por Módulo

### Autenticación (Sprint 03)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Usuarios (Sprint 03)
```
GET    /api/usuarios
GET    /api/usuarios/:id
POST   /api/usuarios
PUT    /api/usuarios/:id
DELETE /api/usuarios/:id
POST   /api/usuarios/:id/roles
```

### Solicitudes (Sprint 07) ⭐
```
POST   /api/solicitudes
GET    /api/solicitudes/:id/seguimiento
PUT    /api/solicitudes/:id/derivar
PUT    /api/solicitudes/:id/acta-encontrada
PUT    /api/solicitudes/:id/aprobar-ugel
PUT    /api/solicitudes/:id/firmar
```

### Certificados (Sprint 09)
```
POST   /api/certificados
GET    /api/certificados/:id
GET    /api/certificados/:id/pdf
POST   /api/certificados/:id/rectificar
GET    /api/verificar/:codigoVirtual
```

### Pagos (Sprint 08)
```
POST   /api/pagos
GET    /api/pagos/:id
PUT    /api/pagos/:id/validar
POST   /api/pagos/:id/comprobante
```

*(Ver sprints individuales para endpoints completos)*

---

## 🚀 Guía de Desarrollo

### Para Desarrolladores Nuevos

1. **Leer primero**:
   - Este README completo
   - Sprint 00 (Base de Datos)
   - Sprint 01 (Setup Inicial)
   - Sprint 02 (Prisma ORM)

2. **Setup local**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configurar .env con credenciales
   npm run dev
   ```

3. **Verificar funcionamiento**:
   ```bash
   curl http://localhost:5000/api/health
   ```

4. **Elegir sprint y comenzar**

### Orden Recomendado de Desarrollo

1. Sprint 00 → Sprint 01 → Sprint 02 (Base)
2. Sprint 03 (Autenticación - CRÍTICO)
3. Sprint 04 → Sprint 05 → Sprint 06 (Módulos base)
4. Sprint 07 (Solicitudes - CORE del sistema)
5. Sprint 08 (Pagos)
6. Sprint 09 (Certificados)
7. Sprint 10 (Notificaciones)

---

## ⚠️ Riesgos Comunes

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| BD no configurada | Alto | Ejecutar Sprint 00 primero |
| Variables .env incorrectas | Alto | Validar con validateConfig() |
| Puerto 5000 ocupado | Bajo | Cambiar PORT en .env |
| Prisma Client desactualizado | Medio | Ejecutar `npx prisma generate` |
| Tests no pasan | Medio | Revisar mocks y fixtures |

---

## 📞 Soporte

### Problemas Técnicos
1. Revisar logs en `logs/`
2. Verificar `.env`
3. Consultar documentación del sprint
4. Pedir ayuda en canal #backend

### Reportar Bugs
```
## Bug Report

**Sprint**: [Número y nombre]
**Descripción**: [Breve descripción]
**Pasos para reproducir**:
1. ...
2. ...

**Comportamiento esperado**: ...
**Comportamiento actual**: ...
**Logs/Screenshots**: ...
```

---

## 📝 Changelog

### Version 1.0.0 (31/10/2025)
- ✅ Estructura de planificación creada
- ✅ 11 sprints definidos
- ✅ 32 tablas mapeadas
- ✅ 7 roles definidos
- ✅ 13 estados del flujo documentados

---

**📝 Última actualización**: 31/10/2025  
**👤 Actualizado por**: Sistema de Planificación  
**📌 Versión**: 1.0  
**🔗 Volver a**: [PLANIFICACION/README.md](../README.md)  
**🔗 Comenzar con**: [SPRINT_00_BASE_DE_DATOS.md](./SPRINT_00_BASE_DE_DATOS.md)

