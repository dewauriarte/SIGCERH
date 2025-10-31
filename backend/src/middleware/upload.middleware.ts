/**
 * Middleware de subida de archivos con Multer
 * Validación de formatos y tamaños para actas físicas
 */

import multer from 'multer';
import { Request } from 'express';
import { logger } from '@config/logger';

// Tipos de archivo permitidos para actas
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

// Tamaño máximo: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validar tipo de archivo
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Validar MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    logger.warn(`Tipo de archivo rechazado: ${file.mimetype}`);
    return cb(
      new Error(
        `Tipo de archivo no permitido. Solo se aceptan: PDF, JPG, JPEG, PNG`
      )
    );
  }

  // Validar extensión
  const extension = file.originalname
    .substring(file.originalname.lastIndexOf('.'))
    .toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    logger.warn(`Extensión de archivo rechazada: ${extension}`);
    return cb(
      new Error(
        `Extensión no permitida. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(', ')}`
      )
    );
  }

  cb(null, true);
};

/**
 * Configuración de Multer para subida de actas
 * Usa memoryStorage para validar antes de guardar
 */
const uploadConfig = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Solo un archivo a la vez
  },
});

/**
 * Middleware para subir un acta física
 * Campo del formulario: 'archivo'
 */
export const uploadActa = uploadConfig.single('archivo');

/**
 * Middleware para manejar errores de Multer
 */
export const handleMulterError = (
  error: any,
  _req: Request,
  res: any,
  next: any
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de archivo inesperado. Use el campo "archivo"',
      });
    }

    return res.status(400).json({
      success: false,
      message: `Error al subir archivo: ${error.message}`,
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al procesar archivo',
    });
  }

  next();
};

