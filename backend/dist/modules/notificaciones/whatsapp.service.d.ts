import ExcelJS from 'exceljs';
import type { EnlaceWhatsApp } from './types';
export declare class WhatsAppService {
    private readonly BASE_URL;
    private readonly CODIGO_PAIS;
    generarEnlaceWhatsApp(telefono: string, mensaje: string): string;
    generarListadoPendientes(): Promise<EnlaceWhatsApp[]>;
    private generarMensaje;
    exportarCSV(notificaciones: any[]): Promise<ExcelJS.Workbook>;
    marcarComoEnviada(notificacionId: string, usuarioId: string): Promise<{
        error: string | null;
        id: string;
        fechacreacion: Date | null;
        estado: string | null;
        tipo: string;
        solicitud_id: string | null;
        certificado_id: string | null;
        destinatario: string;
        asunto: string | null;
        mensaje: string;
        canal: string;
        intentos: number | null;
        fechaenvio: Date | null;
        fechaleido: Date | null;
    }>;
}
export declare const whatsappService: WhatsAppService;
//# sourceMappingURL=whatsapp.service.d.ts.map