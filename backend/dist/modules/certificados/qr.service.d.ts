export declare class QRService {
    private BASE_URL;
    private STORAGE_DIR;
    generarQR(certificadoId: string): Promise<Buffer>;
    generarQRDataURL(certificadoId: string): Promise<string>;
    getRutaQR(codigoVirtual: string): string;
}
export declare const qrService: QRService;
//# sourceMappingURL=qr.service.d.ts.map