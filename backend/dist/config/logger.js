import winston from 'winston';
import { config } from './env.js';
const customFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.splat(), winston.format.json());
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp({ format: 'HH:mm:ss' }), winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
}));
const transports = [
    new winston.transports.Console({
        format: consoleFormat,
    }),
];
if (config.server.isProduction) {
    transports.push(new winston.transports.File({
        filename: `${config.logging.filePath}/error.log`,
        level: 'error',
        format: customFormat,
    }), new winston.transports.File({
        filename: `${config.logging.filePath}/combined.log`,
        format: customFormat,
    }));
}
export const logger = winston.createLogger({
    level: config.logging.level,
    format: customFormat,
    transports,
    exitOnError: false,
});
export function logRequest(method, url, statusCode, duration) {
    const message = `${method} ${url} ${statusCode} - ${duration}ms`;
    if (statusCode >= 500) {
        logger.error(message);
    }
    else if (statusCode >= 400) {
        logger.warn(message);
    }
    else {
        logger.info(message);
    }
}
export const morganStream = {
    write: (message) => {
        logger.http(message.trim());
    },
};
export const morganFormat = ':method :url :status :res[content-length] - :response-time ms';
export default logger;
//# sourceMappingURL=logger.js.map