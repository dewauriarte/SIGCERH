import multer from 'multer';
import path from 'path';
import fs from 'fs';
const STORAGE_DIR = path.join(process.cwd(), 'storage', 'certificados', 'firmados');
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, STORAGE_DIR);
    },
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const ext = path.extname(file.originalname);
        const filename = `CERT_FIRMADO_${timestamp}_${random}${ext}`;
        cb(null, filename);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan PDF e imágenes (JPG, PNG, WEBP)'));
    }
};
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});
export const uploadCertificadoFirmado = upload.single('certificado');
export const handleMulterError = (err, _req, res, next) => {
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
//# sourceMappingURL=upload-certificado.middleware.js.map