import { JwtPayload } from '../types';
export declare const generateAccessToken: (payload: Omit<JwtPayload, "iat" | "exp">) => string;
export declare const generateRefreshToken: (userId: string) => string;
export declare const verifyToken: (token: string) => JwtPayload;
export declare const decodeToken: (token: string) => JwtPayload | null;
export declare const getTokenExpiration: (token: string) => Date | null;
export declare const isTokenExpired: (token: string) => boolean;
//# sourceMappingURL=jwt.utils.d.ts.map