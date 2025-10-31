/**
 * Middleware para subida de certificados firmados (escaneados)
 * Acepta PDF e imágenes
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Configurar directorio de almacenamiento
const STORAGE_DIR = path.join(process.cwd(), 'storage', 'certificados', 'firmados');

// Asegurar que el directorio existe
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, STORAGE_DIR);
  },
  filename: (_req, file, cb) => {
    // Generar nombre único
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    const filename = `CERT_FIRMADO_${timestamp}_${random}${ext}`;
    cb(null, filename);
  },
});

// Filtro de tipos de archivo permitidos
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Tipo de archivo no permitido. Solo se aceptan PDF e imágenes (JPG, PNG, WEBP)')
    );
  }
};

// Configuración de multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

/**
 * Middleware para subir un solo certificado firmado
 */
export const uploadCertificadoFirmado = upload.single('certificado');

/**
 * Middleware para manejar errores de multer
 */
export const handleMulterError = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Tamaño máximo: 10 MB',
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `Error al subir archivo: ${err.message}`,
    });
    return;
  }

  if (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Error al subir archivo',
    });
    return;
  }

  next();
};

