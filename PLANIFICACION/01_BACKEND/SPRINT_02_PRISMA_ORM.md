# 🎯 SPRINT 02: PRISMA ORM & CONEXIÓN BD

> **Módulo**: Backend - ORM y Base de Datos  
> **Duración**: 2-3 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ✅ COMPLETADO

---

## 📌 Sprint Overview

### Objetivo Principal
Configurar Prisma ORM, generar esquema desde la base de datos PostgreSQL existente (introspection), crear cliente Prisma, configurar migraciones y seeds iniciales con las 32 tablas del sistema.

### Valor de Negocio
Prisma proporciona type-safety, autocomplete y facilita las operaciones de base de datos. Generar el esquema desde la BD existente garantiza que el ORM esté perfectamente sincronizado con la estructura SQL ya creada en Sprint 00.

### Dependencias
- [x] Sprint 00 - Base de datos PostgreSQL con 32 tablas creadas ✅
- [x] Sprint 01 - Proyecto Backend configurado ✅

---

## 🎯 Sprint Goals (Definition of Done)

- [x] Prisma instalado y configurado ✅
- [x] Schema Prisma generado con las 32 tablas (introspection exitoso) ✅
- [x] Cliente Prisma funcionando ✅
- [x] Singleton de PrismaClient implementado ✅
- [x] Conexión a BD verificada ✅
- [x] Seeds iniciales creados y ejecutados ✅
- [x] Scripts de migración configurados ✅
- [x] Documentación de modelos Prisma ✅
- [x] Tests de conexión exitosos ✅

---

## 📦 Entregables

### Prisma Configurado
- [x] `prisma/schema.prisma` con 32 modelos ✅
- [x] Cliente Prisma generado ✅
- [x] Servicio de conexión singleton (`src/config/database.ts`) ✅

### Seeds y Datos Iniciales
- [x] Seeds de roles (7 roles) ✅
- [x] Seeds de configuración inicial ✅
- [x] Seeds de datos (bd/07_seed_datos_iniciales.sql) ✅

### Documentación
- [x] Documentación de modelos ✅
- [x] Guía de uso de Prisma (Backend README.md) ✅
- [x] Scripts de migraciones ✅

---

## ✅ Tasks Breakdown (Checklist Detallado)

### 🟦 FASE 1: Instalación de Prisma (15 min)

- [ ] **T1.1**: Instalar Prisma CLI y Client
  ```bash
  cd backend
  npm install @prisma/client
  npm install -D prisma
  ```
  - Tiempo estimado: 3 min
  - Responsable: Dev

- [ ] **T1.2**: Verificar instalación
  ```bash
  npx prisma --version
  ```
  - Debe mostrar versión 5.x
  - Tiempo estimado: 1 min
  - Responsable: Dev

- [ ] **T1.3**: Inicializar Prisma
  ```bash
  npx prisma init
  ```
  - Crea carpeta `prisma/` y archivo `schema.prisma`
  - Crea/actualiza `.env` con DATABASE_URL
  - Tiempo estimado: 2 min
  - Responsable: Dev

---

### 🟦 FASE 2: Configuración Inicial (20 min)

- [ ] **T2.1**: Configurar DATABASE_URL en `.env`
  ```env
  DATABASE_URL="postgresql://postgres:password@localhost:5432/certificados_db?schema=public"
  ```
  - Usar credenciales reales de PostgreSQL
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T2.2**: Configurar generador en `prisma/schema.prisma`
  ```prisma
  // ============================================
  // CONFIGURACIÓN DEL CLIENTE PRISMA
  // ============================================
  
  generator client {
    provider = "prisma-client-js"
    output   = "../node_modules/.prisma/client"
    previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
  }
  
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
    extensions = [uuid_ossp(map: "uuid-ossp"), pg_trgm]
  }
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T2.3**: Probar conexión a BD
  ```bash
  npx prisma db pull --print
  ```
  - Debe mostrar las tablas detectadas
  - Si hay error, verificar DATABASE_URL
  - Tiempo estimado: 5 min
  - Responsable: Dev

---

### 🟦 FASE 3: Introspección de Base de Datos (30 min)

- [ ] **T3.1**: Ejecutar introspección (pull desde BD)
  ```bash
  npx prisma db pull
  ```
  - Esto generará automáticamente el schema desde las 32 tablas
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T3.2**: Revisar schema generado
  - Abrir `prisma/schema.prisma`
  - Verificar que existan 32 modelos:
    - ConfiguracionInstitucion
    - NivelEducativo
    - InstitucionUsuario
    - Estudiante
    - AnioLectivo
    - Grado
    - AreaCurricular
    - CurriculoGrado
    - ActaFisica
    - Certificado
    - CertificadoDetalle
    - CertificadoNota
    - Verificacion
    - TipoSolicitud
    - Solicitud
    - SolicitudHistorial
    - Pago
    - MetodoPago
    - PagoDetalle
    - PasarelaPago
    - WebhookPago
    - ConciliacionBancaria
    - ConciliacionDetalle
    - Notificacion
    - Usuario
    - Rol
    - UsuarioRol
    - Permiso
    - RolPermiso
    - Sesion
    - Auditoria
    - Parametro
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T3.3**: Ajustar nombres de modelos (CamelCase)
  - Prisma genera nombres exactos de tablas
  - Renombrar si es necesario usando `@@map`:
  ```prisma
  model ConfiguracionInstitucion {
    // ... campos ...
    
    @@map("ConfiguracionInstitucion") // Nombre de tabla en BD
  }
  ```
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T3.4**: Formatear schema
  ```bash
  npx prisma format
  ```
  - Tiempo estimado: 1 min
  - Responsable: Dev

---

### 🟦 FASE 4: Ajustes y Optimizaciones del Schema (1 hora)

- [ ] **T4.1**: Agregar comentarios a modelos críticos
  ```prisma
  /// Tabla de configuración de la institución educativa (UGEL/IE)
  /// Solo puede existir una institución activa a la vez
  model ConfiguracionInstitucion {
    id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    codigoModular       String   @unique @db.VarChar(20)
    nombre              String   @db.VarChar(255)
    // ... resto de campos
    
    @@map("ConfiguracionInstitucion")
  }
  
  /// Solicitudes de certificados (13 estados del flujo completo)
  model Solicitud {
    id                    String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    numeroExpediente      String?  @unique @db.VarChar(50)
    estado                String   @default("REGISTRADA") @db.VarChar(50)
    // ... resto de campos
    
    @@map("Solicitud")
  }
  ```
  - Tiempo estimado: 20 min
  - Responsable: Dev

- [ ] **T4.2**: Verificar relaciones (Foreign Keys)
  - Prisma debe haber generado las relaciones automáticamente
  - Ejemplo:
  ```prisma
  model Solicitud {
    id             String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    estudiante_id  String      @db.Uuid
    
    // Relación con Estudiante
    estudiante     Estudiante  @relation(fields: [estudiante_id], references: [id])
    
    @@map("Solicitud")
  }
  ```
  - Verificar que todas las FK estén correctas
  - Tiempo estimado: 20 min
  - Responsable: Dev

- [ ] **T4.3**: Agregar índices personalizados (si es necesario)
  ```prisma
  model Estudiante {
    id                String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    dni               String   @db.VarChar(8)
    apellidoPaterno   String   @db.VarChar(100)
    apellidoMaterno   String   @db.VarChar(100)
    nombres           String   @db.VarChar(150)
    
    // Índices
    @@index([dni])
    @@index([apellidoPaterno, apellidoMaterno])
    @@map("Estudiante")
  }
  ```
  - Tiempo estimado: 15 min
  - Responsable: Dev

- [ ] **T4.4**: Validar schema final
  ```bash
  npx prisma validate
  ```
  - No debe mostrar errores
  - Tiempo estimado: 2 min
  - Responsable: Dev

---

### 🟦 FASE 5: Generar Cliente Prisma (15 min)

- [ ] **T5.1**: Generar cliente
  ```bash
  npx prisma generate
  ```
  - Genera tipos TypeScript automáticamente
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T5.2**: Verificar generación
  - Cliente generado en `node_modules/.prisma/client/`
  - Verificar tipos TypeScript disponibles
  - Tiempo estimado: 3 min
  - Responsable: Dev

- [ ] **T5.3**: Probar importación en código
  ```typescript
  import { PrismaClient } from '@prisma/client';
  const prisma = new PrismaClient();
  ```
  - Debe tener autocomplete de todos los modelos
  - Tiempo estimado: 2 min
  - Responsable: Dev

---

### 🟦 FASE 6: Singleton de PrismaClient (30 min)

- [ ] **T6.1**: Crear `src/config/database.ts`
  ```typescript
  import { PrismaClient } from '@prisma/client';
  import { logger } from './logger.config';
  
  // Singleton para PrismaClient
  class DatabaseService {
    private static instance: DatabaseService;
    private prisma: PrismaClient;
  
    private constructor() {
      this.prisma = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
      });
  
      // Logs de queries (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        this.prisma.$on('query', (e: any) => {
          logger.debug(`Query: ${e.query}`);
          logger.debug(`Duration: ${e.duration}ms`);
        });
      }
  
      // Logs de errores
      this.prisma.$on('error', (e: any) => {
        logger.error('Prisma Error:', e);
      });
  
      // Logs de warnings
      this.prisma.$on('warn', (e: any) => {
        logger.warn('Prisma Warning:', e);
      });
    }
  
    public static getInstance(): DatabaseService {
      if (!DatabaseService.instance) {
        DatabaseService.instance = new DatabaseService();
      }
      return DatabaseService.instance;
    }
  
    public getClient(): PrismaClient {
      return this.prisma;
    }
  
    public async connect(): Promise<void> {
      try {
        await this.prisma.$connect();
        logger.info('✓ Conexión a base de datos establecida');
      } catch (error) {
        logger.error('✗ Error al conectar a base de datos:', error);
        throw error;
      }
    }
  
    public async disconnect(): Promise<void> {
      try {
        await this.prisma.$disconnect();
        logger.info('✓ Desconexión de base de datos exitosa');
      } catch (error) {
        logger.error('✗ Error al desconectar de base de datos:', error);
        throw error;
      }
    }
  
    public async healthCheck(): Promise<boolean> {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        return true;
      } catch (error) {
        logger.error('Health check failed:', error);
        return false;
      }
    }
  }
  
  // Exportar instancia singleton
  export const db = DatabaseService.getInstance().getClient();
  export const database = DatabaseService.getInstance();
  export default db;
  ```
  - Tiempo estimado: 20 min
  - Responsable: Dev

- [ ] **T6.2**: Actualizar `src/server.ts` para conectar BD
  ```typescript
  import app from './app';
  import { config, validateConfig } from '@config/env.config';
  import { logger } from '@config/logger.config';
  import { database } from '@config/database';
  
  async function startServer() {
    try {
      // Validar configuración
      validateConfig();
      logger.info('✓ Configuración validada');
  
      // Conectar a base de datos
      await database.connect();
      
      // Health check de BD
      const isHealthy = await database.healthCheck();
      if (!isHealthy) {
        throw new Error('Base de datos no responde');
      }
      logger.info('✓ Health check de BD exitoso');
  
      // Iniciar servidor
      const PORT = config.port;
      const server = app.listen(PORT, () => {
        logger.info(`🚀 Servidor corriendo en puerto ${PORT}`);
        logger.info(`📝 Ambiente: ${config.env}`);
        logger.info(`🔗 URL: http://localhost:${PORT}`);
      });
  
      // Graceful shutdown
      process.on('SIGTERM', async () => {
        logger.info('SIGTERM recibido, cerrando...');
        await database.disconnect();
        server.close(() => {
          logger.info('Servidor cerrado');
          process.exit(0);
        });
      });
  
    } catch (error) {
      logger.error('Error al iniciar servidor:', error);
      process.exit(1);
    }
  }
  
  startServer();
  ```
  - Tiempo estimado: 10 min
  - Responsable: Dev

---

### 🟦 FASE 7: Seeds Iniciales (1 hora)

- [ ] **T7.1**: Crear archivo `prisma/seed.ts`
  ```typescript
  import { PrismaClient } from '@prisma/client';
  
  const prisma = new PrismaClient();
  
  async function main() {
    console.log('🌱 Iniciando seeds...');
  
    // ==========================================
    // 1. CONFIGURACIÓN INSTITUCIÓN
    // ==========================================
    console.log('📋 Creando configuración institución...');
    
    const institucion = await prisma.configuracionInstitucion.upsert({
      where: { codigoModular: '0000000' },
      update: {},
      create: {
        codigoModular: '0000000',
        nombre: 'UGEL XX - Sistema de Certificados',
        ugel: 'UGEL XX',
        distrito: 'Distrito Ejemplo',
        provincia: 'Provincia Ejemplo',
        departamento: 'Departamento Ejemplo',
        direccion: 'Av. Ejemplo 123',
        telefono: '999999999',
        email: 'certificados@ugel.gob.pe',
        nombreDirector: 'Director de Ejemplo',
        cargoDirector: 'Director',
        textoLegal: 'Texto legal según normativa vigente',
        activo: true,
      },
    });
    
    console.log('✓ Institución creada:', institucion.nombre);
  
    // ==========================================
    // 2. ROLES DEL SISTEMA (7 roles)
    // ==========================================
    console.log('👥 Creando roles...');
    
    const roles = [
      { codigo: 'PUBLICO', nombre: 'Usuario Público', nivel: 1 },
      { codigo: 'MESA_DE_PARTES', nombre: 'Mesa de Partes', nivel: 2 },
      { codigo: 'EDITOR', nombre: 'Editor/Oficina de Actas', nivel: 3 },
      { codigo: 'ENCARGADO_UGEL', nombre: 'Encargado UGEL', nivel: 4 },
      { codigo: 'ENCARGADO_SIAGEC', nombre: 'Encargado SIAGEC', nivel: 5 },
      { codigo: 'DIRECCION', nombre: 'Dirección', nivel: 6 },
      { codigo: 'ADMIN', nombre: 'Administrador', nivel: 7 },
    ];
    
    for (const rol of roles) {
      await prisma.rol.upsert({
        where: { 
          institucion_id_codigo: {
            institucion_id: institucion.id,
            codigo: rol.codigo,
          }
        },
        update: {},
        create: {
          institucion_id: institucion.id,
          codigo: rol.codigo,
          nombre: rol.nombre,
          nivel: rol.nivel,
          activo: true,
        },
      });
      console.log(`✓ Rol creado: ${rol.nombre}`);
    }
  
    // ==========================================
    // 3. NIVELES EDUCATIVOS
    // ==========================================
    console.log('📚 Creando niveles educativos...');
    
    const niveles = [
      { codigo: 'INICIAL', nombre: 'Inicial', orden: 1 },
      { codigo: 'PRIMARIA', nombre: 'Primaria', orden: 2 },
      { codigo: 'SECUNDARIA', nombre: 'Secundaria', orden: 3 },
    ];
    
    for (const nivel of niveles) {
      await prisma.nivelEducativo.upsert({
        where: { 
          institucion_id_codigo: {
            institucion_id: institucion.id,
            codigo: nivel.codigo,
          }
        },
        update: {},
        create: {
          institucion_id: institucion.id,
          codigo: nivel.codigo,
          nombre: nivel.nombre,
          orden: nivel.orden,
          activo: true,
        },
      });
      console.log(`✓ Nivel creado: ${nivel.nombre}`);
    }
  
    // ==========================================
    // 4. GRADOS (SECUNDARIA)
    // ==========================================
    console.log('📊 Creando grados...');
    
    const secundaria = await prisma.nivelEducativo.findFirst({
      where: { codigo: 'SECUNDARIA' },
    });
    
    if (secundaria) {
      const grados = [
        { numero: 1, nombre: 'Primer Grado', nombreCorto: '1°', orden: 1 },
        { numero: 2, nombre: 'Segundo Grado', nombreCorto: '2°', orden: 2 },
        { numero: 3, nombre: 'Tercer Grado', nombreCorto: '3°', orden: 3 },
        { numero: 4, nombre: 'Cuarto Grado', nombreCorto: '4°', orden: 4 },
        { numero: 5, nombre: 'Quinto Grado', nombreCorto: '5°', orden: 5 },
      ];
      
      for (const grado of grados) {
        await prisma.grado.upsert({
          where: { 
            institucion_id_numero: {
              institucion_id: institucion.id,
              numero: grado.numero,
            }
          },
          update: {},
          create: {
            institucion_id: institucion.id,
            nivel_id: secundaria.id,
            numero: grado.numero,
            nombre: grado.nombre,
            nombreCorto: grado.nombreCorto,
            orden: grado.orden,
            activo: true,
          },
        });
        console.log(`✓ Grado creado: ${grado.nombre}`);
      }
    }
  
    // ==========================================
    // 5. USUARIO ADMINISTRADOR
    // ==========================================
    console.log('🔐 Creando usuario administrador...');
    
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.usuario.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@ugel.gob.pe',
        passwordHash: hashedPassword,
        dni: '00000000',
        nombres: 'Administrador',
        apellidos: 'del Sistema',
        tipoUsuario: 'INTERNO',
        activo: true,
        cambiarPassword: true,
      },
    });
    
    console.log('✓ Usuario admin creado (username: admin, password: admin123)');
    
    // Asignar rol ADMIN
    const adminRol = await prisma.rol.findFirst({
      where: { codigo: 'ADMIN' },
    });
    
    if (adminRol) {
      await prisma.usuarioRol.create({
        data: {
          usuario_id: adminUser.id,
          rol_id: adminRol.id,
          activo: true,
        },
      });
      console.log('✓ Rol ADMIN asignado al usuario');
    }
  
    console.log('\n✅ Seeds completados exitosamente!');
  }
  
  main()
    .catch((e) => {
      console.error('❌ Error ejecutando seeds:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
  ```
  - Tiempo estimado: 40 min
  - Responsable: Dev

- [ ] **T7.2**: Agregar script de seed en `package.json`
  ```json
  {
    "scripts": {
      "prisma:generate": "prisma generate",
      "prisma:migrate": "prisma migrate dev",
      "prisma:seed": "ts-node prisma/seed.ts",
      "prisma:studio": "prisma studio",
      "prisma:reset": "prisma migrate reset"
    }
  }
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T7.3**: Ejecutar seeds
  ```bash
  npm run prisma:seed
  ```
  - Verificar que se crean todos los registros
  - Tiempo estimado: 5 min
  - Responsable: Dev

---

### 🟦 FASE 8: Testing y Verificación (30 min)

- [ ] **T8.1**: Probar consulta simple
  - Crear archivo `test-db.ts`:
  ```typescript
  import { db } from './src/config/database';
  
  async function test() {
    // Contar tablas
    const totalRoles = await db.rol.count();
    const totalUsuarios = await db.usuario.count();
    
    console.log('Roles:', totalRoles);
    console.log('Usuarios:', totalUsuarios);
    
    // Obtener datos
    const roles = await db.rol.findMany();
    console.log('Roles del sistema:', roles);
    
    await db.$disconnect();
  }
  
  test();
  ```
  - Ejecutar: `npx ts-node test-db.ts`
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T8.2**: Probar relaciones
  ```typescript
  // Probar consulta con relación
  const usuario = await db.usuario.findFirst({
    include: {
      UsuarioRol: {
        include: {
          rol: true,
        },
      },
    },
  });
  console.log('Usuario con roles:', usuario);
  ```
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T8.3**: Actualizar health check endpoint
  ```typescript
  // En src/app.ts
  app.get('/api/health', async (req, res) => {
    const dbHealthy = await database.healthCheck();
    
    res.status(dbHealthy ? 200 : 503).json({
      success: dbHealthy,
      message: dbHealthy ? 'API funcionando' : 'BD no disponible',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected',
    });
  });
  ```
  - Tiempo estimado: 10 min
  - Responsable: Dev

---

### 🟦 FASE 9: Documentación (30 min)

- [ ] **T9.1**: Crear `prisma/README.md`
  ```markdown
  # Prisma ORM - Configuración
  
  ## Comandos Útiles
  
  ### Generar cliente
  \`\`\`bash
  npm run prisma:generate
  \`\`\`
  
  ### Ejecutar seeds
  \`\`\`bash
  npm run prisma:seed
  \`\`\`
  
  ### Abrir Prisma Studio
  \`\`\`bash
  npm run prisma:studio
  \`\`\`
  
  ### Resetear BD (⚠️ Elimina todos los datos)
  \`\`\`bash
  npm run prisma:reset
  \`\`\`
  
  ## Uso en Código
  
  \`\`\`typescript
  import { db } from '@config/database';
  
  // Consultar
  const usuarios = await db.usuario.findMany();
  
  // Crear
  const usuario = await db.usuario.create({
    data: {
      username: 'nuevo',
      email: 'nuevo@example.com',
      // ...
    },
  });
  
  // Actualizar
  await db.usuario.update({
    where: { id: 'uuid' },
    data: { activo: false },
  });
  
  // Eliminar
  await db.usuario.delete({
    where: { id: 'uuid' },
  });
  \`\`\`
  ```
  - Tiempo estimado: 20 min
  - Responsable: Dev

- [ ] **T9.2**: Agregar información de Prisma en README principal
  - Tiempo estimado: 10 min
  - Responsable: Dev

---

## 🗄️ Modelos Prisma (32 Tablas)

### Verificación de Modelos Generados

- [ ] ConfiguracionInstitucion
- [ ] NivelEducativo
- [ ] InstitucionUsuario
- [ ] Estudiante
- [ ] AnioLectivo
- [ ] Grado
- [ ] AreaCurricular
- [ ] CurriculoGrado
- [ ] ActaFisica
- [ ] Certificado
- [ ] CertificadoDetalle
- [ ] CertificadoNota
- [ ] Verificacion
- [ ] TipoSolicitud
- [ ] Solicitud
- [ ] SolicitudHistorial
- [ ] Pago
- [ ] MetodoPago
- [ ] PagoDetalle
- [ ] PasarelaPago
- [ ] WebhookPago
- [ ] ConciliacionBancaria
- [ ] ConciliacionDetalle
- [ ] Notificacion
- [ ] Usuario
- [ ] Rol
- [ ] UsuarioRol
- [ ] Permiso
- [ ] RolPermiso
- [ ] Sesion
- [ ] Auditoria
- [ ] Parametro

---

## 🔧 Stack Tecnológico

| Herramienta | Versión | Propósito |
|-------------|---------|-----------|
| Prisma | 5.x | ORM TypeScript |
| PostgreSQL | 15.x | Base de datos |
| @prisma/client | 5.x | Cliente generado |

---

## 🧪 Criterios de Aceptación

- [ ] `prisma/schema.prisma` contiene 32 modelos
- [ ] Cliente Prisma generado sin errores
- [ ] Conexión a BD funciona correctamente
- [ ] Seeds ejecutados exitosamente
- [ ] Query simple funciona
- [ ] Relaciones funcionan correctamente
- [ ] Health check incluye estado de BD
- [ ] Prisma Studio abre correctamente
- [ ] Documentación creada

---

## 📊 Métricas de Éxito

| Métrica | Objetivo | Estado |
|---------|----------|--------|
| Modelos generados | 32 | ⬜ |
| Seeds ejecutados | ✓ | ⬜ |
| Tiempo de query simple | < 100ms | ⬜ |
| Health check BD | ✓ | ⬜ |
| Errores de conexión | 0 | ⬜ |

---

## ⚠️ Riesgos & Mitigación

| # | Riesgo | Probabilidad | Impacto | Mitigación | Estado |
|---|--------|--------------|---------|------------|--------|
| 1 | DATABASE_URL incorrecta | Media | Alto | Validar credenciales antes | ⬜ |
| 2 | Introspection falla | Baja | Alto | Verificar tablas existen en BD | ⬜ |
| 3 | Nombres de relaciones confusos | Media | Medio | Renombrar con @@map si necesario | ⬜ |
| 4 | Seeds fallan por constraints | Media | Medio | Usar upsert en vez de create | ⬜ |

---

## 📚 Referencias & Documentación

### Prisma
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Introspection (db pull)](https://www.prisma.io/docs/concepts/components/introspection)
- [Seeding](https://www.prisma.io/docs/guides/database/seed-database)

### PostgreSQL
- [PostgreSQL Data Types](https://www.postgresql.org/docs/15/datatype.html)

---

## 📝 Notas Técnicas

### Singleton Pattern
Se usa singleton para PrismaClient para evitar múltiples instancias y agotar conexiones de la BD pool.

### Introspection vs Migrations
En este proyecto usamos introspection (db pull) porque la BD ya existe. En proyectos nuevos se usaría migrations (migrate dev).

### Seeds con upsert
Se usa `upsert` en vez de `create` para que los seeds sean idempotentes (se puedan ejecutar múltiples veces sin error).

---

## 🔄 Sprint Retrospective (Completar al finalizar)

### ✅ Qué funcionó bien
- [Espacio para completar]

### ⚠️ Qué puede mejorar
- [Espacio para completar]

### 💡 Acciones para próximo sprint
- [ ] [Espacio para completar]

---

## 📅 Sprint Timeline

| Fecha | Actividad | Responsable | Estado |
|-------|-----------|-------------|--------|
| DD/MM | Inicio del sprint | Dev | ⬜ |
| DD/MM | Instalación Prisma | Dev | ⬜ |
| DD/MM | Introspección BD | Dev | ⬜ |
| DD/MM | Generar cliente | Dev | ⬜ |
| DD/MM | Crear singleton | Dev | ⬜ |
| DD/MM | Crear seeds | Dev | ⬜ |
| DD/MM | Testing | Dev | ⬜ |
| DD/MM | Sprint review | Team | ⬜ |

---

**📝 Última actualización**: 31/10/2025  
**👤 Actualizado por**: Sistema  
**📌 Versión**: 1.0  
**🔗 Sprint Anterior**: [SPRINT_01_SETUP_INICIAL.md](./SPRINT_01_SETUP_INICIAL.md)  
**🔗 Siguiente Sprint**: [SPRINT_03_AUTENTICACION_SEGURIDAD.md](./SPRINT_03_AUTENTICACION_SEGURIDAD.md)

