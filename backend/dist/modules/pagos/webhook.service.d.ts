import type { WebhookPagoDTOType } from './dtos';
export declare class WebhookService {
    recibirWebhook(payload: WebhookPagoDTOType, headers: any): Promise<{
        success: boolean;
        message: string;
        webhookId: string;
    }>;
    private procesarPagoAprobado;
    private procesarPagoRechazado;
    listar(pagination: {
        page: number;
        limit: number;
    }): Promise<{
        data: ({
            pago: {
                estado: string | null;
                numeroorden: string;
            } | null;
        } & {
            error: string | null;
            id: string;
            ip: string | null;
            procesado: boolean | null;
            fechaprocesamiento: Date | null;
            pago_id: string | null;
            headers: import("@prisma/client/runtime/library").JsonValue | null;
            evento: string;
            payload: import("@prisma/client/runtime/library").JsonValue;
            fecharecepcion: Date | null;
            pasarela_id: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    reprocesar(webhookId: string): Promise<{
        success: boolean;
        message: string;
        webhookId: string;
    }>;
}
export declare const webhookService: WebhookService;
//# sourceMappingURL=webhook.service.d.ts.map