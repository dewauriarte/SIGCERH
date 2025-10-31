import { AuthUser, LoginResponse, RefreshTokenResponse, RegisterData, LoginData } from './types';
export declare class AuthService {
    register(data: RegisterData): Promise<LoginResponse>;
    login(data: LoginData, ip?: string, userAgent?: string): Promise<LoginResponse>;
    refresh(refreshToken: string): Promise<RefreshTokenResponse>;
    logout(refreshToken: string): Promise<void>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(_token: string, _newPassword: string): Promise<{
        message: string;
    }>;
    getUserById(userId: string): Promise<AuthUser | null>;
    private buildAuthUser;
    private getPublicoRoleId;
    private calcularExpiracion;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map