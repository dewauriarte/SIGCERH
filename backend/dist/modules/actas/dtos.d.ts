import { z } from 'zod';
import { EstadoActa, TipoActa, Turno } from './types';
export declare const CreateActaFisicaDTO: z.ZodObject<{
    numero: z.ZodString;
    tipo: z.ZodNativeEnum<typeof TipoActa>;
    anioLectivoId: z.ZodString;
    gradoId: z.ZodString;
    seccion: z.ZodOptional<z.ZodString>;
    turno: z.ZodOptional<z.ZodNativeEnum<typeof Turno>>;
    fechaEmision: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
    libro: z.ZodOptional<z.ZodString>;
    folio: z.ZodOptional<z.ZodString>;
    tipoEvaluacion: z.ZodOptional<z.ZodString>;
    colegioOrigen: z.ZodOptional<z.ZodString>;
    ubicacionFisica: z.ZodOptional<z.ZodString>;
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    numero: string;
    gradoId: string;
    anioLectivoId: string;
    tipo: TipoActa;
    observaciones?: string | undefined;
    seccion?: string | undefined;
    turno?: Turno | undefined;
    fechaEmision?: Date | undefined;
    libro?: string | undefined;
    folio?: string | undefined;
    tipoEvaluacion?: string | undefined;
    colegioOrigen?: string | undefined;
    ubicacionFisica?: string | undefined;
}, {
    numero: string;
    gradoId: string;
    anioLectivoId: string;
    tipo: TipoActa;
    observaciones?: string | undefined;
    seccion?: string | undefined;
    turno?: Turno | undefined;
    fechaEmision?: string | Date | undefined;
    libro?: string | undefined;
    folio?: string | undefined;
    tipoEvaluacion?: string | undefined;
    colegioOrigen?: string | undefined;
    ubicacionFisica?: string | undefined;
}>;
export type CreateActaFisicaDTOType = z.infer<typeof CreateActaFisicaDTO>;
export declare const UpdateActaFisicaDTO: z.ZodObject<{
    numero: z.ZodOptional<z.ZodString>;
    tipo: z.ZodOptional<z.ZodNativeEnum<typeof TipoActa>>;
    seccion: z.ZodOptional<z.ZodString>;
    turno: z.ZodOptional<z.ZodNativeEnum<typeof Turno>>;
    fechaEmision: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
    libro: z.ZodOptional<z.ZodString>;
    folio: z.ZodOptional<z.ZodString>;
    tipoEvaluacion: z.ZodOptional<z.ZodString>;
    colegioOrigen: z.ZodOptional<z.ZodString>;
    ubicacionFisica: z.ZodOptional<z.ZodString>;
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    numero?: string | undefined;
    observaciones?: string | undefined;
    tipo?: TipoActa | undefined;
    seccion?: string | undefined;
    turno?: Turno | undefined;
    fechaEmision?: Date | undefined;
    libro?: string | undefined;
    folio?: string | undefined;
    tipoEvaluacion?: string | undefined;
    colegioOrigen?: string | undefined;
    ubicacionFisica?: string | undefined;
}, {
    numero?: string | undefined;
    observaciones?: string | undefined;
    tipo?: TipoActa | undefined;
    seccion?: string | undefined;
    turno?: Turno | undefined;
    fechaEmision?: string | Date | undefined;
    libro?: string | undefined;
    folio?: string | undefined;
    tipoEvaluacion?: string | undefined;
    colegioOrigen?: string | undefined;
    ubicacionFisica?: string | undefined;
}>;
export type UpdateActaFisicaDTOType = z.infer<typeof UpdateActaFisicaDTO>;
export declare const FiltrosActaDTO: z.ZodObject<{
    estado: z.ZodOptional<z.ZodNativeEnum<typeof EstadoActa>>;
    anioLectivoId: z.ZodOptional<z.ZodString>;
    gradoId: z.ZodOptional<z.ZodString>;
    procesado: z.ZodOptional<z.ZodBoolean>;
    fechaDesde: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
    fechaHasta: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, Date, string | Date>>;
    solicitudId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fechaDesde?: Date | undefined;
    fechaHasta?: Date | undefined;
    estado?: EstadoActa | undefined;
    gradoId?: string | undefined;
    anioLectivoId?: string | undefined;
    procesado?: boolean | undefined;
    solicitudId?: string | undefined;
}, {
    fechaDesde?: string | Date | undefined;
    fechaHasta?: string | Date | undefined;
    estado?: EstadoActa | undefined;
    gradoId?: string | undefined;
    anioLectivoId?: string | undefined;
    procesado?: boolean | undefined;
    solicitudId?: string | undefined;
}>;
export type FiltrosActaDTOType = z.infer<typeof FiltrosActaDTO>;
export declare const AsignarSolicitudDTO: z.ZodObject<{
    solicitudId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    solicitudId: string;
}, {
    solicitudId: string;
}>;
export type AsignarSolicitudDTOType = z.infer<typeof AsignarSolicitudDTO>;
export declare const CambiarEstadoActaDTO: z.ZodObject<{
    observaciones: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    observaciones?: string | undefined;
}, {
    observaciones?: string | undefined;
}>;
export type CambiarEstadoActaDTOType = z.infer<typeof CambiarEstadoActaDTO>;
export declare const ProcesarOCRDTO: z.ZodObject<{
    estudiantes: z.ZodArray<z.ZodObject<{
        numero: z.ZodNumber;
        dni: z.ZodOptional<z.ZodString>;
        apellidoPaterno: z.ZodString;
        apellidoMaterno: z.ZodString;
        nombres: z.ZodString;
        sexo: z.ZodEnum<["M", "F"]>;
        fechaNacimiento: z.ZodOptional<z.ZodString>;
        notas: z.ZodRecord<z.ZodString, z.ZodNumber>;
        situacionFinal: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        nombres: string;
        numero: number;
        sexo: "M" | "F";
        apellidoPaterno: string;
        apellidoMaterno: string;
        notas: Record<string, number>;
        dni?: string | undefined;
        fechaNacimiento?: string | undefined;
        situacionFinal?: string | undefined;
    }, {
        nombres: string;
        numero: number;
        sexo: "M" | "F";
        apellidoPaterno: string;
        apellidoMaterno: string;
        notas: Record<string, number>;
        dni?: string | undefined;
        fechaNacimiento?: string | undefined;
        situacionFinal?: string | undefined;
    }>, "many">;
    metadata: z.ZodOptional<z.ZodObject<{
        fechaProcesamiento: z.ZodOptional<z.ZodString>;
        algoritmo: z.ZodOptional<z.ZodString>;
        confianza: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        fechaProcesamiento?: string | undefined;
        algoritmo?: string | undefined;
        confianza?: number | undefined;
    }, {
        fechaProcesamiento?: string | undefined;
        algoritmo?: string | undefined;
        confianza?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    estudiantes: {
        nombres: string;
        numero: number;
        sexo: "M" | "F";
        apellidoPaterno: string;
        apellidoMaterno: string;
        notas: Record<string, number>;
        dni?: string | undefined;
        fechaNacimiento?: string | undefined;
        situacionFinal?: string | undefined;
    }[];
    metadata?: {
        fechaProcesamiento?: string | undefined;
        algoritmo?: string | undefined;
        confianza?: number | undefined;
    } | undefined;
}, {
    estudiantes: {
        nombres: string;
        numero: number;
        sexo: "M" | "F";
        apellidoPaterno: string;
        apellidoMaterno: string;
        notas: Record<string, number>;
        dni?: string | undefined;
        fechaNacimiento?: string | undefined;
        situacionFinal?: string | undefined;
    }[];
    metadata?: {
        fechaProcesamiento?: string | undefined;
        algoritmo?: string | undefined;
        confianza?: number | undefined;
    } | undefined;
}>;
export type ProcesarOCRDTOType = z.infer<typeof ProcesarOCRDTO>;
export declare const ValidacionManualDTO: z.ZodObject<{
    observaciones: z.ZodString;
    validado: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    observaciones: string;
    validado: boolean;
}, {
    observaciones: string;
    validado: boolean;
}>;
export type ValidacionManualDTOType = z.infer<typeof ValidacionManualDTO>;
export declare const ValidacionConCorreccionesDTO: z.ZodObject<{
    validado: z.ZodBoolean;
    observaciones: z.ZodString;
    correcciones: z.ZodOptional<z.ZodArray<z.ZodObject<{
        estudianteId: z.ZodString;
        campo: z.ZodString;
        valorAnterior: z.ZodString;
        valorNuevo: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        estudianteId: string;
        campo: string;
        valorAnterior: string;
        valorNuevo: string;
    }, {
        estudianteId: string;
        campo: string;
        valorAnterior: string;
        valorNuevo: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    observaciones: string;
    validado: boolean;
    correcciones?: {
        estudianteId: string;
        campo: string;
        valorAnterior: string;
        valorNuevo: string;
    }[] | undefined;
}, {
    observaciones: string;
    validado: boolean;
    correcciones?: {
        estudianteId: string;
        campo: string;
        valorAnterior: string;
        valorNuevo: string;
    }[] | undefined;
}>;
export type ValidacionConCorreccionesDTOType = z.infer<typeof ValidacionConCorreccionesDTO>;
export declare const validate: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=dtos.d.ts.map