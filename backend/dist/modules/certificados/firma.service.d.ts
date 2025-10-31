export declare class FirmaService {
    firmarDigitalmente(certificadoId: string, _certificadoDigital: any, usuarioId: string): Promise<any>;
    marcarFirmaManuscrita(certificadoId: string, usuarioId: string, observaciones?: string): Promise<any>;
    subirCertificadoFirmado(certificadoId: string, file: Express.Multer.File, usuarioId: string): Promise<any>;
    verificarEstadoFirma(certificadoId: string): Promise<any>;
}
export declare const firmaService: FirmaService;
//# sourceMappingURL=firma.service.d.ts.map