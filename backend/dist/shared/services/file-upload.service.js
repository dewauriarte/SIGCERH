import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@config/logger';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_ACTA_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
];
const ALLOWED_ACTA_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_ACTA_SIZE = 10 * 1024 * 1024;
export class FileUploadService {
    validateFile(file, options = { directory: 'uploads' }) {
        const allowedTypes = options.allowedTypes || ALLOWED_IMAGE_TYPES;
        const maxSize = options.maxSize || MAX_FILE_SIZE;
        if (!allowedTypes.includes(file.mimetype)) {
            return {
                valid: false,
                error: `Tipo de archivo no permitido. Solo se aceptan: ${allowedTypes.join(', ')}`,
            };
        }
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return {
                valid: false,
                error: `Extensión no permitida. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(', ')}`,
            };
        }
        if (file.size > maxSize) {
            const maxSizeMB = maxSize / (1024 * 1024);
            return {
                valid: false,
                error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`,
            };
        }
        return { valid: true };
    }
    async saveFile(file, options) {
        const validation = this.validateFile(file, options);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        const ext = path.extname(file.originalname);
        const uniqueName = `${uuidv4()}${ext}`;
        const uploadDir = path.join(process.cwd(), 'storage', options.directory);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
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
    async saveLogo(file) {
        const uploaded = await this.saveFile(file, {
            directory: 'logos',
            allowedTypes: ALLOWED_IMAGE_TYPES,
            maxSize: MAX_FILE_SIZE,
        });
        return `/storage/logos/${uploaded.filename}`;
    }
    deleteFile(filePath) {
        try {
            const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''));
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                logger.info(`Archivo eliminado: ${filePath}`);
                return true;
            }
            return false;
        }
        catch (error) {
            logger.error(`Error al eliminar archivo: ${filePath}`, error);
            return false;
        }
    }
    fileExists(filePath) {
        try {
            const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''));
            return fs.existsSync(fullPath);
        }
        catch (error) {
            return false;
        }
    }
    generateFileHash(fileBuffer) {
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }
    async saveActa(file, metadata) {
        if (!ALLOWED_ACTA_TYPES.includes(file.mimetype)) {
            throw new Error(`Tipo de archivo no permitido para actas. Solo se aceptan: PDF, JPG, JPEG, PNG`);
        }
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_ACTA_EXTENSIONS.includes(ext)) {
            throw new Error(`Extensión no permitida para actas. Solo se aceptan: ${ALLOWED_ACTA_EXTENSIONS.join(', ')}`);
        }
        if (file.size > MAX_ACTA_SIZE) {
            const maxSizeMB = MAX_ACTA_SIZE / (1024 * 1024);
            throw new Error(`El archivo es demasiado grande. Tamaño máximo para actas: ${maxSizeMB}MB`);
        }
        const fileHash = this.generateFileHash(file.buffer);
        let uniqueName;
        if (metadata?.numero && metadata?.anio) {
            uniqueName = `ACTA_${metadata.numero}_${metadata.anio}_${uuidv4()}${ext}`;
        }
        else {
            uniqueName = `ACTA_${uuidv4()}${ext}`;
        }
        const uploadDir = path.join(process.cwd(), 'storage', 'actas');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, uniqueName);
        fs.writeFileSync(filePath, file.buffer);
        logger.info(`Acta guardada: ${uniqueName} (${file.size} bytes, hash: ${fileHash.substring(0, 10)}...)`);
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
    actaExistsByHash(hash) {
        const actasDir = path.join(process.cwd(), 'storage', 'actas');
        if (!fs.existsSync(actasDir)) {
            return false;
        }
        const files = fs.readdirSync(actasDir);
        for (const file of files) {
            const filePath = path.join(actasDir, file);
            try {
                const fileBuffer = fs.readFileSync(filePath);
                const fileHash = this.generateFileHash(fileBuffer);
                if (fileHash === hash) {
                    logger.warn(`Acta duplicada encontrada: ${file} con hash ${hash.substring(0, 10)}...`);
                    return true;
                }
            }
            catch (error) {
                logger.error(`Error al verificar hash de archivo ${file}:`, error);
            }
        }
        return false;
    }
}
export const fileUploadService = new FileUploadService();
//# sourceMappingURL=file-upload.service.js.map