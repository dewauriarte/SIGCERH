/**
 * Servicio de Cola de Notificaciones
 * Cola simple en memoria con prioridades
 */

import { logger } from '@config/logger';
import { notificacionService } from './notificacion.service';
import { ItemCola } from './types';

export class ColaService {
  private cola: ItemCola[] = [];
  private procesando: boolean = false;

  /**
   * Agregar notificación a la cola
   */
  agregar(notificacionId: string, prioridad: number = 5) {
    const item: ItemCola = {
      notificacionId,
      prioridad,
      fechaAgregado: new Date(),
    };

    this.cola.push(item);

    // Ordenar por prioridad (menor número = mayor prioridad)
    this.cola.sort((a, b) => a.prioridad - b.prioridad);

    logger.debug(`Notificación ${notificacionId} agregada a cola (prioridad: ${prioridad})`);

    return item;
  }

  /**
   * Procesar siguiente notificación en la cola
   */
  async procesar(): Promise<boolean> {
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

      // Enviar notificación
      await notificacionService.enviarPorEmail(item.notificacionId);

      logger.info(`Notificación ${item.notificacionId} procesada exitosamente`);

      return true;
    } catch (error: any) {
      logger.error(`Error al procesar notificación desde cola: ${error.message}`);
      return false;
    } finally {
      this.procesando = false;
    }
  }

  /**
   * Obtener tamaño actual de la cola
   */
  getTamano(): number {
    return this.cola.length;
  }

  /**
   * Limpiar cola
   */
  limpiar(): void {
    this.cola = [];
    logger.info('Cola de notificaciones limpiada');
  }

  /**
   * Obtener estado de la cola
   */
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

