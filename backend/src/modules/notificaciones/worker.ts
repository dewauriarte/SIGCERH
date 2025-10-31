/**
 * Worker de Notificaciones
 * Procesa la cola de notificaciones automáticamente
 */

import { logger } from '@config/logger';
import { colaService } from './cola.service';
import { emailService } from './email.service';

class NotificacionWorker {
  private intervalo: NodeJS.Timeout | null = null;
  private readonly INTERVALO_MS = 10000; // 10 segundos
  private activo: boolean = false;

  /**
   * Iniciar worker
   */
  async iniciar(): Promise<void> {
    if (this.activo) {
      logger.warn('Worker de notificaciones ya está activo');
      return;
    }

    // Validar conexión SMTP antes de iniciar
    const conexionValida = await emailService.validarConexion();

    if (!conexionValida) {
      logger.error('No se pudo validar la conexión SMTP. Worker no iniciado.');
      logger.warn('Revise las variables SMTP_* en el archivo .env');
      return;
    }

    this.activo = true;

    logger.info(`✓ Worker de notificaciones iniciado (intervalo: ${this.INTERVALO_MS}ms)`);

    // Iniciar intervalo
    this.intervalo = setInterval(() => {
      this.procesarCola().catch((error) => {
        logger.error(`Error en worker de notificaciones: ${error.message}`);
      });
    }, this.INTERVALO_MS);

    // Procesar inmediatamente al iniciar
    this.procesarCola().catch((error) => {
      logger.error(`Error en primera ejecución del worker: ${error.message}`);
    });
  }

  /**
   * Procesar cola de notificaciones
   */
  private async procesarCola(): Promise<void> {
    try {
      const estado = colaService.getEstado();

      if (estado.tamano === 0) {
        return; // No hay nada que procesar
      }

      logger.debug(`Procesando cola de notificaciones (${estado.tamano} pendientes)`);

      // Procesar una notificación por iteración
      await colaService.procesar();
    } catch (error: any) {
      logger.error(`Error al procesar cola: ${error.message}`);
    }
  }

  /**
   * Detener worker
   */
  detener(): void {
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

  /**
   * Verificar si está activo
   */
  estaActivo(): boolean {
    return this.activo;
  }

  /**
   * Obtener estado del worker
   */
  getEstado() {
    return {
      activo: this.activo,
      intervaloMs: this.INTERVALO_MS,
      cola: colaService.getEstado(),
    };
  }
}

export const notificacionWorker = new NotificacionWorker();

