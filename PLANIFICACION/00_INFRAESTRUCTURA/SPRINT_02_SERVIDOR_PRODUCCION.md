# 🎯 SPRINT 02: SERVIDOR DE PRODUCCIÓN

> **Módulo**: Infraestructura  
> **Duración**: 1-2 días  
> **Prioridad**: 🟡 ALTA  
> **Cuándo Hacerlo**: ⚠️ **AL FINAL** - Después de Integración, antes de Despliegue  
> **Estado**: ⬜ No iniciado

---

## ⚠️ IMPORTANTE

**NO HACER ESTE SPRINT AL INICIO**

Este sprint se ejecuta **AL FINAL**, cuando:
- ✅ Backend funciona completamente en LOCAL
- ✅ Frontend funciona completamente en LOCAL
- ✅ OCR funciona completamente en LOCAL
- ✅ Integración completa testeada en LOCAL
- ✅ Todo el sistema funciona en `localhost`

**Orden correcto**:
1. Desarrollo LOCAL completo (Sprint 01-28)
2. Integración LOCAL (Sprint 29-31)
3. **Recién aquí → Preparar servidor** (Sprint 02 de Infraestructura)
4. Despliegue (Sprint 32-33)

---

## 📌 Objetivo

Preparar servidor de producción con Ubuntu 22.04 LTS, configurar seguridad básica e instalar todo el software necesario **solo cuando tengas todo funcionando localmente**.

---

## 🎯 Metas del Sprint

- [ ] Servidor Ubuntu 22.04 accesible vía SSH
- [ ] Seguridad básica configurada
- [ ] Node.js 20 LTS instalado
- [ ] PostgreSQL 15 instalado
- [ ] Python 3.11+ instalado
- [ ] Nginx instalado
- [ ] Docker & Docker Compose instalados
- [ ] Usuario no-root creado
- [ ] Firewall configurado

---

## ✅ Tareas Principales

### 🟦 FASE 1: Acceso Inicial al Servidor (30 min)

**Requisitos previos**:
- [ ] Servidor Ubuntu 22.04 LTS
- [ ] IP pública estática
- [ ] Acceso root vía SSH

**Primer acceso**:
- [ ] Conectar: `ssh root@IP_DEL_SERVIDOR`
- [ ] Aceptar fingerprint
- [ ] Verificar sistema: `lsb_release -a`
- [ ] Verificar recursos:
  ```bash
  free -h    # RAM
  df -h      # Disco
  nproc      # CPU cores
  ```

### 🟦 FASE 2: Actualización del Sistema (20 min)
- [ ] Actualizar repos:
  ```bash
  apt update
  apt upgrade -y
  ```
- [ ] Reiniciar si es necesario: `reboot`
- [ ] Instalar utilidades básicas:
  ```bash
  apt install -y curl wget git unzip nano vim htop
  ```

### 🟦 FASE 3: Crear Usuario No-Root (20 min)
- [ ] Crear usuario para deploy:
  ```bash
  adduser deploy
  ```
- [ ] Agregar a grupo sudo:
  ```bash
  usermod -aG sudo deploy
  ```
- [ ] Configurar SSH para usuario deploy:
  ```bash
  mkdir -p /home/deploy/.ssh
  cp ~/.ssh/authorized_keys /home/deploy/.ssh/
  chown -R deploy:deploy /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  chmod 600 /home/deploy/.ssh/authorized_keys
  ```
- [ ] Probar acceso: `ssh deploy@IP_DEL_SERVIDOR`

### 🟦 FASE 4: Seguridad SSH (30 min)

**Configurar SSH** (`/etc/ssh/sshd_config`):
- [ ] Deshabilitar login root:
  ```
  PermitRootLogin no
  ```
- [ ] Solo autenticación por clave:
  ```
  PasswordAuthentication no
  PubkeyAuthentication yes
  ```
- [ ] Cambiar puerto (opcional):
  ```
  Port 2222
  ```
- [ ] Reiniciar SSH: `systemctl restart sshd`
- [ ] Testing de conexión con usuario deploy

### 🟦 FASE 5: Firewall UFW (20 min)
- [ ] Instalar: `apt install ufw -y`
- [ ] Configurar reglas:
  ```bash
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow 22/tcp   # o 2222 si cambió puerto SSH
  ufw allow 80/tcp   # HTTP
  ufw allow 443/tcp  # HTTPS
  ```
- [ ] Activar: `ufw enable`
- [ ] Verificar: `ufw status`

### 🟦 FASE 6: Node.js 20 LTS (20 min)
- [ ] Instalar desde NodeSource:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  apt-get install -y nodejs
  ```
- [ ] Verificar: `node --version`
- [ ] Verificar: `npm --version`
- [ ] Instalar PM2 (process manager):
  ```bash
  npm install -g pm2
  pm2 startup
  ```

### 🟦 FASE 7: PostgreSQL 15 (30 min)
- [ ] Agregar repositorio oficial:
  ```bash
  sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
  apt update
  apt install postgresql-15 -y
  ```
- [ ] Verificar servicio: `systemctl status postgresql`
- [ ] Configurar contraseña:
  ```bash
  sudo -u postgres psql
  ALTER USER postgres PASSWORD 'strong-password-here';
  \q
  ```
- [ ] Permitir conexiones locales (`/etc/postgresql/15/main/pg_hba.conf`)
- [ ] Reiniciar: `systemctl restart postgresql`

### 🟦 FASE 8: Python 3.11+ (20 min)
- [ ] Instalar:
  ```bash
  apt install -y python3.11 python3.11-venv python3-pip
  ```
- [ ] Verificar: `python3 --version`
- [ ] Actualizar pip:
  ```bash
  pip3 install --upgrade pip
  ```
- [ ] Instalar virtualenv:
  ```bash
  pip3 install virtualenv
  ```

### 🟦 FASE 9: Nginx (15 min)
- [ ] Instalar:
  ```bash
  apt install nginx -y
  ```
- [ ] Iniciar:
  ```bash
  systemctl start nginx
  systemctl enable nginx
  ```
- [ ] Verificar: `systemctl status nginx`
- [ ] Probar en navegador: `http://IP_DEL_SERVIDOR`
- [ ] Debe mostrar página por defecto de Nginx

### 🟦 FASE 10: Docker & Docker Compose (30 min)
- [ ] Instalar Docker:
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  ```
- [ ] Agregar usuario deploy a grupo docker:
  ```bash
  usermod -aG docker deploy
  ```
- [ ] Instalar Docker Compose:
  ```bash
  apt install docker-compose -y
  ```
- [ ] Verificar:
  ```bash
  docker --version
  docker-compose --version
  ```
- [ ] Test: `docker run hello-world`

### 🟦 FASE 11: Certbot (15 min)
- [ ] Instalar:
  ```bash
  apt install certbot python3-certbot-nginx -y
  ```
- [ ] Verificar: `certbot --version`
- [ ] **No obtener certificado aún** (se hará en Sprint de Despliegue)

### 🟦 FASE 12: Fail2ban (20 min)
- [ ] Instalar:
  ```bash
  apt install fail2ban -y
  ```
- [ ] Configurar (`/etc/fail2ban/jail.local`):
  ```ini
  [sshd]
  enabled = true
  port = 22
  maxretry = 3
  bantime = 3600
  ```
- [ ] Iniciar:
  ```bash
  systemctl start fail2ban
  systemctl enable fail2ban
  ```
- [ ] Verificar: `fail2ban-client status sshd`

### 🟦 FASE 13: Configuración de Zona Horaria (10 min)
- [ ] Configurar Lima/Perú:
  ```bash
  timedatectl set-timezone America/Lima
  ```
- [ ] Verificar: `timedatectl`

### 🟦 FASE 14: Configuración de Locale (10 min)
- [ ] Instalar locale español:
  ```bash
  locale-gen es_PE.UTF-8
  update-locale LANG=es_PE.UTF-8
  ```
- [ ] Verificar: `locale`

### 🟦 FASE 15: Estructura de Carpetas (15 min)
- [ ] Crear estructura:
  ```bash
  mkdir -p /var/www/certificados
  mkdir -p /var/log/certificados
  mkdir -p /var/backups/certificados
  ```
- [ ] Cambiar propietario:
  ```bash
  chown -R deploy:deploy /var/www/certificados
  chown -R deploy:deploy /var/log/certificados
  chown -R deploy:deploy /var/backups/certificados
  ```
- [ ] Verificar permisos: `ls -la /var/www/`

### 🟦 FASE 16: Swap (Opcional) (15 min)

**Si RAM < 8 GB**:
- [ ] Crear swap de 4 GB:
  ```bash
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  ```
- [ ] Hacer permanente (`/etc/fstab`):
  ```
  /swapfile none swap sw 0 0
  ```
- [ ] Verificar: `free -h`

### 🟦 FASE 17: Monitoreo Básico (20 min)
- [ ] Instalar htop:
  ```bash
  apt install htop -y
  ```
- [ ] Instalar ncdu (disk usage):
  ```bash
  apt install ncdu -y
  ```
- [ ] Configurar logs automáticos:
  ```bash
  apt install logrotate -y
  ```

### 🟦 FASE 18: Testing Final (30 min)

**Verificar todo instalado**:
- [ ] Node.js: `node --version` (v20.x.x)
- [ ] npm: `npm --version`
- [ ] PostgreSQL: `sudo -u postgres psql -c "SELECT version();"`
- [ ] Python: `python3 --version` (3.11+)
- [ ] Nginx: `nginx -v`
- [ ] Docker: `docker --version`
- [ ] Docker Compose: `docker-compose --version`
- [ ] PM2: `pm2 --version`
- [ ] Certbot: `certbot --version`

**Verificar servicios corriendo**:
- [ ] PostgreSQL: `systemctl status postgresql`
- [ ] Nginx: `systemctl status nginx`
- [ ] Docker: `systemctl status docker`
- [ ] Fail2ban: `systemctl status fail2ban`

**Verificar seguridad**:
- [ ] Firewall activo: `ufw status`
- [ ] SSH configurado correctamente
- [ ] Usuario root deshabilitado
- [ ] Solo autenticación por clave

### 🟦 FASE 19: Documentación (15 min)
- [ ] Documentar:
  - IP del servidor
  - Usuario de deploy
  - Puerto SSH (si cambió)
  - Contraseña de PostgreSQL (en lugar seguro)
  - Ubicación de logs
  - Ubicación de backups
- [ ] Guardar en lugar seguro (NO en repositorio)

---

## 🧪 Criterios de Aceptación

- [ ] Servidor Ubuntu 22.04 accesible
- [ ] Usuario deploy funcionando
- [ ] SSH seguro (solo clave pública)
- [ ] Firewall configurado
- [ ] Node.js 20 instalado
- [ ] PostgreSQL 15 instalado y corriendo
- [ ] Python 3.11+ instalado
- [ ] Nginx instalado y corriendo
- [ ] Docker funcionando
- [ ] Fail2ban activo
- [ ] Todos los servicios inician automáticamente
- [ ] Estructura de carpetas creada
- [ ] Testing exitoso

---

## 📋 Checklist de Software en Producción

- [ ] Ubuntu 22.04 LTS
- [ ] Node.js 20.x
- [ ] npm + PM2
- [ ] PostgreSQL 15
- [ ] Python 3.11+
- [ ] Nginx
- [ ] Docker + Docker Compose
- [ ] Certbot
- [ ] Fail2ban
- [ ] UFW
- [ ] Git
- [ ] htop, ncdu

---

## 🔐 Checklist de Seguridad

- [ ] Root login deshabilitado
- [ ] Solo autenticación por clave pública
- [ ] Firewall activo (UFW)
- [ ] Fail2ban configurado
- [ ] Puerto SSH cambiado (opcional)
- [ ] Actualizaciones automáticas (opcional)
- [ ] Swap configurado (si necesario)

---

## ⚠️ Problemas Comunes

### No puedo conectar después de configurar SSH
- Verificar que agregaste tu clave pública
- Verificar permisos de `.ssh/` (700) y `authorized_keys` (600)
- Revisar logs: `tail -f /var/log/auth.log`

### PostgreSQL no inicia
- Verificar logs: `tail -f /var/log/postgresql/postgresql-15-main.log`
- Verificar espacio en disco: `df -h`
- Verificar puerto 5432 libre: `netstat -tulpn | grep 5432`

### Docker no funciona para usuario deploy
- Verificar grupo: `groups deploy`
- Logout y login nuevamente
- Reiniciar servicio Docker

### Nginx no arranca
- Verificar configuración: `nginx -t`
- Verificar puerto 80 libre: `netstat -tulpn | grep 80`
- Revisar logs: `tail -f /var/log/nginx/error.log`

---

## 📊 Recursos del Servidor

### Configuración Mínima
- **CPU**: 2 cores
- **RAM**: 4 GB + 4 GB swap
- **Disco**: 50 GB

### Configuración Recomendada
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Disco**: 100 GB SSD

### Configuración Óptima
- **CPU**: 8 cores
- **RAM**: 16 GB
- **Disco**: 200 GB SSD

---

## 🔗 Siguiente Paso

Servidor de producción listo. Ahora puedes:

1. **Iniciar desarrollo** → Backend Sprint 00 (Base de Datos)
2. **Configurar dominio** → Apuntar DNS a IP del servidor
3. **Obtener certificado SSL** → En Sprint de Despliegue

---

**✅ INFRAESTRUCTURA COMPLETADA**

**🎉 PLANIFICACIÓN 100% COMPLETA - 33/33 SPRINTS**

---

**🔗 Siguiente módulo**: [01_BACKEND/SPRINT_00_BASE_DE_DATOS.md](../01_BACKEND/SPRINT_00_BASE_DE_DATOS.md)

