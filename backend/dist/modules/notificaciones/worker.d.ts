declare class NotificacionWorker {
    private intervalo;
    private readonly INTERVALO_MS;
    private activo;
    iniciar(): Promise<void>;
    private procesarCola;
    detener(): void;
    estaActivo(): boolean;
    getEstado(): {
        activo: boolean;
        intervaloMs: number;
        cola: {
            tamano: number;
            procesando: boolean;
            items: {
                notificacionId: string;
                prioridad: number;
                tiempoEnCola: number;
            }[];
        };
    };
}
export declare const notificacionWorker: NotificacionWorker;
export {};
//# sourceMappingURL=worker.d.ts.map