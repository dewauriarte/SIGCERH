import { z } from 'zod';
import { EstadoSolicitud, ModalidadEntrega, Prioridad } from './types';
export declare const CreateSolicitudDTO: z.ZodObject<{
    estudianteId: z.ZodString;
    tipoSolicitudId: z.ZodString;
    modalidadEntrega: z.ZodNativeEnum<typeof ModalidadEntrega>;
    direccionEntrega: z.ZodOptional<z.ZodString>;
    colegioNombre: z.ZodString;
    colegioUbicacion: z.ZodOptional<z.ZodString>;
    anioLectivo: z.ZodNumber;
    gradoId: z.ZodString;
    celular: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    motivoSolicitud: z.ZodString;
    observaciones: z.ZodOptional<z.ZodString>;
    prioridad: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<typeof Prioridad>>>;
}, "strip", z.ZodTypeAny, {
    gradoId: string;
    estudianteId: string;
    prioridad: Prioridad;
    tipoSolicitudId: string;
    modalidadEntrega: ModalidadEntrega;
    colegioNombre: string;
    anioLectivo: number;
    celular: string;
    motivoSolicitud: string;
    email?: string | undefined;
    observaciones?: string | undefined;
    direccionEntrega?: string | undefined;
    colegioUbicacion?: string | undefined;
}, {
    gradoId: string;
    estudianteId: string;
    tipoSolicitudId: string;
    modalidadEntrega: ModalidadEntrega;
    colegioNombre: string;
    anioLectivo: number;
    celular: string;
    motivoSolicitud: string;
    email?: string | undefined;
    observaciones?: string | undefined;
    prioridad?: Prioridad | undefined;
    direccionEntrega?: string | undefined;
    colegioUbicacion?: string | undefined;
}>;
export type CreateSolicitudDTOType = z.infer<typeof CreateSolicitudDTO>;
export declare const DerivarEditorDTO: z.ZodObject<{
    editorId: z.ZodOptional<z.ZodString>;
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    observaciones?: string | undefined;
    editorId?: string | undefined;
}, {
    observaciones?: string | undefined;
    editorId?: string | undefined;
}>;
export type DerivarEditorDTOType = z.infer<typeof DerivarEditorDTO>;
export declare const ActaEncontradaDTO: z.ZodObject<{
    actaId: z.ZodString;
    ubicacionFisica: z.ZodString;
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    ubicacionFisica: string;
    actaId: string;
    observaciones?: string | undefined;
}, {
    ubicacionFisica: string;
    actaId: string;
    observaciones?: string | undefined;
}>;
export type ActaEncontradaDTOType = z.infer<typeof ActaEncontradaDTO>;
export declare const ActaNoEncontradaDTO: z.ZodObject<{
    motivoNoEncontrada: z.ZodString;
    observaciones: z.ZodString;
    sugerenciasUsuario: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    observaciones: string;
    motivoNoEncontrada: string;
    sugerenciasUsuario?: string | undefined;
}, {
    observaciones: string;
    motivoNoEncontrada: string;
    sugerenciasUsuario?: string | undefined;
}>;
export type ActaNoEncontradaDTOType = z.infer<typeof ActaNoEncontradaDTO>;
export declare const ValidarPagoDTO: z.ZodObject<{
    pagoId: z.ZodString;
    metodoPago: z.ZodOptional<z.ZodEnum<["YAPE", "PLIN", "TARJETA", "EFECTIVO", "AGENTE"]>>;
    comprobantePago: z.ZodOptional<z.ZodString>;
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    pagoId: string;
    observaciones?: string | undefined;
    metodoPago?: "YAPE" | "PLIN" | "TARJETA" | "EFECTIVO" | "AGENTE" | undefined;
    comprobantePago?: string | undefined;
}, {
    pagoId: string;
    observaciones?: string | undefined;
    metodoPago?: "YAPE" | "PLIN" | "TARJETA" | "EFECTIVO" | "AGENTE" | undefined;
    comprobantePago?: string | undefined;
}>;
export type ValidarPagoDTOType = z.infer<typeof ValidarPagoDTO>;
export declare const IniciarProcesamientoDTO: z.ZodObject<{
    actaId: z.ZodOptional<z.ZodString>;
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    observaciones?: string | undefined;
    actaId?: string | undefined;
}, {
    observaciones?: string | undefined;
    actaId?: string | undefined;
}>;
export type IniciarProcesamientoDTOType = z.infer<typeof IniciarProcesamientoDTO>;
export declare const AprobarUGELDTO: z.ZodObject<{
    observaciones: z.ZodOptional<z.ZodString>;
    validadoPor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    observaciones?: string | undefined;
    validadoPor?: string | undefined;
}, {
    observaciones?: string | undefined;
    validadoPor?: string | undefined;
}>;
export type AprobarUGELDTOType = z.infer<typeof AprobarUGELDTO>;
export declare const ObservarUGELDTO: z.ZodObject<{
    observaciones: z.ZodString;
    camposObservados: z.ZodArray<z.ZodString, "many">;
    requiereCorreccion: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    observaciones: string;
    camposObservados: string[];
    requiereCorreccion: boolean;
}, {
    observaciones: string;
    camposObservados: string[];
    requiereCorreccion?: boolean | undefined;
}>;
export type ObservarUGELDTOType = z.infer<typeof ObservarUGELDTO>;
export declare const CorregirObservacionDTO: z.ZodObject<{
    observaciones: z.ZodString;
    camposCorregidos: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    observaciones: string;
    camposCorregidos: string[];
}, {
    observaciones: string;
    camposCorregidos: string[];
}>;
export type CorregirObservacionDTOType = z.infer<typeof CorregirObservacionDTO>;
export declare const RegistrarSIAGECDTO: z.ZodObject<{
    codigoQR: z.ZodString;
    codigoVirtual: z.ZodString;
    urlVerificacion: z.ZodOptional<z.ZodString>;
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    codigoQR: string;
    codigoVirtual: string;
    observaciones?: string | undefined;
    urlVerificacion?: string | undefined;
}, {
    codigoQR: string;
    codigoVirtual: string;
    observaciones?: string | undefined;
    urlVerificacion?: string | undefined;
}>;
export type RegistrarSIAGECDTOType = z.infer<typeof RegistrarSIAGECDTO>;
export declare const FirmarCertificadoDTO: z.ZodObject<{
    tipoFirma: z.ZodEnum<["DIGITAL", "FISICA"]>;
    observaciones: z.ZodOptional<z.ZodString>;
    certificadoFirmadoUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tipoFirma: "DIGITAL" | "FISICA";
    observaciones?: string | undefined;
    certificadoFirmadoUrl?: string | undefined;
}, {
    tipoFirma: "DIGITAL" | "FISICA";
    observaciones?: string | undefined;
    certificadoFirmadoUrl?: string | undefined;
}>;
export type FirmarCertificadoDTOType = z.infer<typeof FirmarCertificadoDTO>;
export declare const MarcarEntregadoDTO: z.ZodObject<{
    tipoEntrega: z.ZodEnum<["DESCARGA", "FISICA"]>;
    firmaRecepcion: z.ZodOptional<z.ZodString>;
    dniReceptor: z.ZodOptional<z.ZodString>;
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tipoEntrega: "FISICA" | "DESCARGA";
    observaciones?: string | undefined;
    firmaRecepcion?: string | undefined;
    dniReceptor?: string | undefined;
}, {
    tipoEntrega: "FISICA" | "DESCARGA";
    observaciones?: string | undefined;
    firmaRecepcion?: string | undefined;
    dniReceptor?: string | undefined;
}>;
export type MarcarEntregadoDTOType = z.infer<typeof MarcarEntregadoDTO>;
export declare const FiltrosSolicitudDTO: z.ZodObject<{
    estado: z.ZodOptional<z.ZodNativeEnum<typeof EstadoSolicitud>>;
    estudianteId: z.ZodOptional<z.ZodString>;
    tipoSolicitudId: z.ZodOptional<z.ZodString>;
    fechaDesde: z.ZodOptional<z.ZodDate>;
    fechaHasta: z.ZodOptional<z.ZodDate>;
    prioridad: z.ZodOptional<z.ZodNativeEnum<typeof Prioridad>>;
    numeroExpediente: z.ZodOptional<z.ZodString>;
    numeroseguimiento: z.ZodOptional<z.ZodString>;
    asignadoAEditor: z.ZodOptional<z.ZodString>;
    pendientePago: z.ZodOptional<z.ZodBoolean>;
    conCertificado: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    fechaDesde?: Date | undefined;
    fechaHasta?: Date | undefined;
    estado?: EstadoSolicitud | undefined;
    estudianteId?: string | undefined;
    numeroseguimiento?: string | undefined;
    prioridad?: Prioridad | undefined;
    tipoSolicitudId?: string | undefined;
    numeroExpediente?: string | undefined;
    asignadoAEditor?: string | undefined;
    pendientePago?: boolean | undefined;
    conCertificado?: boolean | undefined;
}, {
    fechaDesde?: Date | undefined;
    fechaHasta?: Date | undefined;
    estado?: EstadoSolicitud | undefined;
    estudianteId?: string | undefined;
    numeroseguimiento?: string | undefined;
    prioridad?: Prioridad | undefined;
    tipoSolicitudId?: string | undefined;
    numeroExpediente?: string | undefined;
    asignadoAEditor?: string | undefined;
    pendientePago?: boolean | undefined;
    conCertificado?: boolean | undefined;
}>;
export type FiltrosSolicitudDTOType = z.infer<typeof FiltrosSolicitudDTO>;
export declare const SeguimientoPublicoDTO: z.ZodObject<{
    codigoSeguimiento: z.ZodString;
    dni: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    codigoSeguimiento: string;
    dni?: string | undefined;
}, {
    codigoSeguimiento: string;
    dni?: string | undefined;
}>;
export type SeguimientoPublicoDTOType = z.infer<typeof SeguimientoPublicoDTO>;
export declare const validate: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
export declare const validateQuery: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=dtos.d.ts.map