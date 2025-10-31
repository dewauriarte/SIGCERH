/**
 * Servicio de subida de archivos
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@config/logger';

// Tipos de archivo permitidos para logos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// Tipos de archivo permitidos para actas
const ALLOWED_ACTA_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];
const ALLOWED_ACTA_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_ACTA_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileUploadOptions {
  allowedTypes?: string[];
  maxSize?: number;
  directory: string;
}

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
}

export interface UploadedActa extends UploadedFile {
  hash: string;
  url: string;
}

export class FileUploadService {
  /**
   * Validar un archivo
   */
  validateFile(
    file: Express.Multer.File,
    options: FileUploadOptions = { directory: 'uploads' }
  ): { valid: boolean; error?: string } {
    const allowedTypes = options.allowedTypes || ALLOWED_IMAGE_TYPES;
    const maxSize = options.maxSize || MAX_FILE_SIZE;

    // Validar tipo de archivo
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Solo se aceptan: ${allowedTypes.join(', ')}`,
      };
    }

    // Validar extensión
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Extensión no permitida. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }

    // Validar tamaño
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return {
        valid: false,
        error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Guardar un archivo en el sistema
   */
  async saveFile(
    file: Express.Multer.File,
    options: FileUploadOptions
  ): Promise<UploadedFile> {
    // Validar archivo
    const validation = this.validateFile(file, options);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generar nombre único
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;

    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'storage', options.directory);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Guardar archivo
    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, file.buffer);

    logger.info(`Archivo guardado: ${uniqueName} (${file.size} bytes)`);

    return {
      filename: uniqueName,
      originalName: file.originalname,
      path: filePath,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /**
   * Guardar logo institucional
   */
  async saveLogo(file: Express.Multer.File): Promise<string> {
    const uploaded = await this.saveFile(file, {
      directory: 'logos',
      allowedTypes: ALLOWED_IMAGE_TYPES,
      maxSize: MAX_FILE_SIZE,
    });

    // Retornar URL relativa
    return `/storage/logos/${uploaded.filename}`;
  }

  /**
   * Eliminar un archivo
   */
  deleteFile(filePath: string): boolean {
    try {
      const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''));
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.info(`Archivo eliminado: ${filePath}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Error al eliminar archivo: ${filePath}`, error);
      return false;
    }
  }

  /**
   * Verificar si un archivo existe
   */
  fileExists(filePath: string): boolean {
    try {
      const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''));
      return fs.existsSync(fullPath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generar hash SHA-256 de un archivo
   */
  generateFileHash(fileBuffer: Buffer): string {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Guardar acta física (PDF o imagen)
   * Genera hash del archivo para evitar duplicados
   */
  async saveActa(
    file: Express.Multer.File,
    metadata?: { numero?: string; anio?: number }
  ): Promise<UploadedActa> {
    // Validar tipo de archivo
    if (!ALLOWED_ACTA_TYPES.includes(file.mimetype)) {
      throw new Error(
        `Tipo de archivo no permitido para actas. Solo se aceptan: PDF, JPG, JPEG, PNG`
      );
    }

    // Validar extensión
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_ACTA_EXTENSIONS.includes(ext)) {
      throw new Error(
        `Extensión no permitida para actas. Solo se aceptan: ${ALLOWED_ACTA_EXTENSIONS.join(', ')}`
      );
    }

    // Validar tamaño
    if (file.size > MAX_ACTA_SIZE) {
      const maxSizeMB = MAX_ACTA_SIZE / (1024 * 1024);
      throw new Error(
        `El archivo es demasiado grande. Tamaño máximo para actas: ${maxSizeMB}MB`
      );
    }

    // Generar hash del archivo
    const fileHash = this.generateFileHash(file.buffer);

    // Generar nombre único con metadata opcional
    let uniqueName: string;
    if (metadata?.numero && metadata?.anio) {
      // Nombre descriptivo: ACTA_001_1990_uuid.pdf
      uniqueName = `ACTA_${metadata.numero}_${metadata.anio}_${uuidv4()}${ext}`;
    } else {
      uniqueName = `ACTA_${uuidv4()}${ext}`;
    }

    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'storage', 'actas');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Guardar archivo
    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, file.buffer);

    logger.info(
      `Acta guardada: ${uniqueName} (${file.size} bytes, hash: ${fileHash.substring(0, 10)}...)`
    );

    return {
      filename: uniqueName,
      originalName: file.originalname,
      path: filePath,
      size: file.size,
      mimetype: file.mimetype,
      hash: fileHash,
      url: `/storage/actas/${uniqueName}`,
    };
  }

  /**
   * Verificar si un acta con el mismo hash ya existe
   */
  actaExistsByHash(hash: string): boolean {
    const actasDir = path.join(process.cwd(), 'storage', 'actas');
    
    if (!fs.existsSync(actasDir)) {
      return false;
    }

    // Leer todos los archivos del directorio
    const files = fs.readdirSync(actasDir);
    
    // Verificar hash de cada archivo
    for (const file of files) {
      const filePath = path.join(actasDir, file);
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const fileHash = this.generateFileHash(fileBuffer);
        
        if (fileHash === hash) {
          logger.warn(`Acta duplicada encontrada: ${file} con hash ${hash.substring(0, 10)}...`);
          return true;
        }
      } catch (error) {
        logger.error(`Error al verificar hash de archivo ${file}:`, error);
      }
    }

    return false;
  }
}

export const fileUploadService = new FileUploadService();

