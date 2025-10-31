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
export declare class FileUploadService {
    validateFile(file: Express.Multer.File, options?: FileUploadOptions): {
        valid: boolean;
        error?: string;
    };
    saveFile(file: Express.Multer.File, options: FileUploadOptions): Promise<UploadedFile>;
    saveLogo(file: Express.Multer.File): Promise<string>;
    deleteFile(filePath: string): boolean;
    fileExists(filePath: string): boolean;
    generateFileHash(fileBuffer: Buffer): string;
    saveActa(file: Express.Multer.File, metadata?: {
        numero?: string;
        anio?: number;
    }): Promise<UploadedActa>;
    actaExistsByHash(hash: string): boolean;
}
export declare const fileUploadService: FileUploadService;
//# sourceMappingURL=file-upload.service.d.ts.map