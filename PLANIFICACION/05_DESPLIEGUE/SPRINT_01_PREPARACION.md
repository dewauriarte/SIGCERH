# 🎯 SPRINT 01: PREPARACIÓN Y DOCKER

> **Módulo**: Despliegue  
> **Duración**: 2-3 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ⬜ No iniciado

---

## 📌 Objetivo

Containerización completa con Docker, Docker Compose, configuración de ambientes y preparación para despliegue.

---

## 🎯 Metas del Sprint

- [ ] Dockerfiles para Backend, Frontend y OCR
- [ ] Docker Compose configurado
- [ ] Variables de entorno por ambiente
- [ ] Build de producción funcionando
- [ ] Networking entre contenedores
- [ ] Volúmenes para persistencia
- [ ] Scripts de inicialización

---

## ✅ Tareas Principales

### 🟦 FASE 1: Dockerfile Backend (2h)
- [ ] Crear Dockerfile
- [ ] Base image: node:20-alpine
- [ ] Multi-stage build (build + prod)
- [ ] Instalar dependencias
- [ ] Compilar TypeScript
- [ ] Usuario no-root
- [ ] Health check
- [ ] Optimize layers

### 🟦 FASE 2: Dockerfile Frontend (2h)
- [ ] Crear Dockerfile
- [ ] Base image: node:20-alpine
- [ ] Multi-stage build
- [ ] Build con Vite
- [ ] Servir con Nginx
- [ ] Copiar solo dist/
- [ ] Configurar nginx.conf
- [ ] Health check

### 🟦 FASE 3: Dockerfile OCR (2h)
- [ ] Crear Dockerfile
- [ ] Base image: python:3.11-slim
- [ ] Instalar Tesseract
- [ ] Instalar dependencias Python
- [ ] Descargar modelos EasyOCR
- [ ] Usuario no-root
- [ ] Health check
- [ ] Optimizar tamaño

### 🟦 FASE 4: Docker Compose (4h)

**Servicios**:
- [ ] backend (Node.js)
- [ ] frontend (Nginx)
- [ ] ocr (Flask)
- [ ] postgres (PostgreSQL 15)
- [ ] redis (opcional, para cache)

**Networking**:
- [ ] Red interna (backend-network)
- [ ] Solo frontend expuesto públicamente

**Volúmenes**:
- [ ] postgres_data (persistencia BD)
- [ ] uploads (archivos subidos)
- [ ] logs (logs de aplicación)

**Variables de entorno**:
- [ ] .env por ambiente
- [ ] .env.development
- [ ] .env.production

### 🟦 FASE 5: Variables de Entorno (3h)

**Desarrollo (.env.development)**:
- [ ] DATABASE_URL=postgres://...
- [ ] JWT_SECRET=dev-secret
- [ ] NODE_ENV=development
- [ ] FRONTEND_URL=http://localhost:3000
- [ ] OCR_API_URL=http://ocr:5001

**Producción (.env.production)**:
- [ ] DATABASE_URL (real)
- [ ] JWT_SECRET (fuerte, generado)
- [ ] NODE_ENV=production
- [ ] FRONTEND_URL=https://certificados.ugel.gob.pe
- [ ] GEMINI_API_KEY (real)
- [ ] SMTP_* (real)

### 🟦 FASE 6: Builds de Producción (3h)

**Backend**:
- [ ] TypeScript → JavaScript
- [ ] Source maps deshabilitados
- [ ] Minificación
- [ ] Variables de producción

**Frontend**:
- [ ] Vite build
- [ ] Minificación
- [ ] Tree shaking
- [ ] Code splitting
- [ ] Assets optimizados
- [ ] Source maps deshabilitados

**OCR**:
- [ ] Python bytecode compilado
- [ ] Dependencias congeladas

### 🟦 FASE 7: Scripts de Inicialización (2h)
- [ ] init-db.sh (crear BD y tablas)
- [ ] seed-db.sh (datos iniciales)
- [ ] start-dev.sh (modo desarrollo)
- [ ] start-prod.sh (modo producción)
- [ ] backup-db.sh (backup de BD)
- [ ] restore-db.sh (restaurar BD)

### 🟦 FASE 8: Health Checks (2h)
- [ ] Backend: GET /health
- [ ] Frontend: index.html accesible
- [ ] OCR: GET /health
- [ ] PostgreSQL: conexión válida
- [ ] Configurar en Docker Compose
- [ ] Restart automático si unhealthy

### 🟦 FASE 9: Testing Local con Docker (3h)
- [ ] docker-compose up en desarrollo
- [ ] Verificar todos los servicios UP
- [ ] Verificar networking
- [ ] Verificar volúmenes
- [ ] Verificar health checks
- [ ] Verificar logs
- [ ] docker-compose down y limpieza

---

## 📦 Estructura de Archivos

```
proyecto/
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
│
├── .env.development
├── .env.production
│
├── backend/
│   ├── Dockerfile
│   └── .dockerignore
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
│
├── ocr_service/
│   ├── Dockerfile
│   └── .dockerignore
│
└── scripts/
    ├── init-db.sh
    ├── seed-db.sh
    ├── start-dev.sh
    ├── start-prod.sh
    ├── backup-db.sh
    └── restore-db.sh
```

---

## 🧪 Criterios de Aceptación

- [ ] Dockerfiles creados para 3 servicios
- [ ] Docker Compose funciona en desarrollo
- [ ] Builds de producción funcionan
- [ ] Variables de entorno configuradas
- [ ] Health checks funcionan
- [ ] Networking entre contenedores OK
- [ ] Volúmenes persisten datos
- [ ] Scripts de inicialización funcionan
- [ ] Todo documentado

---

## ⚠️ Consideraciones

**Ventajas de Docker**:
- ✅ Entorno consistente (dev = prod)
- ✅ Fácil escalamiento
- ✅ Aislamiento de servicios
- ✅ Rollback rápido

**Desventajas**:
- ❌ Overhead de recursos
- ❌ Curva de aprendizaje

---

**🔗 Siguiente**: [SPRINT_02_PRODUCCION.md](./SPRINT_02_PRODUCCION.md)

