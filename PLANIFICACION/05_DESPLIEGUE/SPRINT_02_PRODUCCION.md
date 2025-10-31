# 🎯 SPRINT 02: DESPLIEGUE EN PRODUCCIÓN

> **Módulo**: Despliegue  
> **Duración**: 3-4 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ⬜ No iniciado

---

## 📌 Objetivo

Desplegar sistema completo en servidor de producción con Nginx, SSL, configuración de firewall y optimizaciones.

---

## 🎯 Metas del Sprint

- [ ] Servidor configurado (Ubuntu 22.04)
- [ ] Docker y Docker Compose instalados
- [ ] Nginx como reverse proxy
- [ ] SSL/TLS con Certbot
- [ ] Firewall configurado
- [ ] Sistema funcionando en producción
- [ ] Backups automáticos
- [ ] CI/CD con GitHub Actions

---

## ✅ Tareas Principales

### 🟦 FASE 1: Preparación del Servidor (3h)

**Requisitos del servidor**:
- [ ] Ubuntu 22.04 LTS
- [ ] 4 GB RAM mínimo (8 GB recomendado)
- [ ] 50 GB disco mínimo
- [ ] Acceso SSH con clave pública
- [ ] IP pública estática
- [ ] Dominio apuntando a IP

**Instalación base**:
- [ ] Actualizar sistema: apt update && apt upgrade
- [ ] Instalar Docker
- [ ] Instalar Docker Compose
- [ ] Instalar Nginx
- [ ] Instalar Certbot
- [ ] Configurar zona horaria
- [ ] Configurar locale (es_PE.UTF-8)

### 🟦 FASE 2: Configuración de Firewall (2h)
- [ ] Instalar UFW (Uncomplicated Firewall)
- [ ] Reglas:
  - [ ] Permitir SSH (22)
  - [ ] Permitir HTTP (80)
  - [ ] Permitir HTTPS (443)
  - [ ] Denegar todo lo demás
- [ ] Activar firewall
- [ ] Testing de reglas

### 🟦 FASE 3: Configuración de Nginx (4h)

**Reverse Proxy**:
- [ ] Archivo de configuración en /etc/nginx/sites-available/
- [ ] Proxy a Frontend (puerto 3000)
- [ ] Proxy a Backend (/api → puerto 5000)
- [ ] Proxy a OCR (no expuesto públicamente)
- [ ] Headers de seguridad
- [ ] Compresión gzip
- [ ] Cache de assets estáticos
- [ ] Rate limiting
- [ ] Logs separados por servicio

**Dominios**:
- [ ] certificados.ugel.gob.pe (principal)
- [ ] api.certificados.ugel.gob.pe (API, opcional)

### 🟦 FASE 4: SSL/TLS con Certbot (2h)
- [ ] Instalar Certbot
- [ ] Obtener certificado Let's Encrypt
- [ ] Configurar auto-renovación
- [ ] Forzar HTTPS
- [ ] Configurar HSTS
- [ ] Testing de SSL (SSLLabs A+)

### 🟦 FASE 5: Deploy de la Aplicación (4h)

**Clonar repositorio**:
- [ ] Git clone en /var/www/certificados/
- [ ] Configurar permisos
- [ ] Copiar .env.production
- [ ] Verificar variables de entorno

**Build y Deploy**:
- [ ] docker-compose -f docker-compose.prod.yml build
- [ ] docker-compose -f docker-compose.prod.yml up -d
- [ ] Verificar todos los contenedores UP
- [ ] Verificar logs sin errores
- [ ] Verificar health checks

**Inicializar BD**:
- [ ] Ejecutar init-db.sh
- [ ] Ejecutar seed-db.sh (usuario admin)
- [ ] Verificar conexión desde Backend

### 🟦 FASE 6: Testing en Producción (3h)
- [ ] Acceder a https://certificados.ugel.gob.pe
- [ ] Login funciona
- [ ] Crear solicitud funciona
- [ ] Procesar OCR funciona
- [ ] Generar PDF funciona
- [ ] Notificaciones funcionan (email/SMS)
- [ ] Performance aceptable
- [ ] No hay errores en logs

### 🟦 FASE 7: Backups Automáticos (3h)

**Backup de BD**:
- [ ] Script: /scripts/backup-db.sh
- [ ] Cron job diario a las 2 AM
- [ ] Retención de 7 días
- [ ] Compresión con gzip
- [ ] Almacenar en /backups/

**Backup de archivos**:
- [ ] Carpeta uploads/
- [ ] Carpeta logs/
- [ ] Sincronización con almacenamiento externo (opcional)

**Testing de restore**:
- [ ] Probar restaurar backup
- [ ] Verificar integridad

### 🟦 FASE 8: CI/CD con GitHub Actions (5h)

**Workflow de Deploy**:
- [ ] Archivo .github/workflows/deploy.yml
- [ ] Trigger: push a rama main
- [ ] Jobs:
  - [ ] Lint
  - [ ] Tests
  - [ ] Build
  - [ ] Deploy a producción (SSH)
- [ ] Secrets configurados en GitHub:
  - SSH_PRIVATE_KEY
  - SERVER_HOST
  - DATABASE_URL
  - JWT_SECRET
  - GEMINI_API_KEY
- [ ] Notificación en Slack/Discord al terminar

**Rolling updates**:
- [ ] Deploy sin downtime
- [ ] Health check antes de switch
- [ ] Rollback automático si falla

### 🟦 FASE 9: Optimizaciones (3h)

**Performance**:
- [ ] Índices de BD optimizados
- [ ] Queries N+1 resueltas
- [ ] Conexiones a BD con pool
- [ ] Cache de queries frecuentes (Redis, opcional)
- [ ] CDN para assets (Cloudflare, opcional)

**Seguridad**:
- [ ] Fail2ban configurado (protección SSH)
- [ ] Deshabilitar login root
- [ ] Solo autenticación por clave pública
- [ ] Logs de auditoría activos
- [ ] Secrets no en repositorio

### 🟦 FASE 10: Documentación de Deploy (2h)
- [ ] Guía de despliegue paso a paso
- [ ] Credenciales seguras documentadas (fuera de repo)
- [ ] Diagrama de arquitectura
- [ ] Lista de comandos útiles
- [ ] Troubleshooting común
- [ ] Contactos de soporte

---

## 🔐 Checklist de Seguridad

- [ ] Firewall activo
- [ ] SSH con clave pública
- [ ] SSL/TLS configurado
- [ ] Headers de seguridad (Nginx)
- [ ] Secrets en variables de entorno
- [ ] Backups funcionando
- [ ] Logs de auditoría activos
- [ ] Rate limiting configurado
- [ ] Fail2ban activo

---

## 🧪 Criterios de Aceptación

- [ ] Sistema accesible en dominio público
- [ ] HTTPS funcionando (A+ en SSLLabs)
- [ ] Todos los servicios UP
- [ ] Performance aceptable (<3s carga)
- [ ] Backups automáticos funcionando
- [ ] CI/CD funcionando
- [ ] Sin errores críticos en logs
- [ ] Documentación completa

---

## 📊 Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| Uptime | >99% |
| Tiempo de carga | <3 segundos |
| Tiempo de respuesta API | <500ms |
| SSL Grade | A+ |
| Lighthouse Performance | >90 |

---

## ⚠️ Dependencias

- Sprint 01 - Docker configurado
- Servidor con Ubuntu 22.04
- Dominio web activo
- Acceso SSH al servidor

---

**🔗 Siguiente**: [SPRINT_03_MANTENIMIENTO.md](./SPRINT_03_MANTENIMIENTO.md)

