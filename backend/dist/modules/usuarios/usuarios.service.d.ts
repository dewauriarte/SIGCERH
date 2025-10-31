import { AuthUser } from '@modules/auth/types';
export interface CreateUsuarioData {
    username: string;
    email: string;
    password: string;
    dni?: string;
    nombres?: string;
    apellidos?: string;
    telefono?: string;
    cargo?: string;
    rolesIds?: string[];
    activo?: boolean;
}
export interface UpdateUsuarioData {
    username?: string;
    email?: string;
    password?: string;
    dni?: string;
    nombres?: string;
    apellidos?: string;
    telefono?: string;
    cargo?: string;
    activo?: boolean;
    bloqueado?: boolean;
}
export interface ListUsuariosOptions {
    page?: number;
    limit?: number;
    search?: string;
    activo?: boolean;
    rol?: string;
}
export declare class UsuariosService {
    list(options?: ListUsuariosOptions): Promise<{
        items: {
            id: string;
            username: string;
            email: string;
            dni: string | null;
            nombres: string | null;
            apellidos: string | null;
            telefono: string | null;
            cargo: string | null;
            activo: boolean | null;
            bloqueado: boolean | null;
            ultimoAcceso: Date | null;
            fechaCreacion: Date | null;
            roles: {
                id: string;
                codigo: string;
                nombre: string;
                nivel: number;
            }[];
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getById(id: string): Promise<AuthUser | null>;
    create(data: CreateUsuarioData): Promise<AuthUser>;
    update(id: string, data: UpdateUsuarioData): Promise<AuthUser>;
    delete(id: string): Promise<void>;
    asignarRoles(userId: string, rolesIds: string[]): Promise<AuthUser>;
    private buildAuthUser;
}
export declare const usuariosService: UsuariosService;
//# sourceMappingURL=usuarios.service.d.ts.map