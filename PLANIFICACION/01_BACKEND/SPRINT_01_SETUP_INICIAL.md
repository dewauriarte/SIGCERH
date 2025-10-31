# 🎯 SPRINT 01: SETUP INICIAL DEL PROYECTO BACKEND

> **Módulo**: Backend - Configuración Base    
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ✅ COMPLETADO

---

## 📌 Sprint Overview

### Objetivo Principal
Inicializar el proyecto Node.js con TypeScript, configurar Express con arquitectura modular profesional, establecer estructura de carpetas según Clean Architecture y configurar herramientas de desarrollo (ESLint, Prettier, hot reload).

### Valor de Negocio
Establece la base técnica sólida sobre la cual se construirá toda la API REST. Una buena estructura inicial evita refactorizaciones costosas y facilita el desarrollo en equipo.

### Dependencias
- [x] Sprint 00 - Base de datos PostgreSQL creada ✅
- [x] Node.js 20 LTS instalado (✅ v24.11.0)
- [x] Git configurado ✅

---

## 🎯 Sprint Goals (Definition of Done)

- [x] Servidor Express corriendo en `http://localhost:3000` ✅
- [x] Hot reload funcionando con `npm run dev` ✅
- [x] TypeScript configurado correctamente ✅
- [x] Estructura de carpetas modular creada ✅
- [x] Logger (Winston) configurando logs ✅
- [x] Manejo global de errores implementado ✅
- [x] CORS, Helmet, Rate Limiting configurados ✅
- [x] Variables de entorno con `.env` funcionando ✅
- [x] Scripts npm configurados: `dev`, `build`, `start`, `lint` ✅

---

## 📦 Entregables

### Código Funcional
- [x] Servidor Express básico respondiendo ✅
- [x] Endpoint de health check: `GET /health` ✅
- [x] Middleware de logs, errores, seguridad ✅

### Configuración
- [x] `package.json` con todas las dependencias ✅
- [x] `tsconfig.json` optimizado ✅
- [x] `.env` y `.env.example` documentado ✅
- [x] `eslint.config.js` y `.prettierrc` ✅

### Documentación
- [ ] README del backend con instrucciones de setup
- [ ] Documentación de estructura de carpetas

---

## ✅ Tasks Breakdown (Checklist Detallado)

### 🟦 FASE 1: Inicialización del Proyecto (30 min)

- [ ] **T1.1**: Crear carpeta backend
  ```bash
  cd C:\SIGCERH
  mkdir backend
  cd backend
  ```
  - Tiempo estimado: 2 min
  - Responsable: Dev

- [ ] **T1.2**: Inicializar proyecto Node.js
  ```bash
  npm init -y
  ```
  - Tiempo estimado: 1 min
  - Responsable: Dev

- [ ] **T1.3**: Configurar información del package.json
  ```json
  {
    "name": "sigcerh-backend",
    "version": "1.0.0",
    "description": "API REST para Sistema de Certificados Históricos (1985-2012)",
    "main": "dist/server.js",
    "scripts": {},
    "keywords": ["certificados", "educacion", "peru", "ugel"],
    "author": "UGEL",
    "license": "MIT"
  }
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T1.4**: Crear `.gitignore`
  ```gitignore
  # Dependencies
  node_modules/
  
  # Build
  dist/
  build/
  
  # Environment
  .env
  .env.local
  .env.*.local
  
  # Logs
  logs/
  *.log
  npm-debug.log*
  
  # IDE
  .vscode/
  .idea/
  *.swp
  *.swo
  
  # OS
  .DS_Store
  Thumbs.db
  
  # Testing
  coverage/
  .nyc_output/
  
  # Temp
  temp/
  tmp/
  ```
  - Tiempo estimado: 3 min
  - Responsable: Dev

---

### 🟦 FASE 2: Instalación de Dependencias Core (20 min)

- [ ] **T2.1**: Instalar TypeScript y tipos
  ```bash
  npm install -D typescript @types/node ts-node
  ```
  - Tiempo estimado: 3 min
  - Responsable: Dev

- [ ] **T2.2**: Instalar Express y tipos
  ```bash
  npm install express
  npm install -D @types/express
  ```
  - Tiempo estimado: 3 min
  - Responsable: Dev

- [ ] **T2.3**: Instalar herramientas de desarrollo
  ```bash
  npm install -D ts-node-dev nodemon
  ```
  - Tiempo estimado: 2 min
  - Responsable: Dev

- [ ] **T2.4**: Instalar dependencias esenciales
  ```bash
  npm install dotenv cors helmet express-rate-limit
  npm install -D @types/cors
  ```
  - Tiempo estimado: 3 min
  - Responsable: Dev

- [ ] **T2.5**: Instalar logger Winston
  ```bash
  npm install winston winston-daily-rotate-file
  ```
  - Tiempo estimado: 2 min
  - Responsable: Dev

- [ ] **T2.6**: Instalar validación y utilidades
  ```bash
  npm install zod
  npm install morgan
  npm install -D @types/morgan
  ```
  - Tiempo estimado: 2 min
  - Responsable: Dev

---

### 🟦 FASE 3: Configuración de TypeScript (15 min)

- [ ] **T3.1**: Crear `tsconfig.json`
  ```bash
  npx tsc --init
  ```
  - Tiempo estimado: 1 min
  - Responsable: Dev

- [ ] **T3.2**: Configurar `tsconfig.json` optimizado
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "commonjs",
      "lib": ["ES2022"],
      "outDir": "./dist",
      "rootDir": "./src",
      "removeComments": true,
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "moduleResolution": "node",
      "allowSyntheticDefaultImports": true,
      "declaration": true,
      "declarationMap": true,
      "sourceMap": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true,
      "baseUrl": "./src",
      "paths": {
        "@config/*": ["config/*"],
        "@modules/*": ["modules/*"],
        "@middlewares/*": ["middlewares/*"],
        "@services/*": ["services/*"],
        "@utils/*": ["utils/*"],
        "@types/*": ["types/*"]
      }
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "**/*.test.ts"]
  }
  ```
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T3.3**: Instalar tsconfig-paths para alias
  ```bash
  npm install -D tsconfig-paths
  ```
  - Tiempo estimado: 2 min
  - Responsable: Dev

---

### 🟦 FASE 4: Estructura de Carpetas (20 min)

- [ ] **T4.1**: Crear estructura base
  ```bash
  mkdir -p src/{config,core,modules,shared,utils,middlewares,types,services}
  mkdir -p src/modules/{auth,usuarios,solicitudes,certificados,pagos,actas,notificaciones,admin}
  mkdir -p logs
  mkdir -p storage/{uploads,comprobantes,actas,certificados}
  mkdir -p tests/{unit,integration,e2e}
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T4.2**: Documentar estructura en README
  ```markdown
  ## Estructura de Carpetas
  
  backend/
  ├── src/
  │   ├── config/           # Configuraciones (DB, env, constants)
  │   ├── core/             # Lógica de negocio core
  │   ├── modules/          # Módulos por funcionalidad
  │   │   ├── auth/         # Autenticación
  │   │   ├── usuarios/     # Gestión de usuarios
  │   │   ├── solicitudes/  # Flujo de solicitudes
  │   │   ├── certificados/ # Emisión certificados
  │   │   ├── pagos/        # Sistema de pagos
  │   │   ├── actas/        # Gestión actas físicas
  │   │   ├── notificaciones/ # Email/SMS
  │   │   └── admin/        # Panel admin
  │   ├── shared/           # Código compartido
  │   ├── middlewares/      # Middlewares Express
  │   ├── services/         # Servicios reutilizables
  │   ├── utils/            # Utilidades
  │   ├── types/            # TypeScript types/interfaces
  │   ├── app.ts            # Configuración Express
  │   └── server.ts         # Entry point
  ├── storage/              # Archivos subidos
  ├── logs/                 # Logs de aplicación
  ├── tests/                # Tests
  ├── prisma/               # Schema Prisma
  ├── .env.example          # Variables de entorno
  ├── package.json
  └── tsconfig.json
  ```
  - Tiempo estimado: 10 min
  - Responsable: Dev

---

### 🟦 FASE 5: Configuración Base (1 hora)

- [ ] **T5.1**: Crear archivo de variables de entorno `.env.example`
  ```env
  # ============================================
  # CONFIGURACIÓN GENERAL
  # ============================================
  NODE_ENV=development
  PORT=5000
  APP_NAME=SIGCERH API
  APP_VERSION=1.0.0
  
  # ============================================
  # BASE DE DATOS
  # ============================================
  DATABASE_URL="postgresql://postgres:password@localhost:5432/certificados_db"
  
  # ============================================
  # JWT
  # ============================================
  JWT_SECRET=tu_secreto_super_seguro_cambiar_en_produccion
  JWT_EXPIRES_IN=8h
  JWT_REFRESH_SECRET=tu_refresh_secret_cambiar_en_produccion
  JWT_REFRESH_EXPIRES_IN=7d
  
  # ============================================
  # SEGURIDAD
  # ============================================
  BCRYPT_ROUNDS=10
  RATE_LIMIT_WINDOW_MS=900000
  RATE_LIMIT_MAX_REQUESTS=100
  
  # ============================================
  # CORS
  # ============================================
  CORS_ORIGIN=http://localhost:5173
  
  # ============================================
  # LOGS
  # ============================================
  LOG_LEVEL=debug
  LOG_DIR=logs
  
  # ============================================
  # STORAGE
  # ============================================
  STORAGE_PATH=./storage
  MAX_FILE_SIZE=10485760
  
  # ============================================
  # EMAIL (Gmail SMTP)
  # ============================================
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=certificados@ugel.gob.pe
  SMTP_PASSWORD=app_password_aqui
  SMTP_FROM=UGEL XX - Certificados <certificados@ugel.gob.pe>
  
  # ============================================
  # NOTIFICACIONES
  # ============================================
  NOTIFICATIONS_ENABLED=true
  SMS_ENABLED=false
  
  # ============================================
  # GEMINI API (OCR)
  # ============================================
  GEMINI_API_KEY=tu_gemini_api_key
  ```
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T5.2**: Crear `src/config/env.config.ts`
  ```typescript
  import dotenv from 'dotenv';
  import path from 'path';
  
  // Cargar variables de entorno
  dotenv.config();
  
  export const config = {
    // General
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    appName: process.env.APP_NAME || 'SIGCERH API',
    appVersion: process.env.APP_VERSION || '1.0.0',
    
    // Base de datos
    database: {
      url: process.env.DATABASE_URL || '',
    },
    
    // JWT
    jwt: {
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    
    // Seguridad
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
    
    // CORS
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },
    
    // Logs
    logs: {
      level: process.env.LOG_LEVEL || 'info',
      dir: process.env.LOG_DIR || 'logs',
    },
    
    // Storage
    storage: {
      path: path.resolve(process.env.STORAGE_PATH || './storage'),
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    },
    
    // Email
    email: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
      from: process.env.SMTP_FROM || 'noreply@ugel.gob.pe',
    },
    
    // Notificaciones
    notifications: {
      enabled: process.env.NOTIFICATIONS_ENABLED === 'true',
      smsEnabled: process.env.SMS_ENABLED === 'true',
    },
    
    // APIs externas
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
    },
  };
  
  // Validar configuraciones críticas
  export function validateConfig() {
    const required = [
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(
        `Configuración incompleta. Variables faltantes: ${missing.join(', ')}`
      );
    }
  }
  ```
  - Tiempo estimado: 15 min
  - Responsable: Dev

- [ ] **T5.3**: Crear `src/config/logger.config.ts` (Winston)
  ```typescript
  import winston from 'winston';
  import DailyRotateFile from 'winston-daily-rotate-file';
  import { config } from './env.config';
  
  const { combine, timestamp, printf, colorize, errors } = winston.format;
  
  // Formato personalizado
  const customFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  });
  
  // Transporte para archivos con rotación diaria
  const fileRotateTransport = new DailyRotateFile({
    filename: `${config.logs.dir}/application-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: combine(timestamp(), errors({ stack: true }), customFormat),
  });
  
  // Transporte para errores
  const errorFileTransport = new DailyRotateFile({
    filename: `${config.logs.dir}/error-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '30d',
    format: combine(timestamp(), errors({ stack: true }), customFormat),
  });
  
  // Logger
  export const logger = winston.createLogger({
    level: config.logs.level,
    format: combine(timestamp(), errors({ stack: true }), customFormat),
    transports: [
      fileRotateTransport,
      errorFileTransport,
    ],
  });
  
  // Console en desarrollo
  if (config.env === 'development') {
    logger.add(
      new winston.transports.Console({
        format: combine(colorize(), timestamp(), customFormat),
      })
    );
  }
  
  export default logger;
  ```
  - Tiempo estimado: 15 min
  - Responsable: Dev

- [ ] **T5.4**: Crear `src/config/constants.ts`
  ```typescript
  export const CONSTANTS = {
    // Roles del sistema
    ROLES: {
      PUBLICO: 'PUBLICO',
      MESA_DE_PARTES: 'MESA_DE_PARTES',
      EDITOR: 'EDITOR',
      ENCARGADO_UGEL: 'ENCARGADO_UGEL',
      ENCARGADO_SIAGEC: 'ENCARGADO_SIAGEC',
      DIRECCION: 'DIRECCION',
      ADMIN: 'ADMIN',
    },
    
    // Estados de solicitud
    ESTADOS_SOLICITUD: {
      REGISTRADA: 'REGISTRADA',
      DERIVADO_A_EDITOR: 'DERIVADO_A_EDITOR',
      EN_BUSQUEDA: 'EN_BUSQUEDA',
      ACTA_ENCONTRADA_PENDIENTE_PAGO: 'ACTA_ENCONTRADA_PENDIENTE_PAGO',
      ACTA_NO_ENCONTRADA: 'ACTA_NO_ENCONTRADA',
      PAGO_VALIDADO: 'PAGO_VALIDADO',
      EN_PROCESAMIENTO_OCR: 'EN_PROCESAMIENTO_OCR',
      EN_VALIDACION_UGEL: 'EN_VALIDACION_UGEL',
      OBSERVADO_POR_UGEL: 'OBSERVADO_POR_UGEL',
      EN_REGISTRO_SIAGEC: 'EN_REGISTRO_SIAGEC',
      EN_FIRMA_DIRECCION: 'EN_FIRMA_DIRECCION',
      CERTIFICADO_EMITIDO: 'CERTIFICADO_EMITIDO',
      ENTREGADO: 'ENTREGADO',
      RECHAZADO: 'RECHAZADO',
    },
    
    // Estados de pago
    ESTADOS_PAGO: {
      PENDIENTE: 'PENDIENTE',
      VALIDADO: 'VALIDADO',
      RECHAZADO: 'RECHAZADO',
    },
    
    // Métodos de pago
    METODOS_PAGO: {
      YAPE: 'YAPE',
      PLIN: 'PLIN',
      EFECTIVO: 'EFECTIVO',
      TARJETA: 'TARJETA',
    },
    
    // Formatos de archivo permitidos
    ALLOWED_FILE_TYPES: {
      IMAGES: ['image/jpeg', 'image/jpg', 'image/png'],
      DOCUMENTS: ['application/pdf'],
      ALL: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    },
    
    // Límites
    LIMITS: {
      MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
      MAX_UPLOAD_FILES: 5,
      PAGINATION_DEFAULT: 10,
      PAGINATION_MAX: 100,
    },
  };
  ```
  - Tiempo estimado: 10 min
  - Responsable: Dev

---

### 🟦 FASE 6: Middlewares Base (1 hora)

- [ ] **T6.1**: Crear `src/middlewares/error.middleware.ts`
  ```typescript
  import { Request, Response, NextFunction } from 'express';
  import { logger } from '@config/logger.config';
  import { ZodError } from 'zod';
  
  export class AppError extends Error {
    constructor(
      public statusCode: number,
      public message: string,
      public isOperational: boolean = true
    ) {
      super(message);
      Object.setPrototypeOf(this, AppError.prototype);
    }
  }
  
  export const errorHandler = (
    err: Error | AppError | ZodError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    // Log del error
    logger.error({
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
    
    // Error de validación Zod
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    
    // Error operacional
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    
    // Error no manejado (500)
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && {
        error: err.message,
        stack: err.stack,
      }),
    });
  };
  
  export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    });
  };
  ```
  - Tiempo estimado: 20 min
  - Responsable: Dev

- [ ] **T6.2**: Crear `src/middlewares/logger.middleware.ts` (Morgan)
  ```typescript
  import morgan from 'morgan';
  import { logger } from '@config/logger.config';
  
  // Stream para Winston
  const stream = {
    write: (message: string) => {
      logger.http(message.trim());
    },
  };
  
  // Formato personalizado
  const format = ':method :url :status :res[content-length] - :response-time ms';
  
  export const httpLogger = morgan(format, { stream });
  ```
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T6.3**: Crear `src/middlewares/async.middleware.ts`
  ```typescript
  import { Request, Response, NextFunction } from 'express';
  
  type AsyncFunction = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<any>;
  
  export const asyncHandler = (fn: AsyncFunction) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T6.4**: Crear `src/middlewares/validation.middleware.ts`
  ```typescript
  import { Request, Response, NextFunction } from 'express';
  import { AnyZodObject, ZodError } from 'zod';
  
  export const validate = (schema: AnyZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        next();
      } catch (error) {
        next(error);
      }
    };
  };
  ```
  - Tiempo estimado: 10 min
  - Responsable: Dev

---

### 🟦 FASE 7: Aplicación Express (1 hora)

- [ ] **T7.1**: Crear `src/app.ts`
  ```typescript
  import express, { Application } from 'express';
  import cors from 'cors';
  import helmet from 'helmet';
  import rateLimit from 'express-rate-limit';
  import { config } from '@config/env.config';
  import { httpLogger } from '@middlewares/logger.middleware';
  import { errorHandler, notFoundHandler } from '@middlewares/error.middleware';
  import { logger } from '@config/logger.config';
  
  const app: Application = express();
  
  // ============================================
  // MIDDLEWARES DE SEGURIDAD
  // ============================================
  
  // Helmet - Security headers
  app.use(helmet());
  
  // CORS
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );
  
  // Rate Limiting
  const limiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMaxRequests,
    message: 'Demasiadas solicitudes, intente nuevamente más tarde',
  });
  app.use('/api/', limiter);
  
  // ============================================
  // MIDDLEWARES DE PARSEO
  // ============================================
  
  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // ============================================
  // MIDDLEWARES DE LOGGING
  // ============================================
  
  // HTTP request logger
  app.use(httpLogger);
  
  // ============================================
  // RUTAS
  // ============================================
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'API funcionando correctamente',
      timestamp: new Date().toISOString(),
      version: config.appVersion,
      environment: config.env,
    });
  });
  
  // TODO: Importar y usar rutas de módulos
  // import authRoutes from '@modules/auth/auth.routes';
  // app.use('/api/auth', authRoutes);
  
  // ============================================
  // MANEJO DE ERRORES
  // ============================================
  
  // 404 - Ruta no encontrada
  app.use(notFoundHandler);
  
  // Error handler global
  app.use(errorHandler);
  
  export default app;
  ```
  - Tiempo estimado: 30 min
  - Responsable: Dev

- [ ] **T7.2**: Crear `src/server.ts`
  ```typescript
  import app from './app';
  import { config, validateConfig } from '@config/env.config';
  import { logger } from '@config/logger.config';
  
  // Validar configuración
  try {
    validateConfig();
    logger.info('✓ Configuración validada correctamente');
  } catch (error) {
    logger.error('✗ Error en configuración:', error);
    process.exit(1);
  }
  
  // Iniciar servidor
  const PORT = config.port;
  
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Servidor corriendo en puerto ${PORT}`);
    logger.info(`📝 Ambiente: ${config.env}`);
    logger.info(`🔗 URL: http://localhost:${PORT}`);
    logger.info(`🏥 Health check: http://localhost:${PORT}/api/health`);
  });
  
  // Manejo de errores no capturados
  process.on('unhandledRejection', (reason: Error) => {
    logger.error('Unhandled Rejection:', reason);
    server.close(() => process.exit(1));
  });
  
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    server.close(() => process.exit(1));
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM recibido, cerrando servidor...');
    server.close(() => {
      logger.info('Servidor cerrado correctamente');
      process.exit(0);
    });
  });
  
  export default server;
  ```
  - Tiempo estimado: 20 min
  - Responsable: Dev

---

### 🟦 FASE 8: Scripts NPM y Configuración Final (30 min)

- [ ] **T8.1**: Configurar scripts en `package.json`
  ```json
  {
    "scripts": {
      "dev": "ts-node-dev --respawn --transpile-only -r tsconfig-paths/register src/server.ts",
      "build": "tsc",
      "start": "node -r tsconfig-paths/register dist/server.js",
      "lint": "eslint src/**/*.ts",
      "lint:fix": "eslint src/**/*.ts --fix",
      "format": "prettier --write \"src/**/*.ts\"",
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage"
    }
  }
  ```
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T8.2**: Instalar y configurar ESLint
  ```bash
  npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
  npx eslint --init
  ```
  - Tiempo estimado: 10 min
  - Responsable: Dev

- [ ] **T8.3**: Crear `.eslintrc.json`
  ```json
  {
    "parser": "@typescript-eslint/parser",
    "extends": [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended"
    ],
    "parserOptions": {
      "ecmaVersion": 2022,
      "sourceType": "module"
    },
    "rules": {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-console": "warn"
    }
  }
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T8.4**: Instalar y configurar Prettier
  ```bash
  npm install -D prettier eslint-config-prettier eslint-plugin-prettier
  ```
  - Crear `.prettierrc`:
  ```json
  {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 100,
    "tabWidth": 2,
    "arrowParens": "avoid"
  }
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

---

### 🟦 FASE 9: Testing y Verificación (30 min)

- [ ] **T9.1**: Copiar `.env.example` a `.env`
  ```bash
  copy .env.example .env
  ```
  - Configurar variables reales
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T9.2**: Probar compilación TypeScript
  ```bash
  npm run build
  ```
  - Verificar carpeta `dist/` creada
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T9.3**: Iniciar servidor en modo desarrollo
  ```bash
  npm run dev
  ```
  - Verificar que inicia sin errores
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T9.4**: Probar endpoint health check
  ```bash
  curl http://localhost:5000/api/health
  ```
  - Respuesta esperada:
  ```json
  {
    "success": true,
    "message": "API funcionando correctamente",
    "timestamp": "2025-10-31T...",
    "version": "1.0.0",
    "environment": "development"
  }
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T9.5**: Probar hot reload
  - Modificar mensaje en health check
  - Guardar archivo
  - Verificar que servidor se reinicia automáticamente
  - Probar endpoint nuevamente
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T9.6**: Verificar logs
  - Revisar carpeta `logs/`
  - Verificar que se crean archivos de log
  - Revisar contenido de logs
  - Tiempo estimado: 5 min
  - Responsable: Dev

---

### 🟦 FASE 10: Documentación (30 min)

- [ ] **T10.1**: Crear `backend/README.md`
  ```markdown
  # SIGCERH Backend - API REST
  
  API REST para el Sistema de Certificados Históricos (1985-2012).
  
  ## Tecnologías
  
  - Node.js 20 LTS
  - Express 4.x
  - TypeScript 5.x
  - Prisma ORM
  - PostgreSQL 15
  - Winston (Logging)
  - Zod (Validación)
  
  ## Instalación
  
  \`\`\`bash
  # Instalar dependencias
  npm install
  
  # Copiar variables de entorno
  copy .env.example .env
  
  # Configurar DATABASE_URL en .env
  
  # Iniciar en desarrollo
  npm run dev
  \`\`\`
  
  ## Scripts Disponibles
  
  - \`npm run dev\` - Desarrollo con hot reload
  - \`npm run build\` - Compilar TypeScript
  - \`npm start\` - Producción
  - \`npm run lint\` - Linter
  - \`npm run format\` - Formatear código
  
  ## Estructura de Carpetas
  
  Ver documentación completa en \`/PLANIFICACION/\`.
  
  ## Health Check
  
  \`\`\`
  GET http://localhost:5000/api/health
  \`\`\`
  ```
  - Tiempo estimado: 20 min
  - Responsable: Dev

- [ ] **T10.2**: Crear archivo `.editorconfig`
  ```editorconfig
  root = true
  
  [*]
  charset = utf-8
  end_of_line = lf
  insert_final_newline = true
  indent_style = space
  indent_size = 2
  trim_trailing_whitespace = true
  
  [*.md]
  trim_trailing_whitespace = false
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

- [ ] **T10.3**: Crear `CHANGELOG.md`
  ```markdown
  # Changelog
  
  ## [1.0.0] - 2025-10-31
  
  ### Added
  - Setup inicial del proyecto
  - Servidor Express con TypeScript
  - Logger con Winston
  - Manejo global de errores
  - Health check endpoint
  ```
  - Tiempo estimado: 5 min
  - Responsable: Dev

---

## 🔧 Stack Tecnológico

| Herramienta | Versión | Propósito |
|-------------|---------|-----------|
| Node.js | 20 LTS | Runtime JavaScript |
| Express | 4.x | Framework web |
| TypeScript | 5.x | Lenguaje tipado |
| Winston | 3.x | Logging |
| Morgan | 1.x | HTTP request logger |
| Zod | 3.x | Validación de esquemas |
| Helmet | 7.x | Seguridad HTTP headers |
| CORS | 2.x | Cross-Origin Resource Sharing |
| express-rate-limit | 7.x | Rate limiting |
| ESLint | 8.x | Linter |
| Prettier | 3.x | Formateador de código |

---

## 🧪 Criterios de Aceptación

- [ ] Servidor inicia sin errores en `http://localhost:5000`
- [ ] Health check responde correctamente
- [ ] Hot reload funciona al modificar archivos
- [ ] TypeScript compila sin errores
- [ ] ESLint no muestra errores críticos
- [ ] Logs se generan en carpeta `logs/`
- [ ] Variables de entorno se cargan correctamente
- [ ] Estructura de carpetas creada según especificación
- [ ] README con instrucciones claras

---

## 📊 Métricas de Éxito

| Métrica | Objetivo | Estado |
|---------|----------|--------|
| Servidor funcionando | ✓ | ⬜ |
| Hot reload operativo | ✓ | ⬜ |
| TypeScript sin errores | 0 errores | ⬜ |
| ESLint sin errores críticos | 0 críticos | ⬜ |
| Tiempo de inicio servidor | < 3 segundos | ⬜ |
| Logs funcionando | ✓ | ⬜ |

---

## ⚠️ Riesgos & Mitigación

| # | Riesgo | Probabilidad | Impacto | Mitigación | Estado |
|---|--------|--------------|---------|------------|--------|
| 1 | Conflictos de puerto 5000 | Media | Bajo | Cambiar PORT en .env | ⬜ |
| 2 | Paths aliases no funcionan | Baja | Medio | Instalar tsconfig-paths | ⬜ |
| 3 | Hot reload lento | Baja | Bajo | Usar ts-node-dev en vez de nodemon | ⬜ |
| 4 | Variables .env no cargan | Media | Alto | Validar con validateConfig() | ⬜ |

---

## 📚 Referencias & Documentación

### Express
- [Express Documentation](https://expressjs.com/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript with Node.js](https://nodejs.org/en/learn/getting-started/nodejs-with-typescript)

### Arquitectura
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 📝 Notas Técnicas

### Path Aliases (@config, @modules, etc.)
Los path aliases están configurados en `tsconfig.json` y requieren `tsconfig-paths` para funcionar en runtime. En desarrollo se usa con `-r tsconfig-paths/register`.

### Winston Logger
Winston está configurado para rotar logs diariamente. Los logs de error se guardan por separado durante 30 días, los logs generales durante 14 días.

### Rate Limiting
Por defecto está configurado para 100 requests por IP cada 15 minutos. Ajustar según necesidades en `.env`.

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
| DD/MM | Instalación dependencias | Dev | ⬜ |
| DD/MM | Configuración TypeScript | Dev | ⬜ |
| DD/MM | Creación estructura carpetas | Dev | ⬜ |
| DD/MM | Configuración middlewares | Dev | ⬜ |
| DD/MM | Testing servidor | Dev | ⬜ |
| DD/MM | Documentación | Dev | ⬜ |
| DD/MM | Sprint review | Team | ⬜ |

---

**📝 Última actualización**: 31/10/2025  
**👤 Actualizado por**: Sistema  
**📌 Versión**: 1.0  
**🔗 Sprint Anterior**: [SPRINT_00_BASE_DE_DATOS.md](./SPRINT_00_BASE_DE_DATOS.md)  
**🔗 Siguiente Sprint**: [SPRINT_02_PRISMA_ORM.md](./SPRINT_02_PRISMA_ORM.md)

