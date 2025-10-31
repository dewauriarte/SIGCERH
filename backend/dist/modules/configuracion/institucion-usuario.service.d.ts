export declare class InstitucionUsuarioService {
    listUsuariosInstitucion(): Promise<{
        id: string;
        fechaAsignacion: Date | null;
        usuario: {
            id: string;
            username: string;
            email: string;
            nombres: string | null;
            apellidos: string | null;
            dni: string | null;
            cargo: string | null;
            activo: boolean | null;
        };
    }[]>;
    asignarUsuario(usuarioId: string): Promise<{
        id: string;
        institucionId: string;
        usuarioId: string;
        fechaAsignacion: Date | null;
        activo: boolean | null;
    }>;
    removerUsuario(usuarioId: string): Promise<void>;
}
export declare const institucionUsuarioService: InstitucionUsuarioService;
//# sourceMappingURL=institucion-usuario.service.d.ts.map