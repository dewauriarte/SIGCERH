# 🚀 INSTRUCCIONES DE EJECUCIÓN - BASE DE DATOS
## Sistema de Certificados Históricos (1985-2012)

---

## ✅ RESUMEN DE CORRECCIONES REALIZADAS

### Archivos Corregidos: 7
- ✅ `00_funciones_requeridas.sql` - Funciones base
- ✅ `01_schema_optimizado.sql` - Tablas principales (ActaFisica mejorada)
- ✅ `02_certificados_usuarios.sql` - Certificados, Usuarios, Pagos (con todos los campos del flujo)
- ✅ `03_foreign_keys.sql` - Relaciones (11 nuevas FK agregadas)
- ✅ `04_indices.sql` - Índices optimizados (23 obsoletos eliminados, 12 nuevos agregados)
- ✅ `05_triggers_funciones.sql` - Triggers y funciones (8 obsoletos eliminados)
- ✅ `06_triggers_institucion.sql` - Auto-asignación de institución

### Total de Cambios:
- ❌ 23 índices obsoletos eliminados
- ❌ 8 triggers obsoletos eliminados
- ❌ 4 funciones obsoletas eliminadas
- ✅ 38 campos nuevos agregados
- ✅ 11 foreign keys nuevas agregadas
- ✅ 12 índices nuevos agregados

---

## 📋 ORDEN DE EJECUCIÓN DE ARCHIVOS

### Opción A: Script Consolidado (Recomendado)

```bash
# 1. Crear la base de datos
psql -U postgres -f bd/00_create_database.sql

# 2. Ejecutar todo en un solo comando
psql -U postgres -d certificados_db -f bd/EJECUTAR_TODO.sql
```

### Opción B: Ejecución Manual Archivo por Archivo

```bash
# 1. Crear la base de datos
psql -U postgres -f bd/00_create_database.sql

# 2. Conectar a la base de datos
psql -U postgres -d certificados_db

# 3. Ejecutar en este orden:
\i bd/00_funciones_requeridas.sql
\i bd/01_schema_optimizado.sql
\i bd/02_certificados_usuarios.sql
\i bd/03_foreign_keys.sql
\i bd/04_indices.sql
\i bd/05_triggers_funciones.sql
\i bd/06_triggers_institucion.sql
```

### Opción C: Desde pgAdmin

1. Crear la base de datos `certificados_db` manualmente
2. Abrir Query Tool
3. Copiar y pegar el contenido completo de `EJECUTAR_TODO.sql`
4. Ejecutar (F5)

---

## 🗄️ TABLAS CREADAS

### Configuración (3 tablas)
- `ConfiguracionInstitucion` - Datos de la UGEL/IE
- `NivelEducativo` - Niveles (Inicial, Primaria, Secundaria)
- `InstitucionUsuario` - Relación usuarios-instituciones

### Académicas (5 tablas)
- `Estudiante` - Registro de estudiantes
- `AnioLectivo` - Años escolares
- `Grado` - Grados por nivel
- `AreaCurricular` - Áreas curriculares históricas
- `CurriculoGrado` - Mapeo área-grado-año ⭐ CRÍTICO

### Actas Físicas (1 tabla)
- `ActaFisica` - Actas escaneadas + datos OCR

### Certificados (4 tablas)
- `Certificado` - Certificado maestro
- `CertificadoDetalle` - Detalles por año (incluye comportamiento)
- `CertificadoNota` - Notas por área
- `Verificacion` - Log de verificaciones QR

### Solicitudes y Trámites (3 tablas)
- `TipoSolicitud` - Tipos de solicitudes
- `Solicitud` - Solicitudes (13 estados del flujo completo) ⭐ CRÍTICO
- `SolicitudHistorial` - Historial de cambios de estado

### Pagos (8 tablas)
- `Pago` - Pagos (incluye validación manual)
- `MetodoPago` - Métodos de pago configurados
- `PagoDetalle` - Detalles de transacciones
- `PasarelaPago` - Configuración de pasarelas
- `WebhookPago` - Log de webhooks
- `ConciliacionBancaria` - Conciliaciones
- `ConciliacionDetalle` - Detalles de conciliación
- `Notificacion` - Cola de notificaciones

### Usuarios y Seguridad (6 tablas)
- `Usuario` - Usuarios (INTERNOS y PUBLICOS) ⭐ CRÍTICO
- `Rol` - Roles del sistema
- `UsuarioRol` - Asignación de roles
- `Permiso` - Permisos disponibles
- `RolPermiso` - Permisos por rol
- `Sesion` - Sesiones activas

### Auditoría (2 tablas)
- `Auditoria` - Log de auditoría
- `Parametro` - Parámetros del sistema

**TOTAL: 32 TABLAS**

---

## 🔑 CAMPOS CRÍTICOS AGREGADOS

### 1. Solicitud (Trazabilidad del Flujo)
```sql
-- Estados del flujo (13 estados)
estado VARCHAR(50)

-- Usuarios de cada etapa
usuarioSolicitante_id       -- Usuario público
usuarioDerivacion_id        -- Mesa de Partes
usuarioBusqueda_id          -- Editor/Oficina de Actas
usuarioValidadorPago_id     -- Mesa de Partes (validación efectivo)
usuarioValidacionUGEL_id    -- UGEL
usuarioRegistroSIAGEC_id    -- SIAGEC
usuarioFirma_id             -- Dirección

-- Fechas de cada etapa
fechaDerivacion
fechaBusqueda
fechaActaEncontrada
fechaNotificacionPago
fechaValidacionUGEL
fechaRegistroSIAGEC

-- Tipo de firma elegido
tipoFirma VARCHAR(20)  -- 'DIGITAL' o 'MANUSCRITA'
```

### 2. Usuario (Soporte de Usuarios Públicos)
```sql
tipoUsuario VARCHAR(20)  -- 'INTERNO' o 'PUBLICO'
celular VARCHAR(15)      -- Para notificaciones SMS/WhatsApp
verificadoCelular BOOLEAN
verificadoEmail BOOLEAN
```

### 3. ActaFisica (Proceso de Búsqueda)
```sql
estadoBusqueda VARCHAR(30)     -- DISPONIBLE, ENCONTRADA, NO_ENCONTRADA
ubicacionFisica TEXT           -- Ubicación física del acta
colegioOrigen VARCHAR(200)
usuarioEncontro_id UUID
fechaEncontrado TIMESTAMPTZ
validadoManualmente BOOLEAN
```

### 4. Pago (Validación Manual)
```sql
validadoManualmente BOOLEAN
usuarioValidadorManual_id UUID
fechaValidacionManual TIMESTAMPTZ
comprobanteManual_url TEXT
```

### 5. Certificado (Firmas)
```sql
tipoFirma VARCHAR(20)            -- 'DIGITAL' o 'MANUSCRITA'
firmadoDigitalmente BOOLEAN
hashFirmaDigital VARCHAR(128)
usuarioSolicitante_id UUID
```

### 6. CertificadoDetalle (Comportamiento)
```sql
comportamiento VARCHAR(2)  -- 'AD', 'A', 'B', 'C'
```

---

## 🔍 VERIFICACIÓN POST-INSTALACIÓN

### Verificar Tablas Creadas
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- Debe retornar 32 tablas
```

### Verificar Índices
```sql
SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
-- Debe retornar ~150 índices
```

### Verificar Triggers
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
ORDER BY event_object_table;
-- Debe retornar ~15 triggers
```

### Verificar Foreign Keys
```sql
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
-- Debe retornar ~70 foreign keys
```

---

## 🔄 INTEGRACIÓN CON PRISMA

### Paso 1: Sincronizar Schema
```bash
npx prisma db pull
```

Esto generará/actualizará `prisma/schema.prisma` con todas las tablas.

### Paso 2: Generar Cliente
```bash
npx prisma generate
```

### Paso 3: Verificar (Opcional)
```bash
npx prisma studio
```

Abre interfaz visual en http://localhost:5555

---

## 📊 ESTADÍSTICAS FINALES

| Concepto | Cantidad |
|----------|----------|
| **Tablas Totales** | 32 |
| **Índices Totales** | ~150 |
| **Triggers** | ~15 |
| **Foreign Keys** | ~70 |
| **Funciones** | 10 |
| **Campos Nuevos Agregados** | 38 |

---

## ✅ FUNCIONALIDADES SOPORTADAS

### Flujo Completo del Sistema
✅ Solicitud de certificado  
✅ Derivación a Editor  
✅ Búsqueda de acta física (con trazabilidad)  
✅ Pago condicional (solo si se encuentra)  
✅ Validación manual de pagos en efectivo  
✅ Procesamiento OCR (Gemini + Python)  
✅ Validación UGEL  
✅ Registro SIAGEC con QR  
✅ Firma digital O manuscrita  
✅ Entrega digital o física  

### Tipos de Usuarios
✅ Usuarios INTERNOS (staff UGEL)  
✅ Usuarios PUBLICOS (ciudadanos)  

### Gestión de Certificados
✅ Certificados multi-año (1-5 años)  
✅ Cambios de currículo entre años  
✅ Competencias transversales  
✅ Comportamiento por año  
✅ Código QR + código virtual  
✅ Verificación pública  

### Métodos de Pago
✅ Yape/Plin (validación automática)  
✅ Tarjeta (validación automática)  
✅ Efectivo (validación manual Mesa de Partes)  
✅ Agente/Bodega  

---

## ⚠️ NOTAS IMPORTANTES

1. **Requisitos PostgreSQL**: Versión 12 o superior
2. **Extensiones requeridas**: `uuid-ossp`, `pg_trgm` (se instalan automáticamente)
3. **Primera institución**: Después de crear la BD, registrar la primera institución en `ConfiguracionInstitucion`
4. **Roles iniciales**: Crear roles base (ADMIN, MESA_PARTES, EDITOR, UGEL, SIAGEC, DIRECCION)
5. **Áreas curriculares**: Configurar áreas históricas por año en `CurriculoGrado`

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "function obtener_institucion_sesion() does not exist"
**Solución**: Ejecutar primero `00_funciones_requeridas.sql`

### Error: "relation does not exist"
**Solución**: Verificar orden de ejecución de archivos

### Error en índices
**Solución**: Las tablas Matricula, Seccion, Periodo, Nota ya NO existen (fueron eliminadas intencionalmente)

---

## 📞 SOPORTE

Si encuentras algún error durante la ejecución:

1. Verificar el orden de ejecución
2. Revisar logs de PostgreSQL
3. Verificar versión de PostgreSQL (≥ 12)
4. Consultar este documento

---

**Documento generado**: Octubre 2025  
**Versión de BD**: 1.0 Optimizada  
**Estado**: ✅ LISTO PARA EJECUTAR

