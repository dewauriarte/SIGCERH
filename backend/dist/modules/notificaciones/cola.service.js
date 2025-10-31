import { logger } from '@config/logger';
import { notificacionService } from './notificacion.service';
export class ColaService {
    cola = [];
    procesando = false;
    agregar(notificacionId, prioridad = 5) {
        const item = {
            notificacionId,
            prioridad,
            fechaAgregado: new Date(),
        };
        this.cola.push(item);
        this.cola.sort((a, b) => a.prioridad - b.prioridad);
        logger.debug(`Notificación ${notificacionId} agregada a cola (prioridad: ${prioridad})`);
        return item;
    }
    async procesar() {
        if (this.procesando) {
            logger.debug('Ya hay un procesamiento en curso, saltando...');
            return false;
        }
        if (this.cola.length === 0) {
            return false;
        }
        this.procesando = true;
        try {
            const item = this.cola.shift();
            if (!item) {
                return false;
            }
            logger.info(`Procesando notificación ${item.notificacionId} desde cola`);
            await notificacionService.enviarPorEmail(item.notificacionId);
            logger.info(`Notificación ${item.notificacionId} procesada exitosamente`);
            return true;
        }
        catch (error) {
            logger.error(`Error al procesar notificación desde cola: ${error.message}`);
            return false;
        }
        finally {
            this.procesando = false;
        }
    }
    getTamano() {
        return this.cola.length;
    }
    limpiar() {
        this.cola = [];
        logger.info('Cola de notificaciones limpiada');
    }
    getEstado() {
        return {
            tamano: this.cola.length,
            procesando: this.procesando,
            items: this.cola.map((item) => ({
                notificacionId: item.notificacionId,
                prioridad: item.prioridad,
                tiempoEnCola: Date.now() - item.fechaAgregado.getTime(),
            })),
        };
    }
}
export const colaService = new ColaService();
//# sourceMappingURL=cola.service.js.map