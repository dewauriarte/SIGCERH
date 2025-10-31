/**
 * Configuración de Logger con Winston
 * Soporta logs en consola y archivo
 */

import winston from 'winston';
import { config } from './env.js';

// Formato personalizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para consola (más legible)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Transportes (dónde se escriben los logs)
const transports: winston.transport[] = [
  // Consola
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// En producción, agregar logs a archivo
if (config.server.isProduction) {
  transports.push(
    new winston.transports.File({
      filename: `${config.logging.filePath}/error.log`,
      level: 'error',
      format: customFormat,
    }),
    new winston.transports.File({
      filename: `${config.logging.filePath}/combined.log`,
      format: customFormat,
    })
  );
}

// Crear logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  transports,
  // No salir en caso de error
  exitOnError: false,
});

// Función helper para logs de request HTTP
export function logRequest(method: string, url: string, statusCode: number, duration: number) {
  const message = `${method} ${url} ${statusCode} - ${duration}ms`;
  if (statusCode >= 500) {
    logger.error(message);
  } else if (statusCode >= 400) {
    logger.warn(message);
  } else {
    logger.info(message);
  }
}

// Stream para Morgan (middleware de Express)
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Formato personalizado de Morgan para desarrollo
export const morganFormat = ':method :url :status :res[content-length] - :response-time ms';

export default logger;

