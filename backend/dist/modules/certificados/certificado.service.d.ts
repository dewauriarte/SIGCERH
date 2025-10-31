import { DatosCertificado } from './types';
import type { AnularCertificadoDTOType, RectificarCertificadoDTOType, FiltrosCertificadoDTOType } from './dtos';
export declare class CertificadoService {
    private generarCodigoVirtual;
    consolidarNotas(certificadoId: string): Promise<DatosCertificado>;
    calcularPromedioGeneral(certificadoId: string): Promise<number>;
    findById(id: string): Promise<{
        configuracioninstitucion: {
            id: string;
            nombre: string;
            codigomodular: string;
            ugel: string;
            provincia: string | null;
            direccion: string | null;
            logo_url: string | null;
        };
        estudiante: {
            id: string;
            dni: string;
            nombres: string;
            apellidopaterno: string;
            apellidomaterno: string;
            fechanacimiento: Date;
            lugarnacimiento: string | null;
            sexo: string | null;
        };
        certificadodetalle: ({
            aniolectivo: {
                id: string;
                activo: boolean | null;
                fechainicio: Date;
                institucion_id: string;
                anio: number;
                observaciones: string | null;
                fechafin: Date;
            };
            grado: {
                niveleducativo: {
                    id: string;
                    activo: boolean | null;
                    institucion_id: string;
                    codigo: string;
                    nombre: string;
                    descripcion: string | null;
                    orden: number;
                } | null;
            } & {
                id: string;
                activo: boolean | null;
                institucion_id: string;
                nombre: string;
                numero: number;
                orden: number;
                nivel_id: string | null;
                nombrecorto: string | null;
            };
            certificadonota: ({
                areacurricular: {
                    id: string;
                    activo: boolean | null;
                    institucion_id: string | null;
                    codigo: string;
                    nombre: string;
                    orden: number;
                    escompetenciatransversal: boolean | null;
                };
            } & {
                id: string;
                orden: number;
                area_id: string;
                nota: number | null;
                notaliteral: string | null;
                esexonerado: boolean | null;
                certificadodetalle_id: string;
            })[];
        } & {
            id: string;
            orden: number;
            observaciones: string | null;
            grado_id: string;
            aniolectivo_id: string;
            certificado_id: string;
            situacionfinal: string | null;
        })[];
        usuario_certificado_usuarioanulacion_idTousuario: {
            id: string;
            nombres: string | null;
            apellidos: string | null;
        } | null;
        usuario_certificado_usuarioemision_idTousuario: {
            id: string;
            nombres: string | null;
            apellidos: string | null;
            cargo: string | null;
        } | null;
    } & {
        id: string;
        fechacreacion: Date | null;
        institucion_id: string;
        numero: string | null;
        estado: string | null;
        fechaemision: Date;
        estudiante_id: string;
        codigovirtual: string;
        horaemision: Date;
        lugaremision: string | null;
        gradoscompletados: string[];
        situacionfinal: string | null;
        promediogeneral: import("@prisma/client/runtime/library").Decimal | null;
        urlpdf: string | null;
        hashpdf: string | null;
        urlqr: string | null;
        observacionretiros: string | null;
        observaciontraslados: string | null;
        observacionsiagie: string | null;
        observacionpruebasubicacion: string | null;
        observacionconvalidacion: string | null;
        observacionotros: string | null;
        ordenmerito: number | null;
        version: number | null;
        esrectificacion: boolean | null;
        motivorectificacion: string | null;
        fechaanulacion: Date | null;
        motivoanulacion: string | null;
        certificadoanterior_id: string | null;
        usuarioemision_id: string | null;
        usuarioanulacion_id: string | null;
    }>;
    findByCodigoVirtual(codigoVirtual: string): Promise<({
        configuracioninstitucion: {
            nombre: string;
            ugel: string;
        };
        estudiante: {
            dni: string;
            nombres: string;
            apellidopaterno: string;
            apellidomaterno: string;
            fechanacimiento: Date;
        };
        certificadodetalle: ({
            aniolectivo: {
                id: string;
                activo: boolean | null;
                fechainicio: Date;
                institucion_id: string;
                anio: number;
                observaciones: string | null;
                fechafin: Date;
            };
            grado: {
                id: string;
                activo: boolean | null;
                institucion_id: string;
                nombre: string;
                numero: number;
                orden: number;
                nivel_id: string | null;
                nombrecorto: string | null;
            };
        } & {
            id: string;
            orden: number;
            observaciones: string | null;
            grado_id: string;
            aniolectivo_id: string;
            certificado_id: string;
            situacionfinal: string | null;
        })[];
    } & {
        id: string;
        fechacreacion: Date | null;
        institucion_id: string;
        numero: string | null;
        estado: string | null;
        fechaemision: Date;
        estudiante_id: string;
        codigovirtual: string;
        horaemision: Date;
        lugaremision: string | null;
        gradoscompletados: string[];
        situacionfinal: string | null;
        promediogeneral: import("@prisma/client/runtime/library").Decimal | null;
        urlpdf: string | null;
        hashpdf: string | null;
        urlqr: string | null;
        observacionretiros: string | null;
        observaciontraslados: string | null;
        observacionsiagie: string | null;
        observacionpruebasubicacion: string | null;
        observacionconvalidacion: string | null;
        observacionotros: string | null;
        ordenmerito: number | null;
        version: number | null;
        esrectificacion: boolean | null;
        motivorectificacion: string | null;
        fechaanulacion: Date | null;
        motivoanulacion: string | null;
        certificadoanterior_id: string | null;
        usuarioemision_id: string | null;
        usuarioanulacion_id: string | null;
    }) | null>;
    findAll(filtros: FiltrosCertificadoDTOType, pagination: {
        page: number;
        limit: number;
    }): Promise<{
        data: ({
            estudiante: {
                dni: string;
                nombres: string;
                apellidopaterno: string;
                apellidomaterno: string;
            };
        } & {
            id: string;
            fechacreacion: Date | null;
            institucion_id: string;
            numero: string | null;
            estado: string | null;
            fechaemision: Date;
            estudiante_id: string;
            codigovirtual: string;
            horaemision: Date;
            lugaremision: string | null;
            gradoscompletados: string[];
            situacionfinal: string | null;
            promediogeneral: import("@prisma/client/runtime/library").Decimal | null;
            urlpdf: string | null;
            hashpdf: string | null;
            urlqr: string | null;
            observacionretiros: string | null;
            observaciontraslados: string | null;
            observacionsiagie: string | null;
            observacionpruebasubicacion: string | null;
            observacionconvalidacion: string | null;
            observacionotros: string | null;
            ordenmerito: number | null;
            version: number | null;
            esrectificacion: boolean | null;
            motivorectificacion: string | null;
            fechaanulacion: Date | null;
            motivoanulacion: string | null;
            certificadoanterior_id: string | null;
            usuarioemision_id: string | null;
            usuarioanulacion_id: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    anular(id: string, data: AnularCertificadoDTOType, usuarioId: string): Promise<{
        id: string;
        fechacreacion: Date | null;
        institucion_id: string;
        numero: string | null;
        estado: string | null;
        fechaemision: Date;
        estudiante_id: string;
        codigovirtual: string;
        horaemision: Date;
        lugaremision: string | null;
        gradoscompletados: string[];
        situacionfinal: string | null;
        promediogeneral: import("@prisma/client/runtime/library").Decimal | null;
        urlpdf: string | null;
        hashpdf: string | null;
        urlqr: string | null;
        observacionretiros: string | null;
        observaciontraslados: string | null;
        observacionsiagie: string | null;
        observacionpruebasubicacion: string | null;
        observacionconvalidacion: string | null;
        observacionotros: string | null;
        ordenmerito: number | null;
        version: number | null;
        esrectificacion: boolean | null;
        motivorectificacion: string | null;
        fechaanulacion: Date | null;
        motivoanulacion: string | null;
        certificadoanterior_id: string | null;
        usuarioemision_id: string | null;
        usuarioanulacion_id: string | null;
    }>;
    rectificar(id: string, data: RectificarCertificadoDTOType, usuarioId: string): Promise<{
        id: string;
        fechacreacion: Date | null;
        institucion_id: string;
        numero: string | null;
        estado: string | null;
        fechaemision: Date;
        estudiante_id: string;
        codigovirtual: string;
        horaemision: Date;
        lugaremision: string | null;
        gradoscompletados: string[];
        situacionfinal: string | null;
        promediogeneral: import("@prisma/client/runtime/library").Decimal | null;
        urlpdf: string | null;
        hashpdf: string | null;
        urlqr: string | null;
        observacionretiros: string | null;
        observaciontraslados: string | null;
        observacionsiagie: string | null;
        observacionpruebasubicacion: string | null;
        observacionconvalidacion: string | null;
        observacionotros: string | null;
        ordenmerito: number | null;
        version: number | null;
        esrectificacion: boolean | null;
        motivorectificacion: string | null;
        fechaanulacion: Date | null;
        motivoanulacion: string | null;
        certificadoanterior_id: string | null;
        usuarioemision_id: string | null;
        usuarioanulacion_id: string | null;
    }>;
}
export declare const certificadoService: CertificadoService;
//# sourceMappingURL=certificado.service.d.ts.map