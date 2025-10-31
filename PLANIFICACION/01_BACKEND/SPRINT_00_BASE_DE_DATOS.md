# 🎯 SPRINT 00: BASE DE DATOS POSTGRESQL

> **Módulo**: Infraestructura  
> **Prioridad**: 🔴 CRÍTICA (Prerequisito de todo el sistema)  
> **Estado**: ✅ COMPLETADO

---

## 📌 Sprint Overview

### Objetivo Principal
Crear y configurar la base de datos PostgreSQL con las 32 tablas del sistema, incluyendo funciones, triggers, índices y relaciones necesarias para el funcionamiento del Sistema de Certificados Históricos (1985-2012).

### Valor de Negocio
Sin una base de datos correctamente estructurada, ningún otro componente del sistema puede funcionar. Este sprint es la FUNDACIÓN de todo el proyecto.

### Dependencias
- [x] PostgreSQL 15 instalado en servidor/local (✅ v18.0)
- [x] Acceso con permisos de superusuario (postgres)
- [x] pgAdmin o cliente SQL configurado (✅ DBeaver)

---

## 🎯 Sprint Goals (Definition of Done)

- [x] Base de datos `certificados_db` creada exitosamente ✅
- [x] Las 32 tablas creadas con todos sus campos ✅
- [x] ~70 Foreign Keys aplicadas correctamente ✅
- [x] ~110 índices creados para optimización ✅
- [x] ~15 triggers funcionando ✅
- [x] 10 funciones PostgreSQL operativas ✅
- [x] Seeds iniciales ejecutados (datos iniciales) ✅
- [x] Backup inicial creado ✅
- [x] Documentación de esquema generada ✅

---

## 📦 Entregables

### Base de Datos Completa
- [x] 32 Tablas operativas ✅
- [x] Relaciones integridad referencial ✅
- [x] Índices de performance ✅
- [x] Triggers automatizados ✅
- [x] Funciones auxiliares ✅

### Documentación
- [x] Diagrama ER (Entidad-Relación) ✅
- [x] Script de backup/restore ✅
- [x] Credenciales de conexión documentadas ✅
- [ ] README de ejecución

---

## ✅ Tasks Breakdown (Checklist Detallado)

### 🟦 FASE 1: Preparación del Entorno (30 min)

#### Verificación de Prerequisitos
- [ ] **T1.1**: Verificar PostgreSQL instalado
  ```bash
  psql --version
  # Esperado: PostgreSQL 15.x
  ```
  - Tiempo estimado: 5 min
  - Responsable: DevOps/Dev

- [ ] **T1.2**: Verificar acceso con usuario postgres
  ```bash
  psql -U postgres
  ```
  - Tiempo estimado: 5 min
  - Responsable: DevOps/Dev

- [ ] **T1.3**: Crear directorio para backups
  ```bash
  mkdir -p backups/
  ```
  - Tiempo estimado: 2 min
  - Responsable: Dev

- [ ] **T1.4**: Ubicar archivos SQL en carpeta `bd/`
  - Verificar existencia de 8 archivos:
    - `00_create_database.sql`
    - `00_funciones_requeridas.sql`
    - `01_schema_optimizado.sql`
    - `02_certificados_usuarios.sql`
    - `03_foreign_keys.sql`
    - `04_indices.sql`
    - `05_triggers_funciones.sql`
    - `06_triggers_institucion.sql`
  - Tiempo estimado: 5 min
  - Responsable: Dev

---

### 🟦 FASE 2: Creación de Base de Datos (15 min)

- [ ] **T2.1**: Eliminar BD anterior si existe (solo en desarrollo)
  ```bash
  psql -U postgres -c "DROP DATABASE IF EXISTS certificados_db;"
  ```
  - ⚠️ **PRECAUCIÓN**: Solo en desarrollo/testing
  - Tiempo estimado: 2 min
  - Responsable: Dev

- [ ] **T2.2**: Crear base de datos
  ```bash
  psql -U postgres -f bd/00_create_database.sql
  ```
  - Verificar mensaje: `CREATE DATABASE`
  - Tiempo estimado: 1 min
  - Responsable: Dev

- [ ] **T2.3**: Verificar creación de BD
  ```bash
  psql -U postgres -c "\l certificados_db"
  ```
  - Tiempo estimado: 1 min
  - Responsable: Dev

---

### 🟦 FASE 3: Ejecutar Scripts SQL en Orden (1 hora)

- [ ] **T3.1**: Conectar a la base de datos
  ```bash
  psql -U postgres -d certificados_db
  ```
  - Tiempo estimado: 1 min
  - Responsable: Dev

- [ ] **T3.2**: Crear extensiones y funciones base
  ```sql
  \i bd/00_funciones_requeridas.sql
  ```
  - Extensiones creadas: `uuid-ossp`, `pg_trgm`
  - Funciones creadas: 
    - `obtener_institucion_default()`
    - `obtener_institucion_sesion()`
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T3.3**: Crear tablas principales (8 tablas)
  ```sql
  \i bd/01_schema_optimizado.sql
  ```
  - Tablas creadas:
    - ConfiguracionInstitucion
    - NivelEducativo
    - Estudiante
    - AnioLectivo
    - Grado
    - AreaCurricular
    - CurriculoGrado
    - ActaFisica
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T3.4**: Crear tablas de certificados y usuarios (24 tablas)
  ```sql
  \i bd/02_certificados_usuarios.sql
  ```
  - Tablas críticas:
    - Certificado, CertificadoDetalle, CertificadoNota
    - Solicitud (con 13 estados)
    - Pago (con validación manual)
    - Usuario (INTERNO/PUBLICO)
    - Rol, Permiso
    - Notificacion
  - Tiempo estimado: 15 min
  - Responsable: Dev

- [ ] **T3.5**: Crear Foreign Keys (relaciones)
  ```sql
  \i bd/03_foreign_keys.sql
  ```
  - ~70 Foreign Keys creadas
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T3.6**: Crear índices de optimización
  ```sql
  \i bd/04_indices.sql
  ```
  - ~150 índices creados
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T3.7**: Crear triggers y funciones
  ```sql
  \i bd/05_triggers_funciones.sql
  ```
  - Triggers creados:
    - actualizar_fecha_modificacion()
    - registrar_historial_solicitud()
    - validar_certificado_activo()
    - generar_numero_expediente()
    - generar_numero_orden()
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T3.8**: Crear triggers de auto-asignación
  ```sql
  \i bd/06_triggers_institucion.sql
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

---

### 🟦 FASE 4: Verificación Post-Instalación (30 min)

- [ ] **T4.1**: Verificar número de tablas
  ```sql
  SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema='public';
  ```
  - **Resultado esperado**: 32
  - Tiempo estimado: 2 min
  - Responsable: Dev

- [ ] **T4.2**: Verificar índices creados
  ```sql
  SELECT COUNT(*) FROM pg_indexes 
  WHERE schemaname='public';
  ```
  - **Resultado esperado**: ~150
  - Tiempo estimado: 2 min
  - Responsable: Dev

- [ ] **T4.3**: Verificar triggers
  ```sql
  SELECT COUNT(*) FROM information_schema.triggers 
  WHERE trigger_schema='public';
  ```
  - **Resultado esperado**: ~15
  - Tiempo estimado: 2 min
  - Responsable: Dev

- [ ] **T4.4**: Listar todas las tablas creadas
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema='public' 
  ORDER BY table_name;
  ```
  - Verificar las 32 tablas manualmente
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T4.5**: Verificar Foreign Keys
  ```sql
  SELECT COUNT(*) FROM information_schema.table_constraints 
  WHERE constraint_type='FOREIGN KEY' AND table_schema='public';
  ```
  - **Resultado esperado**: ~70
  - Tiempo estimado: 2 min
  - Responsable: Dev

- [ ] **T4.6**: Verificar funciones
  ```sql
  SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
  ```
  - Tiempo estimado: 2 min
  - Responsable: Dev

---

### 🟦 FASE 5: Seeds Iniciales (30 min)

- [ ] **T5.1**: Crear archivo de seeds
  - Crear `bd/seeds/01_datos_iniciales.sql`
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T5.2**: Insertar ConfiguracionInstitucion
  ```sql
  INSERT INTO ConfiguracionInstitucion 
  (codigoModular, nombre, ugel, distrito, departamento, activo)
  VALUES 
  ('0000000', 'UGEL XX - PRUEBA', 'UGEL XX', 'Distrito', 'Departamento', true);
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T5.3**: Insertar Roles (7 roles)
  ```sql
  INSERT INTO Rol (codigo, nombre, nivel) VALUES
  ('PUBLICO', 'Usuario Público', 1),
  ('MESA_DE_PARTES', 'Mesa de Partes', 2),
  ('EDITOR', 'Editor/Oficina de Actas', 3),
  ('ENCARGADO_UGEL', 'Encargado UGEL', 4),
  ('ENCARGADO_SIAGEC', 'Encargado SIAGEC', 5),
  ('DIRECCION', 'Dirección', 6),
  ('ADMIN', 'Administrador', 7);
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T5.4**: Insertar Permisos básicos
  - Crear permisos por módulo
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T5.5**: Insertar Niveles Educativos
  ```sql
  INSERT INTO NivelEducativo (codigo, nombre, orden) VALUES
  ('INICIAL', 'Inicial', 1),
  ('PRIMARIA', 'Primaria', 2),
  ('SECUNDARIA', 'Secundaria', 3);
  ```
  - Tiempo estimado: 2 min
  - Responsable: Dev

- [ ] **T5.6**: Insertar Grados (1° a 5° secundaria)
  ```sql
  INSERT INTO Grado (numero, nombre, nombreCorto, orden) VALUES
  (1, 'Primer Grado', '1°', 1),
  (2, 'Segundo Grado', '2°', 2),
  (3, 'Tercer Grado', '3°', 3),
  (4, 'Cuarto Grado', '4°', 4),
  (5, 'Quinto Grado', '5°', 5);
  ```
  - Tiempo estimado: 3 min
  - Responsable: Dev

---

### 🟦 FASE 6: Backup y Documentación (30 min)

- [ ] **T6.1**: Crear backup inicial
  ```bash
  pg_dump -U postgres certificados_db > backups/certificados_db_inicial_$(date +%Y%m%d).sql
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T6.2**: Verificar tamaño del backup
  ```bash
  ls -lh backups/
  ```
  - Tiempo estimado: 1 min
  - Responsable: Dev

- [ ] **T6.3**: Generar diagrama ER (opcional con herramienta)
  - Usar pgAdmin o herramienta externa
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T6.4**: Documentar credenciales en `.env.example`
  ```
  DATABASE_URL="postgresql://postgres:password@localhost:5432/certificados_db"
  ```
  - ⚠️ NO commitear `.env` real
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T6.5**: Crear script de restore
  ```bash
  # restore.sh
  psql -U postgres -c "DROP DATABASE IF EXISTS certificados_db;"
  psql -U postgres -c "CREATE DATABASE certificados_db;"
  psql -U postgres -d certificados_db < backups/certificados_db_inicial.sql
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

---

## 🗄️ Tablas Creadas (32 Total)

### Configuración (3 tablas)
- [x] ConfiguracionInstitucion
- [x] NivelEducativo
- [x] InstitucionUsuario

### Académicas (5 tablas)
- [x] Estudiante
- [x] AnioLectivo
- [x] Grado
- [x] AreaCurricular
- [x] CurriculoGrado ⭐

### Actas (1 tabla)
- [x] ActaFisica ⭐

### Certificados (4 tablas)
- [x] Certificado
- [x] CertificadoDetalle
- [x] CertificadoNota
- [x] Verificacion

### Solicitudes (3 tablas)
- [x] TipoSolicitud
- [x] Solicitud ⭐⭐ (13 estados)
- [x] SolicitudHistorial

### Pagos (7 tablas)
- [x] Pago
- [x] MetodoPago
- [x] PagoDetalle
- [x] PasarelaPago
- [x] WebhookPago
- [x] ConciliacionBancaria
- [x] ConciliacionDetalle

### Notificaciones (1 tabla)
- [x] Notificacion

### Usuarios y Seguridad (6 tablas)
- [x] Usuario ⭐
- [x] Rol
- [x] UsuarioRol
- [x] Permiso
- [x] RolPermiso
- [x] Sesion

### Auditoría (2 tablas)
- [x] Auditoria
- [x] Parametro

---

## 🔧 Herramientas Utilizadas

| Herramienta | Versión | Propósito |
|-------------|---------|-----------|
| PostgreSQL | 15.x | Base de datos relacional |
| psql | 15.x | Cliente CLI |
| pgAdmin | 4.x (opcional) | Cliente GUI |
| pg_dump | 15.x | Backups |

---

## 🧪 Criterios de Aceptación

- [ ] Comando `\dt` muestra 32 tablas
- [ ] Comando `\df` muestra las funciones creadas
- [ ] No hay errores en la ejecución de scripts
- [ ] Seeds ejecutados correctamente
- [ ] Backup inicial creado y verificado
- [ ] Todas las Foreign Keys funcionan (no permiten inserts inválidos)
- [ ] Los triggers se ejecutan correctamente (probar uno manualmente)

---

## 📊 Métricas de Éxito

| Métrica | Objetivo | Estado |
|---------|----------|--------|
| Tablas creadas | 32 | ⬜ |
| Foreign Keys | ~70 | ⬜ |
| Índices | ~150 | ⬜ |
| Triggers | ~15 | ⬜ |
| Funciones | 10+ | ⬜ |
| Tiempo de creación | < 2 horas | ⬜ |
| Errores en scripts | 0 | ⬜ |

---

## ⚠️ Riesgos & Mitigación

| # | Riesgo | Probabilidad | Impacto | Mitigación | Estado |
|---|--------|--------------|---------|------------|--------|
| 1 | PostgreSQL no instalado | Media | Alto | Instalar antes de comenzar | ⬜ |
| 2 | Permisos insuficientes | Baja | Alto | Usar usuario postgres con permisos | ⬜ |
| 3 | Scripts con errores | Baja | Medio | Ejecutar uno por uno y verificar | ⬜ |
| 4 | BD anterior existe | Media | Bajo | DROP DATABASE al inicio (solo dev) | ⬜ |

---

## 📚 Referencias & Documentación

### Documentación PostgreSQL
- [PostgreSQL 15 Documentation](https://www.postgresql.org/docs/15/)
- [psql Command Reference](https://www.postgresql.org/docs/15/app-psql.html)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/15/trigger-definition.html)

### Scripts del Proyecto
- Ubicación: `C:\SIGCERH\bd\`
- Orden de ejecución: Ver `bd/ORDEN_EJECUCION.txt`
- Documentación: `bd/README_EJECUCION.md`

---

## 📝 Notas Técnicas

### Consideración 1: Solo una Institución Activa
La tabla `ConfiguracionInstitucion` tiene un constraint que garantiza que solo pueda existir una institución con `activo=true`. Esto es por diseño del sistema.

### Consideración 2: Funciones Requeridas
Las funciones `obtener_institucion_default()` y `obtener_institucion_sesion()` deben crearse ANTES de las tablas, porque algunas columnas las usan como valor por defecto.

### Consideración 3: Orden de Ejecución Crítico
El orden de los scripts es CRÍTICO. No se pueden ejecutar en otro orden porque hay dependencias entre ellos.

### Consideración 4: Extensiones PostgreSQL
- `uuid-ossp`: Para generar UUIDs automáticamente
- `pg_trgm`: Para búsquedas de texto similares (useful en búsqueda de estudiantes)

---

## 🔄 Sprint Retrospective (Completar al finalizar)

### ✅ Qué funcionó bien
- [Espacio para completar después]

### ⚠️ Qué puede mejorar
- [Espacio para completar después]

### 💡 Acciones para próximo sprint
- [ ] [Espacio para completar después]

---

## 📅 Sprint Timeline

| Fecha | Actividad | Responsable | Estado |
|-------|-----------|-------------|--------|
| DD/MM | Inicio del sprint | Dev | ⬜ |
| DD/MM | Instalación PostgreSQL (si necesario) | DevOps | ⬜ |
| DD/MM | Ejecución de scripts SQL | Dev | ⬜ |
| DD/MM | Verificación de tablas | Dev | ⬜ |
| DD/MM | Seeds iniciales | Dev | ⬜ |
| DD/MM | Backup inicial | Dev | ⬜ |
| DD/MM | Sprint review | Team | ⬜ |

---

**📝 Última actualización**: 31/10/2025  
**👤 Actualizado por**: Sistema  
**📌 Versión**: 1.0  
**🔗 Siguiente Sprint**: [SPRINT_01_SETUP_INICIAL.md](./SPRINT_01_SETUP_INICIAL.md)