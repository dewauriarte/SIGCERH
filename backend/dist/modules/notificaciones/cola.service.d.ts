import { ItemCola } from './types';
export declare class ColaService {
    private cola;
    private procesando;
    agregar(notificacionId: string, prioridad?: number): ItemCola;
    procesar(): Promise<boolean>;
    getTamano(): number;
    limpiar(): void;
    getEstado(): {
        tamano: number;
        procesando: boolean;
        items: {
            notificacionId: string;
            prioridad: number;
            tiempoEnCola: number;
        }[];
    };
}
export declare const colaService: ColaService;
//# sourceMappingURL=cola.service.d.ts.map