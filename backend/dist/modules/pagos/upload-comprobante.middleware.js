import multer from 'multer';
import path from 'path';
import fs from 'fs';
const STORAGE_DIR = path.join(process.cwd(), 'storage', 'comprobantes');
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const now = new Date();
        const anio = now.getFullYear();
        const mes = String(now.getMonth() + 1).padStart(2, '0');
        const dir = path.join(STORAGE_DIR, String(anio), mes);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const ext = path.extname(file.originalname);
        const filename = `COMP_${timestamp}_${random}${ext}`;
        cb(null, filename);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP) y PDF'));
    }
};
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
export const uploadComprobante = upload.single('comprobante');
export const handleMulterError = (err, _req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
                success: false,
                message: 'El archivo es demasiado grande. Tamaño máximo: 5 MB',
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
//# sourceMappingURL=upload-comprobante.middleware.js.map