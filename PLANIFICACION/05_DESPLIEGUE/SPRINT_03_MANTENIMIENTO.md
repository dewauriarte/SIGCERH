# 🎯 SPRINT 03: MONITOREO Y MANTENIMIENTO

> **Módulo**: Despliegue  
> **Duración**: 2-3 días  
> **Prioridad**: 🟡 ALTA  
> **Estado**: ⬜ No iniciado

---

## 📌 Objetivo

Sistema de monitoreo 24/7, alertas automáticas, logs centralizados, mantenimiento preventivo y documentación operativa.

---

## 🎯 Metas del Sprint

- [ ] Monitoreo de servicios activo
- [ ] Alertas configuradas
- [ ] Logs centralizados
- [ ] Dashboard de métricas
- [ ] Procedimientos de mantenimiento
- [ ] Documentación operativa
- [ ] Capacitación del equipo

---

## ✅ Tareas Principales

### 🟦 FASE 1: Monitoreo de Servicios (4h)

**Herramientas (opciones)**:
- [ ] UptimeRobot (gratuito, simple)
- [ ] Prometheus + Grafana (avanzado)
- [ ] New Relic (comercial)

**Servicios a monitorear**:
- [ ] Frontend (https://certificados.ugel.gob.pe)
- [ ] Backend (/api/health)
- [ ] OCR (/health)
- [ ] PostgreSQL (conexión)
- [ ] Espacio en disco
- [ ] Uso de CPU
- [ ] Uso de RAM
- [ ] Tiempo de respuesta

**Intervalos**:
- [ ] Check cada 5 minutos
- [ ] Timeout: 30 segundos
- [ ] Retry: 3 intentos

### 🟦 FASE 2: Sistema de Alertas (3h)

**Canales de alerta**:
- [ ] Email al equipo técnico
- [ ] SMS (opcional, críticos)
- [ ] Slack/Discord webhook
- [ ] WhatsApp (manual)

**Tipos de alertas**:

**Críticas** (inmediatas):
- [ ] Servicio caído
- [ ] BD inaccesible
- [ ] Disco >90% lleno
- [ ] RAM >95%
- [ ] Error 500 repetido

**Advertencias** (1 hora):
- [ ] Servicio lento (>5s)
- [ ] Disco >80% lleno
- [ ] RAM >85%
- [ ] CPU >90% por 10 min

**Informativas** (diarias):
- [ ] Resumen de actividad
- [ ] Backup exitoso
- [ ] Updates disponibles

### 🟦 FASE 3: Logs Centralizados (4h)

**Configuración de logs**:

**Backend**:
- [ ] Winston logger
- [ ] Nivel: INFO en prod, DEBUG en dev
- [ ] Rotación diaria
- [ ] Retención: 30 días
- [ ] Formato: JSON

**Nginx**:
- [ ] Access log
- [ ] Error log
- [ ] Rotación diaria

**PostgreSQL**:
- [ ] Query log (solo lentas >1s)
- [ ] Error log
- [ ] Rotación semanal

**Docker**:
- [ ] docker logs con driver json-file
- [ ] Max size: 10MB
- [ ] Max files: 3

**Agregación (opcional)**:
- [ ] Loki + Grafana
- [ ] ELK Stack (Elasticsearch, Logstash, Kibana)
- [ ] CloudWatch Logs

### 🟦 FASE 4: Dashboard de Métricas (5h)

**Métricas a visualizar**:

**Sistema**:
- [ ] Uptime
- [ ] CPU, RAM, Disco
- [ ] Requests por minuto
- [ ] Tiempo de respuesta promedio

**Aplicación**:
- [ ] Solicitudes creadas (diario)
- [ ] Certificados emitidos (diario)
- [ ] Pagos validados (diario)
- [ ] Usuarios activos

**Base de Datos**:
- [ ] Conexiones activas
- [ ] Queries lentas
- [ ] Tamaño de BD
- [ ] Backups exitosos

**Herramientas**:
- [ ] Grafana dashboard
- [ ] Prometheus metrics
- [ ] Custom dashboard (Admin en Frontend)

### 🟦 FASE 5: Mantenimiento Preventivo (3h)

**Tareas diarias** (automatizadas):
- [ ] Backup de BD (2 AM)
- [ ] Limpieza de logs antiguos
- [ ] Limpieza de archivos temporales
- [ ] Health check de servicios

**Tareas semanales** (manuales):
- [ ] Revisar logs de errores
- [ ] Revisar alertas de la semana
- [ ] Verificar espacio en disco
- [ ] Revisar métricas de performance

**Tareas mensuales**:
- [ ] Actualizar dependencias (con testing)
- [ ] Revisar y optimizar queries lentas
- [ ] Revisar backups (test de restore)
- [ ] Auditoría de seguridad
- [ ] Revisar usuarios inactivos

**Tareas trimestrales**:
- [ ] Actualizar sistema operativo
- [ ] Renovar certificados SSL (automático)
- [ ] Revisar capacidad del servidor
- [ ] Planning de escalamiento

### 🟦 FASE 6: Procedimientos de Emergencia (3h)

**Runbook de incidentes**:

**Servicio Caído**:
1. [ ] Verificar health checks
2. [ ] Revisar logs del servicio
3. [ ] Reiniciar contenedor: docker restart [service]
4. [ ] Si persiste, rollback a versión anterior
5. [ ] Notificar al equipo

**BD Caída**:
1. [ ] Verificar conexión: docker exec -it postgres psql
2. [ ] Revisar logs de PostgreSQL
3. [ ] Reiniciar contenedor
4. [ ] Si falla, restaurar último backup
5. [ ] Notificar al equipo

**Disco Lleno**:
1. [ ] Identificar archivos grandes: du -h
2. [ ] Limpiar logs: /scripts/clean-logs.sh
3. [ ] Limpiar uploads antiguos
4. [ ] Expandir disco (si es VM)
5. [ ] Planificar escalamiento

**Alta Carga**:
1. [ ] Identificar proceso: htop
2. [ ] Revisar queries lentas en BD
3. [ ] Optimizar queries
4. [ ] Escalar verticalmente (más RAM/CPU)
5. [ ] Considerar escalamiento horizontal

### 🟦 FASE 7: Documentación Operativa (4h)

**Documentos a crear**:

**Manual de Operaciones**:
- [ ] Acceso al servidor
- [ ] Comandos útiles
- [ ] Estructura de carpetas
- [ ] Variables de entorno
- [ ] Logs y dónde encontrarlos

**Guía de Troubleshooting**:
- [ ] Problemas comunes y soluciones
- [ ] Comandos de diagnóstico
- [ ] Logs a revisar por tipo de error
- [ ] Contactos de soporte

**Guía de Despliegue**:
- [ ] Cómo hacer deploy manual
- [ ] Cómo hacer rollback
- [ ] Checklist pre-deploy
- [ ] Checklist post-deploy

**Guía de Backups**:
- [ ] Cómo hacer backup manual
- [ ] Cómo restaurar backup
- [ ] Dónde están los backups
- [ ] Política de retención

### 🟦 FASE 8: Capacitación del Equipo (3h)
- [ ] Sesión de onboarding para ADMIN
- [ ] Acceso a servidor (SSH keys)
- [ ] Acceso a dashboards de monitoreo
- [ ] Revisión de runbooks
- [ ] Simulacro de incidente
- [ ] Q&A y documentación de dudas

### 🟦 FASE 9: Plan de Escalamiento (2h)

**Cuando escalar** (métricas trigger):
- [ ] >500 solicitudes/día consistentemente
- [ ] CPU >80% por más de 1 hora
- [ ] RAM >85% consistentemente
- [ ] Tiempo de respuesta >3s

**Opciones de escalamiento**:

**Vertical** (más recursos):
- [ ] Aumentar RAM (8 GB → 16 GB)
- [ ] Aumentar CPU (2 cores → 4 cores)
- [ ] Aumentar disco (50 GB → 100 GB)

**Horizontal** (más servidores):
- [ ] Load balancer (Nginx)
- [ ] Múltiples instancias de Backend
- [ ] BD con réplica read-only
- [ ] Cache con Redis

### 🟦 FASE 10: Checklist de Go-Live (2h)

**Pre-lanzamiento**:
- [ ] Todos los tests E2E pasan
- [ ] Performance cumple métricas
- [ ] SSL configurado (A+)
- [ ] Backups funcionando
- [ ] Monitoreo activo
- [ ] Alertas configuradas
- [ ] Documentación completa
- [ ] Equipo capacitado

**Día del lanzamiento**:
- [ ] Deploy en horario de bajo tráfico
- [ ] Equipo técnico disponible
- [ ] Monitoreo activo en vivo
- [ ] Comunicación lista (usuarios)
- [ ] Plan de rollback preparado

**Post-lanzamiento** (primeros 7 días):
- [ ] Monitoreo intensivo
- [ ] Revisión diaria de logs
- [ ] Recolección de feedback
- [ ] Correcciones rápidas si hay bugs menores
- [ ] Comunicación con usuarios

---

## 📊 Dashboard de Monitoreo (Ejemplo)

### Vista General
```
┌─────────────────────────────────────┐
│  Estado del Sistema     🟢 Online   │
│  Uptime: 99.8%                      │
│  Última actualización: hace 30s     │
├─────────────────────────────────────┤
│  Servicios                          │
│  🟢 Frontend        Resp: 250ms     │
│  🟢 Backend         Resp: 120ms     │
│  🟢 OCR             Resp: 8500ms    │
│  🟢 PostgreSQL      Conex: 5/100    │
├─────────────────────────────────────┤
│  Recursos del Servidor              │
│  CPU:  [████░░░░] 45%               │
│  RAM:  [██████░░] 68%               │
│  Disco:[███░░░░░] 32%               │
├─────────────────────────────────────┤
│  Actividad (Hoy)                    │
│  Solicitudes:      127              │
│  Certificados:     89               │
│  Usuarios activos: 23               │
└─────────────────────────────────────┘
```

---

## 🧪 Criterios de Aceptación

- [ ] Monitoreo funcionando 24/7
- [ ] Alertas se envían correctamente
- [ ] Logs centralizados y accesibles
- [ ] Dashboard de métricas funcional
- [ ] Procedimientos documentados
- [ ] Equipo capacitado
- [ ] Backups automáticos verificados
- [ ] Plan de escalamiento definido
- [ ] Sistema listo para Go-Live

---

## 📞 Contactos de Soporte

### Equipo Técnico
- **Backend Lead**: [Nombre] - [email] - [celular]
- **Frontend Lead**: [Nombre] - [email] - [celular]
- **DevOps**: [Nombre] - [email] - [celular]

### Servicios Externos
- **Proveedor de Servidor**: [Contacto]
- **Soporte de Dominio**: [Contacto]
- **Gemini API**: support@google.com

### Escalamiento
- **Director de TI**: [Nombre] - [email]
- **Gerencia**: [Nombre] - [email]

---

## ⚠️ Dependencias

- Sprint 01 - Docker configurado
- Sprint 02 - Sistema en producción
- Servidor funcionando correctamente

---

**✅ PROYECTO SIGCERH COMPLETAMENTE PLANIFICADO**

**🎉 Todos los 33 sprints han sido documentados.**

**🔗 Siguiente paso**: Iniciar implementación

