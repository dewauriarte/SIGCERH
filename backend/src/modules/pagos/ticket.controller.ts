/**
 * Controlador de Tickets de Pago
 */

import { Request, Response } from 'express';
import { ticketService } from './ticket.service';
import { logger } from '@config/logger';

export class TicketController {
  /**
   * GET /api/pagos/:id/ticket
   * Descargar ticket de pago
   */
  async descargarTicket(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const pdfBuffer = await ticketService.generarTicketPago(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ticket-${id}.pdf"`);
      res.send(pdfBuffer);

      logger.info(`Ticket descargado: pago ${id}`);
    } catch (error: any) {
      logger.error('Error descargando ticket:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al generar ticket',
      });
    }
  }

  /**
   * GET /api/pagos/:id/recibo
   * Descargar recibo de pago en efectivo
   */
  async descargarRecibo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const pdfBuffer = await ticketService.generarReciboPagoEfectivo(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="recibo-${id}.pdf"`);
      res.send(pdfBuffer);

      logger.info(`Recibo descargado: pago ${id}`);
    } catch (error: any) {
      logger.error('Error descargando recibo:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al generar recibo',
      });
    }
  }
}

export const ticketController = new TicketController();

