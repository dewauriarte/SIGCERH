import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();
const envSchema = z.object({
    DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(65535)),
    HOST: z.string().default('localhost'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
    JWT_EXPIRES_IN: z.string().default('1h'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    BCRYPT_ROUNDS: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(10).max(15)),
    CORS_ORIGIN: z.string().url('CORS_ORIGIN debe ser una URL válida'),
    RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FILE_PATH: z.string().default('./logs'),
    PRISMA_LOG_LEVEL: z.enum(['query', 'info', 'warn', 'error']).default('info'),
    GEMINI_API_KEY: z.string().optional().default(''),
    OCR_SERVICE_URL: z.string().url().optional().default('http://localhost:5000'),
    SMTP_HOST: z.string().default('smtp.gmail.com'),
    SMTP_PORT: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()).default('587'),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASSWORD: z.string().optional().default(''),
    SMTP_FROM: z.string().email().default('noreply@sigcerh.local'),
    UPLOAD_PATH: z.string().default('./uploads'),
    MAX_FILE_SIZE_MB: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()).default('10'),
    FRONTEND_URL: z.string().url('FRONTEND_URL debe ser una URL válida'),
});
let env;
try {
    env = envSchema.parse(process.env);
}
catch (error) {
    if (error instanceof z.ZodError) {
        console.error('❌ Error en la configuración de variables de entorno:');
        console.error(error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n'));
        process.exit(1);
    }
    throw error;
}
export const config = {
    database: {
        url: env.DATABASE_URL,
        logLevel: env.PRISMA_LOG_LEVEL,
    },
    server: {
        nodeEnv: env.NODE_ENV,
        port: env.PORT,
        host: env.HOST,
        isDevelopment: env.NODE_ENV === 'development',
        isProduction: env.NODE_ENV === 'production',
        isTest: env.NODE_ENV === 'test',
    },
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
    cors: {
        origin: env.CORS_ORIGIN,
        credentials: true,
    },
    rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
    logging: {
        level: env.LOG_LEVEL,
        filePath: env.LOG_FILE_PATH,
    },
    ocr: {
        geminiApiKey: env.GEMINI_API_KEY,
        serviceUrl: env.OCR_SERVICE_URL,
    },
    email: {
        smtp: {
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            user: env.SMTP_USER,
            password: env.SMTP_PASSWORD,
        },
        from: env.SMTP_FROM,
    },
    storage: {
        uploadPath: env.UPLOAD_PATH,
        maxFileSizeMB: env.MAX_FILE_SIZE_MB,
        maxFileSizeBytes: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    },
    frontend: {
        url: env.FRONTEND_URL,
    },
};
//# sourceMappingURL=env.js.map