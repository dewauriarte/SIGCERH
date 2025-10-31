# 🔧 MÓDULO INFRAESTRUCTURA - PLANIFICACIÓN DETALLADA

## 📊 Resumen del Módulo

Preparación del entorno de desarrollo y servidores antes de iniciar la implementación del sistema.

---

## 🎯 Objetivos Generales

- ✅ Servidor de desarrollo configurado
- ✅ Servidor de producción preparado
- ✅ Node.js 20 LTS instalado
- ✅ PostgreSQL 15 instalado
- ✅ Python 3.11+ instalado
- ✅ Herramientas de desarrollo configuradas

---

## 📋 Sprints del Módulo (2 total)

| # | Sprint | Duración | Prioridad | Cuándo Hacerlo | Estado |
|---|--------|----------|-----------|----------------|--------|
| 01 | [Entorno de Desarrollo](./SPRINT_01_ENTORNO_DESARROLLO.md) | 1 día | 🔴 CRÍTICA | **AL INICIO** | ⬜ |
| 02 | [Servidor de Producción](./SPRINT_02_SERVIDOR_PRODUCCION.md) | 1-2 días | 🟡 ALTA | **AL FINAL** (antes de Despliegue) | ⬜ |

---

## ⚠️ IMPORTANTE: Orden de Implementación

### ✅ ORDEN CORRECTO:

1. **PRIMERO**: Sprint 01 - Entorno de Desarrollo LOCAL 🖥️
   - Instalar todo en tu PC (Windows/Linux)
   - Node.js, PostgreSQL, Python, Docker
   - Desarrollar TODO en local

2. **DESARROLLO COMPLETO EN LOCAL** 💻
   - Backend completo (Sprint 00-10)
   - Frontend completo (Sprint 01-10)
   - OCR completo (Sprint 01-04)
   - Integración y testing (Sprint 01-03)
   - Todo funciona en `localhost`

3. **AL FINAL**: Sprint 02 - Servidor de Producción 🌐
   - Preparar servidor remoto
   - Solo cuando tengas todo listo localmente
   - Antes del módulo de Despliegue

### ❌ NO HACER:
- ❌ NO configurar servidor de producción al inicio
- ❌ NO desarrollar directo en el servidor
- ❌ NO hacer deploy hasta tener todo testeado localmente

---

## 🖥️ Requisitos de Hardware

### Desarrollo (Local)
- **OS**: Windows 10/11 o Ubuntu 22.04
- **CPU**: 4 cores mínimo
- **RAM**: 8 GB mínimo (16 GB recomendado)
- **Disco**: 50 GB libres
- **Internet**: Estable (para descargar dependencias)

### Producción (Servidor)
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 4 cores (8 recomendado)
- **RAM**: 8 GB mínimo (16 GB recomendado)
- **Disco**: 100 GB SSD
- **Red**: IP pública estática
- **Dominio**: certificados.ugel.gob.pe

---

## 📦 Software a Instalar

### Todos los Entornos
- Node.js 20 LTS
- PostgreSQL 15
- Python 3.11+
- Git
- Docker & Docker Compose

### Solo Desarrollo
- VS Code o IDE preferido
- Postman o Insomnia (testing API)
- DBeaver o pgAdmin (gestión BD)

### Solo Producción
- Nginx
- Certbot (SSL)
- UFW (firewall)
- Fail2ban

---

## ⚠️ Dependencias

- Acceso a servidores (SSH para producción)
- Cuentas necesarias:
  - Google AI Studio (Gemini API Key)
  - Gmail SMTP (notificaciones)
  - Dominio web configurado

---

**📝 Última actualización**: 31/10/2025  
**🔗 Comenzar con**: [SPRINT_01_ENTORNO_DESARROLLO.md](./SPRINT_01_ENTORNO_DESARROLLO.md)

