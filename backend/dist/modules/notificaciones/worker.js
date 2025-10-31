import { logger } from '@config/logger';
import { colaService } from './cola.service';
import { emailService } from './email.service';
class NotificacionWorker {
    intervalo = null;
    INTERVALO_MS = 10000;
    activo = false;
    async iniciar() {
        if (this.activo) {
            logger.warn('Worker de notificaciones ya está activo');
            return;
        }
        const conexionValida = await emailService.validarConexion();
        if (!conexionValida) {
            logger.error('No se pudo validar la conexión SMTP. Worker no iniciado.');
            logger.warn('Revise las variables SMTP_* en el archivo .env');
            return;
        }
        this.activo = true;
        logger.info(`✓ Worker de notificaciones iniciado (intervalo: ${this.INTERVALO_MS}ms)`);
        this.intervalo = setInterval(() => {
            this.procesarCola().catch((error) => {
                logger.error(`Error en worker de notificaciones: ${error.message}`);
            });
        }, this.INTERVALO_MS);
        this.procesarCola().catch((error) => {
            logger.error(`Error en primera ejecución del worker: ${error.message}`);
        });
    }
    async procesarCola() {
        try {
            const estado = colaService.getEstado();
            if (estado.tamano === 0) {
                return;
            }
            logger.debug(`Procesando cola de notificaciones (${estado.tamano} pendientes)`);
            await colaService.procesar();
        }
        catch (error) {
            logger.error(`Error al procesar cola: ${error.message}`);
        }
    }
    detener() {
        if (!this.activo) {
            logger.warn('Worker de notificaciones no está activo');
            return;
        }
        if (this.intervalo) {
            clearInterval(this.intervalo);
            this.intervalo = null;
        }
        this.activo = false;
        logger.info('Worker de notificaciones detenido');
    }
    estaActivo() {
        return this.activo;
    }
    getEstado() {
        return {
            activo: this.activo,
            intervaloMs: this.INTERVALO_MS,
            cola: colaService.getEstado(),
        };
    }
}
export const notificacionWorker = new NotificacionWorker();
//# sourceMappingURL=worker.js.map