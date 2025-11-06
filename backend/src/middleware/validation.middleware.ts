/**
 * Middleware de validación con Zod
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '@config/logger';

/**
 * Middleware para validar el body de la request con un schema de Zod
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Validación fallida:', { errors, body: req.body });

        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors,
        });
        return;
      }

      logger.error('Error en validación:', error);
      res.status(500).json({
        success: false,
        message: 'Error en la validación',
      });
    }
  };
};

/**
 * Middleware para validar query params con un schema de Zod
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Validación de query fallida:', { errors, query: req.query });

        res.status(400).json({
          success: false,
          message: 'Parámetros de consulta inválidos',
          errors,
        });
        return;
      }

      logger.error('Error en validación de query:', error);
      res.status(500).json({
        success: false,
        message: 'Error en la validación',
      });
    }
  };
};

/**
 * Middleware para validar params con un schema de Zod
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Validación de params fallida:', { errors, params: req.params });

        res.status(400).json({
          success: false,
          message: 'Parámetros de ruta inválidos',
          errors,
        });
        return;
      }

      logger.error('Error en validación de params:', error);
      res.status(500).json({
        success: false,
        message: 'Error en la validación',
      });
    }
  };
};
