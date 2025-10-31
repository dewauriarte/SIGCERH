/**
 * Middleware para manejo centralizado de errores
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger.js';

// Clase de error personalizada
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Manejador de errores global
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log del error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Error de validación de Zod
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

  // Errores de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Violación de constraint único
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un registro con esos datos',
        field: (err.meta?.target as string[])?.join(', '),
      });
    }

    // Registro no encontrado
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Registro no encontrado',
      });
    }

    // Foreign key constraint
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Error de relación: el registro relacionado no existe',
      });
    }
  }

  // Error de Prisma de validación
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Error de validación en la base de datos',
    });
  }

  // Error personalizado (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Error genérico (500)
  return res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
}

// Manejador de rutas no encontradas (404)
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.url}`,
  });
}

