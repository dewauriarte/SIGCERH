import { UpdateConfiguracionData } from './types';
export declare class ConfiguracionService {
    getConfiguracion(): Promise<{
        id: string;
        nombre: string;
        codigoModular: string;
        direccion: string | null;
        telefono: string | null;
        email: string | null;
        logoUrl: string | null;
        activo: boolean | null;
        fechaActualizacion: Date | null;
    }>;
    updateConfiguracion(data: UpdateConfiguracionData): Promise<{
        id: string;
        nombre: string;
        codigoModular: string;
        direccion: string | null;
        telefono: string | null;
        email: string | null;
        logoUrl: string | null;
        activo: boolean | null;
        fechaActualizacion: Date | null;
    }>;
    updateLogo(logoUrl: string): Promise<{
        id: string;
        logoUrl: string | null;
        fechaActualizacion: Date | null;
    }>;
}
export declare const configuracionService: ConfiguracionService;
//# sourceMappingURL=configuracion.service.d.ts.map