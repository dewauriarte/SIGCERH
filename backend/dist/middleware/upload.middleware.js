import multer from 'multer';
import { logger } from '@config/logger';
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const fileFilter = (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        logger.warn(`Tipo de archivo rechazado: ${file.mimetype}`);
        return cb(new Error(`Tipo de archivo no permitido. Solo se aceptan: PDF, JPG, JPEG, PNG`));
    }
    const extension = file.originalname
        .substring(file.originalname.lastIndexOf('.'))
        .toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        logger.warn(`Extensión de archivo rechazada: ${extension}`);
        return cb(new Error(`Extensión no permitida. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
    cb(null, true);
};
const uploadConfig = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
    },
});
export const uploadActa = uploadConfig.single('archivo');
export const handleMulterError = (error, _req, res, next) => {
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
//# sourceMappingURL=upload.middleware.js.map