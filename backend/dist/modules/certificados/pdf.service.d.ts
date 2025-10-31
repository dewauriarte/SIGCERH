import type { ResultadoPDF } from './types';
export declare class PDFService {
    private STORAGE_DIR;
    generarPDF(certificadoId: string, regenerar?: boolean): Promise<ResultadoPDF>;
    private actualizarCertificadoConPDF;
    private generarHeader;
    private generarDatosEstudiante;
    private generarTablaNotas;
    private generarFooter;
}
export declare const pdfService: PDFService;
//# sourceMappingURL=pdf.service.d.ts.map