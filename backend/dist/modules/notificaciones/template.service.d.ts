import { TipoNotificacion, DatosNotificacion } from './types';
export declare class TemplateService {
    private templatesDir;
    private baseTemplate;
    private templates;
    constructor();
    private cargarPlantillas;
    renderizarPlantilla(tipo: TipoNotificacion, datos: DatosNotificacion): string;
    private obtenerAsunto;
    getAsunto(tipo: TipoNotificacion): string;
}
export declare const templateService: TemplateService;
//# sourceMappingURL=template.service.d.ts.map