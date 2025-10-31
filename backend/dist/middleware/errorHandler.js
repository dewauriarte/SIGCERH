import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger.js';
export class AppError extends Error {
    statusCode;
    message;
    isOperational;
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
export function errorHandler(err, req, res, _next) {
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
    });
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            error: 'Errores de validación',
            details: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            return res.status(409).json({
                success: false,
                error: 'Ya existe un registro con esos datos',
                field: err.meta?.target?.join(', '),
            });
        }
        if (err.code === 'P2025') {
            return res.status(404).json({
                success: false,
                error: 'Registro no encontrado',
            });
        }
        if (err.code === 'P2003') {
            return res.status(400).json({
                success: false,
                error: 'Error de relación: el registro relacionado no existe',
            });
        }
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
        return res.status(400).json({
            success: false,
            error: 'Error de validación en la base de datos',
        });
    }
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
    }
    return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    });
}
export function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: `Ruta no encontrada: ${req.method} ${req.url}`,
    });
}
//# sourceMappingURL=errorHandler.js.map