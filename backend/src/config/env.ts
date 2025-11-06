/**
 * Configuración y validación de variables de entorno
 * Usa Zod para validar que todas las variables requeridas estén presentes
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Esquema de validación para las variables de entorno
const envSchema = z.object({
  // Base de datos
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida'),

  // Servidor
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(65535)),
  HOST: z.string().default('localhost'),

  // Seguridad
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Bcrypt
  BCRYPT_ROUNDS: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(10).max(15)),

  // CORS
  CORS_ORIGIN: z.string().url('CORS_ORIGIN debe ser una URL válida'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs'),

  // Prisma
  PRISMA_LOG_LEVEL: z.enum(['query', 'info', 'warn', 'error']).default('info'),

  // OCR (opcionales por ahora)
  GEMINI_API_KEY: z.string().optional().default(''),
  OCR_SERVICE_URL: z.string().url().optional().default('http://localhost:5000'),

  // Email - Mailgun (recomendado)
  MAILGUN_API_KEY: z.string().optional().default(''),
  MAILGUN_DOMAIN: z.string().optional().default(''),
  MAILGUN_FROM: z.string().optional().default(''),

  // Email - SMTP tradicional (fallback)
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()).default('587'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default('noreply@sigcerh.local'),

  // Storage
  UPLOAD_PATH: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()).default('10'),

  // Frontend
  FRONTEND_URL: z.string().url('FRONTEND_URL debe ser una URL válida'),
});

// Validar y exportar la configuración
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Error en la configuración de variables de entorno:');
    console.error(error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n'));
    process.exit(1);
  }
  throw error;
}

// Exportar configuración validada
export const config = {
  // Base de datos
  database: {
    url: env.DATABASE_URL,
    logLevel: env.PRISMA_LOG_LEVEL,
  },

  // Servidor
  server: {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    host: env.HOST,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },

  // Seguridad
  security: {
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    bcrypt: {
      rounds: env.BCRYPT_ROUNDS,
    },
  },

  // CORS
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    filePath: env.LOG_FILE_PATH,
  },

  // OCR
  ocr: {
    geminiApiKey: env.GEMINI_API_KEY,
    serviceUrl: env.OCR_SERVICE_URL,
  },

  // Email
  email: {
    mailgun: {
      apiKey: env.MAILGUN_API_KEY,
      domain: env.MAILGUN_DOMAIN,
      from: env.MAILGUN_FROM,
    },
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      password: env.SMTP_PASSWORD,
      from: env.SMTP_FROM,
    },
  },

  // Storage
  storage: {
    uploadPath: env.UPLOAD_PATH,
    maxFileSizeMB: env.MAX_FILE_SIZE_MB,
    maxFileSizeBytes: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },

  // Frontend
  frontend: {
    url: env.FRONTEND_URL,
  },
} as const;

// Exportar tipo de configuración para uso en otros archivos
export type Config = typeof config;

