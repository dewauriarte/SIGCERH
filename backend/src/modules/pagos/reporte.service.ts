/**
 * Servicio de Reportes de Pagos
 * Genera reportes y exportación a Excel
 */

import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { logger } from '@config/logger';
import { EstadoPago } from './types';

const prisma = new PrismaClient();

interface FiltrosReporte {
  fechaDesde?: Date;
  fechaHasta?: Date;
  metodopago?: string;
  estado?: EstadoPago;
  conciliado?: boolean;
}

interface EstadisticasPago {
  totalPagos: number;
  montoTotal: number;
  pagosPendientes: number;
  pagosValidados: number;
  pagosRechazados: number;
  pagosExpirados: number;
  pagosNoConsolidados: number;
}

export class ReporteService {
  /**
   * Reporte de pagos por período
   */
  async reportePorPeriodo(fechaDesde: Date, fechaHasta: Date) {
    const pagos = await prisma.pago.findMany({
      where: {
        fechapago: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
      },
      include: {
        solicitud: {
          select: {
            numeroexpediente: true,
            numeroseguimiento: true,
            estudiante: {
              select: {
                dni: true,
                nombres: true,
                apellidopaterno: true,
                apellidomaterno: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechapago: 'desc',
      },
    });

    // Calcular estadísticas
    const estadisticas: EstadisticasPago = {
      totalPagos: pagos.length,
      montoTotal: pagos.reduce((sum, p) => sum + Number(p.monto), 0),
      pagosPendientes: pagos.filter((p) => p.estado === EstadoPago.PENDIENTE).length,
      pagosValidados: pagos.filter((p) => p.estado === EstadoPago.VALIDADO).length,
      pagosRechazados: pagos.filter((p) => p.estado === EstadoPago.RECHAZADO).length,
      pagosExpirados: pagos.filter((p) => p.estado === EstadoPago.EXPIRADO).length,
      pagosNoConsolidados: pagos.filter((p) => !p.conciliado).length,
    };

    return {
      periodo: {
        desde: fechaDesde,
        hasta: fechaHasta,
      },
      estadisticas,
      pagos,
    };
  }

  /**
   * Reporte por método de pago
   */
  async reportePorMetodoPago(filtros?: FiltrosReporte) {
    const where: any = {};

    if (filtros?.fechaDesde || filtros?.fechaHasta) {
      where.fechapago = {};
      if (filtros.fechaDesde) {
        where.fechapago.gte = filtros.fechaDesde;
      }
      if (filtros.fechaHasta) {
        where.fechapago.lte = filtros.fechaHasta;
      }
    }

    if (filtros?.estado) {
      where.estado = filtros.estado;
    }

    if (filtros?.conciliado !== undefined) {
      where.conciliado = filtros.conciliado;
    }

    const pagos = await prisma.pago.findMany({
      where,
      select: {
        metodopago: true,
        monto: true,
        estado: true,
        conciliado: true,
      },
    });

    // Agrupar por método de pago
    const porMetodo = pagos.reduce((acc: any, pago) => {
      const metodo = pago.metodopago || 'SIN_ESPECIFICAR';

      if (!acc[metodo]) {
        acc[metodo] = {
          metodoPago: metodo,
          cantidad: 0,
          montoTotal: 0,
          validados: 0,
          pendientes: 0,
          rechazados: 0,
        };
      }

      acc[metodo].cantidad++;
      acc[metodo].montoTotal += Number(pago.monto);

      if (pago.estado === EstadoPago.VALIDADO) {
        acc[metodo].validados++;
      } else if (pago.estado === EstadoPago.PENDIENTE || pago.estado === EstadoPago.PAGADO) {
        acc[metodo].pendientes++;
      } else if (pago.estado === EstadoPago.RECHAZADO) {
        acc[metodo].rechazados++;
      }

      return acc;
    }, {});

    return {
      resumen: Object.values(porMetodo),
      totalGeneral: {
        cantidad: pagos.length,
        montoTotal: pagos.reduce((sum, p) => sum + Number(p.monto), 0),
      },
    };
  }

  /**
   * Reporte de pagos pendientes de validación
   */
  async reportePendientesValidacion() {
    const pagos = await prisma.pago.findMany({
      where: {
        estado: EstadoPago.PAGADO, // Estado PAGADO = subido comprobante, pendiente de validación
      },
      include: {
        solicitud: {
          select: {
            numeroexpediente: true,
            numeroseguimiento: true,
            estudiante: {
              select: {
                dni: true,
                nombres: true,
                apellidopaterno: true,
                apellidomaterno: true,
                telefono: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecharegistro: 'asc', // Los más antiguos primero
      },
    });

    // Calcular tiempo de espera
    const ahora = new Date();
    const pagosConTiempoEspera = pagos.map((pago) => {
      const fechaRegistro = pago.fecharegistro || new Date();
      const horasEspera = Math.floor(
        (ahora.getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60)
      );

      return {
        ...pago,
        horasEspera,
        prioridad: horasEspera > 24 ? 'ALTA' : horasEspera > 12 ? 'MEDIA' : 'NORMAL',
      };
    });

    return {
      total: pagos.length,
      urgentes: pagosConTiempoEspera.filter((p) => p.horasEspera > 24).length,
      pagos: pagosConTiempoEspera,
    };
  }

  /**
   * Reporte de pagos no conciliados
   */
  async reporteNoConciliados(filtros?: FiltrosReporte) {
    const where: any = {
      conciliado: false,
      estado: EstadoPago.VALIDADO, // Solo validados pero no conciliados
    };

    if (filtros?.fechaDesde || filtros?.fechaHasta) {
      where.fechapago = {};
      if (filtros.fechaDesde) {
        where.fechapago.gte = filtros.fechaDesde;
      }
      if (filtros.fechaHasta) {
        where.fechapago.lte = filtros.fechaHasta;
      }
    }

    if (filtros?.metodopago) {
      where.metodopago = filtros.metodopago;
    }

    const pagos = await prisma.pago.findMany({
      where,
      include: {
        solicitud: {
          select: {
            numeroexpediente: true,
            numeroseguimiento: true,
          },
        },
      },
      orderBy: {
        fechapago: 'desc',
      },
    });

    return {
      total: pagos.length,
      montoTotal: pagos.reduce((sum, p) => sum + Number(p.monto), 0),
      pagos,
    };
  }

  /**
   * Exportar reporte a Excel
   */
  async exportarExcel(tipo: 'periodo' | 'metodo' | 'pendientes' | 'noconciliados', filtros: any) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SIGCERH';
    workbook.created = new Date();

    let datos: any;

    // Obtener datos según el tipo de reporte
    switch (tipo) {
      case 'periodo':
        datos = await this.reportePorPeriodo(filtros.fechaDesde, filtros.fechaHasta);
        await this.generarHojaPorPeriodo(workbook, datos);
        break;

      case 'metodo':
        datos = await this.reportePorMetodoPago(filtros);
        await this.generarHojaPorMetodo(workbook, datos);
        break;

      case 'pendientes':
        datos = await this.reportePendientesValidacion();
        await this.generarHojaPendientes(workbook, datos);
        break;

      case 'noconciliados':
        datos = await this.reporteNoConciliados(filtros);
        await this.generarHojaNoConsolidados(workbook, datos);
        break;

      default:
        throw new Error('Tipo de reporte no válido');
    }

    logger.info(`Reporte ${tipo} generado exitosamente`);

    return workbook;
  }

  /**
   * Generar hoja de Excel para reporte por período
   */
  private async generarHojaPorPeriodo(workbook: ExcelJS.Workbook, datos: any) {
    const worksheet = workbook.addWorksheet('Pagos por Período');

    // Título
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REPORTE DE PAGOS POR PERÍODO';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Período
    worksheet.mergeCells('A2:I2');
    const periodoCell = worksheet.getCell('A2');
    periodoCell.value = `Del ${datos.periodo.desde.toLocaleDateString()} al ${datos.periodo.hasta.toLocaleDateString()}`;
    periodoCell.alignment = { horizontal: 'center' };

    // Estadísticas
    worksheet.addRow([]);
    worksheet.addRow(['ESTADÍSTICAS']);
    worksheet.addRow(['Total de Pagos:', datos.estadisticas.totalPagos]);
    worksheet.addRow(['Monto Total:', `S/ ${datos.estadisticas.montoTotal.toFixed(2)}`]);
    worksheet.addRow(['Validados:', datos.estadisticas.pagosValidados]);
    worksheet.addRow(['Pendientes:', datos.estadisticas.pagosPendientes]);
    worksheet.addRow(['Rechazados:', datos.estadisticas.pagosRechazados]);
    worksheet.addRow(['Expirados:', datos.estadisticas.pagosExpirados]);

    // Detalle de pagos
    worksheet.addRow([]);
    worksheet.addRow([
      'N° Orden',
      'N° Operación',
      'DNI',
      'Estudiante',
      'N° Expediente',
      'Método',
      'Monto',
      'Estado',
      'Fecha Pago',
    ]);

    // Estilo de encabezados
    const headerRow = worksheet.lastRow;
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    }

    // Datos
    datos.pagos.forEach((pago: any) => {
      const estudiante = pago.solicitud?.[0]?.estudiante;
      const nombreCompleto = estudiante
        ? `${estudiante.apellidopaterno} ${estudiante.apellidomaterno} ${estudiante.nombres}`
        : 'N/A';

      worksheet.addRow([
        pago.numeroorden,
        pago.numerooperacion || '',
        estudiante?.dni || '',
        nombreCompleto,
        pago.solicitud?.[0]?.numeroexpediente || '',
        pago.metodopago,
        Number(pago.monto),
        pago.estado,
        pago.fechapago,
      ]);
    });

    // Ajustar anchos de columna
    worksheet.columns = [
      { width: 20 },
      { width: 20 },
      { width: 12 },
      { width: 35 },
      { width: 18 },
      { width: 12 },
      { width: 12 },
      { width: 15 },
      { width: 15 },
    ];
  }

  /**
   * Generar hoja de Excel para reporte por método de pago
   */
  private async generarHojaPorMetodo(workbook: ExcelJS.Workbook, datos: any) {
    const worksheet = workbook.addWorksheet('Por Método de Pago');

    // Título
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REPORTE DE PAGOS POR MÉTODO';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.addRow([]);

    // Encabezados
    worksheet.addRow(['Método de Pago', 'Cantidad', 'Monto Total', 'Validados', 'Pendientes', 'Rechazados']);

    const headerRow = worksheet.lastRow;
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    }

    // Datos
    datos.resumen.forEach((metodo: any) => {
      worksheet.addRow([
        metodo.metodoPago,
        metodo.cantidad,
        Number(metodo.montoTotal),
        metodo.validados,
        metodo.pendientes,
        metodo.rechazados,
      ]);
    });

    // Total
    worksheet.addRow([]);
    worksheet.addRow([
      'TOTAL',
      datos.totalGeneral.cantidad,
      Number(datos.totalGeneral.montoTotal),
      '',
      '',
      '',
    ]);

    // Ajustar anchos
    worksheet.columns = [
      { width: 20 },
      { width: 12 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
    ];
  }

  /**
   * Generar hoja de Excel para pendientes de validación
   */
  private async generarHojaPendientes(workbook: ExcelJS.Workbook, datos: any) {
    const worksheet = workbook.addWorksheet('Pendientes de Validación');

    // Título
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'PAGOS PENDIENTES DE VALIDACIÓN';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.addRow([]);
    worksheet.addRow(['Total Pendientes:', datos.total]);
    worksheet.addRow(['Urgentes (>24h):', datos.urgentes]);

    worksheet.addRow([]);

    // Encabezados
    worksheet.addRow([
      'N° Orden',
      'DNI',
      'Estudiante',
      'Teléfono',
      'Email',
      'Método',
      'Monto',
      'Fecha Registro',
      'Horas Espera',
      'Prioridad',
    ]);

    const headerRow = worksheet.lastRow;
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    }

    // Datos
    datos.pagos.forEach((pago: any) => {
      const estudiante = pago.solicitud?.[0]?.estudiante;
      const nombreCompleto = estudiante
        ? `${estudiante.apellidopaterno} ${estudiante.apellidomaterno} ${estudiante.nombres}`
        : 'N/A';

      const row = worksheet.addRow([
        pago.numeroorden,
        estudiante?.dni || '',
        nombreCompleto,
        estudiante?.telefono || '',
        estudiante?.email || '',
        pago.metodopago,
        Number(pago.monto),
        pago.fecharegistro,
        pago.horasEspera,
        pago.prioridad,
      ]);

      // Colorear prioridad
      if (pago.prioridad === 'ALTA') {
        const prioridadCell = row.getCell(10);
        prioridadCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' },
        };
        prioridadCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      }
    });

    // Ajustar anchos
    worksheet.columns = [
      { width: 20 },
      { width: 12 },
      { width: 35 },
      { width: 15 },
      { width: 30 },
      { width: 12 },
      { width: 12 },
      { width: 18 },
      { width: 12 },
      { width: 12 },
    ];
  }

  /**
   * Generar hoja de Excel para no conciliados
   */
  private async generarHojaNoConsolidados(workbook: ExcelJS.Workbook, datos: any) {
    const worksheet = workbook.addWorksheet('No Conciliados');

    // Título
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'PAGOS VALIDADOS NO CONCILIADOS';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.addRow([]);
    worksheet.addRow(['Total No Conciliados:', datos.total]);
    worksheet.addRow(['Monto Total:', `S/ ${datos.montoTotal.toFixed(2)}`]);

    worksheet.addRow([]);

    // Encabezados
    worksheet.addRow([
      'N° Orden',
      'N° Operación',
      'N° Expediente',
      'Método',
      'Monto',
      'Fecha Pago',
      'Fecha Validación',
      'Observaciones',
    ]);

    const headerRow = worksheet.lastRow;
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    }

    // Datos
    datos.pagos.forEach((pago: any) => {
      worksheet.addRow([
        pago.numeroorden,
        pago.numerooperacion || '',
        pago.solicitud?.[0]?.numeroexpediente || '',
        pago.metodopago,
        Number(pago.monto),
        pago.fechapago,
        pago.fechaconciliacion,
        pago.observaciones || '',
      ]);
    });

    // Ajustar anchos
    worksheet.columns = [
      { width: 20 },
      { width: 20 },
      { width: 18 },
      { width: 12 },
      { width: 12 },
      { width: 15 },
      { width: 18 },
      { width: 40 },
    ];
  }
}

export const reporteService = new ReporteService();

