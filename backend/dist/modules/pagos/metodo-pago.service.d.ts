import type { CreateMetodoPagoDTOType, UpdateMetodoPagoDTOType } from './dtos';
export declare class MetodoPagoService {
    private getInstitucionId;
    findAll(): Promise<{
        id: string;
        activo: boolean | null;
        institucion_id: string;
        codigo: string;
        nombre: string;
        descripcion: string | null;
        configuracion: import("@prisma/client/runtime/library").JsonValue | null;
        tipo: string;
        requierevalidacion: boolean | null;
        comisionporcentaje: import("@prisma/client/runtime/library").Decimal | null;
        comisionfija: import("@prisma/client/runtime/library").Decimal | null;
    }[]>;
    findActivos(): Promise<{
        id: string;
        activo: boolean | null;
        institucion_id: string;
        codigo: string;
        nombre: string;
        descripcion: string | null;
        configuracion: import("@prisma/client/runtime/library").JsonValue | null;
        tipo: string;
        requierevalidacion: boolean | null;
        comisionporcentaje: import("@prisma/client/runtime/library").Decimal | null;
        comisionfija: import("@prisma/client/runtime/library").Decimal | null;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        activo: boolean | null;
        institucion_id: string;
        codigo: string;
        nombre: string;
        descripcion: string | null;
        configuracion: import("@prisma/client/runtime/library").JsonValue | null;
        tipo: string;
        requierevalidacion: boolean | null;
        comisionporcentaje: import("@prisma/client/runtime/library").Decimal | null;
        comisionfija: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    findByCodigo(codigo: string): Promise<{
        id: string;
        activo: boolean | null;
        institucion_id: string;
        codigo: string;
        nombre: string;
        descripcion: string | null;
        configuracion: import("@prisma/client/runtime/library").JsonValue | null;
        tipo: string;
        requierevalidacion: boolean | null;
        comisionporcentaje: import("@prisma/client/runtime/library").Decimal | null;
        comisionfija: import("@prisma/client/runtime/library").Decimal | null;
    } | null>;
    create(data: CreateMetodoPagoDTOType): Promise<{
        id: string;
        activo: boolean | null;
        institucion_id: string;
        codigo: string;
        nombre: string;
        descripcion: string | null;
        configuracion: import("@prisma/client/runtime/library").JsonValue | null;
        tipo: string;
        requierevalidacion: boolean | null;
        comisionporcentaje: import("@prisma/client/runtime/library").Decimal | null;
        comisionfija: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    update(id: string, data: UpdateMetodoPagoDTOType): Promise<{
        id: string;
        activo: boolean | null;
        institucion_id: string;
        codigo: string;
        nombre: string;
        descripcion: string | null;
        configuracion: import("@prisma/client/runtime/library").JsonValue | null;
        tipo: string;
        requierevalidacion: boolean | null;
        comisionporcentaje: import("@prisma/client/runtime/library").Decimal | null;
        comisionfija: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    toggleActivo(id: string): Promise<{
        id: string;
        activo: boolean | null;
        institucion_id: string;
        codigo: string;
        nombre: string;
        descripcion: string | null;
        configuracion: import("@prisma/client/runtime/library").JsonValue | null;
        tipo: string;
        requierevalidacion: boolean | null;
        comisionporcentaje: import("@prisma/client/runtime/library").Decimal | null;
        comisionfija: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        activo: boolean | null;
        institucion_id: string;
        codigo: string;
        nombre: string;
        descripcion: string | null;
        configuracion: import("@prisma/client/runtime/library").JsonValue | null;
        tipo: string;
        requierevalidacion: boolean | null;
        comisionporcentaje: import("@prisma/client/runtime/library").Decimal | null;
        comisionfija: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    seed(): Promise<void>;
}
export declare const metodoPagoService: MetodoPagoService;
//# sourceMappingURL=metodo-pago.service.d.ts.map