import { Prisma } from '@prisma/client';
import type { GenerarOrdenDTOType, RegistrarPagoEfectivoDTOType, SubirComprobanteDTOType, ValidarPagoManualDTOType, RechazarComprobanteDTOType, FiltrosPagoDTOType } from './dtos';
export declare class PagoService {
    private getInstitucionId;
    private generarNumeroOrden;
    generarOrden(data: GenerarOrdenDTOType, _usuarioId?: string): Promise<{
        id: string;
        institucion_id: string;
        metodopago: string | null;
        observaciones: string | null;
        estado: string | null;
        fecharegistro: Date | null;
        numeroorden: string;
        numerooperacion: string | null;
        monto: Prisma.Decimal;
        moneda: string | null;
        comision: Prisma.Decimal | null;
        montoneto: Prisma.Decimal | null;
        entidadbancaria: string | null;
        referenciapago: string | null;
        fechapago: Date;
        horapago: Date | null;
        numerorecibo: string | null;
        urlcomprobante: string | null;
        conciliado: boolean | null;
        fechaconciliacion: Date | null;
        usuarioconciliacion_id: string | null;
    }>;
    subirComprobante(pagoId: string, file: Express.Multer.File, data: SubirComprobanteDTOType): Promise<{
        id: string;
        institucion_id: string;
        metodopago: string | null;
        observaciones: string | null;
        estado: string | null;
        fecharegistro: Date | null;
        numeroorden: string;
        numerooperacion: string | null;
        monto: Prisma.Decimal;
        moneda: string | null;
        comision: Prisma.Decimal | null;
        montoneto: Prisma.Decimal | null;
        entidadbancaria: string | null;
        referenciapago: string | null;
        fechapago: Date;
        horapago: Date | null;
        numerorecibo: string | null;
        urlcomprobante: string | null;
        conciliado: boolean | null;
        fechaconciliacion: Date | null;
        usuarioconciliacion_id: string | null;
    }>;
    registrarPagoEfectivo(pagoId: string, data: RegistrarPagoEfectivoDTOType, usuarioId: string): Promise<{
        id: string;
        institucion_id: string;
        metodopago: string | null;
        observaciones: string | null;
        estado: string | null;
        fecharegistro: Date | null;
        numeroorden: string;
        numerooperacion: string | null;
        monto: Prisma.Decimal;
        moneda: string | null;
        comision: Prisma.Decimal | null;
        montoneto: Prisma.Decimal | null;
        entidadbancaria: string | null;
        referenciapago: string | null;
        fechapago: Date;
        horapago: Date | null;
        numerorecibo: string | null;
        urlcomprobante: string | null;
        conciliado: boolean | null;
        fechaconciliacion: Date | null;
        usuarioconciliacion_id: string | null;
    }>;
    validarManualmente(pagoId: string, data: ValidarPagoManualDTOType, usuarioId: string): Promise<{
        id: string;
        institucion_id: string;
        metodopago: string | null;
        observaciones: string | null;
        estado: string | null;
        fecharegistro: Date | null;
        numeroorden: string;
        numerooperacion: string | null;
        monto: Prisma.Decimal;
        moneda: string | null;
        comision: Prisma.Decimal | null;
        montoneto: Prisma.Decimal | null;
        entidadbancaria: string | null;
        referenciapago: string | null;
        fechapago: Date;
        horapago: Date | null;
        numerorecibo: string | null;
        urlcomprobante: string | null;
        conciliado: boolean | null;
        fechaconciliacion: Date | null;
        usuarioconciliacion_id: string | null;
    }>;
    rechazarComprobante(pagoId: string, data: RechazarComprobanteDTOType, _usuarioId: string): Promise<{
        id: string;
        institucion_id: string;
        metodopago: string | null;
        observaciones: string | null;
        estado: string | null;
        fecharegistro: Date | null;
        numeroorden: string;
        numerooperacion: string | null;
        monto: Prisma.Decimal;
        moneda: string | null;
        comision: Prisma.Decimal | null;
        montoneto: Prisma.Decimal | null;
        entidadbancaria: string | null;
        referenciapago: string | null;
        fechapago: Date;
        horapago: Date | null;
        numerorecibo: string | null;
        urlcomprobante: string | null;
        conciliado: boolean | null;
        fechaconciliacion: Date | null;
        usuarioconciliacion_id: string | null;
    }>;
    confirmarPagoAutomatico(_pagoId: string, _webhookData: any): Promise<void>;
    getPendientesValidacion(pagination: {
        page: number;
        limit: number;
    }): Promise<{
        data: ({
            solicitud: {
                id: string;
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
            monto: Prisma.Decimal;
            moneda: string | null;
            comision: Prisma.Decimal | null;
            montoneto: Prisma.Decimal | null;
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
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findAll(filtros: FiltrosPagoDTOType, pagination: {
        page: number;
        limit: number;
    }): Promise<{
        data: ({
            solicitud: {
                id: string;
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
            monto: Prisma.Decimal;
            moneda: string | null;
            comision: Prisma.Decimal | null;
            montoneto: Prisma.Decimal | null;
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
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<{
        solicitud: {
            id: string;
            estudiante: {
                email: string | null;
                id: string;
                dni: string;
                nombres: string;
                telefono: string | null;
                fechaactualizacion: Date | null;
                institucion_id: string;
                direccion: string | null;
                apellidopaterno: string;
                apellidomaterno: string;
                nombrecompleto: string | null;
                fechanacimiento: Date;
                lugarnacimiento: string | null;
                sexo: string | null;
                observaciones: string | null;
                estado: string | null;
                fecharegistro: Date | null;
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
        monto: Prisma.Decimal;
        moneda: string | null;
        comision: Prisma.Decimal | null;
        montoneto: Prisma.Decimal | null;
        entidadbancaria: string | null;
        referenciapago: string | null;
        fechapago: Date;
        horapago: Date | null;
        numerorecibo: string | null;
        urlcomprobante: string | null;
        conciliado: boolean | null;
        fechaconciliacion: Date | null;
        usuarioconciliacion_id: string | null;
    }>;
    marcarExpiradas(): Promise<number>;
}
export declare const pagoService: PagoService;
//# sourceMappingURL=pago.service.d.ts.map