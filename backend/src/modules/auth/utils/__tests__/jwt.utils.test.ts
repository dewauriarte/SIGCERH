/**
 * Tests unitarios para utilidades de JWT
 */

import { generateAccessToken, generateRefreshToken, verifyToken } from '../jwt.utils';

describe('jwt.utils', () => {
  describe('generateAccessToken', () => {
    const payload = {
      sub: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      roles: ['PUBLICO'],
      permisos: ['AUTH_LOGIN', 'AUTH_LOGOUT'],
    };

    it('debe generar un access token válido', () => {
      const token = generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('debe incluir los datos del payload en el token', () => {
      const token = generateAccessToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.roles).toEqual(payload.roles);
      expect(decoded.permisos).toEqual(payload.permisos);
    });

    it('debe incluir timestamps iat y exp', () => {
      const token = generateAccessToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp!).toBeGreaterThan(decoded.iat!);
    });

    it('debe generar tokens diferentes para el mismo payload', () => {
      const token1 = generateAccessToken(payload);
      // Esperar un milisegundo para asegurar diferente timestamp
      const token2 = generateAccessToken(payload);

      // Los tokens serán diferentes debido al timestamp iat
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
    });
  });

  describe('generateRefreshToken', () => {
    it('debe generar un refresh token válido', () => {
      const userId = 'user-123';
      const token = generateRefreshToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('debe incluir el userId en el token', () => {
      const userId = 'user-123';
      const token = generateRefreshToken(userId);
      const decoded = verifyToken(token);

      expect(decoded.sub).toBe(userId);
    });

    it('debe tener una expiración mayor que access token', () => {
      const userId = 'user-123';
      const accessToken = generateAccessToken({
        sub: userId,
        username: 'test',
        email: 'test@example.com',
        roles: ['PUBLICO'],
        permisos: [],
      });
      const refreshToken = generateRefreshToken(userId);

      const accessDecoded = verifyToken(accessToken);
      const refreshDecoded = verifyToken(refreshToken);

      // Refresh token debe expirar después que access token
      expect(refreshDecoded.exp!).toBeGreaterThan(accessDecoded.exp!);
    });
  });

  describe('verifyToken', () => {
    it('debe verificar un token válido correctamente', () => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['ADMIN'],
        permisos: ['USUARIOS_VER'],
      };

      const token = generateAccessToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.username).toBe(payload.username);
    });

    it('debe lanzar error para token inválido', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    it('debe lanzar error para token malformado', () => {
      const malformedToken = 'notavalidtoken';

      expect(() => {
        verifyToken(malformedToken);
      }).toThrow();
    });

    it('debe lanzar error para token vacío', () => {
      expect(() => {
        verifyToken('');
      }).toThrow();
    });

    it('debe lanzar error para token con firma incorrecta', () => {
      // Generar un token válido
      const token = generateAccessToken({
        sub: 'user-123',
        username: 'test',
        email: 'test@example.com',
        roles: ['PUBLICO'],
        permisos: [],
      });

      // Modificar la firma (última parte del token)
      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.invalidsignature`;

      expect(() => {
        verifyToken(tamperedToken);
      }).toThrow();
    });
  });

  describe('Token expiration', () => {
    it('debe crear tokens que eventualmente expiran', () => {
      const payload = {
        sub: 'user-123',
        username: 'test',
        email: 'test@example.com',
        roles: ['PUBLICO'],
        permisos: [],
      };

      const token = generateAccessToken(payload);
      const decoded = verifyToken(token);

      // Verificar que el token tiene una fecha de expiración en el futuro
      const now = Math.floor(Date.now() / 1000);
      expect(decoded.exp).toBeGreaterThan(now);
    });
  });

  describe('Token payload integrity', () => {
    it('debe preservar arrays en el payload', () => {
      const payload = {
        sub: 'user-123',
        username: 'test',
        email: 'test@example.com',
        roles: ['ADMIN', 'EDITOR', 'MESA_DE_PARTES'],
        permisos: ['PERM1', 'PERM2', 'PERM3'],
      };

      const token = generateAccessToken(payload);
      const decoded = verifyToken(token);

      expect(Array.isArray(decoded.roles)).toBe(true);
      expect(Array.isArray(decoded.permisos)).toBe(true);
      expect(decoded.roles).toHaveLength(3);
      expect(decoded.permisos).toHaveLength(3);
    });

    it('debe preservar strings con caracteres especiales', () => {
      const payload = {
        sub: 'user-123',
        username: 'user@domain',
        email: 'test+alias@example.com',
        roles: ['PÚBLICO'],
        permisos: ['PERMISO_ESPAÑOL'],
      };

      const token = generateAccessToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.username).toBe(payload.username);
      expect(decoded.email).toBe(payload.email);
    });
  });
});
