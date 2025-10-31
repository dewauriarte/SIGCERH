import ExcelJS from 'exceljs';
import { EstadoPago } from './types';
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
export declare class ReporteService {
    reportePorPeriodo(fechaDesde: Date, fechaHasta: Date): Promise<{
        periodo: {
            desde: Date;
            hasta: Date;
        };
        estadisticas: EstadisticasPago;
        pagos: ({
            solicitud: {
                estudiante: {
                    dni: string;
                    nombres: string;
                    apellidopaterno: string;
                    apellidomaterno: string;
                };
                numeroexpediente: string | null;
                numeroseguimiento: string | null;
            }[];
        } & {
            id: string;
            institucion_id: string;
            metodopago: string | null;
            observaciones: string | null;
            estado: string | null;
            fecharegistro: Date | null;
            numeroorden: string;
            numerooperacion: string | null;
            monto: import("@prisma/client/runtime/library").Decimal;
            moneda: string | null;
            comision: import("@prisma/client/runtime/library").Decimal | null;
            montoneto: import("@prisma/client/runtime/library").Decimal | null;
            entidadbancaria: string | null;
            referenciapago: string | null;
            fechapago: Date;
            horapago: Date | null;
            numerorecibo: string | null;
            urlcomprobante: string | null;
            conciliado: boolean | null;
            fechaconciliacion: Date | null;
            usuarioconciliacion_id: string | null;
        })[];
    }>;
    reportePorMetodoPago(filtros?: FiltrosReporte): Promise<{
        resumen: unknown[];
        totalGeneral: {
            cantidad: number;
            montoTotal: number;
        };
    }>;
    reportePendientesValidacion(): Promise<{
        total: number;
        urgentes: number;
        pagos: {
            horasEspera: number;
            prioridad: string;
            solicitud: {
                estudiante: {
                    email: string | null;
                    dni: string;
                    nombres: string;
                    telefono: string | null;
                    apellidopaterno: string;
                    apellidomaterno: string;
                };
                numeroexpediente: string | null;
                numeroseguimiento: string | null;
            }[];
            id: string;
            institucion_id: string;
            metodopago: string | null;
            observaciones: string | null;
            estado: string | null;
            fecharegistro: Date | null;
            numeroorden: string;
            numerooperacion: string | null;
            monto: import("@prisma/client/runtime/library").Decimal;
            moneda: string | null;
            comision: import("@prisma/client/runtime/library").Decimal | null;
            montoneto: import("@prisma/client/runtime/library").Decimal | null;
            entidadbancaria: string | null;
            referenciapago: string | null;
            fechapago: Date;
            horapago: Date | null;
            numerorecibo: string | null;
            urlcomprobante: string | null;
            conciliado: boolean | null;
            fechaconciliacion: Date | null;
            usuarioconciliacion_id: string | null;
        }[];
    }>;
    reporteNoConciliados(filtros?: FiltrosReporte): Promise<{
        total: number;
        montoTotal: number;
        pagos: ({
            solicitud: {
                numeroexpediente: string | null;
                numeroseguimiento: string | null;
            }[];
        } & {
            id: string;
            institucion_id: string;
            metodopago: string | null;
            observaciones: string | null;
            estado: string | null;
            fecharegistro: Date | null;
            numeroorden: string;
            numerooperacion: string | null;
            monto: import("@prisma/client/runtime/library").Decimal;
            moneda: string | null;
            comision: import("@prisma/client/runtime/library").Decimal | null;
            montoneto: import("@prisma/client/runtime/library").Decimal | null;
            entidadbancaria: string | null;
            referenciapago: string | null;
            fechapago: Date;
            horapago: Date | null;
            numerorecibo: string | null;
            urlcomprobante: string | null;
            conciliado: boolean | null;
            fechaconciliacion: Date | null;
            usuarioconciliacion_id: string | null;
        })[];
    }>;
    exportarExcel(tipo: 'periodo' | 'metodo' | 'pendientes' | 'noconciliados', filtros: any): Promise<ExcelJS.Workbook>;
    private generarHojaPorPeriodo;
    private generarHojaPorMetodo;
    private generarHojaPendientes;
    private generarHojaNoConsolidados;
}
export declare const reporteService: ReporteService;
export {};
//# sourceMappingURL=reporte.service.d.ts.map