import jwt from 'jsonwebtoken';
import { config } from '@config/env';
export const generateAccessToken = (payload) => {
    return jwt.sign(payload, config.security.jwt.secret, {
        expiresIn: config.security.jwt.expiresIn,
        issuer: 'sigcerh-backend',
        audience: 'sigcerh-frontend',
    });
};
export const generateRefreshToken = (userId) => {
    return jwt.sign({ sub: userId, type: 'refresh' }, config.security.jwt.secret, {
        expiresIn: config.security.jwt.refreshExpiresIn,
        issuer: 'sigcerh-backend',
        audience: 'sigcerh-frontend',
    });
};
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, config.security.jwt.secret, {
            issuer: 'sigcerh-backend',
            audience: 'sigcerh-frontend',
        });
        return decoded;
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Token expirado');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Token inválido');
        }
        throw new Error('Error al verificar token');
    }
};
export const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    }
    catch {
        return null;
    }
};
export const getTokenExpiration = (token) => {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp)
        return null;
    return new Date(decoded.exp * 1000);
};
export const isTokenExpired = (token) => {
    const expiration = getTokenExpiration(token);
    if (!expiration)
        return true;
    return expiration < new Date();
};
//# sourceMappingURL=jwt.utils.js.map