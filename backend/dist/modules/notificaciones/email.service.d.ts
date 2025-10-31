import { ResultadoEnvio } from './types';
export declare class EmailService {
    private transporter;
    private readonly MAX_REINTENTOS;
    private readonly DELAY_BASE;
    constructor();
    validarConexion(): Promise<boolean>;
    enviarEmail(destinatario: string, asunto: string, html: string, intento?: number): Promise<ResultadoEnvio>;
    private sleep;
    cerrar(): Promise<void>;
}
export declare const emailService: EmailService;
//# sourceMappingURL=email.service.d.ts.map