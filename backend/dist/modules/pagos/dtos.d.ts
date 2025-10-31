import { z } from 'zod';
import { EstadoPago, TipoMetodoPago } from './types';
export declare function validate(schema: z.ZodSchema): (req: any, _res: any, next: any) => void;
export declare function validateQuery(schema: z.ZodSchema): (req: any, _res: any, next: any) => void;
export declare const CreateMetodoPagoDTO: z.ZodObject<{
    codigo: z.ZodString;
    nombre: z.ZodString;
    tipo: z.ZodNativeEnum<typeof TipoMetodoPago>;
    descripcion: z.ZodOptional<z.ZodString>;
    requierevalidacion: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    comisionporcentaje: z.ZodOptional<z.ZodNumber>;
    comisionfija: z.ZodOptional<z.ZodNumber>;
    activo: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    configuracion: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    activo: boolean;
    codigo: string;
    nombre: string;
    tipo: TipoMetodoPago;
    requierevalidacion: boolean;
    descripcion?: string | undefined;
    configuracion?: any;
    comisionporcentaje?: number | undefined;
    comisionfija?: number | undefined;
}, {
    codigo: string;
    nombre: string;
    tipo: TipoMetodoPago;
    activo?: boolean | undefined;
    descripcion?: string | undefined;
    configuracion?: any;
    requierevalidacion?: boolean | undefined;
    comisionporcentaje?: number | undefined;
    comisionfija?: number | undefined;
}>;
export declare const UpdateMetodoPagoDTO: z.ZodObject<{
    nombre: z.ZodOptional<z.ZodString>;
    descripcion: z.ZodOptional<z.ZodString>;
    requierevalidacion: z.ZodOptional<z.ZodBoolean>;
    comisionporcentaje: z.ZodOptional<z.ZodNumber>;
    comisionfija: z.ZodOptional<z.ZodNumber>;
    activo: z.ZodOptional<z.ZodBoolean>;
    configuracion: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    activo?: boolean | undefined;
    nombre?: string | undefined;
    descripcion?: string | undefined;
    configuracion?: any;
    requierevalidacion?: boolean | undefined;
    comisionporcentaje?: number | undefined;
    comisionfija?: number | undefined;
}, {
    activo?: boolean | undefined;
    nombre?: string | undefined;
    descripcion?: string | undefined;
    configuracion?: any;
    requierevalidacion?: boolean | undefined;
    comisionporcentaje?: number | undefined;
    comisionfija?: number | undefined;
}>;
export declare const GenerarOrdenDTO: z.ZodObject<{
    solicitudId: z.ZodString;
    metodopago: z.ZodString;
    monto: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    metodopago: string;
    solicitudId: string;
    monto?: number | undefined;
}, {
    metodopago: string;
    solicitudId: string;
    monto?: number | undefined;
}>;
export declare const RegistrarPagoEfectivoDTO: z.ZodObject<{
    numeroRecibo: z.ZodString;
    montoPagado: z.ZodNumber;
    numerooperacion: z.ZodOptional<z.ZodString>;
    entidadbancaria: z.ZodOptional<z.ZodString>;
    fechaPago: z.ZodOptional<z.ZodDate>;
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    numeroRecibo: string;
    montoPagado: number;
    observaciones?: string | undefined;
    numerooperacion?: string | undefined;
    entidadbancaria?: string | undefined;
    fechaPago?: Date | undefined;
}, {
    numeroRecibo: string;
    montoPagado: number;
    observaciones?: string | undefined;
    numerooperacion?: string | undefined;
    entidadbancaria?: string | undefined;
    fechaPago?: Date | undefined;
}>;
export declare const SubirComprobanteDTO: z.ZodObject<{
    numerooperacion: z.ZodOptional<z.ZodString>;
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    observaciones?: string | undefined;
    numerooperacion?: string | undefined;
}, {
    observaciones?: string | undefined;
    numerooperacion?: string | undefined;
}>;
export declare const ValidarPagoManualDTO: z.ZodObject<{
    numerooperacion: z.ZodString;
    montoPagado: z.ZodNumber;
    entidadbancaria: z.ZodOptional<z.ZodString>;
    fechaPago: z.ZodOptional<z.ZodDate>;
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    numerooperacion: string;
    montoPagado: number;
    observaciones?: string | undefined;
    entidadbancaria?: string | undefined;
    fechaPago?: Date | undefined;
}, {
    numerooperacion: string;
    montoPagado: number;
    observaciones?: string | undefined;
    entidadbancaria?: string | undefined;
    fechaPago?: Date | undefined;
}>;
export declare const RechazarComprobanteDTO: z.ZodObject<{
    motivo: z.ZodString;
    sugerencias: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    motivo: string;
    sugerencias?: string | undefined;
}, {
    motivo: string;
    sugerencias?: string | undefined;
}>;
export declare const ConfirmarPagoAutomaticoDTO: z.ZodObject<{
    pagoId: z.ZodString;
    transactionId: z.ZodString;
    montoPagado: z.ZodNumber;
    numerooperacion: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    pagoId: string;
    transactionId: string;
    montoPagado: number;
    numerooperacion?: string | undefined;
}, {
    pagoId: string;
    transactionId: string;
    montoPagado: number;
    numerooperacion?: string | undefined;
}>;
export declare const FiltrosPagoDTO: z.ZodObject<{
    estado: z.ZodOptional<z.ZodNativeEnum<typeof EstadoPago>>;
    metodopago: z.ZodOptional<z.ZodString>;
    numeroorden: z.ZodOptional<z.ZodString>;
    numerooperacion: z.ZodOptional<z.ZodString>;
    fechaDesde: z.ZodOptional<z.ZodDate>;
    fechaHasta: z.ZodOptional<z.ZodDate>;
    conciliado: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    fechaDesde?: Date | undefined;
    fechaHasta?: Date | undefined;
    metodopago?: string | undefined;
    estado?: EstadoPago | undefined;
    numeroorden?: string | undefined;
    numerooperacion?: string | undefined;
    conciliado?: boolean | undefined;
}, {
    fechaDesde?: Date | undefined;
    fechaHasta?: Date | undefined;
    metodopago?: string | undefined;
    estado?: EstadoPago | undefined;
    numeroorden?: string | undefined;
    numerooperacion?: string | undefined;
    conciliado?: boolean | undefined;
}>;
export declare const WebhookPagoDTO: z.ZodObject<{
    evento: z.ZodString;
    transactionId: z.ZodOptional<z.ZodString>;
    numeroOrden: z.ZodOptional<z.ZodString>;
    monto: z.ZodOptional<z.ZodNumber>;
    estado: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    evento: z.ZodString;
    transactionId: z.ZodOptional<z.ZodString>;
    numeroOrden: z.ZodOptional<z.ZodString>;
    monto: z.ZodOptional<z.ZodNumber>;
    estado: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    evento: z.ZodString;
    transactionId: z.ZodOptional<z.ZodString>;
    numeroOrden: z.ZodOptional<z.ZodString>;
    monto: z.ZodOptional<z.ZodNumber>;
    estado: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export type CreateMetodoPagoDTOType = z.infer<typeof CreateMetodoPagoDTO>;
export type UpdateMetodoPagoDTOType = z.infer<typeof UpdateMetodoPagoDTO>;
export type GenerarOrdenDTOType = z.infer<typeof GenerarOrdenDTO>;
export type RegistrarPagoEfectivoDTOType = z.infer<typeof RegistrarPagoEfectivoDTO>;
export type SubirComprobanteDTOType = z.infer<typeof SubirComprobanteDTO>;
export type ValidarPagoManualDTOType = z.infer<typeof ValidarPagoManualDTO>;
export type RechazarComprobanteDTOType = z.infer<typeof RechazarComprobanteDTO>;
export type FiltrosPagoDTOType = z.infer<typeof FiltrosPagoDTO>;
export type WebhookPagoDTOType = z.infer<typeof WebhookPagoDTO>;
//# sourceMappingURL=dtos.d.ts.map